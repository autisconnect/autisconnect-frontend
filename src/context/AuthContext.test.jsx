import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../services/api';
import { getUserLandingRoute, resolveAuthenticatedUser } from './authRouting';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    defaults: { headers: { common: {} } }
  }
}));

describe('redirecionamento de autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('direciona uma conta administrativa do hospital ao dashboard hospitalar', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        contexts: [{
          key: 'hospital:1',
          type: 'hospital',
          institutionId: 1,
          role: 'hospital_admin'
        }]
      }
    });

    const user = await resolveAuthenticatedUser({
      userId: 54,
      username: 'hospital@gmail.com',
      tipo_usuario: 'medicos_terapeutas'
    });

    expect(user.hospital_id).toBe(1);
    expect(user.hospital_role).toBe('hospital_admin');
    expect(sessionStorage.getItem('ac_current_context')).toBe('hospital:1');
    expect(getUserLandingRoute(user)).toBe('/hospital/1/dashboard');
  });

  it('mantém o profissional vinculado no dashboard individual', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        contexts: [{
          key: 'hospital:1',
          type: 'hospital',
          institutionId: 1,
          role: 'hospital_professional'
        }]
      }
    });

    const user = await resolveAuthenticatedUser({
      userId: 54,
      username: 'profissional@gmail.com',
      tipo_usuario: 'medicos_terapeutas'
    });

    expect(user.hospital_id).toBeNull();
    expect(sessionStorage.getItem('ac_current_context')).toBeNull();
    expect(getUserLandingRoute(user)).toBe('/professional-dashboard/54');
  });
});
