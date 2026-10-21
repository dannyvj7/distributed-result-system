'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'
import { School, ShieldCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react'

export default function StaffLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { loginStaff, switchPersona } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
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

  const handleQuickLogin = async (role) => {
    setError('')
    setSubmitting(true)
    try {
      await switchPersona(role)
    } catch (err) {
      setError(err.message || 'Quick login failed')
    } finally {
      setSubmitting(false)
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

          {/* Quick Demo Login Picker */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Demo Test Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 text-left transition flex items-center justify-between"
              >
                <span>ICT Admin</span>
                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('lecturer')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 text-left transition flex items-center justify-between"
              >
                <span>CSC Lecturer</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Lecturer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hod')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 text-left transition flex items-center justify-between"
              >
                <span>CSC HOD</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">HOD</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('exam_officer')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 font-medium text-slate-700 text-left transition flex items-center justify-between"
              >
                <span>Exam Officer</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Officer</span>
              </button>
            </div>
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
