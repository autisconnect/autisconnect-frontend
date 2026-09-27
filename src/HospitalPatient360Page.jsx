import React from 'react';
import { useParams } from 'react-router-dom';
import Patient360 from './components/patient/Patient360';

export default function HospitalPatient360Page() {
  const { hospitalId, patientId } = useParams();
  return <Patient360 patientId={patientId} contextType="hospital" contextId={hospitalId} />;
}
