import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function AdminCardapio() {
  const { tenantId } = useStore();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!tenantId) return;
    fetchProducts();
  }, [tenantId]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*, categories(name)').eq('tenant_id', tenantId).order('name');
    if (data) setProducts(data);
  };

  const handleToggle = async (id, currentStatus) => {
    await supabase.from('products').update({ active: !currentStatus }).eq('id', id);
    fetchProducts();
  };

  const handleStockChange = async (id, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', id);
    fetchProducts();
  };

  return (
    <>
      <div className="section-head">
        <h2>Cardápio e estoque</h2>
        <span>o estoque baixa sozinho a cada pedido</span>
      </div>
      
      {products.length > 0 ? (
        <div className="rows">
          {products.map(product => {
            const esgotado = product.stock_quantity === 0;
            const baixo = product.stock_quantity > 0 && product.stock_quantity <= 5;
            const isOff = !product.active || esgotado;
            
            return (
              <div key={product.id} className={`row ${isOff ? 'is-off' : ''}`}>
                <div className="row__main">
                  <div className="row__name">{product.name}</div>
                  <div className="row__sub">{product.categories?.name || 'Sem Categoria'}</div>
                </div>
                
                {esgotado ? (
                  <span className="mf-badge mf-badge--pending">
                    <svg className="ic"><use href="#i-triangle-alert"></use></svg>Esgotado
                  </span>
                ) : baixo ? (
                  <span className="mf-badge mf-badge--preparing">
                    <svg className="ic"><use href="#i-package"></use></svg>Acabando
                  </span>
                ) : null}
                
                <span className="row__price mf-num">R$ {Number(product.price).toFixed(2)}</span>
                
                <div className="stock">
                  <button className="minibtn" aria-label="Tirar uma unidade" onClick={() => handleStockChange(product.id, product.stock_quantity, -1)}>
                    <svg className="ic"><use href="#i-minus"></use></svg>
                  </button>
                  <span className="stock__n mf-num">{product.stock_quantity}</span>
                  <button className="minibtn" aria-label="Repor uma unidade" onClick={() => handleStockChange(product.id, product.stock_quantity, 1)}>
                    <svg className="ic"><use href="#i-plus"></use></svg>
                  </button>
                </div>
                
                <button 
                  className="switch" 
                  aria-pressed={product.active}
                  onClick={() => handleToggle(product.id, product.active)}
                >
                  <span className="switch__track"></span>No cardápio
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <svg className="ic"><use href="#i-package"></use></svg>
          <h3>Nenhum produto</h3>
          <p>Cadastre produtos no seu cardápio.</p>
        </div>
      )}
    </>
  );
}
