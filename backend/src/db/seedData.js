/**
 * Initial seed data for NSCET AI College Assistant.
 * STRICT DATA INTEGRITY POLICY:
 * - No fabricated fees, scholarship amounts, cutoffs, deadlines, placement companies, or salary packages.
 * - Any demonstration records are explicitly labelled with is_demo_data: true and clear notices.
 */

export const SEED_ROLES = [
  {
    name: 'admin',
    description: 'College Administrator with full dashboard, RAG document, user, and audit access',
    permissions: ['*'],
  },
  {
    name: 'faculty',
    description: 'NSCET Faculty Member with faculty resources, academic tools, and department access',
    permissions: ['chat', 'faculty_hub', 'academic_resources', 'documents:faculty'],
  },
  {
    name: 'student',
    description: 'Enrolled NSCET Student with authenticated academic and syllabus assistant access',
    permissions: ['chat', 'student_academics', 'documents:student'],
  },
  {
    name: 'guest',
    description: 'Prospective Student, Parent, Alumni, or Visitor with public college information access',
    permissions: ['chat', 'public_info', 'admission_enquiry'],
  },
];

export const SEED_DEPARTMENTS = [
  {
    code: 'CSE',
    name: 'Computer Science and Engineering',
    degree_level: 'UG/PG',
    overview:
      'Department of Computer Science and Engineering at Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni. Offers B.E. Computer Science and Engineering and M.E. Computer Science and Engineering.',
    courses_offered: [
      'B.E. Computer Science and Engineering',
      'M.E. Computer Science and Engineering',
    ],
    laboratories: [
      'Programming & Data Structures Laboratory (Verify exact lab list with CSE Office)',
      'Database Management & Web Engineering Laboratory (Verify with CSE Office)',
      'Computer Networks & Cloud Systems Laboratory (Verify with CSE Office)',
    ],
    events: [
      '[DEMO] Annual Technical Symposium & Hackathon — Replace via Admin Dashboard with official NSCET CSE calendar',
    ],
    workshops: [
      '[DEMO] Modern Full-Stack Web Development & Applied AI Workshop — Replace with official records',
    ],
    industrial_visits: [
      '[DEMO] Software Technology Park Industrial Visits — Replace with verified CSE records',
    ],
    student_achievements: [
      '[DEMO] Student Coding Contests & Technical Paper Presentations — Upload official reports in RAG Manager',
    ],
    research_activities: [
      '[DEMO] Focus Areas: Artificial Intelligence, Cloud Computing, Cybersecurity, Data Mining (Confirm with Dept. Office)',
    ],
    contact_email: 'Contact NSCET CSE Department Office (verify official email at college website)',
    is_demo_data: true,
  },
  {
    code: 'AIDS',
    name: 'Artificial Intelligence and Data Science',
    degree_level: 'UG',
    overview:
      'Department of Artificial Intelligence and Data Science at NSCET, Vadapudupatti, Theni, focused on machine learning, data science, deep learning, and intelligent computing.',
    courses_offered: ['B.Tech. Artificial Intelligence and Data Science'],
    laboratories: [
      'Artificial Intelligence & Machine Learning Laboratory (Verify with AI&DS Office)',
      'Data Science & Analytics Laboratory (Verify with AI&DS Office)',
    ],
    events: ['[DEMO] AI Innovation & Data Challenge — Replace with official NSCET AI&DS calendar'],
    workshops: ['[DEMO] Hands-on Python, Machine Learning & Generative AI Workshop — Replace with official records'],
    industrial_visits: ['[DEMO] Analytics & Software Industry Visits — Replace with verified records'],
    student_achievements: ['[DEMO] Student AI Prototypes & Hackathon Participation — Upload verified reports'],
    research_activities: ['[DEMO] Focus Areas: Natural Language Processing, Computer Vision, Predictive Analytics'],
    contact_email: 'Contact NSCET AI&DS Department Office',
    is_demo_data: true,
  },
  {
    code: 'IT',
    name: 'Information Technology',
    degree_level: 'UG',
    overview:
      'Department of Information Technology at NSCET equipping students in software engineering, web & enterprise applications, networking, and information security.',
    courses_offered: ['B.Tech. Information Technology'],
    laboratories: [
      'Software Engineering & Application Development Laboratory (Verify with IT Office)',
      'Information Security & Networking Laboratory (Verify with IT Office)',
    ],
    events: ['[DEMO] IT Technical Symposium & Code Fest — Replace with official calendar'],
    workshops: ['[DEMO] Cloud DevOps, UI/UX & Cybersecurity Workshop — Replace with official records'],
    industrial_visits: ['[DEMO] IT Industry Exposure Visits — Replace with verified records'],
    student_achievements: ['[DEMO] Inter-collegiate Coding & Project Awards — Upload official reports'],
    research_activities: ['[DEMO] Focus Areas: Cloud Security, Software Testing, IoT & Web Technologies'],
    contact_email: 'Contact NSCET IT Department Office',
    is_demo_data: true,
  },
  {
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    degree_level: 'UG',
    overview:
      'Department of Electronics and Communication Engineering at NSCET covering embedded systems, VLSI design, communication engineering, and digital signal processing.',
    courses_offered: ['B.E. Electronics and Communication Engineering'],
    laboratories: [
      'Communication Systems Laboratory (Verify with ECE Office)',
      'Microprocessors, Microcontrollers & Embedded Systems Laboratory (Verify with ECE Office)',
      'VLSI & Digital Signal Processing Laboratory (Verify with ECE Office)',
    ],
    events: ['[DEMO] Electronics Circuit Design & IoT Symposium — Replace with official calendar'],
    workshops: ['[DEMO] PCB Design, Embedded IoT & VLSI Design Workshop — Replace with official records'],
    industrial_visits: ['[DEMO] Telecom & Electronics Industry Visits — Replace with verified records'],
    student_achievements: ['[DEMO] Hardware Prototype & Technical Paper Awards — Upload official reports'],
    research_activities: ['[DEMO] Focus Areas: Low-Power VLSI, Wireless Communication, Signal Processing'],
    contact_email: 'Contact NSCET ECE Department Office',
    is_demo_data: true,
  },
  {
    code: 'EEE',
    name: 'Electrical and Electronics Engineering',
    degree_level: 'UG',
    overview:
      'Department of Electrical and Electronics Engineering at NSCET focused on electrical machines, power systems, power electronics, control systems, and renewable energy.',
    courses_offered: ['B.E. Electrical and Electronics Engineering'],
    laboratories: [
      'Electrical Machines Laboratory (Verify with EEE Office)',
      'Power Electronics & Drives Laboratory (Verify with EEE Office)',
      'Control & Instrumentation Laboratory (Verify with EEE Office)',
    ],
    events: ['[DEMO] Smart Grid & Renewable Energy Symposium — Replace with official calendar'],
    workshops: ['[DEMO] PLC, SCADA & Electric Vehicle Technology Workshop — Replace with official records'],
    industrial_visits: ['[DEMO] Substation & Power Generation Plant Visits — Replace with verified records'],
    student_achievements: ['[DEMO] Energy Audit & Electrical Hardware Projects — Upload official reports'],
    research_activities: ['[DEMO] Focus Areas: Renewable Energy Integration, Smart Grids, Power Converters'],
    contact_email: 'Contact NSCET EEE Department Office',
    is_demo_data: true,
  },
  {
    code: 'MECH',
    name: 'Mechanical Engineering',
    degree_level: 'UG',
    overview:
      'Department of Mechanical Engineering at NSCET covering thermal engineering, manufacturing technology, engineering design, CAD/CAM, and automation.',
    courses_offered: ['B.E. Mechanical Engineering'],
    laboratories: [
      'CAD/CAM & Simulation Laboratory (Verify with MECH Office)',
      'Thermal Engineering Laboratory (Verify with MECH Office)',
      'Manufacturing Technology & Metrology Laboratory (Verify with MECH Office)',
    ],
    events: ['[DEMO] CAD Modelling & Technical Fest — Replace with official calendar'],
    workshops: ['[DEMO] 3D Printing, CNC Programming & SolidWorks Workshop — Replace with official records'],
    industrial_visits: ['[DEMO] Manufacturing & Automotive Plant Visits — Replace with verified records'],
    student_achievements: ['[DEMO] National Design & Fabrication Contests — Upload official reports'],
    research_activities: ['[DEMO] Focus Areas: Composite Materials, Thermal Optimization, Additive Manufacturing'],
    contact_email: 'Contact NSCET Mechanical Engineering Department Office',
    is_demo_data: true,
  },
  {
    code: 'CIVIL',
    name: 'Civil Engineering',
    degree_level: 'UG',
    overview:
      'Department of Civil Engineering at NSCET covering structural engineering, surveying, geotechnical engineering, transportation, and environmental engineering.',
    courses_offered: ['B.E. Civil Engineering'],
    laboratories: [
      'Strength of Materials & Concrete Testing Laboratory (Verify with CIVIL Office)',
      'Surveying & Geotechnical Engineering Laboratory (Verify with CIVIL Office)',
      'Environmental & Fluid Mechanics Laboratory (Verify with CIVIL Office)',
    ],
    events: ['[DEMO] Sustainable Infrastructure & CADD Symposium — Replace with official calendar'],
    workshops: ['[DEMO] Total Station Surveying, AutoCAD & STAAD.Pro Workshop — Replace with official records'],
    industrial_visits: ['[DEMO] Construction Sites, Dams & Water Treatment Visits — Replace with verified records'],
    student_achievements: ['[DEMO] Concrete Cube & Structural Model Contests — Upload official reports'],
    research_activities: ['[DEMO] Focus Areas: Green Concrete, Sustainable Construction, Water Resources'],
    contact_email: 'Contact NSCET Civil Engineering Department Office',
    is_demo_data: true,
  },
  {
    code: 'SH',
    name: 'Science and Humanities',
    degree_level: 'S&H',
    overview:
      'Department of Science and Humanities at NSCET building strong first-year engineering foundations in Mathematics, Physics, Chemistry, English Communication, and Humanities.',
    courses_offered: [
      'First-Year Engineering Foundation (Engineering Mathematics, Physics, Chemistry, Professional English)',
    ],
    laboratories: [
      'Engineering Physics Laboratory (Verify with S&H Office)',
      'Engineering Chemistry Laboratory (Verify with S&H Office)',
      'Communication Skills & Language Laboratory (Verify with S&H Office)',
    ],
    events: ['[DEMO] First-Year Student Induction Programme & National Science Day — Replace with official calendar'],
    workshops: ['[DEMO] Bridge Course, Technical Writing & Soft Skills Workshops — Replace with official records'],
    industrial_visits: ['[DEMO] Science Centre & Academic Field Visits — Replace with verified records'],
    student_achievements: ['[DEMO] First-Year Academic Merit & Literary Awards — Upload official reports'],
    research_activities: ['[DEMO] Focus Areas: Applied Mathematics, Materials Physics, Environmental Chemistry, ELT'],
    contact_email: 'Contact NSCET Science & Humanities Department Office',
    is_demo_data: true,
  },
];

