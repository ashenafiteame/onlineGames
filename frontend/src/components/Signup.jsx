import React, { useState } from 'react';
import { AuthService } from '../services/AuthService';

export default function Signup({ switchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setSuccess('');
            return;
        }

        try {
            await AuthService.signup(username, password);
            setSuccess('Registration successful! Please login.');
            setError('');
            setTimeout(() => switchToLogin(), 2000);
        } catch (err) {
            setError(err.message);
            setSuccess('');
        }
    };

    return (
        <div className="form-container" style={{ maxWidth: '400px' }}>
            <h2>Sign Up</h2>
            {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ color: '#42d392', marginBottom: '1rem' }}>{success}</div>}
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
                <button type="submit" style={{ width: '100%' }}>Register</button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                Already have an account? <a href="#" onClick={switchToLogin} style={{ color: 'var(--primary)' }}>Login</a>
            </p>
        </div>
    );
}
