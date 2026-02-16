
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Tags,
  LogOut,
  FileBarChart,
  MapPin,
  Home,
  X
} from 'lucide-react';
import { AuthContext } from '../App';
import { UserRole } from '../types';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/incidencias', icon: <ClipboardList className="w-5 h-5" />, label: 'Incidencias' },
  ];

  if (user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN) {
    navItems.push(
      { to: '/reportes', icon: <FileBarChart className="w-5 h-5" />, label: 'Reportes' }
    );
  }

  if (user?.role === UserRole.ADMIN) {
    navItems.push(
      { to: '/categorias', icon: <Tags className="w-5 h-5" />, label: 'Categorías' },
      { to: '/salones', icon: <MapPin className="w-5 h-5" />, label: 'Salones' },
      { to: '/usuarios', icon: <Users className="w-5 h-5" />, label: 'Usuarios' }
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      ></div>

      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
      >
        <div className="p-8 flex flex-col items-center border-b border-gray-50 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-brand-turquoise md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
          <Logo className="w-20 h-20 mb-3" />
          <h1 className="text-xl font-black text-gray-800 tracking-tighter italic">INCIDENCIAS</h1>
          <p className="text-[10px] font-bold text-brand-turquoise uppercase tracking-widest">Valores y Ciencias</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center space-x-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${isActive
                  ? 'bg-brand-turquoise text-white shadow-lg shadow-brand-turquoise/30'
                  : 'text-gray-400 hover:text-brand-turquoise hover:bg-brand-light'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50 space-y-2">
          <button
            onClick={() => window.location.href = import.meta.env.VITE_PORTAL_URL || '/'}
            className="w-full flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-brand-celeste rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100 group"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Volver al Portal</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center space-x-4 px-4 py-3.5 w-full rounded-2xl font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }`}</style>
    </>
  );
};

export default Sidebar;
