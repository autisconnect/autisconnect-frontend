// src/components/AbaReportPDF.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11 },
  title: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  section: { marginBottom: 12 },
  label: { fontWeight: 'bold' },
  // ... outros estilos
});

const AbaReportPDF = ({ patient, sessions, programs, analytics, forecast }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório ABA + IA</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Paciente:</Text>
        <Text>{patient?.name || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Programas ABA</Text>
        {programs?.map(p => (
          <Text key={p.id}>{p.programName} — Status: {p.status}</Text>
        ))}
      </View>

      {/* Adicione mais seções conforme necessário */}
    </Page>
  </Document>
);

export default AbaReportPDF;