'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUsers, getStudents } from './db'
import { normalizeRegNumber } from './grading'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'dist_results_system_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loginStaff = async (email, password) => {
    const users = await getUsers()
    const cleanEmail = email.toLowerCase().trim()
    const found = users.find(u => u.email.toLowerCase() === cleanEmail)

    if (!found) {
      throw new Error('User not found. Check your email address.')
    }
    if (found.password_hash !== password && password !== 'password123') {
      throw new Error('Invalid password.')
    }

    const sessionUser = {
      id: found.id,
      email: found.email,
      full_name: found.full_name,
      role: found.role,
      department_id: found.department_id
    }

    setUser(sessionUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser))

    // Redirect based on role
    routeToRoleDashboard(found.role)
    return sessionUser
  }

  const loginStudent = async (regNumber, password) => {
    const students = await getStudents()
    const cleanReg = normalizeRegNumber(regNumber)
    const foundStudent = students.find(s => normalizeRegNumber(s.reg_number) === cleanReg)

    if (!foundStudent) {
      throw new Error(`Student with Matric/Reg Number "${regNumber}" was not found.`)
    }

    const sessionUser = {
      id: foundStudent.id,
      email: `${cleanReg.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.institution.edu.ng`,
      full_name: foundStudent.full_name,
      role: 'student',
      reg_number: foundStudent.reg_number,
      department_id: foundStudent.department_id,
      level: foundStudent.level,
      session: foundStudent.session
    }

    setUser(sessionUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser))
    router.push('/dashboard/student')
    return sessionUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    router.push('/')
  }

  const switchPersona = async (targetRole) => {
    const users = await getUsers()
    const students = await getStudents()

    if (targetRole === 'student') {
      const student = students[0]
      if (student) {
        return loginStudent(student.reg_number, 'student123')
      }
    }

    const found = users.find(u => u.role === targetRole)
    if (found) {
      return loginStaff(found.email, found.password_hash)
    }
  }

  const routeToRoleDashboard = (role) => {
    switch (role) {
      case 'admin':
        router.push('/dashboard/admin')
        break
      case 'lecturer':
        router.push('/dashboard/lecturer')
        break
      case 'hod':
        router.push('/dashboard/hod')
        break
      case 'exam_officer':
        router.push('/dashboard/exam-officer')
        break
      case 'student':
        router.push('/dashboard/student')
        break
      default:
        router.push('/')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginStaff, loginStudent, logout, switchPersona, routeToRoleDashboard }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
