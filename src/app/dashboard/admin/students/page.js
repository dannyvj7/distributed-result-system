'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getStudents, getDepartments, addStudent, bulkAddStudents } from '../../../../lib/db'
import { normalizeRegNumber } from '../../../../lib/grading'
import { Users, Plus, Upload, Download, Search, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [selectedLevel, setSelectedLevel] = useState('ALL')

  // Single Add Modal
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false)
  const [regNumber, setRegNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [deptId, setDeptId] = useState('')
  const [level, setLevel] = useState(400)
  const [session, setSession] = useState('2025/26')

  // Bulk Upload Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkPreview, setBulkPreview] = useState([])
  const [bulkFileName, setBulkFileName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [studs, depts] = await Promise.all([getStudents(), getDepartments()])
      setStudents(studs)
      setDepartments(depts)
      if (depts.length > 0) setDeptId(depts[0].id)
    } finally {
      setLoading(false)
    }
  }

  const handleSingleAdd = async (e) => {
    e.preventDefault()
    if (!regNumber || !fullName || !deptId) return

    try {
      await addStudent({
        reg_number: regNumber,
        full_name: fullName,
        department_id: deptId,
        level: Number(level),
        session
      })
      setStatusMessage({ type: 'success', text: `Student ${fullName} (${regNumber}) added successfully.` })
      setIsSingleModalOpen(false)
      setRegNumber('')
      setFullName('')
      loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error adding student.' })
    }
  }

  // Handle SheetJS File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setBulkFileName(file.name)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Map columns gracefully
        const parsed = jsonData.map((row) => {
          const reg = row.reg_number || row.RegNumber || row['Reg Number'] || row.matric_number || row.Matric || ''
          const name = row.full_name || row.FullName || row['Full Name'] || row.name || ''
          const deptCode = row.department_code || row.Dept || row.Department || 'COS'
          const lvl = row.level || row.Level || 400
          const sess = row.session || row.Session || '2025/26'

          const matchedDept = departments.find(
            d => d.code.toLowerCase() === String(deptCode).trim().toLowerCase()
          ) || departments[0]

          return {
            reg_number: normalizeRegNumber(reg),
            full_name: String(name).trim(),
            department_id: matchedDept?.id || deptId,
            dept_code: matchedDept?.code || 'COS',
            level: Number(lvl) || 100,
            session: sess
          }
        }).filter(item => item.reg_number && item.full_name)

        setBulkPreview(parsed)
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to parse Excel file. Please ensure it is valid.' })
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleBulkSubmit = async () => {
    if (bulkPreview.length === 0) return
    setIsProcessing(true)
    try {
      await bulkAddStudents(bulkPreview)
      setStatusMessage({ type: 'success', text: `Successfully registered ${bulkPreview.length} students via Excel import.` })
      setIsBulkModalOpen(false)
      setBulkPreview([])
      setBulkFileName('')
      loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error saving imported students.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate Sample Excel Template with SheetJS
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        reg_number: '2022/234569',
        full_name: 'John Musa Yakubu',
        department_code: 'COS',
        level: 400,
        session: '2025/26'
      },
      {
        reg_number: '2022/234570',
        full_name: 'Amina Zainab Yusuf',
        department_code: 'COS',
        level: 400,
        session: '2025/26'
      },
      {
        reg_number: 'FUT/EEE/20/2002',
        full_name: 'David Olamide Adeleke',
        department_code: 'EEE',
        level: 400,
        session: '2025/26'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(sampleData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Roster')
    XLSX.writeFile(wb, 'student_bulk_import_template.xlsx')
  }

  // Filter students
  const filtered = students.filter(s => {
    const matchSearch =
      s.reg_number.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name.toLowerCase().includes(search.toLowerCase())

    const matchDept = selectedDept === 'ALL' || s.department_id === selectedDept
    const matchLevel = selectedLevel === 'ALL' || String(s.level) === selectedLevel

    return matchSearch && matchDept && matchLevel
  })

  return (
    <DashboardLayout title="Student Registry & Enrollment" roleRequired="admin">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reg number or student name..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          >
            <option value="ALL">All Levels</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSingleModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-primary" />
            Single Student
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Excel Import
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Reg Number</th>
                <th className="py-3.5 px-6">Full Name</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Level</th>
                <th className="py-3.5 px-6">Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Loading student directory...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">No student records found.</td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const dept = departments.find(d => d.id === s.department_id)
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-6 font-bold text-primary font-mono">{s.reg_number}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">{s.full_name}</td>
                      <td className="py-3.5 px-6">{dept ? `${dept.name} (${dept.code})` : 'N/A'}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {s.level}L
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">{s.session}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE STUDENT MODAL */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Individual Student</h3>
            <p className="text-xs text-slate-500 mb-4">Register a matriculated undergraduate student</p>

            <form onSubmit={handleSingleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Matric / Reg Number
                </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. 2022/234571"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Samuel Olumide Danjuma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                    <option value={500}>500 Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Session
                  </label>
                  <input
                    type="text"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK EXCEL IMPORT MODAL (SheetJS) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Bulk Student Import via Excel</h3>
                  <p className="text-xs text-slate-500">Upload .xlsx or .csv roster with reg_number, full_name, etc.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template (.xlsx)
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary transition">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm font-semibold text-primary hover:underline">
                    Choose Excel or CSV file
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-1">Supports Microsoft Excel (.xlsx, .xls) and CSV</p>
                {bulkFileName && (
                  <p className="text-xs font-bold text-emerald-600 mt-2">
                    Selected: {bulkFileName} ({bulkPreview.length} records parsed)
                  </p>
                )}
              </div>

              {/* Preview Table */}
              {bulkPreview.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Roster Preview (Showing first 5 of {bulkPreview.length} rows)
                    </span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Ready to Save
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Reg Number</th>
                          <th className="py-2 px-3">Full Name</th>
                          <th className="py-2 px-3">Dept Code</th>
                          <th className="py-2 px-3">Level</th>
                          <th className="py-2 px-3">Session</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-semibold text-primary">{row.reg_number}</td>
                            <td className="py-2 px-3">{row.full_name}</td>
                            <td className="py-2 px-3">{row.dept_code}</td>
                            <td className="py-2 px-3">{row.level}L</td>
                            <td className="py-2 px-3">{row.session}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false)
                  setBulkPreview([])
                  setBulkFileName('')
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkPreview.length === 0 || isProcessing}
                onClick={handleBulkSubmit}
                className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing ? 'Importing...' : `Confirm Import (${bulkPreview.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
