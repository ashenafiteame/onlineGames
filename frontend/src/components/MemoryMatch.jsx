import React, { useState, useEffect } from 'react';
import { GameService } from '../services/GameService';

const CARDS = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🍍', '🥝'];

export default function MemoryMatch({ onFinish, highScore }) {
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [matched, setMatched] = useState([]);
    const [moves, setMoves] = useState(0);

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
        if (matched.length === cards.length && cards.length > 0) {
            const score = Math.max(100 - moves * 5, 10);
            GameService.submitScore('memory', score).then((user) => {
                alert(`You won in ${moves} moves! Score: ${score}`);
                onFinish(user);
            });
        }
    }, [matched]);

    return (
        <div style={{ textAlign: 'center' }}>
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
            <button onClick={() => onFinish(null)} style={{ marginTop: '20px', marginLeft: '10px', background: '#555' }}>Back</button>
        </div>
    );
}
