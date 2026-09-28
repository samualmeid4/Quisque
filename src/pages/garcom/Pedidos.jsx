import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function GarcomPedidos() {
  const { tenantId, profile } = useStore();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!tenantId) return;
    fetchOrders();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, fetchOrders)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tenantId]);

  const fetchOrders = async () => {
    // Busca pedidos (idealmente filtrando para o garçom atual ou todos se configurado)
    const { data } = await supabase
      .from('orders')
      .select('*, tables(number), order_items(*)')
      .eq('tenant_id', tenantId)
      .neq('status', 'finalizado')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const entregarPedido = async (orderId) => {
    await supabase.from('orders').update({ status: 'finalizado' }).eq('id', orderId);
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'criado': return { label: 'Novo', tone: 'pending', icon: 'receipt' };
      case 'enviado_para_cozinha': return { label: 'Na Cozinha', tone: 'pending', icon: 'clock' };
      case 'em_preparo': return { label: 'Em Preparo', tone: 'preparing', icon: 'chef-hat' };
      case 'pronto': return { label: 'Pronto', tone: 'ready', icon: 'circle-check' };
      default: return { label: status, tone: 'neutral', icon: 'receipt' };
    }
  };

  return (
    <>
      <h1 className="phone__title">Seus pedidos</h1>
      <div className="phone__who" style={{ marginBottom: '1.5rem' }}>
        <svg className="ic"><use href="#i-user"></use></svg>
        Você: {profile?.email?.split('@')[0] || 'Garçom'}
      </div>
      
      {orders.length > 0 ? (
        <div className="orderlist">
          {orders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <article key={order.id} className="orderrow" style={{ '--status-color': `var(--color-status-${statusInfo.tone}-border)` }}>
                <div className="orderrow__table">Mesa {order.tables?.number || 'N/A'}</div>
                <div className="orderrow__main">
                  <div className="orderrow__items">
                    {order.order_items?.map(item => (
                      <span key={item.id} className="orderrow__item">
                        <b className="orderrow__qty mf-num">{item.quantity}×</b> {item.product_name}
                      </span>
                    ))}
                  </div>
                  <div className="orderrow__facts">
                    <span className="fact mf-num">
                      <svg className="ic"><use href="#i-clock"></use></svg> {time}
                    </span>
                    <span className="fact">
                      <svg className="ic"><use href="#i-user"></use></svg> Garçom
                    </span>
                  </div>
                </div>
                <div className="orderrow__status">
                  <span className={`mf-badge mf-badge--${statusInfo.tone}`}>
                    <svg className="ic"><use href={`#i-${statusInfo.icon}`}></use></svg>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="orderrow__actions">
                  {order.status === 'pronto' ? (
                    <button onClick={() => entregarPedido(order.id)} className="mf-btn mf-btn--secondary mf-btn--sm">
                      <svg className="ic"><use href="#i-check"></use></svg> Marcar entregue
                    </button>
                  ) : (
                    <span className="fact mf-num">R$ {Number(order.total_amount).toFixed(2)}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty" style={{ paddingTop: '4rem' }}>
          <svg className="ic"><use href="#i-receipt"></use></svg>
          <h3>Nenhum pedido</h3>
          <p>Você não tem pedidos em andamento no momento.</p>
        </div>
      )}
    </>
  );
}
