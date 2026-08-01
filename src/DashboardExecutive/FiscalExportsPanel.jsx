import { useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';
import apiClient from '../services/api';
import { exportCsv, printReport } from './reportExport';
export default function FiscalExportsPanel({ competence }) {
  const [exporting, setExporting] = useState(false); const [error, setError] = useState('');
  const run = async (format) => { setExporting(true); setError(''); try { const { data } = await apiClient.get('/executive/fiscal/export', { params: { competence } }); if (format === 'csv') exportCsv('relatorio-fiscal-' + competence, data.columns, data.rows); else printReport(data.title, data.columns, data.rows); } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível exportar o relatório fiscal.'); } finally { setExporting(false); } };
  return <Card className="mt-4"><Card.Body><Card.Title className="h5">Exportação fiscal gerencial</Card.Title><p className="small text-muted">Exporta somente dados agregados da competência selecionada. O PDF é aberto na janela de impressão do navegador.</p>{error && <Alert variant="danger">{error}</Alert>}<div className="d-flex gap-2"><Button onClick={() => run('pdf')} disabled={exporting}>{exporting ? 'Preparando...' : 'Exportar PDF'}</Button><Button variant="outline-secondary" onClick={() => run('csv')} disabled={exporting}>Exportar CSV</Button></div></Card.Body></Card>;
}
