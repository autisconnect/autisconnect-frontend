import { useEffect, useMemo, useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import ExecutiveHeader from './ExecutiveHeader';
import ExecutiveSidebar from './ExecutiveSidebar';
import { resolveExecutiveRouteMeta } from './executiveNavigation';

const EXECUTIVE_SIDEBAR_STORAGE_KEY = 'ac-executive-sidebar-collapsed';

const getInitialSidebarState = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem(EXECUTIVE_SIDEBAR_STORAGE_KEY) === '1';
};

const ExecutiveLayout = ({ children, executiveEnabled, modules }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarState);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const routeMeta = useMemo(
    () => resolveExecutiveRouteMeta(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(
      EXECUTIVE_SIDEBAR_STORAGE_KEY,
      isSidebarCollapsed ? '1' : '0'
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  if (!executiveEnabled) {
    return children;
  }

  return (
    <div
      className={`executive-dashboard-page${
        isSidebarCollapsed ? ' executive-dashboard-page--collapsed' : ''
      }`}
    >
      <aside className="executive-sidebar-shell">
        <ExecutiveSidebar
          executiveEnabled={executiveEnabled}
          modules={modules}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        />
      </aside>

      <Offcanvas
        show={isMobileSidebarOpen}
        onHide={() => setIsMobileSidebarOpen(false)}
        className="executive-offcanvas"
        placement="start"
      >
        <Offcanvas.Body>
          <ExecutiveSidebar
            executiveEnabled={executiveEnabled}
            modules={modules}
            mobile
            onNavigate={() => setIsMobileSidebarOpen(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="executive-shell">
        <ExecutiveHeader
          routeMeta={routeMeta}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
        <main className="executive-main">
          <div className="executive-workspace">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ExecutiveLayout;
