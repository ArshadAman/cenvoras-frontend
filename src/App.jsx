import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ContactUs from './pages/ContactUs'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Sitemap from './pages/Sitemap'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Purchase from './pages/Purchase'
import PurchaseOrders from './pages/PurchaseOrders'
import Sales from './pages/Sales'
import Quotations from './pages/Quotations'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Vendors from './pages/Vendors'
import Payments from './pages/Payments'
import Ledger from './pages/Ledger'
import Profile from './pages/Profile'
import SalesOrderList from './pages/SalesOrderList'
import ComingSoon from './pages/ComingSoon'
import BOMList from './pages/inventory/BOMList'
import StockJournalList from './pages/inventory/StockJournalList'
import BatchListPage from './pages/inventory/BatchListPage'
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
import ModuleProtectedRoute from './components/ModuleProtectedRoute'
import AIChatWidget from './components/AIChatWidget'
import TeamSettings from './pages/settings/TeamSettings'
import Warranty from './pages/Warranty'

// Critical Gap Pages
import GSTDashboard from './pages/reports/GSTDashboard'
import TaxRegister from './pages/reports/TaxRegister'
import CreditNoteList from './pages/CreditNoteList'
import DebitNoteList from './pages/DebitNoteList'
import ProfitLossStatement from './pages/reports/ProfitLossStatement'
import BalanceSheet from './pages/reports/BalanceSheet'
import BankReconciliation from './pages/financial/BankReconciliation'
import ManualJournal from './pages/financial/ManualJournal'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const getToken = () => !!localStorage.getItem('token')

function App() {
  // Persist login across refresh as long as a token exists.
  const [isAuthenticated, setIsAuthenticated] = useState(getToken())

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" newestOnTop style={{ zIndex: 2147483647 }} />
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={(rememberMe) => {
            void rememberMe;
            setIsAuthenticated(true);
          }} />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/sitemap" element={<Sitemap />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard onLogout={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('role');
            localStorage.removeItem('activeSession');
            setIsAuthenticated(false);
          }} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/purchase"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="purchases"><Purchase /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/purchase-orders"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="purchases"><PurchaseOrders /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/sales"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="sales"><Sales /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/quotations"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="sales"><Quotations /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/sales-orders"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="sales"><SalesOrderList /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/delivery-challans"
          element={isAuthenticated ? <ComingSoon /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="inventory"><Inventory /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/boms"
          element={isAuthenticated ? <Navigate to="/coming-soon" replace /> : <Navigate to="/" replace />}
        />
        <Route
          path="/stock-journals"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="inventory"><StockJournalList /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/warehouses"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="inventory"><WarehouseManagement /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/batches"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="inventory"><BatchListPage /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/customers"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="sales"><Customers /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/vendors"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="purchases"><Vendors /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory/price-lists"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="inventory"><PriceListList /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory/price-lists/new"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="inventory"><PriceListForm /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory/price-lists/:id"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="inventory"><PriceListForm /></ModuleProtectedRoute> : <Navigate to="/" replace />}
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
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="sales"><CreditNoteList /></ModuleProtectedRoute> : <Navigate to="/" replace />}
        />
        <Route
          path="/debit-notes"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="purchases"><DebitNoteList /></ModuleProtectedRoute> : <Navigate to="/" replace />}
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
          path="/ledger/manual-journal"
          element={isAuthenticated ? <ManualJournal /> : <Navigate to="/" replace />}
        />
        <Route
          path="/warranty"
          element={isAuthenticated ? <ModuleProtectedRoute moduleKey="sales"><Warranty /></ModuleProtectedRoute> : <Navigate to="/" replace />}
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
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('role');
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