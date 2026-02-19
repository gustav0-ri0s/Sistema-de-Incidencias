
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
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [classroomData, setClassroomData] = useState<any[]>([]);
  const [statusChartData, setStatusChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminOrSupervisor = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR;

  useEffect(() => {
    if (user) fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    setLoading(true);

    try {
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

      // 5. Data for Charts
      let dataQuery = supabase
        .from('incidents')
        .select(`
          type,
          status,
          incident_categories(name),
          classrooms(grade, section, level)
        `);

      if (!isAdminOrSupervisor) {
        dataQuery = dataQuery.eq('teacher_id', user?.id);
      }

      const { data: allRecords } = await dataQuery;

      if (allRecords) {
        // Pie Chart: Distribution by Type
        const typeDistribution = allRecords.reduce((acc: any, curr: any) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        }, {});

        const totalDist = allRecords.length || 1;
        setPieData([
          { name: 'Estudiante', value: Math.round(((typeDistribution.estudiante || 0) / totalDist) * 100), color: '#5bc9d5' },
          { name: 'Aula', value: Math.round(((typeDistribution.aula || 0) / totalDist) * 100), color: '#374151' },
          { name: 'General', value: Math.round(((typeDistribution.general || 0) / totalDist) * 100), color: '#9ca3af' },
        ]);

        // Bar Chart: Top Categories
        const catMap = allRecords.reduce((acc: any, curr: any) => {
          const name = curr.incident_categories?.name || 'Otro';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

        const sortedCats = Object.entries(catMap)
          .map(([name, count]) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setCategoryData(sortedCats);

        // Bar Chart: Ranking of Classrooms (for Admin/Supervisor)
        if (isAdminOrSupervisor) {
          const classMap = allRecords.reduce((acc: any, curr: any) => {
            if (curr.classrooms) {
              const label = `${curr.classrooms.grade}° ${curr.classrooms.section} (${curr.classrooms.level.charAt(0)})`;
              acc[label] = (acc[label] || 0) + 1;
            }
            return acc;
          }, {});

          const sortedClasses = Object.entries(classMap)
            .map(([name, count]) => ({ name, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          setClassroomData(sortedClasses);
        } else {
          // Status Management Chart (for Teachers)
          const statusMap = allRecords.reduce((acc: any, curr: any) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
          }, {});

          const statusChart = Object.entries(statusMap).map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            count: count as number
          }));
          setStatusChartData(statusChart);
        }
      }

      setCounts({
        total: total || 0,
        pending: pending || 0,
        resolved: resolved || 0,
        thisMonth: thisMonth || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
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
              <span>{isAdminOrSupervisor ? 'Resumen Institucional' : 'Mi Actividad'}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-72">
            {/* Chart 1: Categories */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categorías más Recurrentes</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                    />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#5bc9d5" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Classroom Ranking or Status */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {isAdminOrSupervisor ? 'Ranking por Aulas' : 'Estado de mis Gestiones'}
              </p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={isAdminOrSupervisor ? classroomData : statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }}
                    />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar
                      dataKey="count"
                      fill={isAdminOrSupervisor ? '#374151' : '#10b981'}
                      radius={[4, 4, 0, 0]}
                      barSize={isAdminOrSupervisor ? 30 : 40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
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
