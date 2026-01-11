import { useEffect, useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Activity, DollarSign, Users, Wind } from 'lucide-react';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899'];

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    region: 'all',
    smoker: 'all',
    sex: 'all'
  });

  useEffect(() => {
    fetch('/medical-charges.csv')
      .then(response => response.text())
      .then(text => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const parsed = lines.slice(1).map(line => {
          if (!line.trim()) return null;
          const values = line.split(',');
          const entry = {};
          headers.forEach((h, i) => {
            let val = values[i]?.trim();
            if (val && !isNaN(val)) val = parseFloat(val);
            entry[h] = val;
          });
          return entry;
        }).filter(Boolean);
        setData(parsed);
        setLoading(false);
      })
      .catch(err => console.error("Failed to load data", err));
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return (filters.region === 'all' || item.region === filters.region) &&
        (filters.smoker === 'all' || item.smoker === filters.smoker) &&
        (filters.sex === 'all' || item.sex === filters.sex);
    });
  }, [data, filters]);

  // Statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { count: 0, avgCharge: 0, smokerPct: 0 };
    const totalCharges = filteredData.reduce((sum, item) => sum + item.charges, 0);
    const smokers = filteredData.filter(item => item.smoker === 'yes').length;
    return {
      count: filteredData.length,
      avgCharge: totalCharges / filteredData.length,
      smokerPct: (smokers / filteredData.length) * 100
    };
  }, [filteredData]);

  // Chart Data Preparation
  const regionData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      if (!groups[item.region]) groups[item.region] = { region: item.region, total: 0, count: 0 };
      groups[item.region].total += item.charges;
      groups[item.region].count += 1;
    });
    return Object.values(groups).map(g => ({
      name: g.region.charAt(0).toUpperCase() + g.region.slice(1),
      avgCharge: g.total / g.count
    }));
  }, [filteredData]);

  const scatterData = useMemo(() => {
    // Determine detailed fill color based on smoker status for better visualization
    return filteredData.map(item => ({
      ...item,
      fill: item.smoker === 'yes' ? '#ef4444' : '#3b82f6' // Red for smokers, Blue for non-smokers
    }));
  }, [filteredData]);

  // Dropdown options
  const regions = useMemo(() => ['all', ...new Set(data.map(d => d.region).filter(Boolean).sort())], [data]);
  const smokers = useMemo(() => ['all', ...new Set(data.map(d => d.smoker).filter(Boolean).sort())], [data]);
  const sexes = useMemo(() => ['all', ...new Set(data.map(d => d.sex).filter(Boolean).sort())], [data]);

  return (
    <div className="container">
      <header className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Activity size={32} color="var(--accent-primary)" />
          <div>
            <h1 className="header-title" style={{ fontSize: '2rem', marginBottom: '0' }}>Medical Insights</h1>
            <p className="header-subtitle">Healthcare Cost Analysis Dashboard</p>
          </div>
        </div>

        <div className="controls-grid">
          <div className="control-group">
            <label className="control-label">Region</label>
            <select value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}>
              {regions.map(r => (
                <option key={r} value={r}>{r === 'all' ? 'All Regions' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label className="control-label">Smoker</label>
            <select value={filters.smoker} onChange={(e) => handleFilterChange('smoker', e.target.value)}>
              {smokers.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : (s === 'yes' ? 'Smoker' : 'Non-Smoker')}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label className="control-label">Sex</label>
            <select value={filters.sex} onChange={(e) => handleFilterChange('sex', e.target.value)}>
              {sexes.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Genders' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>Loading data...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '0.75rem' }}>
                <Users size={24} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Patients</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.count}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '0.75rem' }}>
                <DollarSign size={24} color="#06b6d4" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg Charge</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>${stats.avgCharge.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.2)', borderRadius: '0.75rem' }}>
                <Wind size={24} color="#ec4899" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Smoker %</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.smokerPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Charts Config */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>

            {/* Scatter Chart */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                BMI vs Charges Correlation
                <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                  <span style={{ color: '#ef4444' }}>●</span> Smoker <span style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>●</span> Non-Smoker
                </span>
              </h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" dataKey="bmi" name="BMI" unit="" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis type="number" dataKey="charges" name="Charges" unit="$" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                      formatter={(value, name) => [name === 'Charges' ? `$${value.toLocaleString()}` : value, name]}
                    />
                    <Scatter name="Patients" data={scatterData} fill="var(--accent-primary)" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Average Charges by Region</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={regionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                      formatter={(value) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Avg Charge']}
                    />
                    <Bar dataKey="avgCharge" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]}>
                      {regionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default App;
