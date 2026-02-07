
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { UserRole, Incident, IncidentType, IncidentStatus, SchoolLevel } from '../types';
import { supabase } from '../supabase';
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  AlertCircle,
  Users,
  CheckCircle,
  MessageSquare,
  BadgeAlert,
  UserCheck,
  X,
  Calendar,
  MapPin,
  User as UserIcon,
  RotateCcw,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const IncidentList: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const fetchIncidents = async () => {
    setLoading(true);
    let query = supabase
      .from('incidents')
      .select(`
        *,
        profiles:teacher_id (full_name),
        incident_categories:category_id (name),
        classrooms:classroom_id (level, grade, section),
        incident_participants (
          role,
          students (first_name, last_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (data) setIncidents(data as Incident[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: IncidentStatus) => {
    const currentIncident = incidents.find(i => i.id === id);
    if (currentIncident?.status === IncidentStatus.RESUELTA && user?.role !== UserRole.ADMIN) {
      alert("Solo el administrador puede revertir una incidencia ya resuelta.");
      return;
    }

    const { error } = await supabase
      .from('incidents')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
      if (selectedIncident?.id === id) {
        setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const handleOpenDetail = async (incident: Incident) => {
    if (incident.status === IncidentStatus.REGISTRADA && (user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN)) {
      await updateStatus(incident.id, IncidentStatus.LEIDA);
    }
    setSelectedIncident(incident);
  };

  const getStatusStyle = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.REGISTRADA: return 'bg-gray-100 text-gray-500 border-gray-200';
      case IncidentStatus.LEIDA: return 'bg-blue-100 text-blue-600 border-blue-200';
      case IncidentStatus.ATENCION: return 'bg-amber-100 text-amber-600 border-amber-200';
      case IncidentStatus.RESUELTA: return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-gray-50 text-gray-400';
    }
  };

  const getTypeIcon = (type: IncidentType, className: string = "w-5 h-5") => {
    switch (type) {
      case IncidentType.ESTUDIANTE: return <Users className={`${className} text-blue-500`} />;
      case IncidentType.AULA: return <MessageSquare className={`${className} text-purple-500`} />;
      case IncidentType.GENERAL: return <AlertCircle className={`${className} text-orange-500`} />;
    }
  };

  const generatePDF = (incident: Incident) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(91, 201, 213);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('I.E.P. VALORES Y CIENCIAS', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(14);
    doc.text('REPORTE OFICIAL DE INCIDENCIA', pageWidth / 2, 40, { align: 'center' });
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(16);
    doc.text(`CÓDIGO: ${incident.correlative}`, 20, 60);
    const startY = 75;
    const rowHeight = 10;
    const categoryName = incident.incident_categories?.name || incident.other_category_suggestion || 'No especificada';
    const location = incident.type === IncidentType.GENERAL
      ? (incident.room_name || 'GENERAL')
      : incident.classrooms
        ? `${incident.classrooms.level.toUpperCase()} - ${incident.classrooms.grade} "${incident.classrooms.section}"`
        : `${incident.level?.toUpperCase()} - ${incident.grade} "${incident.section}"`;

    const details = [
      ['FECHA/HORA:', new Date(incident.incident_date).toLocaleString()],
      ['DOCENTE:', incident.profiles?.full_name || 'Desconocido'],
      ['UBICACIÓN:', location.toUpperCase()],
      ['CATEGORÍA:', categoryName.toUpperCase()],
      ['ESTADO:', incident.status.toUpperCase()],
    ];
    if (incident.type === IncidentType.ESTUDIANTE) {
      const participants = incident.incident_participants || [];
      if (participants.length > 0) {
        const studentsList = participants.map(p => `${p.students?.first_name} ${p.students?.last_name}`).join(', ');
        details.push(['ESTUDIANTES:', studentsList]);
      } else if (incident.involved_students) {
        const studentsList = incident.involved_students.map(s => `${s.names} ${s.lastNames}`).join(', ');
        details.push(['ESTUDIANTES:', studentsList]);
      }
    }
    details.forEach((row, i) => {
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], 20, startY + (i * rowHeight));
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 85, startY + (i * rowHeight));
    });
    const descY = startY + (details.length * rowHeight) + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCIÓN:', 20, descY);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(incident.description, pageWidth - 40);
    doc.text(splitDesc, 20, descY + 10);
    doc.save(`incidencia-${incident.correlative}.pdf`);
  };

  const filteredIncidents = incidents.filter(inc =>
    inc.correlative.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Panel de Gestión</h1>
          <p className="text-gray-400 font-medium">Revisión y seguimiento de incidencias reales en Supabase</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-turquoise transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-brand-turquoise transition-all font-bold text-gray-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value={IncidentStatus.REGISTRADA}>Registradas</option>
            <option value={IncidentStatus.LEIDA}>Leídas</option>
            <option value={IncidentStatus.ATENCION}>Requiere Atención</option>
            <option value={IncidentStatus.RESUELTA}>Resueltas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Cargando desde la Nube...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código e Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Docente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-brand-light/20 transition-all group">
                    <td className="px-8 py-6 text-center">
                      <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm inline-block">
                        {getTypeIcon(incident.type)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 text-sm tracking-tight">{incident.correlative}</span>
                        <span className="text-xs text-brand-turquoise font-bold mt-1 uppercase tracking-tighter">
                          {incident.incident_categories?.name || incident.other_category_suggestion}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-gray-700">{incident.profiles?.full_name}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-bold text-gray-700">{new Date(incident.incident_date).toLocaleDateString('es-ES')}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 ${getStatusStyle(incident.status)}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenDetail(incident)}
                          className="p-3 text-brand-turquoise hover:bg-brand-turquoise/10 rounded-2xl transition-all"
                        >
                          <Eye className="w-7 h-7" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedIncident(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">

            <div className="bg-brand-turquoise px-10 py-8 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-sm border border-white/30">
                  {getTypeIcon(selectedIncident.type, "w-10 h-10 text-white")}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight leading-none">{selectedIncident.correlative}</h2>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mt-2">
                    {selectedIncident.profiles?.full_name || 'Docente'} • Detalle Maestro
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="hover:bg-white/20 p-3 rounded-2xl transition-all">
                <X className="w-10 h-10" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
              <div className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 ${getStatusStyle(selectedIncident.status)} shadow-sm`}>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/50 rounded-2xl">
                    <BadgeAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Estado de Seguimiento</span>
                    <h4 className="text-xl font-black uppercase">{selectedIncident.status}</h4>
                  </div>
                </div>

                {(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN) && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {selectedIncident.status === IncidentStatus.RESUELTA && user?.role === UserRole.ADMIN && (
                      <button
                        onClick={() => updateStatus(selectedIncident.id, IncidentStatus.LEIDA)}
                        className="px-5 py-3 bg-white text-gray-800 text-[10px] font-black uppercase rounded-2xl hover:bg-gray-100 transition-all shadow-md flex items-center space-x-2 border border-gray-200"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Revertir Resolución</span>
                      </button>
                    )}

                    {!(selectedIncident.status === IncidentStatus.RESUELTA && user?.role !== UserRole.ADMIN) && (
                      <>
                        <button
                          onClick={() => updateStatus(selectedIncident.id, IncidentStatus.ATENCION)}
                          className={`px-5 py-3 text-[10px] font-black uppercase rounded-2xl transition-all shadow-md flex items-center space-x-2 ${selectedIncident.status === IncidentStatus.ATENCION ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-100'
                            }`}
                        >
                          <BadgeAlert className="w-4 h-4" />
                          <span>Atención</span>
                        </button>
                        <button
                          onClick={() => updateStatus(selectedIncident.id, IncidentStatus.RESUELTA)}
                          className="px-5 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Resolver</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-brand-turquoise" /> FECHA Y HORA DE LA INCIDENCIA
                    </label>
                    <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                      <p className="text-lg font-black text-gray-700">{new Date(selectedIncident.incident_date).toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedIncident.image_url && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <ImageIcon className="w-4 h-4 mr-2 text-brand-turquoise" /> Evidencia Fotográfica
                      </label>
                      <div className="rounded-[2rem] overflow-hidden border-2 border-gray-100 shadow-sm bg-white aspect-video">
                        <img src={selectedIncident.image_url} alt="Evidence" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <Users className="w-4 h-4 mr-2 text-brand-turquoise" /> Involucrados
                    </label>
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm min-h-[200px]">
                      {selectedIncident.type === IncidentType.ESTUDIANTE ? (
                        <div className="space-y-3">
                          {selectedIncident.incident_participants && selectedIncident.incident_participants.length > 0 ? (
                            selectedIncident.incident_participants.map((p, i) => (
                              <div key={i} className="flex items-center space-x-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <UserCheck className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-black text-gray-800">{p.students?.names} {p.students?.last_names}</span>
                              </div>
                            ))
                          ) : selectedIncident.involved_students ? (
                            selectedIncident.involved_students.map((s, i) => (
                              <div key={i} className="flex items-center space-x-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <UserCheck className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-black text-gray-800">{s.names} {s.lastNames}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">No hay estudiantes registrados.</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <MapPin className="w-6 h-6 text-gray-400" />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Lugar / Ubicación</span>
                            <span className="text-sm font-black text-gray-800">{selectedIncident.room_name || 'Instalaciones Generales'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-brand-turquoise" /> Hechos Reportados
                </label>
                <div className="bg-white p-10 rounded-[2.5rem] border-2 border-brand-turquoise/20 text-gray-700 text-lg font-medium shadow-inner">
                  {selectedIncident.description}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => generatePDF(selectedIncident)}
                  className="px-8 py-4 bg-brand-turquoise/10 text-brand-turquoise font-black rounded-2xl flex items-center space-x-2 border border-brand-turquoise/20 hover:bg-brand-turquoise hover:text-white transition-all shadow-lg shadow-brand-turquoise/10"
                >
                  <Printer className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-black">Generar PDF</span>
                </button>
                <button onClick={() => setSelectedIncident(null)} className="px-12 py-5 bg-gray-900 text-white font-black rounded-[1.5rem] text-sm hover:bg-gray-800 transition-all">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default IncidentList;