export const SEED_FACULTY = [
  {
    dept_code: 'CSE',
    full_name: '[DEMO] Head of Department — CSE (Replace with Verified Faculty Name)',
    designation: 'Professor & Head (Demonstration Placeholder)',
    qualification: 'Ph.D. / M.E. (Verify with College Office)',
    specialization: 'Computer Science & Engineering',
    email: 'Verify official email via NSCET directory',
    research_interests: 'Artificial Intelligence, Distributed Computing',
    is_demo_data: true,
  },
  {
    dept_code: 'AIDS',
    full_name: '[DEMO] Department Coordinator — AI&DS (Replace with Verified Faculty Name)',
    designation: 'Associate Professor (Demonstration Placeholder)',
    qualification: 'Ph.D. / M.E. (Verify with College Office)',
    specialization: 'Machine Learning & Data Science',
    email: 'Verify official email via NSCET directory',
    research_interests: 'Deep Learning, Natural Language Processing',
    is_demo_data: true,
  },
  {
    dept_code: 'IT',
    full_name: '[DEMO] Department Coordinator — IT (Replace with Verified Faculty Name)',
    designation: 'Associate Professor (Demonstration Placeholder)',
    qualification: 'M.E. / Ph.D. (Verify with College Office)',
    specialization: 'Information Technology & Cloud Security',
    email: 'Verify official email via NSCET directory',
    research_interests: 'Cloud Computing, Information Security',
    is_demo_data: true,
  },
  {
    dept_code: 'ECE',
    full_name: '[DEMO] Department Coordinator — ECE (Replace with Verified Faculty Name)',
    designation: 'Professor (Demonstration Placeholder)',
    qualification: 'Ph.D. / M.E. (Verify with College Office)',
    specialization: 'VLSI & Embedded Communication',
    email: 'Verify official email via NSCET directory',
    research_interests: 'VLSI Design, IoT, Signal Processing',
    is_demo_data: true,
  },
  {
    dept_code: 'EEE',
    full_name: '[DEMO] Department Coordinator — EEE (Replace with Verified Faculty Name)',
    designation: 'Professor (Demonstration Placeholder)',
    qualification: 'Ph.D. / M.E. (Verify with College Office)',
    specialization: 'Power Systems & Renewable Energy',
    email: 'Verify official email via NSCET directory',
    research_interests: 'Smart Grids, Power Electronics',
    is_demo_data: true,
  },
  {
    dept_code: 'MECH',
    full_name: '[DEMO] Department Coordinator — MECH (Replace with Verified Faculty Name)',
    designation: 'Professor (Demonstration Placeholder)',
    qualification: 'Ph.D. / M.E. (Verify with College Office)',
    specialization: 'Thermal & Manufacturing Engineering',
    email: 'Verify official email via NSCET directory',
    research_interests: 'CAD/CAM, Composite Materials',
    is_demo_data: true,
  },
  {
    dept_code: 'CIVIL',
    full_name: '[DEMO] Department Coordinator — CIVIL (Replace with Verified Faculty Name)',
    designation: 'Professor (Demonstration Placeholder)',
    qualification: 'Ph.D. / M.E. (Verify with College Office)',
    specialization: 'Structural & Geotechnical Engineering',
    email: 'Verify official email via NSCET directory',
    research_interests: 'Sustainable Construction, Structural Analysis',
    is_demo_data: true,
  },
  {
    dept_code: 'SH',
    full_name: '[DEMO] Department Coordinator — S&H (Replace with Verified Faculty Name)',
    designation: 'Professor (Demonstration Placeholder)',
    qualification: 'Ph.D. / M.Phil. (Verify with College Office)',
    specialization: 'Applied Sciences & Humanities',
    email: 'Verify official email via NSCET directory',
    research_interests: 'Applied Mathematics, Engineering Physics & Communication',
    is_demo_data: true,
  },
];

