import { env, isOpenAiConfigured } from '../config/env.js';
import { getDb } from '../db/index.js';
import { SEED_COLLEGE_PROFILE } from '../db/seedData.js';
import { retrieveRelevantContext } from './ragService.js';
import { buildSystemPrompt, classifyIntent, detectLanguage } from './promptBuilder.js';

/**
 * Summarizes relevant verified structured DB records (departments, placement framework)
 * to complement RAG document chunks without exposing any private user data.
 */
async function buildStructuredDbContext(intent, query) {
  const db = getDb();
  const lines = [
    `Institution: ${SEED_COLLEGE_PROFILE.institutionName}`,
    `Location: ${SEED_COLLEGE_PROFILE.location}`,
  ];

  const depts = await db.listDepartments();
  lines.push(
    `Departments (${depts.length}): ${depts.map((d) => `${d.name} (${d.code} - ${d.degree_level})`).join('; ')}`
  );

  const lower = (query || '').toLowerCase();
  const matchedDept = depts.find(
    (d) =>
      lower.includes(d.code.toLowerCase()) ||
      lower.includes(d.name.toLowerCase()) ||
      (d.code === 'AIDS' && (lower.includes('ai&ds') || lower.includes('ai & ds') || lower.includes('data science')))
  );
  if (matchedDept) {
    lines.push(
      `Matched Department Detail (${matchedDept.name}): Courses: ${matchedDept.courses_offered.join(', ')}. Overview: ${matchedDept.overview}`
    );
  }

  if (intent === 'placement') {
    const placements = await db.listPlacementInfo();
    lines.push(
      'Placement Records Summary: ' +
        placements.map((p) => `[${p.category}] ${p.title}: ${p.summary}`).join(' | ')
    );
  }

  return lines.join('\n');
}

/**
 * Checks whether the user is asking for restricted/confidential student data while unauthenticated.
 */
function isConfidentialStudentQuery(query) {
  const lower = (query || '').toLowerCase();
  return /(my marks|my attendance|my grades|my cgpa|my internal|my hall ticket|my result|student record|confidential|என் மதிப்பெண்|என் வருகை)/.test(
    lower
  );
}

/**
 * Checks if query asks for volatile figures that MUST come from verified uploaded official documents
 * (never invented by LLM or fallback).
 */
function asksForUnverifiedNumericFact(query) {
  const lower = (query || '').toLowerCase();
  return /(exact fee|tuition fee|hostel fee|bus fee|fee structure|scholarship amount|cutoff|last date|deadline|highest package|average package|salary package|recruiting companies|company list|placed count|placement percentage|கட்டணம் எவ்வளவு|சம்பளம்|கடைசி தேதி)/.test(
    lower
  );
}

/**
 * Grounded local RAG conversational engine used transparently when OPENAI_API_KEY is not yet configured.
 * Strictly prioritizes uploaded RAG documents + verified DB records, supports English & Tamil,
 * maintains conversation awareness, and never hallucinates.
 */
