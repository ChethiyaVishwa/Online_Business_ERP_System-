import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiUsers, FiPackage, FiShoppingCart, FiFileText,
  FiLogOut, FiSettings, FiChevronLeft, FiUserCheck
} from 'react-icons/fi';
import { MdBusinessCenter } from 'react-icons/md';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: FiGrid, label: 'Dashboard' },
  { path: '/employees', icon: FiUsers, label: 'Employees' },
  { path: '/inventory', icon: FiPackage, label: 'Inventory' },
  { path: '/sales', icon: FiShoppingCart, label: 'Sales' },
  { path: '/reports', icon: FiFileText, label: 'Reports' },
  { path: '/users', icon: FiUserCheck, label: 'Users', adminOnly: true },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo"><MdBusinessCenter /></div>
        {!collapsed && (
          <div className="brand-text">
            <span className="brand-name">ERP<span>Lite</span></span>
            <span className="brand-sub">Business Suite</span>
          </div>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <FiChevronLeft className={collapsed ? 'rotated' : ''} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" />
            {!collapsed && <span>{label}</span>}
            {collapsed && <div className="nav-tooltip">{label}</div>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          {!collapsed && (
            <div className="user-details">
              <p className="user-name">{user?.username}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <FiLogOut />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
