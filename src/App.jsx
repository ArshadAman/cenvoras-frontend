import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Sitemap from './pages/Sitemap'
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
import ComingSoon from './pages/ComingSoon'
import BOMList from './pages/inventory/BOMList'
import StockJournalList from './pages/inventory/StockJournalList'
import PriceListList from './pages/inventory/PriceListList'
import PriceListForm from './pages/inventory/PriceListForm'
import WarehouseManagement from './pages/inventory/WarehouseManagement'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import StockValuation from './pages/reports/StockValuation'
import ExpiryReport from './pages/reports/ExpiryReport'
import ProfitLossReport from './pages/reports/ProfitLossReport'
import ShortageReport from './pages/reports/ShortageReport'
import StockLedgerReport from './pages/reports/StockLedgerReport'
import AuditLogList from './pages/system/AuditLogList'
import IntegrationsPage from './pages/system/IntegrationsPage'
import ProtectedRoute from './components/ProtectedRoute'
import AIChatWidget from './components/AIChatWidget'
import TeamSettings from './pages/settings/TeamSettings'

// Critical Gap Pages
import GSTDashboard from './pages/reports/GSTDashboard'
import TaxRegister from './pages/reports/TaxRegister'
import CreditNoteList from './pages/CreditNoteList'
import DebitNoteList from './pages/DebitNoteList'
import ProfitLossStatement from './pages/reports/ProfitLossStatement'
import BalanceSheet from './pages/reports/BalanceSheet'
import BankReconciliation from './pages/financial/BankReconciliation'

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
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/sitemap" element={<Sitemap />} />
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
          element={isAuthenticated ? <ComingSoon /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory"
          element={isAuthenticated ? <Inventory /> : <Navigate to="/" replace />}
        />
        <Route
          path="/boms"
          element={isAuthenticated ? <Navigate to="/coming-soon" replace /> : <Navigate to="/" replace />}
        />
        <Route
          path="/stock-journals"
          element={isAuthenticated ? <StockJournalList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/warehouses"
          element={isAuthenticated ? <WarehouseManagement /> : <Navigate to="/" replace />}
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
          path="/reports/shortage"
          element={isAuthenticated ? <ShortageReport /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reports/stock-ledger"
          element={isAuthenticated ? <StockLedgerReport /> : <Navigate to="/" replace />}
        />
        {/* Critical Gap Routes */}
        <Route
          path="/gst"
          element={isAuthenticated ? <GSTDashboard /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reports/tax-register"
          element={isAuthenticated ? <TaxRegister /> : <Navigate to="/" replace />}
        />
        <Route
          path="/credit-notes"
          element={isAuthenticated ? <CreditNoteList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/debit-notes"
          element={isAuthenticated ? <DebitNoteList /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reports/profit-loss-statement"
          element={isAuthenticated ? <ProfitLossStatement /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reports/balance-sheet"
          element={isAuthenticated ? <BalanceSheet /> : <Navigate to="/" replace />}
        />
        <Route
          path="/bank-reconciliation"
          element={isAuthenticated ? <BankReconciliation /> : <Navigate to="/" replace />}
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
                <IntegrationsPage />
            ) : <Navigate to="/" replace />
          }
        />
        <Route
          path="/coming-soon"
          element={isAuthenticated ? <ComingSoon /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile onLogout={() => {
            localStorage.removeItem('activeSession');
            setIsAuthenticated(false);
          }} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/settings/team"
          element={
            isAuthenticated ? (
              <ProtectedRoute allowedRoles={['admin']}>
                <TeamSettings />
              </ProtectedRoute>
            ) : <Navigate to="/" replace />
          }
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