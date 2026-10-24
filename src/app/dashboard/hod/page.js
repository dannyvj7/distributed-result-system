'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../lib/authContext'
import { getCourses, getFinalResults, getResultDistributions, getDepartments, getHodProfile, getComplaints, hodApproveWithdrawal, getStudents } from '../../../lib/db'
import {
  BookOpen,
  Send,
  Inbox,
  PenTool,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Building2,
  AlertCircle,
  FileText,
  X
} from 'lucide-react'

export default function HodDashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [distributions, setDistributions] = useState([])
  const [hodProfile, setHodProfile] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState(null)

  // HOD Approval Modal State
  const [activeRectification, setActiveRectification] = useState(null)
  const [hodNotes, setHodNotes] = useState('')
  const [approving, setApproving] = useState(false)

  const loadData = async () => {
    try {
      const [allCourses, allDepts, allFinals, allDists, profile, allComplaints, allStudents] = await Promise.all([
        getCourses(),
        getDepartments(),
        getFinalResults(),
        getResultDistributions(),
        getHodProfile(user?.id),
        getComplaints(),
        getStudents()
      ])

      setCourses(allCourses)
      setDepartments(allDepts)
      setFinalResults(allFinals)
      setDistributions(allDists)
      setHodProfile(profile)
      setComplaints(allComplaints)
      setStudents(allStudents)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleApproveRectification = async () => {
    if (!activeRectification) return
    setApproving(true)
    try {
      const hodSigName = hodProfile?.full_name || user?.full_name || 'Dr. (Mrs.) Ifeoma Nwokoye'
      await hodApproveWithdrawal(activeRectification.id, hodNotes, hodSigName)
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

  // Courses originating in this department
  const deptCourses = courses.filter(c => c.department_id === myDeptId || (c.code.startsWith('COS') && myDeptId === 'd1111111-1111-1111-1111-111111111111'))

  // Filter courses by status
  const pendingApprovalCourses = deptCourses.filter(c => {
    const results = finalResults.filter(f => f.course_id === c.id)
    return results.length > 0 && results.some(r => r.status === 'draft')
  })

  const approvedCourses = deptCourses.filter(c => {
    const results = finalResults.filter(f => f.course_id === c.id)
    return results.length > 0 && results.some(r => r.status === 'approved')
  })

  // Outgoing distributions sent by this department
  const sentDistributions = distributions.filter(d => d.sent_by_hod_id === user?.id || deptCourses.some(c => c.id === d.course_id))

  // Incoming distributions received by this department
  const incomingDistributions = distributions.filter(d => d.received_by_dept_id === myDeptId)
  const pendingAcknowledge = incomingDistributions.filter(d => d.status === 'sent')

  // Distributions relevant to this HOD's department (sent or received)
  const relevantDistributions = distributions.filter(d =>
    !myDeptId ||
    d.received_by_dept_id === myDeptId ||
    d.sent_by_hod_id === user?.id ||
    deptCourses.some(c => c.id === d.course_id)
  )

  return (
    <DashboardLayout title="Head of Department (HOD) Portal" roleRequired="hod">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Departmental Board of Examiners
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {hodProfile?.full_name || user?.full_name || 'Departmental HOD'}
            </h1>
            <p className="mt-1 text-sm text-blue-100/90">
              {hodProfile?.rank || 'Head of Department'} &bull; {myDept?.name || 'Department'} ({myDept?.code || 'DEPT'})
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center shrink-0">
            <p className="text-xs text-blue-200 uppercase font-semibold mb-1">Digital Signature</p>
            {hodProfile?.signature_url ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4" /> Signature Registered
              </span>
            ) : (
              <Link
                href="/dashboard/hod/profile"
                className="text-xs font-bold text-amber-300 underline hover:text-white"
              >
                Upload Signature Now
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Approval</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{loading ? '...' : pendingApprovalCourses.length}</h3>
            <span className="text-[11px] text-slate-500">Draft scores from lecturers</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ready to Distribute</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{loading ? '...' : approvedCourses.length}</h3>
            <span className="text-[11px] text-slate-500">Approved for taking depts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Distributed Results</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">{loading ? '...' : sentDistributions.length}</h3>
            <span className="text-[11px] text-slate-500">Dispatched across campus</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Acknowledgment</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '...' : pendingAcknowledge.length}</h3>
            <span className="text-[11px] text-slate-500">Awaiting your digital sign</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Broadsheet Withdrawal & Rectification Requests */}
      {complaints.filter(c => c.status === 'awaiting_hod_approval').length > 0 && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-xs overflow-hidden mb-8">
          <div className="p-5 border-b border-purple-100 bg-purple-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Result Rectification & Broadsheet Withdrawal Requests</h3>
                <p className="text-xs text-slate-500">
                  Course lecturers requesting formal HOD sanction to withdraw and amend broadsheet line items
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 self-start sm:self-auto">
              Awaiting HOD Signature
            </span>
          </div>

          <div className="p-5 divide-y divide-slate-100">
            {complaints.filter(c => c.status === 'awaiting_hod_approval').map(cmp => {
              const student = students.find(s => s.id === cmp.student_id)
              const course = courses.find(c => c.id === cmp.course_id)

              return (
                <div key={cmp.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{student?.full_name || 'Candidate'}</span>
                      <span className="font-mono text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                        {student?.reg_number}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        &bull; Course: <strong className="text-slate-900">{course?.code || 'COS 101'}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-purple-950 mt-1.5 bg-purple-50/70 p-2.5 rounded-lg border border-purple-100 font-medium leading-relaxed">
                      <span className="font-bold text-purple-900 block text-[10px] uppercase">Lecturer Written Memorandum:</span>
                      "{cmp.lecturer_findings}"
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                      <span>Requested Correction: <strong className="text-emerald-700">{cmp.requested_adjustment || '+4 marks'}</strong></span>
                      <span>Memo Ref: <strong className="font-mono text-slate-700">{cmp.hod_memo_ref || 'UNN/CSC/REC/2026/014'}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => setActiveRectification(cmp)}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/20 transition flex items-center gap-1.5"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Review & Sanction Withdrawal
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <Link
          href="/dashboard/hod/results"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-primary transition">
            1. Review & Approve Results
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Review merged CA + Exam score rosters, verify NUC grade allocations, and approve results.
          </p>
          <span className="mt-4 text-xs font-semibold text-primary flex items-center gap-1">
            Open Approval Desk <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/hod/distribute"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Send className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition">
            2. Distribute Course Results
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Query student enrollments and electronically dispatch approved results to all borrowing departments.
          </p>
          <span className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1">
            Distribute to Depts <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/hod/acknowledge"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <PenTool className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition">
            3. Acknowledge Received Results
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming course sheets sent by other HODs and affix your digital signature to acknowledge receipt.
          </p>
          <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            Sign & Acknowledge <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Outgoing & Incoming Distribution Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Inter-Departmental Result Distribution Records</h3>
            <p className="text-xs text-slate-500">Live electronic dispatch and signature tracking</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Course Code</th>
                <th className="py-3 px-5">Session / Semester</th>
                <th className="py-3 px-5">Destination Department</th>
                <th className="py-3 px-5">Dispatch Time</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Acknowledgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relevantDistributions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No result distribution transmissions on record for your department.
                  </td>
                </tr>
              ) : (
                relevantDistributions.map((d) => {
                  const course = courses.find(c => c.id === d.course_id)
                  const targetDept = departments.find(dept => dept.id === d.received_by_dept_id)
                  const isAck = d.status === 'acknowledged'

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-bold text-primary">{course ? course.code : 'COS401'}</td>
                      <td className="py-3.5 px-5 capitalize">{d.session} • {d.semester} Sem</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {targetDept ? `${targetDept.name} (${targetDept.code})` : 'Electrical Eng (EEE)'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">
                        {new Date(d.sent_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isAck ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isAck ? 'Acknowledged' : 'Dispatched / Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs">
                        {isAck ? (
                          <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Digitally Signed
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Awaiting Signature</span>
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
                  {students.find(s => s.id === activeRectification.student_id)?.full_name} ({students.find(s => s.id === activeRectification.student_id)?.reg_number})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course & Dept:</span>
                <span className="font-semibold text-slate-800">
                  {courses.find(c => c.id === activeRectification.course_id)?.code} &bull; Computer Science
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
              {!hodNotes && (
                <button
                  type="button"
                  onClick={() => setHodNotes('Executive approval granted to withdraw broadsheet line item and sanction the requested Continuous Assessment adjustment based on lecturer script audit.')}
                  className="text-[11px] text-purple-700 hover:underline font-medium mt-1 inline-block"
                >
                  + Use Standard Approval Remark
                </button>
              )}
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
