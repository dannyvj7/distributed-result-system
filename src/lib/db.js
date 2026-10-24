import { supabase } from './supabase'
import { calculateGrade, calculateCGPA, normalizeRegNumber } from './grading'

const STORAGE_KEY = 'dist_results_system_data_v16'

const initialSeedData = {
  departments: [
    { id: 'd1111111-1111-1111-1111-111111111111', name: 'Computer Science', code: 'COS', faculty: 'Faculty of Physical Sciences' },
    { id: 'd2222222-2222-2222-2222-222222222222', name: 'Mathematics', code: 'MTH', faculty: 'Faculty of Physical Sciences' },
    { id: 'd3333333-3333-3333-3333-333333333333', name: 'Vocational & Technology Education', code: 'VTE', faculty: 'Faculty of Vocational and Technical Education' },
    { id: 'd4444444-4444-4444-4444-444444444444', name: 'Computer Robotics', code: 'CRB', faculty: 'Faculty of Education' },
    { id: 'd5555555-5555-5555-5555-555555555555', name: 'Statistics', code: 'STA', faculty: 'Faculty of Physical Sciences' },
    { id: 'd0000000-0000-0000-0000-000000000000', name: 'Examinations & Records Unit', code: 'EXAM-OFFICE', faculty: 'University Registry' }
  ],
  users: [
    {
      id: 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'admin@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Engr. Kenneth Okonjo (ICT Admin)',
      role: 'admin',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaab',
      email: 'hod.csc@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. (Mrs.) Ifeoma Nwokoye',
      role: 'hod',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaac',
      email: 'hod.mth@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. Chinwe Okeke',
      role: 'hod',
      department_id: 'd2222222-2222-2222-2222-222222222222'
    },
    {
      id: 'a7777777-aaaa-aaaa-aaaa-aaaaaaaaaa01',
      email: 'hod.vte@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Prof. Augustine O. Eze',
      role: 'hod',
      department_id: 'd3333333-3333-3333-3333-333333333333'
    },
    {
      id: 'a8888888-aaaa-aaaa-aaaa-aaaaaaaaaa02',
      email: 'hod.crb@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. Grace N. Danjuma',
      role: 'hod',
      department_id: 'd4444444-4444-4444-4444-444444444444'
    },
    {
      id: 'a9999999-aaaa-aaaa-aaaa-aaaaaaaaaa03',
      email: 'hod.mee@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Engr. Dr. Mustapha Bello',
      role: 'hod',
      department_id: 'd5555555-5555-5555-5555-555555555555'
    },
    {
      id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad',
      email: 'lecturer.csc@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. Aminu Ibrahim',
      role: 'lecturer',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa21',
      email: 'lecturer.eze@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. Ngozi Eze',
      role: 'lecturer',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa22',
      email: 'lecturer.fashola@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. Babatunde Fashola',
      role: 'lecturer',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa31',
      email: 'lecturer.ugwu@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. Ifeanyi Ugwu',
      role: 'lecturer',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa41',
      email: 'lecturer.akpan@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Prof. Chukwuma Akpan',
      role: 'lecturer',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaae',
      email: 'exam.officer@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Mrs. Folake Adebayo',
      role: 'exam_officer',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a6666666-aaaa-aaaa-aaaa-aaaaaaaaaaaf',
      email: '2022_234567@student.institution.edu.ng',
      password_hash: 'student123',
      full_name: 'Chukwuebuka Obi',
      role: 'student',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    }
  ],
  students: [
    // ── Level 100 (Admitted 2025) ──────────────────────────────────────────
    { id: 'b1000001-0000-0000-0000-000000000001', reg_number: '2025/100001', full_name: 'Adaeze Nwosu', department_id: 'd1111111-1111-1111-1111-111111111111', level: 100, session: '2025/26' },
    { id: 'b1000002-0000-0000-0000-000000000002', reg_number: '2025/100002', full_name: 'Seun Akinwale', department_id: 'd2222222-2222-2222-2222-222222222222', level: 100, session: '2025/26' },
    { id: 'b1000003-0000-0000-0000-000000000003', reg_number: '2025/100003', full_name: 'Hauwa Musa', department_id: 'd3333333-3333-3333-3333-333333333333', level: 100, session: '2025/26' },
    { id: 'b1000004-0000-0000-0000-000000000004', reg_number: '2025/100004', full_name: 'Tochukwu Igwe', department_id: 'd4444444-4444-4444-4444-444444444444', level: 100, session: '2025/26' },
    { id: 'b1000005-0000-0000-0000-000000000005', reg_number: '2025/100005', full_name: 'Zainab Umar', department_id: 'd5555555-5555-5555-5555-555555555555', level: 100, session: '2025/26' },
    { id: 'b1000006-0000-0000-0000-000000000006', reg_number: '2025/100006', full_name: 'Somtochukwu Eze', department_id: 'd1111111-1111-1111-1111-111111111111', level: 100, session: '2025/26' },
    { id: 'b1000007-0000-0000-0000-000000000007', reg_number: '2025/100007', full_name: 'Maryam Usman', department_id: 'd2222222-2222-2222-2222-222222222222', level: 100, session: '2025/26' },
    { id: 'b1000008-0000-0000-0000-000000000008', reg_number: '2025/100008', full_name: 'Victor Oladipo', department_id: 'd3333333-3333-3333-3333-333333333333', level: 100, session: '2025/26' },
    { id: 'b1000009-0000-0000-0000-000000000009', reg_number: '2025/100009', full_name: 'Praise Nwachukwu', department_id: 'd4444444-4444-4444-4444-444444444444', level: 100, session: '2025/26' },
    { id: 'b1000010-0000-0000-0000-000000000010', reg_number: '2025/100010', full_name: 'Kenneth Onyema', department_id: 'd5555555-5555-5555-5555-555555555555', level: 100, session: '2025/26' },

    // ── Level 200 (Admitted 2024) ──────────────────────────────────────────
    { id: 'b2000001-0000-0000-0000-000000000001', reg_number: '2024/200001', full_name: 'Ikenna Okafor', department_id: 'd1111111-1111-1111-1111-111111111111', level: 200, session: '2025/26' },
    { id: 'b2000002-0000-0000-0000-000000000002', reg_number: '2024/200002', full_name: 'Cynthia Kalu', department_id: 'd1111111-1111-1111-1111-111111111111', level: 200, session: '2025/26' },
    { id: 'b2000003-0000-0000-0000-000000000003', reg_number: '2024/200003', full_name: 'Mubarak Garba', department_id: 'd3333333-3333-3333-3333-333333333333', level: 200, session: '2025/26' },
    { id: 'b2000004-0000-0000-0000-000000000004', reg_number: '2024/200004', full_name: 'Chisom Anieke', department_id: 'd4444444-4444-4444-4444-444444444444', level: 200, session: '2025/26' },
    { id: 'b2000005-0000-0000-0000-000000000005', reg_number: '2024/200005', full_name: 'David Alabi', department_id: 'd4444444-4444-4444-4444-444444444444', level: 200, session: '2025/26' },

    // ── Level 300 (Admitted 2023) ──────────────────────────────────────────
    { id: 'b3000001-0000-0000-0000-000000000001', reg_number: '2023/300001', full_name: 'Ngozi Onyekachi', department_id: 'd1111111-1111-1111-1111-111111111111', level: 300, session: '2025/26' },
    { id: 'b3000002-0000-0000-0000-000000000002', reg_number: '2023/300002', full_name: 'Tunde Bakare', department_id: 'd1111111-1111-1111-1111-111111111111', level: 300, session: '2025/26' },
    { id: 'b3000003-0000-0000-0000-000000000003', reg_number: '2023/300003', full_name: 'Chinaza Ebere', department_id: 'd1111111-1111-1111-1111-111111111111', level: 300, session: '2025/26' },

    // ── Level 400 (Admitted 2022) ──────────────────────────────────────────
    { id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', reg_number: '2022/234567', full_name: 'Chukwuebuka Obi', department_id: 'd1111111-1111-1111-1111-111111111111', level: 400, session: '2025/26' },
    { id: 'b4000002-0000-0000-0000-000000000002', reg_number: '2022/234568', full_name: 'Emeka Okafor', department_id: 'd1111111-1111-1111-1111-111111111111', level: 400, session: '2025/26' },
    { id: 'b4000003-0000-0000-0000-000000000003', reg_number: '2022/234569', full_name: 'Blessing Danjuma', department_id: 'd1111111-1111-1111-1111-111111111111', level: 400, session: '2025/26' }
  ],
  courses: [
    {
      id: 'c1010000-0000-0000-0000-000000000101',
      code: 'COS 101',
      title: 'Introduction to Computer Science',
      credit_units: 2,
      semester: 'first',
      session: '2025/26',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad' // Dr. Aminu Ibrahim
    },
    {
      id: 'c2010000-0000-0000-0000-000000000201',
      code: 'COS 201',
      title: 'Computer Programming I',
      credit_units: 2,
      semester: 'first',
      session: '2025/26',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa21' // Dr. Ngozi Eze
    },
    {
      id: 'c2020000-0000-0000-0000-000000000202',
      code: 'COS 202',
      title: 'Computer Programming II',
      credit_units: 2,
      semester: 'second',
      session: '2025/26',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa22' // Dr. Babatunde Fashola
    },
    {
      id: 'c3430000-0000-0000-0000-000000000343',
      code: 'COS 343',
      title: 'Database Design & Management',
      credit_units: 3,
      semester: 'first',
      session: '2025/26',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa31' // Dr. Ifeanyi Ugwu
    },
    {
      id: 'c4140000-0000-0000-0000-000000000414',
      code: 'COS 414',
      title: 'Distributed Computing Systems',
      credit_units: 3,
      semester: 'second',
      session: '2025/26',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaa41' // Prof. Chukwuma Akpan
    }
  ],
  enrollments: [
    // ── COS 101 Enrollments (100L / General) ──────────────────────────
    { id: 'e1', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c1010000-0000-0000-0000-000000000101', session: '2025/26', semester: 'first' },
    { id: 'e2', student_id: 'b1000001-0000-0000-0000-000000000001', course_id: 'c1010000-0000-0000-0000-000000000101', session: '2025/26', semester: 'first' },
    { id: 'e3', student_id: 'b1000002-0000-0000-0000-000000000002', course_id: 'c1010000-0000-0000-0000-000000000101', session: '2025/26', semester: 'first' },

    // ── COS 201 Enrollments (200L) ───────────────────────────────────
    { id: 'e4', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c2010000-0000-0000-0000-000000000201', session: '2025/26', semester: 'first' },
    { id: 'e5', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c2010000-0000-0000-0000-000000000201', session: '2025/26', semester: 'first' },
    { id: 'e6', student_id: 'b2000002-0000-0000-0000-000000000002', course_id: 'c2010000-0000-0000-0000-000000000201', session: '2025/26', semester: 'first' },

    // ── COS 202 Enrollments (200L) ───────────────────────────────────
    { id: 'e7', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c2020000-0000-0000-0000-000000000202', session: '2025/26', semester: 'second' },
    { id: 'e8', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c2020000-0000-0000-0000-000000000202', session: '2025/26', semester: 'second' },
    { id: 'e9', student_id: 'b2000002-0000-0000-0000-000000000002', course_id: 'c2020000-0000-0000-0000-000000000202', session: '2025/26', semester: 'second' },

    // ── COS 343 Enrollments (300L) ───────────────────────────────────
    { id: 'e10', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c3430000-0000-0000-0000-000000000343', session: '2025/26', semester: 'first' },
    { id: 'e11', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c3430000-0000-0000-0000-000000000343', session: '2025/26', semester: 'first' },

    // ── COS 414 Enrollments (400L) ───────────────────────────────────
    { id: 'e12', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c4140000-0000-0000-0000-000000000414', session: '2025/26', semester: 'second' }
  ],
  exam_scores: [
    // COS 101 Exam Scores
    { id: 'es1', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c1010000-0000-0000-0000-000000000101', exam_score: 52, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es2', student_id: 'b1000001-0000-0000-0000-000000000001', course_id: 'c1010000-0000-0000-0000-000000000101', exam_score: 58, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es3', student_id: 'b1000002-0000-0000-0000-000000000002', course_id: 'c1010000-0000-0000-0000-000000000101', exam_score: 45, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 201 Exam Scores (Dr. Ngozi Eze)
    { id: 'es4', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c2010000-0000-0000-0000-000000000201', exam_score: 54, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es5', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c2010000-0000-0000-0000-000000000201', exam_score: 60, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es6', student_id: 'b2000002-0000-0000-0000-000000000002', course_id: 'c2010000-0000-0000-0000-000000000201', exam_score: 58, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 202 Exam Scores (Dr. Babatunde Fashola)
    { id: 'es7', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c2020000-0000-0000-0000-000000000202', exam_score: 51, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es8', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c2020000-0000-0000-0000-000000000202', exam_score: 55, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es9', student_id: 'b2000002-0000-0000-0000-000000000002', course_id: 'c2020000-0000-0000-0000-000000000202', exam_score: 53, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 343 Exam Scores (Dr. Ifeanyi Ugwu)
    { id: 'es10', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c3430000-0000-0000-0000-000000000343', exam_score: 56, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es11', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c3430000-0000-0000-0000-000000000343', exam_score: 59, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 414 Exam Scores (Prof. Chukwuma Akpan)
    { id: 'es12', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c4140000-0000-0000-0000-000000000414', exam_score: 58, session: '2025/26', uploaded_at: new Date().toISOString() }
  ],
  ca_scores: [
    // COS 101 CA Scores
    { id: 'ca1', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c1010000-0000-0000-0000-000000000101', ca_score: 21, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca2', student_id: 'b1000001-0000-0000-0000-000000000001', course_id: 'c1010000-0000-0000-0000-000000000101', ca_score: 22, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca3', student_id: 'b1000002-0000-0000-0000-000000000002', course_id: 'c1010000-0000-0000-0000-000000000101', ca_score: 20, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 201 CA Scores (Dr. Ngozi Eze)
    { id: 'ca4', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c2010000-0000-0000-0000-000000000201', ca_score: 22, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca5', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c2010000-0000-0000-0000-000000000201', ca_score: 25, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca6', student_id: 'b2000002-0000-0000-0000-000000000002', course_id: 'c2010000-0000-0000-0000-000000000201', ca_score: 24, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 202 CA Scores (Dr. Babatunde Fashola)
    { id: 'ca7', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c2020000-0000-0000-0000-000000000202', ca_score: 23, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca8', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c2020000-0000-0000-0000-000000000202', ca_score: 24, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca9', student_id: 'b2000002-0000-0000-0000-000000000002', course_id: 'c2020000-0000-0000-0000-000000000202', ca_score: 22, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 343 CA Scores (Dr. Ifeanyi Ugwu)
    { id: 'ca10', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c3430000-0000-0000-0000-000000000343', ca_score: 24, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca11', student_id: 'b2000001-0000-0000-0000-000000000001', course_id: 'c3430000-0000-0000-0000-000000000343', ca_score: 26, session: '2025/26', uploaded_at: new Date().toISOString() },

    // COS 414 CA Scores (Prof. Chukwuma Akpan)
    { id: 'ca12', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c4140000-0000-0000-0000-000000000414', ca_score: 25, session: '2025/26', uploaded_at: new Date().toISOString() }
  ],
  final_results: [
    // ── COS 101 Results (Approved) ──────────────────────────────────
    {
      id: 'fr1',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      course_id: 'c1010000-0000-0000-0000-000000000101',
      ca_score: 21,
      exam_score: 52,
      total_score: 73,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr2',
      student_id: 'b1000001-0000-0000-0000-000000000001',
      course_id: 'c1010000-0000-0000-0000-000000000101',
      ca_score: 22,
      exam_score: 58,
      total_score: 80,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr3',
      student_id: 'b1000002-0000-0000-0000-000000000002',
      course_id: 'c1010000-0000-0000-0000-000000000101',
      ca_score: 20,
      exam_score: 45,
      total_score: 65,
      grade: 'B',
      grade_point: 4.0,
      status: 'approved',
      session: '2025/26'
    },

    // ── COS 201 Results (Approved) ──────────────────────────────────
    {
      id: 'fr4',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      course_id: 'c2010000-0000-0000-0000-000000000201',
      ca_score: 22,
      exam_score: 54,
      total_score: 76,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr5',
      student_id: 'b2000001-0000-0000-0000-000000000001',
      course_id: 'c2010000-0000-0000-0000-000000000201',
      ca_score: 25,
      exam_score: 60,
      total_score: 85,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr6',
      student_id: 'b2000002-0000-0000-0000-000000000002',
      course_id: 'c2010000-0000-0000-0000-000000000201',
      ca_score: 24,
      exam_score: 58,
      total_score: 82,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },

    // ── COS 202 Results (Approved) ──────────────────────────────────
    {
      id: 'fr7',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      course_id: 'c2020000-0000-0000-0000-000000000202',
      ca_score: 23,
      exam_score: 51,
      total_score: 74,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr8',
      student_id: 'b2000001-0000-0000-0000-000000000001',
      course_id: 'c2020000-0000-0000-0000-000000000202',
      ca_score: 24,
      exam_score: 55,
      total_score: 79,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr9',
      student_id: 'b2000002-0000-0000-0000-000000000002',
      course_id: 'c2020000-0000-0000-0000-000000000202',
      ca_score: 22,
      exam_score: 53,
      total_score: 75,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },

    // ── COS 343 Results (Approved) ──────────────────────────────────
    {
      id: 'fr10',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      course_id: 'c3430000-0000-0000-0000-000000000343',
      ca_score: 24,
      exam_score: 56,
      total_score: 80,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr11',
      student_id: 'b2000001-0000-0000-0000-000000000001',
      course_id: 'c3430000-0000-0000-0000-000000000343',
      ca_score: 26,
      exam_score: 59,
      total_score: 85,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },

    // ── COS 414 Results (Approved) ──────────────────────────────────
    {
      id: 'fr12',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      course_id: 'c4140000-0000-0000-0000-000000000414',
      ca_score: 25,
      exam_score: 58,
      total_score: 83,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    }
  ],
  hod_profiles: [
    {
      id: 'f1111111-1111-1111-1111-111111111111',
      user_id: 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaab',
      full_name: 'Dr. (Mrs.) Ifeoma Nwokoye',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      rank: 'Head of Department',
      phone: '+234 803 123 4567',
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">I.Nwokoye</text></svg>'
    },
    {
      id: 'f2222222-2222-2222-2222-222222222222',
      user_id: 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaac',
      full_name: 'Dr. Chinwe Okeke',
      department_id: 'd2222222-2222-2222-2222-222222222222',
      rank: 'Associate Professor',
      phone: '+234 802 987 6543',
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">C.Okeke</text></svg>'
    },
    {
      id: 'f3333333-3333-3333-3333-333333333333',
      user_id: 'a7777777-aaaa-aaaa-aaaa-aaaaaaaaaa01',
      full_name: 'Prof. Augustine O. Eze',
      department_id: 'd3333333-3333-3333-3333-333333333333',
      rank: 'Professor of Vocational & Technical Education',
      phone: '+234 802 345 6789',
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">A.O.Eze</text></svg>'
    },
    {
      id: 'f4444444-4444-4444-4444-444444444444',
      user_id: 'a8888888-aaaa-aaaa-aaaa-aaaaaaaaaa02',
      full_name: 'Dr. Grace N. Danjuma',
      department_id: 'd4444444-4444-4444-4444-444444444444',
      rank: 'Associate Professor (Robotics & AI)',
      phone: '+234 805 678 1234',
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">G.Danjuma</text></svg>'
    },
    {
      id: 'f5555555-5555-5555-5555-555555555555',
      user_id: 'a9999999-aaaa-aaaa-aaaa-aaaaaaaaaa03',
      full_name: 'Engr. Dr. Mustapha Bello',
      department_id: 'd5555555-5555-5555-5555-555555555555',
      rank: 'Senior Lecturer & Reg. Engineer (COREN)',
      phone: '+234 803 987 6543',
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">M.Bello</text></svg>'
    }
  ],
  result_distributions: [
    {
      id: 'rd1',
      course_id: 'c1010000-0000-0000-0000-000000000101',
      session: '2025/26',
      semester: 'first',
      sent_by_hod_id: 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaab',
      received_by_dept_id: 'd2222222-2222-2222-2222-222222222222',
      status: 'sent',
      sent_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      acknowledged_at: null,
      acknowledged_by_id: null
    }
  ],
  cgpa_records: [
    {
      id: 'cg1',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      total_credit_units: 3,
      total_quality_points: 15.0,
      cgpa: 5.0,
      classification: 'First Class Honours',
      last_updated: new Date().toISOString()
    },
    {
      id: 'cg2',
      student_id: 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
      total_credit_units: 3,
      total_quality_points: 15.0,
      cgpa: 5.0,
      classification: 'First Class Honours',
      last_updated: new Date().toISOString()
    },
    {
      id: 'cg3',
      student_id: 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
      total_credit_units: 3,
      total_quality_points: 12.0,
      cgpa: 4.0,
      classification: 'Second Class Honours (Upper Division)',
      last_updated: new Date().toISOString()
    }
  ],
  complaints: []
}

function getLocalData() {
  if (typeof window === 'undefined') return initialSeedData
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedData))
      return initialSeedData
    }
    return JSON.parse(raw)
  } catch (err) {
    return initialSeedData
  }
}

function saveLocalData(data) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('Failed to save to localStorage', err)
  }
}

const isSupabaseReady = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return key && !key.includes('placeholder')
}

// ----------------- DEPARTMENTS -----------------
export async function getDepartments() {
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name')
      if (!error && data?.length) return data
    } catch (e) {
      console.warn('Supabase read error, falling back to local data', e)
    }
  }
  const local = getLocalData()
  return local.departments || []
}

export async function addDepartment(dept) {
  const newDept = {
    id: generateUUID(),
    name: dept.name,
    code: dept.code.toUpperCase(),
    faculty: dept.faculty,
    created_at: new Date().toISOString()
  }

  if (isSupabaseReady()) {
    try {
      await supabase.from('departments').insert([newDept])
    } catch (e) {
      console.warn('Supabase insert failed', e)
    }
  }

  const local = getLocalData()
  local.departments.push(newDept)
  saveLocalData(local)
  return newDept
}

export async function deleteDepartment(id) {
  if (isSupabaseReady()) {
    try {
      await supabase.from('departments').delete().eq('id', id)
    } catch (e) {
      console.warn('Supabase delete failed', e)
    }
  }
  const local = getLocalData()
  local.departments = local.departments.filter(d => d.id !== id)
  saveLocalData(local)
  return true
}

// ----------------- USERS -----------------
export async function getUsers() {
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      if (!error && data?.length) return data
    } catch (e) {
      console.warn('Supabase read error', e)
    }
  }
  return getLocalData().users || []
}

export async function addUser(userData) {
  const newUser = {
    id: generateUUID(),
    email: userData.email.toLowerCase().trim(),
    password_hash: userData.password || 'password123',
    full_name: userData.full_name,
    role: userData.role,
    department_id: userData.department_id || null,
    created_at: new Date().toISOString()
  }

  if (isSupabaseReady()) {
    try {
      await supabase.from('users').insert([newUser])
    } catch (e) {
      console.warn('Supabase user insert failed', e)
    }
  }

  const local = getLocalData()
  local.users.push(newUser)
  saveLocalData(local)
  return newUser
}

export async function updateUser(id, updateData) {
  if (isSupabaseReady()) {
    try {
      await supabase.from('users').update({
        full_name: updateData.full_name,
        email: updateData.email?.toLowerCase().trim(),
        role: updateData.role,
        department_id: updateData.department_id || null,
        ...(updateData.password ? { password_hash: updateData.password } : {})
      }).eq('id', id)
    } catch (e) {
      console.warn('Supabase user update failed', e)
    }
  }

  const local = getLocalData()
  const idx = local.users.findIndex(u => u.id === id)
  if (idx >= 0) {
    local.users[idx] = {
      ...local.users[idx],
      full_name: updateData.full_name || local.users[idx].full_name,
      email: updateData.email ? updateData.email.toLowerCase().trim() : local.users[idx].email,
      role: updateData.role || local.users[idx].role,
      department_id: updateData.department_id !== undefined ? updateData.department_id : local.users[idx].department_id,
      ...(updateData.password ? { password_hash: updateData.password } : {})
    }
    saveLocalData(local)
    return local.users[idx]
  }
  return null
}

export async function deleteUser(id) {
  if (isSupabaseReady()) {
    try {
      await supabase.from('users').delete().eq('id', id)
    } catch (e) {
      console.warn('Supabase user delete failed', e)
    }
  }

  const local = getLocalData()
  local.users = local.users.filter(u => u.id !== id)
  saveLocalData(local)
  return true
}

// ----------------- STUDENTS -----------------
export async function getStudents() {
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase.from('students').select('*').order('reg_number')
      if (!error && data?.length) return data
    } catch (e) {
      console.warn('Supabase read error', e)
    }
  }
  return getLocalData().students || []
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export async function addStudent(studentData) {
  const reg = normalizeRegNumber(studentData.reg_number)
  const newStudent = {
    id: generateUUID(),
    reg_number: reg,
    full_name: studentData.full_name,
    department_id: studentData.department_id,
    level: Number(studentData.level) || 100,
    session: studentData.session || '2025/26',
    created_at: new Date().toISOString()
  }

  if (isSupabaseReady()) {
    try {
      const { error } = await supabase.from('students').insert([newStudent])
      if (error) console.warn('Supabase student insert error:', error.message)
    } catch (e) {
      console.warn('Supabase student insert failed', e)
    }
  }

  const local = getLocalData()
  // replace if duplicate reg_number exists
  const existingIdx = local.students.findIndex(s => s.reg_number === reg)
  if (existingIdx >= 0) {
    local.students[existingIdx] = newStudent
  } else {
    local.students.push(newStudent)
  }
  saveLocalData(local)
  return newStudent
}

export async function bulkAddStudents(studentsList) {
  const added = []
  for (const item of studentsList) {
    const student = await addStudent(item)
    added.push(student)
  }
  return added
}

// ----------------- COURSES -----------------
export async function getCourses() {
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('code')
      if (!error && data?.length) return data
    } catch (e) {
      console.warn('Supabase courses read error', e)
    }
  }
  return getLocalData().courses || []
}

export async function addCourse(courseData) {
  const newCourse = {
    id: generateUUID(),
    code: courseData.code.toUpperCase().trim(),
    title: courseData.title.trim(),
    credit_units: Number(courseData.credit_units) || 3,
    semester: courseData.semester || 'first',
    lecturer_id: courseData.lecturer_id || null,
    department_id: courseData.department_id || null,
    session: courseData.session || '2025/26',
    created_at: new Date().toISOString()
  }

  if (isSupabaseReady()) {
    try {
      await supabase.from('courses').insert([newCourse])
    } catch (e) {
      console.warn('Supabase course insert failed', e)
    }
  }

  const local = getLocalData()
  local.courses.push(newCourse)
  saveLocalData(local)
  return newCourse
}

// ----------------- ENROLLMENTS -----------------
export async function getEnrollments() {
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase.from('enrollments').select('*')
      if (!error && data?.length) return data
    } catch (e) {
      console.warn('Supabase enrollments read error', e)
    }
  }
  return getLocalData().enrollments || []
}

export async function enrollStudent(enrollmentData) {
  const newEnrollment = {
    id: generateUUID(),
    student_id: enrollmentData.student_id,
    course_id: enrollmentData.course_id,
    session: enrollmentData.session || '2025/26',
    semester: enrollmentData.semester || 'first'
  }

  const local = getLocalData()
  const exists = local.enrollments.find(e =>
    e.student_id === newEnrollment.student_id &&
    e.course_id === newEnrollment.course_id &&
    e.session === newEnrollment.session
  )
  if (!exists) {
    local.enrollments.push(newEnrollment)
    saveLocalData(local)
  }
  return newEnrollment
}

// ----------------- EXAM SCORES (0-70) -----------------
// ----------------- EXAM SCORES (0-70) -----------------
export async function getExamScores(courseId) {
  if (isSupabaseReady()) {
    try {
      let query = supabase.from('exam_scores').select('*')
      if (courseId) query = query.eq('course_id', courseId)
      const { data, error } = await query
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Supabase exam scores read error', e)
    }
  }
  const all = getLocalData().exam_scores || []
  return courseId ? all.filter(e => e.course_id === courseId) : all
}

export async function saveExamScores(scores) {
  const local = getLocalData()
  const toUpsert = []

  for (const s of scores) {
    const existingIdx = local.exam_scores.findIndex(
      e => e.student_id === s.student_id && e.course_id === s.course_id && e.session === (s.session || '2025/26')
    )
    const entry = {
      id: existingIdx >= 0 ? local.exam_scores[existingIdx].id : generateUUID(),
      student_id: s.student_id,
      course_id: s.course_id,
      exam_score: Number(s.exam_score) || 0,
      session: s.session || '2025/26',
      uploaded_at: new Date().toISOString()
    }
    if (existingIdx >= 0) {
      local.exam_scores[existingIdx] = entry
    } else {
      local.exam_scores.push(entry)
    }
    toUpsert.push(entry)
  }
  saveLocalData(local)

  if (isSupabaseReady() && toUpsert.length > 0) {
    try {
      const { error } = await supabase.from('exam_scores').upsert(toUpsert, { onConflict: 'student_id,course_id,session' })
      if (error) console.warn('Supabase saveExamScores error:', error.message)
    } catch (e) {
      console.warn('Supabase saveExamScores failed', e)
    }
  }
  return true
}

// ----------------- CA SCORES (0-30) -----------------
export async function getCaScores(courseId) {
  if (isSupabaseReady()) {
    try {
      let query = supabase.from('ca_scores').select('*')
      if (courseId) query = query.eq('course_id', courseId)
      const { data, error } = await query
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Supabase ca scores read error', e)
    }
  }
  const all = getLocalData().ca_scores || []
  return courseId ? all.filter(c => c.course_id === courseId) : all
}

export async function saveCaScores(scores) {
  const local = getLocalData()
  const toUpsert = []

  for (const s of scores) {
    const existingIdx = local.ca_scores.findIndex(
      c => c.student_id === s.student_id && c.course_id === s.course_id && c.session === (s.session || '2025/26')
    )
    const entry = {
      id: existingIdx >= 0 ? local.ca_scores[existingIdx].id : generateUUID(),
      student_id: s.student_id,
      course_id: s.course_id,
      ca_score: Number(s.ca_score) || 0,
      session: s.session || '2025/26',
      uploaded_at: new Date().toISOString()
    }
    if (existingIdx >= 0) {
      local.ca_scores[existingIdx] = entry
    } else {
      local.ca_scores.push(entry)
    }
    toUpsert.push(entry)
  }
  saveLocalData(local)

  if (isSupabaseReady() && toUpsert.length > 0) {
    try {
      const { error } = await supabase.from('ca_scores').upsert(toUpsert, { onConflict: 'student_id,course_id,session' })
      if (error) console.warn('Supabase saveCaScores error:', error.message)
    } catch (e) {
      console.warn('Supabase saveCaScores failed', e)
    }
  }
  return true
}

// ----------------- FINAL RESULTS -----------------
export async function getFinalResults(courseId, studentId, status) {
  if (isSupabaseReady()) {
    try {
      let query = supabase.from('final_results').select('*')
      if (courseId) query = query.eq('course_id', courseId)
      if (studentId) query = query.eq('student_id', studentId)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Supabase final results read error', e)
    }
  }
  let list = getLocalData().final_results || []
  if (courseId) list = list.filter(r => r.course_id === courseId)
  if (studentId) list = list.filter(r => r.student_id === studentId)
  if (status) list = list.filter(r => r.status === status)
  return list
}

export async function saveFinalResults(results) {
  const local = getLocalData()
  const toUpsert = []

  for (const r of results) {
    const total = Number(r.ca_score || 0) + Number(r.exam_score || 0)
    const { grade, gradePoint } = calculateGrade(total)

    const existingIdx = local.final_results.findIndex(
      f => f.student_id === r.student_id && f.course_id === r.course_id && f.session === (r.session || '2025/26')
    )

    const entry = {
      id: existingIdx >= 0 ? local.final_results[existingIdx].id : generateUUID(),
      student_id: r.student_id,
      course_id: r.course_id,
      ca_score: Number(r.ca_score || 0),
      exam_score: Number(r.exam_score || 0),
      total_score: total,
      grade,
      grade_point: gradePoint,
      status: r.status || 'draft',
      session: r.session || '2025/26',
      created_at: new Date().toISOString()
    }

    if (existingIdx >= 0) {
      local.final_results[existingIdx] = entry
    } else {
      local.final_results.push(entry)
    }
    toUpsert.push(entry)
  }
  saveLocalData(local)

  if (isSupabaseReady() && toUpsert.length > 0) {
    try {
      const { error } = await supabase.from('final_results').upsert(toUpsert, { onConflict: 'student_id,course_id,session' })
      if (error) console.warn('Supabase saveFinalResults error:', error.message)
    } catch (e) {
      console.warn('Supabase saveFinalResults failed', e)
    }
  }
  return true
}

export async function submitResultsToHOD(courseId, lecturerId, signature = null) {
  // Changes all draft final_results for this course to 'submitted'
  // This signals to HOD that lecturer has signed off
  if (isSupabaseReady()) {
    try {
      const { error } = await supabase
        .from('final_results')
        .update({ status: 'submitted' })
        .eq('course_id', courseId)
        .eq('status', 'draft')
      if (error) console.warn('Supabase submit error:', error.message)
    } catch(e) { console.warn(e) }
  }
  const local = getLocalData()
  const existingForCourse = (local.final_results || []).filter(r => r.course_id === courseId)
  
  if (existingForCourse.length === 0) {
    // If not compiled yet, auto-compile from exam and CA scores!
    const exams = (local.exam_scores || []).filter(e => e.course_id === courseId)
    const cas = (local.ca_scores || []).filter(c => c.course_id === courseId)
    const studIds = Array.from(new Set([...exams.map(e => e.student_id), ...cas.map(c => c.student_id)]))
    
    const newFinals = studIds.map(sid => {
      const examVal = Number(exams.find(e => e.student_id === sid)?.exam_score || 0)
      const caVal = Number(cas.find(c => c.student_id === sid)?.ca_score || 0)
      const total = examVal + caVal
      const { grade, gradePoint } = calculateGrade(total)
      return {
        id: generateUUID(),
        student_id: sid,
        course_id: courseId,
        ca_score: caVal,
        exam_score: examVal,
        total_score: total,
        grade,
        grade_point: gradePoint,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: lecturerId,
        lecturer_signature: signature || true,
        session: '2025/26',
        created_at: new Date().toISOString()
      }
    })
    local.final_results = [...(local.final_results || []), ...newFinals]
  } else {
    local.final_results = local.final_results.map(r =>
      r.course_id === courseId && (r.status === 'draft' || !r.status)
        ? { 
            ...r, 
            status: 'submitted', 
            submitted_at: new Date().toISOString(), 
            submitted_by: lecturerId,
            lecturer_signature: signature || (r.lecturer_signature || true)
          }
        : r
    )
  }
  saveLocalData(local)
}

export async function clearAllComplaints() {
  const local = getLocalData()
  local.complaints = []
  saveLocalData(local)
  return []
}

export async function acknowledgeExamOfficeReceipt(distributionId, officerId) {
  if (isSupabaseReady()) {
    try {
      await supabase.from('result_distributions')
        .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by_id: officerId })
        .eq('id', distributionId)
    } catch(e) { console.warn(e) }
  }
  const local = getLocalData()
  local.result_distributions = (local.result_distributions || []).map(d =>
    d.id === distributionId ? { ...d, status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by_id: officerId } : d
  )
  saveLocalData(local)
}

