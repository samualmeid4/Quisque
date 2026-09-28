import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function CozinhaPainel() {
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
      .select('*, tables(number), order_items(*, products(name))')
      .eq('tenant_id', tenantId)
      .in('status', ['criado', 'enviado_para_cozinha', 'em_preparo', 'pronto'])
      .order('created_at', { ascending: true });
    if (data) setOrders(data);
  };

  const setStatus = async (orderId, status) => {
    const update = { status };
    if (status === 'pronto') {
      update.pronto_at = new Date().toISOString();
    }
    await supabase.from('orders').update(update).eq('id', orderId);
  };

  const renderCard = (p) => {
    // Map internal status to tone
    const tones = {
      criado: 'pending',
      enviado_para_cozinha: 'pending',
      em_preparo: 'preparing',
      pronto: 'ready'
    };
    
    const statusLabels = {
      criado: 'Na Fila',
      enviado_para_cozinha: 'Na Fila',
      em_preparo: 'Em Preparo',
      pronto: 'Pronto'
    };
    
    const icons = {
      criado: 'clock',
      enviado_para_cozinha: 'clock',
      em_preparo: 'chef-hat',
      pronto: 'circle-check'
    };

    const tone = tones[p.status];
    const vars = { '--kc-border': `var(--color-status-${tone}-border)`, '--kc-surface': `var(--color-status-${tone}-surface)` };
    
    const time = new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const origem = p.origin === 'cliente' ? '<svg class="ic"><use href="#i-smartphone"></use></svg> Cliente' : '<svg class="ic"><use href="#i-user"></use></svg> Garçom';

    let acao = '';
    if (p.status === 'criado' || p.status === 'enviado_para_cozinha') {
      acao = (
        <button className="mf-btn mf-btn--preparing mf-btn--kitchen mf-btn--block" onClick={() => setStatus(p.id, 'em_preparo')}>
          <svg className="ic"><use href="#i-chef-hat"></use></svg>Em preparo
        </button>
      );
    } else if (p.status === 'em_preparo') {
      acao = (
        <button className="mf-btn mf-btn--kitchen mf-btn--block" onClick={() => setStatus(p.id, 'pronto')}>
          <svg className="ic"><use href="#i-circle-check"></use></svg>Pronto
        </button>
      );
    } else if (p.status === 'pronto') {
      acao = (
        <button className="mf-btn mf-btn--ready mf-btn--kitchen mf-btn--block" onClick={() => setStatus(p.id, 'finalizado')}>
          <svg className="ic"><use href="#i-check"></use></svg>Entregue
        </button>
      );
    }

    return (
      <article key={p.id} className="kcard" style={vars}>
        <div className="kcard__head">
          <div className="kcard__table mf-num">Mesa {p.tables?.number || 'Balcão'}</div>
          <span className={`mf-badge mf-badge--${tone} mf-badge--lg`}>
            <svg className="ic"><use href={`#i-${icons[p.status]}`}></use></svg>
            {statusLabels[p.status]}
          </span>
        </div>
        <div className="kcard__facts">
          <span className="fact mf-num">
            <svg className="ic"><use href="#i-clock"></use></svg> {time}
          </span>
          <span className="fact" dangerouslySetInnerHTML={{ __html: origem }} />
        </div>
        <div className="kcard__items">
          {p.order_items?.map(i => (
            <div key={i.id}>
              <b className="mf-num">{i.quantity}×</b> {i.products?.name}
            </div>
          ))}
        </div>
        {p.notes && <div className="kcard__obs">Observação: {p.notes}</div>}
        {acao}
      </article>
    );
  };

  const fila = orders.filter(p => p.status === 'criado' || p.status === 'enviado_para_cozinha' || p.status === 'em_preparo');
  const prontos = orders.filter(p => p.status === 'pronto');

  return (
    <div className="kitchen__cols">
      <div className="kcol">
        <div className="kcol__head">
          <h2>Na fila e em preparo</h2>
          <span className="kcount mf-num">{fila.length}</span>
        </div>
        {fila.length > 0 ? (
          <div className="kqueue">
            {fila.map(renderCard)}
          </div>
        ) : (
          <div className="empty">
            <svg className="ic"><use href="#i-utensils"></use></svg>
            <h3>Nenhum pedido na fila</h3>
            <p>Assim que o garçom enviar um pedido, ele aparece aqui.</p>
          </div>
        )}
      </div>

      <div className="kcol">
        <div className="kcol__head">
          <h2>Prontos para retirar</h2>
          <span className="kcount mf-num">{prontos.length}</span>
        </div>
        {prontos.length > 0 ? (
          <div className="kqueue">
            {prontos.map(renderCard)}
          </div>
        ) : (
          <div className="empty">
            <svg className="ic"><use href="#i-circle-check"></use></svg>
            <h3>Nada aguardando retirada</h3>
            <p>Os pedidos prontos ficam aqui até o garçom levar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
