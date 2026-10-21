# Distributed Student Result Management System (DSRMS)
**Nigerian Tertiary Institution Academic Portal (Universities, Polytechnics & Colleges)**

A full-stack web application built with **Next.js 14 (App Router, JavaScript)**, **Tailwind CSS**, **Supabase (PostgreSQL & Auth)**, **SheetJS (`xlsx`)**, and **jsPDF** conforming to the **Nigerian National Universities Commission (NUC) 5-Point Grading Standard**.

---

## Key System Features

1. **Role-Based Portals & Dashboards (5 User Roles):**
   - **Administrator:** Manage academic departments, accredited courses, user accounts, and student registry (single entry + bulk Excel import with downloadable templates).
   - **Academic Lecturer:** View course allocations, upload examination scores (0–70) via Excel/CSV, upload continuous assessment scores (0–30) with automated matric number matching, total score calculation, and NUC grade computation.
   - **Head of Department (HOD):** Register academic profile, draw or upload official digital signature on an interactive canvas pad, review and approve merged course results, electronically distribute results to borrowing departments, and acknowledge received results with digital signatures.
   - **Institutional Examination Officer:** University-wide distributed results directory, student grade dispute and complaint adjudication desk, and Senate consolidated broadsheet compilation with PDF export.
   - **Undergraduate Student:** Matric number login, approved semester results checking, cumulative CGPA calculation and degree classification standing, downloadable official PDF statement of results, and complaint ticket lodgement.

2. **Core CA & Exam Auto-Merging Engine:**
   - Normalizes student matriculation numbers (stripping extraneous whitespaces and standardizing casing/formats).
   - Cross-matches CA scores against existing examination scores.
   - Auto-computes $\text{Total Score} = \text{CA Score (0–30)} + \text{Exam Score (0–70)}$.
   - Automatically determines letter grade (A–F) and grade point (5.0–0.0) based on the Nigerian NUC scale.
   - Displays matched count, unmatched count, and a preview table before committing.

3. **Nigerian NUC 5-Point Grading Standard:**
   - **70 – 100:** Grade A (5.0 Points) $\rightarrow$ *First Class Honours (4.50 – 5.00)*
   - **60 – 69:** Grade B (4.0 Points) $\rightarrow$ *Second Class Honours - Upper Division (3.50 – 4.49)*
   - **50 – 59:** Grade C (3.0 Points) $\rightarrow$ *Second Class Honours - Lower Division (2.40 – 3.49)*
   - **45 – 49:** Grade D (2.0 Points) $\rightarrow$ *Third Class Honours (1.50 – 2.39)*
   - **40 – 44:** Grade E (1.0 Points) $\rightarrow$ *Pass (1.00 – 1.49)*
   - **0 – 39:** Grade F (0.0 Points) $\rightarrow$ *Fail (0.00 – 0.99)*

---

## Quick Start & Running the Project

```bash
# Navigate to the project directory
cd "C:\Users\DELL\.gemini\antigravity\scratch\distributed-result-system"

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Demo Test Credentials & One-Click Switcher

You can use the **One-Click Persona Switcher** on the login page or in the sidebar, or manually log in using these credentials:

| Role | Email / Matric No | Password | Notes |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@institution.edu.ng` | `password123` | ICT & System Administration |
| **Lecturer** | `lecturer.csc@institution.edu.ng` | `password123` | Dr. Aminu Ibrahim (Computer Science) |
| **HOD (CSC)** | `hod.csc@institution.edu.ng` | `password123` | Prof. Babatunde Adeleke (HOD Computer Science) |
| **HOD (EEE)** | `hod.eee@institution.edu.ng` | `password123` | Dr. Chinwe Okeke (HOD Electrical Eng) |
| **Exam Officer** | `exam.officer@institution.edu.ng` | `password123` | Mrs. Folake Adebayo (Central Senate Records) |
| **Student** | `FUT/CSC/20/1001` | `student123` | Chukwuebuka Obi (400L Computer Science) |

> Student Portal login page is available directly at: [http://localhost:3000/student-login](http://localhost:3000/student-login)

---

## Supabase PostgreSQL Database Setup

The project includes a ready-to-run SQL schema file:
[`supabase_schema.sql`](./supabase_schema.sql)

To execute in Supabase:
1. Go to your Supabase project dashboard: `https://supabase.com/dashboard/project/zcgcwptmanhfstfrdwir`
2. Open the **SQL Editor** tab.
3. Paste the contents of `supabase_schema.sql` and click **Run**.
4. Paste your Supabase project's `anon` public key into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://zcgcwptmanhfstfrdwir.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```
*(Note: If the anon key is omitted or contains placeholder text, the system seamlessly operates via its reactive local data store with pre-populated Nigerian departmental seed data, ensuring 100% out-of-the-box testability).*

---

## Active Workspace Recommendation

To work on this codebase in your editor:
Open folder: `C:\Users\DELL\.gemini\antigravity\scratch\distributed-result-system`
