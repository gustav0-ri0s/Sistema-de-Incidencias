
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Trash2, CheckCircle, X, Loader2, Database, AlertCircle, Bookmark } from 'lucide-react';
import { IncidentCategory } from '../types';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('incident_categories')
      .select('*')
      .order('name', { ascending: true });

    if (data) setCategories(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('incident_categories')
      .insert({ name: newCategoryName.trim(), active: true });

    if (error) {
      alert("Error al crear categoría: " + error.message);
    } else {
      setNewCategoryName('');
      setShowAddModal(false);
      fetchCategories();
    }
    setIsSubmitting(false);
  };

  const toggleStatus = async (category: IncidentCategory) => {
    const { error } = await supabase
      .from('incident_categories')
      .update({ active: !category.active })
      .eq('id', category.id);

    if (!error) {
      setCategories(categories.map(cat =>
        cat.id === category.id ? { ...cat, active: !cat.active } : cat
      ));
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría? Esto podría afectar registros históricos.")) return;
    const { error } = await supabase.from('incident_categories').delete().eq('id', id);
    if (error) alert("No se puede eliminar: la categoría está siendo usada.");
    else fetchCategories();
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Categorías de Incidencias</h1>
          <p className="text-gray-400 font-medium">Administración de tipos de conducta y eventos</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-turquoise text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-brand-turquoise/20 flex items-center space-x-2 hover:bg-brand-darkTurquoise transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-brand-turquoise animate-spin" />
          <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando catálogo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-1 transition-all group overflow-hidden relative">
              <div className={`absolute top-0 left-0 w-2 h-full ${cat.active ? 'bg-brand-turquoise' : 'bg-red-300'}`}></div>
              <div className="flex items-center justify-between pl-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${cat.active ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-400'}`}>
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-sm leading-tight uppercase tracking-tight">{cat.name}</h3>
                    <span className={`text-[8px] font-black uppercase ${cat.active ? 'text-emerald-500' : 'text-red-400'}`}>
                      {cat.active ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleStatus(cat)}
                  className={`p-2 rounded-xl transition-all ${cat.active ? 'text-red-400 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                  title={cat.active ? 'Desactivar' : 'Activar'}
                >
                  <X className={`w-5 h-5 ${cat.active ? '' : 'rotate-45'}`} />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-brand-turquoise p-8 text-white flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center space-x-2">
                <Plus className="w-6 h-6" />
                <span>Nueva Categoría</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-1">Nombre Descriptivo</label>
                <div className="relative group">
                  <Bookmark className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-turquoise transition-colors w-5 h-5" />
                  <input
                    required
                    autoFocus
                    type="text"
                    className="w-full pl-14 pr-5 py-5 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-brand-turquoise outline-none font-bold text-gray-700 transition-all shadow-inner"
                    placeholder="Ej. Acoso Escolar, Tardanza..."
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newCategoryName.trim()}
                className="w-full py-5 bg-brand-turquoise text-white font-black rounded-2xl shadow-xl shadow-brand-turquoise/20 hover:bg-brand-darkTurquoise transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                <span>{isSubmitting ? 'Agregando...' : 'Registrar Categoría'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
