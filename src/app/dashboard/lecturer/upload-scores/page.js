'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getCourses, getStudents, saveExamScores, getExamScores } from '../../../../lib/db'
import { normalizeRegNumber } from '../../../../lib/grading'
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react'

export default function UploadExamScoresPage() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [existingScores, setExistingScores] = useState([])
  const [parsedRows, setParsedRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [crs, studs] = await Promise.all([getCourses(), getStudents()])
        setCourses(crs)
        setStudents(studs)
        if (crs.length > 0) {
          // Check URL query param for default course
          const params = new URLSearchParams(window.location.search)
          const urlCourseId = params.get('courseId')
          const initialCourse = crs.find(c => c.id === urlCourseId) || crs[0]
          setSelectedCourseId(initialCourse.id)
          loadExisting(initialCourse.id)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const loadExisting = async (courseId) => {
    const scores = await getExamScores(courseId)
    setExistingScores(scores)
  }

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId)
    setParsedRows([])
    setFileName('')
    loadExisting(courseId)
  }

  // Handle SheetJS file parsing
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
        const jsonData = XLSX.utils.sheet_to_json(ws)

        const processed = jsonData.map((row) => {
          const rawReg = row.reg_number || row.RegNumber || row['Reg Number'] || row.matric || ''
          const rawScore = row.exam_score || row.ExamScore || row['Exam Score'] || row.score || 0
          const normalizedReg = normalizeRegNumber(rawReg)

          const studentObj = students.find(s => normalizeRegNumber(s.reg_number) === normalizedReg)
          const numScore = Number(rawScore)
          const isValidScore = !isNaN(numScore) && numScore >= 0 && numScore <= 70

          return {
            reg_number: normalizedReg,
            student_name: studentObj ? studentObj.full_name : 'Student not in registry',
            student_id: studentObj ? studentObj.id : null,
            exam_score: isValidScore ? numScore : 0,
            valid: Boolean(studentObj && isValidScore),
            error: !studentObj ? 'Unregistered Reg Number' : !isValidScore ? 'Score must be 0-70' : null
          }
        }).filter(r => r.reg_number)

        setParsedRows(processed)
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to parse file. Please upload a valid Excel or CSV sheet.' })
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleSave = async () => {
    if (!selectedCourseId || parsedRows.length === 0) return
    setSaving(true)
    try {
      const validToSave = parsedRows
        .filter(r => r.valid && r.student_id)
        .map(r => ({
          student_id: r.student_id,
          course_id: selectedCourseId,
          exam_score: r.exam_score,
          session: '2025/26'
        }))

      await saveExamScores(validToSave)
      setStatusMessage({
        type: 'success',
        text: `Successfully saved ${validToSave.length} examination scores (0-70). You can now proceed to upload CA scores.`
      })
      loadExisting(selectedCourseId)
      setParsedRows([])
      setFileName('')
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error saving examination scores.' })
    } finally {
      setSaving(false)
    }
  }

  const downloadSampleTemplate = () => {
    const sample = [
      { reg_number: '2022/234567', exam_score: 52 },
      { reg_number: '2022/234568', exam_score: 58 },
      { reg_number: '2022/235001', exam_score: 45 }
    ]
    const ws = XLSX.utils.json_to_sheet(sample)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Exam_Scores')
    XLSX.writeFile(wb, 'exam_scores_template_max70.xlsx')
  }

  const validCount = parsedRows.filter(r => r.valid).length
  const invalidCount = parsedRows.length - validCount

  return (
    <DashboardLayout title="Upload Examination Scores (Max 70)" roleRequired="lecturer">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Course Selection & Template Box */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Allocated Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.title} ({c.credit_units} Units)</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 rounded-xl text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" />
            Download Excel Template (.xlsx)
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xs mb-6 text-center">
        <div className="max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Upload Exam Score Sheet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Accepted columns: <span className="font-mono font-semibold text-slate-700">reg_number</span>, <span className="font-mono font-semibold text-slate-700">exam_score</span> (range 0 to 70 marks).
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-blue-500/20 transition">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Select Excel or CSV File</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {fileName && (
            <p className="mt-3 text-xs font-semibold text-emerald-600">
              Loaded: {fileName} ({parsedRows.length} rows detected)
            </p>
          )}
        </div>
      </div>

      {/* Preview Table of Uploaded Scores */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-6 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Parsed Examination Scores Preview</h3>
              <p className="text-xs text-slate-500">
                {validCount} valid records ready to commit • {invalidCount} invalid rows flagged
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || validCount === 0}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Saving...' : `Save ${validCount} Exam Scores`}
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-3 px-5">Reg Number</th>
                  <th className="py-3 px-5">Student Name</th>
                  <th className="py-3 px-5">Exam Score (/70)</th>
                  <th className="py-3 px-5">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className={row.valid ? 'hover:bg-slate-50/70' : 'bg-red-50/40'}>
                    <td className="py-3 px-5 font-mono font-bold text-primary">{row.reg_number}</td>
                    <td className="py-3 px-5 font-medium text-slate-900">{row.student_name}</td>
                    <td className="py-3 px-5 font-bold text-slate-800">{row.exam_score}</td>
                    <td className="py-3 px-5">
                      {row.valid ? (
                        <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Currently Saved Exam Scores for this Course */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Current Exam Scores On Record</h3>
          <p className="text-xs text-slate-500">
            {existingScores.length} student scores registered for this course
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Reg Number</th>
                <th className="py-3 px-5">Student Full Name</th>
                <th className="py-3 px-5">Exam Score (0-70)</th>
                <th className="py-3 px-5">Session</th>
                <th className="py-3 px-5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {existingScores.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No examination scores uploaded yet for this course.
                  </td>
                </tr>
              ) : (
                existingScores.map((score) => {
                  const student = students.find(s => s.id === score.student_id)
                  return (
                    <tr key={score.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-primary">
                        {student ? student.reg_number : 'N/A'}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {student ? student.full_name : 'Unknown Student'}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {score.exam_score} / 70
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">{score.session}</td>
                      <td className="py-3.5 px-5 text-xs text-slate-400">
                        {new Date(score.uploaded_at).toLocaleDateString()}
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
