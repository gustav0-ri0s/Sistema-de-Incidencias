
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
  Image as ImageIcon,
  History,
  Trash2,
  Edit3,
  Save
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState<IncidentStatus | null>(null);
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [suggestPsychAttention, setSuggestPsychAttention] = useState(false);
  const [isSendingPsych, setIsSendingPsych] = useState(false);
  const [psychSuggestionSent, setPsychSuggestionSent] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isEditingIncident, setIsEditingIncident] = useState(false);
  const [editIncidentForm, setEditIncidentForm] = useState({ description: '' });
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading?: boolean;
    type?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  useEffect(() => {
    if (user) fetchIncidents();
  }, [statusFilter, user]);

  const isAdminOrSupervisor = user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN || user?.role === UserRole.PSICOLOGA;
  const isDocente = user?.role === UserRole.DOCENTE || user?.role === UserRole.DOCENTE_INGLES;

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
        ),
        incident_logs (
          *,
          profiles:created_by (full_name)
        )
      `)
      .order('created_at', { ascending: false });

    // Docentes only see their own incidents
    if (!isAdminOrSupervisor) {
      query = query.eq('teacher_id', user?.id);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (data) setIncidents(data as Incident[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: IncidentStatus, details?: string, withPsychSuggestion?: boolean) => {
    const currentIncident = incidents.find(i => i.id === id);
    if (currentIncident?.status === IncidentStatus.RESUELTA && user?.role !== UserRole.ADMIN) {
      alert("Solo el administrador puede revertir una incidencia ya resuelta.");
      return;
    }

    const updatePayload: any = { status: newStatus };
    if (details !== undefined) {
      updatePayload.resolution_details = details;
    }

    const { error } = await supabase
      .from('incidents')
      .update(updatePayload)
      .eq('id', id);

    if (!error) {
      // If there are details, save to incident_logs
      if (details && user) {
        await supabase.from('incident_logs').insert({
          incident_id: id,
          status: newStatus,
          comment: details,
          created_by: user.id
        });
      }

      // If psychological attention was suggested, create a suggestion
      if (withPsychSuggestion && user && selectedIncident) {
        const participants = selectedIncident.incident_participants || [];
        const studentName = participants.length > 0
          ? `${participants[0].students?.first_name} ${participants[0].students?.last_name}`
          : (selectedIncident.involved_students && selectedIncident.involved_students.length > 0
            ? `${selectedIncident.involved_students[0].names} ${selectedIncident.involved_students[0].lastNames}`
            : 'Estudiante involucrado');

        const studentGrade = selectedIncident.classrooms
          ? `${selectedIncident.classrooms.grade} "${selectedIncident.classrooms.section}" ${selectedIncident.classrooms.level}`
          : '';

        await supabase.from('psych_appointment_suggestions').insert({
          incident_id: id,
          incident_correlative: selectedIncident.correlative,
          student_name: studentName,
          student_grade: studentGrade,
          suggested_by: user.id,
          suggested_by_name: user.full_name,
          reason: details || 'Sugerido desde incidencia',
          status: 'pending'
        });
      }

      // Refresh incidents to get the latest logs
      fetchIncidents();

      setTempStatus(null);
      setResolutionDetails('');
      setSuggestPsychAttention(false);

      // Update selected incident if it's the one being modified
      if (selectedIncident?.id === id) {
        // We'll let fetchIncidents refresh the list, but for immediate UI response:
        const { data: updatedLogs } = await supabase
          .from('incident_logs')
          .select('*, profiles:created_by(full_name)')
          .eq('incident_id', id)
          .order('created_at', { ascending: false });

        setSelectedIncident(prev => prev ? {
          ...prev,
          status: newStatus,
          resolution_details: details ?? prev.resolution_details,
          incident_logs: updatedLogs as any
        } : null);
      }
    }
  };

  const handleOpenDetail = async (incident: Incident) => {
    if (incident.status === IncidentStatus.REGISTRADA && (user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN || user?.role === UserRole.PSICOLOGA)) {
      await updateStatus(incident.id, IncidentStatus.LEIDA);
    }

    // Siempre traer datos frescos desde la BD para mostrar la última versión (incluye ediciones del docente)
    const { data: freshIncident } = await supabase
      .from('incidents')
      .select(`
        *,
        profiles:teacher_id (full_name),
        incident_categories:category_id (name),
        classrooms:classroom_id (level, grade, section),
        incident_participants (
          role,
          students (first_name, last_name)
        ),
        incident_logs (
          *,
          profiles:created_by (full_name)
        )
      `)
      .eq('id', incident.id)
      .single();

    setSelectedIncident((freshIncident as Incident) ?? incident);
    setPsychSuggestionSent(false);
    setSuggestPsychAttention(false);
  };

  const handleSendPsychSuggestion = async () => {
    if (!selectedIncident || !user) return;
    setIsSendingPsych(true);

    const participants = selectedIncident.incident_participants || [];
    const studentName = participants.length > 0
      ? `${participants[0].students?.first_name} ${participants[0].students?.last_name}`
      : (selectedIncident.involved_students && selectedIncident.involved_students.length > 0
        ? `${selectedIncident.involved_students[0].names} ${selectedIncident.involved_students[0].lastNames}`
        : 'Estudiante involucrado');

    const studentGrade = selectedIncident.classrooms
      ? `${selectedIncident.classrooms.grade} "${selectedIncident.classrooms.section}" - ${selectedIncident.classrooms.level}`
      : '';

    const { error } = await supabase.from('psych_appointment_suggestions').insert({
      incident_id: selectedIncident.id,
      incident_correlative: selectedIncident.correlative,
      student_name: studentName,
      student_grade: studentGrade,
      suggested_by: user.id,
      suggested_by_name: user.full_name,
      reason: selectedIncident.description,
      status: 'pending'
    });

    setIsSendingPsych(false);
    if (!error) {
      setPsychSuggestionSent(true);
      setSuggestPsychAttention(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!selectedIncident) return;

    setConfirmModal(prev => ({ ...prev, isLoading: true }));

    const { error: deleteError } = await supabase
      .from('incident_logs')
      .delete()
      .eq('id', logId);

    if (deleteError) {
      console.error(deleteError);
      alert("Error al eliminar el registro.");
      setConfirmModal({ ...confirmModal, isOpen: false, isLoading: false });
      return;
    }

    // Fetch remaining logs to determine new status
    const { data: remainingLogs } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('incident_id', selectedIncident.id)
      .order('created_at', { ascending: false });

    let newStatus = IncidentStatus.LEIDA; // Default status if no logs left
    let newDetails = null;

    if (remainingLogs && remainingLogs.length > 0) {
      newStatus = remainingLogs[0].status;
      newDetails = remainingLogs[0].comment;
    }

    // Update incident status and resolution details sync
    await supabase
      .from('incidents')
      .update({
        status: newStatus,
        resolution_details: newDetails
      })
      .eq('id', selectedIncident.id);

    fetchIncidents();

    if (selectedIncident.id) {
      // Refresh detail view
      const { data: updatedLogs } = await supabase
        .from('incident_logs')
        .select('*, profiles:created_by(full_name)')
        .eq('incident_id', selectedIncident.id)
        .order('created_at', { ascending: false });

      setSelectedIncident(prev => prev ? {
        ...prev,
        status: newStatus,
        incident_logs: updatedLogs as any
      } : null);
    }

    setConfirmModal({ ...confirmModal, isOpen: false, isLoading: false });
  };

  const openDeleteConfirm = (logId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Registro',
      message: '¿Está seguro de eliminar este registro del historial? Esta acción podría revertir el estado de la incidencia.',
      type: 'danger',
      onConfirm: () => handleDeleteLog(logId)
    });
  };

  const handleDeleteIncident = async (incidentId: string) => {
    setConfirmModal(prev => ({ ...prev, isLoading: true }));

    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', incidentId);

    if (error) {
      console.error(error);
      alert("Error al eliminar la incidencia.");
      setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
      return;
    }

    fetchIncidents();
    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
  };

  const openDeleteIncidentConfirm = (incidentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Incidencia',
      message: '¿Está seguro de eliminar toda la incidencia permanentemente? Perderá todos los registros y la evidencia asociada.',
      type: 'danger',
      onConfirm: () => handleDeleteIncident(incidentId)
    });
  };

  const handleUpdateLog = async (logId: string, newComment: string) => {
    if (!newComment.trim()) return;

    const { error } = await supabase
      .from('incident_logs')
      .update({ comment: newComment })
      .eq('id', logId);

    if (!error) {
      fetchIncidents();
      setEditingLogId(null);

      if (selectedIncident) {
        const { data: updatedLogs } = await supabase
          .from('incident_logs')
          .select('*, profiles:created_by(full_name)')
          .eq('incident_id', selectedIncident.id)
          .order('created_at', { ascending: false });

        setSelectedIncident(prev => prev ? {
          ...prev,
          incident_logs: updatedLogs as any
        } : null);
      }
    }
  };

  const handleEditIncidentSave = async () => {
    if (!selectedIncident || !editIncidentForm.description.trim()) return;
    setIsSavingIncident(true);

    const { error } = await supabase
      .from('incidents')
      .update({ description: editIncidentForm.description })
      .eq('id', selectedIncident.id);

    if (!error) {
      setSelectedIncident(prev => prev ? { ...prev, description: editIncidentForm.description } : null);
      setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? { ...i, description: editIncidentForm.description } : i));
      setIsEditingIncident(false);
    } else {
      alert('Error al guardar los cambios.');
    }
    setIsSavingIncident(false);
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
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // ── Constantes de layout ──────────────────────────────────────────────
    const pageW = doc.internal.pageSize.getWidth();   // 210 mm
    const pageH = doc.internal.pageSize.getHeight();  // 297 mm
    const marginL = 18;
    const marginR = 18;
    const marginB = 20;
    const contentW = pageW - marginL - marginR;          // ~174 mm

    let y = 0;

    // ── Helpers ───────────────────────────────────────────────────────────
    const checkPage = (needed: number) => {
      if (y + needed > pageH - marginB) {
        doc.addPage();
        y = 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(180, 180, 180);
        doc.text(`${incident.correlative} — continuación`, pageW - marginR, y, { align: 'right' });
        doc.setTextColor(55, 65, 81);
        y += 8;
      }
    };

    const printWrapped = (
      text: string,
      x: number,
      maxW: number,
      fontSize: number,
      fontStyle: 'normal' | 'bold' | 'italic',
      lh: number
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines: string[] = doc.splitTextToSize(text, maxW);
      lines.forEach((line: string) => {
        checkPage(lh);
        doc.text(line, x, y);
        y += lh;
      });
    };

    // ══════════════════════════════════════════════════════════════════════
    // ENCABEZADO
    // ══════════════════════════════════════════════════════════════════════
    doc.setFillColor(91, 201, 213);
    doc.rect(0, 0, pageW, 42, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('I.E.P. VALORES Y CIENCIAS', pageW / 2, 16, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE OFICIAL DE INCIDENCIA', pageW / 2, 27, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`CÓDIGO: ${incident.correlative}`, pageW / 2, 38, { align: 'center' });
    doc.setTextColor(55, 65, 81);
    y = 52;

    // ══════════════════════════════════════════════════════════════════════
    // FICHA DE DATOS GENERALES
    // ══════════════════════════════════════════════════════════════════════
    const categoryName = incident.incident_categories?.name
      || incident.other_category_suggestion
      || 'No especificada';

    const location = incident.type === IncidentType.GENERAL
      ? (incident.room_name || 'Instalaciones Generales')
      : incident.classrooms
        ? `${incident.classrooms.level.toUpperCase()} - ${incident.classrooms.grade} "${incident.classrooms.section}"`
        : `${incident.level?.toUpperCase()} - ${incident.grade} "${incident.section}"`;

    const details: [string, string][] = [
      ['Fecha / Hora:', new Date(incident.incident_date).toLocaleString('es-PE')],
      ['Docente:', incident.profiles?.full_name || 'No registrado'],
      ['Tipo:', incident.type.toUpperCase()],
      ['Ubicacion:', location],
      ['Categoria:', categoryName],
      ['Estado:', incident.status.toUpperCase()],
    ];

    if (incident.type === IncidentType.ESTUDIANTE) {
      const parts = incident.incident_participants || [];
      let names = '';
      if (parts.length > 0) {
        names = parts.map(p => `${p.students?.first_name || ''} ${p.students?.last_name || ''}`.trim()).filter(Boolean).join('; ');
      } else if (incident.involved_students?.length) {
        names = incident.involved_students.map(s => `${s.names} ${s.lastNames}`.trim()).join('; ');
      }
      if (names) details.push(['Estudiantes:', names]);
    }

    const labelX = marginL;
    const valueX = marginL + 38;
    const valueW = contentW - 38;

    details.forEach(([label, value]) => {
      doc.setFontSize(10);
      const valueLines: string[] = doc.splitTextToSize(value, valueW);
      const blockH = valueLines.length * 6 + 2;
      checkPage(blockH);
      doc.setFont('helvetica', 'bold');
      doc.text(label, labelX, y);
      doc.setFont('helvetica', 'normal');
      valueLines.forEach((line: string, idx: number) => {
        doc.text(line, valueX, y + idx * 6);
      });
      y += blockH;
    });

    // Separador
    y += 4;
    checkPage(6);
    doc.setDrawColor(91, 201, 213);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, pageW - marginR, y);
    y += 7;

    // ══════════════════════════════════════════════════════════════════════
    // DESCRIPCIÓN DE LOS HECHOS
    // ══════════════════════════════════════════════════════════════════════
    checkPage(12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(91, 201, 213);
    doc.text('DESCRIPCION DE LOS HECHOS', marginL, y);
    doc.setTextColor(55, 65, 81);
    y += 7;

    printWrapped(incident.description, marginL, contentW, 11, 'normal', 7);

    // ══════════════════════════════════════════════════════════════════════
    // HISTORIAL DE ACCIONES
    // ══════════════════════════════════════════════════════════════════════
    if (incident.incident_logs && incident.incident_logs.length > 0) {
      y += 4;
      checkPage(6);
      doc.setDrawColor(91, 201, 213);
      doc.setLineWidth(0.5);
      doc.line(marginL, y, pageW - marginR, y);
      y += 7;

      checkPage(12);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(91, 201, 213);
      doc.text('HISTORIAL DE ACCIONES / RESOLUCION', marginL, y);
      doc.setTextColor(55, 65, 81);
      y += 8;

      const sorted = [...incident.incident_logs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sorted.forEach((log, idx) => {
        // Cabecera del log
        const logHeader = `[${log.status.toUpperCase()}]  ${new Date(log.created_at).toLocaleString('es-PE')}  -  Por: ${log.profiles?.full_name || 'Personal'}`;
        const headerLines: string[] = doc.splitTextToSize(logHeader, contentW);
        checkPage(headerLines.length * 5 + 2);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        headerLines.forEach((line: string) => { doc.text(line, marginL, y); y += 5; });
        doc.setTextColor(55, 65, 81);

        // Cuerpo del log
        printWrapped(log.comment, marginL + 3, contentW - 3, 10, 'normal', 6);

        if (idx < sorted.length - 1) {
          y += 2;
          checkPage(4);
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(marginL, y, pageW - marginR, y);
          y += 4;
        }
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // PIE DE PÁGINA en todas las páginas
    // ══════════════════════════════════════════════════════════════════════
    const totalPages: number = (doc.internal as any).getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text(
        `I.E.P. Valores y Ciencias - Generado: ${new Date().toLocaleString('es-PE')}`,
        pageW / 2, pageH - 10, { align: 'center' }
      );
      doc.text(`Pag. ${p} / ${totalPages}`, pageW - marginR, pageH - 10, { align: 'right' });
    }

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
                      <div className="flex flex-col space-y-1.5">
                        <span className={`inline-flex items-center self-start px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 ${getStatusStyle(incident.status)}`}>
                          {incident.status}
                        </span>
                        {incident.resolution_details && (
                          <p className="text-[11px] text-gray-500 font-medium line-clamp-1 max-w-[200px]" title={incident.resolution_details}>
                            {incident.resolution_details}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenDetail(incident)}
                          className="p-3 text-brand-turquoise hover:bg-brand-turquoise/10 rounded-2xl transition-all"
                          title="Ver detalle"
                        >
                          <Eye className="w-7 h-7" />
                        </button>
                        {/* Botón editar para docente en su propia incidencia con estado REGISTRADA */}
                        {isDocente && incident.teacher_id === user?.id && incident.status === IncidentStatus.REGISTRADA && (
                          <button
                            onClick={() => {
                              setEditIncidentForm({ description: incident.description });
                              setIsEditingIncident(true);
                              handleOpenDetail(incident);
                            }}
                            className="p-3 text-amber-500 hover:bg-amber-50 rounded-2xl transition-all"
                            title="Editar incidencia"
                          >
                            <Edit3 className="w-7 h-7" />
                          </button>
                        )}
                        {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR) && (
                          <button
                            onClick={() => openDeleteIncidentConfirm(incident.id)}
                            className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                            title="Eliminar incidencia"
                          >
                            <Trash2 className="w-7 h-7" />
                          </button>
                        )}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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

                {(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN || user?.role === UserRole.PSICOLOGA) && (
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

                    {!(selectedIncident.status === IncidentStatus.RESUELTA && user?.role !== UserRole.ADMIN) && !tempStatus && (
                      <>
                        <button
                          onClick={() => {
                            setTempStatus(IncidentStatus.ATENCION);
                            setResolutionDetails('');
                            setSuggestPsychAttention(false);
                          }}
                          className={`px-5 py-3 text-[10px] font-black uppercase rounded-2xl transition-all shadow-md flex items-center space-x-2 ${selectedIncident.status === IncidentStatus.ATENCION ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-100'
                            }`}
                        >
                          <BadgeAlert className="w-4 h-4" />
                          <span>Atención</span>
                        </button>
                        <button
                          onClick={() => {
                            setTempStatus(IncidentStatus.RESUELTA);
                            setResolutionDetails('');
                            setSuggestPsychAttention(false);
                          }}
                          className="px-5 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Resolver</span>
                        </button>
                      </>
                    )}

                    {tempStatus && (
                      <div className="w-full mt-4 p-6 bg-white rounded-3xl border-2 border-brand-turquoise/20 animate-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                            Explique la acción tomada o resolución:
                          </label>
                          <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 ${getStatusStyle(tempStatus)}`}>
                            Cambiando a: {tempStatus}
                          </span>
                        </div>
                        <textarea
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-medium text-gray-700 shadow-inner mb-4"
                          rows={3}
                          placeholder={tempStatus === IncidentStatus.RESUELTA ? "Describa cómo se resolvió la incidencia..." : "Describa las acciones de atención tomadas..."}
                          value={resolutionDetails}
                          onChange={(e) => setResolutionDetails(e.target.value)}
                          required
                        />


                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setTempStatus(null);
                              setResolutionDetails('');
                              setSuggestPsychAttention(false);
                            }}
                            className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={async () => {
                              if (!resolutionDetails.trim()) {
                                alert("Por favor, ingrese una explicación.");
                                return;
                              }
                              setIsUpdatingStatus(true);
                              await updateStatus(selectedIncident.id, tempStatus, resolutionDetails, suggestPsychAttention);
                              setIsUpdatingStatus(false);
                            }}
                            disabled={isUpdatingStatus}
                            className={`px-8 py-2 text-white text-[10px] font-black uppercase rounded-xl shadow-lg transition-all ${tempStatus === IncidentStatus.RESUELTA ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-amber-500 shadow-amber-500/20'}`}
                          >
                            {isUpdatingStatus ? 'Guardando...' : 'Confirmar y Guardar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* === PSYCH SUGGESTION PANEL - independent, always visible for supervisor/admin on student incidents === */}
              {(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN) && selectedIncident.type === IncidentType.ESTUDIANTE && (
                <div className={`rounded-3xl border-2 p-5 transition-all ${psychSuggestionSent
                  ? 'bg-green-50 border-green-200'
                  : 'bg-violet-50 border-violet-200'
                  }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl shrink-0 ${psychSuggestionSent ? 'bg-green-100 text-green-600' : 'bg-violet-100 text-violet-600'
                      }`}>
                      {psychSuggestionSent ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      {psychSuggestionSent ? (
                        <>
                          <p className="text-sm font-black text-green-800">¡Sugerencia enviada a Psicología!</p>
                          <p className="text-[11px] text-green-600 font-medium mt-0.5">La psicóloga recibirá una alerta y podrá agendar una cita con el/los estudiante(s).</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-black text-violet-800">Sugerir Atención Psicológica</p>
                          <p className="text-[11px] text-violet-600 font-medium mt-0.5">Notifica a la psicóloga para que pueda agendar una cita con el/los estudiante(s) involucrado(s).</p>
                          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none group w-fit">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={suggestPsychAttention}
                                onChange={(e) => setSuggestPsychAttention(e.target.checked)}
                              />
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${suggestPsychAttention
                                ? 'bg-violet-600 border-violet-600'
                                : 'bg-white border-violet-300 group-hover:border-violet-500'
                                }`}>
                                {suggestPsychAttention && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-black text-violet-700 uppercase tracking-wider">Marcar para sugerir atención psicológica</span>
                          </label>
                        </>
                      )}
                    </div>
                    {!psychSuggestionSent && (
                      <button
                        onClick={handleSendPsychSuggestion}
                        disabled={!suggestPsychAttention || isSendingPsych}
                        className={`shrink-0 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 ${suggestPsychAttention && !isSendingPsych
                          ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-600/30'
                          : 'bg-violet-100 text-violet-300 cursor-not-allowed'
                          }`}
                      >
                        {isSendingPsych ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Enviar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

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
                                <span className="text-sm font-black text-gray-800">{p.students?.first_name} {p.students?.last_name}</span>
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

                {/* Modo edición para docente */}
                {isEditingIncident && isDocente && selectedIncident.teacher_id === user?.id && selectedIncident.status === IncidentStatus.REGISTRADA ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl">
                      <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-xs font-bold text-amber-700">Modo edición activo — Solo puedes editar mientras la incidencia no haya sido revisada.</p>
                    </div>
                    <textarea
                      rows={5}
                      className="w-full bg-white border-2 border-brand-turquoise/30 rounded-[2.5rem] px-10 py-8 outline-none focus:border-brand-turquoise transition-all font-medium text-gray-700 text-lg shadow-inner"
                      value={editIncidentForm.description}
                      onChange={e => setEditIncidentForm({ description: e.target.value })}
                      placeholder="Describa los hechos..."
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setIsEditingIncident(false)}
                        className="px-6 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleEditIncidentSave}
                        disabled={isSavingIncident || !editIncidentForm.description.trim()}
                        className="px-8 py-2.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSavingIncident ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="bg-white p-10 rounded-[2.5rem] border-2 border-brand-turquoise/20 text-gray-700 text-lg font-medium shadow-inner">
                      {selectedIncident.description}
                    </div>
                    {/* Botón editar flotante para docente */}
                    {isDocente && selectedIncident.teacher_id === user?.id && selectedIncident.status === IncidentStatus.REGISTRADA && (
                      <button
                        onClick={() => {
                          setEditIncidentForm({ description: selectedIncident.description });
                          setIsEditingIncident(true);
                        }}
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {selectedIncident.incident_logs && selectedIncident.incident_logs.length > 0 && (
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <History className="w-4 h-4 mr-2 text-brand-turquoise" /> Historial de Acciones / Resolución
                  </label>
                  <div className="space-y-4">
                    {selectedIncident.incident_logs
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((log, i) => (
                        <div key={log.id} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(log.status)}`}>
                                {log.status}
                              </span>
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-brand-turquoise bg-brand-turquoise/5 px-3 py-1 rounded-full">
                                Por: {log.profiles?.full_name || 'Personal Autorizado'}
                              </span>
                              {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR || user?.role === UserRole.PSICOLOGA) && (
                                <div className="flex items-center border-l pl-2 border-gray-200 ml-1 space-x-1">
                                  <button
                                    onClick={() => setEditingLogId(log.id)}
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Editar comentario"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteConfirm(log.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Eliminar registro"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {editingLogId === log.id ? (
                            <div className="space-y-3 mt-2">
                              <textarea
                                className="w-full bg-white border-2 border-brand-turquoise/20 rounded-xl px-4 py-3 outline-none focus:border-brand-turquoise font-medium text-gray-700 shadow-sm"
                                rows={2}
                                defaultValue={log.comment}
                                id={`edit-log-${log.id}`}
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setEditingLogId(null)}
                                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => {
                                    const val = (document.getElementById(`edit-log-${log.id}`) as HTMLTextAreaElement).value;
                                    handleUpdateLog(log.id, val);
                                  }}
                                  className="bg-brand-turquoise text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-lg shadow-md"
                                >
                                  Actualizar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700 font-medium leading-relaxed">
                              {log.comment}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

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
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !confirmModal.isLoading && setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 p-8 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' :
              confirmModal.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
              }`}>
              {confirmModal.type === 'danger' ? <Trash2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 font-medium mb-8">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                disabled={confirmModal.isLoading}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
              >
                No, marchar atrás
              </button>
              <button
                onClick={confirmModal.onConfirm}
                disabled={confirmModal.isLoading}
                className={`flex-1 px-6 py-4 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' :
                  confirmModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' :
                    'bg-brand-turquoise hover:bg-brand-turquoise/80 shadow-brand-turquoise/30'
                  }`}
              >
                {confirmModal.isLoading ? 'Procesando...' : 'Sí, confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default IncidentList;
