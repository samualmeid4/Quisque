import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function AdminDashboard() {
  const { tenantId, profile } = useStore();
  const [stats, setStats] = useState({ ordersToday: 0, revenue: 0, activeOrders: 0, inKitchen: 0 });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje');

  useEffect(() => {
    if (!tenantId) return;

    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Orders today
      const { count: ordersToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', today.toISOString());

      // Revenue today (finalizados)
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'finalizado')
        .gte('created_at', today.toISOString());
      
      const revenue = revenueData?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

      // Active orders (not finalizado)
      const { data: activeData } = await supabase
        .from('orders')
        .select('status')
        .eq('tenant_id', tenantId)
        .neq('status', 'finalizado');

      const activeOrders = activeData?.length || 0;
      const inKitchen = activeData?.filter(o => ['enviado', 'em_preparo'].includes(o.status)).length || 0;

      setStats({ ordersToday: ordersToday || 0, revenue, activeOrders, inKitchen });
      setLoading(false);
    };

    fetchStats();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <>
      <div className="greet">
        <div>
          <div className="mf-eyebrow">Hoje · até o momento</div>
          <h1>Bom dia, {profile?.email?.split('@')[0] || 'Admin'}</h1>
          <p>
            O almoço começou. {stats.activeOrders} pedido{stats.activeOrders !== 1 ? 's' : ''} em aberto, {stats.inKitchen} na cozinha.
          </p>
        </div>
        <div className="greet__actions">
          <div className="segmented">
            <button aria-pressed={periodo === 'hoje'} onClick={() => setPeriodo('hoje')}>Hoje</button>
            <button aria-pressed={periodo === 'semana'} onClick={() => setPeriodo('semana')}>Semana</button>
            <button aria-pressed={periodo === 'mes'} onClick={() => setPeriodo('mes')}>Mês</button>
          </div>
          <button className="mf-btn">
            <svg className="ic"><use href="#i-wallet"></use></svg>
            Fechar uma conta
          </button>
        </div>
      </div>

      <div className="dash">
        <div className="mf-metrics">
          <div className="mf-metric">
            <div className="mf-metric__label">Faturamento (Estimado)</div>
            <div className="mf-metric__value mf-num">R$ {stats.revenue.toFixed(2)}</div>
            <div className="mf-metric__foot">hoje</div>
          </div>
          <div className="mf-metric">
            <div className="mf-metric__label">Pedidos</div>
            <div className="mf-metric__value mf-num">{stats.ordersToday}</div>
            <div className="mf-metric__foot">hoje</div>
          </div>
          <div className="mf-metric">
            <div className="mf-metric__label">Ticket médio</div>
            <div className="mf-metric__value mf-num">R$ {stats.ordersToday > 0 ? (stats.revenue / stats.ordersToday).toFixed(2) : '0.00'}</div>
            <div className="mf-metric__foot">hoje</div>
          </div>
        </div>

        <div className="dash__row">
          <div className="panel">
            <div className="card-head">
              <h3>Gráfico (Em breve)</h3>
            </div>
            <div className="empty" style={{ padding: '2rem 0' }}>
              <p>Os gráficos estarão disponíveis na próxima atualização.</p>
            </div>
          </div>
          <div className="panel">
             <div className="card-head">
              <h3>Formas de pagamento</h3>
            </div>
             <div className="empty" style={{ padding: '2rem 0' }}>
              <p>Dados de pagamento em breve.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
