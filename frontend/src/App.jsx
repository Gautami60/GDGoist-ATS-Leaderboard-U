import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ClickSpark from './components/animations/ClickSpark'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ClickSpark
            sparkColor="#c9965c"
            sparkSize={12}
            sparkRadius={20}
            sparkCount={10}
            duration={500}
          >
            <AppRoutes />
          </ClickSpark>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}
