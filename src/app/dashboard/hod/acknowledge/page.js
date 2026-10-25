'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getResultDistributions, getCourses, getDepartments, getHodProfile, acknowledgeDistribution, getFinalResults, getStudents } from '../../../../lib/db'
import { ShieldCheck, CheckCircle2, AlertCircle, FileCheck, Building2, Calendar, UserCheck } from 'lucide-react'

export default function HodAcknowledgePage() {
  const { user } = useAuth()
  const [distributions, setDistributions] = useState([])
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [hodProfile, setHodProfile] = useState(null)
  const [selectedDistId, setSelectedDistId] = useState('')
  const [finalResults, setFinalResults] = useState([])
  const [students, setStudents] = useState([])
  const [acknowledging, setAcknowledging] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [dists, crs, depts, profile, finals, studs] = await Promise.all([
          getResultDistributions(),
          getCourses(),
          getDepartments(),
          getHodProfile(user?.id),
          getFinalResults(),
          getStudents()
        ])
        
        // Strict isolation: Receiving HOD only sees transmissions intended for their department
        const myDeptId = user?.department_id
        const filteredDists = myDeptId
          ? dists.filter(d => d.received_by_dept_id === myDeptId)
          : dists

        setDistributions(filteredDists)
        setCourses(crs)
        setDepartments(depts)
        setHodProfile(profile)
        setFinalResults(finals)
        setStudents(studs)

        // Preselect pending from query or first pending
        const params = new URLSearchParams(window.location.search)
        const urlDistId = params.get('distId')

        const pending = filteredDists.filter(d => d.status === 'sent')
        if (urlDistId && filteredDists.some(d => d.id === urlDistId)) {
          setSelectedDistId(urlDistId)
        } else if (pending.length > 0) {
          setSelectedDistId(pending[0].id)
        } else if (filteredDists.length > 0) {
          setSelectedDistId(filteredDists[0].id)
        } else {
          setSelectedDistId('')
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const selectedDist = distributions.find(d => d.id === selectedDistId)
  const selectedCourse = courses.find(c => c.id === selectedDist?.course_id)
  const senderDept = departments.find(d => d.id === selectedCourse?.department_id) || departments[0]
  const recipientDept = departments.find(d => d.id === selectedDist?.received_by_dept_id) || (user?.department_id ? departments.find(d => d.id === user.department_id) : departments[1])

  const isAlreadyAcknowledged = selectedDist?.status === 'acknowledged'

  const handleAcknowledge = async () => {
    if (!selectedDistId) return
    setAcknowledging(true)
    try {
      await acknowledgeDistribution(selectedDistId, user?.id)
      setStatusMessage({
        type: 'success',
        text: `Results for ${selectedCourse?.code} officially acknowledged with your digital signature. Timestamp logged.`
      })

      // Refresh
      const updated = await getResultDistributions()
      const myDeptId = user?.department_id
      setDistributions(myDeptId ? updated.filter(d => d.received_by_dept_id === myDeptId) : updated)
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error acknowledging distribution.' })
    } finally {
      setAcknowledging(false)
    }
  }

  // Strict isolation: Filter student scores belonging to this course AND strictly to this receiving department
  const targetDeptId = selectedDist?.received_by_dept_id || user?.department_id
  const courseStudents = finalResults.filter(r => {
    if (r.course_id !== selectedDist?.course_id) return false
    if (selectedDist?.session && r.session && r.session !== selectedDist.session) return false
    const s = students.find(stud => stud.id === r.student_id)
    return s && (!targetDeptId || s.department_id === targetDeptId)
  })

  return (
    <DashboardLayout title="Acknowledge Received Results" roleRequired="hod">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Select Pending Transmission */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Select Incoming Result Transmission
        </label>
        <select
          value={selectedDistId}
          onChange={(e) => setSelectedDistId(e.target.value)}
          className="w-full max-w-xl px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {distributions.map(d => {
            const crs = courses.find(c => c.id === d.course_id)
            const dept = departments.find(dept => dept.id === d.received_by_dept_id)
            return (
              <option key={d.id} value={d.id}>
                {crs?.code || 'Course'} - {crs?.title} (Dept: {dept?.code || 'EEE'}) - [{d.status.toUpperCase()}]
              </option>
            )
          })}
        </select>
      </div>

      {selectedDist ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Result Sheet Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Official Academic Transmission Sheet
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {selectedCourse?.code}: {selectedCourse?.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic Session {selectedDist.session} • {selectedDist.semester} Semester • {selectedCourse?.credit_units || 3} Credit Units
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isAlreadyAcknowledged ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {selectedDist.status}
              </span>
            </div>

            {/* Transmission Meta */}
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Originating Department:</span>
                <span className="font-bold text-slate-800 text-sm">{senderDept.name} ({senderDept.code})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Receiving Department:</span>
                <span className="font-bold text-slate-800 text-sm">{recipientDept.name} ({recipientDept.code})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Dispatch Timestamp:</span>
                <span className="font-semibold text-slate-700">{new Date(selectedDist.sent_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Enrolled Candidates:</span>
                <span className="font-semibold text-slate-700">{courseStudents.length} Students Examined ({recipientDept?.name || 'Department'})</span>
              </div>
            </div>

            {/* Scores Table */}
            <div className="p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>Candidate Score Breakdown ({recipientDept?.code || 'Dept'} Only)</span>
                <span className="text-[11px] font-normal text-slate-500">Only showing students from {recipientDept?.name}</span>
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Reg Number</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">CA (/30)</th>
                      <th className="py-2.5 px-3">Exam (/70)</th>
                      <th className="py-2.5 px-3">Total (/100)</th>
                      <th className="py-2.5 px-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courseStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          No students from {recipientDept?.name || 'your department'} took this course.
                        </td>
                      </tr>
                    ) : (
                      courseStudents.map((r, idx) => {
                        const stud = students.find(s => s.id === r.student_id)
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">{stud?.reg_number}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{stud?.full_name}</td>
                            <td className="py-2.5 px-3">{r.ca_score}</td>
                            <td className="py-2.5 px-3">{r.exam_score}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{r.total_score}</td>
                            <td className="py-2.5 px-3 font-bold">{r.grade}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Acknowledgement & Digital Sign Off Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Departmental Endorsement
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                By acknowledging this result sheet, the Receiving Head of Department confirms receipt of examination scores for students of their department.
              </p>

              {/* Digital Signature Render */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Official HOD Digital Signature
                </span>
                {hodProfile?.signature_url ? (
                  <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-inner flex flex-col items-center">
                    <img
                      src={hodProfile.signature_url}
                      alt="Digital Signature"
                      className="h-12 object-contain"
                    />
                    <span className="text-xs font-bold text-slate-800 mt-1">
                      {hodProfile.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {hodProfile.rank || 'Head of Department'}
                    </span>
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-xs text-amber-700 font-semibold mb-2">No signature saved yet.</p>
                    <a
                      href="/dashboard/hod/profile"
                      className="text-xs font-bold text-primary underline"
                    >
                      Draw signature in Profile
                    </a>
                  </div>
                )}
              </div>

              {isAlreadyAcknowledged && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Acknowledged on {new Date(selectedDist.acknowledged_at || Date.now()).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAcknowledge}
                disabled={acknowledging || isAlreadyAcknowledged}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {acknowledging
                  ? 'Verifying Signature...'
                  : isAlreadyAcknowledged
                  ? 'Transmission Acknowledged'
                  : 'Affix Signature & Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
          No result distributions found.
        </div>
      )}
    </DashboardLayout>
  )
}
