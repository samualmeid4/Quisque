import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, UtensilsCrossed, Monitor, BookOpen, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const { logout, profile } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  return (
    <section className="admin" data-density="compacta">
      <header className="admin__top">
        <div className="brandmark">
          <span className="brandmark__initial">M</span>MesaFlow
        </div>
        <div className="admin__meta mf-num">Admin · {profile?.email}</div>
      </header>
      <div className="admin__body">
        <nav className="admin__nav">
          <NavLink to="/admin/dashboard" className="navitem">
            <svg className="ic"><use href="#i-layout-grid"></use></svg>Resumo
          </NavLink>
          <NavLink to="/admin/pedidos" className="navitem">
            <svg className="ic"><use href="#i-receipt"></use></svg>Pedidos
          </NavLink>
          <NavLink to="/admin/mesas" className="navitem">
            <svg className="ic"><use href="#i-utensils"></use></svg>Mesas
          </NavLink>
          <NavLink to="/admin/cardapio" className="navitem">
            <svg className="ic"><use href="#i-package"></use></svg>Cardápio
          </NavLink>
          <button onClick={handleLogout} className="navitem" style={{ marginTop: 'auto' }}>
            <svg className="ic"><use href="#i-x"></use></svg>Sair
          </button>
        </nav>
        <div className="admin__main">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
