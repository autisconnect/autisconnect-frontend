// src/main.jsx - VERSÃO CORRETA E FINAL

import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. Importa o BrowserRouter e o renomeia para 'Router' para clareza.
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';

// 2. Importa seus arquivos de estilo globais.
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// 3. Pega o elemento 'root' do seu HTML.
const root = ReactDOM.createRoot(document.getElementById('root'));

// 4. Renderiza a aplicação com a hierarquia CORRETA.
root.render(
  <React.StrictMode>
    {/* 5. Usa <Router>, o nome que definimos no import. */}
    <Router>
      {/* 6. O AuthProvider vem DENTRO do Router. */}
      <AuthProvider>
        {/* 7. O App é o único filho, ele cuidará de todas as rotas. */}
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