export async function updateCourseResultsStatus(courseId, newStatus) {
  if (isSupabaseReady()) {
    try {
      const { error } = await supabase
        .from('final_results')
        .update({ status: newStatus })
        .eq('course_id', courseId)
      if (error) console.warn('Supabase updateCourseResultsStatus error:', error.message)
    } catch (e) {
      console.warn('Supabase updateCourseResultsStatus failed', e)
    }
  }
  const local = getLocalData()
  local.final_results = local.final_results.map(r => {
    if (r.course_id === courseId) {
      return { ...r, status: newStatus }
    }
    return r
  })
  saveLocalData(local)

  // When results are approved, recompute CGPAs for impacted students
  if (newStatus === 'approved') {
    const studentIds = [...new Set(local.final_results.filter(r => r.course_id === courseId).map(r => r.student_id))]
    for (const sId of studentIds) {
      await recomputeStudentCGPA(sId)
    }
  }
  return true
}

// ----------------- HOD PROFILES & SIGNATURE -----------------
export async function getHodProfile(userIdOrDeptId) {
  const local = getLocalData()
  return local.hod_profiles.find(h => h.user_id === userIdOrDeptId || h.department_id === userIdOrDeptId) || null
}

export async function saveHodProfile(profileData) {
  const local = getLocalData()
  const existingIdx = local.hod_profiles.findIndex(
    h => h.department_id === profileData.department_id || h.user_id === profileData.user_id
  )

  const entry = {
    id: existingIdx >= 0 ? local.hod_profiles[existingIdx].id : generateUUID(),
    user_id: profileData.user_id,
    full_name: profileData.full_name,
    department_id: profileData.department_id,
    rank: profileData.rank || 'Professor',
    phone: profileData.phone || '',
    signature_url: profileData.signature_url,
    created_at: new Date().toISOString()
  }

  if (existingIdx >= 0) {
    local.hod_profiles[existingIdx] = { ...local.hod_profiles[existingIdx], ...entry }
  } else {
    local.hod_profiles.push(entry)
  }
  saveLocalData(local)
  return entry
}

