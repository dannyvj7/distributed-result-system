'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getStudents, getCourses, getFinalResults, getDepartments } from '../../../../lib/db'
import { normalizeRegNumber } from '../../../../lib/grading'
import { BookOpen, Printer, MessageSquarePlus, CheckCircle2, Award } from 'lucide-react'

export default function StudentResultsPage() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [department, setDepartment] = useState(null)
  const [courses, setCourses] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSemester, setSelectedSemester] = useState('all') // 'all' | 'first' | 'second'

  useEffect(() => {
    async function loadData() {
      try {
        const [studs, crs, finals, depts] = await Promise.all([
          getStudents(),
          getCourses(),
          getFinalResults(),
          getDepartments()
        ])

        const activeStudent = studs.find(
          s => s.id === user?.id || (user?.reg_number && normalizeRegNumber(s.reg_number) === normalizeRegNumber(user.reg_number))
        ) || studs[0]

        setStudent(activeStudent)
        setCourses(crs)

        if (activeStudent) {
          const dept = depts.find(d => d.id === activeStudent.department_id)
          setDepartment(dept)

          const studentResults = finals.filter(
            r => r.student_id === activeStudent.id && (r.status === 'approved' || r.status === 'distributed')
          )
          setResults(studentResults)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  // Filter results by selected semester
  const filteredResults = results.filter(r => {
    if (selectedSemester === 'all') return true
    const course = courses.find(c => c.id === r.course_id)
    return (course?.semester || 'first') === selectedSemester
  })

  // Compute semester aggregates based on filtered results
  let totalUnits = 0
  let totalQualityPoints = 0

  filteredResults.forEach(r => {
    const course = courses.find(c => c.id === r.course_id)
    const units = Number(course?.credit_units || 3)
    const gp = Number(r.grade_point || 0)
    totalUnits += units
    totalQualityPoints += (units * gp)
  })

  const computedGpa = totalUnits > 0 ? (totalQualityPoints / totalUnits).toFixed(2) : '0.00'

  return (
    <DashboardLayout title="Semester Result Statement" roleRequired="student">
      {/* Result Header Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Academic Session 2025/26
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {selectedSemester === 'first' ? '1st Semester Only' : selectedSemester === 'second' ? '2nd Semester Only' : 'All Semesters'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {student?.full_name} ({student?.reg_number})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {department?.name} ({department?.code}) • Level {student?.level || 100}L
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/student/print"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Result Slip
            </Link>
            <Link
              href="/dashboard/student/complaint"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-amber-600" />
              Dispute a Grade
            </Link>
          </div>
        </div>
      </div>

      {/* Semester Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSelectedSemester('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            selectedSemester === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          All Semesters ({results.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedSemester('first')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            selectedSemester === 'first'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          First Semester (1st Sem)
        </button>

        <button
          type="button"
          onClick={() => setSelectedSemester('second')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            selectedSemester === 'second'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          Second Semester (2nd Sem)
        </button>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Units</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{totalUnits} Units</h4>
          <span className="text-[11px] text-slate-500">
            {selectedSemester === 'all' ? 'Across all enrolled semesters' : `${selectedSemester === 'first' ? '1st' : '2nd'} semester credit load`}
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality Points Earned</p>
          <h4 className="text-2xl font-bold text-indigo-600 mt-1">{totalQualityPoints.toFixed(1)} Points</h4>
          <span className="text-[11px] text-slate-500">Sum of (Units × Grade Point)</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {selectedSemester === 'all' ? 'Cumulative GPA' : 'Semester GPA'}
          </p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{computedGpa} / 5.00</h4>
          <span className="text-[11px] text-emerald-600 font-medium">Nigerian NUC 5.0 Scale</span>
        </div>
      </div>

      {/* Results Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Approved Course Grades</h3>
            <p className="text-xs text-slate-500">Officially verified and approved by Departmental Board</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Showing {filteredResults.length} Course{filteredResults.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Course Code</th>
                <th className="py-3.5 px-6">Course Title</th>
                <th className="py-3.5 px-6">Semester</th>
                <th className="py-3.5 px-6">Credit Units</th>
                <th className="py-3.5 px-6">CA (0-30)</th>
                <th className="py-3.5 px-6">Exam (0-70)</th>
                <th className="py-3.5 px-6">Total (100)</th>
                <th className="py-3.5 px-6">Letter Grade</th>
                <th className="py-3.5 px-6">Grade Point</th>
                <th className="py-3.5 px-6 text-right">Quality Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">Loading semester records...</td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    No approved results on record for {selectedSemester === 'all' ? 'this student' : `${selectedSemester} semester`}.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => {
                  const course = courses.find(c => c.id === r.course_id)
                  const units = Number(course?.credit_units || 3)
                  const gp = Number(r.grade_point || 0)
                  const qp = (units * gp).toFixed(1)
                  const sem = course?.semester || 'first'

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-bold text-primary">{course?.code || 'COS'}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900">{course?.title || 'Course Title'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          sem === 'second'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {sem === 'second' ? '2nd Sem' : '1st Sem'}
                        </span>
                      </td>
                      <td className="py-4 px-6">{units} Units</td>
                      <td className="py-4 px-6 text-emerald-700 font-semibold">{r.ca_score}</td>
                      <td className="py-4 px-6 text-blue-700 font-semibold">{r.exam_score}</td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">{r.total_score}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          r.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                          r.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          r.grade === 'C' ? 'bg-indigo-100 text-indigo-800' :
                          r.grade === 'D' ? 'bg-amber-100 text-amber-800' :
                          r.grade === 'E' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold">{gp.toFixed(1)}</td>
                      <td className="py-4 px-6 font-bold text-slate-900 text-right">{qp}</td>
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
