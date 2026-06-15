import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Approvals = () => {
    const { user } = useContext(AuthContext);
    const toast = useToast();
    const [expenses, setExpenses] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);
    
    // Bulk state
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    const fetchExpenses = async () => {
        setLoading(true);
        setSelectedIds([]); // Reset selection on refresh
        try {
            const endpoint = filter === 'pending' ? '/approvals/pending' : `/approvals/all?status=${filter}`;
            const { data } = await api.get(endpoint);
            setExpenses(data);
        } catch (error) {
            toast.error('Error fetching approvals');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, [filter]);

    const handleApprove = async (id) => {
        try {
            await api.put(`/approvals/${id}/approve`);
            toast.success('Expense approved');
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to approve expense');
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Please provide a reason for rejecting this expense:");
        if (reason === null) return;
        if (reason.trim() === '') {
            toast.error('A rejection reason is required.');
            return;
        }

        try {
            await api.put(`/approvals/${id}/reject`, { reason });
            toast.success('Expense rejected');
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to reject expense');
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        
        let reason = null;
        if (action === 'reject') {
            reason = window.prompt(`Please provide a rejection reason for ${selectedIds.length} items:`);
            if (reason === null) return;
            if (reason.trim() === '') {
                toast.error('Rejection reason is required for bulk rejection.');
                return;
            }
        }

        if (!window.confirm(`Are you sure you want to ${action} ${selectedIds.length} items?`)) return;

        setBulkSubmitting(true);
        try {
            await api.put('/approvals/bulk', { ids: selectedIds, action, reason });
            toast.success(`Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${selectedIds.length} items`);
            fetchExpenses();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Bulk action failed');
        } finally {
            setBulkSubmitting(false);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === expenses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(expenses.map(e => e.id));
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: { bg: '#fef3c7', text: '#92400e' },
            approved: { bg: '#d1fae5', text: '#065f46' },
            rejected: { bg: '#fee2e2', text: '#991b1b' }
        };
        const style = colors[status] || { bg: '#f1f5f9', text: '#475569' };
        
        return (
            <span style={{ 
                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', 
                textTransform: 'uppercase', background: style.bg, color: style.text 
            }}>
                {status}
            </span>
        );
    };

    if (user?.role !== 'admin') {
        return (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '80px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3>Access Denied</h3>
                <p style={{ color: 'var(--gray)' }}>You need admin privileges to access this page.</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Expense Approvals</h2>
                    <p style={{ color: 'var(--gray)', margin: 0 }}>Review and manage employee expense submissions.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['pending', 'approved', 'rejected', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? 'btn-primary' : ''}`}
                            style={filter !== f ? { background: 'var(--white)', color: 'var(--dark)', border: '1px solid var(--gray-light)' } : {}}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && filter === 'pending' && (
                <div className="card slide-up" style={{ 
                    background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', 
                    alignItems: 'center', padding: '15px 25px', marginBottom: '20px', borderRadius: '15px',
                    boxShadow: '0 10px 20px -5px var(--primary-soft)'
                }}>
                    <div style={{ fontWeight: '700' }}>
                        {selectedIds.length} items selected
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            className="btn" 
                            disabled={bulkSubmitting}
                            onClick={() => handleBulkAction('approve')}
                            style={{ background: 'white', color: 'var(--primary)', border: 'none' }}
                        >
                            Approve Selected
                        </button>
                        <button 
                            className="btn" 
                            disabled={bulkSubmitting}
                            onClick={() => handleBulkAction('reject')}
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white' }}
                        >
                            Reject Selected
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>Loading approvals...</div>
            ) : expenses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <h4>All Caught Up!</h4>
                    <p style={{ color: 'var(--gray)' }}>There are no {filter} expenses to review at this time.</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--light)' }}>
                                {filter === 'pending' && (
                                    <th style={{ padding: '14px 16px', width: '40px' }}>
                                        <input type="checkbox" checked={selectedIds.length === expenses.length && expenses.length > 0} onChange={toggleSelectAll} />
                                    </th>
                                )}
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Employee</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Title</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Category</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Amount</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Status</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--gray)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '700' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp) => (
                                <tr key={exp.id} style={{ borderBottom: '1px solid var(--gray-light)', background: selectedIds.includes(exp.id) ? 'var(--primary-soft)' : 'none' }}>
                                    {filter === 'pending' && (
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <input type="checkbox" checked={selectedIds.includes(exp.id)} onChange={() => toggleSelect(exp.id)} />
                                        </td>
                                    )}
                                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{exp.User?.name || 'Unknown'}</td>
                                    <td style={{ padding: '14px 16px' }}>{exp.title}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ background: 'var(--gray-light)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{exp.category}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--primary)' }}>
                                        {exp.currency || '$'}{exp.amount}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(exp.status)}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {exp.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleApprove(exp.id)} style={{ padding: '6px 12px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Approve</button>
                                                <button onClick={() => handleReject(exp.id)} style={{ padding: '6px 12px', background: 'none', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Reject</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: '600' }}>Process Complete</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Approvals;
