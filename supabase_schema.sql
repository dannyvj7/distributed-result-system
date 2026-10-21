-- ============================================================
-- Distributed Student Result Management System - Schema
-- Nigerian Tertiary Institution (NUC 5-Point Grading System)
-- ============================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    faculty VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS (Staff and Administrative Accounts)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'lecturer', 'hod', 'exam_officer', 'student')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_number VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    level INTEGER NOT NULL CHECK (level IN (100, 200, 300, 400, 500)),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COURSES
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    credit_units INTEGER NOT NULL CHECK (credit_units BETWEEN 1 AND 6),
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('first', 'second')),
    lecturer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_course_per_session UNIQUE(code, session)
);

-- 5. ENROLLMENTS
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('first', 'second')),
    CONSTRAINT unique_student_course_enrollment UNIQUE(student_id, course_id, session)
);

-- 6. EXAM SCORES (0-70)
CREATE TABLE IF NOT EXISTS exam_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    exam_score NUMERIC(5,2) NOT NULL CHECK (exam_score >= 0 AND exam_score <= 70),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_course_exam UNIQUE(student_id, course_id, session)
);

-- 7. CA SCORES (0-30)
CREATE TABLE IF NOT EXISTS ca_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    ca_score NUMERIC(5,2) NOT NULL CHECK (ca_score >= 0 AND ca_score <= 30),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_course_ca UNIQUE(student_id, course_id, session)
);

-- 8. FINAL RESULTS
CREATE TABLE IF NOT EXISTS final_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    ca_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    exam_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_score NUMERIC(5,2) NOT NULL,
    grade VARCHAR(2) NOT NULL,
    grade_point NUMERIC(3,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'distributed')),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_course_final UNIQUE(student_id, course_id, session)
);

-- 9. HOD PROFILES (Including digital signature)
CREATE TABLE IF NOT EXISTS hod_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    rank VARCHAR(100) NOT NULL DEFAULT 'Professor',
    phone VARCHAR(50),
    signature_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_hod_dept UNIQUE(department_id)
);

-- 10. RESULT DISTRIBUTIONS (Inter-departmental dispatch & acknowledgement)
CREATE TABLE IF NOT EXISTS result_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('first', 'second')),
    sent_by_hod_id UUID NOT NULL REFERENCES users(id),
    received_by_dept_id UUID NOT NULL REFERENCES departments(id),
    status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by_id UUID REFERENCES users(id)
);

-- 11. CGPA RECORDS
CREATE TABLE IF NOT EXISTS cgpa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    total_credit_units INTEGER NOT NULL DEFAULT 0,
    total_quality_points NUMERIC(6,2) NOT NULL DEFAULT 0,
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    classification VARCHAR(100) NOT NULL DEFAULT 'Fail',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_cgpa UNIQUE(student_id)
);

-- 12. COMPLAINTS
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    complaint_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    exam_officer_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert Departments
INSERT INTO departments (id, name, code, faculty) VALUES
('d1111111-1111-1111-1111-111111111111', 'Computer Science', 'COS', 'Faculty of Science'),
('d2222222-2222-2222-2222-222222222222', 'Electrical & Electronics Engineering', 'EEE', 'Faculty of Engineering'),
('d3333333-3333-3333-3333-333333333333', 'Mechanical Engineering', 'MEE', 'Faculty of Engineering'),
('d4444444-4444-4444-4444-444444444444', 'Mathematics', 'MTH', 'Faculty of Science')
ON CONFLICT (code) DO NOTHING;

-- Insert Users (Password is 'password123' for staff, 'student123' for students)
INSERT INTO users (id, email, password_hash, full_name, role, department_id) VALUES
('u1111111-1111-1111-1111-111111111111', 'admin@institution.edu.ng', 'password123', 'Engr. Kenneth Okonjo (ICT Admin)', 'admin', 'd1111111-1111-1111-1111-111111111111'),
('u2222222-2222-2222-2222-222222222222', 'hod.csc@institution.edu.ng', 'password123', 'Prof. Babatunde Adeleke', 'hod', 'd1111111-1111-1111-1111-111111111111'),
('u3333333-3333-3333-3333-333333333333', 'hod.eee@institution.edu.ng', 'password123', 'Dr. Chinwe Okeke', 'hod', 'd2222222-2222-2222-2222-222222222222'),
('u4444444-4444-4444-4444-444444444444', 'lecturer.csc@institution.edu.ng', 'password123', 'Dr. Aminu Ibrahim', 'lecturer', 'd1111111-1111-1111-1111-111111111111'),
('u5555555-5555-5555-5555-555555555555', 'exam.officer@institution.edu.ng', 'password123', 'Mrs. Folake Adebayo', 'exam_officer', 'd1111111-1111-1111-1111-111111111111'),
('u6666666-6666-6666-6666-666666666666', '2022/234567@student.institution.edu.ng', 'student123', 'Chukwuebuka Obi', 'student', 'd1111111-1111-1111-1111-111111111111')
ON CONFLICT (email) DO NOTHING;

