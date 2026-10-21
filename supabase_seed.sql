-- ============================================================
-- FULL RESET + SEED - Distributed Student Result Management System
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop all tables cleanly (order matters due to foreign keys)
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS cgpa_records CASCADE;
DROP TABLE IF EXISTS result_distributions CASCADE;
DROP TABLE IF EXISTS hod_profiles CASCADE;
DROP TABLE IF EXISTS final_results CASCADE;
DROP TABLE IF EXISTS ca_scores CASCADE;
DROP TABLE IF EXISTS exam_scores CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    faculty VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'lecturer', 'hod', 'exam_officer', 'student')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_number VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    level INTEGER NOT NULL CHECK (level IN (100, 200, 300, 400, 500)),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COURSES
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    credit_units INTEGER NOT NULL CHECK (credit_units BETWEEN 1 AND 6),
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('first', 'second')),
    lecturer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_course_per_session UNIQUE(code, session)
);

-- 5. ENROLLMENTS
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('first', 'second')),
    CONSTRAINT unique_enrollment UNIQUE(student_id, course_id, session)
);

-- 6. EXAM SCORES (0-70)
CREATE TABLE exam_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    exam_score NUMERIC(5,2) NOT NULL CHECK (exam_score >= 0 AND exam_score <= 70),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_exam_score UNIQUE(student_id, course_id, session)
);

-- 7. CA SCORES (0-30)
CREATE TABLE ca_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    ca_score NUMERIC(5,2) NOT NULL CHECK (ca_score >= 0 AND ca_score <= 30),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_ca_score UNIQUE(student_id, course_id, session)
);

-- 8. FINAL RESULTS (total_score is a plain column, NOT generated)
CREATE TABLE final_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    ca_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    exam_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    grade VARCHAR(2) NOT NULL DEFAULT 'F',
    grade_point NUMERIC(3,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'distributed')),
    session VARCHAR(50) NOT NULL DEFAULT '2025/26',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_final_result UNIQUE(student_id, course_id, session)
);

