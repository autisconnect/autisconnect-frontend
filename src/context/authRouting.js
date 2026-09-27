import apiClient from '../services/api';

const toAppUser = (apiUser) => ({
  id: apiUser.userId,
  username: apiUser.username,
  tipo_usuario: apiUser.tipo_usuario,
  nome_completo: apiUser.nome_completo,
  clinic_id: apiUser.clinic_id,
  executive_access: Boolean(apiUser.executive_access),
  hospital_id: apiUser.hospital_id || null,
  hospital_role: apiUser.hospital_role || null,
  hospital_roles: Array.isArray(apiUser.hospital_roles) ? apiUser.hospital_roles : (apiUser.hospital_role ? [apiUser.hospital_role] : [])
});

export const shouldUseHospitalDashboard = (user) => {
  const roles = user?.hospital_roles || (user?.hospital_role ? [user.hospital_role] : []);
  return Boolean(user?.hospital_id && (
    user.tipo_usuario !== 'medicos_terapeutas' ||
    roles.some((role) => role !== 'hospital_professional')
  ));
};

export const resolveAuthenticatedUser = async (apiUser) => {
  const appUser = toAppUser(apiUser);

  if (appUser.hospital_id) return appUser;

  try {
    const { data } = await apiClient.get('/me/contexts');
    const hospitalContexts = (data?.contexts || []).filter((context) =>
      context.type === 'hospital' && context.institutionId
    );
    const hospitalContext = appUser.tipo_usuario === 'medicos_terapeutas'
      ? hospitalContexts.find((context) => (context.roles || [context.role]).some((role) => role !== 'hospital_professional'))
      : hospitalContexts[0];
    if (!hospitalContext) return appUser;
    sessionStorage.setItem('ac_current_context', hospitalContext.key);
    return {
      ...appUser,
      hospital_id: hospitalContext.institutionId,
      hospital_role: hospitalContext.role || null,
      hospital_roles: hospitalContext.roles || (hospitalContext.role ? [hospitalContext.role] : [])
    };
  } catch (error) {
    console.warn('Nao foi possivel resolver o contexto hospitalar no login.', error.message);
    return appUser;
  }
};

export const getUserLandingRoute = (user) => {
  if (shouldUseHospitalDashboard(user)) return `/hospital/${user.hospital_id}/dashboard`;
  switch (user.tipo_usuario) {
    case 'medicos_terapeutas': return `/professional-dashboard/${user.id}`;
    case 'pais_responsavel': return `/parent-dashboard/${user.id}`;
    case 'secretaria': return `/secretary-dashboard/${user.id}`;
    case 'clinica': return user.executive_access ? '/dashboard-executivo' : `/clinic-dashboard/${user.id}`;
    case 'servicos_locais': return `/service-dashboard/${user.id}`;
    case 'school': return '/school/dashboard';
    default: return '/';
  }
};
