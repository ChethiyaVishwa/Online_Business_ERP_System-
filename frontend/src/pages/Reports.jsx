import { useState, useEffect } from 'react';
import { FiFileText, FiAlertTriangle, FiDownload, FiCalendar } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import API from '../api/axios';
import { format, subDays } from 'date-fns';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesReport, setSalesReport] = useState({ data: [], summary: {} });
  const [inventoryReport, setInventoryReport] = useState({ data: [], lowStock: [], totalValue: 0 });
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports/sales-report', { params: { from_date: fromDate, to_date: toDate } });
      setSalesReport(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports/inventory-report');
      setInventoryReport(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    else fetchInventoryReport();
  }, [activeTab, fromDate, toDate]);

  // Group sales by date for chart
  const salesChartData = salesReport.data.reduce((acc, sale) => {
    const date = format(new Date(sale.sale_date), 'MMM dd');
    const existing = acc.find(d => d.date === date);
    if (existing) { existing.revenue += parseFloat(sale.total_amount); existing.orders++; }
    else acc.push({ date, revenue: parseFloat(sale.total_amount), orders: 1 });
    return acc;
  }, []).reverse();

  const exportCSV = () => {
    if (activeTab === 'sales') {
      const rows = [['ID', 'Customer', 'Product', 'Qty', 'Unit Price', 'Total', 'Status', 'Date']];
      salesReport.data.forEach(s => rows.push([s.id, s.customer_name, s.product_name, s.quantity, s.unit_price, s.total_amount, s.status, format(new Date(s.sale_date), 'yyyy-MM-dd')]));
      downloadCSV(rows, 'sales-report.csv');
    } else {
      const rows = [['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Unit Price', 'Value', 'Reorder Level', 'Supplier']];
      inventoryReport.data.forEach(p => rows.push([p.id, p.name, p.sku, p.category, p.quantity, p.unit_price, (p.quantity * p.unit_price).toFixed(2), p.reorder_level, p.supplier]));
      downloadCSV(rows, 'inventory-report.csv');
    }
  };

  const downloadCSV = (rows, filename) => {
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-sub">Business intelligence & analytics</p>
        </div>
        <button className="btn-secondary" onClick={exportCSV}><FiDownload /> Export CSV</button>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
          <FiFileText /> Sales Report
        </button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <FiAlertTriangle /> Inventory Report
        </button>
      </div>

      {activeTab === 'sales' && (
        <>
          {/* Date filters */}
          <div className="filter-bar">
            <div className="date-filter">
              <FiCalendar />
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span>to</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="report-kpis">
            <div className="report-kpi">
              <p>Total Revenue</p>
              <h3>${parseFloat(salesReport.summary?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="report-kpi">
              <p>Completed Orders</p>
              <h3>{salesReport.summary?.count || 0}</h3>
            </div>
            <div className="report-kpi">
              <p>Avg Order Value</p>
              <h3>{salesReport.summary?.count > 0 ? `$${(salesReport.summary.total / salesReport.summary.count).toFixed(2)}` : '$0.00'}</h3>
            </div>
            <div className="report-kpi">
              <p>Total Records</p>
              <h3>{salesReport.data.length}</h3>
            </div>
          </div>

          {/* Chart */}
          {salesChartData.length > 0 && (
            <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
              <h3>Sales Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sales Table */}
          <div className="table-card">
            {loading ? <div className="page-loader"><div className="pulse-loader"></div></div> : (
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Customer</th><th>Product</th><th>Category</th><th>Employee</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {salesReport.data.map(s => (
                    <tr key={s.id}>
                      <td><span className="sale-id">#{s.id}</span></td>
                      <td>{s.customer_name || '—'}</td>
                      <td>{s.product_name}</td>
                      <td>{s.category || '—'}</td>
                      <td>{s.employee_name || '—'}</td>
                      <td>{s.quantity}</td>
                      <td className="total-cell">${parseFloat(s.total_amount).toFixed(2)}</td>
                      <td><span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>{s.status}</span></td>
                      <td>{format(new Date(s.sale_date), 'MMM dd, yyyy')}</td>
                    </tr>
                  ))}
                  {salesReport.data.length === 0 && <tr><td colSpan="9" className="empty-row">No sales in this period</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <>
          <div className="report-kpis">
            <div className="report-kpi">
              <p>Total Inventory Value</p>
              <h3>${inventoryReport.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="report-kpi">
              <p>Total Products</p>
              <h3>{inventoryReport.data.length}</h3>
            </div>
            <div className="report-kpi alert-kpi">
              <p>Low Stock / Out of Stock</p>
              <h3>{inventoryReport.lowStock?.length || 0} items</h3>
            </div>
          </div>

          {/* Low Stock Alert */}
          {inventoryReport.lowStock?.length > 0 && (
            <div className="alert-section">
              <h3><FiAlertTriangle /> Low Stock Alerts</h3>
              <div className="alert-grid">
                {inventoryReport.lowStock.map(p => (
                  <div key={p.id} className={`alert-card ${p.quantity === 0 ? 'critical' : ''}`}>
                    <div className="alert-card-top">
                      <span className="alert-product">{p.name}</span>
                      <span className={`badge ${p.quantity === 0 ? 'badge-red' : 'badge-orange'}`}>{p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}</span>
                    </div>
                    <div className="alert-card-meta">
                      <span>Stock: <strong>{p.quantity}</strong> / Reorder: {p.reorder_level}</span>
                      <span>{p.supplier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Chart */}
          <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
            <h3>Stock Levels — Top 10 Products</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={inventoryReport.data.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-card">
            {loading ? <div className="page-loader"><div className="pulse-loader"></div></div> : (
              <table className="data-table">
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Reorder Level</th><th>Unit Price</th><th>Total Value</th><th>Supplier</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {inventoryReport.data.map(p => (
                    <tr key={p.id} className={p.quantity <= p.reorder_level ? 'row-alert' : ''}>
                      <td><span className="cell-name">{p.name}</span></td>
                      <td><code className="sku">{p.sku || '—'}</code></td>
                      <td>{p.category || '—'}</td>
                      <td><span className={p.quantity <= p.reorder_level ? 'qty-low' : ''}>{p.quantity}</span></td>
                      <td>{p.reorder_level}</td>
                      <td>${parseFloat(p.unit_price).toFixed(2)}</td>
                      <td>${(p.quantity * p.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>{p.supplier || '—'}</td>
                      <td>
                        <span className={`badge ${p.quantity === 0 ? 'badge-red' : p.quantity <= p.reorder_level ? 'badge-orange' : 'badge-green'}`}>
                          {p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.reorder_level ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
