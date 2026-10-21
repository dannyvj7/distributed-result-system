'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getResultDistributions, getCourses, getDepartments, getFinalResults, getStudents } from '../../../../lib/db'
import { BookOpen, Search, ShieldCheck, Clock, Building2, Filter, Eye } from 'lucide-react'

export default function ExamOfficerResultsPage() {
  const [distributions, setDistributions] = useState([])
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedCourseResults, setSelectedCourseResults] = useState(null)

  useEffect(() => {
    async function loadData() {
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
        setFinalResults(finals)
        setStudents(studs)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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
                      <td className="py-4 px-6 font-semibold text-slate-800">{recvDept?.name} ({recvDept?.code})</td>
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
                        <button
                          onClick={() => setSelectedCourseResults({ course, dist: d })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-primary rounded-lg text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect Roster
                        </button>
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

            <div className="flex justify-end pt-3 border-t border-slate-100">
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
