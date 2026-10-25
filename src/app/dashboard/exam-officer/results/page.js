'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getResultDistributions, getCourses, getDepartments, getFinalResults, getStudents, acknowledgeExamOfficeReceipt } from '../../../../lib/db'
import { calculateGrade } from '../../../../lib/grading'
import { BookOpen, Search, ShieldCheck, Clock, Building2, Filter, Eye, CheckCircle2, CheckCircle } from 'lucide-react'

export default function ExamOfficerResultsPage() {
  const { user } = useAuth()
  const [distributions, setDistributions] = useState([])
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [acknowledging, setAcknowledging] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  // Filters & Selected State
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedCourseResults, setSelectedCourseResults] = useState(null)

  const loadData = async () => {
    try {
      const [dists, crs, depts, finals, studs] = await Promise.all([
        getResultDistributions(),
        getCourses(),
        getDepartments(),
        getFinalResults(),
        getStudents()
      ])
      setDistributions(dists)
      setCourses(crs)
      setDepartments(depts)
      const processedFinals = finals.map(r => {
        const ca = Number(r.ca_score || 0)
        const exam = Number(r.exam_score || 0)
        const total = (r.total_score !== undefined && r.total_score !== null && !isNaN(Number(r.total_score)))
          ? Number(r.total_score)
          : (ca + exam)
        const { grade, gradePoint } = calculateGrade(total)
        return {
          ...r,
          ca_score: ca,
          exam_score: exam,
          total_score: total,
          grade: r.grade || grade,
          grade_point: (r.grade_point !== undefined && r.grade_point !== null && !isNaN(Number(r.grade_point)))
            ? Number(r.grade_point)
            : gradePoint
        }
      })
      setFinalResults(processedFinals)
      setStudents(studs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAcknowledge = async (distId, courseCode) => {
    setAcknowledging(distId)
    try {
      await acknowledgeExamOfficeReceipt(distId, user?.id)
      setStatusMessage({
        type: 'success',
        text: `Archival copy of ${courseCode || 'course'} results successfully acknowledged and sealed in the Central Examinations Archive.`
      })
      await loadData()
      if (selectedCourseResults?.dist?.id === distId) {
        setSelectedCourseResults(prev => prev ? { ...prev, dist: { ...prev.dist, status: 'acknowledged' } } : null)
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error acknowledging archival copy.' })
    } finally {
      setAcknowledging(null)
    }
  }

  const filtered = distributions.filter(d => {
    const course = courses.find(c => c.id === d.course_id)
    const matchSearch =
      (course?.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (course?.title || '').toLowerCase().includes(search.toLowerCase())
    const matchDept = filterDept === 'ALL' || d.received_by_dept_id === filterDept
    const matchStatus = filterStatus === 'ALL' || d.status === filterStatus
    return matchSearch && matchDept && matchStatus
  })

  return (
    <DashboardLayout title="University-Wide Distributed Results Directory" roleRequired="exam_officer">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-slate-500 hover:text-slate-800 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course code or title..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Receiving Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Transmission Statuses</option>
            <option value="sent">Dispatched / Pending Acknowledgement</option>
            <option value="acknowledged">Digitally Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Course</th>
                <th className="py-3.5 px-6">Originating Dept</th>
                <th className="py-3.5 px-6">Receiving Dept</th>
                <th className="py-3.5 px-6">Session / Sem</th>
                <th className="py-3.5 px-6">Dispatch Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading university results...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No distributed results found.</td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const course = courses.find(c => c.id === d.course_id)
                  const originDept = departments.find(dept => dept.id === course?.department_id) || departments[0]
                  const recvDept = departments.find(dept => dept.id === d.received_by_dept_id) || departments[1]
                  const isAck = d.status === 'acknowledged'

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <span className="font-bold text-primary block">{course?.code || 'Course'}</span>
                        <span className="text-xs text-slate-700">{course?.title}</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">{originDept?.name} ({originDept?.code})</td>
                      <td className="py-4 px-6">
                        {recvDept?.code === 'EXAM-OFFICE' || d.received_by_dept_id === 'd0000000-0000-0000-0000-000000000000' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🏛️ Central Exams Archival Copy
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">{recvDept?.name} ({recvDept?.code})</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 capitalize">{d.session} • {d.semester}</td>
                      <td className="py-4 px-6">
                        {isAck ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Acknowledged
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Dispatched (Pending Sign)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(recvDept?.code === 'EXAM-OFFICE' || d.received_by_dept_id === 'd0000000-0000-0000-0000-000000000000') && !isAck && (
                            <button
                              onClick={() => handleAcknowledge(d.id, course?.code)}
                              disabled={acknowledging === d.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {acknowledging === d.id ? 'Saving...' : 'Acknowledge Archival Copy'}
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCourseResults({ course, dist: d })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-primary rounded-lg text-xs font-semibold transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect Roster
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

      {/* Roster Inspection Modal */}
      {selectedCourseResults && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCourseResults.course?.code}: {selectedCourseResults.course?.title}
                </h3>
                <p className="text-xs text-slate-500">Official Distributed Broad-score Roster</p>
              </div>
              <button
                onClick={() => setSelectedCourseResults(null)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Reg Number</th>
                    <th className="py-2 px-3">Candidate Name</th>
                    <th className="py-2 px-3">CA (/30)</th>
                    <th className="py-2 px-3">Exam (/70)</th>
                    <th className="py-2 px-3">Total (/100)</th>
                    <th className="py-2 px-3">Grade</th>
                    <th className="py-2 px-3">Grade Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finalResults
                    .filter(r => r.course_id === selectedCourseResults.course?.id)
                    .map((r, i) => {
                      const stud = students.find(s => s.id === r.student_id)
                      return (
                        <tr key={i}>
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">{stud?.reg_number}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{stud?.full_name}</td>
                          <td className="py-2.5 px-3">{r.ca_score}</td>
                          <td className="py-2.5 px-3">{r.exam_score}</td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">{r.total_score}</td>
                          <td className="py-2.5 px-3 font-bold">{r.grade}</td>
                          <td className="py-2.5 px-3 font-bold">{Number(r.grade_point).toFixed(1)}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {(selectedCourseResults.dist?.received_by_dept_id === 'd0000000-0000-0000-0000-000000000000') && selectedCourseResults.dist?.status !== 'acknowledged' ? (
                  <button
                    onClick={() => handleAcknowledge(selectedCourseResults.dist.id, selectedCourseResults.course?.code)}
                    disabled={acknowledging === selectedCourseResults.dist.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {acknowledging === selectedCourseResults.dist.id ? 'Acknowleging Archival...' : 'Acknowledge & Seal Archival Master Copy'}
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    Central Archive Status: <strong className="text-slate-800 capitalize">{selectedCourseResults.dist?.status || 'Active'}</strong>
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedCourseResults(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
