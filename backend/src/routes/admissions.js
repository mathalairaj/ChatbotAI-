import { Router } from 'express';
import { getDb } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { isValidEmail, isValidPhone } from '../middleware/security.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

const VALID_STATUSES = new Set(['new', 'contacted', 'counselled', 'admitted', 'closed']);

/**
 * GET /api/admissions/info
 * Verified structural admissions guidance (zero fabricated fees, cutoffs, or deadlines).
 */
router.get('/info', (_req, res) => {
  return res.json({
    institution: 'Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni, Tamil Nadu',
    programmes: {
      ug: [
        'B.E. Computer Science and Engineering',
        'B.Tech. Artificial Intelligence and Data Science',
        'B.Tech. Information Technology',
        'B.E. Electronics and Communication Engineering',
        'B.E. Electrical and Electronics Engineering',
        'B.E. Mechanical Engineering',
        'B.E. Civil Engineering',
      ],
      pg: ['M.E. Computer Science and Engineering'],
    },
    admissionModes: [
      {
        title: 'TNEA Single Window Counselling (UG)',
        description:
          'Admissions to B.E. / B.Tech. programmes through Tamil Nadu Engineering Admissions (TNEA) as per Government of Tamil Nadu and Directorate of Technical Education (DoTE) norms.',
      },
      {
        title: 'Management Quota Enquiries',
        description:
          'Prospective candidates and parents may register an Admission Enquiry below or visit the NSCET Admission Office directly for official management quota procedures.',
      },
      {
        title: 'PG Admission (M.E. CSE)',
        description:
          'Postgraduate admissions follow current academic year Tamil Nadu PG engineering admission norms (e.g., TANCET / CEETA-PG / consortium guidelines). Confirm exact requirements with the Admission Office.',
      },
    ],
    verificationPolicy: {
      eligibility: 'Exact minimum mark percentages and TNEA cutoff ranks are governed by current academic year Anna University / DoTE norms. Verify with the NSCET Admission Office.',
      feeStructure: 'Official tuition, hostel, and transport fees are issued directly by the NSCET Administrative / Admission Office. This portal never estimates or invents fee figures.',
      scholarships: 'Applicable government and institutional scholarships (such as First Graduate, Post-Matric, BC/MBC/SC/ST, or Merit schemes) are verified during admission counselling. Contact the Scholarship & Admission Cell for exact eligibility and amounts.',
      deadlines: 'Current academic year counselling and application deadlines follow official TNEA / University notifications.',
    },
    requiredCertificatesChecklist: [
      '10th Standard Mark Sheet',
      '11th & 12th Standard (HSC) Mark Sheets (or Diploma Mark Sheets for Lateral Entry; UG Degree & Consolidated Mark Sheet for M.E.)',
      'Transfer Certificate (TC) & Conduct Certificate',
      'Community Certificate (if applicable)',
      'Nativity Certificate / First Graduate Certificate / Income Certificate (if applying for applicable government schemes)',
      'TNEA Allotment Order (for counselling candidates)',
      'Recent Passport-Size Photographs & Valid Photo ID Proof (e.g., Aadhaar)',
    ],
  });
});

/**
 * POST /api/admissions/enquiries
 * Public endpoint for prospective students/parents to submit an admission enquiry.
 */
router.post('/enquiries', async (req, res, next) => {
  try {
    const fullName = (req.body?.full_name || '').trim();
    const email = (req.body?.email || '').trim().toLowerCase();
    const phone = (req.body?.phone || '').trim();
    const cityDistrict = (req.body?.city_district || '').trim();
    const programmeLevel = req.body?.programme_level === 'PG' ? 'PG' : 'UG';
    const preferredDepartment = (req.body?.preferred_department || '').trim();
    const admissionMode = (req.body?.admission_mode || 'TNEA Counselling').trim();
    const qualificationDetails = (req.body?.qualification_details || '').trim();
    const message = (req.body?.message || '').trim();

    if (fullName.length < 2 || fullName.length > 140) {
      return res.status(400).json({ error: 'Please enter the applicant full name (2–140 characters).' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Please enter a valid phone/mobile number.' });
    }
    if (!preferredDepartment) {
      return res.status(400).json({ error: 'Please select a preferred department/programme.' });
    }

    const db = getDb();
    const enquiry = await db.createAdmissionEnquiry({
      full_name: fullName,
      email,
      phone,
      city_district: cityDistrict,
      programme_level: programmeLevel,
      preferred_department: preferredDepartment,
      admission_mode: admissionMode,
      qualification_details: qualificationDetails,
      message,
    });

    await recordAudit({
      req,
      action: 'ADMISSION_ENQUIRY_SUBMITTED',
      resourceType: 'admission_enquiry',
      resourceId: enquiry.id,
      details: {
        reference_code: enquiry.reference_code,
        programme_level: enquiry.programme_level,
        preferred_department: enquiry.preferred_department,
      },
    });

    return res.status(201).json({
      enquiry,
      confirmation: `Thank you, ${enquiry.full_name}. Your NSCET Admission Enquiry (${enquiry.reference_code}) has been recorded. Our Admission Office will contact you with verified details.`,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admissions/enquiries (Admin only)
 */
router.get('/enquiries', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDb();
    const enquiries = await db.listAdmissionEnquiries({ status: req.query.status || null });
    return res.json({ enquiries });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/admissions/enquiries/:id (Admin only)
 */
router.patch('/enquiries/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const patch = {};
    if (req.body?.status !== undefined) {
      if (!VALID_STATUSES.has(req.body.status)) {
        return res.status(400).json({ error: 'Invalid enquiry status.' });
      }
      patch.status = req.body.status;
    }
    if (req.body?.admin_notes !== undefined) {
      patch.admin_notes = String(req.body.admin_notes).slice(0, 1000);
    }

    const db = getDb();
    const updated = await db.updateAdmissionEnquiry(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Enquiry not found.' });

    await recordAudit({
      req,
      action: 'ADMISSION_ENQUIRY_UPDATED',
      resourceType: 'admission_enquiry',
      resourceId: updated.id,
      details: patch,
    });

    return res.json({ enquiry: updated });
  } catch (err) {
    return next(err);
  }
});

export default router;
