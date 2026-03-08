import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Guard para rotas exclusivas de administradores
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('montador') || '{}');
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ordens" element={<AdminRoute><OrdensServico /></AdminRoute>} />
        <Route path="/montadores" element={<AdminRoute><MontadoresList /></AdminRoute>} />
        <Route path="/montadores/:id" element={<Profile />} />
        <Route path="/montadores/novo" element={<AdminRoute><NovoMontador /></AdminRoute>} />
        <Route path="/convite" element={<ConviteMontador />} />
        <Route path="/convite/:id" element={<ConviteMontador />} />
        <Route path="/historico" element={<AdminRoute><Historico /></AdminRoute>} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/configuracoes" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/verificar-email" element={<VerificarEmail />} />
      </Routes>
    </Router>
  );
}

export default App;
