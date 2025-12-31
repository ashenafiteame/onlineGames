import React, { useEffect, useState } from 'react';
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
        'moto-racer': '/games/moto-racer.png'
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

    return (
        <div>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>🎮 Game Library</h2>
            <div className="product-grid">
                {games.map(game => (
                    <div key={game.id} className="card" onClick={() => onSelectGame(game.type)} style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
                        <div style={{ height: '150px', backgroundImage: `url(${gameImages[game.type]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
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
