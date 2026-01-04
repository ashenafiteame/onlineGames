import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameService } from '../services/GameService';

const WhackAMole = ({ onFinish, highScore }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [moles, setMoles] = useState(Array(9).fill(false));
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);
    const moleTimeouts = useRef([]);

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setMoles(Array(9).fill(false));
        setGameActive(true);
        setGameOver(false);
        setLastUpdatedUser(null);
    };

    const showMole = useCallback(() => {
        if (!gameActive) return;
        const idx = Math.floor(Math.random() * 9);
        setMoles(prev => {
            const next = [...prev];
            next[idx] = true;
            return next;
        });
        const timeout = setTimeout(() => {
            setMoles(prev => {
                const next = [...prev];
                next[idx] = false;
                return next;
            });
        }, 800 + Math.random() * 400);
        moleTimeouts.current.push(timeout);
    }, [gameActive]);

    useEffect(() => {
        if (!gameActive) return;
        const interval = setInterval(showMole, 600 + Math.random() * 400);
        return () => {
            clearInterval(interval);
            moleTimeouts.current.forEach(clearTimeout);
            moleTimeouts.current = [];
        };
    }, [gameActive, showMole]);

    useEffect(() => {
        if (!gameActive || timeLeft <= 0) return;
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [gameActive, timeLeft]);

    useEffect(() => {
        if (gameActive && timeLeft <= 0) {
            setGameActive(false);
            setGameOver(true);
            GameService.submitScore('whackamole', score).then((user) => setLastUpdatedUser(user));
            if (score > localHighScore) setLocalHighScore(score);
        }
    }, [timeLeft, gameActive, score, localHighScore]);

    const whackMole = (idx) => {
        if (!gameActive || !moles[idx]) return;
        setMoles(prev => {
            const next = [...prev];
            next[idx] = false;
            return next;
        });
        setScore(s => s + 10);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '20px',
            position: 'relative',
            borderRadius: '8px'
        }}>
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
            <h1 style={{ fontSize: '42px', margin: '0 0 15px 0' }}>🔨 Whack-a-Mole</h1>

            <div style={{ display: 'flex', gap: '40px', marginBottom: '20px', fontSize: '20px' }}>
                <div>⏱️ Time: <span style={{ color: timeLeft <= 10 ? '#ff4444' : '#ffd700' }}>{timeLeft}s</span></div>
                <div>🎯 Score: <span style={{ color: '#ffd700' }}>{score}</span></div>
                <div>🏆 Best: {localHighScore}</div>
            </div>

            {!gameActive && !gameOver && (
                <button onClick={startGame} style={{
                    padding: '15px 50px', background: '#4CAF50', color: 'white',
                    border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', marginBottom: '20px'
                }}>Start Game</button>
            )}

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.85)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '200px', zIndex: 1000
                }}>
                    <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>Game Over!</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Score: {score}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Play Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '10px 20px', fontSize: '1rem', background: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 100px)',
                gap: '15px',
                background: '#5a3d2b',
                padding: '20px',
                borderRadius: '15px'
            }}>
                {moles.map((up, idx) => (
                    <div
                        key={idx}
                        onClick={() => whackMole(idx)}
                        style={{
                            width: '100px',
                            height: '100px',
                            background: up ? '#4CAF50' : '#3d2817',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: up ? '50px' : '30px',
                            cursor: gameActive ? 'pointer' : 'default',
                            transition: 'all 0.1s',
                            boxShadow: up ? '0 0 20px #4CAF50' : 'inset 0 4px 8px rgba(0,0,0,0.5)'
                        }}
                    >
                        {up ? '🐹' : '🕳️'}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhackAMole;
