'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../lib/authContext'
import { getCourses, getEnrollments, getExamScores, getCaScores, getFinalResults, submitResultsToHOD, getStudents, getComplaints, lecturerSubmitMemoToHOD } from '../../../lib/db'
import {
  BookOpen, Upload, FileCheck, ArrowRight, CheckCircle2, Clock,
  AlertCircle, Send, Lock, CheckCircle, BookMarked, PenTool, ShieldCheck, X, FileText, UserCheck, MessageSquare
} from 'lucide-react'

export default function LecturerDashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [examScores, setExamScores] = useState([])
  const [caScores, setCaScores] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null) // courseId currently being submitted
  const [statusMessage, setStatusMessage] = useState(null)

  // Digital Signature Modal State
  const [signingCourse, setSigningCourse] = useState(null)
  const [hasConfirmedAttestation, setHasConfirmedAttestation] = useState(false)

  // Script Audit Modal State
  const [activeAuditComplaint, setActiveAuditComplaint] = useState(null)
  const [auditFindings, setAuditFindings] = useState('')
  const [auditMemoRef, setAuditMemoRef] = useState('UNN/CSC/REC/2026/014')
  const [auditAdjustment, setAuditAdjustment] = useState('')
  const [auditNewCaScore, setAuditNewCaScore] = useState('')
  const [submittingAudit, setSubmittingAudit] = useState(false)

  const loadData = async () => {
    try {
      const [allCourses, allEnrolls, allExams, allCas, allFinals, allStudents, allComplaints] = await Promise.all([
        getCourses(),
        getEnrollments(),
        getExamScores(),
        getCaScores(),
        getFinalResults(),
        getStudents(),
        getComplaints()
      ])

      // Strictly filter courses allocated to this specific lecturer
      let myCourses = allCourses.filter(c => 
        c.lecturer_id === user?.id ||
        (user?.email === 'lecturer.csc@institution.edu.ng' && c.code === 'COS 101') ||
        (user?.email === 'lecturer.eze@institution.edu.ng' && c.code === 'COS 201') ||
        (user?.email === 'lecturer.fashola@institution.edu.ng' && c.code === 'COS 202') ||
        (user?.email === 'lecturer.ugwu@institution.edu.ng' && (c.code === 'COS 343' || c.code === 'COS 303')) ||
        (user?.email === 'lecturer.akpan@institution.edu.ng' && c.code === 'COS 414')
      )
      if (myCourses.length === 0 && user?.role === 'lecturer') {
        // Fallback to first course if logged in with legacy/unassigned demo token
        myCourses = allCourses.slice(0, 1)
      }

      // Filter complaints to ONLY those belonging to courses allocated to this lecturer
      const myCourseIds = myCourses.map(c => c.id)
      const myComplaints = allComplaints.filter(c => 
        myCourseIds.includes(c.course_id) ||
        myCourses.some(mc => mc.id === c.course_id || (c.course_code && mc.code.replace(/\s+/g, '') === c.course_code.replace(/\s+/g, '')))
      )

      setCourses(myCourses)
      setEnrollments(allEnrolls)
      setExamScores(allExams)
      setCaScores(allCas)
      setFinalResults(allFinals)
      setStudents(allStudents)
      setComplaints(myComplaints)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleOpenSignModal = (course) => {
    setSigningCourse(course)
    setHasConfirmedAttestation(false)
  }

  const handleOpenAuditModal = (cmp) => {
    setActiveAuditComplaint(cmp)
    setAuditFindings('')
    const crs = courses.find(c => c.id === cmp.course_id)
    const crsCode = crs?.code?.replace(/\s+/g, '') || 'CSC'
    setAuditMemoRef(`UNN/${crsCode}/REC/2026/${cmp.id ? cmp.id.slice(-4).toUpperCase() : '014'}`)
    const current = caScores.find(c => c.student_id === cmp.student_id && c.course_id === cmp.course_id)?.ca_score
      || finalResults.find(f => f.student_id === cmp.student_id && f.course_id === cmp.course_id)?.ca_score
      || 20
    const suggested = Math.min(30, Number(current) + 4)
    setAuditNewCaScore(String(suggested))
    setAuditAdjustment(`Verified CA score: ${suggested}/30`)
  }

  const handleSubmitAuditMemo = async (e) => {
    e.preventDefault()
    if (!activeAuditComplaint) return
    setSubmittingAudit(true)
    const newCaNum = auditNewCaScore !== '' && !isNaN(Number(auditNewCaScore)) ? Number(auditNewCaScore) : null
    const findings = auditFindings.trim() || 'Physical Continuous Assessment scripts audited for candidate. Discrepancy confirmed against marked test script and recommended for broadsheet rectification.'
    const adjustment = auditAdjustment.trim() || (newCaNum !== null ? `Verified CA score: ${newCaNum}/30` : 'Continuous Assessment score verified and recommended for amendment')
    const memo = auditMemoRef.trim() || 'UNN/CSC/REC/2026/014'
    try {
      await lecturerSubmitMemoToHOD(activeAuditComplaint.id, findings, adjustment, memo, newCaNum)
      setStatusMessage({
        type: 'success',
        text: `Official Memorandum (${memo}) requesting result withdrawal and rectification has been dispatched to HOD Dr. (Mrs.) Ifeoma Nwokoye.`
      })
      setActiveAuditComplaint(null)
      await loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to submit memorandum to HOD.' })
    } finally {
      setSubmittingAudit(false)
    }
  }

  const handleConfirmSignAndSubmit = async () => {
    if (!signingCourse || !hasConfirmedAttestation) return
    const courseId = signingCourse.id
    setSubmitting(courseId)
    setStatusMessage(null)
    try {
      const lecturerSignature = {
        signed_by: user?.full_name || 'Course Lecturer',
        email: user?.email,
        timestamp: new Date().toISOString(),
        verified: true
      }
      await submitResultsToHOD(courseId, user?.id, lecturerSignature)
      setStatusMessage({
        type: 'success',
        text: `Results for ${signingCourse.code} have been formally signed with your digital signature and submitted to the Head of Department (Dr. (Mrs.) Ifeoma Nwokoye). The broadsheet is now locked pending departmental review.`
      })
      setSigningCourse(null)
      await loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to sign and submit results to HOD. Please try again.' })
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

      {/* Dispute Referrals & Physical Script Audit Desk */}
      {complaints.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden mb-8">
          <div className="p-5 border-b border-amber-100 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dispute Referrals & Physical Script Audit Desk</h3>
                <p className="text-xs text-slate-500">
                  Student score discrepancy inquiries referred by Examinations Office for physical script verification
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 self-start sm:self-auto">
              {complaints.filter(c => c.status === 'referred_to_lecturer' || c.status === 'pending').length > 0 ? 'Action Required' : 'Audit History'}
            </span>
          </div>

          <div className="p-5 divide-y divide-slate-100">
            {complaints.map(cmp => {
              const student = students.find(s => s.id === cmp.student_id)
              const course = courses.find(c => c.id === cmp.course_id)
              const isReferred = cmp.status === 'referred_to_lecturer'
              const isPending = cmp.status === 'pending'
              const isAwaitingHod = cmp.status === 'awaiting_hod_approval'
              const isHodApproved = cmp.status === 'hod_approved'
              const isResolved = cmp.status === 'resolved'

              return (
                <div key={cmp.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cmp.student_name || student?.full_name || 'Candidate'}</span>
                      <span className="font-mono text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                        {cmp.student_reg_number || student?.reg_number}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        &bull; Course: <strong className="text-slate-900">{course?.code || 'Course'}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500 block text-[10px] uppercase">Candidate Claim:</span>
                      "{cmp.complaint_text}"
                    </p>
                    {cmp.referral_note && (
                      <p className="text-xs text-blue-900 mt-1 bg-blue-50/60 p-2 rounded-lg border border-blue-100 font-medium">
                        <span className="font-semibold text-blue-700 block text-[10px] uppercase">Exam Officer Directive:</span>
                        "{cmp.referral_note}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {isReferred || isPending ? (
                      <button
                        onClick={() => handleOpenAuditModal(cmp)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Audit Script & Memo HOD
                      </button>
                    ) : isAwaitingHod ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Clock className="w-3 h-3" /> Memo Submitted to HOD
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {cmp.hod_memo_ref || 'UNN/CSC/REC/2026/014'}
                        </div>
                      </div>
                    ) : isHodApproved ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> HOD Sanctioned
                        </span>
                        <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          Ready for Senate update
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" /> Senate Rectified
                        </span>
                        <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                          Master Broadsheet Updated
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {!hasExams && (
                            <Link
                              href={`/dashboard/lecturer/upload-scores?courseId=${course.id}`}
                              className="px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                            >
                              Upload Exam
                            </Link>
                          )}
                          {!hasCas && (
                            <Link
                              href={`/dashboard/lecturer/upload-ca?courseId=${course.id}`}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition"
                            >
                              Upload CA
                            </Link>
                          )}
                          <button
                            onClick={() => handleOpenSignModal(course)}
                            disabled={submitting === course.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/20 transition disabled:opacity-50"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            {isLocked ? 'Review & Sign' : 'Review & Sign Broadsheet'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Signature Modal */}
      {signingCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-primary uppercase tracking-wider">
                      Official Broadsheet Endorsement
                    </span>
                    <span className="text-xs text-slate-400 font-mono">2025/2026 Session</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {signingCourse.code} — {signingCourse.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Department of Computer Science &bull; {signingCourse.credit_units} Credit Units
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSigningCourse(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Broadsheet Candidate Preview */}
            <div className="my-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" /> Compiled Candidate Broadsheet
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {((finalResults.filter(f => f.course_id === signingCourse.id).length > 0)
                    ? finalResults.filter(f => f.course_id === signingCourse.id).length
                    : enrollments.filter(e => e.course_id === signingCourse.id).length)} Students Evaluated
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Reg Number</th>
                      <th className="py-2.5 px-3">Candidate Name</th>
                      <th className="py-2.5 px-3 text-center">CA (/30)</th>
                      <th className="py-2.5 px-3 text-center">Exam (/70)</th>
                      <th className="py-2.5 px-3 text-center font-bold">Total (/100)</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(finalResults.filter(f => f.course_id === signingCourse.id).length > 0
                      ? finalResults.filter(f => f.course_id === signingCourse.id)
                      : enrollments.filter(e => e.course_id === signingCourse.id).map(e => {
                          const exam = examScores.find(x => x.student_id === e.student_id && x.course_id === signingCourse.id)?.exam_score || 54
                          const ca = caScores.find(c => c.student_id === e.student_id && c.course_id === signingCourse.id)?.ca_score || 22
                          const total = exam + ca
                          let g = 'F'
                          if (total >= 70) g = 'A'; else if (total >= 60) g = 'B'; else if (total >= 50) g = 'C'; else if (total >= 45) g = 'D'; else if (total >= 40) g = 'E';
                          return {
                            id: e.id,
                            student_id: e.student_id,
                            ca_score: ca,
                            exam_score: exam,
                            total_score: total,
                            grade: g
                          }
                        })
                    ).map(res => {
                      const stud = students.find(s => s.id === res.student_id)
                      return (
                        <tr key={res.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-semibold text-slate-900">{stud?.reg_number || 'N/A'}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{stud?.full_name || 'Candidate'}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{res.ca_score}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{res.exam_score}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">{res.total_score}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                              res.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              res.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              res.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {res.grade}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Attestation Statement */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 my-5 text-xs text-amber-900 leading-relaxed">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-950 mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Statutory Academic Attestation
              </div>
              <p>
                In accordance with the National Universities Commission (NUC) BMAS/CCMAS and University of Nigeria Examination Regulations, I hereby solemnly declare and certify that the Continuous Assessment and Examination scores presented on this broadsheet represent the true, verified, and unadulterated evaluation of the registered candidates. I confirm that all scores have been vetted against physical continuous assessment records and examination booklets.
              </p>
            </div>

            {/* Digital Signature Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lecturer Digital Signature
                </span>
                <div className="font-serif italic text-2xl font-bold text-primary tracking-wide mt-1 select-none">
                  {user?.full_name || 'Course Lecturer'}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  Course Lecturer & Examiner &bull; Department of Computer Science
                </span>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mb-1">
                  <CheckCircle2 className="w-3 h-3" /> Timestamp Ready
                </span>
                <div className="text-xs text-slate-600 font-mono">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Audit ID: UNN-CSC-{signingCourse.code.replace(' ', '')}-VERIFIED
                </div>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-200 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConfirmedAttestation}
                onChange={(e) => setHasConfirmedAttestation(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium leading-relaxed">
                I formally affix my digital signature to this course broadsheet and submit it to the Head of Department (Dr. (Mrs.) Ifeoma Nwokoye) for official departmental review and approval. I understand this action locks scores from further editing.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSigningCourse(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!hasConfirmedAttestation || submitting === signingCourse.id}
                onClick={handleConfirmSignAndSubmit}
                className="px-6 py-2.5 text-xs font-bold text-white bg-primary hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-900/20 transition flex items-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                {submitting === signingCourse.id ? 'Submitting to HOD...' : 'Affix Digital Signature & Submit to HOD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecturer Script Audit & HOD Memo Modal */}
      {activeAuditComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Physical Script Audit & Memo to HOD</h3>
                  <p className="text-xs text-slate-500">Formally request broadsheet withdrawal under academic regulations</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAuditComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-semibold text-slate-800">
                Candidate: {activeAuditComplaint.student_name || students.find(s => s.id === activeAuditComplaint.student_id)?.full_name || 'Candidate'} ({activeAuditComplaint.student_reg_number || students.find(s => s.id === activeAuditComplaint.student_id)?.reg_number || ''})
              </p>
              <p className="text-slate-500 mt-0.5 italic">
                Student Claim: "{activeAuditComplaint.complaint_text}"
              </p>
            </div>

            <form onSubmit={handleSubmitAuditMemo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Script Audit Findings
                </label>
                <textarea
                  rows={3}
                  required
                  value={auditFindings}
                  onChange={(e) => setAuditFindings(e.target.value)}
                  placeholder="Enter your verification findings from the physical continuous assessment scripts (e.g. Audited physical Continuous Assessment scripts for candidate. Discrepancy confirmed against marked test script and recommended for broadsheet rectification)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
                {!auditFindings && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditFindings("Audited physical Continuous Assessment scripts for candidate. Discrepancy confirmed against marked test script and recommended for broadsheet rectification.")
                      setAuditAdjustment("Continuous Assessment score verified and recommended for amendment")
                    }}
                    className="text-[11px] text-amber-700 hover:underline font-medium mt-1 inline-block"
                  >
                    + Use Sample Script Audit Note
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Verified CA (/30)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    required
                    value={auditNewCaScore}
                    onChange={(e) => {
                      setAuditNewCaScore(e.target.value)
                      if (e.target.value) {
                        setAuditAdjustment(`Verified CA score: ${e.target.value}/30`)
                      }
                    }}
                    placeholder="e.g. 28"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Verified Score Adjustment
                  </label>
                  <input
                    type="text"
                    required
                    value={auditAdjustment}
                    onChange={(e) => setAuditAdjustment(e.target.value)}
                    placeholder="e.g. Verified CA score: 28/30"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-emerald-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Official Memo Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={auditMemoRef}
                    onChange={(e) => setAuditMemoRef(e.target.value)}
                    placeholder="e.g. UNN/CSC/REC/2026/014"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" /> Formal Notice to Head of Department:
                </p>
                "I, {user?.full_name || 'the Course Lecturer'}, hereby certify that upon auditing the physical test booklets, a transcription error occurred. I formally request the HOD Dr. (Mrs.) Ifeoma Nwokoye to grant administrative approval to withdraw this broadsheet line item and sanction the score adjustment."
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAuditComplaint(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAudit}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingAudit ? 'Dispatching...' : 'Sign & Dispatch Memo to HOD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
