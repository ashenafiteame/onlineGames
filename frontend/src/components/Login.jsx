import React, { useState } from 'react';
import { AuthService } from '../services/AuthService';

export default function Login({ onLogin, switchToSignup }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await AuthService.login(username, password);
            onLogin(user);
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="form-container" style={{ maxWidth: '400px' }}>
            <h2>Login</h2>
            {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" style={{ width: '100%' }}>Login</button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                Don't have an account? <a href="#" onClick={switchToSignup} style={{ color: 'var(--primary)' }}>Sign up</a>
            </p>
        </div>
    );
}
