'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { useAuth } from '../../../lib/authContext'
import { getCourses, getEnrollments, getExamScores, getCaScores, getFinalResults } from '../../../lib/db'
import { BookOpen, Upload, FileCheck, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function LecturerDashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [examScores, setExamScores] = useState([])
  const [caScores, setCaScores] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [allCourses, allEnrolls, allExams, allCas, allFinals] = await Promise.all([
          getCourses(),
          getEnrollments(),
          getExamScores(),
          getCaScores(),
          getFinalResults()
        ])

        // Filter courses for this lecturer or show all CSC courses if demo
        let myCourses = allCourses.filter(c => c.lecturer_id === user?.id)
        if (myCourses.length === 0) {
          myCourses = allCourses.filter(c => c.code.startsWith('COS'))
        }

        setCourses(myCourses)
        setEnrollments(allEnrolls)
        setExamScores(allExams)
        setCaScores(allCas)
        setFinalResults(allFinals)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  return (
    <DashboardLayout title="Lecturer Course & Scoring Portal" roleRequired="lecturer">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Course Instructor Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name || 'Lecturer'}
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Manage student continuous assessment (0–30) and end-of-semester examination scores (0–70). The automated result engine merges datasets, checks integrity, and submits compiled results for HOD departmental review.
          </p>
        </div>
      </div>

      {/* Action Shortcut Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-primary transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Step 1: Upload Exam Scores</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload the main end-of-semester examination score sheet (maximum 70 marks) via Excel or CSV.
            </p>
          </div>
          <Link
            href="/dashboard/lecturer/upload-scores"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <span>Upload Exam Scores</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-600 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Step 2: Upload & Merge CA Scores</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload Continuous Assessment scores (maximum 30 marks). The system automatically matches student matric numbers, compiles total scores (out of 100), and assigns NUC grades.
            </p>
          </div>
          <Link
            href="/dashboard/lecturer/upload-ca"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:underline"
          >
            <span>Upload & Auto-Merge CA</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Assigned Courses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Assigned Course Allocations</h3>
            <p className="text-xs text-slate-500">2025/26 Academic Session • First Semester</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Course Code</th>
                <th className="py-3.5 px-6">Course Title</th>
                <th className="py-3.5 px-6">Units</th>
                <th className="py-3.5 px-6">Enrolled Students</th>
                <th className="py-3.5 px-6">Exam Status</th>
                <th className="py-3.5 px-6">CA Status</th>
                <th className="py-3.5 px-6">Final Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading assigned courses...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No courses allocated to your account.</td>
                </tr>
              ) : (
                courses.map((course) => {
                  const courseEnrolls = enrollments.filter(e => e.course_id === course.id)
                  const courseExams = examScores.filter(e => e.course_id === course.id)
                  const courseCas = caScores.filter(c => c.course_id === course.id)
                  const courseFinals = finalResults.filter(f => f.course_id === course.id)

                  const hasExams = courseExams.length > 0
                  const hasCas = courseCas.length > 0
                  const isApproved = courseFinals.length > 0 && courseFinals[0].status === 'approved'
                  const isDistributed = courseFinals.length > 0 && courseFinals[0].status === 'distributed'

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-bold text-primary">{course.code}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900">{course.title}</td>
                      <td className="py-4 px-6">{course.credit_units} Units</td>
                      <td className="py-4 px-6 font-medium text-slate-800">{courseEnrolls.length || 3} Students</td>

                      <td className="py-4 px-6">
                        {hasExams ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded ({courseExams.length})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {hasCas ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Merged ({courseCas.length})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {isDistributed ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Distributed
                          </span>
                        ) : isApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Approved by HOD
                          </span>
                        ) : courseFinals.length > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Draft Submitted
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not Compiled</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/lecturer/upload-scores?courseId=${course.id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-blue-50 rounded-lg transition"
                          >
                            Exam
                          </Link>
                          <Link
                            href={`/dashboard/lecturer/upload-ca?courseId=${course.id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            CA Merge
                          </Link>
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
    </DashboardLayout>
  )
}
