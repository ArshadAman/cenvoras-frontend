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
import BOMList from './pages/inventory/BOMList'
import StockJournalList from './pages/inventory/StockJournalList'
import PriceListList from './pages/inventory/PriceListList'
import PriceListForm from './pages/inventory/PriceListForm'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import StockValuation from './pages/reports/StockValuation'
import ExpiryReport from './pages/reports/ExpiryReport'
import ProfitLossReport from './pages/reports/ProfitLossReport'
import AuditLogList from './pages/system/AuditLogList'
import IntegrationsPage from './pages/system/IntegrationsPage'
import ProtectedRoute from './components/ProtectedRoute'
import AIChatWidget from './components/AIChatWidget'

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
          path="/boms"
          element={isAuthenticated ? <BOMList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/stock-journals"
          element={isAuthenticated ? <StockJournalList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/customers"
          element={isAuthenticated ? <Customers /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory/price-lists"
          element={isAuthenticated ? <PriceListList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory/price-lists/new"
          element={isAuthenticated ? <PriceListForm /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory/price-lists/:id"
          element={isAuthenticated ? <PriceListForm /> : <Navigate to="/" replace />}
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
          path="/reports"
          element={isAuthenticated ? <ReportsDashboard /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reports/stock-valuation"
          element={isAuthenticated ? <StockValuation /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reports/expiry"
          element={isAuthenticated ? <ExpiryReport /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reports/profit-loss"
          element={isAuthenticated ? <ProfitLossReport /> : <Navigate to="/" replace />}
        />
        <Route
          path="/audit-logs"
          element={
            isAuthenticated ? (
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AuditLogList />
              </ProtectedRoute>
            ) : <Navigate to="/" replace />
          }
        />
        <Route
          path="/integrations"
          element={
            isAuthenticated ? (
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <IntegrationsPage />
              </ProtectedRoute>
            ) : <Navigate to="/" replace />
          }
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
      {isAuthenticated && <AIChatWidget />}
    </Router>
  )
}

export default App;