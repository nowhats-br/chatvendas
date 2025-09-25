import React, { useState, useEffect } from 'react';
import { supabase, Product } from '../../lib/supabase';
import { X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiError } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, stock_quantity: 0, is_active: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.stock_quantity,
        is_active: product.is_active,
      });
    } else {
      setFormData({ name: '', description: '', price: 0, stock_quantity: 0, is_active: true });
    }
  }, [product, isOpen]);

  const handleSaveProduct = async () => {
    if (!formData.name || formData.price <= 0) {
      toast.error('Nome e preço (maior que zero) são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const productData = { id: product?.id, ...formData };
      const { error } = await supabase.from('products').upsert(productData);
      if (error) throw error;
      toast.success(`Produto ${product ? 'atualizado' : 'criado'} com sucesso!`);
      onSave();
    } catch (error: ApiError | any) {
      const errorMessage = error?.message || 'Erro ao salvar produto';
      toast.error(errorMessage);
    }
    finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome*</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" rows={3}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Preço*</label>
              <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estoque</label>
              <input type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded bg-transparent dark:border-gray-600" />
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="rounded text-green-500 focus:ring-green-500" />
              <span>Produto Ativo</span>
            </label>
          </div>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg dark:border-gray-600">Cancelar</button>
          <button onClick={handleSaveProduct} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
