import React, { useState } from 'react';
import { supabase } from '../supabase';
import {
  FileText,
  Search,
  Download,
  Printer,
  Filter,
  UserCheck,
  Building,
  CheckCircle2,
  Globe,
  Tag,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Incident, SchoolLevel, IncidentCategory, IncidentStatus } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfMonth, startOfYear, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'global' | 'classroom' | 'student' | 'category' | 'status'>('global');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const [level, setLevel] = useState<SchoolLevel>(SchoolLevel.SECUNDARIA);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>(IncidentStatus.REGISTRADA);

  // Date Filters
  const [dateRangeType, setDateRangeType] = useState<'all' | '7days' | 'month' | 'year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  React.useEffect(() => {
    fetchCategories();
    fetchClassrooms();
  }, []);

  React.useEffect(() => {
    fetchReportData();
  }, [activeReport, level, grade, section, studentSearch, selectedCategoryId, selectedStatus, dateRangeType, customStartDate, customEndDate]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('incident_categories').select('*').eq('active', true).order('name');
    if (data) setCategories(data);
  };

  const fetchClassrooms = async () => {
    const { data } = await supabase.from('classrooms').select('*').eq('active', true).order('grade');
    if (data) setClassrooms(data);
  };

  // Helper to get unique grades for selection
  const availableGrades = Array.from(new Set(classrooms.filter(c => c.level === level).map(c => c.grade))).sort();
  // Helper to get unique sections for selection based on grade
  const availableSections = classrooms.filter(c => c.level === level && c.grade === grade).map(c => c.section).sort();

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          profiles:teacher_id(full_name),
          incident_categories:category_id(name),
          classrooms:classroom_id(level, grade, section),
          incident_participants(students(first_name, last_name))
        `)
        .order('created_at', { ascending: false });

      if (activeReport === 'classroom') {
        const selectedClass = classrooms.find(c => c.level === level && (grade ? c.grade === grade : true) && (section ? c.section === section : true));
        if (selectedClass && grade && section) {
          query = query.eq('classroom_id', selectedClass.id);
        } else {
          query = query.eq('level', level);
          if (grade) query = query.ilike('grade', `%${grade}%`);
          if (section) query = query.ilike('section', `%${section}%`);
        }
      } else if (activeReport === 'status') {
        query = query.eq('status', selectedStatus);
      } else if (activeReport === 'category' && selectedCategoryId !== 'all') {
        query = query.eq('category_id', parseInt(selectedCategoryId));
      }

      // Date Filtering
      if (dateRangeType !== 'all') {
        let startDate: Date | null = null;
        if (dateRangeType === '7days') startDate = subDays(new Date(), 7);
        else if (dateRangeType === 'month') startDate = startOfMonth(new Date());
        else if (dateRangeType === 'year') startDate = startOfYear(new Date());
        else if (dateRangeType === 'custom') startDate = new Date(customStartDate);

        if (startDate) {
          query = query.gte('incident_date', startDate.toISOString());
        }

        if (dateRangeType === 'custom' && customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          query = query.lte('incident_date', endDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      let results = data || [];

      if (activeReport === 'student' && studentSearch) {
        results = results.filter(inc =>
          inc.incident_participants?.some((p: any) =>
            `${p.students?.first_name} ${p.students?.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
          ) ||
          inc.involved_students?.some((s: any) =>
            `${s.names} ${s.lastNames}`.toLowerCase().includes(studentSearch.toLowerCase())
          )
        );
      }

      setPreviewData(results);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    try {
      if (previewData.length === 0) {
        alert("No hay datos para exportar.");
        return;
      }

      setLoading(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Colors based on type
      const colors: Record<string, [number, number, number]> = {
        global: [91, 201, 213],
        classroom: [91, 201, 213],
        student: [55, 65, 81],
        category: [79, 70, 129],
        status: [16, 185, 129]
      };

      const currentColor = colors[activeReport] || [91, 201, 213];

      doc.setFillColor(...currentColor);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('I.E.P. VALORES Y CIENCIAS', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(12);
      const titles: Record<string, string> = {
        global: 'REPORTE GLOBAL DE INCIDENCIAS',
        classroom: `REPORTE: ${level.toUpperCase()} - ${grade} "${section}"`,
        student: `HISTORIAL: ${studentSearch.toUpperCase()}`,
        category: `CATEGORÍA: ${categories.find(c => c.id === parseInt(selectedCategoryId))?.name || 'General'}`,
        status: `ESTADO: ${selectedStatus.toUpperCase()}`
      };

      let periodText = 'Periodo: Histórico Total';
      if (dateRangeType === '7days') periodText = 'Periodo: Últimos 7 días';
      else if (dateRangeType === 'month') periodText = 'Periodo: Este Mes';
      else if (dateRangeType === 'year') periodText = 'Periodo: Todo el Año';
      else if (dateRangeType === 'custom') periodText = `Periodo: ${format(new Date(customStartDate), 'dd/MM/yyyy')} al ${format(new Date(customEndDate), 'dd/MM/yyyy')}`;

      doc.text(titles[activeReport] || 'REPORTE', pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(periodText, pageWidth / 2, 35, { align: 'center' });

      autoTable(doc, {
        startY: 50,
        head: [['Código', 'Fecha', 'Alumno(s)', 'Conducta', 'Estado']],
        body: previewData.map(inc => [
          inc.correlative,
          new Date(inc.incident_date).toLocaleDateString(),
          inc.incident_participants?.length > 0
            ? inc.incident_participants.map((p: any) => `${p.students?.first_name} ${p.students?.last_name}`).join(', ')
            : inc.involved_students?.map((s: any) => `${s.names} ${s.lastNames}`).join(', ') || 'N/A',
          inc.incident_categories?.name || inc.other_category_suggestion || 'Otro',
          inc.status.toUpperCase()
        ]),
        theme: 'grid',
        headStyles: { fillColor: currentColor }
      });

      const fileName = `reporte-${activeReport}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      alert("Error al generar el PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Centro de Reportes</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[
          { id: 'global', label: 'Global', icon: Globe, color: 'indigo' },
          { id: 'classroom', label: 'Por Aula', icon: Building, color: 'brand-turquoise' },
          { id: 'student', label: 'Por Alumno', icon: UserCheck, color: 'gray-800' },
          { id: 'category', label: 'Por Categoría', icon: Tag, color: 'amber-500' },
          { id: 'status', label: 'Por Estado', icon: Activity, color: 'emerald-600' }
        ].map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id as any)}
            className={`px-6 py-3.5 rounded-2xl border-2 transition-all flex items-center space-x-3 group ${activeReport === report.id
              ? `bg-${report.id === 'classroom' ? 'brand-turquoise' : report.id === 'category' ? 'amber-500' : report.id === 'status' ? 'emerald-600' : report.id === 'student' ? 'gray-800' : 'indigo-600'} border-${report.id === 'classroom' ? 'brand-turquoise' : report.id === 'category' ? 'amber-500' : report.id === 'status' ? 'emerald-600' : report.id === 'student' ? 'gray-800' : 'indigo-600'} text-white shadow-md`
              : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
              }`}
          >
            <report.icon className={`w-5 h-5 ${activeReport === report.id ? 'text-white' :
              report.id === 'classroom' ? 'text-brand-turquoise' :
                report.id === 'category' ? 'text-amber-600' :
                  report.id === 'status' ? 'text-emerald-600' :
                    report.id === 'student' ? 'text-gray-600' : 'text-indigo-600'}`} />
            <span className="text-xs font-black uppercase tracking-widest">{report.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 ml-2 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-turquoise" /> Rango de Fecha / Periodo
        </label>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todo' },
              { id: '7days', label: '7 días' },
              { id: 'month', label: 'Este Mes' },
              { id: 'year', label: 'Año' },
              { id: 'custom', label: 'Personalizado' }
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRangeType(range.id as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${dateRangeType === range.id ? 'bg-brand-turquoise border-brand-turquoise text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {dateRangeType === 'custom' && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <input
                type="date"
                className="bg-gray-50 border-2 border-transparent rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-brand-turquoise transition-all"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span className="text-gray-300 font-bold">al</span>
              <input
                type="date"
                className="bg-gray-50 border-2 border-transparent rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-brand-turquoise transition-all"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50">
        {activeReport === 'global' && (
          <div className="text-center space-y-4 py-4">
            <div className="max-w-md mx-auto">
              <Globe className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
              <h2 className="text-2xl font-black text-gray-800">Reporte Institucional Completo</h2>
              <p className="text-gray-400 font-medium">Visualizando todas las incidencias registradas.</p>
            </div>
          </div>
        )}

        {activeReport === 'classroom' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Nivel</label>
                <select
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-brand-turquoise font-bold text-gray-700 transition-all"
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value as SchoolLevel);
                    setGrade(''); // Reset sub-filters
                    setSection('');
                  }}
                >
                  <option value={SchoolLevel.INICIAL}>Inicial</option>
                  <option value={SchoolLevel.PRIMARIA}>Primaria</option>
                  <option value={SchoolLevel.SECUNDARIA}>Secundaria</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Grado</label>
                <select
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-brand-turquoise font-bold text-gray-700 transition-all disabled:opacity-50"
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setSection(''); // Reset section
                  }}
                >
                  <option value="">Seleccionar Grado</option>
                  {availableGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Secc.</label>
                <select
                  disabled={!grade}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-brand-turquoise font-bold text-gray-700 transition-all disabled:opacity-50"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                >
                  <option value="">Todas</option>
                  {availableSections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'student' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input type="text" placeholder="Buscar por nombre completo del alumno..." className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:bg-white focus:border-gray-800 font-bold text-gray-700 text-lg shadow-inner" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
          </div>
        )}

        {activeReport === 'category' && (
          <div className="space-y-6 text-center">
            <div className="max-w-xl mx-auto">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-2">Seleccionar Categoría</label>
              <select className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-5 outline-none focus:bg-white focus:border-amber-500 font-bold text-gray-700 text-lg shadow-inner" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeReport === 'status' && (
          <div className="space-y-6 text-center">
            <div className="max-w-xl mx-auto">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Filtrar por Estado Actual</label>
              <div className="flex flex-wrap justify-center gap-4">
                {Object.values(IncidentStatus).map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${selectedStatus === status ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-100 pt-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-brand-turquoise" />
              Vista Previa ({previewData.length})
            </h3>
            <button
              onClick={exportToPDF}
              disabled={loading || previewData.length === 0}
              className="bg-brand-turquoise text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-brand-darkTurquoise transition-all disabled:opacity-30"
            >
              <Download className="w-5 h-5" />
              {loading ? 'Procesando...' : 'Exportar a PDF'}
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Alumno(s)</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-brand-turquoise border-t-transparent rounded-full mx-auto mb-4"></div>
                      <span className="font-bold text-gray-400">Cargando registros...</span>
                    </td>
                  </tr>
                ) : previewData.length > 0 ? (
                  previewData.map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5 font-black text-indigo-600 text-sm">{inc.correlative}</td>
                      <td className="px-6 py-5 font-bold text-gray-700 text-sm">{new Date(inc.incident_date).toLocaleDateString()}</td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          {inc.incident_participants && inc.incident_participants.length > 0 ? (
                            inc.incident_participants.map((p: any, i: number) => (
                              <div key={i} className="text-sm font-black text-gray-800 flex items-center gap-2">
                                <UserCheck className="w-3 h-3 text-gray-400" />
                                {p.students?.first_name} {p.students?.last_name}
                              </div>
                            ))
                          ) : inc.involved_students && inc.involved_students.length > 0 ? (
                            inc.involved_students.map((s: any, i: number) => (
                              <div key={i} className="text-sm font-black text-gray-800 flex items-center gap-2">
                                <UserCheck className="w-3 h-3 text-gray-400" />
                                {s.names} {s.lastNames}
                              </div>
                            ))
                          ) : <span className="text-gray-400 italic text-xs">N/A</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">
                          {inc.incident_categories?.name || inc.other_category_suggestion || 'Otro'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${inc.status === 'resuelta' ? 'bg-emerald-100 text-emerald-600' :
                          inc.status === 'atención' ? 'bg-amber-100 text-amber-600' :
                            'bg-indigo-100 text-indigo-600'
                          }`}>
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="font-black text-gray-300">No se encontraron incidencias con estos filtros.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
