import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import AuthContext from '../context/AuthContext';

/* ─── Reusable modal ──────────────────────────────────────────────────── */
const Modal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: '480px', margin: '24px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--gray)' }}>✕</button>
            </div>
            {children}
        </div>
    </div>
);

/* ─── Status badge ────────────────────────────────────────────────────── */
const StatusBadge = ({ value }) => {
    const colors = {
        active: { bg: '#d1fae5', color: '#065f46' },
        completed: { bg: '#e0e7ff', color: '#3730a3' },
        on_hold: { bg: '#fef3c7', color: '#92400e' },
    };
    const style = colors[value] || { bg: '#f1f5f9', color: '#475569' };
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
            fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
            background: style.bg, color: style.color
        }}>
            {value?.replace('_', ' ')}
        </span>
    );
};

/* ─── PROJECTS TAB ────────────────────────────────────────────────────── */
const ProjectsTab = () => {
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', code: '', budget: '', status: 'active' });

    const fetchProjects = async () => {
        try {
            const { data } = await api.get('/enterprise/projects');
            setProjects(data);
        } catch { toast.error('Failed to load projects'); }
        setLoading(false);
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleEdit = (p) => {
        setEditingId(p.id);
        setForm({ name: p.name, code: p.code || '', budget: p.budget || '', status: p.status });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await api.delete(`/enterprise/projects/${id}`);
            toast.success('Project deleted');
            fetchProjects();
        } catch (err) { toast.error('Failed to delete project'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/enterprise/projects/${editingId}`, form);
                toast.success('Project updated!');
            } else {
                await api.post('/enterprise/projects', form);
                toast.success('Project created!');
            }
            setShowModal(false);
            setEditingId(null);
            setForm({ name: '', code: '', budget: '', status: 'active' });
            fetchProjects();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search projects by name or code..." 
                        className="form-control" 
                        style={{ paddingLeft: '40px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ name: '', code: '', budget: '', status: 'active' }); setShowModal(true); }}>+ New Project</button>
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>Loading…</div>
            ) : filteredProjects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                    <h4 style={{ marginBottom: '8px' }}>{search ? 'No Matching Projects' : 'No Projects Yet'}</h4>
                    <p style={{ color: 'var(--gray)' }}>{search ? 'Try a different search term.' : 'Create your first project to start tracking expenses.'}</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--light)' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Project</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Code</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Budget</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Spent</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Status</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-light)', background: p.isOverBudget ? '#fff1f2' : 'none' }}>
                                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {p.name}
                                            {p.isOverBudget && <span title="Over Budget!" style={{ cursor: 'help' }}>🚩</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: 'var(--gray)', fontFamily: 'monospace' }}>{p.code || '—'}</td>
                                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                                        {p.budget ? `$${parseFloat(p.budget).toLocaleString()}` : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ fontWeight: '700', color: p.isOverBudget ? 'var(--danger)' : 'var(--success)' }}>
                                            ${p.totalSpent?.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--gray)' }}>{p.usagePercentage}% utilized</div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}><StatusBadge value={p.status} /></td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px' }} title="Edit">✏️</button>
                                            <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px' }} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showModal && (
                <Modal title={editingId ? "📁 Edit Project" : "📁 New Project"} onClose={() => { setShowModal(false); setEditingId(null); }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Project Name *</label>
                            <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q2 Marketing Campaign" />
                        </div>
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label>Project Code</label>
                                <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. PRJ-001" />
                            </div>
                            <div>
                                <label>Budget ($)</label>
                                <input type="number" className="form-control" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} min="0" step="0.01" placeholder="0.00" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                            {editingId ? 'Save Changes' : 'Create Project'}
                        </button>
                    </form>
                </Modal>
            )}
        </>
    );
};

/* ─── VENDORS TAB ────────────────────────────────────────────────────── */
const VendorsTab = () => {
    const toast = useToast();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', category: '', contactEmail: '', taxId: '' });

    const fetchVendors = async () => {
        try {
            const { data } = await api.get('/enterprise/vendors');
            setVendors(data);
        } catch { toast.error('Failed to load vendors'); }
        setLoading(false);
    };

    useEffect(() => { fetchVendors(); }, []);

    const handleEdit = (v) => {
        setEditingId(v.id);
        setForm({ name: v.name, category: v.category || '', contactEmail: v.contactEmail || '', taxId: v.taxId || '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;
        try {
            await api.delete(`/enterprise/vendors/${id}`);
            toast.success('Vendor deleted');
            fetchVendors();
        } catch (err) { toast.error('Failed to delete vendor'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/enterprise/vendors/${editingId}`, form);
                toast.success('Vendor updated!');
            } else {
                await api.post('/enterprise/vendors', form);
                toast.success('Vendor added!');
            }
            setShowModal(false);
            setEditingId(null);
            setForm({ name: '', category: '', contactEmail: '', taxId: '' });
            fetchVendors();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(search.toLowerCase()) || 
        v.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search vendors by name or category..." 
                        className="form-control" 
                        style={{ paddingLeft: '40px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ name: '', category: '', contactEmail: '', taxId: '' }); setShowModal(true); }}>+ Add Vendor</button>
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>Loading…</div>
            ) : filteredVendors.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                    <h4 style={{ marginBottom: '8px' }}>{search ? 'No Matching Vendors' : 'No Vendors Yet'}</h4>
                    <p style={{ color: 'var(--gray)' }}>{search ? 'Try a different search term.' : 'Add vendors to track your suppliers.'}</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--light)' }}>
                                {['Vendor Name', 'Category', 'Contact Email', 'Tax ID'].map(h => (
                                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>{h}</th>
                                ))}
                                <th style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVendors.map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{v.name}</td>
                                    <td style={{ padding: '14px 16px', color: 'var(--gray)' }}>{v.category || '—'}</td>
                                    <td style={{ padding: '14px 16px' }}>{v.contactEmail || '—'}</td>
                                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--gray)', fontSize: '13px' }}>{v.taxId || '—'}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => handleEdit(v)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px' }} title="Edit">✏️</button>
                                            <button onClick={() => handleDelete(v.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px' }} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showModal && (
                <Modal title={editingId ? "🏢 Edit Vendor" : "🏢 Add Vendor"} onClose={() => { setShowModal(false); setEditingId(null); }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Vendor Name *</label>
                            <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acme Corp" />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Software, Supplies" />
                        </div>
                        <div className="form-group">
                            <label>Contact Email</label>
                            <input type="email" className="form-control" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} placeholder="billing@vendor.com" />
                        </div>
                        <div className="form-group">
                            <label>Tax ID / VAT Number</label>
                            <input className="form-control" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} placeholder="e.g. US-1234567" />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                            {editingId ? 'Save Changes' : 'Add Vendor'}
                        </button>
                    </form>
                </Modal>
            )}
        </>
    );
};

