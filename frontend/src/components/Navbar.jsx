import { useLocation } from 'react-router-dom';
import { FiBell, FiSearch } from 'react-icons/fi';
import { MdAdminPanelSettings } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const titles = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/inventory': 'Inventory',
  '/sales': 'Sales',
  '/reports': 'Reports',
  '/users': 'User Management',
};

export default function Navbar() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const title = titles[location.pathname] || 'ERP Lite';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2 className="nav-title">{title}</h2>
      </div>
      <div className="navbar-right">
        {isAdmin && (
          <div className="admin-badge">
            <MdAdminPanelSettings /> Admin
          </div>
        )}
        <div className="user-chip">
          <div className="chip-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <span>{user?.username}</span>
        </div>
      </div>
    </header>
  );
}
