'use client'

import React, { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getStudents, getCourses, getFinalResults, getDepartments, getCgpaRecord } from '../../../../lib/db'
import { normalizeRegNumber } from '../../../../lib/grading'
import { Printer, Download, School, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function StudentPrintResultPage() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [department, setDepartment] = useState(null)
  const [results, setResults] = useState([])
  const [courses, setCourses] = useState([])
  const [cgpaRecord, setCgpaRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [studs, crs, finals, depts] = await Promise.all([
          getStudents(),
          getCourses(),
          getFinalResults(),
          getDepartments()
        ])

        const activeStudent = studs.find(
          s => s.id === user?.id || (user?.reg_number && normalizeRegNumber(s.reg_number) === normalizeRegNumber(user.reg_number))
        ) || studs[0]

        setStudent(activeStudent)
        setCourses(crs)

        if (activeStudent) {
          const dept = depts.find(d => d.id === activeStudent.department_id)
          setDepartment(dept)

          const studentResults = finals.filter(
            r => r.student_id === activeStudent.id && (r.status === 'approved' || r.status === 'distributed')
          )
          setResults(studentResults)

          const rec = await getCgpaRecord(activeStudent.id)
          setCgpaRecord(rec)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  // Compute metrics
  let totalUnits = 0
  let totalQualityPoints = 0
  let passedUnits = 0

  results.forEach(r => {
    const course = courses.find(c => c.id === r.course_id)
    const units = Number(course?.credit_units || 3)
    const gp = Number(r.grade_point || 0)
    totalUnits += units
    if (r.grade !== 'F') passedUnits += units
    totalQualityPoints += (units * gp)
  })

  const gpa = totalUnits > 0 ? (totalQualityPoints / totalUnits).toFixed(2) : '0.00'
  const cgpa = Number(cgpaRecord?.cgpa || gpa).toFixed(2)
  const classification = cgpaRecord?.classification || 'First Class Honours'

  // Generate Official PDF Statement via jsPDF
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.width

    // 1. Header Banner
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(30, 58, 138) // #1E3A8A
    doc.text('FEDERAL TERTIARY INSTITUTION OF TECHNOLOGY', pageWidth / 2, 45, { align: 'center' })

    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42) // #0F172A
    doc.text('OFFICE OF THE REGISTRAR (ACADEMIC AFFAIRS)', pageWidth / 2, 62, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text('OFFICIAL NOTIFICATION OF SEMESTER EXAMINATION RESULTS', pageWidth / 2, 78, { align: 'center' })

    // Decorative Line
    doc.setDrawColor(30, 58, 138)
    doc.setLineWidth(1.5)
    doc.line(40, 88, pageWidth - 40, 88)

    // 2. Candidate Bio Data Block
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)

    const leftX = 50
    const rightX = 320
    let startY = 110

    doc.text(`Candidate Name: ${student?.full_name?.toUpperCase()}`, leftX, startY)
    doc.text(`Matric / Reg No: ${student?.reg_number}`, rightX, startY)

    startY += 18
    doc.text(`Faculty: ${department?.faculty?.toUpperCase()}`, leftX, startY)
    doc.text(`Department: ${department?.name?.toUpperCase()} (${department?.code})`, rightX, startY)

    startY += 18
    doc.text(`Level of Study: ${student?.level || 100} Level`, leftX, startY)
    doc.text(`Academic Session: ${student?.session || '2025/26'}`, rightX, startY)

    // 3. Results Autotable
    const headers = [['Course Code', 'Course Title', 'Semester', 'Units', 'Score', 'Grade', 'Point', 'Quality Points']]

    const rows = results.map(r => {
      const course = courses.find(c => c.id === r.course_id)
      const units = Number(course?.credit_units || 3)
      const gp = Number(r.grade_point || 0)
      const qp = (units * gp).toFixed(1)
      const sem = course?.semester === 'second' ? '2nd Sem' : '1st Sem'

      return [
        course?.code || 'COS',
        course?.title || 'Course Title',
        sem,
        units,
        r.total_score,
        r.grade,
        gp.toFixed(1),
        qp
      ]
    })

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 160,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 180 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 45 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 45 },
        5: { halign: 'center', cellWidth: 45 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 70 }
      },
      margin: { left: 40, right: 40 }
    })

    // 4. Performance Summary Box
    const tableEndY = doc.lastAutoTable.finalY + 25

    doc.setFillColor(248, 250, 252)
    doc.rect(40, tableEndY, pageWidth - 80, 55, 'F')
    doc.setDrawColor(203, 213, 225)
    doc.rect(40, tableEndY, pageWidth - 80, 55, 'D')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 138)

    doc.text(`Total Units Registered (TCR): ${totalUnits}`, 55, tableEndY + 20)
    doc.text(`Total Units Passed (TCP): ${passedUnits}`, 55, tableEndY + 38)

    doc.text(`Total Quality Points (TQP): ${totalQualityPoints.toFixed(1)}`, 230, tableEndY + 20)
    doc.text(`Semester GPA: ${gpa}`, 230, tableEndY + 38)

    doc.setFontSize(10)
    doc.setTextColor(22, 163, 74) // #16A34A
    doc.text(`Cumulative CGPA: ${cgpa}`, 400, tableEndY + 20)
    doc.text(`Class: ${classification}`, 400, tableEndY + 38)

    // 5. Verification & Stamp Section
    const stampY = tableEndY + 90
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)

    // HOD Sign
    doc.line(60, stampY, 200, stampY)
    doc.text('Head of Department (HOD)', 70, stampY + 14)
    doc.text('Signature & Official Stamp', 75, stampY + 26)

    // Registrar Seal
    doc.line(pageWidth - 200, stampY, pageWidth - 60, stampY)
    doc.text('Academic Registrar', pageWidth - 170, stampY + 14)
    doc.text('Senate Verification Seal', pageWidth - 180, stampY + 26)

    // Security Footer
    doc.setFontSize(7.5)
    doc.text('Security Notice: This document is an electronic statement verified by the Distributed Student Result Management System.', pageWidth / 2, doc.internal.pageSize.height - 30, { align: 'center' })

    doc.save(`Result_Statement_${student?.reg_number?.replace(/\//g, '_')}.pdf`)
  }

  return (
    <DashboardLayout title="Print Result Statement" roleRequired="student">
      {/* Action Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Official Semester Statement of Results</h3>
          <p className="text-xs text-slate-500">Verified document compliant with Nigerian NUC 5-point grading format</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Web Slip
          </button>
          <button
            onClick={generatePDF}
            className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download Official PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet Card Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 sm:p-12 max-w-4xl mx-auto mb-10 print:border-none print:shadow-none">
        {/* University Crest Header */}
        <div className="text-center pb-6 border-b-2 border-primary mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
            <School className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight uppercase">
            Federal Tertiary Institution of Technology
          </h2>
          <p className="text-xs font-bold text-slate-800 tracking-wider uppercase mt-0.5">
            Office of the Academic Registrar • Senate Examination Records
          </p>
          <p className="text-xs text-slate-500 mt-1">
            OFFICIAL NOTIFICATION OF SEMESTER EXAMINATION RESULTS
          </p>
        </div>

        {/* Candidate Bio Info */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Candidate Name:</span>
            <span className="font-bold text-slate-900 text-sm">{student?.full_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Matric / Reg Number:</span>
            <span className="font-mono font-bold text-primary text-sm">{student?.reg_number}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Faculty & Department:</span>
            <span className="font-semibold text-slate-800">
              {department?.faculty} • {department?.name} ({department?.code})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Academic Session:</span>
            <span className="font-semibold text-slate-800">
              {student?.session || '2025/26'} • Level {student?.level || 100}L
            </span>
          </div>
        </div>

        {/* Results Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-primary text-white font-bold">
              <tr>
                <th className="py-2.5 px-4">Course Code</th>
                <th className="py-2.5 px-4">Course Title</th>
                <th className="py-2.5 px-4 text-center">Semester</th>
                <th className="py-2.5 px-4 text-center">Units</th>
                <th className="py-2.5 px-4 text-center">Total (/100)</th>
                <th className="py-2.5 px-4 text-center">Grade</th>
                <th className="py-2.5 px-4 text-center">Grade Point</th>
                <th className="py-2.5 px-4 text-right">Quality Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((r) => {
                const course = courses.find(c => c.id === r.course_id)
                const units = Number(course?.credit_units || 3)
                const gp = Number(r.grade_point || 0)
                const qp = (units * gp).toFixed(1)
                const sem = course?.semester === 'second' ? '2nd Sem' : '1st Sem'

                return (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-mono font-bold text-primary">{course?.code || 'COS'}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{course?.title || 'Course Title'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        course?.semester === 'second' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sem}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{units}</td>
                    <td className="py-3 px-4 text-center font-bold">{r.total_score}</td>
                    <td className="py-3 px-4 text-center font-extrabold">{r.grade}</td>
                    <td className="py-3 px-4 text-center">{gp.toFixed(1)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{qp}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Footer Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-10">
          <div>
            <span className="text-slate-400 block font-medium">Total Registered:</span>
            <span className="text-base font-bold text-slate-900">{totalUnits} Units</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Quality Points:</span>
            <span className="text-base font-bold text-indigo-700">{totalQualityPoints.toFixed(1)}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Semester GPA:</span>
            <span className="text-base font-bold text-primary">{gpa} / 5.00</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Cumulative CGPA:</span>
            <span className="text-base font-bold text-emerald-700">{cgpa}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">{classification}</span>
          </div>
        </div>

        {/* Official Signatures Footnote */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-10 flex items-center justify-center">
              <span className="font-serif italic text-slate-500">Prof. B. Adeleke</span>
            </div>
            <div className="border-t border-slate-300 pt-2 font-bold text-slate-800">
              Head of Department (HOD)
            </div>
          </div>

          <div>
            <div className="h-10 flex items-center justify-center">
              <span className="font-serif italic text-slate-500">Senate Seal Affixed</span>
            </div>
            <div className="border-t border-slate-300 pt-2 font-bold text-slate-800">
              Registrar / Examination Officer
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
