const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const DEPT_COS = 'd1111111-1111-1111-1111-111111111111';
const DEPT_MTH = 'd2222222-2222-2222-2222-222222222222';
const DEPT_VTE = 'd3333333-3333-3333-3333-333333333333';
const DEPT_CRB = 'd4444444-4444-4444-4444-444444444444';
const DEPT_STA = 'd5555555-5555-5555-5555-555555555555';
const DEPT_EXAMS = 'd0000000-0000-0000-0000-000000000000';

const HOD_COS_USER = 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaab';

// The 5 Courses
const CID_101 = 'c1010000-0000-0000-0000-000000000101'; // COS 101 (100L, 2U)
const CID_201 = 'c2010000-0000-0000-0000-000000000201'; // COS 201 (200L, 2U)
const CID_202 = 'c2020000-0000-0000-0000-000000000202'; // COS 202 (200L, 2U)
const CID_343 = 'c3430000-0000-0000-0000-000000000343'; // COS 343 (300L, 3U)
const CID_414 = 'c4140000-0000-0000-0000-000000000414'; // COS 414 (400L, 3U)

const cohortStudents = [
  // ── 100 Level (10 students: 2 per department) ──────────────────────────
  { id: 'b1000001-0000-0000-0000-000000000001', reg_number: '2025/100001', full_name: 'Adaeze Nwosu', department_id: DEPT_COS, level: 100 },
  { id: 'b1000002-0000-0000-0000-000000000002', reg_number: '2025/100002', full_name: 'Seun Akinwale', department_id: DEPT_MTH, level: 100 },
  { id: 'b1000003-0000-0000-0000-000000000003', reg_number: '2025/100003', full_name: 'Hauwa Musa', department_id: DEPT_VTE, level: 100 },
  { id: 'b1000004-0000-0000-0000-000000000004', reg_number: '2025/100004', full_name: 'Tochukwu Igwe', department_id: DEPT_CRB, level: 100 },
  { id: 'b1000005-0000-0000-0000-000000000005', reg_number: '2025/100005', full_name: 'Zainab Umar', department_id: DEPT_STA, level: 100 },
  { id: 'b1000006-0000-0000-0000-000000000006', reg_number: '2025/100006', full_name: 'Somtochukwu Eze', department_id: DEPT_COS, level: 100 },
  { id: 'b1000007-0000-0000-0000-000000000007', reg_number: '2025/100007', full_name: 'Maryam Usman', department_id: DEPT_MTH, level: 100 },
  { id: 'b1000008-0000-0000-0000-000000000008', reg_number: '2025/100008', full_name: 'Victor Oladipo', department_id: DEPT_VTE, level: 100 },
  { id: 'b1000009-0000-0000-0000-000000000009', reg_number: '2025/100009', full_name: 'Praise Nwachukwu', department_id: DEPT_CRB, level: 100 },
  { id: 'b1000010-0000-0000-0000-000000000010', reg_number: '2025/100010', full_name: 'Kenneth Onyema', department_id: DEPT_STA, level: 100 },

  // ── 200 Level (5 students: COS, CRB, VTE) ───────────────────────────────
  { id: 'b2000001-0000-0000-0000-000000000001', reg_number: '2024/200001', full_name: 'Ikenna Okafor', department_id: DEPT_COS, level: 200 },
  { id: 'b2000002-0000-0000-0000-000000000002', reg_number: '2024/200002', full_name: 'Cynthia Kalu', department_id: DEPT_COS, level: 200 },
  { id: 'b2000003-0000-0000-0000-000000000003', reg_number: '2024/200003', full_name: 'Mubarak Garba', department_id: DEPT_VTE, level: 200 },
  { id: 'b2000004-0000-0000-0000-000000000004', reg_number: '2024/200004', full_name: 'Chisom Anieke', department_id: DEPT_CRB, level: 200 },
  { id: 'b2000005-0000-0000-0000-000000000005', reg_number: '2024/200005', full_name: 'David Alabi', department_id: DEPT_CRB, level: 200 },

  // ── 300 Level (3 students: COS) ─────────────────────────────────────────
  { id: 'b3000001-0000-0000-0000-000000000001', reg_number: '2023/300001', full_name: 'Ngozi Onyekachi', department_id: DEPT_COS, level: 300 },
  { id: 'b3000002-0000-0000-0000-000000000002', reg_number: '2023/300002', full_name: 'Tunde Bakare', department_id: DEPT_COS, level: 300 },
  { id: 'b3000003-0000-0000-0000-000000000003', reg_number: '2023/300003', full_name: 'Chinaza Ebere', department_id: DEPT_COS, level: 300 },

  // ── 400 Level (3 graduating students: COS) ──────────────────────────────
  { id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', reg_number: '2022/234567', full_name: 'Chukwuebuka Obi', department_id: DEPT_COS, level: 400 },
  { id: 'b4000002-0000-0000-0000-000000000002', reg_number: '2022/234568', full_name: 'Emeka Okafor', department_id: DEPT_COS, level: 400 },
  { id: 'b4000003-0000-0000-0000-000000000003', reg_number: '2022/234569', full_name: 'Blessing Danjuma', department_id: DEPT_COS, level: 400 }
];

function calculateGrade(score) {
  if (score >= 70) return { grade: 'A', gradePoint: 5.0 };
  if (score >= 60) return { grade: 'B', gradePoint: 4.0 };
  if (score >= 50) return { grade: 'C', gradePoint: 3.0 };
  if (score >= 45) return { grade: 'D', gradePoint: 2.0 };
  if (score >= 40) return { grade: 'E', gradePoint: 1.0 };
  return { grade: 'F', gradePoint: 0.0 };
}

async function run() {
  console.log('--- Populating Ideal Realistic Cohort of 21 Students ---');

  // Fetch existing students from Supabase
  const { data: existingStudents } = await supabase.from('students').select('*');

  console.log(`1. Ensuring ${cohortStudents.length} students exist in database...`);
  for (const s of cohortStudents) {
    const existing = existingStudents.find(st => st.reg_number === s.reg_number);
    let studentId;
    if (existing) {
      studentId = existing.id;
      await supabase.from('students').update({
        full_name: s.full_name,
        department_id: s.department_id,
        level: s.level
      }).eq('id', studentId);
    } else {
      studentId = crypto.randomUUID();
      await supabase.from('students').insert({
        id: studentId,
        reg_number: s.reg_number,
        full_name: s.full_name,
        department_id: s.department_id,
        level: s.level,
        session: '2025/26'
      });
    }

    // Upsert student login account in users table
    const email = `${s.reg_number.replace('/', '_')}@student.institution.edu.ng`;
    await supabase.from('users').upsert({
      id: studentId,
      email: email,
      password_hash: 'student123',
      full_name: s.full_name,
      role: 'student',
      department_id: s.department_id
    }, { onConflict: 'id' });
  }

  // Clear previous scores & distributions
  console.log('2. Clearing old scores for fresh clean seed...');
  await supabase.from('final_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('exam_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('ca_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cgpa_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('result_distributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Complete Grade Schedule
  const schedule = [
    // ══════════════════════════════════════════════════════════════════
    // LEVEL 100: ONLY takes COS 101 (2 Students per Dept = 10 total)
    // Diverse Grades: A, B, C, D, E, F
    // ══════════════════════════════════════════════════════════════════
    { reg: '2025/100001', cid: CID_101, ca: 27, exam: 55, session: '2025/26' }, // Adaeze Nwosu (COS) -> 82 (A)
    { reg: '2025/100006', cid: CID_101, ca: 21, exam: 44, session: '2025/26' }, // Somtochukwu Eze (COS) -> 65 (B)
    { reg: '2025/100002', cid: CID_101, ca: 20, exam: 42, session: '2025/26' }, // Seun Akinwale (MTH) -> 62 (B)
    { reg: '2025/100007', cid: CID_101, ca: 12, exam: 25, session: '2025/26' }, // Maryam Usman (MTH) -> 37 (F) -> FAIL
    { reg: '2025/100003', cid: CID_101, ca: 18, exam: 38, session: '2025/26' }, // Hauwa Musa (VTE) -> 56 (C)
    { reg: '2025/100008', cid: CID_101, ca: 15, exam: 31, session: '2025/26' }, // Victor Oladipo (VTE) -> 46 (D)
    { reg: '2025/100004', cid: CID_101, ca: 16, exam: 33, session: '2025/26' }, // Tochukwu Igwe (CRB) -> 49 (D)
    { reg: '2025/100009', cid: CID_101, ca: 22, exam: 47, session: '2025/26' }, // Praise Nwachukwu (CRB) -> 69 (B)
    { reg: '2025/100005', cid: CID_101, ca: 14, exam: 28, session: '2025/26' }, // Zainab Umar (STA) -> 42 (E)
    { reg: '2025/100010', cid: CID_101, ca: 19, exam: 39, session: '2025/26' }, // Kenneth Onyema (STA) -> 58 (C)

    // ══════════════════════════════════════════════════════════════════
    // LEVEL 200: ONLY takes COS 201 & COS 202
    // COS 201: (COS & CRB only) - CA uploaded, exam pending for live demo sync!
    // ══════════════════════════════════════════════════════════════════
    { reg: '2024/200001', cid: CID_201, ca: 24, exam: null, session: '2025/26' }, // Ikenna Okafor (COS) -> Live Sync Demo
    { reg: '2024/200002', cid: CID_201, ca: 20, exam: null, session: '2025/26' }, // Cynthia Kalu (COS) -> Live Sync Demo
    { reg: '2024/200004', cid: CID_201, ca: 17, exam: null, session: '2025/26' }, // Chisom Anieke (CRB) -> Live Sync Demo
    { reg: '2024/200005', cid: CID_201, ca: 19, exam: null, session: '2025/26' }, // David Alabi (CRB) -> Live Sync Demo

    // COS 202: (COS, CRB, and VTE)
    { reg: '2024/200001', cid: CID_202, ca: 25, exam: 51, session: '2025/26' }, // Ikenna Okafor (COS) -> 76 (A)
    { reg: '2024/200002', cid: CID_202, ca: 20, exam: 43, session: '2025/26' }, // Cynthia Kalu (COS) -> 63 (B)
    { reg: '2024/200004', cid: CID_202, ca: 16, exam: 32, session: '2025/26' }, // Chisom Anieke (CRB) -> 48 (D)
    { reg: '2024/200005', cid: CID_202, ca: 18, exam: 37, session: '2025/26' }, // David Alabi (CRB) -> 55 (C)
    { reg: '2024/200003', cid: CID_202, ca: 13, exam: 28, session: '2025/26' }, // Mubarak Garba (VTE) -> 41 (E)

    // ══════════════════════════════════════════════════════════════════
    // LEVEL 300: ONLY takes COS 343 (3 Students, COS only)
    // ══════════════════════════════════════════════════════════════════
    { reg: '2023/300001', cid: CID_343, ca: 25, exam: 51, session: '2025/26' }, // Ngozi Onyekachi (COS) -> 76 (A)
    { reg: '2023/300002', cid: CID_343, ca: 21, exam: 43, session: '2025/26' }, // Tunde Bakare (COS) -> 64 (B)
    { reg: '2023/300003', cid: CID_343, ca: 16, exam: 33, session: '2025/26' }, // Chinaza Ebere (COS) -> 49 (D)

    // ══════════════════════════════════════════════════════════════════
    // LEVEL 400: ONLY takes COS 414 (3 Graduating Students, COS only)
    // ══════════════════════════════════════════════════════════════════
    { reg: '2022/234567', cid: CID_414, ca: 23, exam: 48, session: '2025/26' }, // Chukwuebuka Obi -> 71 (A)
    { reg: '2022/234568', cid: CID_414, ca: 20, exam: 44, session: '2025/26' }, // Emeka Okafor -> 64 (B)
    { reg: '2022/234569', cid: CID_414, ca: 17, exam: 37, session: '2025/26' }, // Blessing Danjuma -> 54 (C)

    // ══════════════════════════════════════════════════════════════════
    // HISTORICAL 4-YEAR TRANSCRIPTS for Graduating 400L Students
    // Past sessions (2022/23, 2023/24, 2024/25) give full CGPA degree classes!
    // ══════════════════════════════════════════════════════════════════
    // Student 1: Chukwuebuka Obi -> First Class (4.83 CGPA)
    { reg: '2022/234567', cid: CID_101, ca: 26, exam: 52, session: '2022/23' }, // 100L: 78 (A, 5.0)
    { reg: '2022/234567', cid: CID_201, ca: 24, exam: 47, session: '2023/24' }, // 200L: 71 (A, 5.0)
    { reg: '2022/234567', cid: CID_202, ca: 21, exam: 45, session: '2023/24' }, // 200L: 66 (B, 4.0)
    { reg: '2022/234567', cid: CID_343, ca: 23, exam: 48, session: '2024/25' }, // 300L: 71 (A, 5.0)

    // Student 2: Emeka Okafor -> 2nd Class Upper (3.83 CGPA)
    { reg: '2022/234568', cid: CID_101, ca: 21, exam: 43, session: '2022/23' }, // 100L: 64 (B, 4.0)
    { reg: '2022/234568', cid: CID_201, ca: 18, exam: 40, session: '2023/24' }, // 200L: 58 (C, 3.0)
    { reg: '2022/234568', cid: CID_202, ca: 20, exam: 42, session: '2023/24' }, // 200L: 62 (B, 4.0)
    { reg: '2022/234568', cid: CID_343, ca: 22, exam: 45, session: '2024/25' }, // 300L: 67 (B, 4.0)

    // Student 3: Blessing Danjuma -> 2nd Class Lower (2.58 CGPA)
    { reg: '2022/234569', cid: CID_101, ca: 16, exam: 36, session: '2022/23' }, // 100L: 52 (C, 3.0)
    { reg: '2022/234569', cid: CID_201, ca: 15, exam: 31, session: '2023/24' }, // 200L: 46 (D, 2.0)
    { reg: '2022/234569', cid: CID_202, ca: 17, exam: 37, session: '2023/24' }, // 200L: 54 (C, 3.0)
    { reg: '2022/234569', cid: CID_343, ca: 16, exam: 32, session: '2024/25' }  // 300L: 48 (D, 2.0)
  ];

  const enrollments = [];
  const ca_scores = [];
  const exam_scores = [];
  const final_results = [];

  // Fetch current database students so student_id matches existing DB records
  const { data: dbStudents } = await supabase.from('students').select('*');

  for (const item of schedule) {
    const s = dbStudents.find(stud => stud.reg_number === item.reg);
    if (!s) {
      console.warn('Student not found for reg:', item.reg);
      continue;
    }

    const crs = (await supabase.from('courses').select('*')).data.find(c => c.id === item.cid);
    const semester = crs ? crs.semester : 'first';

    enrollments.push({
      id: crypto.randomUUID(),
      student_id: s.id,
      course_id: item.cid,
      session: item.session,
      semester: semester
    });

    ca_scores.push({
      id: crypto.randomUUID(),
      student_id: s.id,
      course_id: item.cid,
      ca_score: item.ca,
      session: item.session
    });

    if (item.exam !== null) {
      exam_scores.push({
        id: crypto.randomUUID(),
        student_id: s.id,
        course_id: item.cid,
        exam_score: item.exam,
        session: item.session
      });

      const total = item.ca + item.exam;
      const { grade, gradePoint } = calculateGrade(total);

      final_results.push({
        id: crypto.randomUUID(),
        student_id: s.id,
        course_id: item.cid,
        ca_score: item.ca,
        exam_score: item.exam,
        total_score: total,
        grade: grade,
        grade_point: gradePoint,
        status: 'distributed',
        session: item.session
      });
    }
  }

  console.log(`Inserting ${enrollments.length} enrollments...`);
  await supabase.from('enrollments').insert(enrollments);

  console.log(`Inserting ${ca_scores.length} CA scores...`);
  await supabase.from('ca_scores').insert(ca_scores);

  console.log(`Inserting ${exam_scores.length} Exam scores...`);
  await supabase.from('exam_scores').insert(exam_scores);

  console.log(`Inserting ${final_results.length} Final Results...`);
  await supabase.from('final_results').insert(final_results);

  // Compute CGPA for students
  console.log('Computing CGPA records...');
  const studentIds = [...new Set(final_results.map(f => f.student_id))];
  const cgpaRecords = [];
  const courses = (await supabase.from('courses').select('*')).data;

  for (const sid of studentIds) {
    const sFinals = final_results.filter(f => f.student_id === sid);
    let units = 0;
    let qp = 0;
    for (const f of sFinals) {
      const crs = courses.find(c => c.id === f.course_id);
      const u = crs ? Number(crs.credit_units) : 3;
      units += u;
      qp += (u * Number(f.grade_point || 0));
    }
    const cgpa = units > 0 ? Number((qp / units).toFixed(2)) : 0;
    let classification = 'Fail';
    if (cgpa >= 4.5) classification = 'First Class Honours';
    else if (cgpa >= 3.5) classification = 'Second Class Honours (Upper Division)';
    else if (cgpa >= 2.4) classification = 'Second Class Honours (Lower Division)';
    else if (cgpa >= 1.5) classification = 'Third Class Honours';
    else if (cgpa >= 1.0) classification = 'Pass';

    cgpaRecords.push({
      id: crypto.randomUUID(),
      student_id: sid,
      total_credit_units: units,
      total_quality_points: qp,
      cgpa,
      classification,
      last_updated: new Date().toISOString()
    });
  }

  await supabase.from('cgpa_records').insert(cgpaRecords);
  console.log(`Computed CGPA for ${cgpaRecords.length} students.`);

  // Create Distributions for 2025/26
  console.log('Creating Result Distributions with copy to Central Examinations Unit...');
  const distributions = [
    // COS 101 to all 4 recipient depts + exam_office
    {
      id: crypto.randomUUID(),
      course_id: CID_101,
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_CRB,
      status: 'sent',
      sent_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: CID_101,
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_VTE,
      status: 'sent',
      sent_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: CID_101,
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_MTH,
      status: 'sent',
      sent_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: CID_101,
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_STA,
      status: 'sent',
      sent_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: CID_101,
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_EXAMS,
      status: 'sent',
      sent_at: new Date().toISOString()
    },

    // COS 202 to CRB + VTE + DEPT_EXAMS
    {
      id: crypto.randomUUID(),
      course_id: CID_202,
      session: '2025/26',
      semester: 'second',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_CRB,
      status: 'sent',
      sent_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: CID_202,
      session: '2025/26',
      semester: 'second',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_VTE,
      status: 'sent',
      sent_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: CID_202,
      session: '2025/26',
      semester: 'second',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_EXAMS,
      status: 'sent',
      sent_at: new Date().toISOString()
    },

    // COS 343 & COS 414 to DEPT_EXAMS
    {
      id: crypto.randomUUID(),
      course_id: CID_343,
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_EXAMS,
      status: 'sent',
      sent_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: CID_414,
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: HOD_COS_USER,
      received_by_dept_id: DEPT_EXAMS,
      status: 'sent',
      sent_at: new Date().toISOString()
    }
  ];

  await supabase.from('result_distributions').insert(distributions);
  console.log(`Inserted ${distributions.length} result distributions.`);
  console.log('Ideal cohort of 21 students populated successfully!');
}

run().catch(err => {
  console.error('Error populating ideal cohort:', err);
  process.exit(1);
});
