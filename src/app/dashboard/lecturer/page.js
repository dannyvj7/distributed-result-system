'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../lib/authContext'
import { getCourses, getEnrollments, getExamScores, getCaScores, getFinalResults, submitResultsToHOD } from '../../../lib/db'
import {
  BookOpen, Upload, FileCheck, ArrowRight, CheckCircle2, Clock,
  AlertCircle, Send, Lock, CheckCircle, BookMarked
} from 'lucide-react'

export default function LecturerDashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [examScores, setExamScores] = useState([])
  const [caScores, setCaScores] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null) // courseId currently being submitted
  const [statusMessage, setStatusMessage] = useState(null)

  const loadData = async () => {
    try {
      const [allCourses, allEnrolls, allExams, allCas, allFinals] = await Promise.all([
        getCourses(),
        getEnrollments(),
        getExamScores(),
        getCaScores(),
        getFinalResults()
      ])

      // Strictly filter courses allocated to this specific lecturer
      let myCourses = allCourses.filter(c => c.lecturer_id === user?.id)
      if (myCourses.length === 0 && user?.role === 'lecturer') {
        // Fallback to first course if logged in with legacy/unassigned demo token
        myCourses = allCourses.slice(0, 1)
      }

      setCourses(myCourses)
      setEnrollments(allEnrolls)
      setExamScores(allExams)
      setCaScores(allCas)
      setFinalResults(allFinals)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleSubmitToHOD = async (courseId) => {
    setSubmitting(courseId)
    setStatusMessage(null)
    try {
      await submitResultsToHOD(courseId, user?.id)
      setStatusMessage({
        type: 'success',
        text: 'Results successfully signed and submitted to HOD for review. The course results are now locked pending HOD approval.'
      })
      await loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to submit results to HOD. Please try again.' })
    } finally {
      setSubmitting(null)
    }
  }

  // Compute stats
  const totalCourses = courses.length
  const coursesWithExams = courses.filter(c => examScores.some(e => e.course_id === c.id)).length
  const coursesSubmitted = courses.filter(c => {
    const finals = finalResults.filter(f => f.course_id === c.id)
    return finals.length > 0 && finals.some(f => ['submitted', 'approved', 'distributed'].includes(f.status))
  }).length

  return (
    <DashboardLayout title="Lecturer Course & Scoring Portal" roleRequired="lecturer">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Course Instructor Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name || 'Lecturer'}
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Upload exam and CA scores for your assigned courses, then sign and submit completed results to the HOD for departmental review and approval.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Assigned</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : totalCourses}</h3>
            <span className="text-[11px] text-primary font-medium">2025/26 Session</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scores Uploaded</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '...' : coursesWithExams}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Courses with exam scores</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted to HOD</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{loading ? '...' : coursesSubmitted}</h3>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting HOD review</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Course Workflow Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">My Assigned Course Allocations</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            2025/26 Academic Session &bull; First Semester — Upload scores and submit completed results to HOD
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Course</th>
                <th className="py-3.5 px-5">Units</th>
                <th className="py-3.5 px-5">Exam Scores</th>
                <th className="py-3.5 px-5">CA Scores</th>
                <th className="py-3.5 px-5">Submission Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading assigned courses...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No courses allocated to your account.</td>
                </tr>
              ) : (
                courses.map((course) => {
                  const courseExams = examScores.filter(e => e.course_id === course.id)
                  const courseCas = caScores.filter(c => c.course_id === course.id)
                  const courseFinals = finalResults.filter(f => f.course_id === course.id)

                  const hasExams = courseExams.length > 0
                  const hasCas = courseCas.length > 0
                  const hasDraft = courseFinals.length > 0 && courseFinals.some(f => f.status === 'draft')
                  const isSubmitted = courseFinals.length > 0 && courseFinals.some(f => f.status === 'submitted')
                  const isApproved = courseFinals.length > 0 && courseFinals.some(f => f.status === 'approved')
                  const isDistributed = courseFinals.length > 0 && courseFinals.some(f => f.status === 'distributed')
                  const isLocked = isSubmitted || isApproved || isDistributed

                  // Determine workflow status badge
                  let statusBadge
                  if (isDistributed) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Distributed
                      </span>
                    )
                  } else if (isApproved) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Approved by HOD
                      </span>
                    )
                  } else if (isSubmitted) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Submitted to HOD
                      </span>
                    )
                  } else if (hasDraft) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        Ready to Submit
                      </span>
                    )
                  } else if (hasExams && !hasCas) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        CA Pending
                      </span>
                    )
                  } else {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                        No Scores Yet
                      </span>
                    )
                  }

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{course.code}</span>
                          {['101', '201', '202'].some(k => course.code.includes(k)) ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              ⚡ CBT
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ✍️ Handwritten
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{course.title}</div>
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-medium">{course.credit_units} Units</td>

                      <td className="py-4 px-5">
                        {hasExams ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {courseExams.length} uploaded
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/lecturer/upload-scores?courseId=${course.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition"
                          >
                            <Upload className="w-3.5 h-3.5" /> Upload Scores
                          </Link>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {hasCas ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {courseCas.length} merged
                          </span>
                        ) : hasExams ? (
                          <Link
                            href={`/dashboard/lecturer/upload-ca?courseId=${course.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full transition"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Upload CA
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5">{statusBadge}</td>

                      <td className="py-4 px-5 text-right">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-3 py-1.5 rounded-xl border border-slate-200">
                            <Lock className="w-3.5 h-3.5" />
                            {isDistributed ? 'Distributed' : isApproved ? 'HOD Approved' : 'Submitted'}
                          </span>
                        ) : hasDraft ? (
                          <button
                            onClick={() => handleSubmitToHOD(course.id)}
                            disabled={submitting === course.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/20 transition disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {submitting === course.id ? 'Submitting...' : 'Sign & Submit to HOD'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {!hasExams && (
                              <Link
                                href={`/dashboard/lecturer/upload-scores?courseId=${course.id}`}
                                className="px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                              >
                                Upload Exam
                              </Link>
                            )}
                            {hasExams && !hasCas && (
                              <Link
                                href={`/dashboard/lecturer/upload-ca?courseId=${course.id}`}
                                className="px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition"
                              >
                                Upload CA
                              </Link>
                            )}
                          </div>
                        )}
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
