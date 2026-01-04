import React, { useEffect, useState, useMemo } from 'react';
import { GameService } from '../services/GameService';

export default function GameLibrary({ onSelectGame }) {
    const [games, setGames] = useState([]);
    const [scores, setScores] = useState([]);

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

    // Sort games: recently played first, then unplayed games
    const sortedGames = useMemo(() => {
        if (games.length === 0) return [];

        return [...games].sort((a, b) => {
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
    }, [games, scores]);

    return (
        <div>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>🎮 Game Library</h2>
            {scores.length > 0 && sortedGames.some(g => getLastPlayedTime(g.id)) && (
                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    ✨ Sorted by recently played
                </p>
            )}
            <div className="product-grid">
                {sortedGames.map(game => (
                    <div key={game.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
                        <div className="game-card-img" style={{ backgroundImage: `url(${gameImages[game.type]})` }} onClick={() => onSelectGame(game.type)}></div>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>{game.name}</h3>
                            <p>{game.description}</p>
                            <div className="badge">High Score: {getHighScore(game.id)}</div>

                            {/* Special UNO buttons */}
                            {game.type === 'uno' ? (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={() => onSelectGame('uno')}
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
                                        onClick={() => onSelectGame('uno-lobby')}
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
                ))}
            </div>
        </div>
    );
}
