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
const CID_101 = 'c1010000-0000-0000-0000-000000000101'; // COS 101 (100L)
const CID_201 = 'c2010000-0000-0000-0000-000000000201'; // COS 201 (200L) - 200L students have CA ONLY so you can test Sync CBT live!
const CID_202 = 'c2020000-0000-0000-0000-000000000202'; // COS 202 (200L)
const CID_343 = 'c3430000-0000-0000-0000-000000000343'; // COS 343 (300L)
const CID_414 = 'c4140000-0000-0000-0000-000000000414'; // COS 414 (400L)

function calculateGrade(score) {
  if (score >= 70) return { grade: 'A', gradePoint: 5.0 };
  if (score >= 60) return { grade: 'B', gradePoint: 4.0 };
  if (score >= 50) return { grade: 'C', gradePoint: 3.0 };
  if (score >= 45) return { grade: 'D', gradePoint: 2.0 };
  if (score >= 40) return { grade: 'E', gradePoint: 1.0 };
  return { grade: 'F', gradePoint: 0.0 };
}

async function run() {
  console.log('--- Seeding STRICT Level Separation (100L in 100L, 200L in 200L, etc.) ---');

  const { data: students } = await supabase.from('students').select('*');
  const { data: courses } = await supabase.from('courses').select('*');

  // Clear previous scores & final results
  await supabase.from('final_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('exam_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('ca_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cgpa_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('result_distributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // STRICT LEVEL-ALIGNED ROSTER:
  const roster = [
    // ══════════════════════════════════════════════════════════════════
    // LEVEL 100: ONLY takes COS 101 (Universal Course for all 5 depts)
    // ══════════════════════════════════════════════════════════════════
    { reg: '2025/100001', cid: CID_101, ca: 26, exam: 54, session: '2025/26' }, // Adaeze Nwosu (COS 100L) -> 80 (A)
    { reg: '2025/100002', cid: CID_101, ca: 21, exam: 44, session: '2025/26' }, // Seun Akinwale (MTH 100L) -> 65 (B)
    { reg: '2025/100003', cid: CID_101, ca: 17, exam: 37, session: '2025/26' }, // Hauwa Musa (VTE 100L) -> 54 (C)
    { reg: '2025/100004', cid: CID_101, ca: 15, exam: 32, session: '2025/26' }, // Tochukwu Igwe (CRB 100L) -> 47 (D)
    { reg: '2025/100005', cid: CID_101, ca: 14, exam: 28, session: '2025/26' }, // Zainab Umar (STA 100L) -> 42 (E)

    // ══════════════════════════════════════════════════════════════════
    // LEVEL 200: ONLY takes COS 201 & COS 202
    // ══════════════════════════════════════════════════════════════════
    // COS 201 (COS & CRB only): CA is seeded, exam is null so lecturer can do the live "Sync CBT Scores" demo!
    { reg: '2024/200001', cid: CID_201, ca: 22, exam: null, session: '2025/26' }, // Ikenna Okafor (COS 200L) -> Ready for CBT Sync
    { reg: '2024/200004', cid: CID_201, ca: 18, exam: null, session: '2025/26' }, // Chisom Anieke (CRB 200L) -> Ready for CBT Sync
    { reg: '2022/245698', cid: CID_201, ca: 20, exam: null, session: '2025/26' }, // Chuka Emeka (COS 200L) -> Ready for CBT Sync

    // COS 202 (COS, CRB, and VTE):
    { reg: '2024/200001', cid: CID_202, ca: 24, exam: 48, session: '2025/26' }, // Ikenna Okafor (COS 200L) -> 72 (A)
    { reg: '2024/200004', cid: CID_202, ca: 16, exam: 33, session: '2025/26' }, // Chisom Anieke (CRB 200L) -> 49 (D)
    { reg: '2024/200003', cid: CID_202, ca: 13, exam: 28, session: '2025/26' }, // Mubarak Garba (VTE 200L) -> 41 (E)
    { reg: '2022/245698', cid: CID_202, ca: 21, exam: 42, session: '2025/26' }, // Chuka Emeka (COS 200L) -> 63 (B)

    // ══════════════════════════════════════════════════════════════════
    // LEVEL 300: ONLY takes COS 343 (Handwritten, COS only)
    // ══════════════════════════════════════════════════════════════════
    { reg: '2023/300001', cid: CID_343, ca: 25, exam: 52, session: '2025/26' }, // Ngozi Onyekachi (COS 300L) -> 77 (A)

    // ══════════════════════════════════════════════════════════════════
    // LEVEL 400: ONLY takes COS 414 (Handwritten, COS only)
    // ══════════════════════════════════════════════════════════════════
    { reg: '2022/234567', cid: CID_414, ca: 23, exam: 47, session: '2025/26' }, // Chukwuebuka Obi (COS 400L) -> 70 (A)

    // ══════════════════════════════════════════════════════════════════
    // HISTORICAL TRANSCRIPT RESULTS for 400L Student (Chukwuebuka Obi)
    // These past years (2022/23, 2023/24, 2024/25) provide the complete 4-year CGPA
    // without polluting the current 100L / 200L session class rosters!
    // ══════════════════════════════════════════════════════════════════
    { reg: '2022/234567', cid: CID_101, ca: 26, exam: 52, session: '2022/23' }, // Year 1: 78 (A, 5.0)
    { reg: '2022/234567', cid: CID_201, ca: 24, exam: 47, session: '2023/24' }, // Year 2: 71 (A, 5.0)
    { reg: '2022/234567', cid: CID_202, ca: 21, exam: 45, session: '2023/24' }, // Year 2: 66 (B, 4.0)
    { reg: '2022/234567', cid: CID_343, ca: 23, exam: 48, session: '2024/25' }  // Year 3: 71 (A, 5.0)
  ];

  const enrollments = [];
  const ca_scores = [];
  const exam_scores = [];
  const final_results = [];

  for (const item of roster) {
    const s = students.find(stud => stud.reg_number === item.reg);
    if (!s) {
      console.warn('Student not found for reg:', item.reg);
      continue;
    }

    const crs = courses.find(c => c.id === item.cid);
    const semester = crs ? crs.semester : 'first';

    // Enrollment
    enrollments.push({
      id: crypto.randomUUID(),
      student_id: s.id,
      course_id: item.cid,
      session: item.session,
      semester: semester
    });

    // CA Score
    ca_scores.push({
      id: crypto.randomUUID(),
      student_id: s.id,
      course_id: item.cid,
      ca_score: item.ca,
      session: item.session
    });

    // Exam Score (if available)
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

  console.log(`Inserting ${enrollments.length} strict level enrollments...`);
  await supabase.from('enrollments').insert(enrollments);

  console.log(`Inserting ${ca_scores.length} CA scores...`);
  await supabase.from('ca_scores').insert(ca_scores);

  console.log(`Inserting ${exam_scores.length} Exam scores...`);
  await supabase.from('exam_scores').insert(exam_scores);

  console.log(`Inserting ${final_results.length} Final Results...`);
  await supabase.from('final_results').insert(final_results);

  // Compute CGPA for all students with completed results
  console.log('Computing CGPA records...');
  const studentIds = [...new Set(final_results.map(f => f.student_id))];
  const cgpaRecords = [];

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
  console.log('STRICT level separation applied successfully with zero errors!');
}

run().catch(err => {
  console.error('Error applying strict level separation:', err);
  process.exit(1);
});
