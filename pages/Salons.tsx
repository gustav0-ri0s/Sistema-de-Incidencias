
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { SchoolLevel } from '../types';
import { MapPin, Plus, X, Loader2, MapPinned, Trash2, CheckCircle, AlertCircle, Pencil } from 'lucide-react';

const Salons: React.FC = () => {
    const [salons, setSalons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSalon, setEditingSalon] = useState<any | null>(null);
    const [newSalon, setNewSalon] = useState({
        level: SchoolLevel.SECUNDARIA,
        grade: '',
        section: ''
    });
    const [editForm, setEditForm] = useState({
        level: SchoolLevel.SECUNDARIA,
        grade: '',
        section: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSalons();
    }, []);

    const fetchSalons = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('classrooms')
            .select('*')
            .order('level')
            .order('grade')
            .order('section');
        if (data) setSalons(data);
        setLoading(false);
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        const { error } = await supabase
            .from('classrooms')
            .update({ active: !currentStatus })
            .eq('id', id);
        if (!error) {
            setSalons(salons.map(s => s.id === id ? { ...s, active: !currentStatus } : s));
        }
    };

    const handleAddSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSalon.grade || !newSalon.section) return;

        setIsSubmitting(true);
        const { error } = await supabase.from('classrooms').insert(newSalon);

        if (error) {
            alert("Error al crear salón: " + error.message);
        } else {
            setShowAddModal(false);
            setNewSalon({ level: SchoolLevel.SECUNDARIA, grade: '', section: '' });
            fetchSalons();
        }
        setIsSubmitting(false);
    };

    const handleUpdateSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSalon || !editForm.grade || !editForm.section) return;

        setIsSubmitting(true);
        const { error } = await supabase
            .from('classrooms')
            .update(editForm)
            .eq('id', editingSalon.id);

        if (error) {
            alert("Error al actualizar salón: " + error.message);
        } else {
            setEditingSalon(null);
            fetchSalons();
        }
        setIsSubmitting(false);
    };

    const deleteSalon = async (id: number) => {
        if (!confirm("¿Eliminar este salón?")) return;
        const { error } = await supabase.from('classrooms').delete().eq('id', id);
        if (error) alert("No se puede eliminar: el salón está siendo usado.");
        else fetchSalons();
    };

    const openEditModal = (salon: any) => {
        setEditingSalon(salon);
        setEditForm({
            level: salon.level,
            grade: salon.grade,
            section: salon.section
        });
    };

    return (
        <div className="space-y-10 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 tracking-tight">Gestión de Salones</h1>
                    <p className="text-gray-400 font-medium">Configuración de grados y secciones institucionales</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-brand-turquoise text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-brand-turquoise/20 flex items-center space-x-2 hover:bg-brand-darkTurquoise transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Salón</span>
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-brand-turquoise animate-spin" />
                    <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {salons.map(salon => (
                        <div key={salon.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-1 transition-all group overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-2 h-full ${salon.active ? 'bg-brand-turquoise' : 'bg-red-300'}`}></div>
                            <div className="flex items-center justify-between pl-4">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${salon.active ? 'bg-brand-light text-brand-turquoise' : 'bg-red-50 text-red-400'}`}>
                                        <MapPinned className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-800 uppercase text-lg leading-tight">{salon.level}</h3>
                                        <p className="text-gray-500 font-bold">{salon.grade} "{salon.section}"</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${salon.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                        {salon.active ? 'Activo' : 'Cerrado'}
                                    </span>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(salon)}
                                            className="p-2 text-gray-400 hover:text-brand-turquoise hover:bg-brand-light rounded-xl"
                                            title="Editar"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(salon.id, salon.active)}
                                            className="p-2 text-gray-400 hover:text-brand-turquoise hover:bg-brand-light rounded-xl"
                                            title={salon.active ? 'Desactivar' : 'Activar'}
                                        >
                                            <CheckCircle className={`w-4 h-4 ${salon.active ? 'text-emerald-500' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => deleteSalon(salon.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {salons.length === 0 && (
                        <div className="col-span-full py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="font-black text-gray-400 uppercase tracking-widest text-sm">No hay salones registrados</p>
                        </div>
                    )}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-brand-turquoise p-8 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black flex items-center space-x-2">
                                <Plus className="w-6 h-6" />
                                <span>Nuevo Salón</span>
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSalon} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-1">Nivel Académico</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.values(SchoolLevel).map((lvl) => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setNewSalon({ ...newSalon, level: lvl })}
                                            className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newSalon.level === lvl
                                                ? 'border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise'
                                                : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block pl-1">Grado</label>
                                    <input required type="text" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-brand-turquoise outline-none font-bold text-gray-700 transition-all shadow-inner" placeholder="Ej. 1ro, 5años" value={newSalon.grade} onChange={e => setNewSalon({ ...newSalon, grade: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block pl-1">Sección</label>
                                    <input required type="text" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-brand-turquoise outline-none font-bold text-gray-700 transition-all shadow-inner" placeholder="Ej. A, B, única" value={newSalon.section} onChange={e => setNewSalon({ ...newSalon, section: e.target.value })} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-5 bg-brand-turquoise text-white font-black rounded-2xl shadow-xl shadow-brand-turquoise/20 hover:bg-brand-darkTurquoise transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                <span>{isSubmitting ? 'Creando...' : 'Crear Registro'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {editingSalon && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-brand-turquoise p-8 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black flex items-center space-x-2">
                                <Pencil className="w-6 h-6" />
                                <span>Editar Salón</span>
                            </h2>
                            <button onClick={() => setEditingSalon(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSalon} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-1">Nivel Académico</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.values(SchoolLevel).map((lvl) => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, level: lvl })}
                                            className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${editForm.level === lvl
                                                ? 'border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise'
                                                : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block pl-1">Grado</label>
                                    <input required type="text" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-brand-turquoise outline-none font-bold text-gray-700 transition-all shadow-inner" placeholder="Ej. 1ro, 5años" value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block pl-1">Sección</label>
                                    <input required type="text" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-brand-turquoise outline-none font-bold text-gray-700 transition-all shadow-inner" placeholder="Ej. A, B, única" value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingSalon(null)}
                                    className="flex-1 py-5 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-5 bg-brand-turquoise text-white font-black rounded-2xl shadow-xl shadow-brand-turquoise/20 hover:bg-brand-darkTurquoise transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Salons;
