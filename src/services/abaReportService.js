import api from '../services/api';

/**
 * abaReportService
 * Comunicação frontend ↔ backend
 * Relatórios ABA + IA (PDF)
 */
const abaReportService = {

    /* ==============================
       GERAR RELATÓRIO PDF
    ============================== */
    /**
     * Gera relatório ABA + IA em PDF
     * Backend retorna o arquivo para download
     */
    async generatePdf(patientId) {
        const response = await api.get(
            `/aba/report/pdf/${patientId}`,
            { responseType: 'blob' }
        );

        // Criar download automático
        const url = window.URL.createObjectURL(
            new Blob([response.data], { type: 'application/pdf' })
        );

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `relatorio_ABA_paciente_${patientId}.pdf`
        );

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    }
};

export default abaReportService;
