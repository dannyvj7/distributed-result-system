'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../lib/authContext'
import { getStudents, getCourses, getFinalResults, getCgpaRecord, getDepartments, getComplaints, recomputeStudentCGPA } from '../../../lib/db'
import { normalizeRegNumber } from '../../../lib/grading'
import {
  GraduationCap,
  Award,
  BookOpen,
  Printer,
  MessageSquarePlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [department, setDepartment] = useState(null)
  const [results, setResults] = useState([])
  const [courses, setCourses] = useState([])
  const [cgpaRecord, setCgpaRecord] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [studs, crs, finals, depts] = await Promise.all([
          getStudents(),
          getCourses(),
          getFinalResults(),
          getDepartments()
        ])

        // Find active student record
        const activeStudent = studs.find(
          s => s.id === user?.id || (user?.reg_number && normalizeRegNumber(s.reg_number) === normalizeRegNumber(user.reg_number))
        ) || studs[0]

        setStudent(activeStudent)
        setCourses(crs)

        if (activeStudent) {
          const dept = depts.find(d => d.id === activeStudent.department_id)
          setDepartment(dept)

          // Approved results only for student view
          const studentResults = finals.filter(
            r => r.student_id === activeStudent.id && (r.status === 'approved' || r.status === 'distributed')
          )
          setResults(studentResults)

          let cgpa = await getCgpaRecord(activeStudent.id)
          if (!cgpa && studentResults.length > 0) {
            cgpa = await recomputeStudentCGPA(activeStudent.id)
          }
          setCgpaRecord(cgpa)

          const cmps = await getComplaints(activeStudent.id)
          setComplaints(cmps)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const cgpaValue = Number(cgpaRecord?.cgpa || 5.0).toFixed(2)
  const classification = cgpaRecord?.classification || 'First Class Honours'

  return (
    <DashboardLayout title="Student Academic Portal" roleRequired="student">
      {/* Student Welcome Hero Card */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Undergraduate Student Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {student?.full_name || user?.full_name}
            </h1>
            <p className="mt-1 text-sm text-blue-100/90 font-mono">
              Matric / Reg No: <span className="font-bold text-white">{student?.reg_number || user?.reg_number}</span>
            </p>
            <p className="text-xs text-blue-200 mt-0.5">
              {department?.name} ({department?.code}) • {student?.level || 400} Level • Session {student?.session || '2025/26'}
            </p>
          </div>

          {/* Quick CGPA Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center shrink-0 min-w-[200px]">
            <p className="text-xs text-blue-200 uppercase font-semibold">Cumulative GPA (CGPA)</p>
            <div className="text-4xl font-black text-white mt-1">
              {loading ? '...' : cgpaValue}
            </div>
            <span className="mt-2 inline-block text-xs font-bold text-emerald-300 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {classification}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Taken</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : results.length}</h3>
            <span className="text-[11px] text-blue-600 font-medium">Approved semester courses</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits Earned</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{cgpaRecord?.total_credit_units || 3}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Total registered units passed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality Points</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">{cgpaRecord?.total_quality_points || 15.0}</h3>
            <span className="text-[11px] text-purple-600 font-medium">Accumulated quality points</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Complaints</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{complaints.length}</h3>
            <span className="text-[11px] text-amber-600 font-medium">
              {complaints.filter(c => c.status === 'resolved').length} resolved
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/dashboard/student/results"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <BookOpen className="w-6 h-6 text-primary mb-2" />
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition">Semester Results</h4>
            <p className="text-xs text-slate-500 mt-1">Check grades, continuous assessment, and exam totals.</p>
          </div>
          <span className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
            View Results <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/student/cgpa"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <Award className="w-6 h-6 text-emerald-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">CGPA & Standing</h4>
            <p className="text-xs text-slate-500 mt-1">Degree classification and NUC 5.0 scale breakdown.</p>
          </div>
          <span className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            View Standing <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/student/print"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <Printer className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">Print Result Slip</h4>
            <p className="text-xs text-slate-500 mt-1">Download official PDF statement with university seal.</p>
          </div>
          <span className="mt-3 text-xs font-semibold text-indigo-600 flex items-center gap-1">
            Print Slip <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/student/complaint"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group flex flex-col justify-between"
        >
          <div>
            <MessageSquarePlus className="w-6 h-6 text-amber-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">Lodge Complaint</h4>
            <p className="text-xs text-slate-500 mt-1">Report score discrepancies to the Examination Office.</p>
          </div>
          <span className="mt-3 text-xs font-semibold text-amber-600 flex items-center gap-1">
            File Ticket <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Recent Approved Results Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Current Semester Approved Scores</h3>
            <p className="text-xs text-slate-500">2025/26 Session • First Semester</p>
          </div>
          <Link
            href="/dashboard/student/results"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Detailed View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Course Code</th>
                <th className="py-3 px-5">Course Title</th>
                <th className="py-3 px-5">Units</th>
                <th className="py-3 px-5">CA (/30)</th>
                <th className="py-3 px-5">Exam (/70)</th>
                <th className="py-3 px-5">Total (/100)</th>
                <th className="py-3 px-5">Grade</th>
                <th className="py-3 px-5">Grade Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No approved results available for this semester yet.
                  </td>
                </tr>
              ) : (
                results.map((r) => {
                  const course = courses.find(c => c.id === r.course_id)
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-bold text-primary">{course?.code || 'COS401'}</td>
                      <td className="py-3.5 px-5 font-medium text-slate-900">{course?.title || 'Distributed Systems'}</td>
                      <td className="py-3.5 px-5">{course?.credit_units || 3} Units</td>
                      <td className="py-3.5 px-5 text-emerald-700 font-semibold">{r.ca_score}</td>
                      <td className="py-3.5 px-5 text-blue-700 font-semibold">{r.exam_score}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900">{r.total_score}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">{Number(r.grade_point).toFixed(1)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
