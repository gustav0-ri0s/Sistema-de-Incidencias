
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Search, User, X, Loader2, Check } from 'lucide-react';

interface StudentSearchProps {
    onSelect: (student: { names: string; lastNames: string }) => void;
    onClose: () => void;
    classId?: string;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onSelect, onClose, classId }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                searchStudents();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const searchStudents = async () => {
        setLoading(true);
        try {
            let q = supabase
                .from('students')
                .select('*, classrooms:classroom_id(level, grade, section)')
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .not('classroom_id', 'is', null);

            if (classId) {
                q = q.eq('classroom_id', classId);
            }

            const { data, error } = await q.limit(15);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error('Error searching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const getLevelLabel = (level: string) => {
        switch (level) {
            case 'Inicial': return 'INI';
            case 'Primaria': return 'PRI';
            case 'Secundaria': return 'SEC';
            default: return level;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-gray-800 flex items-center gap-2">
                        <Search className="w-5 h-5 text-brand-turquoise" />
                        <span>Buscar Estudiante</span>
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Escriba nombres o apellidos..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-brand-turquoise focus:bg-white rounded-2xl outline-none font-bold text-gray-700 transition-all"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-turquoise animate-spin" />}
                    </div>

                    {!classId && (
                        <p className="text-[10px] font-black text-brand-turquoise uppercase tracking-widest text-center">
                            Búsqueda en todos los matriculados
                        </p>
                    )}

                    <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
                        {results.length > 0 ? (
                            results.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => {
                                        onSelect({ names: student.first_name, lastNames: student.last_name });
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-brand-light/30 rounded-2xl transition-all border-2 border-transparent hover:border-brand-turquoise/20 group text-left"
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand-turquoise group-hover:text-white transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-gray-800 leading-tight">
                                            {student.first_name} {student.last_name}
                                        </p>
                                        {student.classrooms && (
                                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                {getLevelLabel(student.classrooms.level)} • {student.classrooms.grade}° "{student.classrooms.section}"
                                            </p>
                                        )}
                                    </div>
                                    <Check className="w-5 h-5 text-brand-turquoise opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))
                        ) : query.length >= 2 && !loading ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-400 font-bold">No se encontraron estudiantes</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Intente con otros términos</p>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Ingrese al menos 2 letras para buscar</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSearch;
