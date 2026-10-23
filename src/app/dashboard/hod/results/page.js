'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getCourses, getStudents, getFinalResults, updateCourseResultsStatus, getDepartments } from '../../../../lib/db'
import { BookOpen, CheckCircle, CheckCircle2, Clock, AlertCircle, Send, ArrowRight, ShieldCheck } from 'lucide-react'

export default function HodResultsReviewPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [finalResults, setFinalResults] = useState([])
  const [approving, setApproving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [allCourses, studs, depts] = await Promise.all([
          getCourses(),
          getStudents(),
          getDepartments()
        ])
        setStudents(studs)
        setDepartments(depts)

        // Departmental courses
        const myCourses = allCourses.filter(c => c.department_id === user?.department_id || (!user?.department_id && c.code.startsWith('COS')))
        const displayCourses = myCourses.length > 0 ? myCourses : allCourses
        setCourses(displayCourses)

        if (displayCourses.length > 0) {
          setSelectedCourseId(displayCourses[0].id)
          loadResults(displayCourses[0].id)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const loadResults = async (courseId) => {
    const results = await getFinalResults(courseId)
    setFinalResults(results)
  }

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId)
    loadResults(courseId)
  }

  const handleApprove = async () => {
    if (!selectedCourseId || finalResults.length === 0) return
    setApproving(true)
    try {
      await updateCourseResultsStatus(selectedCourseId, 'approved')
      setStatusMessage({
        type: 'success',
        text: 'Results approved successfully! Student CGPA records have been recomputed automatically. The course is now ready for inter-departmental distribution.'
      })
      loadResults(selectedCourseId)
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to approve course results.' })
    } finally {
      setApproving(false)
    }
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId)
  const userDept = departments.find(d => d.id === user?.department_id)
  
  // Strict Departmental Scoping:
  // Only the course-offering department (Computer Science) has broadsheet authority over all enrolled departments.
  // Receiving departments (Maths, VTE, etc.) strictly view candidates from their own department.
  const isOfferingDept = selectedCourse?.department_id === user?.department_id || 
    (!selectedCourse?.department_id && user?.department_id === 'd1111111-1111-1111-1111-111111111111')

  const displayedResults = isOfferingDept
    ? finalResults
    : finalResults.filter(r => {
        const s = students.find(stud => stud.id === r.student_id)
        return s && s.department_id === user?.department_id
      })

  const isDraft = displayedResults.some(r => r.status === 'draft')
  const isSubmitted = displayedResults.some(r => r.status === 'submitted')
  const isApproved = displayedResults.length > 0 && displayedResults.every(r => r.status === 'approved' || r.status === 'distributed')
  const isDistributed = displayedResults.length > 0 && displayedResults.every(r => r.status === 'distributed')

  const submittedResults = displayedResults.filter(r => r.status === 'submitted')
  const otherResults = displayedResults.filter(r => r.status !== 'submitted')

  // Calculate statistics for displayed candidates
  const totalStudents = displayedResults.length
  const passedStudents = displayedResults.filter(r => r.grade !== 'F').length
  const passRate = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(0) : 0
  const avgScore = totalStudents > 0 ? (displayedResults.reduce((acc, curr) => acc + Number(curr.total_score || 0), 0) / totalStudents).toFixed(1) : 0

  return (
    <DashboardLayout title="Departmental Result Review & Approval" roleRequired="hod">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Course Selector & Approval Controls */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Department Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.title} ({c.credit_units} Units)</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOfferingDept ? (
              <>
                {(isDraft || isSubmitted) && (
                  <button
                    onClick={handleApprove}
                    disabled={approving || finalResults.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {approving ? 'Approving...' : 'Approve Department Results'}
                  </button>
                )}

                {isApproved && (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      {isDistributed ? 'Status: Approved & Distributed' : 'Status: Approved'}
                    </span>
                    <Link
                      href={`/dashboard/hod/distribute?courseId=${selectedCourseId}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Proceed to Distribute
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold">
                  Borrowing / Service Department
                </span>
                <Link
                  href="/dashboard/hod/acknowledge"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge Roster &rarr;</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isOfferingDept && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold">
                Service Course Scope: Filtered to {userDept?.name || 'Department'} Students Only
              </p>
              <p className="text-blue-700 text-[11px] mt-0.5">
                This course is offered by Computer Science. In accordance with the distributed governance model, your view is strictly filtered to candidates registered under your department ({userDept?.code}).
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/hod/acknowledge"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 text-center shadow-xs transition"
          >
            Go to Acknowledge Roster &rarr;
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Scored Students</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{totalStudents}</h4>
          <span className="text-[11px] text-slate-500">Enrolled & examined</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Rate (A–E)</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{passRate}%</h4>
          <span className="text-[11px] text-emerald-600 font-medium">{passedStudents} of {totalStudents} passed</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Course Score</p>
          <h4 className="text-2xl font-bold text-primary mt-1">{avgScore} / 100</h4>
          <span className="text-[11px] text-slate-500">Mean composite score</span>
        </div>
      </div>

      {/* Pending Lecturer Submissions — Amber Banner */}
      {isSubmitted && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 mb-1">
                Pending Review — Submitted by Lecturer
              </h4>
              <p className="text-xs text-amber-700 mb-3">
                The course lecturer has signed off and submitted <strong>{submittedResults.length}</strong> result record{submittedResults.length !== 1 ? 's' : ''} for <strong>{selectedCourse?.code}</strong>. Review the results below and click <em>Approve Department Results</em> to proceed.
              </p>
              <div className="flex flex-wrap gap-2">
                {submittedResults.slice(0, 4).map((r) => {
                  const s = students.find(stud => stud.id === r.student_id)
                  return (
                    <span key={r.id} className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                      {s ? s.reg_number : r.student_id} — {r.grade} ({r.total_score})
                    </span>
                  )
                })}
                {submittedResults.length > 4 && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-600 text-xs rounded-full border border-amber-200">
                    +{submittedResults.length - 4} more
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {approving ? 'Approving...' : 'Approve Results'}
            </button>
          </div>
        </div>
      )}

      {/* Merged Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Departmental Score Sheet: {selectedCourse?.code} - {selectedCourse?.title}
            </h3>
            <p className="text-xs text-slate-500">
              {isOfferingDept 
                ? 'Full Course Roster (All Enrolled Departments) • Continuous Assessment (30%) + Exam (70%)' 
                : `Service Course Breakdown for ${userDept?.name || 'Department'} Students Only`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Reg Number</th>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Dept</th>
                <th className="py-3 px-5">CA (/30)</th>
                <th className="py-3 px-5">Exam (/70)</th>
                <th className="py-3 px-5">Total (/100)</th>
                <th className="py-3 px-5">Grade</th>
                <th className="py-3 px-5">Point</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedResults.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    {isOfferingDept 
                      ? 'No results have been compiled or submitted by the course lecturer yet.'
                      : `No candidates from the Department of ${userDept?.name || 'your department'} took this course.`}
                  </td>
                </tr>
              ) : (
                displayedResults.map((r) => {
                  const s = students.find(stud => stud.id === r.student_id)
                  const dept = departments.find(d => d.id === s?.department_id)

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-primary">{s ? s.reg_number : 'N/A'}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{s ? s.full_name : 'Unknown'}</td>
                      <td className="py-3.5 px-5 text-xs font-semibold">{dept ? dept.code : 'COS'}</td>
                      <td className="py-3.5 px-5 font-semibold text-emerald-700">{r.ca_score}</td>
                      <td className="py-3.5 px-5 font-semibold text-blue-700">{r.exam_score}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900">{r.total_score}</td>
                      <td className="py-3.5 px-5">
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
                      <td className="py-3.5 px-5 font-bold">{Number(r.grade_point).toFixed(1)}</td>
                      <td className="py-3.5 px-5 capitalize">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          r.status === 'approved' || r.status === 'distributed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          r.status === 'submitted' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status === 'submitted' ? 'Submitted by Lecturer' : r.status}
                        </span>
                      </td>
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
