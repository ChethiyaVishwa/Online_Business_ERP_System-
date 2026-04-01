import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', sku: '', category: '', quantity: '', unit_price: '', reorder_level: '10', supplier: '' };
const CATEGORIES = ['Electronics', 'Furniture', 'Accessories', 'Office Supplies', 'Software', 'Hardware', 'Other'];

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (lowStockOnly) params.low_stock = 'true';
      const res = await API.get('/inventory', { params });
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [search, category, lowStockOnly]);

  const openAdd = () => { setForm(emptyForm); setEditProduct(null); setError(''); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, sku: p.sku || '', category: p.category || '', quantity: p.quantity, unit_price: p.unit_price, reorder_level: p.reorder_level, supplier: p.supplier || '' }); setEditProduct(p); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editProduct) {
        await API.put(`/inventory/${editProduct.id}`, form);
        showToast('Product updated!');
      } else {
        await API.post('/inventory', form);
        showToast('Product added!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/inventory/${deleteId}`);
      setDeleteId(null);
      showToast('Product deleted.');
      fetchProducts();
    } catch (err) {
      showToast('Failed to delete.');
    }
  };

  const stockStatus = (qty, reorder) => {
    if (qty === 0) return { label: 'Out of Stock', cls: 'badge-red' };
    if (qty <= reorder) return { label: 'Low Stock', cls: 'badge-orange' };
    return { label: 'In Stock', cls: 'badge-green' };
  };

  return (
    <div className="page">
      {toast && <div className="toast"><FiCheck /> {toast}</div>}

      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p className="page-sub">{products.length} products • {products.filter(p => p.quantity <= p.reorder_level).length} alerts</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FiPlus /> Add Product</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <FiSearch />
          <input placeholder="Search products, SKU, supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className={`filter-toggle ${lowStockOnly ? 'active' : ''}`} onClick={() => setLowStockOnly(!lowStockOnly)}>
          <FiAlertTriangle /> Low Stock Only
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="page-loader"><div className="pulse-loader"></div></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit Price</th>
                <th>Value</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const status = stockStatus(p.quantity, p.reorder_level);
                return (
                  <tr key={p.id} className={p.quantity <= p.reorder_level ? 'row-alert' : ''}>
                    <td>
                      <div className="product-cell">
                        <div className="product-icon"><FiPackage /></div>
                        <span className="cell-name">{p.name}</span>
                      </div>
                    </td>
                    <td><code className="sku">{p.sku || '—'}</code></td>
                    <td>{p.category || '—'}</td>
                    <td>
                      <div className="stock-cell">
                        <span className={`qty ${p.quantity <= p.reorder_level ? 'qty-low' : ''}`}>{p.quantity}</span>
                        <span className="reorder">/{p.reorder_level}</span>
                      </div>
                    </td>
                    <td>${parseFloat(p.unit_price).toFixed(2)}</td>
                    <td>${(p.quantity * p.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                      {p.quantity <= p.reorder_level && p.quantity > 0 && <FiAlertTriangle className="alert-icon" />}
                    </td>
                    <td>{p.supplier || '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => openEdit(p)}><FiEdit2 /></button>
                        {isAdmin && <button className="icon-btn delete" onClick={() => setDeleteId(p.id)}><FiTrash2 /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td colSpan="9" className="empty-row"><FiPackage /> No products found</td></tr>
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
              <h2><FiPackage /> {editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Laptop Pro 15" />
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="LAP-001" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="TechSupply Co" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="100" min="0" />
                </div>
                <div className="form-group">
                  <label>Unit Price ($)</label>
                  <input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} placeholder="99.99" min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Reorder Level</label>
                  <input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} placeholder="10" min="0" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? <span className="spinner"></span> : (editProduct ? 'Save Changes' : 'Add Product')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <p>Are you sure? This will remove the product from inventory.</p>
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
