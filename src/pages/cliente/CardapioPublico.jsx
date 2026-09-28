import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ClienteCardapio() {
  const { tenantId } = useParams();
  const [searchParams] = useSearchParams();
  const mesaId = searchParams.get('mesa') || 'Balcão';
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(`cart_${tenantId}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!tenantId) return;
    
    supabase.from('products').select('*, categories(name)').eq('tenant_id', tenantId).order('name').then(({data}) => setProducts(data || []));
  }, [tenantId]);

  useEffect(() => {
    localStorage.setItem(`cart_${tenantId}`, JSON.stringify(cart));
  }, [cart, tenantId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price } : item);
      }
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, unit_price: product.price, subtotal: product.price }];
    });
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
      <div className="tablestrip">
        <svg className="ic"><use href="#i-qr-code"></use></svg>
        Você está na <b>Mesa {mesaId}</b>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: cart.length > 0 ? '5rem' : '0' }}>
        {Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="menugroup">
            <div className="mf-eyebrow">{category}</div>
            {items.map(product => {
              const ok = product.active && product.stock_quantity !== 0;
              const sub = !product.active ? 'Fora do cardápio' : product.stock_quantity === 0 ? 'Esgotado' : (product.description || '');
              
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
        <div className="phone__actionbar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '400px' }}>
          <button className="mf-btn mf-btn--block mf-btn--comfort" onClick={() => navigate(`/cliente/${tenantId}/carrinho?mesa=${mesaId}`)}>
            Ver carrinho ({itemsCount} itens) · R$ {total.toFixed(2)}
          </button>
        </div>
      )}
    </>
  );
}
