import React, { useEffect, useState } from 'react';
import { GameService } from '../services/GameService';

export default function Leaderboard({ onBack }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GameService.getLeaderboard()
            .then(setPlayers)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{
            background: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: '800px',
            margin: '0 auto',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    🏆 Hall of Fame
                </h2>
                <button onClick={onBack} style={{ background: '#444' }}>Back to Studio</button>
            </div>

            {loading ? <p>Loading legends...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {players.map((player, index) => (
                        <div key={player.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr auto auto',
                            alignItems: 'center',
                            gap: '1.5rem',
                            padding: '1rem 1.5rem',
                            background: index === 0 ? 'linear-gradient(90deg, rgba(212,175,55,0.1), transparent)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: index === 0 ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}>
                            <div style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: index === 0 ? '#d4af37' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#888'
                            }}>
                                #{index + 1}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    {player.avatarEmoji || player.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{player.displayName || player.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Level {player.level}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Total Score</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {player.totalScore.toLocaleString()}
                                </div>
                            </div>
                            {index === 0 && <span style={{ fontSize: '1.5rem' }}>👑</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