export const SEED_PLACEMENT_INFO = [
  {
    category: 'training',
    title: 'Placement Training & Career Readiness Programme',
    academic_year: 'Current',
    summary:
      'NSCET Training & Placement Cell coordinates structured training covering quantitative aptitude, logical reasoning, verbal communication, coding fundamentals, and mock interviews. Contact the Placement Cell for exact semester schedules.',
    details: {
      pillars: [
        'Quantitative Aptitude & Logical Reasoning Practice',
        'Verbal Ability, Group Discussions & Soft Skills',
        'Programming Fundamentals, Data Structures & Core Technical Refreshers',
        'Resume Reviews & Mock Technical / HR Interviews',
      ],
      verification_note: 'For verified batch timetables, please check official circulars uploaded by the Training & Placement Cell.',
    },
    is_verified_official: false,
    is_demo_data: true,
  },
  {
    category: 'guidance',
    title: 'Resume Preparation & Technical Interview Guide',
    academic_year: 'Current',
    summary:
      'Practical engineering career preparation checklist covering ATS-friendly resume structure, project presentation using the STAR method, and core subject interview preparation.',
    details: {
      resume_checklist: [
        'Keep resume to 1 page for freshers with clean academic formatting',
        'Include verified CGPA, department, technical skills, and GitHub/portfolio links',
        'Describe 2–3 academic/mini projects with your exact contribution and outcome',
        'List verified internships, NPTEL/technical certifications, and achievements',
      ],
      interview_topics: [
        'CSE/IT/AI&DS: Data Structures, Algorithms, DBMS, OS, Computer Networks, OOP, SQL',
        'ECE/EEE: Digital Electronics, Microcontrollers, Signals, Circuit Theory, Power Electronics',
        'MECH/CIVIL: Strength of Materials, Thermodynamics, Manufacturing, Structural Analysis, CAD',
        'HR Round: Tell me about yourself, Strengths/Weaknesses, Teamwork, Career Goals',
      ],
    },
    is_verified_official: false,
    is_demo_data: true,
  },
  {
    category: 'internship',
    title: 'Internship Opportunities & Departmental Approval Process',
    academic_year: 'Current',
    summary:
      'Students seeking summer or semester internships should coordinate with their Department Internship Coordinator and the Training & Placement Cell for official bonafide letters and credit mapping.',
    details: {
      steps: [
        'Check semester academic calendar and departmental internship credit rules',
        'Request an official bonafide / internship permission letter from the Department Office',
        'Maintain a daily/weekly work log and submit the completion certificate for academic review',
      ],
    },
    is_verified_official: false,
    is_demo_data: true,
  },
  {
    category: 'statistics',
    title: 'Official Placement Records & Recruiting Companies (Verification Notice)',
    academic_year: 'Current',
    summary:
      'NSCET AI Assistant strictly avoids fabricating company names, salary packages, or placement percentages. Administrators can upload verified annual Placement Reports (PDF/DOCX) via the Admin Document Manager so the chatbot can cite official placement data.',
    details: {
      policy: 'Zero-hallucination policy enforced. Contact the NSCET Training & Placement Cell for officially verified placement statistics and company drive updates.',
    },
    is_verified_official: false,
    is_demo_data: true,
  },
];

