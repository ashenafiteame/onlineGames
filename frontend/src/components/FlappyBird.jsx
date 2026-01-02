import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameService } from '../services/GameService';

const FlappyBird = ({ onFinish, highScore }) => {
    const canvasRef = useRef(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);

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
                    GameService.submitScore('flappybird', score * 10);
                    if (score * 10 > localHighScore) setLocalHighScore(score * 10);
                }
                pipesRef.current.forEach(pipe => {
                    if (90 > pipe.x && 50 < pipe.x + PIPE_WIDTH) {
                        if (birdY < pipe.gapY - PIPE_GAP / 2 || birdY > pipe.gapY + PIPE_GAP / 2) {
                            setGameOver(true);
                            GameService.submitScore('flappybird', score * 10);
                            if (score * 10 > localHighScore) setLocalHighScore(score * 10);
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
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 40px Arial';
                ctx.fillText('Game Over', 200, 280);
                ctx.font = '24px Arial';
                ctx.fillText(`Score: ${score}`, 200, 330);
                ctx.fillText('Click to Retry', 200, 380);
            }

            frameRef.current = requestAnimationFrame(gameLoop);
        };

        frameRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [gameStarted, gameOver, score, localHighScore]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: '#1a1a2e', padding: '20px' }}>
            <h1 style={{ color: 'white', margin: '0 0 10px 0' }}>🐦 Flappy Bird</h1>
            <div style={{ color: 'white', marginBottom: '10px' }}>🏆 Best: {localHighScore}</div>
            <canvas ref={canvasRef} width={400} height={600} onClick={jump} style={{ borderRadius: '10px', cursor: 'pointer' }} />
            <button onClick={() => onFinish(null)} style={{ marginTop: '20px', background: '#666', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>Menu</button>
        </div>
    );
};

export default FlappyBird;
