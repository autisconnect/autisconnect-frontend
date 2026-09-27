import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import apiClient from '../services/api';

export const INSTITUTION_CONTEXT_STORAGE_KEY = 'ac_current_context';
export const InstitutionContext = createContext(null);

const persistContext = (context) => {
  if (!context?.key) {
    sessionStorage.removeItem(INSTITUTION_CONTEXT_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(INSTITUTION_CONTEXT_STORAGE_KEY, context.key);
};

export function InstitutionProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [contexts, setContexts] = useState([]);
  const [currentContext, setCurrentContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectContext = useCallback(async (contextOrKey) => {
    const candidate = typeof contextOrKey === 'string'
      ? contexts.find((item) => item.key === contextOrKey)
      : contextOrKey;
    if (!candidate) throw new Error('Contexto indisponivel.');
    const response = await apiClient.post('/me/context', {
      type: candidate.type,
      institutionId: candidate.institutionId
    });
    const selected = response.data.currentContext;
    setCurrentContext(selected);
    persistContext(selected);
    return selected;
  }, [contexts]);

  useEffect(() => {
    if (!user) {
      setContexts([]);
      setCurrentContext(null);
      persistContext(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');
    apiClient.get('/me/contexts')
      .then(async ({ data }) => {
        if (!active) return;
        const available = Array.isArray(data.contexts) ? data.contexts : [];
        setContexts(available);
        const storedKey = sessionStorage.getItem(INSTITUTION_CONTEXT_STORAGE_KEY);
        const desired = available.find((item) => item.key === storedKey)
          || available.find((item) => item.key === 'professional:self')
          || available[0];
        if (!desired) {
          setCurrentContext(null);
          persistContext(null);
          return;
        }
        try {
          const response = await apiClient.post('/me/context', {
            type: desired.type,
            institutionId: desired.institutionId
          });
          if (active) {
            setCurrentContext(response.data.currentContext);
            persistContext(response.data.currentContext);
          }
        } catch (selectionError) {
          if (active) throw selectionError;
        }
      })
      .catch(() => {
        if (!active) return;
        setContexts([]);
        setCurrentContext(null);
        persistContext(null);
        setError('Nao foi possivel carregar os contextos de atuacao.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  const value = useMemo(() => ({ contexts, currentContext, loading, error, selectContext }), [
    contexts, currentContext, loading, error, selectContext
  ]);

  return <InstitutionContext.Provider value={value}>{children}</InstitutionContext.Provider>;
}

export const useInstitutionContext = () => {
  const context = useContext(InstitutionContext);
  if (!context) throw new Error('useInstitutionContext deve ser usado dentro de InstitutionProvider.');
  return context;
};
