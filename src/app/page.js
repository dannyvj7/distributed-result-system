'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'
import { resetDemoWorkflow } from '../lib/db'
import { School, ShieldCheck, ArrowRight, UserCheck, AlertCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react'

export default function StaffLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDemoAccounts, setShowDemoAccounts] = useState(false)
  const [autofillNotice, setAutofillNotice] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetStatus, setResetStatus] = useState(null)
  const { loginStaff } = useAuth()
  const router = useRouter()

  // Secret keyboard shortcut: Press Ctrl+D or Alt+D to toggle demo drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.altKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        setShowDemoAccounts(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleResetDemo = async (stage) => {
    setResetting(true)
    setResetStatus(null)
    try {
      const res = await resetDemoWorkflow('COS 101', stage)
      setResetStatus(stage === 'hod' ? 'COS 101 ready for HOD distribution!' : 'COS 101 ready for Lecturer upload!')
      setTimeout(() => setResetStatus(null), 5000)
    } catch (err) {
      setResetStatus('Failed to reset demo.')
      setTimeout(() => setResetStatus(null), 4000)
    } finally {
      setResetting(false)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginStaff(email, password)
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAutofill = (staffEmail, label, autoSubmit = false) => {
    setEmail(staffEmail)
    setPassword('password123')
    setError('')
    setAutofillNotice(`Loaded credentials for: ${label}`)
    
    if (autoSubmit) {
      setSubmitting(true)
      loginStaff(staffEmail, 'password123').catch(err => {
        setError(err.message || 'Login failed')
        setSubmitting(false)
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#1D4ED8] flex items-center justify-center shadow-lg shadow-blue-500/30">
          <School className="w-9 h-9 text-white" />
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Staff Academic Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Distributed Student Result Management System (DSRMS)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {autofillNotice && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{autofillNotice}</span>
              </div>
              <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded font-bold">Auto-filled</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. lecturer.csc@institution.edu.ng"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-[#1D4ED8] hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? 'Authenticating...' : 'Sign In as Academic Staff'}
            </button>
          </form>

          {/* Defense Evaluation Drawer (Collapsible) */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Defense Demonstration Accounts (Auto-fill)</span>
              </span>
              {showDemoAccounts ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                {/* Central Admins */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Central Institutional Administration
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAutofill('admin@institution.edu.ng', 'ICT Administrator')}
                      className="p-2 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">ICT Admin</span>
                      <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">Fill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutofill('exam.officer@institution.edu.ng', 'Central Exam Officer')}
                      className="p-2 bg-white border border-slate-200 hover:border-purple-400 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">Exam Officer</span>
                      <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">Fill</span>
                    </button>
                  </div>
                </div>

                {/* Course Lecturers */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Allocated Course Lecturers (COS 101 – COS 414)
                  </p>
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAutofill('lecturer.csc@institution.edu.ng', 'Dr. Aminu Ibrahim (COS 101)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">Dr. Aminu Ibrahim</span>
                        <span className="text-[10px] text-slate-500">COS 101 • 1st Sem • 100L</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">Auto-fill</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('lecturer.eze@institution.edu.ng', 'Dr. Ngozi Eze (COS 201)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:border-sky-400 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">Dr. Ngozi Eze</span>
                        <span className="text-[10px] text-slate-500">COS 201 • 1st Sem • 200L</span>
                      </div>
                      <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-bold">Auto-fill</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('lecturer.fashola@institution.edu.ng', 'Dr. Babatunde Fashola (COS 202)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:border-purple-400 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">Dr. Babatunde Fashola</span>
                        <span className="text-[10px] text-slate-500">COS 202 • 2nd Sem • 200L</span>
                      </div>
                      <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold">Auto-fill</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('lecturer.ugwu@institution.edu.ng', 'Dr. Ifeanyi Ugwu (COS 303 / COS 343)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:border-amber-400 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">Dr. Ifeanyi Ugwu</span>
                        <span className="text-[10px] text-slate-500">COS 303 & COS 343 • 1st Sem • 300L</span>
                      </div>
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">Auto-fill</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('lecturer.akpan@institution.edu.ng', 'Prof. Chukwuma Akpan (COS 414)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">Prof. Chukwuma Akpan</span>
                        <span className="text-[10px] text-slate-500">COS 414 • 2nd Sem • 400L</span>
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-bold">Auto-fill</span>
                    </button>
                  </div>
                </div>

                {/* Departmental HODs */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Departmental Heads (HODs)
                  </p>
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAutofill('hod.csc@institution.edu.ng', 'Dr. (Mrs.) Ifeoma Nwokoye (Computer Science HOD)')}
                      className="w-full p-2 bg-white border border-blue-200 hover:bg-blue-50/50 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-900">1. Computer Science HOD (Dr. Ifeoma Nwokoye)</span>
                      <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">Sender</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('hod.mth@institution.edu.ng', 'Dr. C. Okeke (Mathematics HOD)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">2. Mathematics HOD (Dr. C. Okeke)</span>
                      <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">Receiver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('hod.vte@institution.edu.ng', 'Prof. A. O. Eze (VTE HOD)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">3. VTE HOD (Prof. A. O. Eze)</span>
                      <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">Receiver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('hod.crb@institution.edu.ng', 'Dr. G. Danjuma (Robotics HOD)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">4. Robotics HOD (Dr. G. Danjuma)</span>
                      <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">Receiver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutofill('hod.sta@institution.edu.ng', 'Prof. K. C. Ugwu (Statistics HOD)')}
                      className="w-full p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-left transition flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">5. Statistics HOD (Prof. K. C. Ugwu)</span>
                      <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">Receiver</span>
                    </button>
                  </div>
                </div>

                {/* Live Demo Workflow Reset Controls */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>Live Demo Reset Controls (COS 101)</span>
                    </span>
                    {resetStatus && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {resetStatus}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleResetDemo('hod')}
                      disabled={resetting}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-left transition flex flex-col justify-between"
                    >
                      <span className="font-bold text-emerald-900 block text-[11px]">
                        {resetting ? 'Resetting...' : '1. Reset for HOD Demo'}
                      </span>
                      <span className="text-[9px] text-emerald-700">Ready to Distribute live</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetDemo('lecturer')}
                      disabled={resetting}
                      className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-left transition flex flex-col justify-between"
                    >
                      <span className="font-bold text-amber-900 block text-[11px]">
                        {resetting ? 'Resetting...' : '2. Reset for Lecturer'}
                      </span>
                      <span className="text-[9px] text-amber-700">Ready to Upload CA live</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 italic">
                    Tip: Press <kbd className="font-mono bg-slate-200 px-1 rounded text-slate-700">Ctrl+D</kbd> anywhere to hide or show this drawer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Student Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-2">Are you a student checking your results?</p>
            <Link
              href="/student-login"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1D4ED8] hover:text-blue-800 transition"
            >
              <span>Go to Student Result Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
