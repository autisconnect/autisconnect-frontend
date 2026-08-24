import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Dropdown,
  Offcanvas,
  Spinner
} from 'react-bootstrap';
import {
  BarChartLine,
  Bell,
  BoxArrowRight,
  CameraVideo,
  Collection,
  Gear,
  GeoAlt,
  HouseDoor,
  List,
  People,
  PersonBadge
} from 'react-bootstrap-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchSchoolProfile } from './schoolApi';
import { openSchoolMonitoringCenterTab } from './schoolMonitoringLinks';
import './SchoolModule.css';

const SIDEBAR_STORAGE_KEY = 'ac-school-sidebar-collapsed';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Visao Geral', icon: HouseDoor, path: '/school/dashboard' },
  { key: 'students', label: 'Alunos', icon: People, path: '/school/students' },
  { key: 'classrooms', label: 'Turmas', icon: Collection, path: '/school/classrooms' },
  { key: 'locations', label: 'Ambientes', icon: GeoAlt, path: '/school/locations' },
  { key: 'cameras', label: 'Cameras', icon: CameraVideo, path: '/school/cameras' },
  { key: 'monitoring', label: 'Monitoramento', icon: CameraVideo, path: '/school/monitoring' },
  { key: 'events', label: 'Eventos', icon: Bell, path: '/school/events' },
  { key: 'reports', label: 'Relatorios', icon: BarChartLine, path: '/school/reports' },
  { key: 'team', label: 'Equipe', icon: PersonBadge, path: '/school/team' },
  { key: 'settings', label: 'Configuracoes', icon: Gear, path: '/school/settings' }
];

const EMOTION_LABELS = {
  neutral: 'Neutro',
  happy: 'Feliz',
  sad: 'Triste',
  angry: 'Raiva',
  fearful: 'Medo',
  disgusted: 'Desconforto',
  surprised: 'Surpreso'
};

export function getEmotionLabel(emotion) {
  return EMOTION_LABELS[emotion] || 'Analise inconclusiva';
}

