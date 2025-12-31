import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/AdminService';

export default function AdminDashboard({ onBack }) {
    const [stats, setStats] = useState({ totalUsers: 0, totalGames: 0, totalScores: 0 });
    const [users, setUsers] = useState([]);
    const [games, setGames] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dashboardData, usersData, gamesData, leaderboardData] = await Promise.all([
                AdminService.getDashboard(),
                AdminService.getUsers(),
                AdminService.getGames(),
                AdminService.getLeaderboard()
            ]);
            setStats(dashboardData);
            setUsers(usersData);
            setGames(gamesData);
            setLeaderboard(leaderboardData);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        }
        setLoading(false);
    };

    const handleDeleteUser = async (id, username) => {
        if (!confirm(`Delete user "${username}"?`)) return;
        try {
            await AdminService.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleToggleRole = async (user) => {
        const action = user.role === 'ADMIN' ? 'demote' : 'promote';
        const currentUser = JSON.parse(localStorage.getItem('user'));

        if (action === 'demote' && currentUser.username === user.username) {
            alert('You cannot demote yourself!');
            return;
        }

        if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;

        try {
            const updated = await AdminService.toggleUserRole(user.id);
            setUsers(users.map(u => u.id === user.id ? updated : u));
        } catch (err) {
            alert(`Failed to ${action} user`);
        }
    };

    const handleDeleteGame = async (id, name) => {
        if (!confirm(`Delete game "${name}"?`)) return;
        try {
            await AdminService.deleteGame(id);
            setGames(games.filter(g => g.id !== id));
            setStats(prev => ({ ...prev, totalGames: prev.totalGames - 1 }));
        } catch (err) {
            alert('Failed to delete game');
        }
    };

    const tabStyle = (tab) => ({
        padding: '0.75rem 1.5rem',
        border: 'none',
        background: activeTab === tab ? 'var(--primary)' : '#333',
        color: '#fff',
        cursor: 'pointer',
        borderRadius: '8px 8px 0 0',
        fontWeight: activeTab === tab ? 'bold' : 'normal'
    });

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading admin data...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>🛡️ Admin Dashboard</h2>
                <button onClick={onBack} style={{ background: '#444' }}>← Back to Games</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0' }}>
                <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
                <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>👥 Users</button>
                <button style={tabStyle('games')} onClick={() => setActiveTab('games')}>🎮 Games</button>
                <button style={tabStyle('leaderboard')} onClick={() => setActiveTab('leaderboard')}>🏆 Leaderboard</button>
            </div>

            <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '0 8px 8px 8px', border: '1px solid #333' }}>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</div>
                            <div style={{ opacity: 0.8 }}>Total Users</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalGames}</div>
                            <div style={{ opacity: 0.8 }}>Total Games</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalScores}</div>
                            <div style={{ opacity: 0.8 }}>Total Scores</div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Username</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Role</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Level</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Score</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '0.75rem' }}>{user.id}</td>
                                    <td style={{ padding: '0.75rem' }}>{user.username}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            background: user.role === 'ADMIN' ? '#764ba2' : '#333',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem'
                                        }}>{user.role}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{user.level}</td>
                                    <td style={{ padding: '0.75rem' }}>{user.totalScore}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleToggleRole(user)}
                                            style={{
                                                marginRight: '0.5rem',
                                                background: user.role === 'ADMIN' ? '#5a2d2d' : '#2d5a2d',
                                                fontSize: '0.8rem',
                                                padding: '0.4rem 0.8rem'
                                            }}
                                        >
                                            {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button onClick={() => handleDeleteUser(user.id, user.username)} style={{ background: '#5a2d2d', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Games Tab */}
                {activeTab === 'games' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Description</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {games.map(game => (
                                <tr key={game.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '0.75rem' }}>{game.id}</td>
                                    <td style={{ padding: '0.75rem' }}>{game.name}</td>
                                    <td style={{ padding: '0.75rem' }}>{game.type}</td>
                                    <td style={{ padding: '0.75rem', opacity: 0.7, fontSize: '0.9rem' }}>{game.description}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <button onClick={() => handleDeleteGame(game.id, game.name)} style={{ background: '#5a2d2d', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Leaderboard Tab */}
                {activeTab === 'leaderboard' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Rank</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Player</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Level</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Total Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((user, idx) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: '0.75rem' }}>Level {user.level || 1}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{user.totalScore || 0}</td>
                                </tr>
                            ))}
                            {leaderboard.length === 0 && (
                                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', opacity: 0.6 }}>No players yet</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
