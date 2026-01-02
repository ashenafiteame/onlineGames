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
        'blackjack': '/games/blackjack.png'
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
                    <div key={game.id} className="card" onClick={() => onSelectGame(game.type)} style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
                        <div className="game-card-img" style={{ backgroundImage: `url(${gameImages[game.type]})` }}></div>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>{game.name}</h3>
                            <p>{game.description}</p>
                            <div className="badge">High Score: {getHighScore(game.id)}</div>
                            <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>Play Now →</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
