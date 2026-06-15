import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ExpenseForm = ({ onSuccess, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        date: '',
        description: '',
        currency: 'USD',
        isRecurring: false,
        recurringInterval: '',
        projectId: '',
        vendorId: '',
        taxRate: 0,
    });
    const [receipt, setReceipt] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [fileType, setFileType] = useState('image/*');
    const [projects, setProjects] = useState([]);
    const [vendors, setVendors] = useState([]);
    const fileInputRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        const fetchEnterpriseData = async () => {
            try {
                const [projRes, vendRes] = await Promise.all([
                    api.get('/enterprise/projects'),
                    api.get('/enterprise/vendors')
                ]);
                setProjects(projRes.data);
                setVendors(vendRes.data);
            } catch (err) {
                console.error('Error fetching enterprise data:', err);
            }
        };
        fetchEnterpriseData();

        if (initialData) {
            setFormData({
                title: initialData.title || '',
                amount: initialData.amount || '',
                category: initialData.category || '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
                description: initialData.description || '',
                currency: initialData.currency || 'USD',
                isRecurring: initialData.isRecurring || false,
                recurringInterval: initialData.recurringInterval || '',
                projectId: initialData.projectId || '',
                vendorId: initialData.vendorId || '',
                taxRate: initialData.taxRate || 0,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleFileChange = (e) => {
        setReceipt(e.target.files[0] || null);
    };

    // Accept file directly from DOM ref to avoid React state timing issues
    const handleScanReceipt = async (fileToScan) => {
        const file = fileToScan || fileInputRef.current?.files[0] || receipt;
        if (!file) {
            toast.warning('Please select a file before clicking AI Scan');
            return;
        }

        setScanning(true);
        const data = new FormData();
        data.append('receipt', file);

        try {
            const response = await api.post('/expenses/scan', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                const { amount, date, title } = response.data.data;
                setFormData(prev => ({
                    ...prev,
                    amount: amount || prev.amount,
                    title: title || prev.title,
                    date: date ? new Date(date).toISOString().split('T')[0] : prev.date
                }));
                toast.success('✨ Receipt analyzed! Title, Amount, and Date have been auto-filled. Please verify them.');
            }
        } catch (error) {
            console.error('Scan Error:', error);
            const msg = error.response?.data?.message || 'The AI could not read this receipt clearly. Please ensure it is a sharp image (JPG/PNG).';
            toast.error(msg);
        } finally {
            setScanning(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (receipt) data.append('receipt', receipt);

        try {
            if (initialData) {
                await api.put(`/expenses/${initialData.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/expenses', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setFormData({ title: '', amount: '', category: '', date: '', description: '', currency: 'USD', isRecurring: false, recurringInterval: '', projectId: '', vendorId: '', taxRate: 0 });
            setReceipt(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save expense');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <h2>{initialData ? 'Edit Expense' : 'Add New Expense'}</h2>
            <div className="form-group">
                <label>Title</label>
                <input name="title" value={formData.title} onChange={handleChange} className="form-control" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                <div className="form-group">
                    <label>Amount</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-control" required min="0.01" step="0.01" />
                </div>
                <div className="form-group">
                    <label>Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="form-control">
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="ETB">ETB</option>
                        <option value="KES">KES</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label>Tax Rate (%)</label>
                <input type="number" name="taxRate" value={formData.taxRate} onChange={handleChange} className="form-control" min="0" step="0.1" />
            </div>
            <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="form-control" required>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                    <label>Project (Optional)</label>
                    <select name="projectId" value={formData.projectId} onChange={handleChange} className="form-control">
                        <option value="">No Project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Vendor (Optional)</label>
                    <select name="vendorId" value={formData.vendorId} onChange={handleChange} className="form-control">
                        <option value="">No Vendor</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="form-control"></textarea>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={handleChange} id="isRecurring" />
                <label htmlFor="isRecurring" style={{ margin: 0 }}>This is a recurring expense</label>
            </div>
            {formData.isRecurring && (
                <div className="form-group">
                    <label>Repeat Every</label>
                    <select name="recurringInterval" value={formData.recurringInterval} onChange={handleChange} className="form-control" required>
                        <option value="">Select Interval</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
            )}
            <div className="form-group">
                <label>Receipt / Document</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* Step 1: File Type Selector */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
                        borderRadius: '12px',
                        border: '1px solid var(--primary-light)'
                    }}>
                        <span style={{ fontSize: '18px' }}>📂</span>
                        <label style={{ fontWeight: '700', fontSize: '13px', color: 'var(--dark-soft)', whiteSpace: 'nowrap', margin: 0 }}>
                            File Type:
                        </label>
                        <select
                            value={fileType}
                            onChange={(e) => {
                                setFileType(e.target.value);
                                // Clear selected file using ref — avoids remounting the input
                                setReceipt(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="form-control"
                            style={{
                                borderRadius: '8px',
                                fontWeight: '700',
                                fontSize: '13px',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                background: 'white',
                                flex: 1,
                                padding: '8px 12px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="image/*">🖼️ Any Image (JPG, PNG, WEBP...)</option>
                            <option value=".jpg,.jpeg">📷 JPG / JPEG only</option>
                            <option value=".png">🗃️ PNG only</option>
                            <option value=".pdf">📄 PDF only</option>
                            <option value=".jpg,.jpeg,.png,.pdf">📎 Image + PDF</option>
                            <option value=".webp">🌐 WEBP only</option>
                            <option value=".bmp">🖨️ BMP only</option>
                            <option value="*">📁 All File Types</option>
                        </select>
                    </div>

                    {/* Step 2: File Picker + AI Scan Button */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => {
                                handleFileChange(e);
                                if (e.target.files[0]) {
                                    toast.info(`✅ "${e.target.files[0].name}" selected. Click AI Scan to auto-fill.`);
                                }
                            }}
                            className="form-control"
                            accept={fileType}
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                // Read file directly from DOM ref — avoids React state timing bug
                                const file = fileInputRef.current?.files[0];
                                if (!file) {
                                    toast.warning('Please select a file before clicking AI Scan');
                                } else {
                                    setReceipt(file); // sync state
                                    handleScanReceipt(file); // pass file directly
                                }
                            }}
                            className="btn"
                            style={{
                                background: receipt ? 'var(--grad-primary)' : '#94a3b8',
                                color: '#ffffff',
                                flexShrink: 0,
                                fontWeight: '800',
                                padding: '0 20px',
                                borderRadius: '10px',
                                transition: 'all 0.3s ease',
                                opacity: scanning ? 0.7 : 1,
                                boxShadow: receipt ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                                cursor: receipt ? 'pointer' : 'not-allowed'
                            }}
                            disabled={scanning}
                        >
                            {scanning ? '🌀 Scanning...' : '✨ AI Scan'}
                        </button>
                    </div>

                    {/* Status hints */}
                    {!receipt && <small style={{ color: 'var(--gray)', fontSize: '12px' }}>👆 Select a file type above, then choose your file</small>}
                    {receipt && !scanning && <small style={{ color: 'var(--primary)', fontWeight: '700' }}>✅ Ready! Click <b>AI Scan</b> to auto-fill the form from your receipt.</small>}
                    {scanning && <small style={{ color: 'var(--primary)', fontWeight: '800', animation: 'pulse 1.5s infinite' }}>🔍 Analyzing receipt... this may take 5–10 seconds.</small>}
                </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {initialData ? 'Update Expense' : 'Add Expense'}
            </button>
        </form>
    );
};

export default ExpenseForm;
