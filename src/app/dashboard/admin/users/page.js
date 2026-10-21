'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { getUsers, getDepartments, addUser, updateUser, deleteUser } from '../../../../lib/db'
import { useAuth } from '../../../../lib/authContext'
import { UserCheck, Plus, Search, CheckCircle, AlertCircle, Shield, Pencil, Trash2 } from 'lucide-react'

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password123')
  const [role, setRole] = useState('lecturer')
  const [departmentId, setDepartmentId] = useState('')

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('lecturer')
  const [editDepartmentId, setEditDepartmentId] = useState('')
  const [editPassword, setEditPassword] = useState('')

  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usrs, depts] = await Promise.all([getUsers(), getDepartments()])
      setUsers(usrs)
      setDepartments(depts)
      if (depts.length > 0) setDepartmentId(depts[0].id)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!fullName || !email) return

    try {
      await addUser({
        full_name: fullName,
        email,
        password,
        role,
        department_id: departmentId
      })
      setStatusMessage({ type: 'success', text: `Staff user "${fullName}" registered successfully.` })
      setIsModalOpen(false)
      setFullName('')
      setEmail('')
      loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error adding user.' })
    }
  }

  const handleOpenEdit = (user) => {
    setEditingUserId(user.id)
    setEditFullName(user.full_name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditDepartmentId(user.department_id || (departments[0]?.id || ''))
    setEditPassword('')
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingUserId || !editFullName || !editEmail) return

    try {
      await updateUser(editingUserId, {
        full_name: editFullName,
        email: editEmail,
        role: editRole,
        department_id: editDepartmentId,
        password: editPassword || undefined
      })
      setStatusMessage({ type: 'success', text: `Staff details for "${editFullName}" updated successfully.` })
      setIsEditModalOpen(false)
      setEditingUserId(null)
      loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update user.' })
    }
  }

  const handleDelete = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id) {
      alert('You cannot delete your own active administrator account.')
      return
    }

    if (!confirm(`Are you sure you want to remove staff member "${userToDelete.full_name}" (${userToDelete.email})?`)) {
      return
    }

    try {
      await deleteUser(userToDelete.id)
      setStatusMessage({ type: 'success', text: `Staff member "${userToDelete.full_name}" has been removed.` })
      loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error deleting user.' })
    }
  }

  const filtered = users.filter(u => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const roleBadges = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    lecturer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    hod: 'bg-amber-50 text-amber-700 border-amber-200',
    exam_officer: 'bg-purple-50 text-purple-700 border-purple-200',
    student: 'bg-blue-50 text-blue-700 border-blue-200'
  }

  return (
    <DashboardLayout title="Staff User Accounts & Privileges" roleRequired="admin">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1 flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by staff name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="hod">HOD</option>
            <option value="lecturer">Lecturer</option>
            <option value="exam_officer">Exam Officer</option>
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Staff Name</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Institutional Role</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Loading user accounts...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">No matching staff accounts found.</td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const dept = departments.find(d => d.id === u.department_id)
                  const isCurrent = u.id === currentUser?.id

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {u.full_name} {isCurrent && <span className="text-[10px] text-primary font-bold bg-blue-50 px-1.5 py-0.5 rounded ml-1">(You)</span>}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">{u.email}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadges[u.role] || 'bg-slate-100 text-slate-700'}`}>
                          {u.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">{dept ? `${dept.name} (${dept.code})` : 'Institution-wide'}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                            title="Edit Staff Member"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition ${
                              isCurrent
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isCurrent ? 'Cannot delete active account' : 'Delete Staff Member'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Staff Account</h3>
                <p className="text-xs text-slate-500">Assign role and institutional department</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name & Title
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ngozi Chidi"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ngozi.chidi@institution.edu.ng"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="lecturer">Lecturer (Course Scoring & CA Upload)</option>
                  <option value="hod">HOD (Approval, Signature & Result Distribution)</option>
                  <option value="exam_officer">Exam Officer (Broadsheet & Complaints)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Department
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Default Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono text-xs"
                />
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Staff Member</h3>
                <p className="text-xs text-slate-500">Update staff profile, role, or department</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name & Title
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="lecturer">Lecturer (Course Scoring & CA Upload)</option>
                  <option value="hod">HOD (Approval, Signature & Result Distribution)</option>
                  <option value="exam_officer">Exam Officer (Broadsheet & Complaints)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Department
                </label>
                <select
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="New password (optional)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
