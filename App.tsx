
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, Profile } from './types';
import Dashboard from './pages/Dashboard';
import IncidentList from './pages/IncidentList';
import CategoryManager from './pages/CategoryManager';
import UserManager from './pages/UserManager';
import Reports from './pages/Reports';
import Salons from './pages/Salons';
import AuthCallback from './pages/AuthCallback';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import { supabase } from './supabase';

export const AuthContext = React.createContext<{
  user: Profile | null;
  loading: boolean;
  logout: () => void;
}>({
  user: null,
  loading: true,
  logout: () => { }
});

const ALL_ROLES = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DOCENTE, UserRole.SECRETARIA];
const SUPERVISOR_ROLES = [UserRole.ADMIN, UserRole.SUPERVISOR];
const ADMIN_ROLES = [UserRole.ADMIN];

const App: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function handleSession(session: any) {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            setUser(profile as Profile);
          }
        } catch (err) {
          console.error('Profile fetch exception:', err);
        }
      } else {
        if (mounted) {
          setUser(null);
        }
      }
      if (mounted) setLoading(false);
    }

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = import.meta.env.VITE_PORTAL_URL || 'https://portal-vc-academico.vercel.app';
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-brand-light">
      <div className="w-16 h-16 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-black text-brand-turquoise uppercase tracking-widest text-xs">Iniciando Sistema...</p>
    </div>
  );

  const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex min-h-screen bg-brand-light relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="p-4 md:p-8 flex-1 overflow-auto">
          {children}
        </main>
        <footer className="p-6 text-center border-t border-gray-100 bg-white/50 backdrop-blur-sm">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em]">
            Sistema de Gestión de Incidencias Educativas - Valores y Ciencias {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <RequireAuth allowedRoles={ALL_ROLES}>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/incidencias"
          element={
            <RequireAuth allowedRoles={ALL_ROLES}>
              <Layout>
                <IncidentList />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/reportes"
          element={
            <RequireAuth allowedRoles={SUPERVISOR_ROLES}>
              <Layout>
                <Reports />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/categorias"
          element={
            <RequireAuth allowedRoles={ADMIN_ROLES}>
              <Layout>
                <CategoryManager />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/salones"
          element={
            <RequireAuth allowedRoles={ADMIN_ROLES}>
              <Layout>
                <Salons />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RequireAuth allowedRoles={ADMIN_ROLES}>
              <Layout>
                <UserManager />
              </Layout>
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
};

export default App;