/**
 * Initial institutional knowledge documents indexed into the RAG vector store
 * so the chatbot can answer core NSCET queries immediately with transparent source citations
 * while strictly respecting the zero-fabrication rule.
 */
export const SEED_DOCUMENTS = [
  {
    title: 'NSCET Institutional Overview & Campus Facilities Guide (Starter Reference)',
    category: 'Brochure',
    access_level: 'public',
    is_verified_official: false,
    description:
      'Starter institutional reference for Nadar Saraswathi College of Engineering & Technology (NSCET). Replace or supplement with the official NSCET Prospectus PDF via Admin Document Manager.',
    content: `NADAR SARASWATHI COLLEGE OF ENGINEERING & TECHNOLOGY (NSCET)
Location: Vadapudupatti, Theni, Tamil Nadu, India.

1. INSTITUTION PROFILE
Nadar Saraswathi College of Engineering & Technology (NSCET) is an engineering institution located at Vadapudupatti, Theni, Tamil Nadu.
Note: For official Vision, Mission statements, current accreditation status (NAAC/NBA), affiliation details, and statutory disclosures, please refer to the official NSCET Prospectus uploaded by the College Administration or contact the NSCET Administrative Office.

2. ACADEMIC PROGRAMMES & DEPARTMENTS AT NSCET
Undergraduate (B.E. / B.Tech.) and Postgraduate (M.E.) Departments:
- Computer Science and Engineering (CSE) — B.E. CSE and M.E. Computer Science and Engineering
- Artificial Intelligence and Data Science (AI&DS) — B.Tech. AI&DS
- Information Technology (IT) — B.Tech. IT
- Electronics and Communication Engineering (ECE) — B.E. ECE
- Electrical and Electronics Engineering (EEE) — B.E. EEE
- Mechanical Engineering (MECH) — B.E. Mechanical Engineering
- Civil Engineering (CIVIL) — B.E. Civil Engineering
- Science and Humanities (S&H) — First-Year Engineering Foundation

3. CAMPUS FACILITIES
Campus infrastructure at NSCET supports engineering education and student life, including:
- Department-specific Engineering & Computing Laboratories
- Central Library with academic books, reference materials, and digital learning access
- College Transport facility connecting nearby towns and routes around Theni district (verify current bus routes and timings with the Transport Office)
- Hostel accommodation for students (verify availability, rules, and hostel fee details with the Hostel Office)
- Student Clubs, Professional Chapters, NSS, Sports, and Technical Associations (verify active clubs with the Student Affairs Office)

4. CONTACT & OFFICE GUIDANCE
For officially verified details regarding admissions, fees, scholarships, certificates, hostel, transport, or campus visits, please submit an Admission Enquiry through this portal or contact the NSCET Administrative / Admission Office at Vadapudupatti, Theni, Tamil Nadu.`,
  },
  {
    title: 'NSCET Admissions & TNEA Guidance Policy (Zero-Fabrication Reference)',
    category: 'Admission Guidelines',
    access_level: 'public',
    is_verified_official: false,
    description:
      'Verified admissions workflow guide covering UG/PG programmes, TNEA counselling, management enquiry process, and required certificates checklist. Official fees/cutoffs/deadlines must be uploaded by Admission Office.',
    content: `NSCET ADMISSION GUIDELINES & ENQUIRY PROCESS
Institution: Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni, Tamil Nadu.

1. PROGRAMMES OFFERED
- Undergraduate Programmes (UG): B.E. (CSE, ECE, EEE, Mechanical, Civil) and B.Tech. (AI&DS, Information Technology).
- Postgraduate Programme (PG): M.E. Computer Science and Engineering.

2. ADMISSION MODES
- Tamil Nadu Engineering Admissions (TNEA) Single Window Counselling for eligible UG engineering applicants as per Government of Tamil Nadu and Directorate of Technical Education (DoTE) norms.
- Management Quota Enquiries: Prospective students and parents can submit an enquiry through the NSCET AI Assistant Admission Enquiry Form or contact the NSCET Admission Office directly.
- Postgraduate Admissions (M.E. CSE): Governed by applicable Tamil Nadu PG admission norms (e.g., TANCET / CEETA-PG / consortium norms as notified each academic year).

3. ELIGIBILITY, FEES, SCHOLARSHIPS & DEADLINES POLICY
- Exact eligibility percentages, TNEA cutoffs, tuition fees, hostel/transport fees, scholarship amounts (First Graduate, Government Post-Matric, BC/MBC/SC/ST, Merit Scholarships), and current academic year deadlines are NOT fabricated by this assistant.
- Prospective students must verify current-year figures directly from the official NSCET Admission Office or official admission circulars uploaded by the Administrator.

4. TYPICAL CERTIFICATES REQUIRED FOR ADMISSION VERIFICATION (Confirm exact checklist with Admission Office)
- 10th Standard Mark Sheet
- 11th & 12th Standard (HSC) Mark Sheets (or Diploma Mark Sheets for Lateral Entry; UG Degree & Provisional Certificate for M.E.)
- Transfer Certificate (TC)
- Community Certificate (if applicable)
- Nativity / First Graduate / Income Certificate (if applying for applicable government schemes or scholarships)
- TNEA Allotment Order (for counselling candidates)
- Recent Passport-size Photographs and valid Government Photo ID (e.g., Aadhaar)

5. HOW TO APPLY / REGISTER AN ENQUIRY
Use the "Admission Assistant" tab in NSCET AI Assistant to submit your Admission Enquiry Form. Your enquiry is stored securely and assigned a reference code for follow-up by the NSCET Admission Cell.`,
  },
  {
    title: 'Student Academic Regulations, Assessments & Exam Guidelines (Authenticated Student Reference)',
    category: 'Academic Regulations',
    access_level: 'student',
    is_verified_official: false,
    description:
      'Authenticated academic guidance for enrolled NSCET students covering regulations, syllabus, internal assessments, and university exam procedures. Admins should upload current regulation PDFs.',
    content: `NSCET STUDENT ACADEMIC ASSISTANT REFERENCE (ENROLLED STUDENTS)
Access Level: Authenticated Student Resource

1. ACADEMIC REGULATIONS & SYLLABUS
- Enrolled students follow the applicable University Academic Regulations and Choice Based Credit System (CBCS) syllabus for their batch and department.
- To view exact subject codes, credit distribution, unit-wise syllabus, and course outcomes, upload or access the official Regulation & Syllabus PDF in the Knowledge Base or contact your Department Academic Coordinator.

2. INTERNAL ASSESSMENTS (CIA) & ATTENDANCE
- Continuous Internal Assessments (Internal Tests, Assignments, Laboratory Records, and Seminars) contribute to internal evaluation as prescribed by the university regulation.
- Students must maintain the minimum required attendance percentage specified by the university regulation to be eligible to appear for end-semester examinations. Contact your Class Advisor / HoD for your individual attendance and CIA marks.

3. UNIVERSITY EXAMINATION PROCEDURES
- Register for semester examinations before the official exam cell deadline.
- Verify hall ticket details (Register Number, Subject Codes, Exam Dates, and Session).
- Bring valid College ID Card and Hall Ticket to the examination hall and strictly follow university examination conduct rules.

4. LEARNING RESOURCES
- Utilize the NSCET Central Library, department lecture notes, previous question banks, and NPTEL / SWAYAM online courses recommended by faculty.`,
  },
  {
    title: 'NSCET Faculty Development, Research & Academic Documentation Guide',
    category: 'Faculty Resource',
    access_level: 'faculty',
    is_verified_official: false,
    description:
      'Faculty-level reference covering FDPs, NPTEL, workshops, research support, and academic documentation templates.',
    content: `NSCET FACULTY ASSISTANT RESOURCE GUIDE
Access Level: Authenticated Faculty & Administration

1. FACULTY DEVELOPMENT PROGRAMMES (FDP) & WORKSHOPS
- Faculty members are encouraged to attend AICTE / ATAL / University-sponsored FDPs, STTPs, national/international conferences, and industry workshops.
- Submit prior permission and completion certificates through the Department HoD and IQAC / Principal's office as per institutional norms.

2. NPTEL & SWAYAM PARTICIPATION
- Faculty can enroll in NPTEL / SWAYAM courses for domain enrichment, FDP credit certification, and mentoring students enrolled in the NSCET NPTEL Local Chapter (verify current coordinator with IQAC).

3. RESEARCH & PUBLICATIONS
- Coordinate with the NSCET Research & Development Cell for funded project proposals, patent filing support, journal publications, and consultancy guidelines.

4. ACADEMIC DOCUMENTATION ASSISTANCE
- The NSCET AI Assistant can help faculty draft structured outlines for:
  * Course Lesson Plans & Course Delivery Schedules
  * Workshop / Seminar Proposals & Event Circulars
  * Question Paper Blueprints mapped to Bloom's Taxonomy & Course Outcomes (CO-PO)
  * Department Event Reports & Lab Manual Checklists`,
  },
];

