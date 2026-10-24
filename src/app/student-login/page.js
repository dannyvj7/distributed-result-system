'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import { GraduationCap, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'

export default function StudentLoginPage() {
  const [regNumber, setRegNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { loginStudent } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginStudent(regNumber, password)
    } catch (err) {
      setError(err.message || 'Student login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemoStudent = (reg = '2022/234567') => {
    setRegNumber(reg)
    setPassword('student123')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Student Result Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Access Semester Results, CGPA Records, and Broadsheet Verification
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
                Matriculation / Registration Number
              </label>
              <input
                type="text"
                required
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. 2022/234567"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm uppercase transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Format: INSTITUTION/DEPT/YEAR/REG</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? 'Verifying Student...' : 'Access My Results'}
            </button>
          </form>

          {/* Quick Demo Student Autofill */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Demo Student Logins
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillDemoStudent('2022/234567')}
                className="w-full py-2 px-3 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center justify-between"
              >
                <span>Chukwuebuka Obi (400L)</span>
                <span className="font-mono text-[11px] text-emerald-700">2022/234567</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('2024/200001')}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center justify-between"
              >
                <span>Ikenna Okafor (200L)</span>
                <span className="font-mono text-[11px] text-slate-600">2024/200001</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('2025/100001')}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center justify-between"
              >
                <span>Adaeze Nwosu (100L)</span>
                <span className="font-mono text-[11px] text-slate-600">2025/100001</span>
              </button>
            </div>
          </div>

          {/* Back to Staff Login */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Staff / Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
