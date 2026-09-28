import React from 'react';
import { Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function PublicLayout() {
  const { tenantId } = useStore();

  return (
    <section className="phone" data-density="padrao" style={{ margin: '0 auto' }}>
      <header className="phone__top">
        <div className="brandmark">
          <span className="brandmark__initial">M</span>MesaFlow
        </div>
        <div className="phone__time">Aberto até 23h</div>
      </header>
      <div className="phone__scroll">
        <Outlet />
      </div>
    </section>
  );
}
