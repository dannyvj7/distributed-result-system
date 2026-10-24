'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getCourses, getStudents, getExamScores, getCaScores, saveCaScores, saveFinalResults, getFinalResults } from '../../../../lib/db'
import { calculateGrade, normalizeRegNumber } from '../../../../lib/grading'
import {
  FileCheck,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Calculator
} from 'lucide-react'

export default function UploadCaScoresPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [courseExamScores, setCourseExamScores] = useState([])
  const [existingFinalResults, setExistingFinalResults] = useState([])
  const [existingCaScores, setExistingCaScores] = useState([])

  // CA Parsing & Merging states
  const [fileName, setFileName] = useState('')
  const [matchedResults, setMatchedResults] = useState([])
  const [unmatchedRows, setUnmatchedRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'records'

  useEffect(() => {
    async function loadData() {
      try {
        const [allCrs, studs] = await Promise.all([getCourses(), getStudents()])
        
        // Strictly filter to courses allocated to this logged-in lecturer
        let myCourses = allCrs.filter(c => 
          c.lecturer_id === user?.id ||
          (user?.email === 'lecturer.csc@institution.edu.ng' && c.code === 'COS 101') ||
          (user?.email === 'lecturer.eze@institution.edu.ng' && c.code === 'COS 201') ||
          (user?.email === 'lecturer.fashola@institution.edu.ng' && c.code === 'COS 202') ||
          (user?.email === 'lecturer.ugwu@institution.edu.ng' && (c.code === 'COS 343' || c.code === 'COS 303')) ||
          (user?.email === 'lecturer.akpan@institution.edu.ng' && c.code === 'COS 414')
        )
        if (myCourses.length === 0 && user?.role === 'lecturer') {
          myCourses = allCrs.slice(0, 1) // Safe fallback
        }

        setCourses(myCourses)
        setStudents(studs)
        if (myCourses.length > 0) {
          const params = new URLSearchParams(window.location.search)
          const urlCourseId = params.get('courseId')
          const initialCourse = myCourses.find(c => c.id === urlCourseId) || myCourses[0]
          setSelectedCourseId(initialCourse.id)
          loadCourseScores(initialCourse.id)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const loadCourseScores = async (courseId) => {
    const [exams, finals, cas] = await Promise.all([
      getExamScores(courseId),
      getFinalResults(courseId),
      getCaScores(courseId)
    ])
    setCourseExamScores(exams)
    setExistingFinalResults(finals)
    setExistingCaScores(cas)
  }

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId)
    setMatchedResults([])
    setUnmatchedRows([])
    setFileName('')
    loadCourseScores(courseId)
  }

  // CORE CA SCORE MERGING LOGIC
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rawJson = XLSX.utils.sheet_to_json(ws)

        const matched = []
        const unmatched = []

        rawJson.forEach((row) => {
          const rawReg = row.reg_number || row.RegNumber || row['Reg Number'] || row.matric || row.matric_number || row['Matric Number'] || row.reg_no || ''
          const rawCa = row.ca_score || row.CaScore || row['CA Score'] || row.ca || row.score || 0
          const normalizedReg = normalizeRegNumber(rawReg)

          if (!normalizedReg) return

          // 1. Locate student in registry
          const studentObj = students.find(s => normalizeRegNumber(s.reg_number) === normalizedReg)
          const numCa = Number(rawCa)
          const isValidCa = !isNaN(numCa) && numCa >= 0 && numCa <= 30

          if (!studentObj) {
            unmatched.push({
              reg_number: normalizedReg,
              student_name: 'Unknown Student',
              ca_score: isValidCa ? numCa : rawCa,
              reason: 'Registration number not found in student registry'
            })
            return
          }

          if (!isValidCa) {
            unmatched.push({
              reg_number: normalizedReg,
              student_name: studentObj.full_name,
              ca_score: rawCa,
              reason: 'CA score must be between 0 and 30 marks'
            })
            return
          }

          // 2. Check for existing Exam Score for this course
          const examRecord = courseExamScores.find(es => es.student_id === studentObj.id)

          if (examRecord) {
            const examScore = Number(examRecord.exam_score) || 0
            const totalScore = numCa + examScore
            const { grade, gradePoint, description } = calculateGrade(totalScore)

            matched.push({
              student_id: studentObj.id,
              reg_number: studentObj.reg_number,
              student_name: studentObj.full_name,
              ca_score: numCa,
              exam_score: examScore,
              total_score: totalScore,
              grade,
              grade_point: gradePoint,
              grade_description: description,
              hasExam: true
            })
          } else {
            // Exam not uploaded yet - still accept and record CA score!
            matched.push({
              student_id: studentObj.id,
              reg_number: studentObj.reg_number,
              student_name: studentObj.full_name,
              ca_score: numCa,
              exam_score: 0,
              total_score: null,
              grade: '-',
              grade_point: 0,
              grade_description: 'CA Saved (Exam Pending)',
              hasExam: false
            })
          }
        })

        setMatchedResults(matched)
        setUnmatchedRows(unmatched)
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Error parsing CA Excel sheet. Ensure headers are reg_number and ca_score.' })
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleConfirmAndSave = async () => {
    if (!selectedCourseId || matchedResults.length === 0) return
    setSaving(true)
    try {
      // 1. Save all valid CA scores
      const caPayload = matchedResults.map(r => ({
        student_id: r.student_id,
        course_id: selectedCourseId,
        ca_score: r.ca_score,
        session: '2025/26'
      }))
      await saveCaScores(caPayload)

      // 2. For students with exam scores already on record, compile Final Results (Status: 'draft')
      const mergedToSave = matchedResults.filter(r => r.hasExam).map(r => ({
        student_id: r.student_id,
        course_id: selectedCourseId,
        ca_score: r.ca_score,
        exam_score: r.exam_score,
        total_score: r.total_score,
        grade: r.grade,
        grade_point: r.grade_point,
        status: 'draft',
        session: '2025/26'
      }))

      if (mergedToSave.length > 0) {
        await saveFinalResults(mergedToSave)
      }

      const mergedCount = mergedToSave.length
      const pendingCount = matchedResults.length - mergedCount

      let msg = `Success! ${matchedResults.length} CA score(s) saved.`
      if (mergedCount > 0 && pendingCount === 0) {
        msg = `Success! ${matchedResults.length} CA scores saved and auto-merged into final draft results for HOD approval.`
      } else if (mergedCount > 0 && pendingCount > 0) {
        msg = `Success! ${matchedResults.length} CA scores saved (${mergedCount} merged into final results, ${pendingCount} pending exam upload).`
      } else {
        msg = `Success! ${matchedResults.length} CA scores recorded. Upload exam scores to automatically merge them into final grades.`
      }

      setStatusMessage({ type: 'success', text: msg })
      loadCourseScores(selectedCourseId)
      setMatchedResults([])
      setUnmatchedRows([])
      setFileName('')
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to commit CA scores.' })
    } finally {
      setSaving(false)
    }
  }

  const downloadSampleTemplate = () => {
    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    const courseCode = selectedCourse?.code || ''
    const courseLevel = courseCode.includes('101') ? 100
      : (courseCode.includes('201') || courseCode.includes('202')) ? 200
      : courseCode.includes('343') ? 300
      : courseCode.includes('414') ? 400
      : null

    const levelStudents = students.filter(s => courseLevel ? Number(s.level) === courseLevel : true)
    const sample = (levelStudents.length > 0 ? levelStudents : students.slice(0, 5)).map((s, idx) => ({
      reg_number: s.reg_number,
      student_name: s.full_name,
      ca_score: 18 + ((idx * 3) % 11) // 18 to 28 out of 30
    }))
    const ws = XLSX.utils.json_to_sheet(sample)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'CA_Scores')
    XLSX.writeFile(wb, `${selectedCourse?.code || 'Course'}_CA_template_max30.xlsx`)
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  return (
    <DashboardLayout title="Upload & Auto-Merge CA Scores (Max 30)" roleRequired="lecturer">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.type === 'success' && (
            <a
              href="/dashboard/lecturer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shrink-0 transition"
            >
              Sign & Submit to HOD →
            </a>
          )}
        </div>
      )}

      {/* Course Selection & Instructions */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Course for CA Merging
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.title} ({c.credit_units || 3} Units • {c.semester === 'second' ? '2nd' : '1st'} Sem)</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-500 block">Exam Scores Available</span>
              <span className="text-sm font-bold text-slate-900">{courseExamScores.length} students on file</span>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" />
              Download CA Template (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Clean Mode Switcher Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload CA Scores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'records'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>View Saved Records ({existingFinalResults.length || existingCaScores.length})</span>
        </button>
      </div>

      {activeTab === 'upload' && (
        <>
          {(existingFinalResults.length > 0 || existingCaScores.length > 0) && matchedResults.length === 0 && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>
                  <strong>Database Note:</strong> {existingFinalResults.length > 0 ? `${existingFinalResults.length} final results` : `${existingCaScores.length} CA scores`} already recorded on file for {selectedCourse?.code}. Uploading new CA will update them.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('records')}
                className="text-emerald-700 hover:underline font-bold shrink-0 ml-4"
              >
                View Current Records →
              </button>
            </div>
          )}

          {/* CA Upload Box */}
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xs mb-6 text-center">
        <div className="max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Upload Continuous Assessment Sheet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Columns: <span className="font-mono font-semibold text-slate-700">reg_number</span>, <span className="font-mono font-semibold text-slate-700">ca_score</span> (0–30 marks). The engine matches matric numbers and auto-computes grades.
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-emerald-600/20 transition">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Select CA Excel or CSV File</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {fileName && (
            <p className="mt-3 text-xs font-semibold text-emerald-600">
              Uploaded: {fileName}
            </p>
          )}
        </div>
      </div>

      {/* Merging Diagnostic Counters */}
      {(matchedResults.length > 0 || unmatchedRows.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Successfully Matched</span>
              <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">{matchedResults.length} Students</h4>
              <p className="text-xs text-emerald-600 mt-0.5">CA + Exam combined with NUC grade computed</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className={`border rounded-xl p-5 flex items-center justify-between ${
            unmatchedRows.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Unmatched Records</span>
              <h4 className="text-2xl font-extrabold text-amber-900 mt-1">{unmatchedRows.length} Records</h4>
              <p className="text-xs text-amber-600 mt-0.5">Missing exam score or invalid matriculation number</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Unmatched Records Alert & Table */}
      {unmatchedRows.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Unmatched Records in CA Upload (Will not be saved)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-amber-900">
              <thead>
                <tr className="border-b border-amber-200 font-semibold">
                  <th className="py-2 px-3">Reg Number</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">CA Score</th>
                  <th className="py-2 px-3">Reason Unmatched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {unmatchedRows.map((u, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-mono font-bold">{u.reg_number}</td>
                    <td className="py-2 px-3">{u.student_name || 'N/A'}</td>
                    <td className="py-2 px-3 font-bold">{u.ca_score}</td>
                    <td className="py-2 px-3 text-red-600 font-medium">{u.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview of Matched Scores (First 5 Rows + Confirmation) */}
      {matchedResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-6 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Merged Results Preview (Showing {Math.min(5, matchedResults.length)} of {matchedResults.length} records)
              </h3>
              <p className="text-xs text-slate-500">
                CA (0-30) + Exam (0-70) = Total Score (0-100) • Grade Point (NUC 5.0 Scale)
              </p>
            </div>
            <button
              onClick={handleConfirmAndSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Saving...' : `Confirm & Save Final Results (${matchedResults.length})`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Reg Number</th>
                  <th className="py-3 px-5">Student Name</th>
                  <th className="py-3 px-5">CA (/30)</th>
                  <th className="py-3 px-5">Exam (/70)</th>
                  <th className="py-3 px-5">Total (/100)</th>
                  <th className="py-3 px-5">Grade</th>
                  <th className="py-3 px-5">Grade Point</th>
                  <th className="py-3 px-5">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matchedResults.slice(0, 5).map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5 font-mono font-bold text-primary">{r.reg_number}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-900">{r.student_name}</td>
                    <td className="py-3.5 px-5 font-semibold text-emerald-700">{r.ca_score}</td>
                    <td className="py-3.5 px-5 font-semibold text-blue-700">{r.hasExam ? r.exam_score : <span className="text-xs text-slate-400 italic">Pending</span>}</td>
                    <td className="py-3.5 px-5 font-extrabold text-slate-900">{r.total_score != null ? r.total_score : <span className="text-xs text-slate-400 italic">Pending</span>}</td>
                    <td className="py-3.5 px-5">
                      {r.hasExam ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          r.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                          r.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          r.grade === 'C' ? 'bg-indigo-100 text-indigo-800' :
                          r.grade === 'D' ? 'bg-amber-100 text-amber-800' :
                          r.grade === 'E' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {r.grade}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 font-semibold">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{r.hasExam && r.grade_point != null ? Number(r.grade_point).toFixed(1) : '—'}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">{r.grade_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Official Database Records Tab */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {existingFinalResults.length > 0
                ? `Compiled Results for ${selectedCourse?.code || 'Course'}`
                : `Recorded CA Scores for ${selectedCourse?.code || 'Course'}`}
            </h3>
            <p className="text-xs text-slate-500">
              {existingFinalResults.length > 0
                ? `${existingFinalResults.length} student results compiled & ready for HOD submission`
                : `${existingCaScores.length} student CA score(s) on record`}
            </p>
          </div>
          {existingFinalResults.length > 0 ? (
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              existingFinalResults[0].status === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              existingFinalResults[0].status === 'distributed' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
              existingFinalResults[0].status === 'submitted' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              Status: {existingFinalResults[0].status}
            </span>
          ) : existingCaScores.length > 0 ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              CA Stored • Exam Pending
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Reg Number</th>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">CA (/30)</th>
                <th className="py-3 px-5">Exam (/70)</th>
                <th className="py-3 px-5">Total (/100)</th>
                <th className="py-3 px-5">Grade</th>
                <th className="py-3 px-5">Grade Point</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {existingFinalResults.length === 0 && existingCaScores.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No scores uploaded yet for this course. Upload CA or Exam scores above to begin.
                  </td>
                </tr>
              ) : existingFinalResults.length > 0 ? (
                existingFinalResults.map((r) => {
                  const s = students.find(stud => stud.id === r.student_id)
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-primary">{s ? s.reg_number : 'N/A'}</td>
                      <td className="py-3.5 px-5 font-medium text-slate-900">{s ? s.full_name : 'Unknown'}</td>
                      <td className="py-3.5 px-5 text-emerald-700 font-semibold">{r.ca_score}</td>
                      <td className="py-3.5 px-5 text-blue-700 font-semibold">{r.exam_score}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900">{r.total_score}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-800">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold">{Number(r.grade_point).toFixed(1)}</td>
                      <td className="py-3.5 px-5 capitalize">
                        <span className="text-xs font-semibold text-slate-600">{r.status}</span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                existingCaScores.map((c) => {
                  const s = students.find(stud => stud.id === c.student_id)
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-primary">{s ? s.reg_number : 'N/A'}</td>
                      <td className="py-3.5 px-5 font-medium text-slate-900">{s ? s.full_name : 'Unknown'}</td>
                      <td className="py-3.5 px-5 text-emerald-700 font-bold">{c.ca_score}</td>
                      <td className="py-3.5 px-5 text-slate-400 italic">Pending</td>
                      <td className="py-3.5 px-5 text-slate-400 italic">Pending</td>
                      <td className="py-3.5 px-5 text-slate-400 font-semibold">—</td>
                      <td className="py-3.5 px-5 text-slate-400 font-semibold">—</td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          CA Saved
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </DashboardLayout>
  )
}
