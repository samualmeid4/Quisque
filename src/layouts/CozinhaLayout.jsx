import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export default function CozinhaLayout() {
  const { logout } = useStore();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  return (
    <section className="kitchen" data-density="cozinha">
      <header className="kitchen__top">
        <div className="brandmark">
          <span className="brandmark__initial">M</span>MesaFlow
        </div>
        <div className="kitchen__clock mf-num" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            <svg className="ic"><use href="#i-clock"></use></svg>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Cozinha
          </span>
          <button onClick={handleLogout} className="mf-btn mf-btn--sm mf-btn--ghost" style={{ padding: '0 8px', minHeight: 'auto' }}>
            <svg className="ic"><use href="#i-x"></use></svg> Sair
          </button>
        </div>
      </header>
      <Outlet />
    </section>
  );
}
