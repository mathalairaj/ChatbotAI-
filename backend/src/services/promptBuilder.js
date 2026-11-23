/**
 * Prompt engineering & guardrail layer for NSCET AI Assistant.
 * Enforces:
 * - Strict grounding in retrieved NSCET documents & verified database records
 * - Zero fabrication of fees, scholarships, deadlines, company lists, or salary packages
 * - English & Tamil language detection and matching
 * - Persona adaptation (prospective student, current student, faculty, parent/visitor)
 * - Confidentiality protection & no unauthorized database execution
 */

export function detectLanguage(text) {
  if (!text) return 'en';
  // Detect Tamil Unicode block U+0B80 - U+0BFF
  const tamilMatches = text.match(/[\u0B80-\u0BFF]/g);
  if (tamilMatches && tamilMatches.length >= 2) {
    return 'ta';
  }
  // Detect common transliterated Tamil phrases (Tanglish)
  const lower = text.toLowerCase();
  const tanglishKeywords = [
    'enna', 'epdi', 'eppadi', 'irukka', 'irukku', 'kedaikuma', 'fees evlo', 'evlo', 'vanakkam', 'sollunga', 'padippu',
  ];
  if (tanglishKeywords.some((kw) => lower.includes(kw))) {
    return 'ta-en';
  }
  return 'en';
}

export function classifyIntent(text) {
  const lower = (text || '').toLowerCase();
  if (/\b(admiss\w*|tnea|apply|eligib\w*|cutoff|quota|scholarship\w*|fee|fees|certificate\w*)\b|சேர்க்கை|கட்டணம்|விண்ணப்ப/.test(lower)) {
    return 'admission';
  }
  if (/\b(place\w*|intern\w*|compan\w*|recruit\w*|salary|package|resume|interview\w*|aptitude)\b|வேலைவாய்ப்பு/.test(lower)) {
    return 'placement';
  }
  if (/\b(cse|aids|ece|eee|mech|mechanical|civil|department\w*|hod)\b|ai\s*&\s*ds|artificial intelligence|data science|science and humanities|துறை/.test(lower)) {
    return 'department';
  }
  if (/\b(course\w*|programme\w*|program\w*|degree\w*|b\.?e|b\.?tech|m\.?e)\b|படிப்பு/.test(lower)) {
    return 'courses';
  }
  if (/\b(syllabus|regulation\w*|exam\w*|internal\w*|cia|attendance|calendar|hall ticket|mark\w*|grade\w*)\b|தேர்வு|பாடத்திட்டம்/.test(lower)) {
    return 'student_academics';
  }
  if (/\b(fdp|nptel|workshop\w*|conference\w*|research|lesson plan|circular|bloom|faculty)\b|ஆசிரியர்|பேராசிரியர்/.test(lower)) {
    return 'faculty';
  }
  if (/\b(hostel|bus|transport|library|lab|labs|laborator\w*|facility|facilities|campus|vision|mission|club\w*|contact|location|where)\b|வசதி|விடுதி|நூலகம்|பேருந்து/.test(lower)) {
    return 'college_info';
  }
  return 'general';
}

const PERSONA_GUIDANCE = {
  prospective_student:
    'The user is a prospective student. Be welcoming, clear, and guide them on programmes, TNEA counselling, campus life, and submitting an Admission Enquiry when needed.',
  current_student:
    'The user is a current NSCET student. Focus on academic regulations, syllabus, assessments, exam guidelines, labs, internships, and placement readiness.',
  faculty:
    'The user is an NSCET faculty member. Provide formal, academic assistance on FDPs, NPTEL, research cells, workshops, and academic documentation.',
  parent_visitor:
    'The user is a parent or campus visitor. Be polite, reassuring, and emphasize campus safety, facilities, transport/hostel guidance, and official office contacts.',
};

export function buildSystemPrompt({ persona = 'prospective_student', language = 'en', user = null, ragChunks = [], dbFacts = '' }) {
  const personaNote = PERSONA_GUIDANCE[persona] || PERSONA_GUIDANCE.prospective_student;
  const authNote = user
    ? `Authenticated User: ${user.full_name} (Role: ${user.role}${user.department_code ? `, Dept: ${user.department_code}` : ''}).`
    : 'User Status: Unauthenticated Public Visitor (do NOT disclose any confidential student or internal staff records; prompt sign-in if requested).';

  const langRule =
    language === 'ta'
      ? 'The user wrote in Tamil. Respond clearly and politely in natural Tamil (keeping standard acronyms like NSCET, B.E., B.Tech., M.E., TNEA, CSE, AI&DS clear).'
      : language === 'ta-en'
      ? 'The user used Tamil/English mixed phrasing. Respond in clear, friendly English with helpful Tamil terms where natural.'
      : 'Respond in clear, professional academic English.';

  const contextBlock =
    ragChunks.length > 0
      ? ragChunks
          .map(
            (c, i) =>
              `[Source ${i + 1}: ${c.document_title} | Category: ${c.document_category} | ${
                c.is_verified_official ? 'VERIFIED OFFICIAL DOC' : 'Starter Reference'
              } | Similarity: ${Math.round(c.similarity * 100)}%]\n${c.content}`
          )
          .join('\n\n---\n\n')
      : 'No matching college document chunks were retrieved for this query.';

  return `You are "NSCET AI Assistant", the official 24/7 virtual college assistant for Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni, Tamil Nadu.

STRICT INSTITUTIONAL RULES (MUST OBEY):
1. Prioritize the Retrieved College Documents and Verified Database Context below over general model knowledge.
2. NEVER invent, guess, or fabricate NSCET-specific data — especially fee amounts, scholarship figures, TNEA cutoff marks, admission deadlines, faculty personal details, recruiting company lists, salary packages, or placement statistics.
3. If the retrieved context does not contain the verified answer, explicitly admit that the verified information is currently unavailable in the knowledge base and recommend contacting the appropriate NSCET office (Admission Office, Department Office, Training & Placement Cell, Exam Cell, Hostel/Transport Office, or Administrative Office).
4. Cite your sources cleanly using [Source 1], [Source 2], etc., whenever drawing from retrieved documents.
5. Protect personal and confidential information. Never expose passwords, emails of other students, or private records. You have zero authority to execute database queries or modify records.
6. When a question is broad or ambiguous (e.g., "tell me about fees" or "syllabus"), briefly give the verified overview and ask 1–2 targeted clarifying questions (such as programme level UG/PG, department, or admission mode).
7. ${langRule}
8. Persona Context: ${personaNote}
9. ${authNote}

VERIFIED STRUCTURED DATABASE CONTEXT:
${dbFacts}

RETRIEVED COLLEGE DOCUMENTS (RAG):
${contextBlock}`;
}
