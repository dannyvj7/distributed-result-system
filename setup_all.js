const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function run() {
  console.log('1. Updating department d5555555 to Statistics (STA)...');
  const { error: dErr } = await supabase.from('departments').update({
    name: 'Statistics',
    code: 'STA',
    faculty: 'Faculty of Physical Sciences'
  }).eq('id', 'd5555555-5555-5555-5555-555555555555');
  console.log('Dept update error:', dErr);

  console.log('2. Inserting HOD for Statistics...');
  const { error: uErr } = await supabase.from('users').upsert({
    id: 'a9999999-aaaa-aaaa-aaaa-aaaaaaaaaa03',
    email: 'hod.sta@institution.edu.ng',
    password_hash: 'password123',
    full_name: 'Prof. Kenneth C. Ugwu',
    role: 'hod',
    department_id: 'd5555555-5555-5555-5555-555555555555'
  }, { onConflict: 'id' });
  console.log('User STA error:', uErr);

  const { error: pErr } = await supabase.from('hod_profiles').upsert({
    id: 'f5555555-5555-5555-5555-555555555555',
    user_id: 'a9999999-aaaa-aaaa-aaaa-aaaaaaaaaa03',
    full_name: 'Prof. Kenneth C. Ugwu',
    department_id: 'd5555555-5555-5555-5555-555555555555',
    rank: 'Professor of Applied Statistics',
    phone: '+234 803 765 4321',
    signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">K.C.Ugwu</text></svg>'
  }, { onConflict: 'id' });
  console.log('Profile STA error:', pErr);

  console.log('3. Inserting Director of General Studies (SGS)...');
  const { error: sgsErr } = await supabase.from('users').upsert({
    id: 'a0000000-aaaa-aaaa-aaaa-aaaaaaaaaa00',
    email: 'director.sgs@institution.edu.ng',
    password_hash: 'password123',
    full_name: 'Prof. (Mrs.) Ijeoma Okoye',
    role: 'hod',
    department_id: 'd1111111-1111-1111-1111-111111111111'
  }, { onConflict: 'id' });
  console.log('User SGS error:', sgsErr);

  console.log('4. Adding General Course GSP101 (Use of English)...');
  const { error: cErr } = await supabase.from('courses').upsert({
    id: 'c5555555-5555-5555-5555-555555555555',
    code: 'GSP101',
    title: 'Use of English',
    credit_units: 2,
    semester: 'first',
    session: '2025/26',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad'
  }, { onConflict: 'code,session' });
  console.log('Course GSP101 error:', cErr);

  console.log('5. Enrolling students into courses according to your rules...');
  // Students:
  // d1111111: Computer Science (COS) -> takes COS401, COS403, COS405, GSP101
  // d2222222: Mathematics (MTH)     -> takes GSP101 (DOES NOT take COS courses!)
  // d3333333: VTE (VTE)              -> takes COS401, COS403, GSP101
  // d4444444: Computer Robotics (CRB)-> takes COS401, COS403, GSP101
  // d5555555: Statistics (STA)       -> takes GSP101 (DOES NOT take COS courses!)

  // Fetch all students
  const { data: studs } = await supabase.from('students').select('*');
  const newEnrollments = [];

  for (const s of studs) {
    // Every single student takes GSP101
    newEnrollments.push({
      student_id: s.id,
      course_id: 'c5555555-5555-5555-5555-555555555555', // GSP101
      session: '2025/26',
      semester: 'first'
    });

    // Only COS, CRB, and VTE students take COS401 & COS403
    if (['d1111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444'].includes(s.department_id)) {
      newEnrollments.push({
        student_id: s.id,
        course_id: 'c1111111-1111-1111-1111-111111111111', // COS401
        session: '2025/26',
        semester: 'first'
      });
      newEnrollments.push({
        student_id: s.id,
        course_id: 'c2222222-2222-2222-2222-222222222222', // COS403
        session: '2025/26',
        semester: 'first'
      });
    }
  }

  // Clear old enrollments and insert fresh
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: enrErr } = await supabase.from('enrollments').insert(newEnrollments);
  console.log('Enrollments insert count:', newEnrollments.length, 'Error:', enrErr);

  // Seed sample GSP101 scores for students across all departments
  const gspExams = [];
  const gspCas = [];
  const gspFinals = [];

  for (const s of studs) {
    const examScore = 50 + (s.level % 15);
    const caScore = 20 + (s.level % 8);
    const total = examScore + caScore;
    const grade = total >= 70 ? 'A' : total >= 60 ? 'B' : 'C';
    const gradePoint = grade === 'A' ? 5.0 : grade === 'B' ? 4.0 : 3.0;

    gspExams.push({
      student_id: s.id,
      course_id: 'c5555555-5555-5555-5555-555555555555',
      exam_score: examScore,
      session: '2025/26'
    });
    gspCas.push({
      student_id: s.id,
      course_id: 'c5555555-5555-5555-5555-555555555555',
      ca_score: caScore,
      session: '2025/26'
    });
    gspFinals.push({
      student_id: s.id,
      course_id: 'c5555555-5555-5555-5555-555555555555',
      ca_score: caScore,
      exam_score: examScore,
      total_score: total,
      grade,
      grade_point: gradePoint,
      status: 'approved',
      session: '2025/26'
    });
  }

  await supabase.from('exam_scores').upsert(gspExams, { onConflict: 'student_id,course_id,session' });
  await supabase.from('ca_scores').upsert(gspCas, { onConflict: 'student_id,course_id,session' });
  await supabase.from('final_results').upsert(gspFinals, { onConflict: 'student_id,course_id,session' });
  console.log('GSP101 seeded with all-department student scores!');

  console.log('ALL UPDATES COMPLETE!');
}

run();
