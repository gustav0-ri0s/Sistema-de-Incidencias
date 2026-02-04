
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, Profile } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncidentList from './pages/IncidentList';
import CategoryManager from './pages/CategoryManager';
import UserManager from './pages/UserManager';
import Reports from './pages/Reports';
import Salons from './pages/Salons';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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

const App: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          handleSession(session);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) setLoading(false);
      }
    }

    async function handleSession(session: any) {
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error feching profile:', error);
            // If profile fetch fails, we might still want to respect the auth session 
            // but user object will be incomplete. 
            // However, to avoid "infinite loading", we proceed.
          }

          if (mounted) {
            if (profile) {
              setUser(profile as Profile);
            } else {
              // Fallback if profile doesn't exist yet but user is auth'd
              // Maybe create a temporary profile object or just set user to null
              console.warn('User authenticated but no profile found');
            }
          }
        } catch (err) {
          console.error('Profile fetch exception:', err);
        }
      } else {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-brand-light">
      <div className="w-16 h-16 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-black text-brand-turquoise uppercase tracking-widest text-xs">Iniciando Sistema...</p>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      <HashRouter>
        <Routes>
          {!user ? (
            <Route path="*" element={<Login />} />
          ) : (
            <Route
              path="*"
              element={
                <div className="flex min-h-screen bg-brand-light relative">
                  <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                  <div className="flex-1 flex flex-col min-w-0">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="p-4 md:p-8 flex-1 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/incidencias" element={<IncidentList />} />

                        {(user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN) && (
                          <Route path="/reportes" element={<Reports />} />
                        )}

                        {(user.role === UserRole.ADMIN) && (
                          <>
                            <Route path="/categorias" element={<CategoryManager />} />
                            <Route path="/salones" element={<Salons />} />
                            <Route path="/usuarios" element={<UserManager />} />
                          </>
                        )}

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                    <footer className="p-6 text-center border-t border-gray-100 bg-white/50 backdrop-blur-sm">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em]">
                        Sistema de Gestión de Incidencias Educativas - Valores y Ciencias {new Date().getFullYear()}
                      </p>
                    </footer>
                  </div>
                </div>
              }
            />
          )}
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
