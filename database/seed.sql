-- ============================================================================
-- NSCET AI COLLEGE ASSISTANT CHATBOT - SEED SCRIPT (PostgreSQL)
-- IMPORTANT: Records marked is_demo_data = TRUE are demonstration placeholders.
-- Replace with officially verified NSCET records via the Admin Dashboard.
-- ============================================================================

-- 1. Roles
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'College Administrator with full dashboard, RAG document, user, and audit access', '["*"]'::jsonb),
    ('faculty', 'NSCET Faculty Member with faculty resources, academic tools, and department access', '["chat","faculty_hub","academic_resources","documents:faculty"]'::jsonb),
    ('student', 'Enrolled NSCET Student with authenticated academic and syllabus assistant access', '["chat","student_academics","documents:student"]'::jsonb),
    ('guest', 'Prospective Student, Parent, Alumni, or Visitor with public college information access', '["chat","public_info","admission_enquiry"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2. Departments (The 8 NSCET Departments specified in project requirements)
INSERT INTO departments (
    code, name, degree_level, overview, courses_offered, laboratories,
    events, workshops, industrial_visits, student_achievements, research_activities,
    contact_email, is_demo_data
) VALUES
(
    'CSE',
    'Computer Science and Engineering',
    'UG/PG',
    'Department of Computer Science and Engineering at Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni. Offers B.E. Computer Science and Engineering and M.E. Computer Science and Engineering. [Official department brochure and faculty roster can be uploaded via Admin RAG Manager.]',
    '["B.E. Computer Science and Engineering", "M.E. Computer Science and Engineering"]'::jsonb,
    '["Programming & Data Structures Lab (Verify lab list with Department Office)", "Database & Web Engineering Lab (Verify lab list with Department Office)", "Cloud & Networks Computing Lab (Verify lab list with Department Office)"]'::jsonb,
    '["[DEMO] Technical Symposium & Coding Contest — Replace with official NSCET CSE event calendar"]'::jsonb,
    '["[DEMO] Full-Stack Development & AI Prompt Engineering Workshop — Replace with official records"]'::jsonb,
    '["[DEMO] Industrial Visit to IT Parks — Replace with verified CSE IV logs"]'::jsonb,
    '["[DEMO] Student Hackathon & Paper Presentations — Upload official achievement reports in Admin Dashboard"]'::jsonb,
    '["[DEMO] Research areas: Artificial Intelligence, Cloud Computing, Cybersecurity, Data Mining (Confirm with Dept. Research Cell)"]'::jsonb,
    'Contact NSCET CSE Department Office (verify official email at college website)',
    TRUE
),
(
    'AIDS',
    'Artificial Intelligence and Data Science',
    'UG',
    'Department of Artificial Intelligence and Data Science at NSCET focusing on machine learning, data analytics, deep learning, and intelligent systems. [Upload official AI&DS handbook in Admin RAG Manager for verified details.]',
    '["B.Tech. Artificial Intelligence and Data Science"]'::jsonb,
    '["AI & Machine Learning Lab (Verify official lab inventory with Department Office)", "Data Science & Analytics Lab (Verify with Department Office)"]'::jsonb,
    '["[DEMO] AI Innovation Challenge — Replace with official NSCET AI&DS events"]'::jsonb,
    '["[DEMO] Hands-on Python for Data Science & Generative AI Workshop — Replace with official records"]'::jsonb,
    '["[DEMO] Industry Exposure Visits to Analytics & AI Firms — Replace with official logs"]'::jsonb,
    '["[DEMO] Student Projects & Kaggle/Hackathon Participation — Upload official records"]'::jsonb,
    '["[DEMO] Research focus: Natural Language Processing, Computer Vision, Predictive Analytics (Confirm with Dept.)"]'::jsonb,
    'Contact NSCET AI&DS Department Office',
    TRUE
),
(
    'IT',
    'Information Technology',
    'UG',
    'Department of Information Technology at NSCET preparing students in software systems, enterprise applications, networking, and information security. [Upload official IT brochure via Admin RAG Manager.]',
    '["B.Tech. Information Technology"]'::jsonb,
    '["Software Engineering & Enterprise Lab (Verify with Department Office)", "Information Security & Networking Lab (Verify with Department Office)"]'::jsonb,
    '["[DEMO] IT Technical Expo & Symposium — Replace with official records"]'::jsonb,
    '["[DEMO] DevOps, Web Security & UI/UX Workshops — Replace with official records"]'::jsonb,
    '["[DEMO] Software Industry Visits — Replace with verified records"]'::jsonb,
    '["[DEMO] Inter-collegiate Coding & Project Awards — Upload verified records"]'::jsonb,
    '["[DEMO] Research focus: Cloud Security, Software Testing, IoT Systems (Confirm with Dept.)"]'::jsonb,
    'Contact NSCET IT Department Office',
    TRUE
),
(
    'ECE',
    'Electronics and Communication Engineering',
    'UG',
    'Department of Electronics and Communication Engineering at NSCET covering VLSI, embedded systems, signal processing, and communication engineering. [Upload official ECE documentation for verified details.]',
    '["B.E. Electronics and Communication Engineering"]'::jsonb,
    '["Communication Systems Lab (Verify with Department Office)", "Microprocessors, Microcontrollers & Embedded Lab (Verify with Department Office)", "VLSI & Signal Processing Lab (Verify with Department Office)"]'::jsonb,
    '["[DEMO] Electronics Circuit Design & IoT Contest — Replace with official calendar"]'::jsonb,
    '["[DEMO] Embedded Systems & PCB Design Workshop — Replace with official records"]'::jsonb,
    '["[DEMO] Telecom & Electronics Manufacturing Industrial Visits — Replace with verified logs"]'::jsonb,
    '["[DEMO] Hardware Prototype & Technical Paper Awards — Upload official records"]'::jsonb,
    '["[DEMO] Research focus: Low-Power VLSI, Wireless Sensor Networks, Biomedical Signal Processing (Confirm with Dept.)"]'::jsonb,
    'Contact NSCET ECE Department Office',
    TRUE
),
(
    'EEE',
    'Electrical and Electronics Engineering',
    'UG',
    'Department of Electrical and Electronics Engineering at NSCET focusing on power systems, electrical machines, power electronics, control systems, and renewable energy. [Upload official EEE documentation for verified details.]',
    '["B.E. Electrical and Electronics Engineering"]'::jsonb,
    '["Electrical Machines Lab (Verify with Department Office)", "Power Electronics & Drives Lab (Verify with Department Office)", "Control & Instrumentation Lab (Verify with Department Office)"]'::jsonb,
    '["[DEMO] Renewable Energy & Smart Grid Symposium — Replace with official calendar"]'::jsonb,
    '["[DEMO] PLC, SCADA & Electric Vehicle Technology Workshop — Replace with official records"]'::jsonb,
    '["[DEMO] Substations & Power Plant Industrial Visits — Replace with verified logs"]'::jsonb,
    '["[DEMO] Student Energy Audit & Hardware Projects — Upload verified records"]'::jsonb,
    '["[DEMO] Research focus: Renewable Energy Integration, Smart Grids, Power Converters (Confirm with Dept.)"]'::jsonb,
    'Contact NSCET EEE Department Office',
    TRUE
),
(
    'MECH',
    'Mechanical Engineering',
    'UG',
    'Department of Mechanical Engineering at NSCET covering thermal engineering, manufacturing technology, CAD/CAM, design, and robotics. [Upload official Mechanical Engineering documentation for verified details.]',
    '["B.E. Mechanical Engineering"]'::jsonb,
    '["CAD/CAM & Simulation Lab (Verify with Department Office)", "Thermal Engineering Lab (Verify with Department Office)", "Manufacturing Technology & Metrology Lab (Verify with Department Office)"]'::jsonb,
    '["[DEMO] CAD Modelling & Robo-Tech Technical Fest — Replace with official calendar"]'::jsonb,
    '["[DEMO] 3D Printing, CNC Programming & SolidWorks Workshop — Replace with official records"]'::jsonb,
    '["[DEMO] Automotive & Manufacturing Plant Visits — Replace with verified logs"]'::jsonb,
    '["[DEMO] National Design & Fabrication Competitions — Upload verified records"]'::jsonb,
    '["[DEMO] Research focus: Composite Materials, Thermal Optimization, Additive Manufacturing (Confirm with Dept.)"]'::jsonb,
    'Contact NSCET Mechanical Engineering Department Office',
    TRUE
),
(
    'CIVIL',
    'Civil Engineering',
    'UG',
    'Department of Civil Engineering at NSCET covering structural engineering, geotechnical engineering, surveying, transportation, and environmental engineering. [Upload official Civil Engineering documentation for verified details.]',
    '["B.E. Civil Engineering"]'::jsonb,
    '["Strength of Materials & Concrete Lab (Verify with Department Office)", "Surveying & Geotechnical Lab (Verify with Department Office)", "Environmental & Fluid Mechanics Lab (Verify with Department Office)"]'::jsonb,
    '["[DEMO] Sustainable Infrastructure & CADD Symposium — Replace with official calendar"]'::jsonb,
    '["[DEMO] Total Station Surveying, AutoCAD & STAAD.Pro Workshop — Replace with official records"]'::jsonb,
    '["[DEMO] Dam, Construction & Water Treatment Plant Visits — Replace with verified logs"]'::jsonb,
    '["[DEMO] Concrete Cube & Structural Model Competitions — Upload verified records"]'::jsonb,
    '["[DEMO] Research focus: Green Concrete, Sustainable Construction, Water Resource Management (Confirm with Dept.)"]'::jsonb,
    'Contact NSCET Civil Engineering Department Office',
    TRUE
),
(
    'SH',
    'Science and Humanities',
    'S&H',
    'Department of Science and Humanities at NSCET laying the foundational pillars in Mathematics, Physics, Chemistry, English Communication, and Tamil Heritage for first-year engineering students.',
    '["First-Year Common Engineering Foundation (Mathematics, Engineering Physics, Engineering Chemistry, Professional English)"]'::jsonb,
    '["Engineering Physics Laboratory (Verify with Department Office)", "Engineering Chemistry Laboratory (Verify with Department Office)", "Communication Skills & Language Laboratory (Verify with Department Office)"]'::jsonb,
    '["[DEMO] National Science Day & First-Year Induction Programme — Replace with official calendar"]'::jsonb,
    '["[DEMO] Soft Skills, Technical Writing & Bridge Course Workshops — Replace with official records"]'::jsonb,
    '["[DEMO] Science Centre & Academic Field Visits — Replace with verified logs"]'::jsonb,
    '["[DEMO] First-Year Academic Excellence & Literary Awards — Upload verified records"]'::jsonb,
    '["[DEMO] Research focus: Applied Mathematics, Materials Physics, Environmental Chemistry, ELT (Confirm with Dept.)"]'::jsonb,
    'Contact NSCET Science & Humanities Department Office',
    TRUE
)
ON CONFLICT (code) DO NOTHING;

-- 3. Placement Information (Guidance & Templates - NO fabricated companies or salary packages)
INSERT INTO placement_information (category, title, academic_year, summary, details, is_verified_official, is_demo_data) VALUES
(
    'training',
    'NSCET Placement Training & Career Readiness Framework',
    'Current',
    'Structured career readiness covering quantitative aptitude, logical reasoning, verbal ability, programming fundamentals, and mock interviews. Contact the NSCET Training & Placement Cell for the current semester schedule.',
    '{"pillars":["Quantitative Aptitude & Logical Reasoning","Verbal Ability & Group Discussions","Core Technical & Coding Practice","Resume Building & Mock HR/Technical Interviews"],"verification_note":"Exact training dates and batch schedules are published by the NSCET Training & Placement Cell."}'::jsonb,
    FALSE,
    TRUE
),
(
    'guidance',
    'Resume Preparation & Interview Readiness Checklist',
    'Current',
    'Standard engineering resume structure, ATS formatting tips, project storytelling (STAR method), and technical + HR interview preparation guide.',
    '{"resume_sections":["Contact & LinkedIn/GitHub","Education & CGPA","Technical Skills","Academic Projects with Measurable Outcomes","Internships, Certifications & Achievements"],"interview_rounds":["Online Aptitude & Coding Test","Technical Interview (DSA, DBMS, OS, Core Subjects)","HR & Behavioral Interview"]}'::jsonb,
    FALSE,
    TRUE
),
(
    'statistics',
    'Official Placement Records & Recruiters (Upload Required)',
    'Current',
    'To prevent inaccurate reporting, NSCET AI Assistant never fabricates company names, salary packages, or placement counts. Administrators must upload the verified Placement Cell annual report PDF via the RAG Document Manager to display official statistics.',
    '{"policy":"Zero-fabrication policy active. Please contact the NSCET Training & Placement Cell directly or upload official placement reports in the Admin Dashboard."}'::jsonb,
    FALSE,
    TRUE
),
(
    'internship',
    'Internship Guidelines & Industry Readiness',
    'Current',
    'Students seeking internships should obtain departmental approval and Placement Cell guidance. Upload official internship circulars and MoU partner lists via the Admin Document Manager.',
    '{"steps":["Identify domain and academic credit requirements with Department Coordinator","Prepare updated resume and bonafide/permission letter","Submit internship completion report and certificate for evaluation"]}'::jsonb,
    FALSE,
    TRUE
);