-- Insert HOD Profile for Prof Adeleke
INSERT INTO hod_profiles (id, user_id, full_name, department_id, rank, phone, signature_url) VALUES
('h1111111-1111-1111-1111-111111111111', 'u2222222-2222-2222-2222-222222222222', 'Prof. Babatunde Adeleke', 'd1111111-1111-1111-1111-111111111111', 'Professor of Computer Science', '+234 803 123 4567', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="40" font-family="cursive" font-size="28" fill="%231E3A8A">B.Adeleke</text></svg>')
ON CONFLICT (department_id) DO NOTHING;

-- Insert Students
INSERT INTO students (id, reg_number, full_name, department_id, level, session) VALUES
('s1111111-1111-1111-1111-111111111111', '2022/234567', 'Chukwuebuka Obi', 'd1111111-1111-1111-1111-111111111111', 400, '2025/26'),
('s2222222-2222-2222-2222-222222222222', '2022/234568', 'Fatima Bello', 'd1111111-1111-1111-1111-111111111111', 400, '2025/26'),
('s3333333-3333-3333-3333-333333333333', '2022/235001', 'Damilola Adeleke', 'd2222222-2222-2222-2222-222222222222', 400, '2025/26'),
('s4444444-4444-4444-4444-444444444444', '2022/236001', 'Emeka Eze', 'd3333333-3333-3333-3333-333333333333', 400, '2025/26')
ON CONFLICT (reg_number) DO NOTHING;

-- Insert Courses
INSERT INTO courses (id, code, title, credit_units, semester, lecturer_id, session) VALUES
('c1111111-1111-1111-1111-111111111111', 'COS401', 'Distributed Systems', 3, 'first', 'u4444444-4444-4444-4444-444444444444', '2025/26'),
('c2222222-2222-2222-2222-222222222222', 'COS403', 'Compiler Construction', 3, 'first', 'u4444444-4444-4444-4444-444444444444', '2025/26'),
('c3333333-3333-3333-3333-333333333333', 'COS405', 'Software Engineering Practice', 2, 'first', 'u4444444-4444-4444-4444-444444444444', '2025/26'),
('c4444444-4444-4444-4444-444444444444', 'EEE401', 'Microprocessor Systems & Interfacing', 3, 'first', NULL, '2025/26')
ON CONFLICT (code, session) DO NOTHING;

-- Enrollments: COS401 is taken by both CSC and EEE students
INSERT INTO enrollments (id, student_id, course_id, session, semester) VALUES
('e1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '2025/26', 'first'),
('e2222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '2025/26', 'first'),
('e3333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', '2025/26', 'first'),
('e4444444-4444-4444-4444-444444444444', 's1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', '2025/26', 'first')
ON CONFLICT DO NOTHING;

-- Exam Scores (0-70) for COS401
INSERT INTO exam_scores (student_id, course_id, exam_score, session) VALUES
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 52.0, '2025/26'),
('s2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 58.0, '2025/26'),
('s3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 45.0, '2025/26')
ON CONFLICT DO NOTHING;

-- CA Scores (0-30) for COS401
INSERT INTO ca_scores (student_id, course_id, ca_score, session) VALUES
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 25.0, '2025/26'),
('s2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 22.0, '2025/26'),
('s3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 20.0, '2025/26')
ON CONFLICT DO NOTHING;

-- Initial Final Results
INSERT INTO final_results (student_id, course_id, ca_score, exam_score, total_score, grade, grade_point, status, session) VALUES
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 25.0, 52.0, 77.0, 'A', 5.0, 'approved', '2025/26'),
('s2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 22.0, 58.0, 80.0, 'A', 5.0, 'approved', '2025/26'),
('s3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 20.0, 45.0, 65.0, 'B', 4.0, 'approved', '2025/26')
ON CONFLICT DO NOTHING;

-- Initial CGPA Records
INSERT INTO cgpa_records (student_id, total_credit_units, total_quality_points, cgpa, classification) VALUES
('s1111111-1111-1111-1111-111111111111', 3, 15.0, 5.00, 'First Class Honours'),
('s2222222-2222-2222-2222-222222222222', 3, 15.0, 5.00, 'First Class Honours'),
('s3333333-3333-3333-3333-333333333333', 3, 12.0, 4.00, 'Second Class Honours (Upper Division)')
ON CONFLICT (student_id) DO NOTHING;

-- Initial Complaints
INSERT INTO complaints (student_id, course_id, complaint_text, status, exam_officer_response) VALUES
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'My continuous assessment test 2 score was 14/15 instead of 10 recorded. Please verify with course lecturer.', 'pending', NULL)
ON CONFLICT DO NOTHING;
