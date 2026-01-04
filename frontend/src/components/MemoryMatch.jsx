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
        <div style={{
            textAlign: 'center',
            position: 'relative',
            padding: '40px 20px',
            background: '#f8f9fa', // Clean off-white
            borderRadius: '20px',
            minHeight: '80vh',
            color: '#2c3e50', // Professional dark blue-gray
            fontFamily: "'Inter', sans-serif"
        }}>
            <button
                onClick={() => onFinish(null)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: '#e9ecef',
                    color: '#495057',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    zIndex: 100,
                    fontWeight: 'bold',
                    transition: 'background 0.2s'
                }}
            >
                Exit
            </button>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#2c3e50' }}>🧠 Memory Match</h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '2rem' }}>
                Classic concentration game. Find all the matching pairs.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '2rem', fontSize: '1.2rem', fontWeight: '500' }}>
                <div>Moves: <span style={{ color: '#4a90e2' }}>{moves}</span></div>
                <div style={{ color: '#f39c12' }}>High Score: {highScore}</div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '15px',
                maxWidth: '440px',
                margin: '0 auto'
            }}>
                {cards.map((card, index) => (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(index)}
                        style={{
                            height: '90px',
                            backgroundColor: flipped.includes(index) || matched.includes(index) ? '#fff' : '#4a90e2', // Professional Blue
                            border: '1px solid rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.2rem',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            userSelect: 'none'
                        }}
                    >
                        {(flipped.includes(index) || matched.includes(index)) ? card.emoji : ' '}
                    </div>
                ))}
            </div>

            <button
                onClick={shuffleCards}
                style={{
                    marginTop: '30px',
                    padding: '12px 32px',
                    fontSize: '1rem',
                    background: '#2c3e50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                New Game
            </button>

            {gameOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '40px',
                        borderRadius: '20px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        border: '1px solid #dee2e6',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ color: '#2c3e50', marginTop: 0, fontSize: '2rem' }}>Well Done! 🎉</h2>
                        <p style={{ fontSize: '1.2rem', margin: '15px 0', color: '#6c757d' }}>
                            Finished in <span style={{ fontWeight: 'bold', color: '#4a90e2' }}>{moves}</span> moves.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                            <button onClick={shuffleCards} style={{ padding: '14px 28px', fontSize: '1rem', cursor: 'pointer', background: '#4a90e2', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Play Again</button>
                            <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '14px 28px', fontSize: '1rem', background: 'transparent', color: '#6c757d', border: '1px solid #dee2e6', borderRadius: '10px', cursor: 'pointer' }}>Back to Library</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
