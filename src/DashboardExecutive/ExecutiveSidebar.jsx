import { useContext } from 'react';
import { BarChartLine, BoxArrowRight, ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logonovo from '../assets/logonovo.png';
import { getExecutiveNavigationGroups } from './executiveNavigation';

const getInitials = (value) => String(value || 'AutisConnect')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((chunk) => chunk[0]?.toUpperCase() || '')
  .join('');

const ExecutiveSidebar = ({
  executiveEnabled,
  modules = {},
  collapsed = false,
  mobile = false,
  onToggleCollapse,
  onNavigate
}) => {
  const { user, logout } = useContext(AuthContext);

  if (!executiveEnabled) return null;

  const { groups, footerItems } = getExecutiveNavigationGroups({ modules, user });
  const userLabel = user?.nome_completo || 'Clinica';
  const userRole = user?.tipo_usuario === 'clinica' ? 'perfil clinica' : 'perfil executivo';

  return (
    <aside
      className={`executive-sidebar${collapsed ? ' executive-sidebar--collapsed' : ''}${
        mobile ? ' executive-sidebar--mobile' : ''
      }`}
      aria-label="Navegacao do Dashboard Executivo"
    >
      <div className="executive-sidebar__brand-block">
        <div className="executive-sidebar__brand-row">
          <div className="executive-sidebar__brand-copy">
            <span className="executive-sidebar__eyebrow">Camada premium</span>
            <img
              src={logonovo}
              alt="AutisConnect"
              className="executive-sidebar__brand-image"
            />
            <strong>Gestao estrategica da operacao</strong>
          </div>

          <span className="executive-sidebar__brand-mark" aria-hidden="true">
            <BarChartLine size={22} />
          </span>

          {!mobile && (
            <button
              type="button"
              className="executive-sidebar__collapse"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        <div className="executive-sidebar__brand-ribbon" aria-hidden="true" />
      </div>

      <nav className="executive-sidebar__nav">
        {groups.map((group) => (
          <div key={group.key} className="executive-sidebar__nav-group">
            <span className="executive-sidebar__group-label">{group.label}</span>
            <div className="executive-sidebar__group-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    end={item.exact}
                    title={item.label}
                    className={({ isActive }) =>
                      `executive-sidebar__item${isActive ? ' is-active' : ''}`
                    }
                    onClick={onNavigate}
                  >
                    <span className="executive-sidebar__item-icon" aria-hidden="true">
                      <Icon size={18} />
                    </span>

                    {!collapsed && (
                      <>
                        <span className="executive-sidebar__item-copy">
                          <span className="executive-sidebar__item-label">{item.label}</span>
                          <span className="executive-sidebar__item-desc">
                            {item.description}
                          </span>
                        </span>
                        <span className="executive-sidebar__item-arrow" aria-hidden="true">
                          <ChevronRight size={14} />
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="executive-sidebar__footer">
        {footerItems.length > 0 && (
          <div className="executive-sidebar__footer-links">
            {footerItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  title={item.label}
                  className="executive-sidebar__footer-link"
                  onClick={onNavigate}
                >
                  <Icon size={16} aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        )}

        <div className="executive-sidebar__account">
          <span className="executive-sidebar__account-avatar">{getInitials(userLabel)}</span>
          {!collapsed && (
            <div className="executive-sidebar__account-copy">
              <strong>{userLabel}</strong>
              <span>{userRole}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="executive-sidebar__logout"
          onClick={logout}
          title="Sair"
        >
          <BoxArrowRight size={16} aria-hidden="true" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default ExecutiveSidebar;
