import { supabase } from './supabase'
import { calculateGrade, calculateCGPA, normalizeRegNumber } from './grading'

const STORAGE_KEY = 'dist_results_system_data_v4'

const initialSeedData = {
  departments: [
    { id: 'd1111111-1111-1111-1111-111111111111', name: 'Computer Science', code: 'COS', faculty: 'Faculty of Science' },
    { id: 'd2222222-2222-2222-2222-222222222222', name: 'Electrical & Electronics Engineering', code: 'EEE', faculty: 'Faculty of Engineering' },
    { id: 'd3333333-3333-3333-3333-333333333333', name: 'Mechanical Engineering', code: 'MEE', faculty: 'Faculty of Engineering' },
    { id: 'd4444444-4444-4444-4444-444444444444', name: 'Mathematics', code: 'MTH', faculty: 'Faculty of Science' }
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
      full_name: 'Prof. Babatunde Adeleke',
      role: 'hod',
      department_id: 'd1111111-1111-1111-1111-111111111111'
    },
    {
      id: 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaac',
      email: 'hod.eee@institution.edu.ng',
      password_hash: 'password123',
      full_name: 'Dr. Chinwe Okeke',
      role: 'hod',
      department_id: 'd2222222-2222-2222-2222-222222222222'
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
    // ── Level 100 (admitted 2025) ──────────────────────────────────────────
    {
      id: 'b0101010-b101-b101-b101-b10101010101',
      reg_number: '2025/100001',
      full_name: 'Adaeze Nwosu',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 100,
      session: '2025/26'
    },
    {
      id: 'b0101010-b101-b101-b101-b10101010102',
      reg_number: '2025/100002',
      full_name: 'Seun Akinwale',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 100,
      session: '2025/26'
    },
    {
      id: 'b0101010-b101-b101-b101-b10101010103',
      reg_number: '2025/100003',
      full_name: 'Hauwa Musa',
      department_id: 'd2222222-2222-2222-2222-222222222222',
      level: 100,
      session: '2025/26'
    },
    {
      id: 'b0101010-b101-b101-b101-b10101010104',
      reg_number: '2025/100004',
      full_name: 'Tochukwu Igwe',
      department_id: 'd3333333-3333-3333-3333-333333333333',
      level: 100,
      session: '2025/26'
    },
    {
      id: 'b0101010-b101-b101-b101-b10101010105',
      reg_number: '2025/100005',
      full_name: 'Zainab Umar',
      department_id: 'd4444444-4444-4444-4444-444444444444',
      level: 100,
      session: '2025/26'
    },

    // ── Level 200 (admitted 2024) ──────────────────────────────────────────
    {
      id: 'b0202020-b202-b202-b202-b20202020201',
      reg_number: '2024/200001',
      full_name: 'Ikenna Okafor',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 200,
      session: '2025/26'
    },
    {
      id: 'b0202020-b202-b202-b202-b20202020202',
      reg_number: '2024/200002',
      full_name: 'Blessing Afolabi',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 200,
      session: '2025/26'
    },
    {
      id: 'b0202020-b202-b202-b202-b20202020203',
      reg_number: '2024/200003',
      full_name: 'Mubarak Garba',
      department_id: 'd2222222-2222-2222-2222-222222222222',
      level: 200,
      session: '2025/26'
    },
    {
      id: 'b0202020-b202-b202-b202-b20202020204',
      reg_number: '2024/200004',
      full_name: 'Chisom Anieke',
      department_id: 'd3333333-3333-3333-3333-333333333333',
      level: 200,
      session: '2025/26'
    },
    {
      id: 'b0202020-b202-b202-b202-b20202020205',
      reg_number: '2024/200005',
      full_name: 'Yusuf Abdullahi',
      department_id: 'd4444444-4444-4444-4444-444444444444',
      level: 200,
      session: '2025/26'
    },

    // ── Level 300 (admitted 2023) ──────────────────────────────────────────
    {
      id: 'b0303030-b303-b303-b303-b30303030301',
      reg_number: '2023/300001',
      full_name: 'Ngozi Onyekachi',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 300,
      session: '2025/26'
    },
    {
      id: 'b0303030-b303-b303-b303-b30303030302',
      reg_number: '2023/300002',
      full_name: 'Abdulrahman Suleiman',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 300,
      session: '2025/26'
    },
    {
      id: 'b0303030-b303-b303-b303-b30303030303',
      reg_number: '2023/300003',
      full_name: 'Kemi Adeyemi',
      department_id: 'd2222222-2222-2222-2222-222222222222',
      level: 300,
      session: '2025/26'
    },
    {
      id: 'b0303030-b303-b303-b303-b30303030304',
      reg_number: '2023/300004',
      full_name: 'Obinna Nnamdi',
      department_id: 'd3333333-3333-3333-3333-333333333333',
      level: 300,
      session: '2025/26'
    },
    {
      id: 'b0303030-b303-b303-b303-b30303030305',
      reg_number: '2023/300005',
      full_name: 'Amina Lawal',
      department_id: 'd4444444-4444-4444-4444-444444444444',
      level: 300,
      session: '2025/26'
    },

    // ── Level 400 (admitted 2022) ──────────────────────────────────────────
    {
      id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      reg_number: '2022/234567',
      full_name: 'Chukwuebuka Obi',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 400,
      session: '2025/26'
    },
    {
      id: 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
      reg_number: '2022/234568',
      full_name: 'Fatima Bello',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      level: 400,
      session: '2025/26'
    },
    {
      id: 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
      reg_number: '2022/235001',
      full_name: 'Damilola Adeleke',
      department_id: 'd2222222-2222-2222-2222-222222222222',
      level: 400,
      session: '2025/26'
    },
    {
      id: 'b4444444-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
      reg_number: '2022/236001',
      full_name: 'Emeka Eze',
      department_id: 'd3333333-3333-3333-3333-333333333333',
      level: 400,
      session: '2025/26'
    },
    {
      id: 'b4444444-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
      reg_number: '2022/236002',
      full_name: 'Rukayat Salami',
      department_id: 'd4444444-4444-4444-4444-444444444444',
      level: 400,
      session: '2025/26'
    }
  ],
  courses: [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      code: 'COS401',
      title: 'Distributed Systems',
      credit_units: 3,
      semester: 'first',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      session: '2025/26'
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      code: 'COS403',
      title: 'Compiler Construction',
      credit_units: 3,
      semester: 'first',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      session: '2025/26'
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      code: 'COS405',
      title: 'Software Engineering Practice',
      credit_units: 2,
      semester: 'first',
      lecturer_id: 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      session: '2025/26'
    },
    {
      id: 'c4444444-4444-4444-4444-444444444444',
      code: 'EEE401',
      title: 'Microprocessor Systems',
      credit_units: 3,
      semester: 'first',
      lecturer_id: null,
      department_id: 'd2222222-2222-2222-2222-222222222222',
      session: '2025/26'
    }
  ],
  enrollments: [
    { id: 'e1', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c1111111-1111-1111-1111-111111111111', session: '2025/26', semester: 'first' },
    { id: 'e2', student_id: 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', course_id: 'c1111111-1111-1111-1111-111111111111', session: '2025/26', semester: 'first' },
    // Interdepartmental enrollment: EEE student takes COS401
    { id: 'e3', student_id: 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', course_id: 'c1111111-1111-1111-1111-111111111111', session: '2025/26', semester: 'first' },
    { id: 'e4', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c2222222-2222-2222-2222-222222222222', session: '2025/26', semester: 'first' }
  ],
  exam_scores: [
    { id: 'es1', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c1111111-1111-1111-1111-111111111111', exam_score: 52, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es2', student_id: 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', course_id: 'c1111111-1111-1111-1111-111111111111', exam_score: 58, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'es3', student_id: 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', course_id: 'c1111111-1111-1111-1111-111111111111', exam_score: 45, session: '2025/26', uploaded_at: new Date().toISOString() }
  ],
  ca_scores: [
    { id: 'ca1', student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', course_id: 'c1111111-1111-1111-1111-111111111111', ca_score: 25, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca2', student_id: 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', course_id: 'c1111111-1111-1111-1111-111111111111', ca_score: 22, session: '2025/26', uploaded_at: new Date().toISOString() },
    { id: 'ca3', student_id: 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', course_id: 'c1111111-1111-1111-1111-111111111111', ca_score: 20, session: '2025/26', uploaded_at: new Date().toISOString() }
  ],
  final_results: [
    {
      id: 'fr1',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      course_id: 'c1111111-1111-1111-1111-111111111111',
      ca_score: 25,
      exam_score: 52,
      total_score: 77,
      grade: 'A',
      grade_point: 5.0,
      status: 'approved',
      session: '2025/26'
    },
    {
      id: 'fr2',
      student_id: 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
      course_id: 'c1111111-1111-1111-1111-111111111111',
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
      student_id: 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
      course_id: 'c1111111-1111-1111-1111-111111111111',
      ca_score: 20,
      exam_score: 45,
      total_score: 65,
      grade: 'B',
      grade_point: 4.0,
      status: 'approved',
      session: '2025/26'
    }
  ],
  hod_profiles: [
    {
      id: 'f1111111-1111-1111-1111-111111111111',
      user_id: 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaab',
      full_name: 'Prof. Babatunde Adeleke',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      rank: 'Professor of Computer Science',
      phone: '+234 803 123 4567',
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">B.Adeleke</text></svg>'
    },
    {
      id: 'f2222222-2222-2222-2222-222222222222',
      user_id: 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaac',
      full_name: 'Dr. Chinwe Okeke',
      department_id: 'd2222222-2222-2222-2222-222222222222',
      rank: 'Associate Professor',
      phone: '+234 802 987 6543',
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E3A8A">C.Okeke</text></svg>'
    }
  ],
  result_distributions: [
    {
      id: 'rd1',
      course_id: 'c1111111-1111-1111-1111-111111111111',
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
  complaints: [
    {
      id: 'cmp1',
      student_id: 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba',
      course_id: 'c1111111-1111-1111-1111-111111111111',
      complaint_text: 'My continuous assessment test 2 score was 14/15 instead of 10 recorded. Please verify with course lecturer.',
      status: 'pending',
      exam_officer_response: null,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      resolved_at: null
    }
  ]
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
    id: `d-${Date.now()}`,
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
    id: `u-${Date.now()}`,
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

export async function addStudent(studentData) {
  const reg = normalizeRegNumber(studentData.reg_number)
  const newStudent = {
    id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reg_number: reg,
    full_name: studentData.full_name,
    department_id: studentData.department_id,
    level: Number(studentData.level) || 100,
    session: studentData.session || '2025/26',
    created_at: new Date().toISOString()
  }

  if (isSupabaseReady()) {
    try {
      await supabase.from('students').insert([newStudent])
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
    id: `c-${Date.now()}`,
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
    id: `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
export async function getExamScores(courseId) {
  if (isSupabaseReady()) {
    try {
      let query = supabase.from('exam_scores').select('*')
      if (courseId) query = query.eq('course_id', courseId)
      const { data, error } = await query
      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase exam scores read error', e)
    }
  }
  const all = getLocalData().exam_scores || []
  return courseId ? all.filter(e => e.course_id === courseId) : all
}

export async function saveExamScores(scores) {
  const local = getLocalData()
  for (const s of scores) {
    const existingIdx = local.exam_scores.findIndex(
      e => e.student_id === s.student_id && e.course_id === s.course_id && e.session === (s.session || '2025/26')
    )
    const entry = {
      id: existingIdx >= 0 ? local.exam_scores[existingIdx].id : `es-${Date.now()}-${Math.random()}`,
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
  }
  saveLocalData(local)
  return true
}

// ----------------- CA SCORES (0-30) -----------------
export async function getCaScores(courseId) {
  if (isSupabaseReady()) {
    try {
      let query = supabase.from('ca_scores').select('*')
      if (courseId) query = query.eq('course_id', courseId)
      const { data, error } = await query
      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase ca scores read error', e)
    }
  }
  const all = getLocalData().ca_scores || []
  return courseId ? all.filter(c => c.course_id === courseId) : all
}

export async function saveCaScores(scores) {
  const local = getLocalData()
  for (const s of scores) {
    const existingIdx = local.ca_scores.findIndex(
      c => c.student_id === s.student_id && c.course_id === s.course_id && c.session === (s.session || '2025/26')
    )
    const entry = {
      id: existingIdx >= 0 ? local.ca_scores[existingIdx].id : `ca-${Date.now()}-${Math.random()}`,
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
  }
  saveLocalData(local)
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
      if (!error && data) return data
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
  for (const r of results) {
    const total = Number(r.ca_score || 0) + Number(r.exam_score || 0)
    const { grade, gradePoint } = calculateGrade(total)

    const existingIdx = local.final_results.findIndex(
      f => f.student_id === r.student_id && f.course_id === r.course_id && f.session === (r.session || '2025/26')
    )

    const entry = {
      id: existingIdx >= 0 ? local.final_results[existingIdx].id : `fr-${Date.now()}-${Math.random()}`,
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
  }
  saveLocalData(local)
  return true
}

export async function updateCourseResultsStatus(courseId, newStatus) {
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
    id: existingIdx >= 0 ? local.hod_profiles[existingIdx].id : `h-${Date.now()}`,
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
  const local = getLocalData()
  return local.result_distributions || []
}

export async function createResultDistribution(courseId, session, semester, sentByHodId, receivingDeptIds) {
  const local = getLocalData()
  const created = []

  for (const deptId of receivingDeptIds) {
    const existing = local.result_distributions.find(
      d => d.course_id === courseId && d.received_by_dept_id === deptId && d.session === session
    )
    if (!existing) {
      const entry = {
        id: `rd-${Date.now()}-${Math.random()}`,
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
    }
  }

  // Also mark final results as distributed
  local.final_results = local.final_results.map(r => {
    if (r.course_id === courseId) return { ...r, status: 'distributed' }
    return r
  })

  saveLocalData(local)
  return created
}

export async function acknowledgeDistribution(distributionId, acknowledgedById) {
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
    id: existingIdx >= 0 ? local.cgpa_records[existingIdx].id : `cg-${Date.now()}`,
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

export async function createComplaint(studentId, courseId, complaintText) {
  const local = getLocalData()
  const entry = {
    id: `cmp-${Date.now()}`,
    student_id: studentId,
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

export async function resolveComplaint(complaintId, responseText) {
  const local = getLocalData()
  const idx = local.complaints.findIndex(c => c.id === complaintId)
  if (idx >= 0) {
    local.complaints[idx].status = 'resolved'
    local.complaints[idx].exam_officer_response = responseText.trim()
    local.complaints[idx].resolved_at = new Date().toISOString()
    saveLocalData(local)
    return local.complaints[idx]
  }
  return null
}