export function getInitials(value) {
  const source = `${value || ''}`.trim();
  if (!source) return 'AC';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export function formatDateTimeLabel(value) {
  if (!value) return 'Sem registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

export function formatMinutes(value) {
  const minutes = Number(value || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${String(remainingMinutes).padStart(2, '0')}min`;
  }
  return `${minutes} min`;
}

export function formatPercentage(value) {
  const numericValue = Number(value || 0);
  return `${Math.round(numericValue * 100)}%`;
}

export function formatClockDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(Number(durationMs || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');
}

export function SchoolStatusBadge({ tone = 'neutral', children }) {
  return <span className={`ac-school-status ac-school-status--${tone}`}>{children}</span>;
}

export function SchoolStatCard({ icon: Icon, label, value, meta, tone = 'blue' }) {
  return (
    <article className={`ac-school-stat-card ac-school-stat-card--${tone}`}>
      <div className="ac-school-stat-card__icon">
        <Icon />
      </div>
      <div className="ac-school-stat-card__copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {meta ? <small>{meta}</small> : null}
      </div>
    </article>
  );
}

export function SchoolSectionCard({ eyebrow, title, actions = null, children, compact = false }) {
  return (
    <section className={`ac-school-card${compact ? ' ac-school-card--compact' : ''}`}>
      {(eyebrow || title || actions) ? (
        <div className="ac-school-card__header">
          <div>
            {eyebrow ? <span className="ac-school-card__eyebrow">{eyebrow}</span> : null}
            {title ? <h3>{title}</h3> : null}
          </div>
          {actions ? <div className="ac-school-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="ac-school-card__body">{children}</div>
    </section>
  );
}

export function SchoolEmptyState({ title, description, actionLabel, onAction, icon: Icon = Collection }) {
  return (
    <div className="ac-school-empty-state">
      <div className="ac-school-empty-state__icon">
        <Icon />
      </div>
      <div className="ac-school-empty-state__copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {actionLabel ? (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="ac-school-dashboard ac-school-dashboard--loading">
      <aside className="ac-school-sidebar-shell">
        <div className="ac-school-sidebar">
          <div className="ac-school-skeleton ac-school-skeleton--logo" />
          <div className="ac-school-skeleton ac-school-skeleton--nav" />
          <div className="ac-school-skeleton ac-school-skeleton--nav" />
          <div className="ac-school-skeleton ac-school-skeleton--nav" />
          <div className="ac-school-skeleton ac-school-skeleton--nav" />
        </div>
      </aside>
      <div className="ac-school-shell">
        <header className="ac-school-header">
          <div className="ac-school-skeleton ac-school-skeleton--title" />
          <div className="ac-school-skeleton ac-school-skeleton--actions" />
        </header>
        <main className="ac-school-main">
          <div className="ac-school-skeleton-grid">
            <div className="ac-school-skeleton ac-school-skeleton--panel" />
            <div className="ac-school-skeleton ac-school-skeleton--panel" />
            <div className="ac-school-skeleton ac-school-skeleton--panel" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SchoolShell({
  pageKey,
  eyebrow = 'AutisConnect School',
  title,
  description,
  breadcrumb,
  actions,
  children,
  feedback = null,
  loading = false
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError('');

      try {
        const response = await fetchSchoolProfile();
        if (!isMounted) return;
        setProfile(response?.school || null);
      } catch (error) {
        if (!isMounted) return;
        setProfileError(error.response?.data?.error || 'Nao foi possivel carregar o perfil escolar.');
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'true' : 'false');
  }, [collapsed]);

  if (profileLoading && !profile) {
    return <LoadingShell />;
  }

  const schoolName = profile?.name || user?.nome_completo || 'AutisConnect School';
  const membershipRole = user?.tipo_usuario === 'school' ? 'Instituicao' : 'Usuario';

  const renderSidebar = (mobile = false) => (
    <div className={`ac-school-sidebar${collapsed && !mobile ? ' ac-school-sidebar--collapsed' : ''}`}>
      <div className="ac-school-sidebar__brand-block">
        <div className="ac-school-sidebar__brand-row">
          <div className="ac-school-sidebar__brand-copy">
            <span className="ac-school-sidebar__eyebrow">AutisConnect</span>
            <strong>School</strong>
          </div>
          {!mobile ? (
            <button
              type="button"
              className="ac-school-sidebar__collapse"
              onClick={() => setCollapsed((current) => !current)}
              aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              <List />
            </button>
          ) : null}
        </div>
        <div className="ac-school-sidebar__brand-ribbon" />
      </div>

      <nav className="ac-school-sidebar__nav" aria-label="Navegacao School">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pageKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`ac-school-sidebar__item${isActive ? ' is-active' : ''}`}
              onClick={() => {
                if (item.key === 'monitoring') {
                  openSchoolMonitoringCenterTab();
                } else {
                  navigate(item.path);
                }
                if (mobile) setShowMobileSidebar(false);
              }}
            >
              <span className="ac-school-sidebar__item-icon">
                <Icon />
              </span>
              <span className="ac-school-sidebar__item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="ac-school-sidebar__footer">
        <div className="ac-school-sidebar__user">
          <div className="ac-school-sidebar__avatar">{getInitials(schoolName)}</div>
          <div>
            <strong>{schoolName}</strong>
            <span>{membershipRole}</span>
          </div>
        </div>
        <button type="button" className="ac-school-sidebar__logout" onClick={() => logout()}>
          <BoxArrowRight />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`ac-school-dashboard${collapsed ? ' ac-school-dashboard--collapsed' : ''}`}>
      <aside className="ac-school-sidebar-shell">{renderSidebar()}</aside>

      <Offcanvas
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        placement="start"
        className="ac-school-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>AutisConnect School</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>{renderSidebar(true)}</Offcanvas.Body>
      </Offcanvas>

      <div className="ac-school-shell">
        <header className="ac-school-header">
          <div className="ac-school-header__context">
            <button
              type="button"
              className="ac-school-header__menu-toggle"
              onClick={() => setShowMobileSidebar(true)}
              aria-label="Abrir menu da escola"
            >
              <List />
            </button>
            <div>
              <span className="ac-school-header__breadcrumb">{breadcrumb || 'School'}</span>
              <strong>{schoolName}</strong>
            </div>
          </div>
          <div className="ac-school-header__actions">
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" className="ac-school-profile-toggle">
                <span className="ac-school-profile-toggle__avatar">{getInitials(user?.nome_completo || schoolName)}</span>
                <span className="ac-school-profile-toggle__content">
                  <strong>{user?.nome_completo || schoolName}</strong>
                  <small>{membershipRole}</small>
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="ac-school-dropdown">
                <Dropdown.Header>{schoolName}</Dropdown.Header>
                <Dropdown.Item onClick={() => navigate('/school/settings')}>Configuracoes</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => logout()}>Sair</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        <main className="ac-school-main">
          <section className="ac-school-page-header">
            <div className="ac-school-page-header__copy">
              <span className="ac-school-page-header__eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="ac-school-page-header__actions">{actions}</div> : null}
          </section>

          {profileError ? (
            <Alert variant="warning" className="ac-school-feedback">
              {profileError}
            </Alert>
          ) : null}
          {feedback}

          {loading ? (
            <div className="ac-school-inline-loader">
              <Spinner animation="border" role="status" />
              <span>Carregando dados escolares...</span>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
