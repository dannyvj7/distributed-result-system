'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getDepartments, addDepartment, deleteDepartment } from '../../../../lib/db'
import { Building2, Plus, Trash2, Search, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [faculty, setFaculty] = useState('Faculty of Science')
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const data = await getDepartments()
      setDepartments(data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name || !code) return

    try {
      await addDepartment({ name, code, faculty })
      setStatusMessage({ type: 'success', text: `Department "${name}" added successfully.` })
      setIsModalOpen(false)
      setName('')
      setCode('')
      loadDepartments()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to add department.' })
    }
  }

  const handleDelete = async (id, deptName) => {
    if (!confirm(`Are you sure you want to delete ${deptName}?`)) return
    try {
      await deleteDepartment(id)
      setStatusMessage({ type: 'success', text: `Department "${deptName}" removed.` })
      loadDepartments()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to delete department.' })
    }
  }

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    d.faculty.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout title="Academic Departments" roleRequired="admin">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department by name, code, or faculty..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Dept Code</th>
                <th className="py-3.5 px-6">Department Name</th>
                <th className="py-3.5 px-6">Faculty</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">Loading departments...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">No departments found matching query.</td>
                </tr>
              ) : (
                filtered.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-bold text-primary">{dept.code}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{dept.name}</td>
                    <td className="py-4 px-6 text-slate-600">{dept.faculty}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(dept.id, dept.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Academic Department</h3>
                <p className="text-xs text-slate-500">Register a degree-granting departmental unit</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CSC"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Faculty
                </label>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="Faculty of Science">Faculty of Science</option>
                  <option value="Faculty of Engineering">Faculty of Engineering</option>
                  <option value="Faculty of Environmental Sciences">Faculty of Environmental Sciences</option>
                  <option value="Faculty of Management Sciences">Faculty of Management Sciences</option>
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
