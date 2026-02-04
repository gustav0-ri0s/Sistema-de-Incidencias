
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';
import { UserCircle, Bell, Search, Wifi, WifiOff, Loader2, Menu } from 'lucide-react';
import { supabase } from '../supabase';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useContext(AuthContext);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const verifyConnection = async () => {
      try {
        // Intentamos una consulta mínima para verificar que el cliente y la DB responden
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (error) throw error;
        setDbStatus('connected');
      } catch (err) {
        console.error('Error de conexión con Supabase:', err);
        setDbStatus('error');
      }
    };

    verifyConnection();
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 backdrop-blur-md bg-white/80">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-400 hover:text-brand-turquoise hover:bg-brand-light rounded-xl transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 hidden lg:block"></div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Indicador de Conexión Real-time */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border transition-all duration-500 ${dbStatus === 'connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
          dbStatus === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
            'bg-gray-50 border-gray-100 text-gray-400'
          }`}>
          {dbStatus === 'checking' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : dbStatus === 'connected' ? (
            <Wifi className="w-4 h-4 animate-pulse" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
            {dbStatus === 'checking' ? 'Conectando...' : dbStatus === 'connected' ? 'En línea' : 'Sin conexión'}
          </span>
        </div>

        <button className="text-gray-400 hover:text-brand-turquoise transition-all relative p-2 rounded-xl hover:bg-brand-light">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center space-x-4 pl-6 border-l border-gray-100">
          <div className="text-right">
            <p className="text-sm font-black text-gray-800 leading-none">
              {user?.full_name}
            </p>
            <p className="text-[10px] font-bold text-brand-turquoise uppercase tracking-widest mt-1">
              {user?.role}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center border-2 border-brand-turquoise/20">
            <UserCircle className="w-8 h-8 text-brand-turquoise" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
