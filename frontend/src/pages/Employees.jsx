import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiX, FiCheck } from 'react-icons/fi';
import { MdWork } from 'react-icons/md';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const DEPARTMENTS = ['Sales', 'IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Support'];

const emptyForm = { name: '', email: '', phone: '', department: '', position: '', salary: '', hire_date: '', status: 'active' };

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (status) params.status = status;
      const res = await API.get('/employees', { params });
      setEmployees(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [search, department, status]);

  const openAdd = () => { setForm(emptyForm); setEditEmployee(null); setError(''); setShowModal(true); };
  const openEdit = (emp) => { setForm({ ...emp, salary: emp.salary || '', hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '' }); setEditEmployee(emp); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editEmployee) {
        await API.put(`/employees/${editEmployee.id}`, form);
        showToast('Employee updated successfully!');
      } else {
        await API.post('/employees', form);
        showToast('Employee added successfully!');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/employees/${deleteId}`);
      setDeleteId(null);
      showToast('Employee deleted.');
      fetchEmployees();
    } catch (err) {
      showToast('Failed to delete employee.');
    }
  };

  const deptColors = { Sales: 'blue', IT: 'purple', HR: 'green', Finance: 'cyan', Operations: 'orange', Marketing: 'pink', Support: 'yellow' };

  return (
    <div className="page">
      {toast && <div className="toast"><FiCheck /> {toast}</div>}

      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="page-sub">{employees.length} team members</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}><FiPlus /> Add Employee</button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <FiSearch />
          <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="page-loader"><div className="pulse-loader"></div></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Salary</th>
                <th>Hire Date</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar">{emp.name[0]}</div>
                      <div>
                        <p className="cell-name">{emp.name}</p>
                        <p className="cell-sub">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${deptColors[emp.department] || 'gray'}`}>{emp.department}</span></td>
                  <td>{emp.position}</td>
                  <td>${parseFloat(emp.salary || 0).toLocaleString()}</td>
                  <td>{emp.hire_date ? format(new Date(emp.hire_date), 'MMM dd, yyyy') : '—'}</td>
                  <td><span className={`badge ${emp.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{emp.status}</span></td>
                  {isAdmin && (
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => openEdit(emp)}><FiEdit2 /></button>
                        <button className="icon-btn delete" onClick={() => setDeleteId(emp.id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan="7" className="empty-row"><FiUser /> No employees found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><MdWork /> {editEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Alice Johnson" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alice@company.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="555-0101" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Position</label>
                  <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Sales Manager" />
                </div>
                <div className="form-group">
                  <label>Salary ($)</label>
                  <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="50000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hire Date</label>
                  <input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? <span className="spinner"></span> : (editEmployee ? 'Save Changes' : 'Add Employee')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Employee</h3>
            <p>Are you sure? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
