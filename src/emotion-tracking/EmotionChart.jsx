// src/emotion-tracking/EmotionChart.jsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    } from 'chart.js';

    ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

    const EmotionChart = ({ userId, startDate, endDate }) => {
    const [emotionData, setEmotionData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
        setError('ID do usuário não fornecido.');
        return;
        }

        const fetchEmotions = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
            setError('Usuário não autenticado. Faça login.');
            window.location.href = '/login';
            return;
            }

            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await axios.get(`/api/emotions/${userId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
            });

            setEmotionData(response.data);
            setError(null);
        } catch (error) {
            console.error('Erro ao buscar emoções:', error.response || error.message);
            setError(`Erro ao buscar emoções: ${error.response?.status} - ${error.response?.data.message || error.message}`);
            if (error.response?.status === 401 || error.response?.status === 403) {
            window.location.href = '/login';
            }
        }
        };

        fetchEmotions();
    }, [userId, startDate, endDate]);

    const emotionToValue = (emotion) => {
        const emotionsOrder = ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral'];
        return emotionsOrder.indexOf(emotion);
    };

    const chartData = {
        labels: emotionData.map(item => new Date(item.timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        })),
        datasets: [
        {
            label: 'Emoções',
            data: emotionData.map(item => emotionToValue(item.emotion)),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
            tension: 0.2,
        },
        ],
    };

    const options = {
        scales: {
        y: {
            ticks: {
            callback: (value) => {
                const emotionsOrder = ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral'];
                return emotionsOrder[value] || '';
            },
            },
            title: {
            display: true,
            text: 'Emoção',
            },
        },
        x: {
            title: {
            display: true,
            text: 'Data e Hora',
            },
        },
        },
        plugins: {
        legend: { display: true },
        tooltip: {
            callbacks: {
            label: (context) => {
                const emotionsOrder = ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral'];
                return `Emoção: ${emotionsOrder[context.raw]}`;
            },
            },
        },
        },
    };

    return (
        <div className="bg-white rounded shadow p-4">
        {error && <div className="alert alert-danger">{error}</div>}
        <h5>Gráfico de Emoções</h5>
        <Line data={chartData} options={options} />
        </div>
    );
};

export default EmotionChart;