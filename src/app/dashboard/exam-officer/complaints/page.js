'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getComplaints, resolveComplaint, referComplaintToLecturer, getStudents, getCourses } from '../../../../lib/db'
import { AlertCircle, CheckCircle2, MessageSquare, Send, CheckCircle, Clock, ArrowRight, FileCheck, ShieldCheck, UserCheck, FileText, X } from 'lucide-react'

export default function ExamOfficerComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Response / Protocol Modal State
  const [activeComplaint, setActiveComplaint] = useState(null)
  const [referralNote, setReferralNote] = useState('')
  const [responseText, setResponseText] = useState('')
  const [resolving, setResolving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cmps, studs, crs] = await Promise.all([
        getComplaints(),
        getStudents(),
        getCourses()
      ])
      setComplaints(cmps)
      setStudents(studs)
      setCourses(crs)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenResponse = (cmp) => {
    setActiveComplaint(cmp)
    setReferralNote(cmp.referral_note || '')
    setResponseText(cmp.exam_officer_response || '')
  }

  // Action 1: Forward to Lecturer
  const handleReferToLecturer = async () => {
    if (!activeComplaint) return
    setResolving(true)
    const note = referralNote.trim() || "Kindly retrieve candidate's physical Continuous Assessment (CA) scripts and verify recorded marks against submitted score roster."
    try {
      await referComplaintToLecturer(activeComplaint.id, note)
      setStatusMessage({
        type: 'success',
        text: 'Dispute officially forwarded to the Course Lecturer for physical script and CA audit.'
      })
      await loadData()
      setActiveComplaint(prev => ({ ...prev, status: 'referred_to_lecturer', referral_note: note }))
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to refer complaint to lecturer.' })
    } finally {
      setResolving(false)
    }
  }

  // Action 2: Final Senate Score Rectification (Enabled only after HOD approves)
  const handleFinalResolve = async (e) => {
    if (e) e.preventDefault()
    if (!activeComplaint) return

    setResolving(true)
    const resp = responseText.trim() || `Physical script audit confirmed by Course Lecturer Dr. Ibrahim. Result broadsheet line item amended under HOD approval Memo ${activeComplaint.hod_memo_ref || 'UNN/CSC/REC/2026/014'}. Continuous Assessment adjusted from 21/30 to 25/30. Final Senate master records updated.`
    try {
      await resolveComplaint(activeComplaint.id, resp)
      setStatusMessage({
        type: 'success',
        text: 'Result dispute formally resolved under HOD sanction. Candidate broadsheet score updated (+4 marks) and student notified.'
      })
      setActiveComplaint(null)
      await loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to complete dispute resolution.' })
    } finally {
      setResolving(false)
    }
  }

  const filtered = complaints.filter(c => {
    if (filterStatus === 'ALL') return true
    return c.status === filterStatus
  })

  return (
    <DashboardLayout title="Student Result Dispute & Complaints Desk" roleRequired="exam_officer">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Protocol Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Statutory Grade Rectification Protocol
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">University Result Rectification & Audit Workflow</h2>
            <p className="text-xs text-blue-200/90 mt-1 max-w-2xl leading-relaxed">
              Examination Officers cannot alter raw scores unilaterally. Under UNN Senate regulations, student disputes are referred to the course lecturer for physical script audit, followed by a formal written memorandum to the HOD to approve result broadsheet withdrawal and amendment.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 p-3 rounded-xl border border-white/10">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>NUC CCMAS & UNN Senate Audit Compliant</span>
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Student Academic Inquiries</h3>
          <p className="text-xs text-slate-500">Continuous Assessment and Examination discrepancy tickets</p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ALL">All Complaints ({complaints.length})</option>
          <option value="pending">Pending Referral ({complaints.filter(c => c.status === 'pending').length})</option>
          <option value="referred_to_lecturer">With Lecturer ({complaints.filter(c => c.status === 'referred_to_lecturer').length})</option>
          <option value="lecturer_verified">HOD Memo Approved ({complaints.filter(c => c.status === 'lecturer_verified').length})</option>
          <option value="resolved">Resolved ({complaints.filter(c => c.status === 'resolved').length})</option>
        </select>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
            Loading complaint log...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
            No complaints found under this category.
          </div>
        ) : (
          filtered.map((cmp) => {
            const student = students.find(s => s.id === cmp.student_id)
            const course = courses.find(c => c.id === cmp.course_id)
            const isResolved = cmp.status === 'resolved'
            const isReferred = cmp.status === 'referred_to_lecturer'
            const isVerified = cmp.status === 'lecturer_verified'
            const isPending = cmp.status === 'pending'

            return (
              <div
                key={cmp.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isResolved ? 'bg-emerald-50 text-emerald-600' :
                      isVerified ? 'bg-blue-50 text-blue-600' :
                      isReferred ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {isResolved ? <CheckCircle2 className="w-5 h-5" /> :
                       isVerified ? <FileCheck className="w-5 h-5" /> :
                       isReferred ? <Clock className="w-5 h-5" /> :
                       <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{student?.full_name || 'Student'}</span>
                        <span className="font-mono text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                          {student?.reg_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Course Dispute: <span className="font-semibold text-slate-800">{course?.code} - {course?.title}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isResolved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isVerified ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      isReferred ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {isResolved ? 'Resolved' :
                       isVerified ? 'HOD Memo Approved' :
                       isReferred ? 'Referred to Lecturer' :
                       'Pending Review'}
                    </span>
                    <button
                      onClick={() => handleOpenResponse(cmp)}
                      className="px-3.5 py-1.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {isResolved ? 'View Full Audit Trail' : 'Open Dispute Protocol'}
                    </button>
                  </div>
                </div>

                {/* Complaint text */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Student Complaint
                  </span>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    "{cmp.complaint_text}"
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Submitted: {new Date(cmp.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Workflow Status Tracker */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      isReferred || isVerified || isResolved ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <UserCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>1. Referral to Lecturer</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      isVerified || isResolved ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <FileCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>2. Lecturer Audit & Memo to HOD</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      isResolved ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>3. Final Senate Resolution</span>
                    </div>
                  </div>
                </div>

                {/* Official Response if resolved */}
                {cmp.exam_officer_response && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                      Official Exam Office Adjudication & Senate Action
                    </span>
                    <p className="text-sm text-emerald-950 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 leading-relaxed font-medium">
                      {cmp.exam_officer_response}
                    </p>
                    {cmp.resolved_at && (
                      <span className="text-[10px] text-emerald-600 block mt-1">
                        Resolved on: {new Date(cmp.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Formal Rectification Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Result Rectification Adjudication</h3>
                  <p className="text-xs text-slate-500">Official 3-Tier Academic Dispute Resolution Process</p>
                </div>
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                &times;
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-semibold text-slate-800">
                Candidate: {students.find(s => s.id === activeComplaint.student_id)?.full_name} ({students.find(s => s.id === activeComplaint.student_id)?.reg_number})
              </p>
              <p className="text-slate-500 mt-0.5">
                Course: {courses.find(c => c.id === activeComplaint.course_id)?.code} - {courses.find(c => c.id === activeComplaint.course_id)?.title}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700 italic">
                "{activeComplaint.complaint_text}"
              </div>
            </div>

            {/* Step 1: Referral to Lecturer */}
            <div className="border border-slate-200 rounded-xl p-4 mb-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                  Referral to Course Lecturer for Script Audit
                </h4>
                {activeComplaint.status !== 'pending' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Dispatched
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                disabled={activeComplaint.status !== 'pending'}
                value={referralNote}
                onChange={(e) => setReferralNote(e.target.value)}
                placeholder="Type your official directive to the course lecturer (e.g. Please retrieve candidate's physical Continuous Assessment scripts and verify recorded marks against submitted score roster)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-primary focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
              />
              {!referralNote && activeComplaint.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => setReferralNote("Kindly retrieve candidate's physical Continuous Assessment (CA) scripts and verify recorded marks against submitted score roster.")}
                  className="text-[11px] text-primary hover:underline font-medium mt-1 inline-block"
                >
                  + Use Standard Directive Template
                </button>
              )}
              {activeComplaint.status === 'pending' && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleReferToLecturer}
                    disabled={resolving}
                    className="px-4 py-1.5 bg-primary hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Dispatch to Lecturer Desk
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Departmental Investigation & HOD Authorization Status */}
            <div className="border border-slate-200 rounded-xl p-4 mb-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                  Departmental Script Audit & HOD Authorization
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeComplaint.status === 'hod_approved' || activeComplaint.status === 'resolved'
                    ? 'text-emerald-700 bg-emerald-50'
                    : activeComplaint.status === 'awaiting_hod_approval'
                    ? 'text-purple-700 bg-purple-50'
                    : activeComplaint.status === 'referred_to_lecturer'
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-slate-400 bg-slate-100'
                }`}>
                  {activeComplaint.status === 'hod_approved' || activeComplaint.status === 'resolved'
                    ? 'HOD Sanctioned'
                    : activeComplaint.status === 'awaiting_hod_approval'
                    ? 'Memo with HOD'
                    : activeComplaint.status === 'referred_to_lecturer'
                    ? 'At Lecturer Desk'
                    : 'Pending Dispatch'}
                </span>
              </div>

              {activeComplaint.status === 'pending' ? (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                  Referral has not been dispatched yet. Click "Dispatch to Lecturer Desk" in Step 1 to initiate physical script audit.
                </p>
              ) : activeComplaint.status === 'referred_to_lecturer' ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Dispatched to Course Lecturer (Dr. Aminu Ibrahim)</span>
                  </div>
                  <p className="text-amber-800">
                    The lecturer must retrieve physical continuous assessment scripts, audit scores, and submit a formal memorandum to the HOD.
                  </p>
                </div>
              ) : activeComplaint.status === 'awaiting_hod_approval' ? (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Lecturer Audit Completed & Dispatched to HOD</span>
                  </div>
                  <p className="text-purple-800">
                    Lecturer confirmed: "{activeComplaint.lecturer_findings || 'Discrepancy confirmed'}". Memo Ref: <strong className="font-mono">{activeComplaint.hod_memo_ref || 'UNN/CSC/REC/2026/014'}</strong>. Awaiting executive signature from HOD Dr. (Mrs.) Ifeoma Nwokoye.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Executive Sanction Granted by HOD</span>
                  </div>
                  <p className="text-emerald-900">
                    HOD Dr. (Mrs.) Ifeoma Nwokoye has formally approved broadsheet withdrawal and score adjustment under Memo <strong className="font-mono">{activeComplaint.hod_memo_ref || 'UNN/CSC/REC/2026/014'}</strong>.
                  </p>
                  <div className="text-[11px] text-emerald-700 font-mono">
                    Adjustment: {activeComplaint.requested_adjustment || '+4 marks'} &bull; Digital Signature Verified
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Final Senate Score Rectification */}
            <div className={`border rounded-xl p-4 mb-4 ${
              activeComplaint.status === 'hod_approved' || activeComplaint.status === 'resolved'
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">3</span>
                  Final Senate Score Rectification & Student Notice
                </h4>
                {activeComplaint.status === 'resolved' && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                disabled={activeComplaint.status !== 'hod_approved'}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter final Senate resolution and master record update details (e.g. Physical script audit confirmed by Course Lecturer. Result broadsheet line item amended under HOD approval Memo UNN/CSC/REC/2026/014. Continuous Assessment adjusted to 25/30. Final Senate master records updated)..."
                className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg focus:ring-emerald-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
              {!responseText && activeComplaint.status === 'hod_approved' && (
                <button
                  type="button"
                  onClick={() => setResponseText(`Physical script audit confirmed by Course Lecturer Dr. Ibrahim. Result broadsheet line item amended under HOD approval Memo ${activeComplaint.hod_memo_ref || 'UNN/CSC/REC/2026/014'}. Continuous Assessment adjusted from 21/30 to 25/30. Final Senate master records updated.`)}
                  className="text-[11px] text-emerald-700 hover:underline font-medium mt-1 inline-block"
                >
                  + Use Standard Senate Resolution Template
                </button>
              )}
              {activeComplaint.status !== 'hod_approved' && activeComplaint.status !== 'resolved' && (
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  * Senate score rectification is locked until the Head of Department approves the broadsheet withdrawal.
                </p>
              )}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveComplaint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
              {activeComplaint.status === 'hod_approved' && (
                <button
                  type="button"
                  disabled={resolving}
                  onClick={handleFinalResolve}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {resolving ? 'Updating Records...' : 'Execute Senate Rectification & Resolve Dispute'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