// ----------------- RESULT DISTRIBUTIONS -----------------
export async function getResultDistributions() {
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase.from('result_distributions').select('*').order('sent_at', { ascending: false })
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Supabase getResultDistributions read error', e)
    }
  }
  const local = getLocalData()
  return local.result_distributions || []
}

export async function createResultDistribution(courseId, session, semester, sentByHodId, receivingDeptIds) {
  const local = getLocalData()
  const created = []
  const toInsertSupabase = []

  // Ensure an archival copy is automatically dispatched to the Central Examinations & Records Unit
  const EXAMS_OFFICE_DEPT_ID = 'd0000000-0000-0000-0000-000000000000'
  const allDeptIds = [...new Set([...receivingDeptIds, EXAMS_OFFICE_DEPT_ID])]

  for (const deptId of allDeptIds) {
    const existing = local.result_distributions.find(
      d => d.course_id === courseId && d.received_by_dept_id === deptId && d.session === session
    )
    if (!existing) {
      const entry = {
        id: generateUUID(),
        course_id: courseId,
        session: session || '2025/26',
        semester: semester || 'first',
        sent_by_hod_id: sentByHodId,
        received_by_dept_id: deptId,
        status: 'sent',
        sent_at: new Date().toISOString(),
        acknowledged_at: null,
        acknowledged_by_id: null
      }
      local.result_distributions.push(entry)
      created.push(entry)
      toInsertSupabase.push(entry)
    }
  }

  // Also mark final results as distributed
  local.final_results = local.final_results.map(r => {
    if (r.course_id === courseId) return { ...r, status: 'distributed' }
    return r
  })

  saveLocalData(local)

  if (isSupabaseReady()) {
    try {
      if (toInsertSupabase.length > 0) {
        await supabase.from('result_distributions').insert(toInsertSupabase)
      }
      await supabase.from('final_results').update({ status: 'distributed' }).eq('course_id', courseId)
    } catch (e) {
      console.warn('Supabase createResultDistribution sync error', e)
    }
  }

  return created
}

