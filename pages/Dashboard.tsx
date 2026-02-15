
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Calendar,
  ArrowRight
} from 'lucide-react';
import IncidentModal from '../components/IncidentModal';
import { IncidentStatus, IncidentType, UserRole } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [counts, setCounts] = useState({ total: 0, pending: 0, resolved: 0, thisMonth: 0 });
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminOrSupervisor = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR;

  useEffect(() => {
    if (user) fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    setLoading(true);

    // Build base queries - docentes only see their own, admin/supervisor see all
    // 1. Total incidents
    let totalQuery = supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true });
    if (!isAdminOrSupervisor) {
      totalQuery = totalQuery.eq('teacher_id', user?.id);
    }
    const { count: total } = await totalQuery;

    // 2. Pending (all except Resuelta)
    let pendingQuery = supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .neq('status', IncidentStatus.RESUELTA);
    if (!isAdminOrSupervisor) {
      pendingQuery = pendingQuery.eq('teacher_id', user?.id);
    }
    const { count: pending } = await pendingQuery;

    // 3. Resolved
    let resolvedQuery = supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('status', IncidentStatus.RESUELTA);
    if (!isAdminOrSupervisor) {
      resolvedQuery = resolvedQuery.eq('teacher_id', user?.id);
    }
    const { count: resolved } = await resolvedQuery;

    // 4. This month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let monthQuery = supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth);
    if (!isAdminOrSupervisor) {
      monthQuery = monthQuery.eq('teacher_id', user?.id);
    }
    const { count: thisMonth } = await monthQuery;

    // 5. Distribution for PieChart
    let pieQuery = supabase.from('incidents').select('type');
    if (!isAdminOrSupervisor) {
      pieQuery = pieQuery.eq('teacher_id', user?.id);
    }
    const { data: allData } = await pieQuery;

    if (allData) {
      const distribution = allData.reduce((acc: any, curr: any) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {});

      const totalDist = allData.length || 1;
      setPieData([
        { name: 'Estudiante', value: Math.round(((distribution.estudiante || 0) / totalDist) * 100), color: '#5bc9d5' },
        { name: 'Aula', value: Math.round(((distribution.aula || 0) / totalDist) * 100), color: '#374151' },
        { name: 'General', value: Math.round(((distribution.general || 0) / totalDist) * 100), color: '#9ca3af' },
      ]);
    }

    setCounts({
      total: total || 0,
      pending: pending || 0,
      resolved: resolved || 0,
      thisMonth: thisMonth || 0
    });
    setLoading(false);
  };

  const monthName = new Date().toLocaleDateString('es-ES', { month: 'long' });

  const stats = [
    { label: isAdminOrSupervisor ? 'Total Registros' : 'Mis Registros', value: counts.total.toString(), icon: <FileText className="text-brand-turquoise" />, color: 'bg-brand-light' },
    { label: 'Pendientes', value: counts.pending.toString(), icon: <AlertTriangle className="text-amber-500" />, color: 'bg-amber-50' },
    { label: 'Cerradas', value: counts.resolved.toString(), icon: <CheckCircle2 className="text-emerald-500" />, color: 'bg-emerald-50' },
    { label: `Este Mes`, value: counts.thisMonth.toString(), icon: <CalendarDays className="text-violet-500" />, color: 'bg-violet-50', subtitle: monthName.charAt(0).toUpperCase() + monthName.slice(1) },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">
            Hola, <span className="text-brand-turquoise">{user?.full_name.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400 font-medium mt-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-turquoise text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 shadow-xl shadow-brand-turquoise/30 hover:bg-brand-darkTurquoise hover:-translate-y-1 transition-all"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg">Nueva Incidencia</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 flex items-center space-x-5 group transition-all">
            <div className={`p-5 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-gray-800 mt-1">{loading ? '...' : stat.value}</p>
              {'subtitle' in stat && stat.subtitle && (
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mt-0.5">{stat.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-gray-800 flex items-center space-x-3">
              <div className="w-2 h-8 bg-brand-turquoise rounded-full"></div>
              <span>Reporte Semanal</span>
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Gráfico en tiempo real sincronizado</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
          <h3 className="text-xl font-black text-gray-800 mb-10 flex items-center space-x-3">
            <div className="w-2 h-8 bg-gray-800 rounded-full"></div>
            <span>Distribución</span>
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-8">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-gray-500">{item.name}</span>
                </div>
                <span className="font-black text-gray-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <IncidentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchDashboardStats(); }} />
    </div>
  );
};

export default Dashboard;
