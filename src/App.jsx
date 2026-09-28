import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import Icons from './components/Icons';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import GarcomLayout from './layouts/GarcomLayout';
import CozinhaLayout from './layouts/CozinhaLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPedidos from './pages/admin/Pedidos';
import AdminMesas from './pages/admin/Mesas';
import AdminCardapio from './pages/admin/Cardapio';
import GarcomMesas from './pages/garcom/Mesas';
import GarcomCardapio from './pages/garcom/Cardapio';
import GarcomPedidos from './pages/garcom/Pedidos';
import CozinhaPainel from './pages/cozinha/Painel';
import ClienteCardapio from './pages/cliente/CardapioPublico';
import ClienteCarrinho from './pages/cliente/Carrinho';

function ProtectedRoute({ children, allowedRole }) {
  const { user, profile } = useStore();
  if (!user) return <Navigate to="/login" />;
  if (profile && profile.role !== allowedRole) return <Navigate to="/unauthorized" />;
  return children;
}

function App() {
  const { setUser, setProfile } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };


  return (
    <>
      <Icons />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="mesas" element={<AdminMesas />} />
          <Route path="cardapio" element={<AdminCardapio />} />
        </Route>

        {/* Garcom Routes */}
        <Route path="/garcom" element={<ProtectedRoute allowedRole="garcom"><GarcomLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/garcom/mesas" />} />
          <Route path="mesas" element={<GarcomMesas />} />
          <Route path="pedidos" element={<GarcomPedidos />} />
          <Route path="cardapio/:mesaId" element={<GarcomCardapio />} />
        </Route>

        {/* Cozinha Routes */}
        <Route path="/cozinha" element={<ProtectedRoute allowedRole="cozinha"><CozinhaLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/cozinha/painel" />} />
          <Route path="painel" element={<CozinhaPainel />} />
        </Route>

        {/* Public Routes */}
        <Route path="/cliente/:tenantId" element={<PublicLayout />}>
          <Route index element={<ClienteCardapio />} />
          <Route path="carrinho" element={<ClienteCarrinho />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