export async function acknowledgeDistribution(distributionId, acknowledgedById) {
  if (isSupabaseReady()) {
    try {
      await supabase.from('result_distributions').update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by_id: acknowledgedById
      }).eq('id', distributionId)
    } catch (e) {
      console.warn('Supabase acknowledgeDistribution sync error', e)
    }
  }

  const local = getLocalData()
  const idx = local.result_distributions.findIndex(d => d.id === distributionId)
  if (idx >= 0) {
    local.result_distributions[idx].status = 'acknowledged'
    local.result_distributions[idx].acknowledged_at = new Date().toISOString()
    local.result_distributions[idx].acknowledged_by_id = acknowledgedById
    saveLocalData(local)
    return local.result_distributions[idx]
  }
  return null
}

// ----------------- CGPA RECORDS -----------------
export async function getCgpaRecord(studentId) {
  const local = getLocalData()
  return local.cgpa_records.find(c => c.student_id === studentId) || null
}

export async function recomputeStudentCGPA(studentId) {
  const local = getLocalData()
  const approvedResults = local.final_results.filter(
    r => r.student_id === studentId && (r.status === 'approved' || r.status === 'distributed')
  )

  const courses = local.courses
  const items = approvedResults.map(r => {
    const course = courses.find(c => c.id === r.course_id)
    return {
      credit_units: course ? course.credit_units : 3,
      grade_point: r.grade_point
    }
  })

  const { totalCreditUnits, totalQualityPoints, cgpa, classification } = calculateCGPA(items)

  const existingIdx = local.cgpa_records.findIndex(c => c.student_id === studentId)
  const entry = {
    id: existingIdx >= 0 ? local.cgpa_records[existingIdx].id : generateUUID(),
    student_id: studentId,
    total_credit_units: totalCreditUnits,
    total_quality_points: totalQualityPoints,
    cgpa,
    classification,
    last_updated: new Date().toISOString()
  }

  if (existingIdx >= 0) {
    local.cgpa_records[existingIdx] = entry
  } else {
    local.cgpa_records.push(entry)
  }

  saveLocalData(local)

  if (isSupabaseReady()) {
    try {
      await supabase.from('cgpa_records').upsert({
        student_id: studentId,
        total_credit_units: totalCreditUnits,
        total_quality_points: totalQualityPoints,
        cgpa,
        classification,
        last_updated: new Date().toISOString()
      }, { onConflict: 'student_id' })
    } catch (e) {
      console.warn('Supabase cgpa_records upsert error:', e)
    }
  }

  return entry
}

