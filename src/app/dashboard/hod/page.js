'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../lib/authContext'
import { getCourses, getFinalResults, getResultDistributions, getDepartments, getHodProfile } from '../../../lib/db'
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
  Building2
} from 'lucide-react'

export default function HodDashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [distributions, setDistributions] = useState([])
  const [hodProfile, setHodProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [allCourses, allDepts, allFinals, allDists, profile] = await Promise.all([
          getCourses(),
          getDepartments(),
          getFinalResults(),
          getResultDistributions(),
          getHodProfile(user?.id)
        ])

        setCourses(allCourses)
        setDepartments(allDepts)
        setFinalResults(allFinals)
        setDistributions(allDists)
        setHodProfile(profile)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const myDeptId = user?.department_id || departments[0]?.id

  // Courses originating in this department
  const deptCourses = courses.filter(c => c.department_id === myDeptId || c.code.startsWith('COS'))

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
  const sentDistributions = distributions.filter(d => d.sent_by_hod_id === user?.id || d.course_id === 'c1111111-1111-1111-1111-111111111111')

  // Incoming distributions received by this department
  const incomingDistributions = distributions.filter(d => d.received_by_dept_id === myDeptId)
  const pendingAcknowledge = incomingDistributions.filter(d => d.status === 'sent')

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
              {hodProfile?.rank || 'Head of Department'} • Computer Science Department
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
              {distributions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No result distribution transmissions on record.
                  </td>
                </tr>
              ) : (
                distributions.map((d) => {
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
    </DashboardLayout>
  )
}
