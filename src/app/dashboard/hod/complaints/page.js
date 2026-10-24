'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import {
  getCourses,
  getDepartments,
  getComplaints,
  getStudents,
  getHodProfile,
  hodApproveWithdrawal
} from '../../../../lib/db'
import {
  FileCheck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  PenTool,
  X,
  FileText,
  User,
  Building2,
  ArrowRight
} from 'lucide-react'

export default function HodComplaintsDeskPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [students, setStudents] = useState([])
  const [hodProfile, setHodProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'awaiting_hod_approval' | 'referred_to_lecturer' | 'hod_approved' | 'resolved'

  // Modal State
  const [activeRectification, setActiveRectification] = useState(null)
  const [hodNotes, setHodNotes] = useState('')
  const [approving, setApproving] = useState(false)

  const loadData = async () => {
    try {
      const [allCourses, allDepts, allComplaints, allStudents, profile] = await Promise.all([
        getCourses(),
        getDepartments(),
        getComplaints(),
        getStudents(),
        getHodProfile(user?.id)
      ])
      setCourses(allCourses)
      setDepartments(allDepts)
      setComplaints(allComplaints)
      setStudents(allStudents)
      setHodProfile(profile)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleOpenSanctionModal = (cmp) => {
    setActiveRectification(cmp)
    setHodNotes('Executive approval granted to withdraw broadsheet line item and sanction the requested Continuous Assessment adjustment based on lecturer script audit.')
  }

  const handleApproveRectification = async () => {
    if (!activeRectification) return
    setApproving(true)
    const notes = hodNotes.trim() || 'Executive approval granted to withdraw broadsheet line item and sanction score adjustment based on verified physical script audit.'
    try {
      const hodSigName = hodProfile?.full_name || user?.full_name || 'Dr. (Mrs.) Ifeoma Nwokoye'
      await hodApproveWithdrawal(activeRectification.id, notes, hodSigName)
      setStatusMessage({
        type: 'success',
        text: `Broadsheet withdrawal and score adjustment formally sanctioned under Memo ${activeRectification.hod_memo_ref || 'UNN/CSC/REC/2026/014'}. Dispatched to Examinations Office for Senate record update.`
      })
      setActiveRectification(null)
      await loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to approve rectification.' })
    } finally {
      setApproving(false)
    }
  }

  const myDeptId = user?.department_id || departments[0]?.id
  const myDept = departments.find(d => d.id === myDeptId)

  // Filter complaints based on status
  const filtered = complaints.filter(c => {
    if (filterStatus === 'ALL') return true
    return c.status === filterStatus
  })

  const countAwaiting = complaints.filter(c => c.status === 'awaiting_hod_approval').length
  const countLecturer = complaints.filter(c => c.status === 'referred_to_lecturer').length
  const countApproved = complaints.filter(c => c.status === 'hod_approved').length
  const countResolved = complaints.filter(c => c.status === 'resolved').length

  return (
    <DashboardLayout title="HOD Broadsheet Withdrawal & Dispute Sanction Desk" roleRequired="hod">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Protocol Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Statutory Broadsheet Authorization
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">Result Dispute & Broadsheet Withdrawal Desk</h2>
            <p className="text-xs text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
              Under university academic regulations, broadsheet scores cannot be altered without formal Departmental Board of Examiners sanction. When a course lecturer audits a physical script, the HOD reviews the memorandum and digitally sanctions broadsheet withdrawal before the Examinations Office updates Senate master records.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 p-3 rounded-xl border border-white/10 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-white">Authorized Signer</p>
              <p className="text-purple-200 text-[11px]">{hodProfile?.full_name || user?.full_name || 'Departmental HOD'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Counters Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Departmental Dispute Memos</h3>
          <p className="text-xs text-slate-500">Track and sanction score rectification requests across all course levels</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'ALL'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Disputes ({complaints.length})
          </button>
          <button
            onClick={() => setFilterStatus('awaiting_hod_approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              filterStatus === 'awaiting_hod_approval'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>Action Required</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">{countAwaiting}</span>
          </button>
          <button
            onClick={() => setFilterStatus('referred_to_lecturer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'referred_to_lecturer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            With Lecturer ({countLecturer})
          </button>
          <button
            onClick={() => setFilterStatus('hod_approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'hod_approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            HOD Sanctioned ({countApproved})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'resolved'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Resolved ({countResolved})
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
            Loading departmental complaints...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
            No complaints found under this category.
          </div>
        ) : (
          filtered.map((cmp) => {
            const student = students.find(s => s.id === cmp.student_id)
            const studentName = cmp.student_name || student?.full_name || 'Candidate'
            const studentReg = cmp.student_reg_number || student?.reg_number || '2022/234567'
            const course = courses.find(c => c.id === cmp.course_id)
            const isAwaiting = cmp.status === 'awaiting_hod_approval'
            const isHodApproved = cmp.status === 'hod_approved'
            const isResolved = cmp.status === 'resolved'
            const isReferred = cmp.status === 'referred_to_lecturer'
            const isPending = cmp.status === 'pending'

            return (
              <div
                key={cmp.id}
                className={`bg-white rounded-xl p-6 border shadow-xs transition ${
                  isAwaiting ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isResolved ? 'bg-blue-50 text-blue-600' :
                      isHodApproved ? 'bg-emerald-50 text-emerald-600' :
                      isAwaiting ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {isResolved ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> :
                       isHodApproved ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> :
                       isAwaiting ? <PenTool className="w-5 h-5 text-purple-700" /> :
                       <Clock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{studentName}</span>
                        <span className="font-mono text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                          {studentReg}
                        </span>
                        <span className="text-xs text-slate-500">
                          &bull; Level {student?.level || 400}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Course: <span className="font-semibold text-slate-800">{course?.code || 'COS 101'} - {course?.title || 'Computer Science'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isResolved ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      isHodApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isAwaiting ? 'bg-purple-100 text-purple-900 border border-purple-200 font-extrabold' :
                      isReferred ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {isResolved ? 'Senate Synced & Resolved' :
                       isHodApproved ? 'HOD Sanctioned & Dispatched' :
                       isAwaiting ? 'Action Required: Awaiting HOD Sanction' :
                       isReferred ? 'With Lecturer (Script Audit)' :
                       'Pending Review'}
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase">Student Dispute Statement:</span>
                    <p className="text-slate-800 mt-0.5">"{cmp.complaint_text}"</p>
                  </div>

                  {cmp.lecturer_findings && (
                    <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-100">
                      <span className="font-bold text-purple-900 block text-[10px] uppercase">Lecturer Written Memorandum to HOD:</span>
                      <p className="text-purple-950 font-medium mt-0.5 leading-relaxed">
                        "{cmp.lecturer_findings}"
                      </p>
                      <div className="mt-2 pt-2 border-t border-purple-200/50 flex flex-wrap items-center gap-4 text-[11px] text-purple-900">
                        <span>Verified Score Adjustment: <strong className="text-emerald-700 font-bold">{cmp.requested_adjustment || 'Score Rectification'}</strong></span>
                        <span>Memo Reference: <strong className="font-mono text-purple-950">{cmp.hod_memo_ref || 'UNN/CSC/REC/2026/014'}</strong></span>
                      </div>
                    </div>
                  )}

                  {cmp.hod_notes && (
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                      <span className="font-bold text-emerald-900 block text-[10px] uppercase">HOD Executive Sanction Endorsement:</span>
                      <p className="text-emerald-950 mt-0.5">"{cmp.hod_notes}"</p>
                      <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                        Digitally Signed by: {cmp.hod_signed_by || 'Dr. (Mrs.) Ifeoma Nwokoye'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Logged: {new Date(cmp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  <div>
                    {isAwaiting ? (
                      <button
                        onClick={() => handleOpenSanctionModal(cmp)}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/20 transition flex items-center gap-1.5"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Review & Sanction Broadsheet Withdrawal
                      </button>
                    ) : isHodApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Executive Approval Dispatched to Examinations Office
                      </span>
                    ) : isResolved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Rectified in Master Broadsheet
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        Under course lecturer investigation
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* HOD Broadsheet Withdrawal Sanction Modal */}
      {activeRectification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Broadsheet Withdrawal Authorization</h3>
                  <p className="text-xs text-slate-500">Departmental Board of Examiners &bull; Official HOD Sanction</p>
                </div>
              </div>
              <button
                onClick={() => setActiveRectification(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-bold text-slate-800">
                  {activeRectification.student_name || students.find(s => s.id === activeRectification.student_id)?.full_name || 'Candidate'} ({activeRectification.student_reg_number || students.find(s => s.id === activeRectification.student_id)?.reg_number || '2022/234567'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course & Dept:</span>
                <span className="font-semibold text-slate-800">
                  {courses.find(c => c.id === activeRectification.course_id)?.code || 'COS 101'} &bull; {myDept?.name || 'Computer Science'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lecturer Memo Ref:</span>
                <span className="font-mono font-bold text-purple-700">
                  {activeRectification.hod_memo_ref || 'UNN/CSC/REC/2026/014'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-slate-700 italic">
                Lecturer Finding: "{activeRectification.lecturer_findings}"
              </div>
            </div>

            {/* Statutory Statement */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 my-4 text-xs text-purple-950 leading-relaxed">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-purple-900 mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-700" /> Executive Board Sanction
              </div>
              <p className="mb-2">
                As Head of Department and Chairman of the Departmental Board of Examiners, I hereby grant executive approval to withdraw and amend the broadsheet line item for this candidate based on the course lecturer's physical script audit. The Examinations Officer is hereby authorized to synchronize this adjustment with Senate records.
              </p>
              <textarea
                rows={2}
                value={hodNotes}
                onChange={(e) => setHodNotes(e.target.value)}
                placeholder="Optional HOD endorsement remarks (e.g. Executive approval granted to withdraw broadsheet line item and sanction score adjustment based on verified script audit)..."
                className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg focus:ring-primary focus:outline-none bg-white text-slate-800"
              />
            </div>

            {/* HOD Signature Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  HOD Endorsement & Signature
                </span>
                <div className="font-serif italic text-2xl font-bold text-primary tracking-wide mt-1 select-none">
                  {hodProfile?.full_name || user?.full_name || 'Dr. (Mrs.) Ifeoma Nwokoye'}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  Associate Professor & Head of Department
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  <CheckCircle2 className="w-3 h-3" /> Board Authorized
                </span>
                <div className="text-xs text-slate-600 font-mono mt-1">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveRectification(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={handleApproveRectification}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-900/20 transition flex items-center gap-1.5"
              >
                <PenTool className="w-3.5 h-3.5" />
                {approving ? 'Sanctioning...' : 'Affix HOD Signature & Authorize Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
