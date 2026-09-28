import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function GarcomCardapio() {
  const { mesaId } = useParams();
  const { tenantId, profile } = useStore();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [table, setTable] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    
    supabase.from('tables').select('number').eq('id', mesaId).single().then(({data}) => setTable(data));
    supabase.from('products').select('*, categories(name)').eq('tenant_id', tenantId).order('name').then(({data}) => setProducts(data || []));
  }, [tenantId, mesaId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price } : item);
      }
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, unit_price: product.price, subtotal: product.price }];
    });
  };

  const enviarPedido = async () => {
    if (cart.length === 0) return;
    
    const total_amount = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
    
    const { data: order, error } = await supabase.from('orders').insert({
      tenant_id: tenantId,
      table_id: mesaId,
      origin: 'garcom',
      status: 'criado',
      total_amount,
      created_by: profile?.id
    }).select().single();

    if (error) {
      alert('Erro ao enviar pedido');
      return;
    }

    const orderItems = cart.map(item => ({
      tenant_id: tenantId,
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal
    }));

    await supabase.from('order_items').insert(orderItems);
    await supabase.from('tables').update({ status: 'ocupada' }).eq('id', mesaId);
    
    alert('Pedido enviado com sucesso!');
    navigate('/garcom');
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const itemsCount = cart.reduce((a, b) => a + b.quantity, 0);

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const cat = product.categories?.name || 'Sem Categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button className="backlink" onClick={() => navigate('/garcom')}>
          <svg className="ic"><use href="#i-arrow-left"></use></svg> Voltar
        </button>
        <span className="mf-eyebrow">Mesa {table?.number || ''}</span>
      </div>

      <h1 className="phone__title" style={{ marginBottom: '1.5rem' }}>Cardápio</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: cart.length > 0 ? '5rem' : '0' }}>
        {Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="menugroup">
            <div className="mf-eyebrow">{category}</div>
            {items.map(product => {
              const ok = product.active && product.stock_quantity !== 0;
              const sub = !product.active ? 'Fora do cardápio' : product.stock_quantity === 0 ? 'Esgotado' : (product.stock_quantity <= 5 ? `Só ${product.stock_quantity} no estoque` : '');
              
              return (
                <div key={product.id} className={`menuitem ${ok ? '' : 'menuitem--off'}`}>
                  <div className="menuitem__text">
                    <div className="menuitem__name">{product.name}</div>
                    {sub && <div className="menuitem__desc">{sub}</div>}
                  </div>
                  <span className="menuitem__price mf-num">R$ {Number(product.price).toFixed(2)}</span>
                  <button 
                    className="iconbtn" 
                    disabled={!ok}
                    onClick={() => addToCart(product)}
                    aria-label={`Adicionar ${product.name}`}
                  >
                    <svg className="ic"><use href="#i-plus"></use></svg>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="phone__actionbar" style={{ position: 'fixed', bottom: '72px', left: 0, right: 0, margin: '0 auto', maxWidth: '400px' }}>
          <button className="mf-btn mf-btn--block mf-btn--comfort" onClick={enviarPedido}>
            Ver pedido ({itemsCount} itens) · R$ {total.toFixed(2)}
          </button>
        </div>
      )}
    </>
  );
}
