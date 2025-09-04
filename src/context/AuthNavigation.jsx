// src/context/AuthNavigation.jsx
import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const AuthNavigation = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user && user.id && user.tipo_usuario) {
      if (user.tipo_usuario === 'medicos_terapeutas') {
        navigate(`/professional-dashboard/${user.id}`);
      } else if (user.tipo_usuario === 'pais_responsavel') {
        navigate(`/parent-dashboard/${user.id}`);
      } else if (user.tipo_usuario === 'secretaria') {
        navigate(`/secretary-dashboard/${user.id}`);
      } else if (user.tipo_usuario === 'servicos_locais') {
        navigate(`/service-dashboard/${user.id}`);
      }
    }
  }, [user, loading, navigate]);

  return null;
};

export default AuthNavigation;