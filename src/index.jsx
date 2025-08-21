import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeAuth } from './utils/auth';

// Inicializar a autenticação antes de renderizar a aplicação
initializeAuth().then(() => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}).catch((error) => {
    console.error('Erro ao inicializar a autenticação:', error);
});