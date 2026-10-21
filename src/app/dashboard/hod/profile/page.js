'use client'

import React, { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import { useAuth } from '../../../../lib/authContext'
import { getDepartments, getHodProfile, saveHodProfile } from '../../../../lib/db'
import { PenTool, CheckCircle, AlertCircle, Trash2, Upload, ShieldCheck } from 'lucide-react'

export default function HodProfilePage() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [fullName, setFullName] = useState('')
  const [rank, setRank] = useState('Professor of Computer Science')
  const [departmentId, setDepartmentId] = useState('')
  const [phone, setPhone] = useState('')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  // Canvas drawing ref
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const [depts, profile] = await Promise.all([
        getDepartments(),
        getHodProfile(user?.id)
      ])
      setDepartments(depts)

      if (profile) {
        setFullName(profile.full_name || '')
        setRank(profile.rank || 'Professor')
        setDepartmentId(profile.department_id || (depts[0]?.id || ''))
        setPhone(profile.phone || '')
        setSignatureUrl(profile.signature_url || '')
      } else {
        setFullName(user?.full_name || '')
        setDepartmentId(user?.department_id || (depts[0]?.id || ''))
      }
    }
    loadProfile()
  }, [user])

  // Canvas mouse/touch drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1E3A8A' // Navy Blue signature ink

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      setSignatureUrl(canvas.toDataURL('image/png'))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureUrl('')
  }

  // Handle uploaded signature image
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setSignatureUrl(evt.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName || !departmentId) return
    setSaving(true)
    try {
      await saveHodProfile({
        user_id: user?.id,
        full_name: fullName,
        rank,
        department_id: departmentId,
        phone,
        signature_url: signatureUrl
      })
      setStatusMessage({ type: 'success', text: 'HOD profile & digital signature updated successfully.' })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error saving profile.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="HOD Profile & Digital Signature" roleRequired="hod">
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal & Departmental Info */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Departmental Leadership Information</h3>
            <p className="text-xs text-slate-500 mb-5">
              These details and signature are affixed to official result sheets and inter-departmental broadsheets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name & Title
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Prof. Babatunde Adeleke"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Rank / Designation
                </label>
                <input
                  type="text"
                  required
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="e.g. Professor of Computer Science"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Phone Contact
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Digital Signature Pad */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-primary" />
                  Official Digital Signature Capture
                </h3>
                <p className="text-xs text-slate-500">
                  Draw your signature on the pad below or upload a clean signature image
                </p>
              </div>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Pad
              </button>
            </div>

            {/* Drawing canvas */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 bg-slate-50/50 flex flex-col items-center justify-center">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="bg-white rounded-lg border border-slate-200 cursor-crosshair shadow-inner max-w-full"
              />
              <span className="text-[11px] text-slate-400 mt-2">
                Sign inside the box using your mouse or touchscreen
              </span>
            </div>

            {/* Alternative File Upload & Preview */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Signature Image (.png / .jpg)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>

              {signatureUrl && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-xs font-bold text-primary">Active Signature:</span>
                  <img
                    src={signatureUrl}
                    alt="HOD Signature Preview"
                    className="h-10 max-w-[150px] object-contain bg-white rounded p-1 border border-slate-200"
                  />
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {saving ? 'Updating Profile...' : 'Save HOD Profile & Signature'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
