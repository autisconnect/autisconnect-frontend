import React, { useState } from 'react';
import EmotionChart from './EmotionChart';
import SessionsGraph from './SessionsGraph';


const EmotionTrackingDashboard = () => {
    const [activeTab, setActiveTab] = useState('emotions');
    const userId = 1; // você pode passar um ID dinâmico aqui

    return (
        <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Painel de Emoções e Sessões</h1>

        <div className="flex justify-center mb-6">
            <button
            onClick={() => setActiveTab('emotions')}
            className={`px-4 py-2 rounded-l border border-gray-300 ${activeTab === 'emotions' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
            Emoções
            </button>
            <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-r border border-gray-300 ${activeTab === 'sessions' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
            Sessões
            </button>
        </div>

        <div>
            {activeTab === 'emotions' && <EmotionGraph />}
            {activeTab === 'sessions' && <SessionsGraph userId={userId} />}
        </div>
        </div>
    );
};

export default EmotionTrackingDashboard;
