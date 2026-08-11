import { useContext } from 'react';
import { BoxArrowRight, List } from 'react-bootstrap-icons';
import { AuthContext } from '../context/AuthContext';

const getInitials = (value) => String(value || 'Clinica')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((chunk) => chunk[0]?.toUpperCase() || '')
  .join('');

const ExecutiveHeader = ({ routeMeta, onToggleMobileSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const userName = user?.nome_completo || 'Clinica';

  return (
    <header className="executive-header">
      <div className="executive-header__context">
        <button
          type="button"
          className="executive-header__menu-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir navegacao executiva"
        >
          <List size={20} />
        </button>

        <div className="executive-header__context-copy">
          <span className="executive-header__breadcrumb">
            {routeMeta?.breadcrumb || 'Clinica / Executivo / Visao Executiva'}
          </span>
          <h1>{routeMeta?.title || 'Visao Executiva'}</h1>
          <p>{routeMeta?.subtitle || 'Performance, crescimento e eficiencia em uma unica visao.'}</p>
        </div>
      </div>

      <div className="executive-header__actions">
        <div className="executive-header__meta">
          <span className="executive-header__meta-label">Painel</span>
          <strong>{routeMeta?.eyebrow || 'Clinica / Executivo'}</strong>
        </div>

        <div className="executive-header__meta">
          <span className="executive-header__meta-label">Atualizacao</span>
          <strong>{todayLabel}</strong>
        </div>

        <div className="executive-header__profile">
          <span className="executive-header__profile-avatar">{getInitials(userName)}</span>
          <div className="executive-header__profile-copy">
            <strong>{userName}</strong>
            <span>{user?.tipo_usuario === 'clinica' ? 'Acesso executivo ativo' : 'Perfil executivo'}</span>
          </div>
        </div>

        <button type="button" className="executive-header__logout" onClick={logout}>
          <BoxArrowRight aria-hidden="true" />
          Sair
        </button>
      </div>
    </header>
  );
};

export default ExecutiveHeader;
