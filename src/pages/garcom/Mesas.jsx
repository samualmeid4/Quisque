import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function GarcomMesas() {
  const { tenantId, profile } = useStore();
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenantId) return;
    const fetchTables = async () => {
      const { data } = await supabase.from('tables').select('*').eq('tenant_id', tenantId).order('number');
      if (data) setTables(data);
    };
    fetchTables();

    const channel = supabase
      .channel('public:tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` }, fetchTables)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tenantId]);

  const getStatusInfo = (status) => {
    if (status === 'ocupada') return { class: 'mesacard--ocupada', badge: 'preparing', icon: 'user', label: 'Ocupada' };
    if (status === 'aguardando_fechamento') return { class: 'mesacard--fechamento', badge: 'pending', icon: 'receipt', label: 'Fechar' };
    return { class: '', badge: 'neutral', icon: 'circle', label: 'Livre' };
  };

  return (
    <>
      <h1 className="phone__title">Mesas</h1>
      <div className="phone__who">
        <svg className="ic"><use href="#i-user"></use></svg>
        Você: {profile?.email?.split('@')[0] || 'Garçom'}
      </div>
      
      <div className="mesagrid">
        {tables.map(table => {
          const statusInfo = getStatusInfo(table.status);
          
          return (
            <button 
              key={table.id} 
              className={`mesacard ${statusInfo.class}`}
              onClick={() => navigate(`/garcom/cardapio/${table.id}`)}
            >
              <div className="mf-eyebrow">Mesa</div>
              <div className="mesacard__n mf-num">{table.number}</div>
              <div className="mesacard__foot">
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
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <svg className="ic"><use href="#i-utensils"></use></svg>
            <h3>Nenhuma mesa</h3>
            <p>Cadastre mesas no Admin.</p>
          </div>
        )}
      </div>
    </>
  );
}
