'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { getDepartments, getStudents, getCourses, getUsers, getResultDistributions } from '../../../lib/db'
import {
  Users,
  BookOpen,
  Building2,
  UserCheck,
  Send,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    departments: 0,
    students: 0,
    courses: 0,
    users: 0,
    distributions: 0
  })
  const [recentCourses, setRecentCourses] = useState([])
  const [departmentsList, setDepartmentsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [depts, studs, crs, usrs, dists] = await Promise.all([
          getDepartments(),
          getStudents(),
          getCourses(),
          getUsers(),
          getResultDistributions()
        ])
        setStats({
          departments: depts.length,
          students: studs.length,
          courses: crs.length,
          users: usrs.length,
          distributions: dists.length
        })
        setRecentCourses(crs.slice(0, 5))
        setDepartmentsList(depts)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <DashboardLayout title="Institutional Administration Overview" roleRequired="admin">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Central ICT & Academic Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Management System
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Manage academic departments, faculty rosters, course allocations, and user privileges. Track distributed results across all degree programs and faculties.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.students}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Registered undergraduates</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accredited Courses</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.courses}</h3>
            <span className="text-[11px] text-blue-600 font-medium">Current session offerings</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.departments}</h3>
            <span className="text-[11px] text-purple-600 font-medium">Across active faculties</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff & Officers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.users}</h3>
            <span className="text-[11px] text-amber-600 font-medium">HODs, Lecturers, Officers</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-8">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/admin/students"
            className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-blue-50/50 transition group flex flex-col justify-between"
          >
            <div>
              <Users className="w-6 h-6 text-primary mb-2" />
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition">Bulk Student Import</h4>
              <p className="text-xs text-slate-500 mt-1">Upload Excel/CSV roster of newly admitted or enrolled students.</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
              Import Students <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/dashboard/admin/courses"
            className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-blue-50/50 transition group flex flex-col justify-between"
          >
            <div>
              <BookOpen className="w-6 h-6 text-indigo-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">Course Allocation</h4>
              <p className="text-xs text-slate-500 mt-1">Create courses, assign lecturers, and configure credit units.</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-indigo-600 flex items-center gap-1">
              Manage Courses <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/dashboard/admin/departments"
            className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-blue-50/50 transition group flex flex-col justify-between"
          >
            <div>
              <Building2 className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition">Departments</h4>
              <p className="text-xs text-slate-500 mt-1">Register new degree departments and faculties.</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-purple-600 flex items-center gap-1">
              View Departments <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/dashboard/admin/users"
            className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-blue-50/50 transition group flex flex-col justify-between"
          >
            <div>
              <UserCheck className="w-6 h-6 text-amber-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">Staff User Accounts</h4>
              <p className="text-xs text-slate-500 mt-1">Provision HOD, Lecturer, and Exam Officer credentials.</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-amber-600 flex items-center gap-1">
              Manage Staff <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* Overview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Current Academic Course Directory</h3>
            <p className="text-xs text-slate-500">First Semester courses registered in the system</p>
          </div>
          <Link
            href="/dashboard/admin/courses"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View All Courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Course Code</th>
                <th className="py-3 px-5">Course Title</th>
                <th className="py-3 px-5">Units</th>
                <th className="py-3 px-5">Semester</th>
                <th className="py-3 px-5">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCourses.map((c) => {
                const dept = departmentsList.find(d => d.id === c.department_id)
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5 font-bold text-primary">{c.code}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-900">{c.title}</td>
                    <td className="py-3.5 px-5">{c.credit_units} Units</td>
                    <td className="py-3.5 px-5 capitalize">{c.semester} Semester</td>
                    <td className="py-3.5 px-5">{dept?.name || 'General Faculty'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
