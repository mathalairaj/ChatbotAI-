import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { SqliteAdapter } from './sqlite.js';
import { PostgresAdapter } from './postgres.js';
import {
  SEED_ROLES,
  SEED_DEPARTMENTS,
  SEED_FACULTY,
  SEED_PLACEMENT_INFO,
  SEED_DOCUMENTS,
} from './seedData.js';
import { indexTextAsDocument } from '../services/ragService.js';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database has not been initialized yet. Call initDatabase() first.');
  }
  return dbInstance;
}

export async function initDatabase(customSqlitePath = null) {
  if (env.databaseUrl && !customSqlitePath) {
    const pgAdapter = new PostgresAdapter(env.databaseUrl);
    await pgAdapter.init();
    dbInstance = pgAdapter;
  } else {
    const sqliteAdapter = new SqliteAdapter(customSqlitePath || env.sqliteDbPath);
    await sqliteAdapter.init();
    dbInstance = sqliteAdapter;
  }

  await seedInitialData(dbInstance);
  return dbInstance;
}

async function seedInitialData(db) {
  // 1. Seed Roles
  const roleMap = {};
  for (const r of SEED_ROLES) {
    const role = await db.upsertRole(r);
    roleMap[role.name] = role;
  }

  // 2. Seed 8 NSCET Departments
  const deptMap = {};
  for (const d of SEED_DEPARTMENTS) {
    const dept = await db.upsertDepartment(d);
    deptMap[dept.code] = dept;
  }

  // 3. Seed Demo Accounts (Clearly marked as demonstration credentials in UI/README)
  const demoUsers = [
    {
      role_id: roleMap.admin.id,
      department_id: null,
      full_name: 'NSCET System Administrator (Demo)',
      email: 'admin@nscet.edu.in',
      password: 'Admin@NSCET2026',
      register_number: null,
      academic_year: null,
    },
    {
      role_id: roleMap.faculty.id,
      department_id: deptMap.CSE?.id || null,
      full_name: 'Faculty Coordinator — CSE (Demo)',
      email: 'faculty@nscet.edu.in',
      password: 'Faculty@NSCET2026',
      register_number: null,
      academic_year: null,
    },
    {
      role_id: roleMap.student.id,
      department_id: deptMap.CSE?.id || null,
      full_name: 'Enrolled Student — CSE (Demo)',
      email: 'student@nscet.edu.in',
      password: 'Student@NSCET2026',
      register_number: 'DEMO-NSCET-CSE-001',
      academic_year: 'III Year',
    },
  ];

  let adminUser = null;
  for (const u of demoUsers) {
    let existing = await db.findUserByEmail(u.email);
    if (!existing) {
      const password_hash = await bcrypt.hash(u.password, 10);
      existing = await db.createUser({
        role_id: u.role_id,
        department_id: u.department_id,
        full_name: u.full_name,
        email: u.email,
        password_hash,
        register_number: u.register_number,
        academic_year: u.academic_year,
        is_active: true,
      });
    }
    if (u.email === 'admin@nscet.edu.in') adminUser = existing;
  }

  // 4. Seed Demo Faculty Placeholders (if empty)
  if ((await db.countFaculty()) === 0) {
    for (const f of SEED_FACULTY) {
      const dept = deptMap[f.dept_code];
      if (!dept) continue;
      await db.createFaculty({
        department_id: dept.id,
        full_name: f.full_name,
        designation: f.designation,
        qualification: f.qualification,
        specialization: f.specialization,
        email: f.email,
        research_interests: f.research_interests,
        is_demo_data: true,
      });
    }
  }

  // 5. Seed Placement Framework & Zero-Fabrication Policy (if empty)
  if ((await db.countPlacementInfo()) === 0) {
    for (const p of SEED_PLACEMENT_INFO) {
      await db.createPlacementInfo({
        ...p,
        published_by: adminUser?.id || null,
      });
    }
  }

  // 6. Seed Starter Knowledge Base RAG Documents (if empty)
  if ((await db.countDocuments()) === 0) {
    for (const doc of SEED_DOCUMENTS) {
      await indexTextAsDocument({
        db,
        title: doc.title,
        category: doc.category,
        accessLevel: doc.access_level,
        description: doc.description,
        content: doc.content,
        isVerifiedOfficial: doc.is_verified_official,
        uploadedBy: adminUser?.id || null,
      });
    }
  }
}