// ----------------- COMPLAINTS -----------------
export async function getComplaints(studentId) {
  const local = getLocalData()
  if (studentId) {
    return local.complaints.filter(c => c.student_id === studentId)
  }
  return local.complaints || []
}

export async function createComplaint(studentId, courseId, complaintText, studentName = null, studentRegNumber = null) {
  const local = getLocalData()
  const student = (local.students || []).find(s => s.id === studentId || (studentRegNumber && normalizeRegNumber(s.reg_number) === normalizeRegNumber(studentRegNumber)))
  const entry = {
    id: generateUUID(),
    student_id: studentId,
    student_name: studentName || student?.full_name || 'Candidate',
    student_reg_number: studentRegNumber || student?.reg_number || '',
    course_id: courseId,
    complaint_text: complaintText.trim(),
    status: 'pending',
    exam_officer_response: null,
    created_at: new Date().toISOString(),
    resolved_at: null
  }
  local.complaints.unshift(entry)
  saveLocalData(local)
  return entry
}

export async function referComplaintToLecturer(complaintId, referralNote) {
  const local = getLocalData()
  const idx = local.complaints.findIndex(c => c.id === complaintId)
  if (idx >= 0) {
    local.complaints[idx].status = 'referred_to_lecturer'
    local.complaints[idx].referral_note = referralNote ? referralNote.trim() : 'Referred to course lecturer for physical script audit and Continuous Assessment verification.'
    local.complaints[idx].referred_at = new Date().toISOString()
    saveLocalData(local)
    return local.complaints[idx]
  }
  return null
}

