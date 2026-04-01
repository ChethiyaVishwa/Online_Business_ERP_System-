import { useState, useEffect } from 'react';
import { FiTrendingUp, FiUsers, FiPackage, FiShoppingCart, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { MdAttachMoney } from 'react-icons/md';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import API from '../api/axios';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

function KPICard({ title, value, icon: Icon, color, prefix = '', suffix = '', trend }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-icon"><Icon /></div>
      <div className="kpi-content">
        <p className="kpi-label">{title}</p>
        <h3 className="kpi-value">{prefix}{typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: prefix === '$' ? 2 : 0, maximumFractionDigits: prefix === '$' ? 2 : 0 }) : value}{suffix}</h3>
        {trend !== undefined && (
          <span className={`kpi-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </span>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tt-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kRes, cRes, tRes, catRes, actRes] = await Promise.all([
          API.get('/reports/kpis'),
          API.get('/reports/sales-chart'),
          API.get('/reports/top-products'),
          API.get('/reports/revenue-by-category'),
          API.get('/reports/recent-activity'),
        ]);
        setKpis(kRes.data.data);
        setChartData(cRes.data.data.map(d => ({ ...d, date: format(new Date(d.date), 'MMM dd') })));
        setTopProducts(tRes.data.data);
        setCategoryData(catRes.data.data.map(d => ({ ...d, revenue: parseFloat(d.revenue) })));
        setRecentActivity(actRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="page-loader"><div className="pulse-loader"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-sub">Welcome back! Here's your business overview.</p>
        </div>
        <div className="date-badge">{format(new Date(), 'MMMM dd, yyyy')}</div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KPICard title="Monthly Revenue" value={kpis?.monthlyRevenue || 0} icon={MdAttachMoney} color="purple" prefix="$" />
        <KPICard title="Monthly Orders" value={kpis?.monthlyOrders || 0} icon={FiShoppingCart} color="blue" />
        <KPICard title="Active Employees" value={kpis?.activeEmployees || 0} icon={FiUsers} color="green" />
        <KPICard title="Total Products" value={kpis?.totalProducts || 0} icon={FiPackage} color="cyan" />
        <KPICard title="Total Revenue" value={kpis?.totalRevenue || 0} icon={FiTrendingUp} color="indigo" prefix="$" />
        <KPICard title="Low Stock Alerts" value={kpis?.lowStockAlerts || 0} icon={FiAlertTriangle} color="orange" />
        <KPICard title="Pending Sales" value={kpis?.pendingSales || 0} icon={FiClock} color="yellow" />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card wide">
          <h3>Revenue & Orders — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" name="revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <YAxis dataKey="category" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Top Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card recent-activity">
          <h3>Recent Sales Activity</h3>
          <div className="activity-list">
            {recentActivity.map((item, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-icon"><FiShoppingCart /></div>
                <div className="activity-content">
                  <p className="activity-title">{item.detail}</p>
                  <p className="activity-sub">{item.name} • {item.date ? format(new Date(item.date), 'MMM dd HH:mm') : ''}</p>
                </div>
                <div className="activity-amount">${parseFloat(item.amount).toFixed(2)}</div>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="empty-state">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
