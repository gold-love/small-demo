import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import BudgetCard from '../components/BudgetCard';
import { BudgetComparisonBar } from '../components/Charts';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Budgets = () => {
    const { user } = useContext(AuthContext);
    const toast = useToast();
    const [budgets, setBudgets] = useState([]);
    const [categoryData, setCategoryData] = useState({});
    const [comparisonData, setComparisonData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBudget, setEditingBudget] = useState(null);

    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        period: 'monthly'
    });

    const fetchData = async () => {
        try {
            const { data: budgetData } = await api.get('/budgets');
            const { data: reportResponse } = await api.get('/reports/category');
            const { data: compResponse } = await api.get('/reports/budget-comparison');

            const reportObj = {};
            (reportResponse.report || []).forEach(item => {
                reportObj[item._id] = item.total;
            });

            setBudgets(budgetData);
            setCategoryData(reportObj);
            setComparisonData(compResponse);
        } catch (error) {
            toast.error('Failed to load budget data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setFormData({
            category: budget.category,
            amount: budget.amount,
            period: 'monthly'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            try {
                await api.delete(`/budgets/${id}`);
                toast.success('Budget deleted');
                fetchData();
            } catch {
                toast.error('Failed to delete budget');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBudget) {
                await api.put(`/budgets/${editingBudget.id}`, formData);
                toast.success('Budget updated');
            } else {
                await api.post('/budgets', formData);
                toast.success('Budget created');
            }
            setFormData({ category: '', amount: '', period: 'monthly' });
            setEditingBudget(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (categoryData[b.category] || 0), 0);

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h2 style={{ margin: 0, marginBottom: '4px' }}>Budget Planning</h2>
                    <p style={{ color: 'var(--gray)', margin: 0 }}>Set limits and track your spending efficiency.</p>
                </div>
                {editingBudget && (
                    <button className="btn" onClick={() => { setEditingBudget(null); setFormData({ category: '', amount: '', period: 'monthly' }); }} style={{ background: 'var(--gray-light)', color: 'var(--gray)' }}>
                        Cancel Edit
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'admin' ? '1fr 320px' : '1fr', gap: '32px', marginBottom: '40px', alignItems: 'start' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '24px' }}>Budget vs Actual Performance</h3>
                    <div style={{ height: '350px' }}>
                        <BudgetComparisonBar data={comparisonData} />
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <div className="card" style={{ border: editingBudget ? '2px solid var(--primary)' : '1px solid var(--gray-light)' }}>
                        <h3>{editingBudget ? '✏️ Edit Budget' : '🎯 New Budget'}</h3>
                        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="form-control" required disabled={!!editingBudget}>
                                    <option value="">Select Category</option>
                                    <option value="Expense">📑 General Expense</option>
                                    <option value="Food">🍎 Food & Dining</option>
                                    <option value="Transport">🚗 Transport</option>
                                    <option value="Housing">🏠 Housing</option>
                                    <option value="Utilities">💧 Water & Electricity</option>
                                    <option value="Clothing">👕 Clothing</option>
                                    <option value="Shopping">🛍️ Shopping</option>
                                    <option value="Entertainment">🎬 Entertainment</option>
                                    <option value="Health">🏥 Health</option>
                                    <option value="Education">📚 Education</option>
                                    <option value="Travel">✈️ Travel</option>
                                    <option value="Other">✨ Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Limit Amount ($)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-control" required min="1" placeholder="e.g. 500" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                                {editingBudget ? 'Update Budget' : 'Set Budget'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid var(--primary)' }}>
                    <div style={{ color: 'var(--gray)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Total Budgeted</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px' }}>${totalBudget.toLocaleString()}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid var(--secondary)' }}>
                    <div style={{ color: 'var(--gray)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Total Spent</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px' }}>${totalSpent.toLocaleString()}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderBottom: `4px solid ${totalBudget - totalSpent < 0 ? 'var(--danger)' : 'var(--success)'}` }}>
                    <div style={{ color: 'var(--gray)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Remaining Balance</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px' }}>
                        ${(totalBudget - totalSpent).toLocaleString()}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {budgets.map(budget => (
                    <BudgetCard
                        key={budget.id}
                        id={budget.id}
                        category={budget.category}
                        amount={budget.amount}
                        spent={categoryData[budget.category] || 0}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isAdmin={user?.role === 'admin'}
                    />
                ))}
            </div>

            {budgets.length === 0 && !loading && (
                <div className="card" style={{ textAlign: 'center', padding: '60px', gridColumn: '1/-1' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📉</div>
                    <h4>No Budgets Set</h4>
                    <p style={{ color: 'var(--gray)' }}>Set your first budget using the form above to start tracking performance.</p>
                </div>
            )}
        </div>
    );
};

export default Budgets;