export async function lecturerSubmitMemoToHOD(complaintId, findings, requestedAdjustment = 'Continuous Assessment score verified and recommended for amendment', memoRef = 'UNN/CSC/REC/2026/014', newCaScore = null) {
  const local = getLocalData()
  const idx = local.complaints.findIndex(c => c.id === complaintId)
  if (idx >= 0) {
    local.complaints[idx].status = 'awaiting_hod_approval'
    local.complaints[idx].lecturer_findings = findings ? findings.trim() : 'Physical Continuous Assessment scripts audited for candidate. Discrepancy confirmed against marked test script and recommended for broadsheet rectification.'
    local.complaints[idx].requested_adjustment = requestedAdjustment
    local.complaints[idx].hod_memo_ref = memoRef
    if (newCaScore !== null && newCaScore !== undefined && !isNaN(Number(newCaScore))) {
      local.complaints[idx].new_ca_score = Number(newCaScore)
    }
    local.complaints[idx].lecturer_memo_date = new Date().toISOString()
    saveLocalData(local)
    return local.complaints[idx]
  }
  return null
}

export async function hodApproveWithdrawal(complaintId, hodNotes = 'Approved for broadsheet line item withdrawal and correction.', hodSignature = 'Dr. (Mrs.) Ifeoma Nwokoye') {
  const local = getLocalData()
  const idx = local.complaints.findIndex(c => c.id === complaintId)
  if (idx >= 0) {
    local.complaints[idx].status = 'hod_approved'
    local.complaints[idx].hod_notes = hodNotes
    local.complaints[idx].hod_signature = hodSignature
    local.complaints[idx].hod_approved_at = new Date().toISOString()
    saveLocalData(local)
    return local.complaints[idx]
  }
  return null
}