async function generateLocalGroundedResponse({ query, language, intent, persona, user, ragChunks, history }) {
  const db = getDb();
  const isTamil = language === 'ta';

  // 1. Protect confidential student information
  if (isConfidentialStudentQuery(query) && !user) {
    return {
      content: isTamil
        ? 'தனிப்பட்ட மாணவர் கல்வி விவரங்கள் (வருகைப்பதிவு, உள் மதிப்பீட்டு மதிப்பெண்கள், தேர்வு பதிவுகள்) பாதுகாக்கப்பட்டவை. தயவுசெய்து உங்கள் மாணவர் கணக்கில் உள்நுழைந்து (Sign In) "Student Academic Assistant" பகுதியைப் பார்க்கவும் அல்லது உங்கள் வகுப்பு ஆலோசகர் / துறை அலுவலகத்தைத் தொடர்பு கொள்ளவும்.'
        : 'Confidential student academic records (individual attendance, internal CIA marks, grades, or hall ticket details) require authenticated access. Please **Sign In** with your Student account and visit the **Student Academic Assistant** section, or contact your Department Class Advisor / Exam Cell.',
      confidence: 0.95,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  // 2. If verified official uploaded documents strongly match, ground the response directly in them!
  const officialHits = ragChunks.filter((c) => c.is_verified_official && c.similarity >= 0.22);
  if (officialHits.length > 0) {
    const excerpts = officialHits
      .slice(0, 3)
      .map(
        (c, i) =>
          `**[Source ${i + 1}: ${c.document_title}]**\n${c.content.slice(0, 650)}${
            c.content.length > 650 ? '...' : ''
          }`
      )
      .join('\n\n');

    const header = isTamil
      ? 'அதிகாரப்பூர்வ NSCET ஆவணங்களிலிருந்து பெறப்பட்ட சரிபார்க்கப்பட்ட தகவல்கள்:\n\n'
      : 'Based on the officially uploaded NSCET college documents in our Knowledge Base:\n\n';
    const footer = isTamil
      ? '\n\nமேலும் குறிப்பிட்ட விவரங்கள் தேவைப்பட்டால், உங்கள் துறை அல்லது கேள்வியைக் குறிப்பிட்டுக் கேளுங்கள்.'
      : '\n\nWould you like me to clarify any specific section or guide you to the relevant NSCET office?';

    return {
      content: `${header}${excerpts}${footer}`,
      confidence: Math.min(0.95, officialHits[0].similarity + 0.25),
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  // 3. Zero-fabrication guard for fees, deadlines, scholarships, company names & salary packages
  if (asksForUnverifiedNumericFact(query)) {
    const isPlacementFact = /(package|salary|company|companies|placed|placement|சம்பளம்)/.test(query.toLowerCase());
    if (isPlacementFact) {
      return {
        content: isTamil
          ? 'NSCET AI உதவியாளர் தவறான அல்லது கற்பனையான நிறுவனப் பெயர்கள், சம்பளத் தொகுப்புகள் அல்லது வேலைவாய்ப்பு புள்ளிவிவரங்களை வழங்காது.\n\nதற்போது அதிகாரப்பூர்வ வேலைவாய்ப்பு அறிக்கை (Placement Report PDF) இந்த அறிவுத் தளத்தில் பதிவேற்றப்படவில்லை. சரிபார்க்கப்பட்ட வேலைவாய்ப்பு விவரங்களுக்கு **NSCET பயிற்சி மற்றும் வேலைவாய்ப்புப் பிரிவை (Training & Placement Cell)** தொடர்பு கொள்ளவும். (நிர்வாகிகள் Admin Dashboard வழியாக அதிகாரப்பூர்வ Placement Report PDF-ஐ பதிவேற்றலாம்.)'
          : 'To uphold strict accuracy, **NSCET AI Assistant never fabricates company names, salary packages, or placement statistics.**\n\nNo officially verified Placement Report PDF containing those exact figures is currently uploaded in the knowledge base. Please contact the **NSCET Training & Placement Cell** for officially verified recruitment updates and statistics.\n\n*Tip for Administrators:* Upload the official annual Placement Report PDF in **Admin → Document RAG Manager** to enable cited placement answers automatically.',
        confidence: 0.45,
        isUnanswered: true,
        modelUsed: 'nscet-rag-grounded-local',
      };
    }

    return {
      content: isTamil
        ? 'கட்டண விவரங்கள், உதவித்தொகை தொகை, TNEA கட்-ஆஃப் மற்றும் சேர்க்கை கடைசித் தேதிகள் கல்வியாண்டிற்கு ஆண்டு மாறுபடும் என்பதால், NSCET AI உதவியாளர் உறுதிப்படுத்தப்படாத எண்களை வழங்காது.\n\nசரிபார்க்கப்பட்ட தற்போதைய விவரங்களுக்கு **NSCET சேர்க்கை அலுவலகத்தை (Admission Office, Vadapudupatti, Theni)** தொடர்பு கொள்ளவும் அல்லது **Admission Assistant** பகுதியில் உங்கள் சேர்க்கை விசாரணையைப் பதிவு செய்யவும்.'
        : 'Exact **fee structures, scholarship amounts, eligibility cutoffs, and admission deadlines** are subject to current academic year government and institutional norms — **NSCET AI Assistant does not invent or estimate these figures.**\n\nPlease verify official current-year figures directly with the **NSCET Admission Office** (Vadapudupatti, Theni), or submit your details in the **Admission Assistant** tab so an Admission Counsellor can provide the verified fee & scholarship schedule.\n\n*Could you let me know whether you are enquiring for UG (B.E./B.Tech.) or PG (M.E. CSE) and your preferred department?*',
      confidence: 0.5,
      isUnanswered: true,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  // 4. Intent-structured grounded answers combining DB + retrieved RAG chunks
  const depts = await db.listDepartments();
  const lower = query.toLowerCase();

  // Check if user asked about a specific department
  const matchedDept = depts.find(
    (d) =>
      lower.includes(d.code.toLowerCase()) ||
      lower.includes(d.name.toLowerCase()) ||
      (d.code === 'AIDS' && /(ai&ds|ai & ds|artificial intelligence|data science)/.test(lower)) ||
      (d.code === 'MECH' && /mechanical/.test(lower)) ||
      (d.code === 'SH' && /science and humanities|first year/.test(lower))
  );

  if (matchedDept) {
    const courses = matchedDept.courses_offered.map((c) => `- ${c}`).join('\n');
    const labs = matchedDept.laboratories.map((l) => `- ${l}`).join('\n');
    return {
      content: isTamil
        ? `**${matchedDept.name} (${matchedDept.code}) — NSCET**\n\n${matchedDept.overview}\n\n**வழங்கப்படும் படிப்புகள்:**\n${courses}\n\n**ஆய்வக வசதிகள்:**\n${labs}\n\n*குறிப்பு:* அதிகாரப்பூர்வ பேராசிரியர் பட்டியல் மற்றும் நிகழ்வுகளுக்கு **Department Assistant** பகுதியைப் பார்க்கவும் அல்லது துறை அலுவலகத்தைத் தொடர்பு கொள்ளவும்.`
        : `### ${matchedDept.name} (${matchedDept.code}) — NSCET\n\n${matchedDept.overview}\n\n**Courses Offered:**\n${courses}\n\n**Laboratories:**\n${labs}\n\n**Office Contact:** ${matchedDept.contact_email}\n\n*Note:* You can explore workshops, events, and faculty placeholders in the **Department Assistant** tab. Would you like admission guidance or syllabus information for ${matchedDept.code}?`,
      confidence: 0.88,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  if (intent === 'courses' || intent === 'department') {
    const deptList = depts
      .map((d) => `- **${d.name} (${d.code})** — ${d.courses_offered.join(', ')}`)
      .join('\n');
    return {
      content: isTamil
        ? `**நடார் சரஸ்வதி பொறியியல் மற்றும் தொழில்நுட்பக் கல்லூரி (NSCET), வடபுதுப்பட்டி, தேனி** வழங்கும் துறைகள் மற்றும் படிப்புகள்:\n\n${deptList}\n\nஇதில் எந்தத் துறையைப் பற்றி விரிவாக அறிய விரும்புகிறீர்கள்?`
        : `**Nadar Saraswathi College of Engineering & Technology (NSCET)**, Vadapudupatti, Theni, Tamil Nadu offers engineering programmes across **${depts.length} departments**:\n\n${deptList}\n\n- **Undergraduate (UG):** B.E. & B.Tech. programmes\n- **Postgraduate (PG):** M.E. Computer Science and Engineering\n\nWhich department or programme would you like more details about?`,
      confidence: 0.92,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  if (intent === 'admission') {
    return {
      content: isTamil
        ? `**NSCET சேர்க்கை வழிகாட்டி (Vadapudupatti, Theni)**\n\n1. **படிப்புகள்:** இளங்கலை (B.E. / B.Tech.) மற்றும் முதுகலை (M.E. Computer Science and Engineering).\n2. **சேர்க்கை முறைகள்:** தமிழ்நாடு பொறியியல் சேர்க்கை (**TNEA** ஒற்றை சாளர கலந்தாய்வு) மற்றும் நிர்வாக ஒதுக்கீடு (Management Quota) விசாரணைகள்.\n3. **பொதுவாகத் தேவைப்படும் சான்றிதழ்கள்:** 10-ஆம், 11-ஆம், 12-ஆம் வகுப்பு மதிப்பெண் பட்டியல்கள், மாற்றுச் சான்றிதழ் (TC), சாதிச் சான்றிதழ் (பொருந்தினால்), முதல் தலைமுறை பட்டதாரி / வருமானச் சான்றிதழ் (பொருந்தினால்), TNEA ஒதுக்கீட்டு ஆணை, மற்றும் புகைப்படங்கள்.\n4. **விண்ணப்பிக்க:** இடதுபுற மெனுவில் உள்ள **Admission Assistant** பகுதிக்குச் சென்று உங்கள் **Admission Enquiry** படிவத்தை சமர்ப்பிக்கவும்.\n\n*குறிப்பு:* தற்போதைய கல்வியாண்டு கட்டணம், உதவித்தொகை மற்றும் கடைசித் தேதிகளுக்கு NSCET சேர்க்கை அலுவலகத்தைத் தொடர்பு கொள்ளவும்.`
        : `### How to Apply for Admission at NSCET\n\n1. **Programmes Offered:**\n   - **UG:** B.E. (CSE, ECE, EEE, Mechanical, Civil) & B.Tech. (AI&DS, Information Technology)\n   - **PG:** M.E. Computer Science and Engineering\n2. **Admission Pathways:**\n   - **TNEA Single Window Counselling** (Tamil Nadu Engineering Admissions) as per Government of Tamil Nadu / DoTE norms.\n   - **Management Quota Enquiries:** Submit an enquiry online or visit the NSCET Admission Office.\n3. **Standard Certificates for Verification** *(confirm exact checklist with Admission Office)*:\n   - 10th, 11th & 12th Mark Sheets (or Diploma / UG Degree for Lateral Entry / M.E.)\n   - Transfer Certificate (TC), Community Certificate (if applicable), Nativity / First Graduate / Income Certificate (if applicable), TNEA Allotment Order, and Passport Photos.\n4. **Register Your Enquiry Now:** Open the **Admission Assistant** tab in the sidebar to submit your enquiry and receive a tracking reference code.\n\n*Note:* Exact eligibility percentages, fees, scholarships, and deadlines are verified directly by the **NSCET Admission Office**. Are you applying for UG (B.E./B.Tech.) or PG (M.E. CSE)?`,
      confidence: 0.9,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  if (intent === 'placement') {
    return {
      content: isTamil
        ? `**NSCET பயிற்சி மற்றும் வேலைவாய்ப்பு உதவியாளர் (Placement Assistant)**\n\n- **பயிற்சிகள்:** Quantitative Aptitude, Logical Reasoning, Verbal Communication, Coding Fundamentals, Resume Preparation, மற்றும் Mock Technical/HR Interviews.\n- **பயிற்சிப் பணி (Internships):** துறை ஒருங்கிணைப்பாளர் மற்றும் வேலைவாய்ப்புப் பிரிவு வழிகாட்டுதலுடன் இன்டர்ன்ஷிப் வாய்ப்புகள்.\n- **அதிகாரப்பூர்வ புள்ளிவிவரங்கள்:** NSCET AI உதவியாளர் நிறுவனப் பெயர்கள் அல்லது சம்பள விவரங்களை கற்பனையாகக் கூறாது. சரிபார்க்கப்பட்ட வேலைவாய்ப்பு அறிக்கைகளுக்கு **NSCET Training & Placement Cell**-ஐ தொடர்பு கொள்ளவும்.\n\nஉங்களுக்கு Resume தயாரிப்பு அல்லது நேர்காணல் (Interview) வழிகாட்டுதல் தேவையா?`
        : `### Placement & Career Support at NSCET\n\n- **Placement Training:** Aptitude (Quantitative & Logical), Verbal & Communication Skills, Programming/Core Technical Refreshers, and Mock Technical & HR Interviews.\n- **Internships:** Coordinated through respective Department Internship Coordinators and the Training & Placement Cell.\n- **Career Preparation:** Visit the **Placement Assistant** tab for resume checklists, STAR-method project framing, and technical interview preparation topics.\n- **Verified Statistics Policy:** NSCET AI Assistant never fabricates company names, salary packages, or placement counts. Please check official placement reports uploaded by Admin or contact the **NSCET Training & Placement Cell** directly.\n\nWould you like resume tips or technical interview preparation guidance for your branch?`,
      confidence: 0.87,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  if (intent === 'college_info') {
    const facs = SEED_COLLEGE_PROFILE.campusFacilities
      .map((f) => `- **${f.name}:** ${f.description} *(${f.status})*`)
      .join('\n');
    return {
      content: isTamil
        ? `**NSCET வளாக வசதிகள் (Vadapudupatti, Theni)**\n\n${facs}\n\nமேலும் தகவல்களுக்கு **College Information** பகுதியைப் பார்க்கவும் அல்லது கல்லூரி நிர்வாக அலுவலகத்தைத் தொடர்பு கொள்ளவும்.`
        : `### Campus Facilities at NSCET (Vadapudupatti, Theni)\n\n${facs}\n\nYou can also explore the **College Info** tab in the sidebar for contact offices and institutional details. Which specific facility (Library, Labs, Transport, Hostel, or Clubs) would you like to enquire about?`,
      confidence: 0.88,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  if (intent === 'student_academics') {
    const authHint = user
      ? `You are signed in as **${user.full_name} (${user.role})**, so authenticated student academic documents are included in your search scope.`
      : 'For confidential student records and authenticated syllabus/regulation resources, please **Sign In** with your Student account.';
    return {
      content: isTamil
        ? `**மாணவர் கல்வி உதவியாளர் (Student Academic Assistant)**\n\n- பல்கலைக்கழக கல்வி விதிமுறைகள் (Academic Regulations) மற்றும் CBCS பாடத்திட்டம்.\n- உள் மதிப்பீடுகள் (CIA), ஆய்வக பதிவுகள் மற்றும் வருகைப்பதிவு வழிகாட்டுதல்கள்.\n- பல்கலைக்கழக தேர்வு நடைமுறைகள் மற்றும் ஹால் டிக்கெட் சரிபார்ப்பு.\n\n${user ? 'நீங்கள் உள்நுழைந்துள்ளதால் பாதுகாக்கப்பட்ட ஆவணங்களை அணுகலாம்.' : 'தனிப்பட்ட மாணவர் கல்வி விவரங்களுக்கு உங்கள் மாணவர் கணக்கில் உள்நுழையவும்.'}`
        : `### Student Academic Assistant\n\n- **Regulations & Syllabus:** Follow your batch's University Academic Regulations and department CBCS syllabus (upload/view official PDFs in the Knowledge Base).\n- **Internal Assessments (CIA):** Continuous assessments include internal tests, assignments, and lab evaluations; verify your exact CIA marks and attendance with your Class Advisor.\n- **Examinations:** Register before Exam Cell deadlines and verify Hall Ticket subject codes and dates.\n\n${authHint}\n\nWhich department or semester regulation are you looking for?`,
      confidence: 0.85,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  if (intent === 'faculty') {
    return {
      content: isTamil
        ? `**பேராசிரியர் உதவியாளர் (Faculty Assistant)**\n\n- FDP, STTP, மாநாடுகள் மற்றும் AICTE/ATAL பயிற்சி வழிகாட்டுதல்கள்.\n- NPTEL / SWAYAM பாடநெறிகள் மற்றும் ஆராய்ச்சி நடவடிக்கைகள்.\n- கல்வி ஆவணங்கள் (Lesson Plan, Workshop Circular, Bloom's Taxonomy Question Blueprint) தயாரிப்பு உதவி.\n\nமேலும் கருவிகளுக்கு **Faculty Assistant** பகுதியைப் பார்க்கவும்.`
        : `### Faculty Assistant — NSCET\n\n- **FDP & Workshops:** Information on AICTE/ATAL/University FDPs, conferences, and department technical events.\n- **NPTEL & Research:** Support for NPTEL/SWAYAM faculty certification and R&D Cell proposal guidelines.\n- **Academic Documentation Support:** Open the **Faculty Assistant** tab for structured templates (Lesson Plan, Event Circular, CO-PO Question Blueprint).\n\nHow can I assist with your academic or departmental documentation today?`,
      confidence: 0.84,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  // 5. General RAG hit fallback
  if (ragChunks.length > 0 && ragChunks[0].similarity >= 0.2) {
    const top = ragChunks.slice(0, 2);
    const body = top
      .map(
        (c, i) =>
          `**[Source ${i + 1}: ${c.document_title}]**\n${c.content.slice(0, 500)}${c.content.length > 500 ? '...' : ''}`
      )
      .join('\n\n');
    return {
      content: isTamil
        ? `NSCET அறிவுத் தளத்திலிருந்து தொடர்புடைய தகவல்கள்:\n\n${body}\n\nதயவுசெய்து மேலும் குறிப்பிட்ட கேள்வியைக் கேளுங்கள் அல்லது சம்பந்தப்பட்ட NSCET அலுவலகத்தைத் தொடர்பு கொள்ளவும்.`
        : `Here is the most relevant information found in the NSCET Knowledge Base:\n\n${body}\n\nIf you need more specific details, please clarify your question or contact the appropriate NSCET office.`,
      confidence: top[0].similarity,
      isUnanswered: false,
      modelUsed: 'nscet-rag-grounded-local',
    };
  }

  // 6. Honest admission when information is unavailable (logs as unanswered for Admin analytics!)
  const hasContext = Array.isArray(history) && history.length > 1;
  return {
    content: isTamil
      ? `மன்னிக்கவும், **"${query}"** தொடர்பான சரிபார்க்கப்பட்ட தகவல்கள் தற்போது NSCET AI அறிவுத் தளத்தில் இல்லை.\n\nநான் தவறான அல்லது உறுதிப்படுத்தப்படாத தகவல்களை உருவாக்க மாட்டேன். தயவுசெய்து:\n- **NSCET நிர்வாக / சேர்க்கை அலுவலகத்தை** (வடபுதுப்பட்டி, தேனி) தொடர்பு கொள்ளவும், அல்லது\n- சேர்க்கை, துறைகள், படிப்புகள், வளாக வசதிகள், அல்லது வேலைவாய்ப்பு குறித்துக் கேளுங்கள்.`
      : `I do not currently have verified information in the NSCET Knowledge Base to answer **"${query}"** accurately.\n\nTo avoid providing inaccurate or unverified details, please:\n- Contact the relevant **NSCET Office** (Administrative Office, Admission Cell, Department Office, Exam Cell, or Training & Placement Cell) at Vadapudupatti, Theni.\n- ${hasContext ? 'Clarify which department, programme, or academic service you are referring to.' : 'Ask about NSCET courses, departments, admission process, campus facilities, student academics, faculty resources, or placement training.'}\n\n*This query has been logged under Unanswered Questions so the NSCET Admin can upload the official document.*`,
    confidence: 0.15,
    isUnanswered: true,
    modelUsed: 'nscet-rag-grounded-local',
  };
}

/**
 * Primary conversational AI pipeline:
 * 1. Detect language & intent
 * 2. Retrieve role-filtered RAG document chunks
 * 3. Gather verified structured DB facts
 * 4. Call OpenAI Chat Completions API (if configured) OR grounded local RAG fallback
 * 5. Return structured answer + cited source documents + confidence + unanswered flag
 */
export async function generateAssistantReply({
  query,
  conversationHistory = [],
  persona = 'prospective_student',
  user = null,
}) {
  const language = detectLanguage(query);
  const intent = classifyIntent(query);
  const userRole = user?.role || 'guest';

  // Retrieve top-K document chunks with strict RBAC filtering
  const ragChunks = await retrieveRelevantContext({
    query,
    userRole,
    topK: env.ragTopK,
  });

  const sources = ragChunks.slice(0, 4).map((c, idx) => ({
    index: idx + 1,
    document_id: c.document_id,
    title: c.document_title,
    category: c.document_category,
    chunk_index: c.chunk_index,
    access_level: c.access_level,
    is_verified_official: c.is_verified_official,
    similarity: c.similarity,
    excerpt: c.content.slice(0, 180) + (c.content.length > 180 ? '...' : ''),
  }));

  // Enforce confidential student data guard even before calling OpenAI
  if (isConfidentialStudentQuery(query) && !user) {
    const guarded = await generateLocalGroundedResponse({
      query,
      language,
      intent,
      persona,
      user,
      ragChunks,
      history: conversationHistory,
    });
    return { ...guarded, language, intent, sources: [] };
  }

  // Live OpenAI API integration when OPENAI_API_KEY is configured
  if (isOpenAiConfigured()) {
    try {
      const dbFacts = await buildStructuredDbContext(intent, query);
      const systemPrompt = buildSystemPrompt({
        persona,
        language,
        user,
        ragChunks,
        dbFacts,
      });

      const recentHistory = conversationHistory.slice(-10).map((m) => ({
        role: m.sender === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: query },
      ];

      const response = await fetch(`${env.openAiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: env.openAiChatModel,
          messages,
          temperature: 0.25,
          max_tokens: 900,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content?.trim();
        if (replyText) {
          const avgSim =
            ragChunks.length > 0
              ? ragChunks.reduce((acc, c) => acc + c.similarity, 0) / ragChunks.length
              : 0.2;
          const admitsUnavailable =
            /(do not have verified|currently unavailable|not available in the knowledge base|contact the.*office|சரிபார்க்கப்பட்ட தகவல்கள்.*இல்லை)/i.test(
              replyText
            ) && ragChunks.length === 0;

          return {
            content: replyText,
            language,
            intent,
            sources,
            confidence: Number(Math.min(0.98, Math.max(0.35, avgSim + 0.35)).toFixed(2)),
            isUnanswered: admitsUnavailable,
            modelUsed: env.openAiChatModel,
            tokenUsage: data.usage || null,
          };
        }
      } else {
        const errBody = await response.text();
        console.warn('[AIService] OpenAI API returned non-OK status; falling back to local RAG:', errBody);
      }
    } catch (err) {
      console.warn('[AIService] OpenAI API unreachable; falling back to local RAG:', err.message);
    }
  }

  // Transparent grounded local RAG fallback
  const localReply = await generateLocalGroundedResponse({
    query,
    language,
    intent,
    persona,
    user,
    ragChunks,
    history: conversationHistory,
  });

  return {
    ...localReply,
    language,
    intent,
    sources,
    tokenUsage: null,
  };
}
