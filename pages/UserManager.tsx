import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserRole, Profile, SchoolLevel } from '../types';
import { Shield, ShieldAlert, ShieldCheck, Mail, Loader2, Database } from 'lucide-react';

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_profile_status', {
        target_user_id: id,
        new_status: !currentStatus
      });

      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      alert('Error al cambiar estado: ' + err.message);
    }
  };



  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <div className="flex items-center space-x-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase"><ShieldAlert className="w-3 h-3" /><span>Admin</span></div>;
      case UserRole.SUPERVISOR: return <div className="flex items-center space-x-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase"><ShieldCheck className="w-3 h-3" /><span>Supervisor</span></div>;
      case UserRole.SECRETARIA: return <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase"><ShieldCheck className="w-3 h-3" /><span>Secretaria</span></div>;
      case UserRole.PSICOLOGA: return <div className="flex items-center space-x-1 px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full text-[10px] font-black uppercase"><ShieldCheck className="w-3 h-3" /><span>Psicología</span></div>;
      default: return <div className="flex items-center space-x-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-black uppercase"><Shield className="w-3 h-3" /><span>Docente</span></div>;
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-gray-400 font-medium">Control de acceso y perfiles institucionales</p>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-brand-turquoise animate-spin" />
          <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando Usuarios...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(u => (
            <div key={u.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center text-brand-turquoise font-black text-2xl group-hover:scale-110 transition-transform uppercase">
                  {u.full_name?.charAt(0)}
                </div>
                {getRoleBadge(u.role)}
              </div>
              <h3 className="font-black text-xl text-gray-800 tracking-tight truncate">{u.full_name}</h3>
              <div className="flex flex-col space-y-1 mt-2">
                <div className="flex items-center space-x-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{u.email || 'Sin correo sync'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-[9px] font-medium tracking-tight">
                  <Database className="w-3 h-3" />
                  <span className="truncate">ID: {u.id.substring(0, 15)}...</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  Control Acceso
                </div>
                <button
                  onClick={() => handleToggleActive(u.id, u.active || false)}
                  className={`text-xs font-black uppercase tracking-widest ${u.active ? 'text-red-500 hover:underline' : 'text-emerald-500'}`}
                >
                  {u.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}



    </div>
  );
};

export default UserManager;
