import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function AdminPedidos() {
  const { tenantId } = useStore();
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
    const { data } = await supabase
      .from('orders')
      .select('*, tables(number), order_items(*)')
      .eq('tenant_id', tenantId)
      .neq('status', 'finalizado')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const enviarParaCozinha = async (orderId) => {
    await supabase.from('orders').update({ status: 'enviado_para_cozinha', enviado_cozinha_at: new Date().toISOString() }).eq('id', orderId);
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
      <div className="section-head">
        <h2>Pedidos de hoje</h2>
        <span>atualizado agora</span>
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
                  {order.notes && <div className="orderrow__obs">Observação: {order.notes}</div>}
                </div>
                <div className="orderrow__status">
                  <span className={`mf-badge mf-badge--${statusInfo.tone}`}>
                    <svg className="ic"><use href={`#i-${statusInfo.icon}`}></use></svg>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="orderrow__actions">
                  {order.status === 'criado' ? (
                    <button onClick={() => enviarParaCozinha(order.id)} className="mf-btn mf-btn--sm">
                      <svg className="ic"><use href="#i-send"></use></svg> Enviar para cozinha
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
        <div className="empty">
          <svg className="ic"><use href="#i-utensils"></use></svg>
          <h3>Nenhum pedido hoje</h3>
          <p>Assim que o garçom ou um cliente enviar um pedido, ele aparece aqui.</p>
        </div>
      )}
    </>
  );
}
