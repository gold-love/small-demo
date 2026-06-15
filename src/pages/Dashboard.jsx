import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseCard from '../components/ExpenseCard';
import { ExpenseDoughnut, ExpenseBar } from '../components/Charts';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import ActivityTimeline from '../components/ActivityTimeline';


const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [totalExpense, setTotalExpense] = useState(0);
    const [budgetCount, setBudgetCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [topExpenses, setTopExpenses] = useState([]);
    const [budgetAlerts, setBudgetAlerts] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [timeRange, setTimeRange] = useState('all');
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const queryParams = `?timeRange=${timeRange}`;
                const { data: catResponse } = await api.get(`/reports/category${queryParams}`);
                const { data: monData } = await api.get(`/reports/monthly${queryParams}`);
                const { data: budgetData } = await api.get('/budgets');
                const expenseRes = await api.get(`/expenses?limit=5${queryParams.replace('?', '&')}`);

                const expenses = expenseRes.data.expenses || (Array.isArray(expenseRes.data) ? expenseRes.data : []);

                const catData = catResponse.report || [];
                setCategoryData(catData);
                setMonthlyData(monData);
                setBudgetCount(budgetData.length);
                setTopExpenses(expenses.slice(0, 5));

                if (user?.role === 'admin') {
                    const { data: aStats } = await api.get(`/reports/admin-summary${queryParams}`);
                    setAdminStats(aStats);
                    
                    // Use company-wide data for charts if admin
                    if (aStats.companyCategoryData && aStats.companyCategoryData.length > 0) {
                        setCategoryData(aStats.companyCategoryData);
                    }
                    if (aStats.companyMonthlyData && aStats.companyMonthlyData.length > 0) {
                        setMonthlyData(aStats.companyMonthlyData);
                    }
                }

                setTotalExpense(catResponse.grandTotal || 0);

                // Check budget alerts
                const alerts = [];
                budgetData.forEach(budget => {
                    const spent = catData.find(c => c._id === budget.category);
                    if (spent) {
                        const percentage = (parseFloat(spent.total) / parseFloat(budget.amount)) * 100;
                        if (percentage >= 80) {
                            alerts.push({
                                category: budget.category,
                                percentage: percentage.toFixed(0),
                                exceeded: percentage >= 100
                            });
                        }
                    }
                });
                setBudgetAlerts(alerts);

                // Count pending expenses correctly
                const pending = expenses.filter(e => e.status === 'pending').length;
                setPendingCount(pending);
            } catch (error) {
                console.error('Dashboard Data Fetch Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.role, timeRange]);

    if (loading && totalExpense === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>Loading dashboard data...</div>;
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ margin: 0 }}>Financial Dashboard</h2>
                <div style={{ display: 'flex', background: 'var(--white)', padding: '4px', borderRadius: '12px', border: '1px solid var(--gray-light)' }}>
                    {[
                        { label: 'All Time', value: 'all' },
                        { label: '7 Days', value: '7d' },
                        { label: '30 Days', value: '30d' },
                        { label: '90 Days', value: '90d' },
                        { label: '1 Year', value: '1y' }
                    ].map(range => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            style={{
                                padding: '6px 16px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                background: timeRange === range.value ? 'var(--primary)' : 'none',
                                color: timeRange === range.value ? 'white' : 'var(--gray)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {user?.role === 'admin' && adminStats && (
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>🏢 Company Overview</span>
                        <span style={{ fontSize: '12px', background: 'var(--primary-soft)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '20px' }}>Enterprise Analytics</span>
                    </h3>
                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                        <ExpenseCard title="Total Company Spend" amount={adminStats.totalCompanySpend} color="var(--primary)" icon="🏢" />
                        <ExpenseCard title="Global Pending" amount={adminStats.pendingCount} color="var(--warning)" icon="⏳" />
                        <ExpenseCard title="Total Categories" amount={adminStats.companyCategoryData.length} color="var(--success)" icon="📁" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {[
                            { label: 'Active Projects', value: adminStats.enterpriseStats?.projects, icon: '📂', link: '/enterprise' },
                            { label: 'Registered Vendors', value: adminStats.enterpriseStats?.vendors, icon: '🏢', link: '/enterprise' },
                            { label: 'Company Assets', value: adminStats.enterpriseStats?.assets, icon: '💼', link: '/enterprise' }
                        ].map(stat => (
                            <div key={stat.label} onClick={() => navigate(stat.link)} style={{ 
                                cursor: 'pointer', background: 'var(--white)', padding: '15px', borderRadius: '15px', 
                                border: '1px solid var(--gray-light)', display: 'flex', alignItems: 'center', gap: '15px',
                                transition: 'transform 0.2s'
                            }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ fontSize: '24px' }}>{stat.icon}</div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--dark)' }}>{stat.value || 0}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: '600' }}>{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {budgetAlerts.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    {budgetAlerts.map((alert, index) => (
                        <div key={index} className="card" style={{
                            background: alert.exceeded ? '#fee2e2' : '#fef3c7',
                            border: `1px solid ${alert.exceeded ? '#fecaca' : '#fde68a'}`,
                            marginBottom: '12px',
                            padding: '16px'
                        }}>
                            <strong style={{ color: alert.exceeded ? '#dc2626' : '#d97706' }}>
                                {alert.exceeded ? '⚠️ Budget Exceeded!' : '⚡ Budget Alert!'}
                            </strong>
                            <span style={{ marginLeft: '12px' }}>
                                {alert.category} is at {alert.percentage}% of your limit
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="stats-grid">
                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <ExpenseCard title="Total Expenses" amount={totalExpense} color="var(--primary)" icon="$" />
                )}

                {user?.orgSettings?.budgetModuleEnabled !== false && (
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/budgets')}>
                        <ExpenseCard title="Active Budgets" amount={budgetCount} color="var(--success)" icon="B" isCurrency={false} />
                        {budgetCount === 0 && (
                            <button className="btn" style={{
                                position: 'absolute',
                                right: '60px',
                                top: '45px',
                                fontSize: '11px',
                                padding: '4px 8px',
                                background: 'var(--success)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                zIndex: 10
                            }}>
                                + Set New
                            </button>
                        )}
                    </div>
                )}

                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <div style={{ cursor: 'pointer' }} onClick={() => navigate('/approvals')}>
                        <ExpenseCard title="Pending Items" amount={pendingCount} color="var(--secondary)" icon="P" isCurrency={false} />
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }} className="slide-up">
                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <div className="card">
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Category Distribution</h3>
                        <ExpenseDoughnut data={categoryData} />
                    </div>
                )}
                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <div className="card">
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Monthly Spending</h3>
                        <ExpenseBar data={monthlyData} />
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>Recent Transactions</span>
                        <a href="/expenses" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>View All →</a>
                    </h3>
                    {topExpenses.length === 0 ? (
                        <p style={{ color: 'var(--gray)', padding: '20px' }}>No recent expenses</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Title</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topExpenses.map((exp) => (
                                    <tr key={exp.id}>
                                        <td style={{ padding: '12px' }}>{exp.title}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                background: 'var(--gray-light)',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                color: 'var(--gray)'
                                            }}>{exp.category}</span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                            {exp.currency || '$'}{exp.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '24px' }}>Status Activity</h3>
                    <ActivityTimeline activities={
                        topExpenses.map(exp => ({
                            title: exp.title,
                            time: new Date(exp.date).toLocaleDateString(),
                            type: exp.status,
                            description: `Expense categorized as ${exp.category} is currently ${exp.status}.`
                        }))
                    } />
                    
                    {user?.role === 'admin' && adminStats?.topSpenders?.length > 0 && (
                        <div style={{ marginTop: '32px', borderTop: '1px solid var(--gray-light)', paddingTop: '24px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>🏆 Top Spenders</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {adminStats.topSpenders.map((spender, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>{i + 1}</div>
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{spender.name}</span>
                                        </div>
                                        <span style={{ fontWeight: '800', color: 'var(--success-dark)' }}>${spender.total.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default Dashboard;
