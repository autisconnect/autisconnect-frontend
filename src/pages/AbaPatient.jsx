import React, { useState } from 'react';

import AbaDashboard from './AbaDashboard'; // está na mesma pasta pages/
import AbaReport from './AbaReport';         // está na mesma pasta pages/

import AbaSessionsList from '../components/AbaSessionsList';
import AbaSessionForm from '../components/AbaSessionForm';
import AbaCharts from '../components/AbaCharts';
import AbaAiAnalysis from '../components/AbaAiAnalysis';

// Os que ainda não existem vamos comentar ou deixar placeholder
// import AbaForecast from '../components/AbaForecast'; 
// import AbaProgramSuggestions from '../components/AbaProgramSuggestions';
// import AbaProgramMonitoring from '../components/AbaProgramMonitoring';

import '../App.css';

const AbaPatient = ({ patientId }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AbaDashboard patientId={patientId} />;

            case 'sessions':
                return <AbaSessionsList patientId={patientId} />;

            case 'new-session':
                return <AbaSessionForm patientId={patientId} />;

            case 'charts':
                return <AbaCharts patientId={patientId} />;

            case 'analysis':
                return <AbaAiAnalysis patientId={patientId} />;

            case 'report':
                return <AbaReport patientId={patientId} />;

            // Abas futuras – placeholder bonito
            case 'forecast':
            case 'suggestions':
            case 'monitoring':
                return (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
                        <h3>
                            {activeTab === 'forecast' && 'Previsão'}
                            {activeTab === 'suggestions' && 'Sugestões de Programa'}
                            {activeTab === 'monitoring' && 'Monitoramento de Programa'}
                        </h3>
                        <p>Esta funcionalidade está em desenvolvimento e será disponibilizada em breve.</p>
                    </div>
                );

            default:
                return <AbaDashboard patientId={patientId} />;
        }
    };

    return (
        <div className="aba-patient-container">
            <h2>ABA – Monitoramento Clínico</h2>

            {/* MENU DE ABAS */}
            <div className="aba-tabs">
                <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                    Dashboard
                </button>
                <button className={activeTab === 'sessions' ? 'active' : ''} onClick={() => setActiveTab('sessions')}>
                    Sessões
                </button>
                <button className={activeTab === 'new-session' ? 'active' : ''} onClick={() => setActiveTab('new-session')}>
                    Nova Sessão
                </button>
                <button className={activeTab === 'charts' ? 'active' : ''} onClick={() => setActiveTab('charts')}>
                    Gráficos
                </button>
                <button className={activeTab === 'analysis' ? 'active' : ''} onClick={() => setActiveTab('analysis')}>
                    Análise IA
                </button>
                <button className={activeTab === 'report' ? 'active' : ''} onClick={() => setActiveTab('report')}>
                    Relatório
                </button>

                {/* Abas futuras – pode deixar visíveis ou ocultar até implementar */}
                <button onClick={() => setActiveTab('forecast')}>Previsão</button>
                <button onClick={() => setActiveTab('suggestions')}>Sugestões</button>
                <button onClick={() => setActiveTab('monitoring')}>Monitoramento</button>
            </div>

            {/* CONTEÚDO DA ABA */}
            <div className="aba-content">
                {renderTab()}
            </div>
        </div>
    );
};

export default AbaPatient;