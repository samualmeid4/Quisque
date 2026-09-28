import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export default function GarcomLayout() {
  const { logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
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
    <section className="phone" data-density="padrao" style={{ margin: '0 auto' }}>
      <header className="phone__top">
        <div className="brandmark">
          <span className="brandmark__initial">M</span>MesaFlow
        </div>
        <div className="phone__time mf-num">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="phone__scroll">
        <Outlet />
      </div>

      <nav className="phone__tabs">
        <NavLink 
          to="/garcom" 
          end
          className={({ isActive }) => `phonetab ${isActive ? 'active' : ''}`}
          style={({ isActive }) => isActive ? { color: 'var(--color-text-primary)' } : {}}
        >
          <svg className="ic"><use href="#i-utensils"></use></svg>
          Mesas
        </NavLink>
        <NavLink 
          to="/garcom/pedidos" 
          className={({ isActive }) => `phonetab ${isActive ? 'active' : ''}`}
          style={({ isActive }) => isActive ? { color: 'var(--color-text-primary)' } : {}}
        >
          <svg className="ic"><use href="#i-receipt"></use></svg>
          Pedidos
        </NavLink>
        <button onClick={handleLogout} className="phonetab">
          <svg className="ic"><use href="#i-x"></use></svg>
          Sair
        </button>
      </nav>
    </section>
  );
}
