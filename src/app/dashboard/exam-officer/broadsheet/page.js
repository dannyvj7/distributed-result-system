'use client'

import React, { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getDepartments, getStudents, getCourses, getFinalResults, getCgpaRecord } from '../../../../lib/db'
import { calculateGrade } from '../../../../lib/grading'
import { FileSpreadsheet, Printer, Download, Search, CheckCircle2, School } from 'lucide-react'

export default function ExamOfficerBroadsheetPage() {
  const [departments, setDepartments] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [finalResults, setFinalResults] = useState([])
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [selectedLevel, setSelectedLevel] = useState(400)
  const [session, setSession] = useState('2025/26')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [depts, studs, crs, finals] = await Promise.all([
          getDepartments(),
          getStudents(),
          getCourses(),
          getFinalResults()
        ])
        setDepartments(depts)
        setStudents(studs)
        setCourses(crs)
        const processedFinals = finals.map(r => {
          const ca = Number(r.ca_score || 0)
          const exam = Number(r.exam_score || 0)
          const total = (r.total_score !== undefined && r.total_score !== null && !isNaN(Number(r.total_score)))
            ? Number(r.total_score)
            : (ca + exam)
          const { grade, gradePoint } = calculateGrade(total)
          return {
            ...r,
            ca_score: ca,
            exam_score: exam,
            total_score: total,
            grade: r.grade || grade,
            grade_point: (r.grade_point !== undefined && r.grade_point !== null && !isNaN(Number(r.grade_point)))
              ? Number(r.grade_point)
              : gradePoint
          }
        })
        setFinalResults(processedFinals)
        if (depts.length > 0) setSelectedDeptId(depts[0].id)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const selectedDept = departments.find(d => d.id === selectedDeptId) || departments[0]

  // Filter students by selected department and level
  const deptStudents = students.filter(
    s => s.department_id === selectedDept?.id && (selectedLevel === 'ALL' || Number(s.level) === Number(selectedLevel))
  )

  // Filter courses for this department or level
  const deptCourses = courses.filter(
    c => c.department_id === selectedDept?.id || c.code.startsWith(selectedDept?.code || 'COS')
  )

  // Generate Professional Senate Broadsheet PDF via jsPDF & jspdf-autotable
  const exportBroadsheetPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a3'
    })

    // Institution & Document Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(30, 58, 138) // #1E3A8A
    doc.text('FEDERAL TERTIARY INSTITUTION OF TECHNOLOGY', doc.internal.pageSize.width / 2, 40, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42) // #0F172A
    doc.text('OFFICE OF THE ACADEMIC REGISTRAR & SENATE EXAMINATIONS BOARD', doc.internal.pageSize.width / 2, 58, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`CONSOLIDATED RESULT BROADSHEET • ACADEMIC SESSION: ${session} • FIRST SEMESTER`, doc.internal.pageSize.width / 2, 74, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.text(`FACULTY: ${selectedDept?.faculty?.toUpperCase()}   |   DEPARTMENT: ${selectedDept?.name?.toUpperCase()} (${selectedDept?.code})   |   LEVEL: ${selectedLevel}L`, doc.internal.pageSize.width / 2, 90, { align: 'center' })

    // Build Autotable columns
    // Headers: S/N, Matric No, Candidate Name, [Course 1, Course 2, ...], TCR, TCP, TQP, GPA, CGPA, Classification
    const headers = [
      'S/N',
      'Matric / Reg No',
      'Candidate Full Name',
      ...deptCourses.map(c => `${c.code}\n(${c.credit_units}U)`),
      'TCR',
      'TCP',
      'TQP',
      'GPA',
      'CGPA',
      'Classification'
    ]

    // Build rows
    const rows = deptStudents.map((stud, idx) => {
      let tcr = 0
      let tcp = 0
      let tqp = 0

      const courseCells = deptCourses.map(course => {
        const res = finalResults.find(r => r.student_id === stud.id && r.course_id === course.id)
        if (res) {
          const score = res.total_score
          const grade = res.grade
          const units = Number(course.credit_units) || 3
          const gp = Number(res.grade_point) || 0

          tcr += units
          if (grade !== 'F') tcp += units
          tqp += (units * gp)

          return `${score} (${grade})`
        }
        return '-'
      })

      const gpa = tcr > 0 ? (tqp / tcr).toFixed(2) : '0.00'
      const cgpa = gpa // In this semester snapshot

      let classification = 'Pass'
      const numGpa = Number(gpa)
      if (numGpa >= 4.50) classification = 'First Class'
      else if (numGpa >= 3.50) classification = '2nd Class (Upper)'
      else if (numGpa >= 2.40) classification = '2nd Class (Lower)'
      else if (numGpa >= 1.50) classification = '3rd Class'
      else if (numGpa < 1.00) classification = 'Fail'

      return [
        idx + 1,
        stud.reg_number,
        stud.full_name,
        ...courseCells,
        tcr,
        tcp,
        tqp.toFixed(1),
        gpa,
        cgpa,
        classification
      ]
    })

    // Render table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 105,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [15, 23, 42]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'left', fontStyle: 'bold', cellWidth: 100 },
        2: { halign: 'left', cellWidth: 140 }
      },
      margin: { left: 30, right: 30 }
    })

    // Signature Endorsement Footer
    const finalY = doc.lastAutoTable.finalY + 45
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const colW = (doc.internal.pageSize.width - 100) / 3

    // Sign 1: Course Lecturer / Departmental Exam Officer
    doc.line(50, finalY, 50 + colW - 30, finalY)
    doc.text('Departmental Exam Officer', 50, finalY + 14)
    doc.text('Signature & Date', 50, finalY + 26)

    // Sign 2: Head of Department
    doc.line(50 + colW, finalY, 50 + colW + colW - 30, finalY)
    doc.text('Head of Department (HOD)', 50 + colW, finalY + 14)
    doc.text('Official Stamp & Date', 50 + colW, finalY + 26)

    // Sign 3: Dean / Institutional Exam Officer
    doc.line(50 + colW * 2, finalY, doc.internal.pageSize.width - 50, finalY)
    doc.text('Institutional Examination Officer / Registrar', 50 + colW * 2, finalY + 14)
    doc.text('Senate Endorsement & Seal', 50 + colW * 2, finalY + 26)

    doc.save(`Senate_Broadsheet_${selectedDept?.code}_${selectedLevel}L_${session.replace('/', '-')}.pdf`)
  }

  return (
    <DashboardLayout title="Senate Consolidated Result Broadsheet" roleRequired="exam_officer">
      {/* Controls & Broadsheet Parameters */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Student Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={100}>100 Level</option>
                <option value={200}>200 Level</option>
                <option value={300}>300 Level</option>
                <option value={400}>400 Level</option>
                <option value={500}>500 Level</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Academic Session
              </label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={exportBroadsheetPDF}
            disabled={deptStudents.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Generate Senate PDF Broadsheet</span>
          </button>
        </div>
      </div>

      {/* Broadsheet Matrix Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedDept?.name} ({selectedDept?.code}) • {selectedLevel} Level Broadsheet Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Showing {deptStudents.length} candidates across {deptCourses.length} registered courses
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            NUC 5.0 Standard Scale
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#1E3A8A] text-white">
              <tr>
                <th className="py-3 px-3 border border-blue-900 text-center">S/N</th>
                <th className="py-3 px-3 border border-blue-900">Matric / Reg No</th>
                <th className="py-3 px-4 border border-blue-900">Candidate Full Name</th>
                {deptCourses.map(c => (
                  <th key={c.id} className="py-3 px-3 border border-blue-900 text-center whitespace-nowrap">
                    <div>{c.code}</div>
                    <div className="text-[10px] text-blue-200 font-normal">({c.credit_units} Units)</div>
                  </th>
                ))}
                <th className="py-3 px-3 border border-blue-900 text-center">TCR</th>
                <th className="py-3 px-3 border border-blue-900 text-center">TCP</th>
                <th className="py-3 px-3 border border-blue-900 text-center">TQP</th>
                <th className="py-3 px-3 border border-blue-900 text-center font-bold">GPA</th>
                <th className="py-3 px-3 border border-blue-900 text-center font-bold">CGPA</th>
                <th className="py-3 px-4 border border-blue-900">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {deptStudents.length === 0 ? (
                <tr>
                  <td colSpan={6 + deptCourses.length} className="py-8 text-center text-slate-400">
                    No registered students found for this department and level.
                  </td>
                </tr>
              ) : (
                deptStudents.map((stud, idx) => {
                  let tcr = 0
                  let tcp = 0
                  let tqp = 0

                  return (
                    <tr key={stud.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 border border-slate-200 text-center font-semibold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 border border-slate-200 font-mono font-bold text-primary">
                        {stud.reg_number}
                      </td>
                      <td className="py-3 px-4 border border-slate-200 font-semibold text-slate-900">
                        {stud.full_name}
                      </td>

                      {/* Course scores */}
                      {deptCourses.map(course => {
                        const res = finalResults.find(r => r.student_id === stud.id && r.course_id === course.id)
                        if (res) {
                          const units = Number(course.credit_units) || 3
                          const gp = Number(res.grade_point) || 0
                          tcr += units
                          if (res.grade !== 'F') tcp += units
                          tqp += (units * gp)

                          return (
                            <td key={course.id} className="py-3 px-3 border border-slate-200 text-center">
                              <span className="font-bold text-slate-900">{res.total_score}</span>
                              <span className={`ml-1 text-[11px] font-extrabold ${
                                res.grade === 'A' ? 'text-emerald-700' :
                                res.grade === 'B' ? 'text-blue-700' :
                                res.grade === 'C' ? 'text-indigo-700' :
                                res.grade === 'D' ? 'text-amber-700' :
                                res.grade === 'E' ? 'text-orange-700' :
                                'text-red-700'
                              }`}>
                                ({res.grade})
                              </span>
                            </td>
                          )
                        }
                        return (
                          <td key={course.id} className="py-3 px-3 border border-slate-200 text-center text-slate-300">
                            -
                          </td>
                        )
                      })}

                      {/* Computed Summary */}
                      {(() => {
                        const gpa = tcr > 0 ? (tqp / tcr).toFixed(2) : '0.00'
                        let classBadge = 'bg-slate-100 text-slate-800'
                        let classText = 'Pass'
                        const numGpa = Number(gpa)
                        if (numGpa >= 4.50) { classBadge = 'bg-emerald-100 text-emerald-800 font-bold'; classText = 'First Class' }
                        else if (numGpa >= 3.50) { classBadge = 'bg-blue-100 text-blue-800 font-bold'; classText = '2nd Class (Upper)' }
                        else if (numGpa >= 2.40) { classBadge = 'bg-indigo-100 text-indigo-800'; classText = '2nd Class (Lower)' }
                        else if (numGpa >= 1.50) { classBadge = 'bg-amber-100 text-amber-800'; classText = '3rd Class' }
                        else if (numGpa < 1.00) { classBadge = 'bg-red-100 text-red-800 font-bold'; classText = 'Fail' }

                        return (
                          <>
                            <td className="py-3 px-3 border border-slate-200 text-center font-semibold">{tcr}</td>
                            <td className="py-3 px-3 border border-slate-200 text-center font-semibold text-emerald-700">{tcp}</td>
                            <td className="py-3 px-3 border border-slate-200 text-center font-semibold">{tqp.toFixed(1)}</td>
                            <td className="py-3 px-3 border border-slate-200 text-center font-bold text-primary">{gpa}</td>
                            <td className="py-3 px-3 border border-slate-200 text-center font-bold text-slate-900">{gpa}</td>
                            <td className="py-3 px-4 border border-slate-200">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${classBadge}`}>
                                {classText}
                              </span>
                            </td>
                          </>
                        )
                      })()}
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
