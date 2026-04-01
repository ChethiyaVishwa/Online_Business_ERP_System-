import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiUser, FiX, FiCheck, FiShield } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const emptyForm = { username: '', email: '', password: '', role: 'staff' };

export default function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/auth/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await API.post('/auth/register', form);
      showToast('User registered!');
      setShowModal(false);
      setForm(emptyForm);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register user.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="no-access">
          <FiShield />
          <h2>Access Denied</h2>
          <p>Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {toast && <div className="toast"><FiCheck /> {toast}</div>}
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-sub">{users.length} system users</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowModal(true); setError(''); setForm(emptyForm); }}>
          <FiPlus /> Add User
        </button>
      </div>

      <div className="table-card">
        {loading ? <div className="page-loader"><div className="pulse-loader"></div></div> : (
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Created</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar">{u.username[0].toUpperCase()}</div>
                      <span className="cell-name">{u.username}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                  <td>{format(new Date(u.created_at), 'MMM dd, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiUser /> Register New User</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="john_doe" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="john@erp.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? <span className="spinner"></span> : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
