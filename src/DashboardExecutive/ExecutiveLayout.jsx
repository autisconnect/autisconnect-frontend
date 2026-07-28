import ExecutiveHeader from './ExecutiveHeader';
import ExecutiveSidebar from './ExecutiveSidebar';

const ExecutiveLayout = ({ children, executiveEnabled, modules }) => (
  <div className="executive-layout">
    <ExecutiveSidebar executiveEnabled={executiveEnabled} modules={modules} />
    <div className="executive-layout-content">
      <ExecutiveHeader />
      <main className="executive-main">{children}</main>
    </div>
  </div>
);

export default ExecutiveLayout;