-- 9. HOD PROFILES
CREATE TABLE hod_profiles (
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

-- 10. RESULT DISTRIBUTIONS
CREATE TABLE result_distributions (
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

-- 11. CGPA RECORDS (cgpa is a plain column, NOT generated)
CREATE TABLE cgpa_records (
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
CREATE TABLE complaints (
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

-- Departments
INSERT INTO departments (id, name, code, faculty) VALUES
('d1111111-1111-1111-1111-111111111111', 'Computer Science', 'COS', 'Faculty of Science'),
('d2222222-2222-2222-2222-222222222222', 'Electrical & Electronics Engineering', 'EEE', 'Faculty of Engineering'),
('d3333333-3333-3333-3333-333333333333', 'Mechanical Engineering', 'MEE', 'Faculty of Engineering'),
('d4444444-4444-4444-4444-444444444444', 'Mathematics', 'MTH', 'Faculty of Science');

-- Staff Users
INSERT INTO users (id, email, password_hash, full_name, role, department_id) VALUES
('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@institution.edu.ng', 'password123', 'Engr. Kenneth Okonjo (ICT Admin)', 'admin', 'd1111111-1111-1111-1111-111111111111'),
('a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'hod.csc@institution.edu.ng', 'password123', 'Prof. Babatunde Adeleke', 'hod', 'd1111111-1111-1111-1111-111111111111'),
('a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'hod.eee@institution.edu.ng', 'password123', 'Dr. Chinwe Okeke', 'hod', 'd2222222-2222-2222-2222-222222222222'),
('a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'lecturer.csc@institution.edu.ng', 'password123', 'Dr. Aminu Ibrahim', 'lecturer', 'd1111111-1111-1111-1111-111111111111'),
('a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'exam.officer@institution.edu.ng', 'password123', 'Mrs. Folake Adebayo', 'exam_officer', 'd1111111-1111-1111-1111-111111111111'),
('a6666666-aaaa-aaaa-aaaa-aaaaaaaaaaaf', '2022_234567@student.institution.edu.ng', 'student123', 'Chukwuebuka Obi', 'student', 'd1111111-1111-1111-1111-111111111111');

-- HOD Profiles
INSERT INTO hod_profiles (id, user_id, full_name, department_id, rank, phone) VALUES
('f1111111-1111-1111-1111-111111111111', 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'Prof. Babatunde Adeleke', 'd1111111-1111-1111-1111-111111111111', 'Professor of Computer Science', '+234 803 123 4567'),
('f2222222-2222-2222-2222-222222222222', 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'Dr. Chinwe Okeke', 'd2222222-2222-2222-2222-222222222222', 'Senior Lecturer', '+234 806 234 5678');

-- Students - Level 100 (admitted 2025)
INSERT INTO students (id, reg_number, full_name, department_id, level, session) VALUES
('b0101010-b101-b101-b101-b10101010101', '2025/100001', 'Adaeze Nwosu', 'd1111111-1111-1111-1111-111111111111', 100, '2025/26'),
('b0101010-b101-b101-b101-b10101010102', '2025/100002', 'Seun Akinwale', 'd1111111-1111-1111-1111-111111111111', 100, '2025/26'),
('b0101010-b101-b101-b101-b10101010103', '2025/100003', 'Hauwa Musa', 'd2222222-2222-2222-2222-222222222222', 100, '2025/26'),
('b0101010-b101-b101-b101-b10101010104', '2025/100004', 'Tochukwu Igwe', 'd3333333-3333-3333-3333-333333333333', 100, '2025/26'),
('b0101010-b101-b101-b101-b10101010105', '2025/100005', 'Zainab Umar', 'd4444444-4444-4444-4444-444444444444', 100, '2025/26');

-- Students - Level 200 (admitted 2024)
INSERT INTO students (id, reg_number, full_name, department_id, level, session) VALUES
('b0202020-b202-b202-b202-b20202020201', '2024/200001', 'Ikenna Okafor', 'd1111111-1111-1111-1111-111111111111', 200, '2025/26'),
('b0202020-b202-b202-b202-b20202020202', '2024/200002', 'Blessing Afolabi', 'd1111111-1111-1111-1111-111111111111', 200, '2025/26'),
('b0202020-b202-b202-b202-b20202020203', '2024/200003', 'Mubarak Garba', 'd2222222-2222-2222-2222-222222222222', 200, '2025/26'),
('b0202020-b202-b202-b202-b20202020204', '2024/200004', 'Chisom Anieke', 'd3333333-3333-3333-3333-333333333333', 200, '2025/26'),
('b0202020-b202-b202-b202-b20202020205', '2024/200005', 'Yusuf Abdullahi', 'd4444444-4444-4444-4444-444444444444', 200, '2025/26');

-- Students - Level 300 (admitted 2023)
INSERT INTO students (id, reg_number, full_name, department_id, level, session) VALUES
('b0303030-b303-b303-b303-b30303030301', '2023/300001', 'Ngozi Onyekachi', 'd1111111-1111-1111-1111-111111111111', 300, '2025/26'),
('b0303030-b303-b303-b303-b30303030302', '2023/300002', 'Abdulrahman Suleiman', 'd1111111-1111-1111-1111-111111111111', 300, '2025/26'),
('b0303030-b303-b303-b303-b30303030303', '2023/300003', 'Kemi Adeyemi', 'd2222222-2222-2222-2222-222222222222', 300, '2025/26'),
('b0303030-b303-b303-b303-b30303030304', '2023/300004', 'Obinna Nnamdi', 'd3333333-3333-3333-3333-333333333333', 300, '2025/26'),
('b0303030-b303-b303-b303-b30303030305', '2023/300005', 'Amina Lawal', 'd4444444-4444-4444-4444-444444444444', 300, '2025/26');

-- Students - Level 400 (admitted 2022)
INSERT INTO students (id, reg_number, full_name, department_id, level, session) VALUES
('b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', '2022/234567', 'Chukwuebuka Obi', 'd1111111-1111-1111-1111-111111111111', 400, '2025/26'),
('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '2022/234568', 'Fatima Bello', 'd1111111-1111-1111-1111-111111111111', 400, '2025/26'),
('b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '2022/235001', 'Damilola Adeleke', 'd2222222-2222-2222-2222-222222222222', 400, '2025/26'),
('b4444444-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '2022/236001', 'Emeka Eze', 'd3333333-3333-3333-3333-333333333333', 400, '2025/26'),
('b4444444-bbbb-bbbb-bbbb-bbbbbbbbbbb5', '2022/236002', 'Rukayat Salami', 'd4444444-4444-4444-4444-444444444444', 400, '2025/26');

-- Courses
INSERT INTO courses (id, code, title, credit_units, semester, lecturer_id, department_id, session) VALUES
('c1111111-1111-1111-1111-111111111111', 'COS401', 'Distributed Systems', 3, 'first', 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'd1111111-1111-1111-1111-111111111111', '2025/26'),
('c2222222-2222-2222-2222-222222222222', 'COS403', 'Compiler Construction', 3, 'first', 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'd1111111-1111-1111-1111-111111111111', '2025/26'),
('c3333333-3333-3333-3333-333333333333', 'COS405', 'Software Engineering Practice', 2, 'first', 'a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'd1111111-1111-1111-1111-111111111111', '2025/26'),
('c4444444-4444-4444-4444-444444444444', 'EEE401', 'Microprocessor Systems & Interfacing', 3, 'first', NULL, 'd2222222-2222-2222-2222-222222222222', '2025/26');

-- Enrollments
INSERT INTO enrollments (id, student_id, course_id, session, semester) VALUES
('e1111111-1111-1111-1111-111111111111', 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'c1111111-1111-1111-1111-111111111111', '2025/26', 'first'),
('e2222222-2222-2222-2222-222222222222', 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'c1111111-1111-1111-1111-111111111111', '2025/26', 'first'),
('e3333333-3333-3333-3333-333333333333', 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'c1111111-1111-1111-1111-111111111111', '2025/26', 'first'),
('e4444444-4444-4444-4444-444444444444', 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'c2222222-2222-2222-2222-222222222222', '2025/26', 'first');

-- Exam Scores (0-70)
INSERT INTO exam_scores (student_id, course_id, exam_score, session) VALUES
('b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'c1111111-1111-1111-1111-111111111111', 52.0, '2025/26'),
('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'c1111111-1111-1111-1111-111111111111', 58.0, '2025/26'),
('b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'c1111111-1111-1111-1111-111111111111', 45.0, '2025/26');

-- CA Scores (0-30)
INSERT INTO ca_scores (student_id, course_id, ca_score, session) VALUES
('b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'c1111111-1111-1111-1111-111111111111', 25.0, '2025/26'),
('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'c1111111-1111-1111-1111-111111111111', 22.0, '2025/26'),
('b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'c1111111-1111-1111-1111-111111111111', 20.0, '2025/26');

-- Final Results
INSERT INTO final_results (student_id, course_id, ca_score, exam_score, total_score, grade, grade_point, status, session) VALUES
('b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'c1111111-1111-1111-1111-111111111111', 25.0, 52.0, 77.0, 'A', 5.0, 'approved', '2025/26'),
('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'c1111111-1111-1111-1111-111111111111', 22.0, 58.0, 80.0, 'A', 5.0, 'approved', '2025/26'),
('b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'c1111111-1111-1111-1111-111111111111', 20.0, 45.0, 65.0, 'B', 4.0, 'approved', '2025/26');

-- CGPA Records
INSERT INTO cgpa_records (student_id, total_credit_units, total_quality_points, cgpa, classification) VALUES
('b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', 3, 15.0, 5.00, 'First Class Honours'),
('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 3, 15.0, 5.00, 'First Class Honours'),
('b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 3, 12.0, 4.00, 'Second Class Honours (Upper Division)');

-- Sample Complaint
INSERT INTO complaints (student_id, course_id, complaint_text, status) VALUES
('b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'c1111111-1111-1111-1111-111111111111', 'My continuous assessment test 2 score was 14/15 instead of 10 recorded. Please verify with course lecturer.', 'pending');
