'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getComplaints, resolveComplaint, getStudents, getCourses } from '../../../../lib/db'
import { AlertCircle, CheckCircle2, MessageSquare, Send, CheckCircle, Clock } from 'lucide-react'

export default function ExamOfficerComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Response Modal
  const [activeComplaint, setActiveComplaint] = useState(null)
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
    setResponseText(cmp.exam_officer_response || '')
  }

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!activeComplaint || !responseText.trim()) return

    setResolving(true)
    try {
      await resolveComplaint(activeComplaint.id, responseText)
      setStatusMessage({
        type: 'success',
        text: 'Complaint marked as resolved. Response has been sent to the student portal.'
      })
      setActiveComplaint(null)
      setResponseText('')
      loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update complaint response.' })
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
          <option value="pending">Pending Resolution ({complaints.filter(c => c.status === 'pending').length})</option>
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
            const isPending = cmp.status === 'pending'

            return (
              <div
                key={cmp.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPending ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {isPending ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
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
                      isPending ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {cmp.status}
                    </span>
                    <button
                      onClick={() => handleOpenResponse(cmp)}
                      className="px-3.5 py-1.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      {isPending ? 'Investigate & Reply' : 'Edit Response'}
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

                {/* Official Response if resolved */}
                {cmp.exam_officer_response && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                      Official Exam Office Adjudication
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

      {/* Response Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Respond to Student Inquiry</h3>
                <p className="text-xs text-slate-500">Official adjudication by Institutional Exam Officer</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-semibold text-slate-700 mb-1">
                Student: {students.find(s => s.id === activeComplaint.student_id)?.full_name} ({students.find(s => s.id === activeComplaint.student_id)?.reg_number})
              </p>
              <p className="text-slate-600 italic">
                "{activeComplaint.complaint_text}"
              </p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Examination Office Finding / Response
                </label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="e.g. Script retrieved from Departmental archive. Score reconciled with Course Lecturer Dr. Ibrahim; total score corrected from 65 to 69 in final records."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveComplaint(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {resolving ? 'Submitting...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
