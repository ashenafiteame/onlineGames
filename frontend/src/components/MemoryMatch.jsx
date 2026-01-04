import React, { useState, useEffect } from 'react';
import { GameService } from '../services/GameService';

const CARDS = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🍍', '🥝'];

export default function MemoryMatch({ onFinish, highScore }) {
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [matched, setMatched] = useState([]);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    useEffect(() => {
        shuffleCards();
    }, []);

    const shuffleCards = () => {
        const shuffled = [...CARDS, ...CARDS]
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => ({ id: index, emoji }));
        setCards(shuffled);
        setFlipped([]);
        setMatched([]);
        setMoves(0);
        setGameOver(false);
        setLastUpdatedUser(null);
    };

    const handleCardClick = (index) => {
        if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(moves + 1);
            const [first, second] = newFlipped;
            if (cards[first].emoji === cards[second].emoji) {
                setMatched([...matched, first, second]);
                setFlipped([]);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    useEffect(() => {
        if (matched.length === cards.length && cards.length > 0 && !gameOver) {
            setGameOver(true);
            const score = Math.max(100 - moves * 5, 10);
            GameService.submitScore('memory', score).then((user) => {
                setLastUpdatedUser(user);
            });
        }
    }, [matched, gameOver, cards.length, moves]);

    return (
        <div style={{ textAlign: 'center', position: 'relative' }}>
            <button
                onClick={() => onFinish(null)}
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    zIndex: 100,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                Exit
            </button>
            <h2>🧠 Memory Match</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Flip cards to find matching pairs. Find all pairs to win!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                <p>Moves: {moves}</p>
                <p style={{ color: '#ffd700' }}>High Score: {highScore}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
                {cards.map((card, index) => (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(index)}
                        style={{
                            height: '80px',
                            backgroundColor: flipped.includes(index) || matched.includes(index) ? '#fff' : '#646cff',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            transition: 'transform 0.3s'
                        }}
                    >
                        {(flipped.includes(index) || matched.includes(index)) ? card.emoji : '❓'}
                    </div>
                ))}
            </div>
            <button onClick={shuffleCards} style={{ marginTop: '20px' }}>Restart</button>
            {/* Removed bottom button */}

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.85)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '200px', zIndex: 1000
                }}>
                    <h2 style={{ color: '#4CAF50', marginTop: 0 }}>You Won!</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Moves: {moves}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={shuffleCards} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Play Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '10px 20px', fontSize: '1rem', background: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
}