export const SEED_COLLEGE_PROFILE = {
  institutionName: 'Nadar Saraswathi College of Engineering & Technology (NSCET)',
  shortName: 'NSCET',
  location: 'Vadapudupatti, Theni, Tamil Nadu, India',
  chatbotIdentity: 'NSCET AI Assistant',
  officialLogoUrl: null, // Only populated when an official logo file is supplied by admin
  profileSummary:
    'Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni, Tamil Nadu, is dedicated to engineering education, technical innovation, and holistic student development across undergraduate and postgraduate engineering disciplines.',
  vision:
    '[Official Vision Statement Placeholder — Upload official NSCET Vision & Mission document in the Admin Dashboard to display verified institutional text.]',
  mission: [
    '[Official Mission Placeholder — Administrators can update or upload the verified NSCET Vision & Mission circular via Admin Document Manager.]',
  ],
  accreditationAndAffiliation:
    'Please refer to official NSCET statutory disclosures or uploaded accreditation documents in the Knowledge Base for current AICTE approval, university affiliation, and NAAC/NBA accreditation details.',
  campusFacilities: [
    {
      name: 'Engineering & Computing Laboratories',
      description: 'Departmental laboratories supporting practical coursework and project development across all engineering streams.',
      status: 'Verify exact equipment lists with respective Department Offices.',
    },
    {
      name: 'Central Library',
      description: 'Academic textbooks, reference volumes, technical journals, reading spaces, and digital learning support.',
      status: 'Verify library timings and e-journal subscriptions with the Librarian.',
    },
    {
      name: 'Campus Transport',
      description: 'College bus transport services connecting Theni and surrounding areas.',
      status: 'Verify current bus routes, boarding points, and transport fees with the Transport Office.',
    },
    {
      name: 'Hostel Facilities',
      description: 'On-campus / institutional residential hostel accommodation and dining facilities.',
      status: 'Verify room availability, rules, and hostel fees with the Hostel Warden / Office.',
    },
    {
      name: 'Clubs, Sports & Student Associations',
      description: 'Department technical associations, NSS, cultural clubs, coding forums, and sports facilities.',
      status: 'Verify active clubs and coordinators with the Student Affairs Office.',
    },
  ],
  contacts: [
    { office: 'Administrative & Admission Office', detail: 'Nadar Saraswathi College of Engineering & Technology, Vadapudupatti, Theni, Tamil Nadu' },
    { office: 'Training & Placement Cell', detail: 'Contact via Campus Administrative Office or submit query in Placement Assistant' },
    { office: 'Examination & Academic Cell', detail: 'Contact respective Department HoD / Academic Coordinator' },
    { office: 'Transport & Hostel Office', detail: 'Available at Campus Administrative Block during college working hours' },
  ],
};
