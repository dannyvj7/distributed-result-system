'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { getResultDistributions, getComplaints, getCourses, getDepartments, getStudents } from '../../../lib/db'
import {
  FileSpreadsheet,
  AlertCircle,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react'

export default function ExamOfficerDashboardPage() {
  const [distributions, setDistributions] = useState([])
  const [complaints, setComplaints] = useState([])
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [dists, cmps, crs, depts, studs] = await Promise.all([
          getResultDistributions(),
          getComplaints(),
          getCourses(),
          getDepartments(),
          getStudents()
        ])
        setDistributions(dists)
        setComplaints(cmps)
        setCourses(crs)
        setDepartments(depts)
        setStudents(studs)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const pendingComplaints = complaints.filter(c => c.status === 'pending')
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved')

  return (
    <DashboardLayout title="Institutional Examination Office" roleRequired="exam_officer">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Central Senate Examination Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Exam Officer Desk
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Oversee inter-departmental result distributions, adjudicate student score complaints, and compile university-wide consolidated broadsheets for Senate approval.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Distributed Results</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : distributions.length}</h3>
            <span className="text-[11px] text-primary font-medium">Inter-dept transmissions</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Complaints</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{loading ? '...' : pendingComplaints.length}</h3>
            <span className="text-[11px] text-red-600 font-medium">Requires investigation</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Complaints</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '...' : resolvedComplaints.length}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Addressed & answered</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">{loading ? '...' : students.length}</h3>
            <span className="text-[11px] text-purple-600 font-medium">Across all departments</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Shortcut Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link
          href="/dashboard/exam-officer/results"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-primary shadow-xs transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-primary transition">
            View All Distributed Results
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Institutional overview of all dispatched and acknowledged departmental result transmissions.
          </p>
          <span className="mt-4 text-xs font-semibold text-primary flex items-center gap-1">
            Access Results Directory <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/exam-officer/complaints"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-red-600 shadow-xs transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition">
            Student Result Complaints Desk
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Review student-submitted score disputes, liaise with course lecturers, and submit official responses.
          </p>
          <span className="mt-4 text-xs font-semibold text-red-600 flex items-center gap-1">
            Manage Complaints <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/exam-officer/broadsheet"
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-600 shadow-xs transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition">
            Senate Broadsheet Compilation
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Compile consolidated departmental broadsheets with GPAs, CGPAs, and generate official printable PDFs.
          </p>
          <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            Generate Broadsheets <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Recent Student Complaints Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Student Score Inquiries</h3>
            <p className="text-xs text-slate-500">Requires review and response from the Examination Office</p>
          </div>
          <Link
            href="/dashboard/exam-officer/complaints"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View All Complaints <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Reg Number</th>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Course</th>
                <th className="py-3 px-5">Complaint Summary</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No active student complaints filed.
                  </td>
                </tr>
              ) : (
                complaints.slice(0, 5).map((cmp) => {
                  const stud = students.find(s => s.id === cmp.student_id)
                  const course = courses.find(c => c.id === cmp.course_id)
                  const isPending = cmp.status === 'pending'

                  return (
                    <tr key={cmp.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-primary">{stud?.reg_number}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{stud?.full_name}</td>
                      <td className="py-3.5 px-5 font-medium text-slate-800">{course?.code || 'Course'}</td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 max-w-xs truncate">{cmp.complaint_text}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isPending ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {cmp.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href="/dashboard/exam-officer/complaints"
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          {isPending ? 'Respond' : 'View'}
                        </Link>
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