export async function submitLecturerRectification(complaintId, lecturerFindings, memoRef = 'UNN/CSC/REC/2026/014', newCaScore = null) {
  return lecturerSubmitMemoToHOD(complaintId, lecturerFindings, 'Continuous Assessment score verified and recommended for amendment', memoRef, newCaScore)
}

export async function examOfficerFinalizeRectification(complaintId, finalResponse) {
  const local = getLocalData()
  const idx = local.complaints.findIndex(c => c.id === complaintId)
  if (idx >= 0) {
    const cmp = local.complaints[idx]
    const resp = finalResponse 
      ? finalResponse.trim() 
      : `Physical script audit confirmed by the Course Lecturer. Result broadsheet line item amended under HOD approval Memo ${cmp.hod_memo_ref || 'UNN/CSC/REC/2026/014'}. Continuous Assessment score rectified and Senate master records updated.`
    local.complaints[idx].status = 'resolved'
    local.complaints[idx].exam_officer_response = resp
    local.complaints[idx].resolved_at = new Date().toISOString()

    // Determine current baseline scores for this specific student and course
    const existingFin = (local.final_results || []).find(f => f.student_id === cmp.student_id && f.course_id === cmp.course_id)
    const existingCa = (local.ca_scores || []).find(c => c.student_id === cmp.student_id && c.course_id === cmp.course_id)
    const existingExam = (local.exam_scores || []).find(e => e.student_id === cmp.student_id && e.course_id === cmp.course_id)

    const currentCa = existingFin ? Number(existingFin.ca_score) : (existingCa ? Number(existingCa.ca_score) : 20)
    const currentExam = existingFin ? Number(existingFin.exam_score) : (existingExam ? Number(existingExam.exam_score) : 52)

    // Calculate verified new CA score dynamically from lecturer input
    let newCa = currentCa + 4 // safe fallback default
    if (cmp.new_ca_score !== undefined && cmp.new_ca_score !== null && !isNaN(Number(cmp.new_ca_score))) {
      newCa = Number(cmp.new_ca_score)
    } else if (cmp.requested_adjustment) {
      const text = cmp.requested_adjustment.trim()
      const slashMatch = text.match(/(\d+)\s*\/\s*30/)
      const toMatch = text.match(/(?:to|->)\s*(\d+)/i)
      const plusMatch = text.match(/\+\s*(\d+)/)
      const directNum = text.match(/\b([1-3]?[0-9])\b/)

      if (slashMatch) {
        newCa = parseInt(slashMatch[1], 10)
      } else if (toMatch) {
        newCa = parseInt(toMatch[1], 10)
      } else if (plusMatch) {
        newCa = currentCa + parseInt(plusMatch[1], 10)
      } else if (directNum && parseInt(directNum[1], 10) <= 30) {
        newCa = parseInt(directNum[1], 10)
      }
    }
    // Clamp between 0 and 30
    newCa = Math.min(30, Math.max(0, newCa))

    const newTotal = newCa + currentExam
    const { grade, gradePoint } = calculateGrade(newTotal)

    // 1. Update or Insert final_results
    const finIdx = (local.final_results || []).findIndex(f => f.student_id === cmp.student_id && f.course_id === cmp.course_id)
    if (finIdx >= 0) {
      local.final_results[finIdx].ca_score = newCa
      local.final_results[finIdx].total_score = newTotal
      local.final_results[finIdx].grade = grade
      local.final_results[finIdx].grade_point = gradePoint
      local.final_results[finIdx].status = 'approved'
    } else {
      local.final_results = local.final_results || []
      local.final_results.push({
        id: generateUUID(),
        student_id: cmp.student_id,
        course_id: cmp.course_id,
        ca_score: newCa,
        exam_score: currentExam,
        total_score: newTotal,
        grade,
        grade_point: gradePoint,
        status: 'approved',
        session: '2025/26',
        created_at: new Date().toISOString()
      })
    }

    // 2. Update or Insert ca_scores
    const caIdx = (local.ca_scores || []).findIndex(c => c.student_id === cmp.student_id && c.course_id === cmp.course_id)
    if (caIdx >= 0) {
      local.ca_scores[caIdx].ca_score = newCa
    } else {
      local.ca_scores = local.ca_scores || []
      local.ca_scores.push({
        id: generateUUID(),
        student_id: cmp.student_id,
        course_id: cmp.course_id,
        ca_score: newCa,
        session: '2025/26',
        uploaded_at: new Date().toISOString()
      })
    }

    saveLocalData(local)

    // 3. Automatically Recompute the Student's Official CGPA & Classification!
    await recomputeStudentCGPA(cmp.student_id)

    return local.complaints[idx]
  }
  return null
}

