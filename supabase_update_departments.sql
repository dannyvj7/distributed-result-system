-- Fix department updates in the correct order to avoid unique code conflicts
-- Run this in: https://supabase.com/dashboard/project/zcgcwptmanhfstfrdwir/sql/new

-- Step 1: Change d4444444 from MTH → CRB (frees up MTH code)
UPDATE departments SET name = 'Computer Robotics', code = 'CRB', faculty = 'Faculty of Education'
WHERE id = 'd4444444-4444-4444-4444-444444444444';

-- Step 2: Change d3333333 from MEE → VTE (frees up MEE code)
UPDATE departments SET name = 'Vocational & Technology Education', code = 'VTE', faculty = 'Faculty of Vocational and Technical Education'
WHERE id = 'd3333333-3333-3333-3333-333333333333';

-- Step 3: Change d2222222 from EEE → MTH (MTH code is now free)
UPDATE departments SET name = 'Mathematics', code = 'MTH', faculty = 'Faculty of Physical Sciences'
WHERE id = 'd2222222-2222-2222-2222-222222222222';

-- Step 4: Add new Mechanical Engineering (MEE code is now free)
INSERT INTO departments (id, name, code, faculty)
VALUES ('d5555555-5555-5555-5555-555555555555', 'Mechanical Engineering', 'MEE', 'Faculty of Engineering')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Update student department assignments
UPDATE students SET department_id = 'd2222222-2222-2222-2222-222222222222' WHERE reg_number = '2025/100002';
UPDATE students SET department_id = 'd3333333-3333-3333-3333-333333333333' WHERE reg_number = '2025/100003';
UPDATE students SET department_id = 'd4444444-4444-4444-4444-444444444444' WHERE reg_number = '2025/100004';
UPDATE students SET department_id = 'd5555555-5555-5555-5555-555555555555' WHERE reg_number = '2025/100005';

UPDATE students SET department_id = 'd2222222-2222-2222-2222-222222222222' WHERE reg_number = '2024/200002';
UPDATE students SET department_id = 'd3333333-3333-3333-3333-333333333333' WHERE reg_number = '2024/200003';
UPDATE students SET department_id = 'd4444444-4444-4444-4444-444444444444' WHERE reg_number = '2024/200004';
UPDATE students SET department_id = 'd5555555-5555-5555-5555-555555555555' WHERE reg_number = '2024/200005';

UPDATE students SET department_id = 'd2222222-2222-2222-2222-222222222222' WHERE reg_number = '2023/300002';
UPDATE students SET department_id = 'd3333333-3333-3333-3333-333333333333' WHERE reg_number = '2023/300003';
UPDATE students SET department_id = 'd4444444-4444-4444-4444-444444444444' WHERE reg_number = '2023/300004';
UPDATE students SET department_id = 'd5555555-5555-5555-5555-555555555555' WHERE reg_number = '2023/300005';

UPDATE students SET department_id = 'd2222222-2222-2222-2222-222222222222' WHERE reg_number = '2022/234568';
UPDATE students SET department_id = 'd3333333-3333-3333-3333-333333333333' WHERE reg_number = '2022/235001';
UPDATE students SET department_id = 'd4444444-4444-4444-4444-444444444444' WHERE reg_number = '2022/236001';
UPDATE students SET department_id = 'd5555555-5555-5555-5555-555555555555' WHERE reg_number = '2022/236002';
