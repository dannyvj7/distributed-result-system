'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getStudents, getCourses, getComplaints, createComplaint, getFinalResults } from '../../../../lib/db'
import { normalizeRegNumber } from '../../../../lib/grading'
import { MessageSquarePlus, Send, CheckCircle, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export default function StudentComplaintPage() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [courses, setCourses] = useState([])
  const [complaints, setComplaints] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [complaintText, setComplaintText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [studs, crs] = await Promise.all([getStudents(), getCourses()])

        const activeStudent = studs.find(
          s => s.id === user?.id || (user?.reg_number && normalizeRegNumber(s.reg_number) === normalizeRegNumber(user.reg_number))
        ) || studs[0]

        setStudent(activeStudent)
        setCourses(crs)
        if (crs.length > 0) setSelectedCourseId(crs[0].id)

        if (activeStudent) {
          const studentComplaints = await getComplaints(activeStudent.id, activeStudent.reg_number)
          setComplaints(studentComplaints)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!student || !selectedCourseId || !complaintText.trim()) return

    setSubmitting(true)
    try {
      await createComplaint(student.id, selectedCourseId, complaintText, student.full_name, student.reg_number)
      setStatusMessage({
        type: 'success',
        text: 'Complaint submitted successfully! It has been forwarded to the Examination Office for investigation.'
      })
      setComplaintText('')
      const updated = await getComplaints(student.id, student.reg_number)
      setComplaints(updated)
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to submit complaint.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Result Dispute & Complaint Desk" roleRequired="student">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Lodge Complaint Form */}
        <div className="lg:col-span-1 bg-white rounded-xl p-6 border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Lodge Score Inquiry</h3>
              <p className="text-xs text-slate-500">Report CA or examination score discrepancy</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Affected Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Complaint Details / Reason
              </label>
              <textarea
                rows={4}
                required
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Explain the score issue in detail (e.g., Discrepancy observed between recorded continuous assessment score on broadsheet and marked physical test script. Kindly verify with the course lecturer)."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-primary hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Ticket...' : 'Submit to Exam Officer'}
            </button>
          </form>
        </div>

        {/* Previous Complaints & Exam Officer Responses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">My Complaint History & Adjudications</h3>
              <p className="text-xs text-slate-500">Track responses from the Institutional Examination Office</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {complaints.length} Total
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
              You have not submitted any result complaints.
            </div>
          ) : (
            complaints.map((c) => {
              const course = courses.find(crs => crs.id === c.course_id)
              const isResolved = c.status === 'resolved'

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="font-bold text-primary font-mono text-sm">
                      {course?.code}: {course?.title}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isResolved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      c.status === 'hod_approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                      c.status === 'awaiting_hod_approval' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      c.status === 'referred_to_lecturer' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isResolved ? 'Resolved' :
                       c.status === 'hod_approved' ? 'HOD Approved' :
                       c.status === 'awaiting_hod_approval' ? 'Memo With HOD' :
                       c.status === 'referred_to_lecturer' ? 'With Lecturer' :
                       'Pending Review'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Your Complaint
                    </span>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      "{c.complaint_text}"
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Submitted on: {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Official Response & Progress */}
                  {isResolved ? (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl mt-2">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Examination Officer Adjudication & Rectification
                      </span>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {c.exam_officer_response}
                      </p>
                      {c.resolved_at && (
                        <span className="text-[10px] text-emerald-600 block mt-1">
                          Resolved on: {new Date(c.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ) : c.status === 'hod_approved' ? (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>HOD Executive Sanction Granted</span>
                      </div>
                      <p className="text-emerald-900">
                        HOD Dr. (Mrs.) Ifeoma Nwokoye approved broadsheet withdrawal and score adjustment under Memo <strong className="font-mono">{c.hod_memo_ref || 'UNN/CSC/REC/2026/014'}</strong>. The Examinations Office is finalizing the Senate records update.
                      </p>
                    </div>
                  ) : c.status === 'awaiting_hod_approval' ? (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Lecturer Physical Script Audit Completed</span>
                      </div>
                      <p className="text-purple-800">
                        The course lecturer verified your test script and submitted formal memorandum <strong className="font-mono">{c.hod_memo_ref || 'UNN/CSC/REC/2026/014'}</strong> to the Head of Department. Awaiting HOD executive sign-off.
                      </p>
                    </div>
                  ) : c.status === 'referred_to_lecturer' ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>Referred to Course Lecturer for Script Audit</span>
                      </div>
                      <p className="text-blue-800">
                        The Exam Officer has forwarded your inquiry to the assigned course lecturer to retrieve and inspect your original continuous assessment scripts.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Ticket pending review by Examination Officer.</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