export async function resolveComplaint(complaintId, responseText) {
  return examOfficerFinalizeRectification(complaintId, responseText)
}

// ----------------- DEFENSE LIVE DEMO CONTROLS -----------------
export async function resetDemoWorkflow(courseCode = 'COS 101', stage = 'hod') {
  const local = getLocalData()
  const crs = (local.courses || []).find(c => c.code === courseCode)
  if (!crs) return { success: false, message: `Course ${courseCode} not found` }

  const courseId = crs.id

  // 1. Remove all distribution records for this course
  local.result_distributions = (local.result_distributions || []).filter(d => d.course_id !== courseId)

  // 1b. Clear all complaints to fresh clean state
  local.complaints = []

  // 2. Reset final_results status
  const targetStatus = stage === 'lecturer' ? 'draft' : 'approved'
  local.final_results = (local.final_results || []).map(r => {
    if (r.course_id === courseId) {
      return { ...r, status: targetStatus }
    }
    return r
  })

  saveLocalData(local)

  // 3. Sync to Supabase
  if (supabase) {
    try {
      await supabase.from('result_distributions').delete().eq('course_id', courseId)
      await supabase.from('final_results').update({ status: targetStatus }).eq('course_id', courseId)
    } catch (err) {
      console.warn('Supabase resetDemoWorkflow sync warning:', err)
    }
  }

  const stageDesc = stage === 'lecturer' 
    ? 'Ready for Lecturer CA spreadsheet upload and scoring.' 
    : 'Ready for live HOD distribution, receiving HOD acknowledgement, and Exam Officer archival.'

  return {
    success: true,
    message: `${courseCode} demo reset successfully! ${stageDesc}`
  }
}

