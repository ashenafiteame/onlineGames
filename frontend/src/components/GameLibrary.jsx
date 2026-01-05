import React, { useEffect, useState, useMemo } from 'react';
import { GameService } from '../services/GameService';

export default function GameLibrary({ onSelectGame }) {
    const [games, setGames] = useState([]);
    const [scores, setScores] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'multiplayer', 'solo'

    const gameImages = {
        'memory': '/games/memory.png',
        'guess': '/games/guess.png',
        'snake': '/games/snake.png',
        'balloon': '/games/balloon.png',
        'lane-racer': '/games/lane-racer.png',
        'moto-racer': '/games/moto-racer.png',
        'checkers': '/games/checkers.png',
        'chess': '/games/chess.png',
        'tictactoe': '/games/tictactoe.png',
        '2048': '/games/2048.png',
        'tetris': '/games/tetris.png',
        'connectfour': '/games/connectfour.png',
        'sudoku': '/games/sudoku.png',
        'blackjack': '/games/blackjack.png',
        'uno': '/games/uno.png',
        'solitaire': '/games/solitaire.png',
        'whackamole': '/games/whackamole.png',
        'minesweeper': '/games/minesweeper.png',
        'reversi': '/games/reversi.png',
        'battleship': '/games/battleship.png',
        'flappybird': '/games/flappybird.png',
        'brickbreaker': '/games/brickbreaker.png'
    };

    useEffect(() => {
        GameService.getGames().then(setGames).catch(console.error);
        GameService.getMyScores().then(setScores).catch(console.error);
    }, []);

    const getHighScore = (gameId) => {
        const gameScores = scores.filter(s => s.game.id === gameId);
        if (gameScores.length === 0) return 'No plays yet';
        return Math.max(...gameScores.map(s => s.scoreValue));
    };

    // Get most recent play time for each game
    const getLastPlayedTime = (gameId) => {
        const gameScores = scores.filter(s => s.game.id === gameId);
        if (gameScores.length === 0) return null;
        // Scores should have a createdAt or timestamp field
        const times = gameScores.map(s => new Date(s.createdAt || s.playedAt || 0).getTime());
        return Math.max(...times);
    };

    // Format time ago for display
    const getTimeAgo = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return `${Math.floor(days / 7)}w ago`;
    };

    // List of multiplayer-capable game types
    const multiplayerGameTypes = ['uno', 'checkers', 'chess', 'tictactoe', 'connectfour'];

    // Sort games: recently played first, then unplayed games
    const sortGames = (gameList) => {
        return [...gameList].sort((a, b) => {
            const timeA = getLastPlayedTime(a.id);
            const timeB = getLastPlayedTime(b.id);

            // If both have been played, sort by most recent
            if (timeA && timeB) return timeB - timeA;
            // Played games come before unplayed
            if (timeA && !timeB) return -1;
            if (!timeA && timeB) return 1;
            // Both unplayed, keep original order
            return 0;
        });
    };

    // Separate and sort games by category
    const { multiplayerGames, soloGames } = useMemo(() => {
        if (games.length === 0) return { multiplayerGames: [], soloGames: [] };

        const multiplayer = games.filter(g => multiplayerGameTypes.includes(g.type));
        const solo = games.filter(g => !multiplayerGameTypes.includes(g.type));

        return {
            multiplayerGames: sortGames(multiplayer),
            soloGames: sortGames(solo)
        };
    }, [games, scores]);

    // Get top 5 recently played games
    const recentlyPlayedGames = useMemo(() => {
        if (games.length === 0 || scores.length === 0) return [];

        // Get games that have been played (have scores)
        const playedGames = games.filter(g => getLastPlayedTime(g.id) !== null);

        // Sort by most recent and take top 5
        return [...playedGames]
            .sort((a, b) => getLastPlayedTime(b.id) - getLastPlayedTime(a.id))
            .slice(0, 5);
    }, [games, scores]);

    const renderGameCard = (game, isMultiplayer) => (
        <div key={game.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
            <div className="game-card-img" style={{ backgroundImage: `url(${gameImages[game.type]})` }} onClick={() => onSelectGame(game.type)}></div>
            <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>{game.name}</h3>
                <p>{game.description}</p>
                <div className="badge">High Score: {getHighScore(game.id)}</div>

                {isMultiplayer ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => onSelectGame(`${game.type}-solo`)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.85rem'
                            }}
                        >
                            🎮 Solo
                        </button>
                        <button
                            onClick={() => onSelectGame(`${game.type}-lobby`)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                background: 'linear-gradient(135deg, #e53935, #ff6b6b)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.85rem'
                            }}
                        >
                            🌐 Online
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => onSelectGame(game.type)}
                        style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}
                    >
                        Play Now →
                    </div>
                )}
            </div>
        </div>
    );

    const sectionHeaderStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        marginTop: '2rem',
        paddingBottom: '0.75rem',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
    };

    const sectionTitleStyle = {
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 'bold'
    };

    const sectionBadgeStyle = (color) => ({
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        background: color,
        color: 'white'
    });

    const filterTabStyle = (isActive, color) => ({
        padding: '10px 24px',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        transition: 'all 0.3s ease',
        background: isActive ? color : 'rgba(255, 255, 255, 0.1)',
        color: isActive ? 'white' : '#888',
        boxShadow: isActive ? '0 4px 15px rgba(0, 0, 0, 0.3)' : 'none'
    });

    return (
        <div>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>🎮 Game Library</h2>

            {/* Filter Menu Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '2rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '35px',
                maxWidth: '500px',
                margin: '0 auto 2rem auto'
            }}>
                <button
                    onClick={() => setFilter('all')}
                    style={filterTabStyle(filter === 'all', 'linear-gradient(135deg, #667eea, #764ba2)')}
                >
                    🎮 All Games
                </button>
                <button
                    onClick={() => setFilter('multiplayer')}
                    style={filterTabStyle(filter === 'multiplayer', 'linear-gradient(135deg, #e53935, #ff6b6b)')}
                >
                    👥 Multiplayer
                </button>
                <button
                    onClick={() => setFilter('solo')}
                    style={filterTabStyle(filter === 'solo', 'linear-gradient(135deg, #00c853, #69f0ae)')}
                >
                    🎯 Solo
                </button>
            </div>

            {/* Recently Played Section - Show only with "All Games" filter */}
            {filter === 'all' && recentlyPlayedGames.length > 0 && (
                <>
                    <div style={sectionHeaderStyle}>
                        <span style={{ fontSize: '1.75rem' }}>🕐</span>
                        <h3 style={sectionTitleStyle}>Recently Played</h3>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', marginTop: '-0.5rem' }}>
                        Jump back into your favorite games
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        overflowX: 'auto',
                        paddingBottom: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        {recentlyPlayedGames.map(game => {
                            const isMultiplayer = multiplayerGameTypes.includes(game.type);
                            const lastPlayed = getLastPlayedTime(game.id);
                            const timeAgo = lastPlayed ? getTimeAgo(lastPlayed) : '';

                            return (
                                <div
                                    key={game.id}
                                    style={{
                                        minWidth: '200px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100px',
                                            backgroundImage: `url(${gameImages[game.type]})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            position: 'relative'
                                        }}
                                        onClick={() => onSelectGame(isMultiplayer ? `${game.type}-solo` : game.type)}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'rgba(0, 0, 0, 0.7)',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            color: '#ffc107'
                                        }}>
                                            {timeAgo}
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.75rem' }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{game.name}</h4>
                                        {isMultiplayer ? (
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    onClick={() => onSelectGame(`${game.type}-solo`)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px 8px',
                                                        background: 'var(--primary)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Solo
                                                </button>
                                                <button
                                                    onClick={() => onSelectGame(`${game.type}-lobby`)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px 8px',
                                                        background: 'linear-gradient(135deg, #e53935, #ff6b6b)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Online
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onSelectGame(game.type)}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Play Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Multiplayer Games Section */}
            {(filter === 'all' || filter === 'multiplayer') && multiplayerGames.length > 0 && (
                <>
                    <div style={sectionHeaderStyle}>
                        <span style={{ fontSize: '1.75rem' }}>👥</span>
                        <h3 style={sectionTitleStyle}>Multiplayer Games</h3>
                        <span style={sectionBadgeStyle('linear-gradient(135deg, #e53935, #ff6b6b)')}>
                            {multiplayerGames.length} games
                        </span>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', marginTop: '-0.5rem' }}>
                        Challenge friends online or play against AI
                    </p>
                    <div className="product-grid">
                        {multiplayerGames.map(game => renderGameCard(game, true))}
                    </div>
                </>
            )}

            {/* Solo Games Section */}
            {(filter === 'all' || filter === 'solo') && soloGames.length > 0 && (
                <>
                    <div style={sectionHeaderStyle}>
                        <span style={{ fontSize: '1.75rem' }}>🎯</span>
                        <h3 style={sectionTitleStyle}>Solo Games</h3>
                        <span style={sectionBadgeStyle('linear-gradient(135deg, #667eea, #764ba2)')}>
                            {soloGames.length} games
                        </span>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', marginTop: '-0.5rem' }}>
                        Single-player challenges to test your skills
                    </p>
                    <div className="product-grid">
                        {soloGames.map(game => renderGameCard(game, false))}
                    </div>
                </>
            )}
        </div>
    );
}
