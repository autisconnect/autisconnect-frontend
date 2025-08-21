// src/emotion-tracking/SessionsGraph.jsx
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    } from 'chart.js';

    ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

    const SessionsGraph = ({ userId }) => {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:5000/sessions/${userId}`)
        .then(response => setSessions(response.data))
        .catch(error => console.error('Erro ao buscar sessões:', error));
    }, [userId]);

    const chartData = {
        labels: sessions.map(s => new Date(s.start_time).toLocaleDateString()),
        datasets: [
        {
            label: 'Duração da Sessão (min)',
            data: sessions.map(s => {
            const start = new Date(s.start_time);
            const end = new Date(s.end_time);
            return (end - start) / (1000 * 60); // minutos
            }),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
        },
        ],
    };

    return (
        <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-4">Gráfico de Sessões</h2>
        <Bar data={chartData} />
        </div>
    );
};

export default SessionsGraph;
