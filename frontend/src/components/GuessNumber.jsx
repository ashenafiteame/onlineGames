import React, { useState } from 'react';
import { GameService } from '../services/GameService';

export default function GuessNumber({ onFinish, highScore }) {
    const [target, setTarget] = useState(generateNumber());
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('Guess a number between 1 and 100');
    const [attempts, setAttempts] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);
    const [finalScore, setFinalScore] = useState(0);

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
            setFinalScore(score);
            GameService.submitScore('guess', score).then((user) => {
                setLastUpdatedUser(user);
                setGameOver(true);
            });
            setMessage('You won!');
        } else if (val < target) {
            setMessage('Too low!');
        } else {
            setMessage('Too high!');
        }
        setGuess('');
    };

    const handleRestart = () => {
        setTarget(generateNumber());
        setAttempts(0);
        setMessage('Guess a number between 1 and 100');
        setGameOver(false);
        setLastUpdatedUser(null);
    };

    return (
        <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
                onClick={() => onFinish(null)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
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
            <h2 style={{ marginTop: '20px' }}>🔢 Guess the Number</h2>
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
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white', marginRight: '10px' }}
                    required
                />
                <button type="submit" style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guess</button>
            </form>

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: '#42d392', marginTop: 0 }}>CORRECT! 🎉</h2>
                    <p style={{ fontSize: '1.2rem', margin: '0.5rem 0', color: 'white' }}>The number was {target}</p>
                    <p style={{ fontSize: '1.1rem', margin: '0.5rem 0', color: '#ffd700' }}>Score: {finalScore}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '1rem' }}>
                        <button onClick={handleRestart} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>Play Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
}
