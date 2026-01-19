// src/main.jsx - VERSÃO FINAL COM tRPC FUNCIONANDO

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';

// Estilos globais
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// === IMPORTS OBRIGATÓRIOS PARA tRPC ===
import { trpc, trpcClient } from './lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Cria o cliente do React Query (cache das queries)
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        {/* PROVIDER DO tRPC - ESSENCIAL */}
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          {/* PROVIDER DO REACT QUERY - ESSENCIAL */}
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </trpc.Provider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);