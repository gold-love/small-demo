import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary Caught:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red', background: 'white', minHeight: '100vh' }}>
                    <h1>Application Crash</h1>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

console.log('Mounting Finsight App...');

try {
    const root = document.getElementById('root');
    if (!root) {
        console.error('Root element not found!');
        document.body.innerHTML = '<h1>Critical Error: Root element not found</h1>';
    } else {
        ReactDOM.createRoot(root).render(
            <React.StrictMode>
                <GlobalErrorBoundary>
                    <App />
                </GlobalErrorBoundary>
            </React.StrictMode>
        );
        console.log('Render called');
    }
} catch (err) {
    console.error('Render crash:', err);
    document.body.innerHTML = `<h1>Application Crash</h1><pre>${err.stack}</pre>`;
}
