import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiShoppingCart, FiX, FiCheck } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const emptyForm = { product_id: '', employee_id: '', customer_name: '', quantity: '', unit_price: '', status: 'completed' };

export default function Sales() {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editSale, setEditSale] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await API.get('/sales', { params });
      setSales(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    const [pRes, eRes] = await Promise.all([API.get('/inventory'), API.get('/employees')]);
    setProducts(pRes.data.data);
    setEmployees(eRes.data.data);
  };

  useEffect(() => { fetchSales(); }, [search, statusFilter, fromDate, toDate]);
  useEffect(() => { fetchMeta(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditSale(null); setError(''); setShowModal(true); };
  const openEdit = (sale) => {
    setForm({ product_id: sale.product_id, employee_id: sale.employee_id || '', customer_name: sale.customer_name || '', quantity: sale.quantity, unit_price: sale.unit_price, status: sale.status });
    setEditSale(sale);
    setError('');
    setShowModal(true);
  };

  const handleProductChange = (pid) => {
    const product = products.find(p => p.id === parseInt(pid));
    setForm(f => ({ ...f, product_id: pid, unit_price: product ? product.unit_price : '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editSale) {
        await API.put(`/sales/${editSale.id}`, { status: form.status, customer_name: form.customer_name });
        showToast('Sale updated!');
      } else {
        await API.post('/sales', form);
        showToast('Sale recorded!');
      }
      setShowModal(false);
      fetchSales();
      fetchMeta();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/sales/${deleteId}`);
      setDeleteId(null);
      showToast('Sale deleted.');
      fetchSales();
    } catch {
      showToast('Failed to delete.');
    }
  };

  const statusBadge = { completed: 'badge-green', pending: 'badge-yellow', cancelled: 'badge-red' };
  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + parseFloat(s.total_amount), 0);

  return (
    <div className="page">
      {toast && <div className="toast"><FiCheck /> {toast}</div>}

      <div className="page-header">
        <div>
          <h1>Sales</h1>
          <p className="page-sub">{sales.length} records • Revenue: ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FiPlus /> New Sale</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <FiSearch />
          <input placeholder="Search customer, product..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="From date" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="To date" />
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="page-loader"><div className="pulse-loader"></div></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Employee</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td><span className="sale-id">#{s.id}</span></td>
                  <td>{s.customer_name || '—'}</td>
                  <td>
                    <div>
                      <p className="cell-name">{s.product_name}</p>
                      <p className="cell-sub">{s.sku}</p>
                    </div>
                  </td>
                  <td>{s.employee_name || '—'}</td>
                  <td>{s.quantity}</td>
                  <td>${parseFloat(s.unit_price).toFixed(2)}</td>
                  <td className="total-cell">${parseFloat(s.total_amount).toFixed(2)}</td>
                  <td><span className={`badge ${statusBadge[s.status]}`}>{s.status}</span></td>
                  <td>{format(new Date(s.sale_date), 'MMM dd, HH:mm')}</td>
                  {isAdmin && (
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => openEdit(s)}><FiEdit2 /></button>
                        <button className="icon-btn delete" onClick={() => setDeleteId(s.id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan="10" className="empty-row"><FiShoppingCart /> No sales found</td></tr>
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
              <h2><FiShoppingCart /> {editSale ? 'Edit Sale' : 'New Sale'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              {!editSale && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product *</label>
                      <select value={form.product_id} onChange={e => handleProductChange(e.target.value)} required>
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Employee</label>
                      <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                        <option value="">Select employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required min="1" placeholder="1" />
                    </div>
                    <div className="form-group">
                      <label>Unit Price ($) *</label>
                      <input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} required min="0" placeholder="0.00" />
                    </div>
                  </div>
                </>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="Acme Corp" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              {form.quantity && form.unit_price && (
                <div className="total-preview">
                  Total: <strong>${(parseFloat(form.quantity || 0) * parseFloat(form.unit_price || 0)).toFixed(2)}</strong>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? <span className="spinner"></span> : (editSale ? 'Update' : 'Record Sale')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Sale</h3>
            <p>Are you sure you want to delete this sale record?</p>
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
