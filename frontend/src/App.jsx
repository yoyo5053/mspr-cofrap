import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CreateAccount from './pages/CreateAccount'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Renew from './pages/Renew'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/renew" element={
            <ProtectedRoute>
              <Renew />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App