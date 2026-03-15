import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrdensServico from './pages/OrdensServico';
import NovoMontador from './pages/NovoMontador';
import MontadoresList from './pages/MontadoresList';
import ConviteMontador from './pages/ConviteMontador';
import Historico from './pages/Historico';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import VerificarEmail from './pages/VerificarEmail';
import CadastroMontador from './pages/CadastroMontador';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Guard para rotas exclusivas de administradores
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('montador') || '{}');
  if (user?.role?.toLowerCase() !== 'admin') return <Navigate to="/login" replace />;
  return children;
};

function App() {
  // Sincronização silenciosa do perfil ao carregar o app
  useEffect(() => {
    const syncProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const { data } = await api.get('/montadores/me');
          localStorage.setItem('montador', JSON.stringify(data));
        } catch (err) {
          console.error('Erro ao sincronizar perfil:', err);
        }
      }
    };
    syncProfile();
  }, []);

  return (
    <Router>
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/ordens" element={<OrdensServico />} />
        <Route path="/montadores" element={<AdminRoute><MontadoresList /></AdminRoute>} />
        <Route path="/montadores/:id" element={<Profile />} />
        <Route path="/montadores/novo" element={<AdminRoute><NovoMontador /></AdminRoute>} />
        <Route path="/convite" element={<ConviteMontador />} />
        <Route path="/convite/:id" element={<ConviteMontador />} />
        <Route path="/historico" element={<AdminRoute><Historico /></AdminRoute>} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/configuracoes" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/cadastro" element={<CadastroMontador />} />
      </Routes>
    </Router>
  );
}

export default App;
