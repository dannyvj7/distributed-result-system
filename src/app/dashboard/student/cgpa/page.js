'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getStudents, getCourses, getFinalResults, getCgpaRecord } from '../../../../lib/db'
import { Award, BookOpen, CheckCircle, TrendingUp, HelpCircle } from 'lucide-react'

export default function StudentCgpaPage() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [cgpaRecord, setCgpaRecord] = useState(null)
  const [results, setResults] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [studs, crs, finals] = await Promise.all([
          getStudents(),
          getCourses(),
          getFinalResults()
        ])

        const activeStudent = studs.find(
          s => s.id === user?.id || s.reg_number === user?.reg_number || s.reg_number === '2022/234567'
        ) || studs[0]

        setStudent(activeStudent)
        setCourses(crs)

        if (activeStudent) {
          const rec = await getCgpaRecord(activeStudent.id)
          setCgpaRecord(rec)

          const studentResults = finals.filter(
            r => r.student_id === activeStudent.id && (r.status === 'approved' || r.status === 'distributed')
          )
          setResults(studentResults)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const cgpa = Number(cgpaRecord?.cgpa || 5.0).toFixed(2)
  const totalUnits = cgpaRecord?.total_credit_units || 3
  const totalQualityPoints = Number(cgpaRecord?.total_quality_points || 15.0).toFixed(1)
  const classification = cgpaRecord?.classification || 'First Class Honours'

  // Percentage for progress bar (max 5.0)
  const cgpaPercentage = Math.min(100, Math.round((Number(cgpa) / 5.0) * 100))

  return (
    <DashboardLayout title="CGPA & Degree Classification Standing" roleRequired="student">
      {/* CGPA Mega Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              National Universities Commission (NUC) Standard
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Academic Standing: {classification}
            </h1>
            <p className="mt-2 text-sm text-blue-100/90 max-w-xl leading-relaxed">
              Calculated based on cumulative course registrations and weighted quality points earned across accredited semesters.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center shrink-0 min-w-[220px]">
            <p className="text-xs text-blue-200 uppercase font-semibold">Official CGPA</p>
            <div className="text-5xl font-black text-white mt-1">
              {loading ? '...' : cgpa}
            </div>
            <p className="text-xs text-blue-200 mt-1">out of 5.00 Maximum</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-semibold text-blue-200 mb-1.5">
            <span>Progress along NUC 5.00 Scale</span>
            <span>{cgpaPercentage}% of Maximum Standing</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${cgpaPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Credit Units</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalUnits} Units Registered</h3>
          <p className="text-xs text-slate-500 mt-1">Total credit loading for program</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Quality Points</span>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">{totalQualityPoints} Points</h3>
          <p className="text-xs text-slate-500 mt-1">Sum of (Grade Point × Credit Units)</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Cumulative CGPA</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{cgpa}</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">{classification}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* NUC Degree Classification Reference */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            NUC Degree Classification Benchmarks
          </h3>
          <p className="text-xs text-slate-500 mb-4">Official Nigerian Tertiary Grading Scale</p>

          <div className="space-y-2.5">
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              Number(cgpa) >= 4.50 ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <span className="font-bold block">First Class Honours</span>
                <span className="text-[11px] opacity-80">Grade A (70% - 100%)</span>
              </div>
              <span className="font-mono font-bold text-sm">4.50 – 5.00</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              Number(cgpa) >= 3.50 && Number(cgpa) < 4.50 ? 'bg-blue-50 border-blue-300 font-bold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <span className="font-bold block">Second Class Honours (Upper Division)</span>
                <span className="text-[11px] opacity-80">Grade B (60% - 69%)</span>
              </div>
              <span className="font-mono font-bold text-sm">3.50 – 4.49</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              Number(cgpa) >= 2.40 && Number(cgpa) < 3.50 ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <span className="font-bold block">Second Class Honours (Lower Division)</span>
                <span className="text-[11px] opacity-80">Grade C (50% - 59%)</span>
              </div>
              <span className="font-mono font-bold text-sm">2.40 – 3.49</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              Number(cgpa) >= 1.50 && Number(cgpa) < 2.40 ? 'bg-amber-50 border-amber-300 font-bold text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <span className="font-bold block">Third Class Honours</span>
                <span className="text-[11px] opacity-80">Grade D (45% - 49%)</span>
              </div>
              <span className="font-mono font-bold text-sm">1.50 – 2.39</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              Number(cgpa) >= 1.00 && Number(cgpa) < 1.50 ? 'bg-orange-50 border-orange-300 font-bold text-orange-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <span className="font-bold block">Pass</span>
                <span className="text-[11px] opacity-80">Grade E (40% - 44%)</span>
              </div>
              <span className="font-mono font-bold text-sm">1.00 – 1.49</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              Number(cgpa) < 1.00 ? 'bg-red-50 border-red-300 font-bold text-red-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>
                <span className="font-bold block">Fail</span>
                <span className="text-[11px] opacity-80">Grade F (0% - 39%)</span>
              </div>
              <span className="font-mono font-bold text-sm">0.00 – 0.99</span>
            </div>
          </div>
        </div>

        {/* Quality Points Calculation Formula Explainer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              NUC CGPA Calculation Formula
            </h3>
            <p className="text-xs text-slate-500 mb-4">How your cumulative average is mathematically computed</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3 font-mono text-slate-700">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans font-bold uppercase">Step 1: Course Quality Points</span>
                <span className="text-slate-900 font-bold">Quality Points = Grade Point × Credit Units</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans font-bold uppercase">Step 2: Cumulative CGPA</span>
                <span className="text-slate-900 font-bold">CGPA = Total Quality Points / Total Credit Units</span>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
              <span className="font-bold block mb-1">Current Academic Computation:</span>
              <p className="font-medium text-sm mt-1">
                CGPA = {totalQualityPoints} Quality Points ÷ {totalUnits} Credit Units = <span className="font-extrabold text-primary">{cgpa}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
