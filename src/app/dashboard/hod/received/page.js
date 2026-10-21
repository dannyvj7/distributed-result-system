'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getResultDistributions, getCourses, getDepartments, getFinalResults, getStudents } from '../../../../lib/db'
import { Inbox, CheckCircle2, Clock, ShieldCheck, ArrowRight, BookOpen, Building2 } from 'lucide-react'

export default function HodReceivedResultsPage() {
  const { user } = useAuth()
  const [distributions, setDistributions] = useState([])
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDist, setSelectedDist] = useState(null)

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

  const myDeptId = user?.department_id || departments[0]?.id

  // Distributions received by this department
  // For demo/inspection, include distributions where received_by_dept_id matches this dept, or all incoming distributions
  const receivedList = distributions.filter(d => d.received_by_dept_id === myDeptId || d.status === 'sent')

  return (
    <DashboardLayout title="Received Inter-Departmental Results" roleRequired="hod">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Incoming Course Results from Borrowing Departments</h3>
        <p className="text-xs text-slate-500">
          Courses taught by other departments that students in your department registered and sat examinations for.
        </p>
      </div>

      {/* Received Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Course Code & Title</th>
                <th className="py-3.5 px-6">Originating Department</th>
                <th className="py-3.5 px-6">Dispatched On</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Loading incoming results...</td>
                </tr>
              ) : receivedList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No results have been distributed to your department yet.
                  </td>
                </tr>
              ) : (
                receivedList.map((dist) => {
                  const course = courses.find(c => c.id === dist.course_id)
                  const originatingDept = departments.find(d => d.id === course?.department_id) || departments[0]
                  const isAck = dist.status === 'acknowledged'

                  return (
                    <tr key={dist.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <span className="font-bold text-primary block">{course?.code || 'COS401'}</span>
                        <span className="text-xs text-slate-700 font-medium">{course?.title || 'Distributed Systems'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-900 block">{originatingDept.name}</span>
                        <span className="text-xs text-slate-400">{originatingDept.faculty}</span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {new Date(dist.sent_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        {isAck ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Acknowledged
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Awaiting Signature
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDist(dist)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            View Scores
                          </button>
                          {!isAck && (
                            <Link
                              href={`/dashboard/hod/acknowledge?distId=${dist.id}`}
                              className="px-3 py-1.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1"
                            >
                              Sign & Acknowledge
                            </Link>
                          )}
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

      {/* Scores Inspection Modal */}
      {selectedDist && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Course Result Sheet: {courses.find(c => c.id === selectedDist.course_id)?.code || 'COS401'}
                </h3>
                <p className="text-xs text-slate-500">Distributed departmental score roster</p>
              </div>
              <button
                onClick={() => setSelectedDist(null)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 p-1"
              >
                Close
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Reg Number</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3">CA (/30)</th>
                    <th className="py-2 px-3">Exam (/70)</th>
                    <th className="py-2 px-3">Total (/100)</th>
                    <th className="py-2 px-3">Grade</th>
                    <th className="py-2 px-3">Grade Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finalResults
                    .filter(r => r.course_id === selectedDist.course_id)
                    .map((r, idx) => {
                      const stud = students.find(s => s.id === r.student_id)
                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">{stud?.reg_number}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{stud?.full_name}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-700">{r.ca_score}</td>
                          <td className="py-2.5 px-3 font-semibold text-blue-700">{r.exam_score}</td>
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
                onClick={() => setSelectedDist(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
