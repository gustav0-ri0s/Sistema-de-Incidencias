
import React, { useState, useRef, useContext } from 'react';
import { supabase } from '../supabase';
import { AuthContext } from '../App';
import { X, Save, MapPin, CheckCircle, AlertCircle, Plus, Trash2, Users, Image as ImageIcon, Camera, Lightbulb, Database } from 'lucide-react';
import { IncidentType, SchoolLevel, InvolvedStudent, IncidentStatus } from '../types';

const getPeruTime = () => {
  const now = new Date();
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now).replace(' ', 'T');
};

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IncidentModal: React.FC<IncidentModalProps> = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    type: IncidentType.ESTUDIANTE,
    level: SchoolLevel.PRIMARIA,
    grade: '',
    section: '',
    room_name: '',
    categoryId: '',
    otherCategorySuggestion: '',
    incidentDate: getPeruTime(),
    description: '',
    students: [{ names: '', lastNames: '' }] as InvolvedStudent[],
    imageUrl: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [correlative, setCorrelative] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  const fetchMetadata = async () => {
    setLoadingMeta(true);
    const [cats, rooms] = await Promise.all([
      supabase.from('incident_categories').select('*').eq('active', true).order('name'),
      supabase.from('classrooms').select('*').eq('active', true).order('level').order('grade')
    ]);
    if (cats.data) setCategories(cats.data);
    if (rooms.data) setClassrooms(rooms.data);
    setLoadingMeta(false);
  };

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const addStudent = () => {
    setFormData({
      ...formData,
      students: [...formData.students, { names: '', lastNames: '' }]
    });
  };

  const removeStudent = (index: number) => {
    const newStudents = [...formData.students];
    newStudents.splice(index, 1);
    setFormData({ ...formData, students: newStudents });
  };

  const updateStudent = (index: number, field: keyof InvolvedStudent, value: string) => {
    const newStudents = [...formData.students];
    newStudents[index] = { ...newStudents[index], [field]: value };
    setFormData({ ...formData, students: newStudents });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        type: formData.type,
        level: formData.type === IncidentType.ESTUDIANTE ? formData.level : null,
        grade: formData.type === IncidentType.ESTUDIANTE ? formData.grade : null,
        section: formData.type === IncidentType.ESTUDIANTE ? formData.section : null,
        room_name: formData.type === IncidentType.GENERAL ? formData.room_name : null,
        incident_date: formData.incidentDate,
        description: formData.description,
        teacher_id: user.id,
        category_id: formData.categoryId === 'other' ? null : parseInt(formData.categoryId),
        other_category_suggestion: formData.categoryId === 'other' ? formData.otherCategorySuggestion : null,
        involved_students: formData.type === IncidentType.ESTUDIANTE ? formData.students : [],
        image_url: formData.imageUrl,
        status: IncidentStatus.REGISTRADA
      })
      .select('correlative')
      .single();

    if (!error && data) {
      setCorrelative(data.correlative);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({
          type: IncidentType.ESTUDIANTE,
          level: SchoolLevel.PRIMARIA,
          grade: '',
          section: '',
          room_name: '',
          categoryId: '',
          otherCategorySuggestion: '',
          incidentDate: getPeruTime(),
          description: '',
          students: [{ names: '', lastNames: '' }],
          imageUrl: '',
        });
      }, 2500);
    } else {
      console.error(error);
      alert("Error al guardar en Supabase");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        {success ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8">
              <CheckCircle className="w-14 h-14 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-800">¡Registro Exitoso!</h2>
            <p className="text-gray-500 mt-3 text-lg">Código generado: <span className="font-black text-brand-turquoise">{correlative}</span></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="bg-brand-turquoise px-8 py-6 flex items-center justify-between text-white">
              <h2 className="text-2xl font-black flex items-center space-x-3 tracking-tight">
                <Plus className="w-6 h-6" />
                <span>Nueva incidencia</span>
              </h2>
              <button type="button" onClick={onClose} className="hover:bg-white/20 p-2 rounded-2xl transition-all"><X className="w-7 h-7" /></button>
            </div>

            <div className="p-8 max-h-[75vh] overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Tipo de Registro</label>
                  <select className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-bold text-gray-700" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as IncidentType })}>
                    <option value={IncidentType.ESTUDIANTE}>Alumnos</option>
                    <option value={IncidentType.GENERAL}>Infraestructura / General</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Fecha</label>
                  <input type="datetime-local" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-bold text-gray-700" value={formData.incidentDate} onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })} />
                </div>
              </div>

              {formData.type === IncidentType.ESTUDIANTE ? (
                <div className="p-6 bg-brand-light/40 rounded-3xl border-2 border-brand-turquoise/10 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <select
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand-turquoise font-bold text-gray-600"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value as SchoolLevel, grade: '', section: '' })}
                      >
                        <option value={SchoolLevel.INICIAL}>Inicial</option>
                        <option value={SchoolLevel.PRIMARIA}>Primaria</option>
                        <option value={SchoolLevel.SECUNDARIA}>Secundaria</option>
                      </select>
                    </div>

                    <select
                      className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand-turquoise font-bold text-gray-600"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value, section: '' })}
                      required
                    >
                      <option value="">Seleccionar Grado</option>
                      {[...new Set(classrooms.filter(c => c.level === formData.level).map(c => c.grade))].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <select
                      className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand-turquoise font-bold text-gray-600"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      required
                      disabled={!formData.grade}
                    >
                      <option value="">Sección</option>
                      {classrooms.filter(c => c.level === formData.level && c.grade === formData.grade).map(c => (
                        <option key={c.id} value={c.section}>{c.section}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-brand-light/40 rounded-3xl border-2 border-brand-turquoise/10 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Ubicación del Incidente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Patio, Pasillo 2do piso, Laboratorio..."
                    className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand-turquoise font-bold text-gray-600"
                    value={formData.room_name}
                    onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Categoría de la Incidencia
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-bold text-gray-700"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="other">¿Otro? Sugerir...</option>
                  </select>

                  {formData.categoryId === 'other' && (
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-bold text-gray-700 animate-in slide-in-from-left-2"
                      placeholder="Especifique la categoría..."
                      value={formData.otherCategorySuggestion}
                      onChange={(e) => setFormData({ ...formData, otherCategorySuggestion: e.target.value })}
                      required
                    />
                  )}
                </div>
              </div>

              {formData.type === IncidentType.ESTUDIANTE && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <Users className="w-4 h-4 mr-2" /> Estudiantes Involucrados
                    </label>
                    <button
                      type="button"
                      onClick={addStudent}
                      className="text-[10px] font-black text-brand-turquoise uppercase tracking-widest flex items-center hover:underline"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Agregar Estudiante
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.students.map((student, index) => (
                      <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nombre del Alumno"
                            className="bg-gray-50 border-2 border-transparent rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-bold text-gray-700 text-sm"
                            value={student.names}
                            onChange={(e) => updateStudent(index, 'names', e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            placeholder="Apellidos"
                            className="bg-gray-50 border-2 border-transparent rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-bold text-gray-700 text-sm"
                            value={student.lastNames}
                            onChange={(e) => updateStudent(index, 'lastNames', e.target.value)}
                            required
                          />
                        </div>
                        {formData.students.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStudent(index)}
                            className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><ImageIcon className="w-4 h-4 mr-2" /> Evidencia</label>
                  <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 bg-brand-turquoise/10 text-brand-turquoise rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-turquoise/20">
                    <Camera className="w-4 h-4" /> <span>Adjuntar</span>
                  </button>
                </div>
                {formData.imageUrl && <img src={formData.imageUrl} className="w-full rounded-2xl border border-gray-100" alt="Preview" />}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Descripción de los Hechos</label>
                  <textarea rows={4} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-brand-turquoise transition-all font-medium text-gray-700 shadow-inner" placeholder="Escriba aquí los detalles..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required></textarea>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end space-x-6">
              <button type="button" onClick={onClose} className="text-sm font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-brand-turquoise text-white font-black rounded-2xl shadow-xl shadow-brand-turquoise/30 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0">
                {isSubmitting ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default IncidentModal;
