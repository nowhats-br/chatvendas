import React, { useState, useEffect } from 'react';
import { supabase, Product, Ticket } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Search, Plus, Minus, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiError } from '../../types';

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSaleCreated: (totalAmount: number) => void;
}

interface CartItem extends Product {
  quantity: number;
}

export const SalesModal: React.FC<SalesModalProps> = ({ isOpen, onClose, ticket, onSaleCreated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCart([]);
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('name');
    if (error) toast.error("Erro ao buscar produtos.");
    else setProducts(data || []);
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !user) return;
    setLoading(true);
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({ contact_id: ticket.contact_id, user_id: user.id, ticket_id: ticket.id, total_amount: totalAmount, status: 'completed' })
        .select()
        .single();
      if (saleError) throw saleError;
      
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      toast.success("Venda registrada com sucesso!");
      onSaleCreated(totalAmount);
      onClose();
    } catch (error: ApiError | any) {
      const errorMessage = error?.message || 'Erro ao salvar venda';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full flex flex-col h-[90vh]">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold">Registrar Venda para {ticket.contact?.name}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Product List */}
          <div className="w-1/2 border-r dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="relative">
                <input type="text" placeholder="Buscar produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded bg-transparent dark:border-gray-600" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
            <ul className="overflow-y-auto p-2">
              {filteredProducts.map(product => (
                <li key={product.id} onClick={() => addToCart(product)} className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <Plus size={18} className="text-green-500" />
                </li>
              ))}
            </ul>
          </div>
          
          {/* Cart */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold">Carrinho</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? <p className="text-gray-500 text-center mt-10">O carrinho está vazio.</p> : cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600"><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600"><Plus size={14} /></button>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t dark:border-gray-700 space-y-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {totalAmount.toFixed(2)}</span>
              </div>
              <button onClick={handleFinalizeSale} disabled={loading || cart.length === 0} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 disabled:opacity-50">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ShoppingCart size={20} />}
                <span>Finalizar Venda</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
