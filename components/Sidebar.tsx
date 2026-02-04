
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Tags,
  LogOut,
  FileBarChart,
  MapPin
} from 'lucide-react';
import { AuthContext } from '../App';
import { UserRole } from '../types';
import Logo from './Logo';

const Sidebar: React.FC = () => {
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
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
      <div className="p-8 flex flex-col items-center border-b border-gray-50">
        <Logo className="w-20 h-20 mb-3" />
        <h1 className="text-xl font-black text-gray-800 tracking-tighter italic">INCIDENCIAS</h1>
        <p className="text-[10px] font-bold text-brand-turquoise uppercase tracking-widest">Valores y Ciencias</p>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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

      <div className="p-6 border-t border-gray-50">
        <button
          onClick={logout}
          className="flex items-center space-x-4 px-4 py-3.5 w-full rounded-2xl font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
