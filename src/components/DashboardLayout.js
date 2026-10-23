'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  UserCheck,
  Upload,
  FileCheck,
  Send,
  Inbox,
  PenTool,
  FileSpreadsheet,
  AlertCircle,
  GraduationCap,
  Award,
  Printer,
  MessageSquarePlus,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  School
} from 'lucide-react'

export default function DashboardLayout({ children, title, roleRequired }) {
  const { user, loading, logout, switchPersona, loginStaff } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-bgLight flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Verifying institutional credentials...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Define role navigation links exactly as specified
  const navConfigs = {
    admin: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'Departments', href: '/dashboard/admin/departments', icon: Building2 },
      { label: 'Students', href: '/dashboard/admin/students', icon: Users },
      { label: 'Courses', href: '/dashboard/admin/courses', icon: BookOpen },
      { label: 'Users', href: '/dashboard/admin/users', icon: UserCheck }
    ],
    lecturer: [
      { label: 'Dashboard', href: '/dashboard/lecturer', icon: LayoutDashboard },
      { label: 'Upload Exam Scores', href: '/dashboard/lecturer/upload-scores', icon: Upload },
      { label: 'Upload CA Scores', href: '/dashboard/lecturer/upload-ca', icon: FileCheck }
    ],
    hod: [
      { label: 'Dashboard', href: '/dashboard/hod', icon: LayoutDashboard },
      { label: 'My Profile', href: '/dashboard/hod/profile', icon: PenTool },
      { label: 'Results', href: '/dashboard/hod/results', icon: BookOpen },
      { label: 'Distribute Results', href: '/dashboard/hod/distribute', icon: Send },
      { label: 'Received Results', href: '/dashboard/hod/received', icon: Inbox },
      { label: 'Acknowledge', href: '/dashboard/hod/acknowledge', icon: FileCheck }
    ],
    exam_officer: [
      { label: 'Dashboard', href: '/dashboard/exam-officer', icon: LayoutDashboard },
      { label: 'All Results', href: '/dashboard/exam-officer/results', icon: BookOpen },
      { label: 'Complaints', href: '/dashboard/exam-officer/complaints', icon: AlertCircle },
      { label: 'Broadsheet', href: '/dashboard/exam-officer/broadsheet', icon: FileSpreadsheet }
    ],
    student: [
      { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
      { label: 'My Results', href: '/dashboard/student/results', icon: BookOpen },
      { label: 'My CGPA', href: '/dashboard/student/cgpa', icon: Award },
      { label: 'Print Result', href: '/dashboard/student/print', icon: Printer },
      { label: 'Submit Complaint', href: '/dashboard/student/complaint', icon: MessageSquarePlus }
    ]
  }

  const currentRole = user?.role || 'admin'
  const navItems = navConfigs[currentRole] || []

  const roleLabels = {
    admin: 'System Administrator',
    lecturer: 'Academic Lecturer',
    hod: 'Head of Department (HOD)',
    exam_officer: 'Institutional Exam Officer',
    student: 'Undergraduate Student'
  }

  const rolePillColors = {
    admin: 'bg-red-500/20 text-red-200 border-red-400/40',
    lecturer: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    hod: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    exam_officer: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    student: 'bg-blue-500/20 text-blue-200 border-blue-400/40'
  }

  return (
    <div className="min-h-screen bg-bgLight flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* FIXED LEFT SIDEBAR (Navy Blue #1E3A8A) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1E3A8A] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-xl border-r border-blue-900/50`}
      >
        {/* Brand / Crest Header */}
        <div className="p-5 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700/80 flex items-center justify-center border border-blue-400/30 shadow-inner">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-snug">
                DSRMS Portal
              </h1>
              <p className="text-xs text-blue-200/80 font-normal">
                Nigerian Tertiary Institution
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-blue-200 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Mini Card */}
        <div className="mx-4 my-4 p-3 rounded-lg bg-blue-950/60 border border-blue-800/60">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${rolePillColors[currentRole]}`}>
              {currentRole.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Academic User'}</p>
          <p className="text-xs text-blue-200/70 truncate">{user?.reg_number || user?.email}</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1 text-[11px] font-semibold text-blue-300/70 uppercase tracking-wider">
            Menu Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/40 translate-x-1'
                    : 'text-blue-100/90 hover:bg-blue-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-300'}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </Link>
            )
          })}
        </nav>

        {/* Quick Persona Switcher for effortless testing */}
        <div className="p-3 border-t border-blue-900/60 bg-blue-950/30">
          <p className="text-[10px] uppercase font-bold tracking-wider text-blue-300/80 mb-2 px-1">
            Switch Role Persona (Testing)
          </p>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchPersona('admin')}
              className={`text-[11px] py-1 px-1.5 rounded text-center transition ${currentRole === 'admin' ? 'bg-blue-500 font-bold text-white' : 'bg-blue-900/50 hover:bg-blue-800 text-blue-200'}`}
            >
              Admin
            </button>
            <button
              onClick={() => switchPersona('lecturer')}
              className={`text-[11px] py-1 px-1.5 rounded text-center transition ${currentRole === 'lecturer' ? 'bg-blue-500 font-bold text-white' : 'bg-blue-900/50 hover:bg-blue-800 text-blue-200'}`}
            >
              Lecturer
            </button>
            <button
              onClick={() => switchPersona('hod')}
              className={`text-[11px] py-1 px-1.5 rounded text-center transition ${currentRole === 'hod' ? 'bg-blue-500 font-bold text-white' : 'bg-blue-900/50 hover:bg-blue-800 text-blue-200'}`}
            >
              HOD
            </button>
            <button
              onClick={() => switchPersona('exam_officer')}
              className={`text-[11px] py-1 px-1.5 rounded text-center transition ${currentRole === 'exam_officer' ? 'bg-blue-500 font-bold text-white' : 'bg-blue-900/50 hover:bg-blue-800 text-blue-200'}`}
            >
              Exam Off.
            </button>
            <button
              onClick={() => switchPersona('student')}
              className={`text-[11px] py-1 px-1.5 rounded text-center transition ${currentRole === 'student' ? 'bg-blue-500 font-bold text-white' : 'bg-blue-900/50 hover:bg-blue-800 text-blue-200'}`}
            >
              Student
            </button>
          </div>

          {currentRole === 'lecturer' && (
            <div className="mt-2.5 pt-2 border-t border-blue-900/40">
              <span className="text-[9px] uppercase font-bold text-blue-300 block mb-1">
                Allocated Lecturer:
              </span>
              <select
                value={user?.email}
                onChange={async (e) => {
                  await loginStaff(e.target.value, 'password123')
                  window.location.reload()
                }}
                className="w-full text-[11px] bg-blue-900 text-white rounded px-1.5 py-1 border border-blue-700 focus:outline-none"
              >
                <option value="lecturer.csc@institution.edu.ng">Dr. Aminu Ibrahim (COS 101)</option>
                <option value="lecturer.eze@institution.edu.ng">Dr. Ngozi Eze (COS 201)</option>
                <option value="lecturer.fashola@institution.edu.ng">Dr. Babatunde Fashola (COS 202)</option>
                <option value="lecturer.ugwu@institution.edu.ng">Dr. Ifeanyi Ugwu (COS 343)</option>
                <option value="lecturer.akpan@institution.edu.ng">Prof. Chukwuma Akpan (COS 414)</option>
              </select>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-blue-900/60">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-200 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {title || 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Academic Session: <span className="font-semibold text-primary">2025/26</span> • First Semester
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900">{user?.full_name}</span>
              <span className="text-xs text-slate-500">{roleLabels[currentRole]}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-xs">
              {(user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="py-4 px-8 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
          Distributed Student Result Management System • Nigerian NUC 5-Point Scale Compliant
        </footer>
      </div>
    </div>
  )
}
