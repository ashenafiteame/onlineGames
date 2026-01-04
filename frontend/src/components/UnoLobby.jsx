import React, { useState, useEffect, useRef } from 'react';
import { UnoRoomService } from '../services/UnoRoomService';
import { AuthService } from '../services/AuthService';

export default function UnoLobby({ onStartGame, onBack, initialInviteCode }) {
    const currentUser = AuthService.getCurrentUser();
    const [mode, setMode] = useState(initialInviteCode ? 'joining' : 'menu'); // menu, creating, waiting, joining
    const [room, setRoom] = useState(null);
    const [inviteCode, setInviteCode] = useState(initialInviteCode || '');
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const pollInterval = useRef(null);

    // Auto-join if invite code provided
    useEffect(() => {
        if (initialInviteCode && mode === 'joining') {
            handleJoinRoom();
        }
    }, [initialInviteCode]);

    // Poll for room updates when in waiting room
    useEffect(() => {
        if (room && room.status === 'WAITING') {
            pollInterval.current = setInterval(async () => {
                try {
                    const updated = await UnoRoomService.getRoom(room.id);
                    setRoom(updated);
                    if (updated.status === 'PLAYING') {
                        onStartGame(updated);
                    }
                } catch (e) {
                    console.error('Poll error:', e);
                }
            }, 1500);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [room?.id, room?.status]);

    const handleCreateRoom = async () => {
        setError('');
        try {
            const newRoom = await UnoRoomService.createRoom(maxPlayers);
            setRoom(newRoom);
            setMode('waiting');
        } catch (e) {
            setError(e.message);
        }
    };

    const handleJoinRoom = async () => {
        setError('');
        if (!inviteCode.trim()) {
            setError('Please enter an invite code');
            return;
        }
        try {
            const joinedRoom = await UnoRoomService.joinRoom(inviteCode.trim());
            setRoom(joinedRoom);
            setMode('waiting');
            if (joinedRoom.status === 'PLAYING') {
                onStartGame(joinedRoom);
            }
        } catch (e) {
            setError(e.message);
        }
    };

    const handleLeaveRoom = async () => {
        if (room) {
            try {
                await UnoRoomService.leaveRoom(room.id);
            } catch (e) {
                console.error('Leave error:', e);
            }
        }
        setRoom(null);
        setMode('menu');
    };

    const handleStartGame = async () => {
        setError('');
        try {
            const started = await UnoRoomService.startGame(room.id);
            setRoom(started);
            onStartGame(started);
        } catch (e) {
            setError(e.message);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}?uno=${room.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const players = room ? JSON.parse(room.players) : [];
    const isHost = room && room.host.username === currentUser.username;

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.1)',
        maxWidth: '500px',
        margin: '0 auto',
        textAlign: 'center'
    };

    const buttonStyle = {
        padding: '12px 24px',
        fontSize: '1rem',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    };

    // Main menu
    if (mode === 'menu') {
        return (
            <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>🎴 UNO Online</h2>
                <p style={{ color: '#888', marginBottom: '2rem' }}>Play with friends online!</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={() => setMode('creating')}
                        style={{ ...buttonStyle, background: 'linear-gradient(135deg, #e53935, #ff6b6b)', color: 'white' }}
                    >
                        🎮 Create Room
                    </button>
                    <button
                        onClick={() => setMode('joining')}
                        style={{ ...buttonStyle, background: 'linear-gradient(135deg, #2196f3, #42a5f5)', color: 'white' }}
                    >
                        🔗 Join with Code
                    </button>
                    <button
                        onClick={onBack}
                        style={{ ...buttonStyle, background: '#444', color: 'white', marginTop: '1rem' }}
                    >
                        ← Back to Games
                    </button>
                </div>
            </div>
        );
    }

    // Creating room - select player count
    if (mode === 'creating') {
        return (
            <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>🎮 Create UNO Room</h2>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>
                        Maximum Players
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        {[2, 3, 4, 5, 6].map(n => (
                            <button
                                key={n}
                                onClick={() => setMaxPlayers(n)}
                                style={{
                                    ...buttonStyle,
                                    padding: '10px 16px',
                                    background: maxPlayers === n ? '#e53935' : 'rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => setMode('menu')}
                        style={{ ...buttonStyle, background: '#444', color: 'white' }}
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleCreateRoom}
                        style={{ ...buttonStyle, background: 'linear-gradient(135deg, #4CAF50, #66bb6a)', color: 'white' }}
                    >
                        Create Room
                    </button>
                </div>
            </div>
        );
    }

    // Joining room - enter code
    if (mode === 'joining' && !room) {
        return (
            <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>🔗 Join UNO Room</h2>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>
                        Enter Invite Code
                    </label>
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        maxLength={6}
                        style={{
                            padding: '12px 16px',
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            letterSpacing: '4px',
                            fontWeight: 'bold',
                            width: '200px',
                            borderRadius: '8px',
                            border: '2px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            textTransform: 'uppercase'
                        }}
                    />
                </div>

                {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => { setMode('menu'); setInviteCode(''); setError(''); }}
                        style={{ ...buttonStyle, background: '#444', color: 'white' }}
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleJoinRoom}
                        style={{ ...buttonStyle, background: 'linear-gradient(135deg, #2196f3, #42a5f5)', color: 'white' }}
                    >
                        Join Room
                    </button>
                </div>
            </div>
        );
    }

    // Waiting room
    return (
        <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>🎴 UNO Lobby</h2>

            {/* Invite Code Display */}
            <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem'
            }}>
                <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>INVITE CODE</div>
                <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    letterSpacing: '6px',
                    color: '#e53935'
                }}>
                    {room.inviteCode}
                </div>
                <button
                    onClick={copyInviteLink}
                    style={{
                        ...buttonStyle,
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                        background: copied ? '#4CAF50' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        marginTop: '0.5rem'
                    }}
                >
                    {copied ? '✓ Copied!' : '📋 Copy Invite Link'}
                </button>
            </div>

            {/* Players List */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Players ({players.length}/{room.maxPlayers})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {players.map((player, i) => (
                        <div
                            key={player.username}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                border: player.username === currentUser.username
                                    ? '2px solid var(--primary)'
                                    : '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <span>
                                {player.displayName}
                                {player.username === currentUser.username && ' (You)'}
                            </span>
                            {player.isHost && (
                                <span style={{
                                    background: '#e53935',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}>
                                    HOST
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Waiting message */}
            {!isHost && (
                <div style={{
                    color: 'var(--primary)',
                    marginBottom: '1rem',
                    animation: 'pulse 2s infinite'
                }}>
                    Waiting for host to start the game...
                </div>
            )}

            {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={handleLeaveRoom}
                    style={{ ...buttonStyle, background: '#444', color: 'white' }}
                >
                    Leave Room
                </button>
                {isHost && (
                    <button
                        onClick={handleStartGame}
                        disabled={players.length < 1}
                        style={{
                            ...buttonStyle,
                            background: players.length >= 1
                                ? 'linear-gradient(135deg, #4CAF50, #66bb6a)'
                                : '#555',
                            color: 'white',
                            cursor: players.length >= 1 ? 'pointer' : 'not-allowed'
                        }}
                    >
                        🚀 Start Game ({players.length}/1+)
                    </button>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
