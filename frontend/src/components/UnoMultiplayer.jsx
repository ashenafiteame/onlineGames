import React, { useState, useEffect, useRef } from 'react';
import { UnoRoomService } from '../services/UnoRoomService';
import { GameService } from '../services/GameService';
import { AuthService } from '../services/AuthService';

const COLORS = ['Red', 'Blue', 'Green', 'Yellow'];

const SYMBOLS = {
    'Skip': '🚫',
    'Reverse': '⇄',
    'Draw Two': '+2',
    'Wild': '🌈',
    'Wild Draw Four': '+4'
};

const COLOR_MAP = {
    'Red': '#e53935',
    'Blue': '#1e88e5',
    'Green': '#43a047',
    'Yellow': '#fdd835',
    'Black': '#333'
};

// Color Picker Modal
function ColorPickerModal({ onSelect }) {
    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1a1a2e',
                padding: '2rem',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h3 style={{ marginTop: 0 }}>Choose a Color</h3>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => onSelect(color)}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '12px',
                                border: '3px solid rgba(255,255,255,0.3)',
                                background: COLOR_MAP[color],
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function UnoMultiplayer({ room: initialRoom, onFinish }) {
    const currentUser = AuthService.getCurrentUser();
    const [room, setRoom] = useState(initialRoom);
    const [gameState, setGameState] = useState(null);
    const [players, setPlayers] = useState([]);
    const [pendingWild, setPendingWild] = useState(null); // cardId waiting for color
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const pollInterval = useRef(null);

    // Parse room data when it changes
    useEffect(() => {
        if (room) {
            setPlayers(JSON.parse(room.players));
            if (room.gameState) {
                setGameState(JSON.parse(room.gameState));
            }
        }
    }, [room]);

    // Poll for game state updates
    useEffect(() => {
        if (room && room.status === 'PLAYING') {
            pollInterval.current = setInterval(async () => {
                try {
                    const updated = await UnoRoomService.getRoom(room.id);
                    setRoom(updated);
                } catch (e) {
                    console.error('Poll error:', e);
                }
            }, 1000);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [room?.id, room?.status]);

    // Update message based on turn
    useEffect(() => {
        if (room && room.status === 'PLAYING') {
            if (room.currentPlayerUsername === currentUser.username) {
                setMessage("Your Turn! 🎴");
            } else {
                const currentPlayer = players.find(p => p.username === room.currentPlayerUsername);
                setMessage(`${currentPlayer?.displayName || 'Opponent'}'s Turn`);
            }
        }
        if (room?.status === 'FINISHED' && gameState?.winners) {
            const position = gameState.winners.indexOf(currentUser.username);
            if (position === 0) {
                setMessage("🏆 You Won!");
                // Submit score
                GameService.submitScore('uno', 500).catch(console.error);
            } else if (position > 0) {
                setMessage(`You finished #${position + 1}`);
                GameService.submitScore('uno', Math.max(50, 300 - position * 100)).catch(console.error);
            } else {
                setMessage("Game Over!");
                GameService.submitScore('uno', 50).catch(console.error);
            }
        }
    }, [room?.currentPlayerUsername, room?.status, gameState?.winners, players]);

    const isMyTurn = room?.currentPlayerUsername === currentUser.username;
    const myHand = gameState?.hands?.[currentUser.username] || [];
    const discardPile = gameState?.discardPile || [];
    const topCard = discardPile[discardPile.length - 1];
    const currentColor = gameState?.currentColor;
    const direction = gameState?.direction || 1;

    const isValidMove = (card) => {
        if (!topCard || !currentColor) return false;
        if (card.color === 'Black') return true;
        return card.color === currentColor || card.value === topCard.value;
    };

    const handlePlayCard = async (card) => {
        if (!isMyTurn) return;
        if (!isValidMove(card)) {
            setError("Invalid move!");
            setTimeout(() => setError(''), 2000);
            return;
        }

        // Wild card - need to pick color
        if (card.color === 'Black') {
            setPendingWild(card.id);
            return;
        }

        try {
            const updated = await UnoRoomService.playCard(room.id, card.id);
            setRoom(updated);
            setError('');
        } catch (e) {
            setError(e.message);
        }
    };

    const handleColorSelect = async (color) => {
        if (!pendingWild) return;
        try {
            const updated = await UnoRoomService.playCard(room.id, pendingWild, color);
            setRoom(updated);
            setPendingWild(null);
            setError('');
        } catch (e) {
            setError(e.message);
            setPendingWild(null);
        }
    };

    const handleDrawCard = async () => {
        if (!isMyTurn) return;
        try {
            const updated = await UnoRoomService.drawCard(room.id);
            setRoom(updated);
            setError('');
        } catch (e) {
            setError(e.message);
        }
    };

    const getCardStyle = (card, isPlayable = false) => ({
        width: '60px',
        height: '90px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: card.color === 'Black' ? '1.5rem' : '1.2rem',
        color: card.color === 'Yellow' ? '#333' : 'white',
        background: COLOR_MAP[card.color],
        border: isPlayable && isMyTurn ? '3px solid #fff' : '2px solid rgba(0,0,0,0.3)',
        cursor: isPlayable && isMyTurn ? 'pointer' : 'default',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        flexShrink: 0
    });

    const renderCardContent = (card) => {
        if (SYMBOLS[card.value]) {
            return <span>{SYMBOLS[card.value]}</span>;
        }
        return <span>{card.value}</span>;
    };

    // Get other players (not current user)
    const otherPlayers = players.filter(p => p.username !== currentUser.username);

    return (
        <div style={{
            minHeight: '100vh',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
        }}>
            {/* Exit Button */}
            <button
                onClick={() => onFinish(null)}
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }}
            >
                Exit
            </button>

            {/* Header */}
            <h2 style={{ margin: '0 0 0.5rem 0' }}>🎴 UNO Online</h2>
            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Room: {room.inviteCode}
            </div>

            {/* Direction Indicator */}
            <div style={{
                fontSize: '1.5rem',
                marginBottom: '1rem',
                animation: 'spin 2s linear infinite',
                animationDirection: direction === 1 ? 'normal' : 'reverse'
            }}>
                {direction === 1 ? '↻' : '↺'}
            </div>

            {/* Other Players */}
            <div style={{
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                {otherPlayers.map(player => {
                    const handSize = gameState?.hands?.[player.username]?.length || 0;
                    const isCurrent = room.currentPlayerUsername === player.username;
                    const hasWon = gameState?.winners?.includes(player.username);

                    return (
                        <div
                            key={player.username}
                            style={{
                                textAlign: 'center',
                                opacity: hasWon ? 0.5 : 1
                            }}
                        >
                            <div style={{
                                fontWeight: isCurrent ? 'bold' : 'normal',
                                color: isCurrent ? 'var(--primary)' : '#ccc',
                                marginBottom: '0.5rem'
                            }}>
                                {player.displayName}
                                {hasWon && ' 🏆'}
                            </div>
                            {/* Card backs */}
                            <div style={{ display: 'flex', gap: '-10px' }}>
                                {Array.from({ length: Math.min(handSize, 7) }).map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '35px',
                                            height: '50px',
                                            background: 'linear-gradient(135deg, #c62828, #e53935)',
                                            borderRadius: '4px',
                                            marginLeft: i > 0 ? '-15px' : '0',
                                            border: '1px solid rgba(0,0,0,0.3)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                ))}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                {handSize} cards
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Center - Discard Pile & Current Color */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                marginBottom: '1.5rem'
            }}>
                {/* Draw Pile */}
                <div
                    onClick={handleDrawCard}
                    style={{
                        width: '70px',
                        height: '100px',
                        background: 'linear-gradient(135deg, #c62828, #e53935)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isMyTurn ? 'pointer' : 'not-allowed',
                        boxShadow: isMyTurn ? '0 0 20px rgba(229, 57, 53, 0.5)' : 'none',
                        border: '3px solid rgba(255,255,255,0.2)',
                        transition: 'transform 0.2s'
                    }}
                >
                    <span style={{ fontSize: '1.5rem', color: 'white' }}>🃏</span>
                </div>

                {/* Discard Pile */}
                {topCard && (
                    <div style={{
                        ...getCardStyle(topCard),
                        width: '80px',
                        height: '120px',
                        fontSize: '2rem',
                        boxShadow: `0 0 30px ${COLOR_MAP[currentColor]}60`
                    }}>
                        {renderCardContent(topCard)}
                    </div>
                )}

                {/* Current Color Indicator */}
                <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: COLOR_MAP[currentColor],
                    border: '3px solid white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }} title={`Current color: ${currentColor}`} />
            </div>

            {/* Message */}
            <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: isMyTurn ? 'var(--primary)' : '#888',
                animation: isMyTurn ? 'pulse 1.5s infinite' : 'none'
            }}>
                {message}
            </div>

            {error && (
                <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>
            )}

            {/* My Hand */}
            <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '1rem',
                borderRadius: '12px',
                maxWidth: '90vw',
                overflowX: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {myHand.map(card => {
                        const playable = isValidMove(card);
                        return (
                            <div
                                key={card.id}
                                onClick={() => playable && handlePlayCard(card)}
                                style={{
                                    ...getCardStyle(card, playable),
                                    opacity: playable ? 1 : 0.6,
                                    transform: playable && isMyTurn ? 'translateY(-5px)' : 'none'
                                }}
                                onMouseEnter={e => {
                                    if (playable && isMyTurn) {
                                        e.currentTarget.style.transform = 'translateY(-15px) scale(1.1)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = playable ? 'translateY(-5px)' : 'none';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                                }}
                            >
                                {renderCardContent(card)}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Color Picker Modal */}
            {pendingWild && <ColorPickerModal onSelect={handleColorSelect} />}

            {/* Game Over Modal */}
            {room.status === 'FINISHED' && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a2e',
                        padding: '2rem',
                        borderRadius: '16px',
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minWidth: '400px',
                        maxWidth: '90%'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎴</div>
                        <h2 style={{ margin: '0 0 0.5rem 0' }}>Game Over!</h2>
                        <div style={{ color: '#888', marginBottom: '1.5rem' }}>
                            Games Played: {room.gamesPlayed || 1}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            textAlign: 'left'
                        }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff6b6b' }}>This Game</h4>
                                {gameState?.winners?.map((username, i) => {
                                    const player = players.find(p => p.username === username);
                                    return (
                                        <div key={username} style={{ padding: '4px 0', fontSize: '0.9rem' }}>
                                            {i === 0 ? '🏆' : `#${i + 1}`} {player?.displayName}
                                        </div>
                                    );
                                })}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#4CAF50' }}>Session Wins</h4>
                                {(() => {
                                    const wins = JSON.parse(room.sessionWins || '{}');
                                    return players
                                        .sort((a, b) => (wins[b.username] || 0) - (wins[a.username] || 0))
                                        .map(p => (
                                            <div key={p.username} style={{ padding: '4px 0', fontSize: '0.9rem' }}>
                                                {wins[p.username] || 0} wins - {p.displayName}
                                            </div>
                                        ));
                                })()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => onFinish(null)}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    background: '#555',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Leave Room
                            </button>

                            {room.host.username === currentUser.username && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const updated = await UnoRoomService.playAgain(room.id);
                                            setRoom(updated);
                                        } catch (e) {
                                            setError(e.message);
                                        }
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        background: 'linear-gradient(135deg, #4CAF50, #66bb6a)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Play Again ↻
                                </button>
                            )}
                        </div>
                        {room.host.username !== currentUser.username && (
                            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#888', fontStyle: 'italic' }}>
                                Waiting for host to restart...
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
