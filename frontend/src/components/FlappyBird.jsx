import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameService } from '../services/GameService';

const FlappyBird = ({ onFinish, highScore }) => {
    const canvasRef = useRef(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    const birdRef = useRef({ y: 200, velocity: 0 });
    const pipesRef = useRef([]);
    const frameRef = useRef(null);

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const GRAVITY = 0.5;
    const JUMP = -8;
    const PIPE_WIDTH = 60;
    const PIPE_GAP = 150;
    const PIPE_SPEED = 3;

    const resetGame = useCallback(() => {
        birdRef.current = { y: 200, velocity: 0 };
        pipesRef.current = [];
        setScore(0);
        setGameOver(false);
        setGameStarted(false);
        setLastUpdatedUser(null);
    }, []);

    const jump = useCallback(() => {
        if (gameOver) {
            resetGame();
            return;
        }
        if (!gameStarted) setGameStarted(true);
        birdRef.current.velocity = JUMP;
    }, [gameOver, gameStarted, resetGame]);

    useEffect(() => {
        const handleKey = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [jump]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const gameLoop = () => {
            ctx.fillStyle = '#70c5ce';
            ctx.fillRect(0, 0, 400, 600);

            if (gameStarted && !gameOver) {
                birdRef.current.velocity += GRAVITY;
                birdRef.current.y += birdRef.current.velocity;

                if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < 200) {
                    const gapY = 100 + Math.random() * 300;
                    pipesRef.current.push({ x: 400, gapY, passed: false });
                }

                pipesRef.current = pipesRef.current.filter(pipe => {
                    pipe.x -= PIPE_SPEED;
                    if (!pipe.passed && pipe.x + PIPE_WIDTH < 90) {
                        setScore(s => s + 1);
                        pipe.passed = true;
                    }
                    return pipe.x > -PIPE_WIDTH;
                });

                // Collision
                const birdY = birdRef.current.y;
                if (birdY < 0 || birdY > 560) {
                    setGameOver(true);
                    const finalScore = score * 10;
                    GameService.submitScore('flappybird', finalScore).then(user => setLastUpdatedUser(user));
                    if (finalScore > localHighScore) setLocalHighScore(finalScore);
                }
                pipesRef.current.forEach(pipe => {
                    if (90 > pipe.x && 50 < pipe.x + PIPE_WIDTH) {
                        if (birdY < pipe.gapY - PIPE_GAP / 2 || birdY > pipe.gapY + PIPE_GAP / 2) {
                            setGameOver(true);
                            const finalScore = score * 10;
                            GameService.submitScore('flappybird', finalScore).then(user => setLastUpdatedUser(user));
                            if (finalScore > localHighScore) setLocalHighScore(finalScore);
                        }
                    }
                });
            }

            // Draw pipes
            ctx.fillStyle = '#3d8b40';
            pipesRef.current.forEach(pipe => {
                ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY - PIPE_GAP / 2);
                ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP / 2, PIPE_WIDTH, 600);
            });

            // Draw bird
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(90, birdRef.current.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(98, birdRef.current.y - 5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(100, birdRef.current.y - 5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(110, birdRef.current.y);
            ctx.lineTo(125, birdRef.current.y + 5);
            ctx.lineTo(110, birdRef.current.y + 10);
            ctx.fill();

            // Score
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(score, 200, 60);

            if (!gameStarted) {
                ctx.fillText('Click or Space', 200, 300);
                ctx.font = '20px Arial';
                ctx.fillText('to Start', 200, 340);
            }
            if (gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, 400, 600);
            }

            frameRef.current = requestAnimationFrame(gameLoop);
        };

        frameRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [gameStarted, gameOver, score, localHighScore]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#1a1a2e', padding: '20px', position: 'relative' }}>
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
            <h1 style={{ color: 'white', margin: '0 0 10px 0' }}>🐦 Flappy Bird</h1>
            <div style={{ color: 'white', marginBottom: '10px' }}>🏆 Best: {localHighScore}</div>
            <canvas ref={canvasRef} width={400} height={600} onClick={jump} style={{ borderRadius: '10px', cursor: 'pointer' }} />

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '250px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>CRASHED! 🐦</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0', color: 'white' }}>Score: {score * 10}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={resetGame} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>Try Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlappyBird;
