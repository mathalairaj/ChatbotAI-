import { Router } from 'express';
import { getDb } from '../db/index.js';
import { SEED_COLLEGE_PROFILE } from '../db/seedData.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/college/profile
 * Module 2: College Information Assistant
 */
router.get('/profile', (_req, res) => {
  return res.json({ profile: SEED_COLLEGE_PROFILE });
});

/**
 * GET /api/college/departments
 * Module 4: Department Assistant (All 8 NSCET departments + faculty)
 */
router.get('/departments', async (_req, res, next) => {
  try {
    const db = getDb();
    const departments = await db.listDepartments();
    return res.json({ departments });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/college/departments/:code
 */
router.get('/departments/:code', async (req, res, next) => {
  try {
    const db = getDb();
    const department = await db.getDepartmentByCode(req.params.code);
    if (!department) return res.status(404).json({ error: 'Department not found.' });
    return res.json({ department });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/college/placements
 * Module 6: Placement Assistant
 */
router.get('/placements', async (_req, res, next) => {
  try {
    const db = getDb();
    const records = await db.listPlacementInfo();
    const placementDocs = await db.listDocuments({
      allowedAccessLevels: ['public'],
      category: 'Placement Report',
    });
    return res.json({
      records,
      officialReports: placementDocs,
      zeroFabricationNotice:
        'NSCET AI Assistant never fabricates company names, salary packages, or placement statistics. Official figures appear only from verified Placement Cell reports.',
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/college/student-academics
 * Module 5: Student Academic Assistant (Authenticated student/faculty/admin access for confidential resources)
 */
router.get('/student-academics', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const academicDocs = await db.listDocuments({
      allowedAccessLevels: ['public', 'student'],
    });
    const filteredDocs = academicDocs.filter((d) =>
      ['Academic Regulations', 'Syllabus', 'Circular', 'Department'].includes(d.category)
    );

    return res.json({
      studentContext: {
        full_name: req.user.full_name,
        role: req.user.role,
        register_number: req.user.register_number || 'Not linked (contact Exam Cell / Admin)',
        department: req.user.department_name || 'Not assigned',
        academic_year: req.user.academic_year || 'Not assigned',
      },
      academicSections: [
        {
          id: 'regulations',
          title: 'Academic Regulations & Credit System',
          summary:
            'Follow your batch University Academic Regulations (CBCS), attendance requirements, internal weightage, and progression criteria. Refer to official regulation PDFs uploaded by Admin.',
        },
        {
          id: 'syllabus',
          title: 'Department Syllabus & Subject Information',
          summary:
            'Subject codes, unit-wise syllabus, prerequisites, and laboratory manuals are served from uploaded official syllabus documents.',
        },
        {
          id: 'cia',
          title: 'Internal Assessments (CIA) & Attendance',
          summary:
            'Continuous Internal Assessment comprises internal cycle tests, assignments, lab records, and seminars. Verify individual CIA marks and attendance percentages directly with your Class Advisor / HoD.',
        },
        {
          id: 'exams',
          title: 'University Examination Procedures & Academic Calendar',
          summary:
            'Register within the Exam Cell schedule, verify Hall Ticket subject codes, carry valid NSCET ID card, and review current semester academic calendar circulars.',
        },
        {
          id: 'resources',
          title: 'Learning Resources',
          summary:
            'Access the NSCET Central Library, departmental lecture notes, university question banks, and NPTEL / SWAYAM courses.',
        },
      ],
      documents: filteredDocs,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/college/faculty-resources
 * Module 7: Faculty Assistant
 */
router.get('/faculty-resources', optionalAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const isFacultyOrAdmin = req.user && ['faculty', 'admin'].includes(req.user.role);
    const docs = isFacultyOrAdmin
      ? await db.listDocuments({ allowedAccessLevels: ['public', 'student', 'faculty'] })
      : await db.listDocuments({ allowedAccessLevels: ['public'] });

    return res.json({
      authenticatedFacultyAccess: Boolean(isFacultyOrAdmin),
      sections: [
        {
          id: 'fdp',
          title: 'Faculty Development Programmes (FDP) & Workshops',
          summary:
            'Coordinate AICTE / ATAL / University-sponsored FDPs, STTPs, and technical workshops through your Department HoD and IQAC.',
        },
        {
          id: 'research',
          title: 'Research Activities & Publications',
          summary:
            'Consult the NSCET Research & Development Cell for funded project proposals, Scopus/SCI journal support, patents, and consultancy norms.',
        },
        {
          id: 'nptel',
          title: 'NPTEL & SWAYAM Faculty Portal',
          summary:
            'Participate in NPTEL domain courses for FDP certification and guide students enrolled under the NSCET NPTEL Local Chapter.',
        },
        {
          id: 'teaching',
          title: 'Teaching, Learning & Academic Documentation',
          summary:
            'Use the integrated Academic Documentation Assistant below to draft structured lesson plans, event circulars, and Bloom’s Taxonomy question blueprints.',
        },
      ],
      documents: docs.filter((d) =>
        ['Faculty Resource', 'Academic Regulations', 'Syllabus', 'Circular'].includes(d.category)
      ),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/college/faculty-assistant/draft
 * Generates structured academic documentation templates for authenticated Faculty/Admin.
 */
router.post('/faculty-assistant/draft', requireAuth, requireRole('faculty', 'admin'), (req, res) => {
  const docType = (req.body?.doc_type || 'lesson_plan').trim();
  const subjectOrTopic = (req.body?.topic || 'Engineering Course').trim().slice(0, 160);
  const department = (req.body?.department || req.user.department_name || 'Department').trim().slice(0, 120);
  const targetAudience = (req.body?.audience || 'UG Engineering Students').trim().slice(0, 120);

  let draft = '';
  if (docType === 'event_circular') {
    draft = `NADAR SARASWATHI COLLEGE OF ENGINEERING & TECHNOLOGY (NSCET)
Vadapudupatti, Theni, Tamil Nadu
Department of ${department}

CIRCULAR — TECHNICAL WORKSHOP / SEMINAR
Date: [Insert Official Date]
Ref: NSCET/${department.slice(0, 12).toUpperCase().replace(/\s+/g, '')}/[Insert Ref No]

Title: ${subjectOrTopic}
Target Participants: ${targetAudience}
Venue & Time: [Insert Seminar Hall / Lab & Schedule]

Objectives:
1. Introduce practical concepts and current industry workflows related to ${subjectOrTopic}.
2. Provide hands-on exposure aligned with Programme Outcomes (POs) and Course Outcomes (COs).

All eligible participants are requested to register with the Department Event Coordinator before [Insert Deadline].

Prepared By: ${req.user.full_name}
Forwarded Through: Head of Department, ${department}
Approved By: Principal, NSCET`;
  } else if (docType === 'question_blueprint') {
    draft = `NSCET ACADEMIC ASSESSMENT — QUESTION PAPER BLUEPRINT (BLOOM'S TAXONOMY)
Department: ${department}
Course / Subject: ${subjectOrTopic}
Target Batch: ${targetAudience}

PART A — Short Answer Questions (Knowledge & Comprehension: K1–K2)
- Q1–Q5: Fundamental definitions, principles, and concise conceptual checks (Mapped to CO1–CO2)

PART B — Analytical & Application Questions (Apply & Analyze: K3–K4)
- Q6 (a/b): Problem-solving / design derivation based on core theory (Mapped to CO2–CO3)
- Q7 (a/b): Comparative analysis / real-world engineering scenario (Mapped to CO3–CO4)

PART C — Case Study / Synthesis (Evaluate & Design: K5–K6)
- Q8: Integrated engineering design / evaluation question (Mapped to CO4–CO5)

Note: Verify exact mark distribution and pattern against current Anna University / NSCET Internal Assessment norms.`;
  } else {
    draft = `NADAR SARASWATHI COLLEGE OF ENGINEERING & TECHNOLOGY (NSCET)
COURSE LESSON PLAN OUTLINE
Department: ${department}
Course / Topic: ${subjectOrTopic}
Class / Batch: ${targetAudience}
Faculty: ${req.user.full_name}

Unit 1: Foundations & Core Terminology (Hours: [Verify Syllabus])
- Teaching Aids: Smart Board, Slides, Worked Examples
- Assessment: Short Quiz / Assignment 1

Unit 2: Core Methods & Analytical Models (Hours: [Verify Syllabus])
- Teaching Aids: Live Lab Demonstration, Problem Sheets
- Assessment: CIA Test 1

Unit 3: Applied Engineering & System Design (Hours: [Verify Syllabus])
- Teaching Aids: Case Study, Simulation / Coding Walkthrough
- Assessment: Mini-Project Milestone

Unit 4 & 5: Advanced Topics, Standards & Industry Practices (Hours: [Verify Syllabus])
- Teaching Aids: NPTEL Reference Lectures, Technical Paper Discussion
- Assessment: CIA Test 2 & Model Examination

[Reminder: Align exact unit titles, hours, and textbooks with the officially uploaded University Syllabus PDF.]`;
  }

  return res.json({ draft, docType });
});

export default router;
