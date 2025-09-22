import React, { useState, useEffect } from 'react';
import { supabase, Tag } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Loader2, Save, X, Tag as TagIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const colorPalette = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C'
];

export const TagManager: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [editingTag, setEditingTag] = useState<Partial<Tag> | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tags').select('*').or(`user_id.eq.${user.id},is_global.eq.true`);
      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      toast.error("Erro ao carregar etiquetas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTag || !editingTag.name || !editingTag.color) {
      toast.error("Nome e cor são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const tagToSave = { ...editingTag, user_id: user!.id };
      const { error } = await supabase.from('tags').upsert(tagToSave);
      if (error) throw error;
      toast.success("Etiqueta salva!");
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      toast.error("Falha ao salvar etiqueta.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar esta etiqueta?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
      toast.success("Etiqueta apagada!");
      fetchTags();
    } catch (error) {
      toast.error("Falha ao apagar etiqueta.");
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setEditingTag({ name: '', color: colorPalette[0], is_global: false });
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Etiquetas</h2>
          <button onClick={startNew} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Plus size={20} /><span>Nova Etiqueta</span>
          </button>
        </div>

        {editingTag && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4 shadow-lg">
            <h3 className="font-semibold text-lg">{editingTag.id ? 'Editar Etiqueta' : 'Nova Etiqueta'}</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Etiqueta</label>
              <input type="text" placeholder="Ex: Cliente VIP" value={editingTag.name} onChange={e => setEditingTag({ ...editingTag, name: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cor</label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map(color => (
                  <button key={color} onClick={() => setEditingTag({ ...editingTag, color })} className={`w-8 h-8 rounded-full border-2 ${editingTag.color === color ? 'border-white ring-2 ring-green-500' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button onClick={() => setEditingTag(null)} className="px-4 py-2 border rounded-lg dark:border-gray-600 flex items-center space-x-2"><X size={16} /><span>Cancelar</span></button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>Salvar</span>
              </button>
            </div>
          </div>
        )}

        {loading && tags.length === 0 ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tags.map(tag => (
              <div key={tag.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between">
                <div className="flex items-center space-x-2 mb-4">
                  <TagIcon size={16} style={{ color: tag.color }} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{tag.name}</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setEditingTag(tag)} className="p-2 text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(tag.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