/* ─── ASSETS TAB ─────────────────────────────────────────────────────── */
const AssetsTab = () => {
    const toast = useToast();
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', serialNumber: '', purchaseDate: '', purchasePrice: '', assignedTo: '' });

    const fetchAssets = async () => {
        try {
            const [assetRes, userRes] = await Promise.all([
                api.get('/enterprise/assets'),
                api.get('/enterprise/users')
            ]);
            setAssets(assetRes.data);
            setUsers(userRes.data);
        } catch { toast.error('Failed to load assets data'); }
        setLoading(false);
    };

    useEffect(() => { fetchAssets(); }, []);

    const handleEdit = (a) => {
        setEditingId(a.id);
        setForm({ 
            name: a.name, 
            serialNumber: a.serialNumber || '', 
            purchaseDate: a.purchaseDate ? a.purchaseDate.split('T')[0] : '', 
            purchasePrice: a.purchasePrice || '',
            assignedTo: a.assignedTo || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) return;
        try {
            await api.delete(`/enterprise/assets/${id}`);
            toast.success('Asset deleted');
            fetchAssets();
        } catch (err) { toast.error('Failed to delete asset'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/enterprise/assets/${editingId}`, form);
                toast.success('Asset updated!');
            } else {
                await api.post('/enterprise/assets', form);
                toast.success('Asset registered!');
            }
            setShowModal(false);
            setEditingId(null);
            setForm({ name: '', serialNumber: '', purchaseDate: '', purchasePrice: '', assignedTo: '' });
            fetchAssets();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const filteredAssets = assets.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        a.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
        a.User?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalValue = assets.reduce((sum, a) => sum + (parseFloat(a.purchasePrice) || 0), 0);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search assets by name, serial, or user..." 
                        className="form-control" 
                        style={{ paddingLeft: '40px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {assets.length > 0 && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: 'var(--gray)', textTransform: 'uppercase', fontWeight: '700' }}>Total Inventory Value</div>
                            <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '18px' }}>
                                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    )}
                    <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ name: '', serialNumber: '', purchaseDate: '', purchasePrice: '', assignedTo: '' }); setShowModal(true); }}>+ Register Asset</button>
                </div>
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>Loading…</div>
            ) : filteredAssets.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                    <h4 style={{ marginBottom: '8px' }}>{search ? 'No Matching Assets' : 'No Assets Registered'}</h4>
                    <p style={{ color: 'var(--gray)' }}>{search ? 'Try a different search term.' : 'Register company assets to track their value.'}</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--light)' }}>
                                {['Asset Name', 'Serial No.', 'Purchase Date', 'Value', 'Assigned To'].map(h => (
                                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>{h}</th>
                                ))}
                                <th style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssets.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{a.name}</td>
                                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--gray)', fontSize: '13px' }}>{a.serialNumber || '—'}</td>
                                    <td style={{ padding: '14px 16px', color: 'var(--gray)' }}>
                                        {a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--success-dark)' }}>
                                        {a.purchasePrice ? `$${parseFloat(a.purchasePrice).toLocaleString()}` : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: 'var(--gray)' }}>
                                        {a.User ? a.User.name : 'Unassigned'}
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => handleEdit(a)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px' }} title="Edit">✏️</button>
                                            <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px' }} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showModal && (
                <Modal title={editingId ? "💼 Edit Asset" : "💼 Register Asset"} onClose={() => { setShowModal(false); setEditingId(null); }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Asset Name *</label>
                            <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. MacBook Pro 16-inch" />
                        </div>
                        <div className="form-group">
                            <label>Serial Number</label>
                            <input className="form-control" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} placeholder="e.g. FVFXC2ABCD" />
                        </div>
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label>Purchase Date</label>
                                <input type="date" className="form-control" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                            </div>
                            <div>
                                <label>Purchase Price ($)</label>
                                <input type="number" className="form-control" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} min="0" step="0.01" placeholder="0.00" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Assign To User</label>
                            <select className="form-control" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                            {editingId ? 'Save Changes' : 'Register Asset'}
                        </button>
                    </form>
                </Modal>
            )}
        </>
    );
};

/* ─── USERS TAB (Granular Role Management) ─────────────────────────────── */
const UsersTab = () => {
    const toast = useToast();
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/enterprise/users');
            setUsers(data);
        } catch { toast.error('Failed to load organization users'); }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/enterprise/users/${userId}/role`, { role: newRole });
            toast.success(`User role updated to ${newRole}`);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this user from the organization?')) return;
        try {
            await api.delete(`/enterprise/users/${userId}`);
            toast.success('User removed');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to remove user');
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
                <p style={{ color: 'var(--gray)', margin: 0 }}>Manage user roles and permissions within your organization.</p>
                <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search users by name or email..." 
                        className="form-control" 
                        style={{ paddingLeft: '40px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>Loading…</div>
            ) : filteredUsers.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <h4 style={{ marginBottom: '8px' }}>No Users Found</h4>
                    <p style={{ color: 'var(--gray)' }}>No users match your current search.</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--light)' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Name</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Email</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Current Role</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{u.name} {u.id === currentUser.id && <span style={{ fontSize: '10px', color: 'var(--primary)' }}>(You)</span>}</td>
                                    <td style={{ padding: '14px 16px', color: 'var(--gray)' }}>{u.email}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <select 
                                            value={u.role} 
                                            disabled={u.id === currentUser.id}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--gray-light)', fontSize: '12px', fontWeight: '600' }}
                                        >
                                            <option value="user">User</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <button 
                                            onClick={() => handleDeleteUser(u.id)}
                                            disabled={u.id === currentUser.id}
                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: u.id === currentUser.id ? 0.3 : 1 }}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

/* ─── FEEDBACK TAB ────────────────────────────────────────────────────── */
const FeedbackTab = () => {
    const toast = useToast();
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchFeedback = async () => {
        try {
            const { data } = await api.get('/feedback');
            setFeedback(data);
        } catch { toast.error('Failed to load feedback'); }
        setLoading(false);
    };

    useEffect(() => { fetchFeedback(); }, []);

    const filteredFeedback = feedback.filter(f => 
        f.comment?.toLowerCase().includes(search.toLowerCase()) || 
        f.User?.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.User?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
                <p style={{ color: 'var(--gray)', margin: 0 }}>{feedback.length} feedback entries received</p>
                <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search comments or users..." 
                        className="form-control" 
                        style={{ paddingLeft: '40px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>Loading…</div>
            ) : filteredFeedback.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <h4>{search ? 'No Matching Feedback' : 'No Feedback Yet'}</h4>
                    <p style={{ color: 'var(--gray)' }}>{search ? 'Try a different search term.' : 'User feedback from the footer will appear here.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {filteredFeedback.map(f => (
                        <div key={f.id} className="card" style={{ borderLeft: `6px solid ${f.sentiment === 'like' ? 'var(--success)' : 'var(--danger)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontWeight: '800', fontSize: '20px' }}>{f.sentiment === 'like' ? '👍' : '👎'}</span>
                                <span style={{ color: 'var(--gray)', fontSize: '12px' }}>{new Date(f.createdAt).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: '0 0 10px 0', fontSize: '15px', fontStyle: 'italic' }}>"{f.comment || 'No comment provided'}"</p>
                            <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                                — {f.User?.name || 'Anonymous User'} {f.User?.email ? `(${f.User.email})` : ''}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

/* ─── MAIN ENTERPRISE PAGE ───────────────────────────────────────────── */
const TABS = [
    { key: 'projects', label: '📁 Projects' },
    { key: 'vendors', label: '🏢 Vendors' },
    { key: 'assets', label: '💼 Assets' },
    { key: 'users', label: '👥 Users' },
    { key: 'feedback', label: '💬 Feedback' },
];

const Enterprise = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('projects');

    if (user?.role !== 'admin') {
        return (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '80px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3 style={{ marginBottom: '8px' }}>Admin Access Required</h3>
                <p style={{ color: 'var(--gray)' }}>The Enterprise module is only accessible to administrators.</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ margin: 0, marginBottom: '6px' }}>Enterprise Module</h2>
                <p style={{ color: 'var(--gray)', margin: 0 }}>Manage projects, vendors, and company assets for your organization.</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { icon: '📁', label: 'Projects', desc: 'Track budgets', color: 'var(--primary)' },
                    { icon: '🏢', label: 'Vendors', desc: 'Suppliers', color: 'var(--success)' },
                    { icon: '💼', label: 'Assets', desc: 'Equipment', color: 'var(--warning)' },
                    { icon: '👥', label: 'Users', desc: 'Permissions', color: 'var(--indigo)' },
                ].map(c => (
                    <div key={c.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                        <div style={{ fontSize: '24px', background: 'var(--gray-light)', padding: '10px', borderRadius: '12px' }}>{c.icon}</div>
                        <div>
                            <div style={{ fontWeight: '800', color: c.color, fontSize: '14px' }}>{c.label}</div>
                            <div style={{ fontSize: '10px', color: 'var(--gray)' }}>{c.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid var(--gray-light)', overflowX: 'auto' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '12px 24px', background: activeTab === tab.key ? 'var(--primary)' : 'none',
                            color: activeTab === tab.key ? 'white' : 'var(--dark-soft)',
                            border: 'none', borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
                            cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', borderRadius: '8px 8px 0 0',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'projects' && <ProjectsTab />}
            {activeTab === 'vendors' && <VendorsTab />}
            {activeTab === 'assets' && <AssetsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'feedback' && <FeedbackTab />}
        </div>
    );
};

export default Enterprise;
