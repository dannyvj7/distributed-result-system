'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getCourses, getDepartments, getUsers, addCourse } from '../../../../lib/db'
import { BookOpen, Plus, Search, CheckCircle, AlertCircle, UserCheck } from 'lucide-react'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [creditUnits, setCreditUnits] = useState(3)
  const [semester, setSemester] = useState('first')
  const [departmentId, setDepartmentId] = useState('')
  const [lecturerId, setLecturerId] = useState('')
  const [session, setSession] = useState('2025/26')
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [crs, depts, usrs] = await Promise.all([
        getCourses(),
        getDepartments(),
        getUsers()
      ])
      setCourses(crs)
      setDepartments(depts)
      if (depts.length > 0) setDepartmentId(depts[0].id)

      // Filter lecturers and HODs who can teach
      const teachStaff = usrs.filter(u => u.role === 'lecturer' || u.role === 'hod')
      setLecturers(teachStaff)
      if (teachStaff.length > 0) setLecturerId(teachStaff[0].id)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!code || !title) return

    try {
      await addCourse({
        code,
        title,
        credit_units: Number(creditUnits),
        semester,
        department_id: departmentId,
        lecturer_id: lecturerId || null,
        session
      })
      setStatusMessage({ type: 'success', text: `Course "${code} - ${title}" added successfully.` })
      setIsModalOpen(false)
      setCode('')
      setTitle('')
      loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error adding course.' })
    }
  }

  const filtered = courses.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout title="Accredited Courses & Allocations" roleRequired="admin">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code or title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Code</th>
                <th className="py-3.5 px-6">Title</th>
                <th className="py-3.5 px-6">Credit Units</th>
                <th className="py-3.5 px-6">Semester</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Assigned Lecturer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading courses...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No courses registered yet.</td>
                </tr>
              ) : (
                filtered.map((course) => {
                  const dept = departments.find(d => d.id === course.department_id)
                  const lecturer = lecturers.find(l => l.id === course.lecturer_id)
                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-bold text-primary">{course.code}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900">{course.title}</td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-700">{course.credit_units}</span> Units
                      </td>
                      <td className="py-4 px-6 capitalize">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          course.semester === 'first' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {course.semester} Sem
                        </span>
                      </td>
                      <td className="py-4 px-6">{dept ? `${dept.name} (${dept.code})` : 'General'}</td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {lecturer ? lecturer.full_name : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Academic Course</h3>
                <p className="text-xs text-slate-500">Register course curriculum and allocate lecturer</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. COS401"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Credit Units (1-6)
                  </label>
                  <select
                    value={creditUnits}
                    onChange={(e) => setCreditUnits(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map(u => (
                      <option key={u} value={u}>{u} Unit{u > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="first">First Semester</option>
                    <option value="second">Second Semester</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Course Lecturer
                </label>
                <select
                  value={lecturerId}
                  onChange={(e) => setLecturerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">-- No Lecturer Assigned --</option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name} ({l.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
