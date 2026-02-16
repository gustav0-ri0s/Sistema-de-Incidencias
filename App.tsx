
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, Profile } from './types';
import { ShieldAlert, AlertCircle, LogOut } from 'lucide-react';
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
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function handleSession(session: any) {
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            if (profile) {
              const p = profile as Profile;
              if (!p.active) {
                setIsDeactivated(true);
                setShowDeactivatedModal(true);
              } else {
                setIsDeactivated(false);
                setShowDeactivatedModal(false);
              }
              setUser(p);
            }
          }
        } catch (err) {
          console.error('Profile fetch exception:', err);
        }
      } else {
        if (mounted) {
          setUser(null);
          // Solo cerramos el modal si NO estamos en estado de desactivado
          // para evitar el parpadeo si la sesión se pierde momentáneamente
          if (!isDeactivated) {
            setShowDeactivatedModal(false);
          }
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
  }, [isDeactivated]);

  const handleLogout = async () => {
    setIsDeactivated(false);
    setShowDeactivatedModal(false);
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
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      <HashRouter>
        <Routes>
          {(!user && !isDeactivated) ? (
            <Route path="*" element={<Login />} />
          ) : isDeactivated ? (
            <Route path="*" element={<div className="h-screen bg-brand-light" />} />
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

      {/* MODAL DE CUENTA DESACTIVADA */}
      {showDeactivatedModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border-4 border-red-50 animate-in zoom-in-95 duration-300">
            <div className="bg-red-500 p-10 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <ShieldAlert className="w-64 h-64 -ml-20 -mt-20 rotate-12" />
              </div>
              <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <ShieldAlert className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter relative z-10">ACCESO DENEGADO</h2>
            </div>

            <div className="p-10 text-center space-y-6">
              <div className="space-y-4">
                <p className="text-gray-600 font-bold leading-relaxed">
                  Lo sentimos, <span className="text-gray-900 font-black">{user?.full_name}</span>.
                  Su cuenta ha sido <span className="text-red-500 font-black uppercase underline decoration-2 underline-offset-4">desactivada</span> para realizar incidencias.
                </p>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start space-x-3 text-left">
                  <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-relaxed">
                    Si cree que esto es un error o necesita recuperar su acceso, por favor contacte al administrador:
                    <br />
                    <span className="text-brand-turquoise font-black lowercase tracking-normal text-xs mt-1 block select-all">informatica@muivc.com</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-xl active:scale-95"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-lg uppercase tracking-tight">Entendido, Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default App;
