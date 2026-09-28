import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ClienteCarrinho() {
  const { tenantId } = useParams();
  const [searchParams] = useSearchParams();
  const mesaId = searchParams.get('mesa') || 'Balcão';
  const navigate = useNavigate();
  
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(`cart_${tenantId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);

  const updateQuantity = (idx, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[idx];
      item.quantity += delta;
      
      if (item.quantity <= 0) {
        newCart.splice(idx, 1);
      } else {
        item.subtotal = item.quantity * item.unit_price;
      }
      
      localStorage.setItem(`cart_${tenantId}`, JSON.stringify(newCart));
      return newCart;
    });
  };

  const enviarPedido = async () => {
    if (cart.length === 0) return;
    if (!searchParams.get('mesa')) {
      alert('Número da mesa não identificado. Escaneie o QR Code novamente.');
      return;
    }
    
    setLoading(true);
    const total_amount = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
    
    const { data: order, error } = await supabase.from('orders').insert({
      tenant_id: tenantId,
      table_id: searchParams.get('mesa'), 
      origin: 'cliente',
      status: 'criado',
      notes: obs,
      total_amount
    }).select().single();

    if (error) {
      alert('Erro ao enviar pedido');
      setLoading(false);
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
    await supabase.from('tables').update({ status: 'ocupada' }).eq('id', searchParams.get('mesa'));
    
    localStorage.removeItem(`cart_${tenantId}`);
    setCart([]);
    setLoading(false);
    alert('Pedido enviado para a cozinha com sucesso!');
    navigate(`/cliente/${tenantId}?mesa=${searchParams.get('mesa')}`);
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  if (cart.length === 0) {
    return (
      <>
        <button className="backlink" onClick={() => navigate(`/cliente/${tenantId}?mesa=${mesaId}`)}>
          <svg className="ic"><use href="#i-arrow-left"></use></svg> Cardápio
        </button>
        <div className="empty" style={{ paddingTop: '4rem' }}>
          <svg className="ic"><use href="#i-shopping-cart"></use></svg>
          <h3>Carrinho Vazio</h3>
          <p>Adicione itens do cardápio para fazer seu pedido.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <button className="backlink" onClick={() => navigate(`/cliente/${tenantId}?mesa=${mesaId}`)}>
        <svg className="ic"><use href="#i-arrow-left"></use></svg> Cardápio
      </button>
      
      <h1 className="phone__title">Seu pedido</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: '1.5rem' }}>
        {cart.map((item, idx) => (
          <div key={idx} className="cartline">
            <div className="stepper">
              <button aria-label="Menos um" onClick={() => updateQuantity(idx, -1)}>
                <svg className="ic"><use href="#i-minus"></use></svg>
              </button>
              <span className="stepper__n mf-num">{item.quantity}</span>
              <button aria-label="Mais um" onClick={() => updateQuantity(idx, 1)}>
                <svg className="ic"><use href="#i-plus"></use></svg>
              </button>
            </div>
            <div className="cartline__body">
              <div className="cartline__name">{item.name}</div>
              <div className="cartline__unit mf-num">R$ {Number(item.unit_price).toFixed(2)} cada</div>
            </div>
            <div className="cartline__sub mf-num">R$ {Number(item.subtotal).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={{ paddingBottom: '7rem' }}>
        <label className="fieldlabel" htmlFor="cobs">
          Observação <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(opcional)</span>
        </label>
        <textarea 
          id="cobs" 
          className="obsfield" 
          rows="2" 
          placeholder="Ex.: sem cebola" 
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        ></textarea>
        <p className="fieldhelp">Vai junto para a tela da cozinha.</p>
      </div>

      <div className="phone__actionbar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '400px' }}>
        <div className="totals__row" style={{ fontWeight: 700 }}>
          <span>Total estimado</span>
          <span className="mf-num">R$ {total.toFixed(2)}</span>
        </div>
        <button className="mf-btn mf-btn--block mf-btn--comfort" onClick={enviarPedido} disabled={loading}>
          <svg className="ic"><use href="#i-send"></use></svg>
          {loading ? 'Enviando...' : 'Enviar pedido'}
        </button>
      </div>
    </>
  );
}
