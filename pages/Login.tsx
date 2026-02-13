
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('active')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile?.active) {
          await supabase.auth.signOut();
          setError('No puede iniciar sesión en el sistema de incidencias porque su cuenta está desactivada.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-brand-turquoise/20 overflow-hidden border border-brand-turquoise/20">
          <div className="bg-brand-turquoise p-10 text-center text-white relative">
            <div className="inline-block bg-white p-4 rounded-3xl shadow-lg mb-6">
              <Logo className="w-20 h-20" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">INCIDENCIAS</h1>
            <p className="text-white/80 font-bold text-xs mt-2 uppercase tracking-widest">Sistema de Incidencias</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-black uppercase leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Correo Electrónico</label>
              <input
                type="email"
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-brand-turquoise outline-none transition-all text-gray-700 font-bold"
                placeholder="ejemplo@vctarapoto.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Contraseña Segura</label>
              <input
                type="password"
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-brand-turquoise outline-none transition-all text-gray-700 font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-turquoise text-white font-black py-5 rounded-2xl hover:bg-brand-darkTurquoise transition-all flex items-center justify-center space-x-3 shadow-xl shadow-brand-turquoise/40 disabled:opacity-50 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  <span className="text-lg">Entrar al Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
        I.E.P. Valores y Ciencias &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default Login;
