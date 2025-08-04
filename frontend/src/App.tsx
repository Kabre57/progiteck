import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DarkModeProvider } from '@/hooks/useDarkMode';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import TechniciensPage from '@/pages/TechniciensPage';
import MissionsPage from '@/pages/MissionsPage';
import InterventionsPage from '@/pages/InterventionsPage';
import SpecialitesPage from '@/pages/SpecialitesPage';
import DevisPage from '@/pages/DevisPage';
import TypesPaiementPage from '@/pages/TypesPaiementPage';
import FacturesPage from '@/pages/FacturesPage';
import RapportsPage from '@/pages/RapportsPage';
import MessagesPage from '@/pages/MessagesPage';
import NotificationsPage from '@/pages/NotificationsPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import StockPage from '@/pages/StockPage';

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <DarkModeProvider>
          <div className="app">
            <Suspense 
              fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Chargement...</span>
                  </div>
                </div>
              }
            >
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/clients" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager', 'commercial']}>
                    <ClientsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/techniciens" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager']}>
                    <TechniciensPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/specialites" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager']}>
                    <SpecialitesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/missions" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager', 'commercial']}>
                    <MissionsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/interventions" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager', 'technicien']}>
                    <InterventionsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/stock" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager']}>
                    <StockPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/materiel" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager']}>
                    <StockPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/devis" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager', 'commercial']}>
                    <DevisPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/types-paiement" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager']}>
                    <TypesPaiementPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/factures" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager', 'commercial']}>
                    <FacturesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/rapports" element={
                  <ProtectedRoute requiredRoles={['admin', 'manager', 'technicien']}>
                    <RapportsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UsersPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </DarkModeProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;