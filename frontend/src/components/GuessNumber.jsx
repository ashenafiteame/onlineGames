import React, { useState } from 'react';
import { GameService } from '../services/GameService';

export default function GuessNumber({ onFinish, highScore }) {
    const [target, setTarget] = useState(generateNumber());
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('Guess a number between 1 and 100');
    const [attempts, setAttempts] = useState(0);

    function generateNumber() {
        return Math.floor(Math.random() * 100) + 1;
    }

    const handleGuess = (e) => {
        e.preventDefault();
        const val = parseInt(guess);
        if (isNaN(val)) return;

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (val === target) {
            const score = Math.max(100 - newAttempts * 10, 10);
            GameService.submitScore('guess', score).then((user) => {
                alert(`Correct! The number was ${target}. Score: ${score}`);
                onFinish(user);
            });
            setMessage('You won!');
        } else if (val < target) {
            setMessage('Too low!');
        } else {
            setMessage('Too high!');
        }
        setGuess('');
    };

    return (
        <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <h2>🔢 Guess the Number</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Enter a number between 1 and 100. We'll tell you if it's too high or too low.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                <p>{message}</p>
                <p style={{ color: '#ffd700' }}>High Score: {highScore}</p>
            </div>
            <p>Attempts: {attempts}</p>
            <form onSubmit={handleGuess}>
                <input
                    type="number"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Enter number (1-100)"
                    required
                />
                <button type="submit">Guess</button>
            </form>
            <button onClick={() => onFinish(null)} style={{ marginTop: '20px', background: '#555' }}>Back</button>
        </div>
    );
}
