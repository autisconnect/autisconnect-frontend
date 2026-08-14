import React, { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import DashboardABA from '../DashboardABA';

const AbaDashboard = ({ patientId: propPatientId = null }) => {
    const location = useLocation();
    const { patientId: routePatientId } = useParams();

    const queryPatientId = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('patientId');
    }, [location.search]);

    const patientId = propPatientId || routePatientId || queryPatientId || null;

    return <DashboardABA patientId={patientId} />;
};

export default AbaDashboard;
