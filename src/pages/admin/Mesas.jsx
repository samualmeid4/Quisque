import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function AdminMesas() {
  const { tenantId } = useStore();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    fetchTables();

    const channel = supabase
      .channel('public:tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` }, fetchTables)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tenantId]);

  const fetchTables = async () => {
    const { data } = await supabase.from('tables').select('*').eq('tenant_id', tenantId).order('number');
    if (data) setTables(data);
    setLoading(false);
  };

  const getStatusInfo = (status) => {
    if (status === 'ocupada') return { class: 'tablecard--ocupada', badge: 'preparing', icon: 'user', label: 'Ocupada' };
    if (status === 'aguardando_fechamento') return { class: 'tablecard--fechamento', badge: 'pending', icon: 'receipt', label: 'Fechar conta' };
    return { class: '', badge: 'neutral', icon: 'circle', label: 'Livre' };
  };

  const handleClick = (table) => {
    if (table.status !== 'livre') {
      alert(`Fechamento de conta será implementado aqui para a mesa ${table.number}`);
    } else {
      alert(`Mesa ${table.number} está livre.`);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando mesas...</div>;

  return (
    <>
      <div className="section-head">
        <h2>Mesas</h2>
        <span>toque para fechar a conta</span>
      </div>

      <div className="tablegrid">
        {tables.map(table => {
          const statusInfo = getStatusInfo(table.status);
          
          return (
            <button 
              key={table.id} 
              className={`tablecard ${statusInfo.class}`}
              onClick={() => handleClick(table)}
            >
              <div className="mf-eyebrow">Mesa</div>
              <div className="tablecard__n mf-num">{table.number}</div>
              <div className="tablecard__foot">
                <span className={`mf-badge mf-badge--${statusInfo.badge}`}>
                  <svg className="ic"><use href={`#i-${statusInfo.icon}`}></use></svg>
                  {statusInfo.label}
                </span>
                <svg className="ic"><use href="#i-chevron-right"></use></svg>
              </div>
            </button>
          );
        })}
        {tables.length === 0 && (
          <div style={{ gridColumn: '1 / -1' }} className="empty">
            <svg className="ic"><use href="#i-utensils"></use></svg>
            <h3>Nenhuma mesa</h3>
            <p>Cadastre mesas para começar.</p>
          </div>
        )}
      </div>
    </>
  );
}
