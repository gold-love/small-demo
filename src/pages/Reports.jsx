import React, { useEffect, useState, useContext } from 'react';
import { ExpenseBar, ExpenseDoughnut } from '../components/Charts';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import AuthContext from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ─── Budget vs Actual bar (pure CSS, no extra lib) ─────────────────── */
const BudgetComparisonChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
                <p style={{ margin: 0 }}>No budget data for this month yet.</p>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {data.map((item) => {
                const pct = Math.min(parseFloat(item.percentage), 100);
                const over = parseFloat(item.percentage) > 100;
                const barColor = over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
                return (
                    <div key={item.category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                            <span style={{ fontWeight: '600' }}>{item.category}</span>
                            <span style={{ color: over ? '#ef4444' : 'var(--gray)' }}>
                                ${parseFloat(item.actualSpent).toFixed(2)} / ${parseFloat(item.budgetAmount).toFixed(2)}
                                <span style={{
                                    marginLeft: '8px', fontWeight: '700',
                                    color: over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'
                                }}>({item.percentage}%)</span>
                            </span>
                        </div>
                        <div style={{ background: 'var(--gray-light)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${pct}%`, height: '100%',
                                background: barColor, borderRadius: '8px',
                                transition: 'width 0.6s ease'
                            }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ─── Admin Summary Card ─────────────────────────────────────────────── */
const AdminSummaryPanel = ({ summary }) => {
    if (!summary) return null;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[
                { label: 'Total Company Spend', value: `$${parseFloat(summary.totalCompanySpend || 0).toLocaleString()}`, icon: '🏢', color: 'var(--primary)' },
                { label: 'Pending Approvals', value: summary.pendingCount ?? 0, icon: '⏳', color: '#f59e0b' },
                {
                    label: 'Top Category',
                    value: summary.companyCategoryData?.sort((a, b) => b.total - a.total)?.[0]?.['_id'] || '—',
                    icon: '📈', color: 'var(--success)'
                },
            ].map(card => (
                <div key={card.label} className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: card.color }}>{card.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>{card.label}</div>
                </div>
            ))}
        </div>
    );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────── */
const Reports = () => {
    const toast = useToast();
    const { user } = useContext(AuthContext);

    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({ grandTotal: 0, currency: 'USD' });
    const [budgetComparison, setBudgetComparison] = useState([]);
    const [adminSummary, setAdminSummary] = useState(null);

    /* Date filter state */
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filtering, setFiltering] = useState(false);

    const buildParams = () => {
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        return params.toString() ? `?${params.toString()}` : '';
    };

    const fetchData = async () => {
        setFiltering(true);
        const qs = buildParams();

        // Fetch each piece of data independently so one failure doesn't break everything
        const tasks = [
            api.get(`/reports/category${qs}`).then(res => {
                setCategoryData(res.data.report || []);
                setSummary({ grandTotal: res.data.grandTotal, currency: res.data.currency });
            }).catch(err => console.error('Category report error:', err)),

            api.get(`/reports/monthly${qs}`).then(res => {
                setMonthlyData(res.data || []);
            }).catch(err => console.error('Monthly report error:', err)),

            api.get('/expenses').then(res => {
                const raw = res.data.expenses || res.data;
                setExpenses(Array.isArray(raw) ? raw : []);
            }).catch(err => console.error('Expenses load error:', err)),

            api.get('/reports/budget-comparison').then(res => {
                setBudgetComparison(res.data || []);
            }).catch(err => console.error('Budget comparison error:', err))
        ];

        if (user?.role === 'admin') {
            tasks.push(
                api.get(`/reports/admin-summary${qs}`).then(res => {
                    setAdminSummary(res.data);
                    if (res.data.companyCategoryData && res.data.companyCategoryData.length > 0) {
                        setCategoryData(res.data.companyCategoryData);
                    }
                    if (res.data.companyMonthlyData && res.data.companyMonthlyData.length > 0) {
                        setMonthlyData(res.data.companyMonthlyData);
                    }
                }).catch(err => console.error('Admin summary error:', err))
            );
        }

        try {
            await Promise.allSettled(tasks);
        } catch (err) {
            console.error('Report global error:', err);
            toast.error('Partial failure loading report data');
        } finally {
            setFiltering(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    /* ── Exports ── */
    const exportToPDF = () => {
        if (!expenses.length) { toast.warning('No data available to export'); return; }
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Finsight Expense Report', 14, 22);
            doc.setFontSize(11);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
            autoTable(doc, {
                head: [['Date', 'Title', 'Category', 'Amount', 'Status']],
                body: expenses.map(exp => [
                    new Date(exp.date).toLocaleDateString(),
                    exp.title, exp.category,
                    `${exp.currency || '$'}${exp.amount}`,
                    exp.status || 'pending'
                ]),
                startY: 40, styles: { fontSize: 10 },
                headStyles: { fillColor: [99, 102, 241] }
            });
            const total = expenses.reduce((a, e) => a + parseFloat(e.amount), 0);
            const finalY = doc.lastAutoTable?.finalY || 40;
            doc.text(`Total Expenses: $${total.toFixed(2)}`, 14, finalY + 15);
            doc.save('finsight-expense-report.pdf');
            toast.success('PDF report downloaded');
        } catch { toast.error('Failed to generate PDF report'); }
    };

    const exportToExcel = () => {
        if (!expenses.length) { toast.warning('No data available to export'); return; }
        try {
            const ws = XLSX.utils.json_to_sheet(expenses.map(exp => ({
                Date: new Date(exp.date).toLocaleDateString(),
                Title: exp.title, Category: exp.category,
                Amount: exp.amount, Currency: exp.currency || 'USD',
                Status: exp.status || 'pending', Description: exp.description || ''
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
            XLSX.writeFile(wb, 'finsight-expenses.xlsx');
            toast.success('Excel report downloaded');
        } catch { toast.error('Failed to generate Excel report'); }
    };

    const exportToCSV = async () => {
        try {
            const response = await api.get('/reports/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `finsight-expenses-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('CSV export downloaded');
        } catch { toast.error('Failed to export CSV'); }
    };

    return (
        <div className="fade-in">
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0 }}>Financial Reports</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button id="export-pdf-btn" onClick={exportToPDF} className="btn btn-primary">📄 Export PDF</button>
                    <button id="export-excel-btn" onClick={exportToExcel} className="btn" style={{ background: 'var(--success)', color: 'white' }}>📊 Export Excel</button>
                    <button id="export-csv-btn" onClick={exportToCSV} className="btn" style={{ background: '#0ea5e9', color: 'white' }}>📋 Export CSV</button>
                </div>
            </div>

            {/* ── Date Range Filter ── */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--gray)', marginBottom: '6px', textTransform: 'uppercase' }}>From</label>
                    <input id="date-from-input" type="date" className="form-control" style={{ minWidth: '160px' }}
                        value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--gray)', marginBottom: '6px', textTransform: 'uppercase' }}>To</label>
                    <input id="date-to-input" type="date" className="form-control" style={{ minWidth: '160px' }}
                        value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <button id="apply-filter-btn" onClick={fetchData} className="btn btn-primary" disabled={filtering}
                    style={{ height: '42px', minWidth: '100px' }}>
                    {filtering ? '⏳ Loading…' : '🔍 Apply Filter'}
                </button>
                {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn"
                        style={{ height: '42px', background: 'var(--gray-light)', color: 'var(--dark-soft)' }}>
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* ── Admin Summary ──  */}
            {user?.role === 'admin' && adminSummary && (
                <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏢 Company-Wide Summary
                        <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: '20px', fontWeight: '700' }}>Admin Only</span>
                    </h3>
                    <AdminSummaryPanel summary={adminSummary} />
                </div>
            )}

            {/* ── Charts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Expense Distribution</h3>
                    <ExpenseDoughnut data={categoryData} />
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Monthly Trends</h3>
                    <ExpenseBar data={monthlyData} />
                </div>
            </div>

            {/* ── Budget vs Actual ── */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>📊 Budget vs Actual (This Month)</h3>
                    <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                        {budgetComparison.length} categor{budgetComparison.length !== 1 ? 'ies' : 'y'} with budgets
                    </span>
                </div>
                <BudgetComparisonChart data={budgetComparison} />
            </div>

            {/* ── Category Summary Table ── */}
            <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Category Summary</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Category</th>
                            <th style={{ textAlign: 'right', padding: '12px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Spent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoryData.map((cat, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                <td style={{ padding: '12px' }}>{cat._id}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {summary.currency} {parseFloat(cat.total).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid var(--gray-light)', background: 'var(--gray-light)' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>Grand Total (Converted)</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--indigo)' }}>
                                {summary.currency} {parseFloat(summary.grandTotal).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
