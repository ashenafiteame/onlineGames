import React, { useState, useEffect, useRef } from 'react';
import { RoomService } from '../services/RoomService';
import { AuthService } from '../services/AuthService';
import { UnoRoomService } from '../services/UnoRoomService';
import { CheckersRoomService } from '../services/CheckersRoomService';
import { TicTacToeRoomService } from '../services/TicTacToeRoomService';
import { ConnectFourRoomService } from '../services/ConnectFourRoomService';
import { ChessRoomService } from '../services/ChessRoomService';

export default function MultiplayerLobby({ gameType, gameName, onStart, onBack, initialInviteCode }) {
    const currentUser = AuthService.getCurrentUser();

    const [room, setRoom] = useState(null);
    const [error, setError] = useState('');
    const [mode, setMode] = useState(initialInviteCode ? 'joining' : 'menu');
    const [inviteCode, setInviteCode] = useState(initialInviteCode || '');
    const [copied, setCopied] = useState(false);
    const [maxPlayers, setMaxPlayers] = useState(2);
    const [checkersVariant, setCheckersVariant] = useState('standard');

    useEffect(() => {
        let interval;
        if (room) {
            // Poll for room updates
            interval = setInterval(async () => {
                try {
                    const updatedRoom = await RoomService.getRoom(room.id);
                    setRoom(updatedRoom);

                    // Check if game started
                    if (updatedRoom.status === 'PLAYING') {
                        onStart(updatedRoom);
                    }
                } catch (e) {
                    console.error("Error polling room:", e);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [room, onStart]);

    const handleCreateRoom = async () => {
        setError('');
        try {
            const settings = {};
            if (gameType === 'checkers') {
                settings.variant = checkersVariant;
            }
            const newRoom = await RoomService.createRoom(gameType, maxPlayers, settings);
            setRoom(newRoom);
            setMode('waiting');
        } catch (e) {
            setError(e.message);
        }
    };

    const handleJoinRoom = async () => {
        setError('');
        if (!inviteCode) {
            setError('Please enter an invite code');
            return;
        }
        try {
            const joinedRoom = await RoomService.joinRoom(inviteCode);
            setRoom(joinedRoom);
            setMode('waiting');
        } catch (e) {
            setError(e.message);
        }
    };

    const handleLeaveRoom = async () => {
        if (!room) return;
        try {
            await RoomService.leaveRoom(room.id);
            setRoom(null);
            setMode('menu');
        } catch (e) {
            console.error(e);
            setRoom(null);
            setMode('menu');
        }
    };

    const handleStartGame = async () => {
        setError('');
        try {
            let started;
            if (gameType === 'uno') {
                started = await UnoRoomService.startGame(room.id);
            } else if (gameType === 'checkers') {
                started = await CheckersRoomService.startGame(room.id);
            } else if (gameType === 'tictactoe') {
                started = await TicTacToeRoomService.startGame(room.id);
            } else if (gameType === 'connectfour') {
                started = await ConnectFourRoomService.startGame(room.id);
            } else if (gameType === 'chess') {
                started = await ChessRoomService.startGame(room.id);
            } else {
                throw new Error("Game start logic not implemented for " + gameType);
            }
            setRoom(started);
            onStart(started);
        } catch (e) {
            setError(e.message);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}?room=${room.inviteCode}`;
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
                <h2 style={{ marginTop: 0 }}>🎮 {gameName} Multiplayer</h2>
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

    // Creating room - select player count (if applicable)
    if (mode === 'creating') {
        return (
            <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Create Room</h2>

                {gameType === 'uno' && (
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
                )}

                {gameType !== 'uno' && gameType !== 'checkers' && (
                    <p style={{ color: '#aaa', fontStyle: 'italic' }}>2-Player Mode</p>
                )}

                {gameType === 'checkers' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>
                            Variant
                        </label>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={() => setCheckersVariant('standard')}
                                style={{
                                    ...buttonStyle,
                                    padding: '10px 16px',
                                    background: checkersVariant === 'standard' ? '#e53935' : 'rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}
                            >
                                Standard (8x8)
                            </button>
                            <button
                                onClick={() => setCheckersVariant('international')}
                                style={{
                                    ...buttonStyle,
                                    padding: '10px 16px',
                                    background: checkersVariant === 'international' ? '#e53935' : 'rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}
                            >
                                International (10x10)
                            </button>
                            <button
                                onClick={() => setCheckersVariant('russian')}
                                style={{
                                    ...buttonStyle,
                                    padding: '10px 16px',
                                    background: checkersVariant === 'russian' ? '#e53935' : 'rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}
                            >
                                Russian (8x8)
                            </button>
                        </div>
                    </div>
                )}

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
                <h2 style={{ marginTop: 0 }}>Join Room</h2>

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
            <h2 style={{ marginTop: 0 }}>Lobby</h2>

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
                        disabled={gameType === 'checkers' ? players.length < 2 : players.length < 1}
                        style={{
                            ...buttonStyle,
                            background: (gameType === 'checkers' ? players.length >= 2 : players.length >= 1)
                                ? 'linear-gradient(135deg, #4CAF50, #66bb6a)'
                                : '#555',
                            color: 'white',
                            cursor: (gameType === 'checkers' ? players.length >= 2 : players.length >= 1) ? 'pointer' : 'not-allowed'
                        }}
                    >
                        🚀 Start Game
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
