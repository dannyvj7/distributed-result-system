import './globals.css'
import { AuthProvider } from '../lib/authContext'

export const metadata = {
  title: 'Distributed Student Result Management System',
  description: 'Enterprise Student Result Processing, Distribution, and Broadsheet Portal for Nigerian Tertiary Institutions',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-bgLight text-textColor antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
