import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ProfessionalDashboard from './ProfessionalDashboard';
import FinancialDashboard from './FinancialDashboard'; // Crie este componente se não existir
import Signup from './Signup';
import Login from './Login';
import { AuthProvider } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/professional-dashboard/:id" element={<ProfessionalDashboard />} />
        <Route path="/financial-dashboard/:id" element={<FinancialDashboard />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);