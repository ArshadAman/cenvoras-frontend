import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Purchase from './pages/Purchase'
import Sales from './pages/Sales'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Ledger from './pages/Ledger'
import Profile from './pages/Profile'
import SalesOrderList from './pages/SalesOrderList'
import DeliveryChallanList from './pages/DeliveryChallanList'

const getToken = () => !!localStorage.getItem('token')
const getActiveSession = () => !!localStorage.getItem('activeSession')

function App() {
  // Only auto-authenticate if there's both a token AND an active session
  const [isAuthenticated, setIsAuthenticated] = useState(getToken() && getActiveSession())

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => {
            localStorage.setItem('activeSession', 'true');
            setIsAuthenticated(true);
          }} />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard onLogout={() => {
            localStorage.removeItem('activeSession');
            setIsAuthenticated(false);
          }} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/purchase"
          element={isAuthenticated ? <Purchase /> : <Navigate to="/" replace />}
        />
        <Route
          path="/sales"
          element={isAuthenticated ? <Sales /> : <Navigate to="/" replace />}
        />
        <Route
          path="/sales-orders"
          element={isAuthenticated ? <SalesOrderList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/delivery-challans"
          element={isAuthenticated ? <DeliveryChallanList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory"
          element={isAuthenticated ? <Inventory /> : <Navigate to="/" replace />}
        />
        <Route
          path="/customers"
          element={isAuthenticated ? <Customers /> : <Navigate to="/" replace />}
        />
        <Route
          path="/payments"
          element={isAuthenticated ? <Payments /> : <Navigate to="/" replace />}
        />
        <Route
          path="/ledger"
          element={isAuthenticated ? <Ledger /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile onLogout={() => {
            localStorage.removeItem('activeSession');
            setIsAuthenticated(false);
          }} /> : <Navigate to="/" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </Router>
  )
}

export default App;