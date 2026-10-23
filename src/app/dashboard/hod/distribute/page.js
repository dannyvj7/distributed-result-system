'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getCourses, getEnrollments, getStudents, getDepartments, getFinalResults, createResultDistribution, getResultDistributions, resetDemoWorkflow } from '../../../../lib/db'
import { Send, Building2, Users, CheckCircle, AlertCircle, ShieldCheck, CheckCircle2, RotateCcw, Inbox } from 'lucide-react'
import Link from 'next/link'

export default function HodDistributePage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [distributions, setDistributions] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [distributing, setDistributing] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    async function loadData() {
      const [crs, enrs, studs, depts, finals, dists] = await Promise.all([
        getCourses(),
        getEnrollments(),
        getStudents(),
        getDepartments(),
        getFinalResults(),
        getResultDistributions()
      ])

      const myCourses = crs.filter(c => c.department_id === user?.department_id || (!user?.department_id && c.code.startsWith('COS')))
      const displayCourses = myCourses.length > 0 ? myCourses : crs
      setCourses(displayCourses)
      setEnrollments(enrs)
      setStudents(studs)
      setDepartments(depts)
      setFinalResults(finals)
      setDistributions(dists)

      if (displayCourses.length > 0) {
        const params = new URLSearchParams(window.location.search)
        const urlCourseId = params.get('courseId')
        const initial = displayCourses.find(c => c.id === urlCourseId) || displayCourses[0]
        setSelectedCourseId(initial.id)
      }
    }
    loadData()
  }, [user])

  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  // Find all departments whose students took this course
  // We check enrollments or final results
  const courseEnrolledStudentIds = [
    ...new Set([
      ...enrollments.filter(e => e.course_id === selectedCourseId).map(e => e.student_id),
      ...finalResults.filter(f => f.course_id === selectedCourseId).map(f => f.student_id)
    ])
  ]

  const takingStudents = students.filter(s => courseEnrolledStudentIds.includes(s.id))

  // Group by department
  const takingDeptMap = {}
  takingStudents.forEach(s => {
    if (!takingDeptMap[s.department_id]) {
      takingDeptMap[s.department_id] = []
    }
    takingDeptMap[s.department_id].push(s)
  })

  const takingDepartmentIds = Object.keys(takingDeptMap)

  // Check if course is approved
  const isOfferingDept = user?.department_id === 'd1111111-1111-1111-1111-111111111111' || !user?.department_id
  const myDept = departments.find(d => d.id === user?.department_id)
  const courseFinals = finalResults.filter(f => f.course_id === selectedCourseId)
  const isApproved = courseFinals.length > 0 && courseFinals.some(r => r.status === 'approved' || r.status === 'distributed')

  const handleDistribute = async () => {
    if (!selectedCourseId || takingDepartmentIds.length === 0) return
    setDistributing(true)
    try {
      await createResultDistribution(
        selectedCourseId,
        selectedCourse?.session || '2025/26',
        selectedCourse?.semester || 'first',
        user?.id,
        takingDepartmentIds
      )

      setStatusMessage({
        type: 'success',
        text: `Results for ${selectedCourse?.code} successfully distributed to recipient departments AND automatically archived with the Central Examinations & Records Unit!`
      })

      // Reload distributions
      const updatedDists = await getResultDistributions()
      setDistributions(updatedDists)
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to dispatch results.' })
    } finally {
      setDistributing(false)
    }
  }

  const handleResetForDemo = async () => {
    if (!selectedCourse?.code) return
    const res = await resetDemoWorkflow(selectedCourse.code, 'hod')
    setStatusMessage({
      type: 'success',
      text: res.message || `${selectedCourse.code} reset for live distribution demo!`
    })
    const updatedDists = await getResultDistributions()
    const updatedFinals = await getFinalResults()
    setDistributions(updatedDists)
    setFinalResults(updatedFinals)
  }

  return (
    <DashboardLayout title="Inter-Departmental Result Distribution" roleRequired="hod">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {!isOfferingDept ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center max-w-xl mx-auto shadow-xs my-8">
          <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            Inter-Departmental Distribution Authority
          </h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            In our distributed model, course distribution is initiated exclusively by the teaching department that offers the course (Computer Science). As the Head of Department for <strong>{myDept?.name || 'Mathematics'}</strong>, your role is to review and acknowledge incoming service course rosters sent to your students.
          </p>
          <Link
            href="/dashboard/hod/acknowledge"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Go to Acknowledge Received Results &rarr;</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Course Selection */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Approved Course to Distribute
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetForDemo}
              title="Reset this course so you can demonstrate the live distribution step again"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset Demo State</span>
            </button>

            <button
              onClick={handleDistribute}
              disabled={distributing || !isApproved || takingDepartmentIds.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {distributing ? 'Dispatching...' : `Distribute to ${takingDepartmentIds.length} Department(s)`}
            </button>
          </div>
        </div>
      </div>

      {!isApproved && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Course Results Must Be Approved First</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The results for {selectedCourse?.code} are currently in draft. Please visit the "Results" tab to review and approve them before distributing.
            </p>
          </div>
        </div>
      )}

      {/* Taking Departments Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Enrolled Recipient Departments for {selectedCourse?.code}
          </h3>
          <p className="text-xs text-slate-500">
            Identified through course registration and student enrollment records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Faculty</th>
                <th className="py-3 px-5">Students Taking Course</th>
                <th className="py-3 px-5">Transmission Status</th>
                <th className="py-3 px-5 text-right">Acknowledgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {takingDepartmentIds.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No enrolled students from any department detected for this course.
                  </td>
                </tr>
              ) : (
                takingDepartmentIds.map((deptId) => {
                  const dept = departments.find(d => d.id === deptId)
                  const studentCount = takingDeptMap[deptId]?.length || 0

                  const existingDist = distributions.find(
                    d => d.course_id === selectedCourseId && d.received_by_dept_id === deptId
                  )

                  return (
                    <tr key={deptId} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>{dept ? `${dept.name} (${dept.code})` : 'Unknown Dept'}</span>
                      </td>
                      <td className="py-4 px-5 text-slate-600">{dept?.faculty}</td>
                      <td className="py-4 px-5 font-semibold text-slate-800">
                        {studentCount} Students
                      </td>
                      <td className="py-4 px-5">
                        {existingDist ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Ready for Dispatch
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {existingDist?.status === 'acknowledged' ? (
                          <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4" /> Acknowledged with Signature
                          </span>
                        ) : existingDist ? (
                          <span className="text-amber-600 font-medium text-xs">
                            Awaiting Recipient HOD Signature
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Not sent</span>
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
      </>
      )}
    </DashboardLayout>
  )
}
