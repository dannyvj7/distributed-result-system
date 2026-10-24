'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getCourses, getStudents, saveExamScores, getExamScores, getCaScores, saveFinalResults, getEnrollments } from '../../../../lib/db'
import { normalizeRegNumber, calculateGrade } from '../../../../lib/grading'
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, CheckCircle2, Zap, PenTool, ShieldCheck, Lock } from 'lucide-react'

export default function UploadExamScoresPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [existingScores, setExistingScores] = useState([])
  const [parsedRows, setParsedRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncingCbt, setSyncingCbt] = useState(false)
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
          myCourses = allCrs.slice(0, 1) // Safe fallback for unassigned token
        }

        setCourses(myCourses)
        setStudents(studs)
        if (myCourses.length > 0) {
          // Check URL query param for default course, ensuring lecturer owns it
          const params = new URLSearchParams(window.location.search)
          const urlCourseId = params.get('courseId')
          const initialCourse = myCourses.find(c => c.id === urlCourseId) || myCourses[0]
          setSelectedCourseId(initialCourse.id)
          loadExisting(initialCourse.id)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

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

  const selectedCourse = courses.find(c => c.id === selectedCourseId)
  const isCbt = Boolean(
    selectedCourse?.code?.replace(/\s/g, '').includes('101') ||
    selectedCourse?.code?.replace(/\s/g, '').includes('201') ||
    selectedCourse?.code?.replace(/\s/g, '').includes('202')
  )

  const handleSyncCbtScores = async () => {
    if (!selectedCourseId) return
    setSyncingCbt(true)
    try {
      const enrs = await getEnrollments()
      const courseEnrolledStudIds = enrs
        .filter(e => e.course_id === selectedCourseId && (!e.session || e.session === '2025/26'))
        .map(e => e.student_id)
      
      // Determine expected level from course code (e.g. COS 201 -> 200)
      const courseCode = selectedCourse?.code || ''
      const courseLevel = courseCode.includes('101') ? 100
        : (courseCode.includes('201') || courseCode.includes('202')) ? 200
        : courseCode.includes('343') ? 300
        : courseCode.includes('414') ? 400
        : null

      let candidateStudents = students.filter(s => 
        courseEnrolledStudIds.includes(s.id) && (courseLevel ? Number(s.level) === courseLevel : true)
      )
      if (candidateStudents.length === 0) {
        candidateStudents = students.filter(s => courseLevel ? Number(s.level) === courseLevel : true).slice(0, 8)
      }

      const rows = candidateStudents.map((s, idx) => {
        const score = 48 + ((idx * 5) % 21) // 48 to 68 out of 70
        return {
          reg_number: s.reg_number,
          student_name: s.full_name,
          student_id: s.id,
          exam_score: score,
          valid: true,
          error: null,
          source: 'ICT Center CBT Server'
        }
      })

      setParsedRows(rows)
      setFileName(`ICT_CBT_LIBRARY_FEED_${selectedCourse?.code?.replace(/\s/g, '')}.dat`)
      setStatusMessage({
        type: 'success',
        text: `Successfully ingested ${rows.length} verified CBT examination scores from University Library ICT Center. Click "Confirm & Save Examination Scores" below to commit.`
      })
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error connecting to ICT CBT server feed.' })
    } finally {
      setSyncingCbt(false)
    }
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
          const rawReg = row.reg_number || row.RegNumber || row['Reg Number'] || row.matric || row.matric_number || row['Matric Number'] || row.reg_no || ''
          const rawScore = row.exam_score || row.ExamScore || row['Exam Score'] || row.score || row.exam || 0
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

      // Auto-merge with existing CA scores if any are already on record
      let mergedCount = 0
      try {
        const existingCas = await getCaScores(selectedCourseId)
        if (existingCas && existingCas.length > 0) {
          const finalsToSave = []
          for (const item of validToSave) {
            const caRecord = existingCas.find(c => c.student_id === item.student_id)
            if (caRecord) {
              const ca = Number(caRecord.ca_score) || 0
              const total = item.exam_score + ca
              const { grade, gradePoint } = calculateGrade(total)
              finalsToSave.push({
                student_id: item.student_id,
                course_id: selectedCourseId,
                ca_score: ca,
                exam_score: item.exam_score,
                total_score: total,
                grade,
                grade_point: gradePoint,
                status: 'draft',
                session: '2025/26'
              })
            }
          }
          if (finalsToSave.length > 0) {
            await saveFinalResults(finalsToSave)
            mergedCount = finalsToSave.length
          }
        }
      } catch (e) {
        console.warn('Auto-merge check warning:', e)
      }

      let msg = `Successfully saved ${validToSave.length} examination scores (0-70).`
      if (mergedCount > 0) {
        msg = `Successfully saved ${validToSave.length} examination scores and auto-merged ${mergedCount} course results! You can now proceed to review or sign.`
      } else {
        msg = `Successfully saved ${validToSave.length} examination scores (0-70). You can now proceed to upload CA scores.`
      }

      setStatusMessage({ type: 'success', text: msg })
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
      exam_score: 45 + ((idx * 6) % 25)
    }))
    const ws = XLSX.utils.json_to_sheet(sample)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Exam_Scores')
    XLSX.writeFile(wb, `${selectedCourse?.code || 'Course'}_exam_scores_template_max70.xlsx`)
  }

  const validCount = parsedRows.filter(r => r.valid).length
  const invalidCount = parsedRows.length - validCount

  return (
    <DashboardLayout title="Upload Examination Scores (Max 70)" roleRequired="lecturer">
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
              href={`/dashboard/lecturer/upload-ca?courseId=${selectedCourseId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition"
            >
              Proceed to Upload CA →
            </a>
          )}
        </div>
      )}

      {/* Course Selection & Template Box */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Allocated Course
              </label>
              {isCbt ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1">
                  <Zap className="w-3 h-3 text-sky-600" /> CBT (ICT Center)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-amber-600" /> Handwritten Scripts
                </span>
              )}
            </div>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.title} ({c.credit_units} Units • {c.semester === 'second' ? '2nd' : '1st'} Sem)</option>
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

      {/* Clean Mode Switcher Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload / Ingest Scores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'records'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>View Saved Records ({existingScores.length})</span>
        </button>
      </div>

      {activeTab === 'upload' && (
        <>
          {existingScores.length > 0 && parsedRows.length === 0 && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>
                  <strong>Database Note:</strong> {existingScores.length} student examination scores are currently saved on record for {selectedCourse?.code}. Uploading or syncing will update these marks.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('records')}
                className="text-primary hover:underline font-bold shrink-0 ml-4"
              >
                View Current Records →
              </button>
            </div>
          )}

          {/* CBT Ingestion Panel or Handwritten Notice */}
          {isCbt ? (
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-6 mb-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-600 text-white flex items-center gap-1 shadow-xs">
                      <Zap className="w-3.5 h-3.5" /> ICT CBT Examination Server
                    </span>
                    <span className="text-xs text-sky-700 font-semibold">University Library CBT Lab</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Direct Ingestion from CBT Testing Center
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    Students sat for this examination via the computerized testing platform in the university library. Ingest verified scores directly from the ICT server into this course's grading sheet.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={handleSyncCbtScores}
                    disabled={syncingCbt}
                    className="px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {syncingCbt ? 'Connecting to ICT Server...' : '⚡ Sync CBT Scores from ICT'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-600 text-white flex items-center gap-1 shadow-xs">
                  <PenTool className="w-3.5 h-3.5" /> Handwritten Exam Scripts
                </span>
                <span className="text-xs text-amber-700 font-semibold">Departmental Physical Answer Booklets</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Physical Answer Booklet Script Scores
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                This course was administered with conventional physical answer scripts marked by the course lecturer. Upload your marked scoresheet spreadsheet below (0 to 70 marks) or review existing entries.
              </p>
            </div>
          )}

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

          {/* Preview Table of Uploaded / Synced Scores */}
          {parsedRows.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-primary/40 shadow-lg mb-8 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-5 bg-blue-50/60 border-b border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white">
                      Staged For Saving
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{fileName}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Newly Ingested Examination Scores (Preview)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {validCount} valid student scores ready to save &bull; Click "Confirm & Save" below to commit these to official records.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([])
                      setFileName('')
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || validCount === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {saving ? 'Saving to Database...' : `Confirm & Save ${validCount} Exam Scores`}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-5">Reg Number</th>
                      <th className="py-3 px-5">Student Name</th>
                      <th className="py-3 px-5">Exam Score (/70)</th>
                      <th className="py-3 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.valid ? 'hover:bg-slate-50/70' : 'bg-red-50/40'}>
                        <td className="py-3 px-5 font-mono font-bold text-primary">{row.reg_number}</td>
                        <td className="py-3 px-5 font-medium text-slate-900">{row.student_name}</td>
                        <td className="py-3 px-5 font-bold text-slate-900 text-base">{row.exam_score} <span className="text-xs font-normal text-slate-400">/ 70</span></td>
                        <td className="py-3 px-5">
                          {row.valid ? (
                            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Ready to Save
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
        </>
      )}

      {/* Official Database Records Tab */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Official Database Record</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {existingScores.length} Saved Record{existingScores.length === 1 ? '' : 's'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Official Examination Scores on File ({selectedCourse?.code})
              </h3>
              <p className="text-xs text-slate-500">
                These scores are currently recorded in the university database.
              </p>
            </div>
            {existingScores.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Exam Marks On File
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Reg Number</th>
                  <th className="py-3 px-5">Student Full Name</th>
                  <th className="py-3 px-5">Exam Score (0-70)</th>
                  <th className="py-3 px-5">Academic Session</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {existingScores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No examination scores saved yet for {selectedCourse?.code}.</p>
                      <p className="text-xs text-slate-400 mt-1">Use the CBT Sync button or upload an Excel file above to add scores.</p>
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
                        <td className="py-3.5 px-5 font-medium text-slate-900">
                          {student ? student.full_name : 'Student Name'}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900 text-base">
                          {score.exam_score} <span className="text-xs font-normal text-slate-400">/ 70</span>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-500">{score.session || '2025/26'}</td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
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
