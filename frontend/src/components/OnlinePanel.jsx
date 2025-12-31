import React, { useState, useEffect, useRef } from 'react';
import { SocialService } from '../services/SocialService';
import { MatchService } from '../services/MatchService';
import { AuthService } from '../services/AuthService';

// Initial board states
const getCheckersBoard = () => {
    const b = Array(8).fill(null).map(() => Array(8).fill(0));
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 !== 0) b[r][c] = 2; // White/Black pieces at top
        }
    }
    for (let r = 5; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 !== 0) b[r][c] = 1; // Red pieces at bottom
        }
    }
    return b;
};

const getChessBoard = () => {
    const W_PAWN = 1, W_ROOK = 2, W_KNIGHT = 3, W_BISHOP = 4, W_QUEEN = 5, W_KING = 6;
    const B_PAWN = 11, B_ROOK = 12, B_KNIGHT = 13, B_BISHOP = 14, B_QUEEN = 15, B_KING = 16;
    return [
        [B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK],
        [B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN],
        [W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK]
    ];
};

const getTicTacToeBoard = () => {
    return Array(9).fill(null);
};

export default function OnlinePanel({ onStartMatch }) {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [challengeUser, setChallengeUser] = useState(null);
    const heartbeatRef = useRef(null);
    const currentUser = AuthService.getCurrentUser();

    useEffect(() => {
        refreshData();
        heartbeatRef.current = setInterval(() => {
            SocialService.heartbeat().catch(console.error);
            refreshData();
        }, 30000);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, []);

    const refreshData = () => {
        SocialService.getOnlineUsers().then(setOnlineUsers).catch(console.error);
        MatchService.getMyMatches().then(setMatches).catch(console.error);
    };

    const handleChallenge = (username, gameType) => {
        let board;
        if (gameType === 'chess') board = getChessBoard();
        else if (gameType === 'tictactoe') board = getTicTacToeBoard();
        else board = getCheckersBoard();

        MatchService.invite(username, JSON.stringify(board), gameType)
            .then(() => {
                refreshData();
                setChallengeUser(null);
            })
            .catch(err => {
                alert(err.message);
                setChallengeUser(null);
            });
    };

    const handleAcceptMatch = (match) => {
        MatchService.acceptMatch(match.id)
            .then((m) => {
                onStartMatch(m.id, m.gameType);
            })
            .catch(console.error);
    };

    const handleDeclineMatch = (matchId) => {
        MatchService.declineMatch(matchId)
            .then(() => refreshData())
            .catch(console.error);
    };

    const pendingInvites = matches.filter(m => m.status === 'PENDING' && m.player2.username === currentUser?.username);
    const activeMatches = matches.filter(m => m.status === 'ACTIVE');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Game Selection Modal */}
            {challengeUser && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} onClick={() => setChallengeUser(null)} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: '#242424', padding: '1.5rem', borderRadius: '12px', zIndex: 101,
                        border: '1px solid rgba(255,255,255,0.1)', minWidth: '280px', textAlign: 'center'
                    }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Challenge {challengeUser}</h4>
                        <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>Select a game:</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => handleChallenge(challengeUser, 'checkers')} style={{ padding: '12px 20px', fontSize: '1.2rem' }}>
                                🏁 Checkers
                            </button>
                            <button onClick={() => handleChallenge(challengeUser, 'chess')} style={{ padding: '12px 20px', fontSize: '1.2rem' }}>
                                ♚ Chess
                            </button>
                            <button onClick={() => handleChallenge(challengeUser, 'tictactoe')} style={{ padding: '12px 20px', fontSize: '1.2rem' }}>
                                ❌ Tic-Tac-Toe
                            </button>
                        </div>
                        <button onClick={() => setChallengeUser(null)} style={{ marginTop: '1rem', background: '#444', fontSize: '0.8rem' }}>Cancel</button>
                    </div>
                </>
            )}

            {/* Match Invites */}
            {pendingInvites.length > 0 && (
                <section style={{ background: 'linear-gradient(135deg, rgba(229,62,62,0.15) 0%, rgba(255,107,107,0.1) 100%)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(229,62,62,0.3)' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⚔️ Match Invites ({pendingInvites.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pendingInvites.map(match => (
                            <div key={match.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'
                            }}>
                                <div>
                                    <strong style={{ fontSize: '0.85rem' }}>{match.player1.displayName || match.player1.username}</strong>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                        {match.gameType === 'chess' ? '♚ Chess' : match.gameType === 'tictactoe' ? '❌ Tic-Tac-Toe' : '🏁 Checkers'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleDeclineMatch(match.id)} style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(255,255,255,0.1)', color: '#888' }}>✕</button>
                                    <button onClick={() => handleAcceptMatch(match)} style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#42d392', color: '#000', fontWeight: 'bold' }}>Accept</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Ongoing Matches */}
            {activeMatches.length > 0 && (
                <section style={{ background: 'rgba(66,211,146,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(66,211,146,0.2)' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>🎮 Your Matches ({activeMatches.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeMatches.map(match => (
                            <div key={match.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'
                            }}>
                                <div>
                                    <strong style={{ fontSize: '0.85rem' }}>
                                        {match.gameType === 'chess' ? '♚' : match.gameType === 'tictactoe' ? '❌' : '🏁'} vs {match.player1.username === currentUser?.username ? match.player2.username : match.player1.username}
                                    </strong>
                                    <div style={{ fontSize: '0.7rem', color: match.currentTurn === currentUser?.username ? '#42d392' : '#888' }}>
                                        {match.currentTurn === currentUser?.username ? "Your turn!" : "Waiting..."}
                                    </div>
                                </div>
                                <button onClick={() => onStartMatch(match.id, match.gameType)} style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--primary)', color: 'white' }}>Play</button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Online Now */}
            <section style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#42d392', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                    Online Now ({onlineUsers.length})
                </h4>
                {onlineUsers.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>No other players online</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {onlineUsers.slice(0, 5).map(user => (
                            <div key={user.username} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '28px', height: '28px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '0.9rem'
                                    }}>
                                        {user.avatarEmoji || user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{user.displayName || user.username}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#888' }}>Lvl {user.level}</div>
                                    </div>
                                </div>
                                <button onClick={() => setChallengeUser(user.username)} style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#e53e3e', color: 'white' }}>⚔️</button>
                            </div>
                        ))}
                        {onlineUsers.length > 5 && (
                            <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginTop: '4px' }}>
                                +{onlineUsers.length - 5} more online
                            </div>
                        )}
                    </div>
                )}
            </section>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
