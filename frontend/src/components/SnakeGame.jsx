import React, { useEffect, useRef, useState } from 'react';
import { GameService } from '../services/GameService';

const GRID_SIZE = 20;
const TILE_SIZE = 20;

export default function SnakeGame({ onFinish, highScore }) {
    const canvasRef = useRef(null);
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState({ x: 15, y: 15 });
    const [direction, setDirection] = useState({ x: 0, y: 0 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [displayHighScore, setDisplayHighScore] = useState(highScore);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);
    const [touchStart, setTouchStart] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Update local high score if prop changes (e.g. on mount)
    useEffect(() => {
        setDisplayHighScore(highScore);
    }, [highScore]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault(); // Prevent page scrolling
            }
            if (!gameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                setGameStarted(true);
                setDirection({ x: 1, y: 0 }); // Default start direction
            }
            switch (e.key) {
                case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction, gameStarted]);

    // Swipe gesture handling
    const handleTouchStart = (e) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e) => {
        if (!touchStart) return;
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const dx = touchEnd.x - touchStart.x;
        const dy = touchEnd.y - touchStart.y;
        const minSwipe = 30;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > minSwipe && direction.x === 0) {
                handleDirectionChange('right');
            } else if (dx < -minSwipe && direction.x === 0) {
                handleDirectionChange('left');
            }
        } else {
            // Vertical swipe
            if (dy > minSwipe && direction.y === 0) {
                handleDirectionChange('down');
            } else if (dy < -minSwipe && direction.y === 0) {
                handleDirectionChange('up');
            }
        }
        setTouchStart(null);
    };

    // Unified direction change handler (used by both keyboard and touch)
    const handleDirectionChange = (dir) => {
        if (!gameStarted) {
            setGameStarted(true);
            setDirection({ x: 1, y: 0 });
            return;
        }
        switch (dir) {
            case 'up': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
            case 'down': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
            case 'left': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
            case 'right': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        }
    };

    useEffect(() => {
        if (gameOver || !gameStarted) return;
        const interval = setInterval(runGameLoop, 150); // Speed
        return () => clearInterval(interval);
    }, [snake, direction, gameOver, gameStarted]);

    const runGameLoop = () => {
        const newSnake = [...snake];
        const head = { x: newSnake[0].x + direction.x, y: newSnake[0].y + direction.y };

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            endGame();
            return;
        }

        // Self collision
        for (let part of newSnake) {
            if (head.x === part.x && head.y === part.y) {
                endGame();
                return;
            }
        }

        newSnake.unshift(head);

        // Eat food
        if (head.x === food.x && head.y === food.y) {
            setScore(score + 10);
            setFood({
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            });
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
        draw(newSnake, food);
    };

    const endGame = () => {
        setGameOver(true);
        const finalScore = score;

        if (finalScore > displayHighScore) {
            setDisplayHighScore(finalScore);
        }

        GameService.submitScore('snake', finalScore).then((user) => {
            setLastUpdatedUser(user);
        }).catch(err => console.error("Score submit failed", err));
    };

    const handleRestart = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood({ x: 15, y: 15 });
        setDirection({ x: 0, y: 0 }); // Reset direction
        setScore(0);
        setGameOver(false);
        setGameStarted(false); // require key press to start again
    };

    const draw = (snakeArr, foodPos) => {
        const ctx = canvasRef.current.getContext('2d');

        // Dark gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(1, '#16213e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * TILE_SIZE, 0);
            ctx.lineTo(i * TILE_SIZE, GRID_SIZE * TILE_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * TILE_SIZE);
            ctx.lineTo(GRID_SIZE * TILE_SIZE, i * TILE_SIZE);
            ctx.stroke();
        }

        // Food with glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff6b6b';
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(
            foodPos.x * TILE_SIZE + TILE_SIZE / 2,
            foodPos.y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Snake with gradient coloring
        snakeArr.forEach((part, index) => {
            const ratio = index / snakeArr.length;
            const r = Math.round(66 + (20 * ratio));
            const g = Math.round(211 - (60 * ratio));
            const b = Math.round(146 - (40 * ratio));

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

            // Rounded rectangle for each segment
            const x = part.x * TILE_SIZE + 1;
            const y = part.y * TILE_SIZE + 1;
            const w = TILE_SIZE - 2;
            const h = TILE_SIZE - 2;
            const radius = 4;

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();

            // Head highlight
            if (index === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    // Initial Draw
    useEffect(() => {
        if (canvasRef.current) draw(snake, food);
    }, []);

    return (
        <div style={{
            textAlign: 'center',
            position: 'relative',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '40px 20px',
            minHeight: '80vh',
            borderRadius: '20px'
        }}>
            <button
                onClick={() => onFinish(null)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#e0e0e0',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '10px 20px',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    zIndex: 100,
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.2s ease'
                }}
            >
                ← Exit
            </button>

            <h1 style={{
                fontSize: '2.8rem',
                marginBottom: '8px',
                color: '#42d392',
                textShadow: '0 0 30px rgba(66,211,146,0.3)'
            }}>
                🐍 Snake
            </h1>
            <p style={{ color: '#7f8c8d', fontSize: '1rem', marginBottom: '1.5rem' }}>
                Use <span style={{ color: '#42d392', fontWeight: 'bold' }}>Arrow Keys</span> to move. Eat the glowing food to grow!
            </p>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '3rem',
                marginBottom: '1.5rem',
                fontSize: '1.2rem',
                fontWeight: '600'
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '10px 25px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    Score: <span style={{ color: '#42d392' }}>{score}</span>
                </div>
                <div style={{
                    background: 'rgba(255,215,0,0.1)',
                    padding: '10px 25px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,215,0,0.2)',
                    color: '#ffd700'
                }}>
                    Best: {displayHighScore}
                </div>
            </div>

            {!gameStarted && (
                <div style={{
                    color: '#e0e0e0',
                    marginBottom: '1rem',
                    padding: '15px 30px',
                    background: 'rgba(66,211,146,0.15)',
                    borderRadius: '30px',
                    display: 'inline-block',
                    animation: 'pulse 2s infinite'
                }}>
                    {isMobile ? '👆 Tap a direction or swipe to start!' : '⌨️ Press any Arrow Key to Start'}
                </div>
            )}

            <div
                style={{
                    display: 'inline-block',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)'
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <canvas
                    ref={canvasRef}
                    width={GRID_SIZE * TILE_SIZE}
                    height={GRID_SIZE * TILE_SIZE}
                    style={{
                        borderRadius: '12px',
                        display: 'block'
                    }}
                />
            </div>

            {/* Mobile D-Pad Controls */}
            {isMobile && !gameOver && (
                <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                    <button
                        onClick={() => handleDirectionChange('up')}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(66,211,146,0.3)',
                            color: '#42d392',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        ▲
                    </button>
                    <div style={{ display: 'flex', gap: '50px' }}>
                        <button
                            onClick={() => handleDirectionChange('left')}
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(66,211,146,0.3)',
                                color: '#42d392',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                            }}
                        >
                            ◀
                        </button>
                        <button
                            onClick={() => handleDirectionChange('right')}
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(66,211,146,0.3)',
                                color: '#42d392',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                            }}
                        >
                            ▶
                        </button>
                    </div>
                    <button
                        onClick={() => handleDirectionChange('down')}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(66,211,146,0.3)',
                            color: '#42d392',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        ▼
                    </button>
                </div>
            )}

            {gameOver && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000, backdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        padding: '40px 50px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{
                            color: '#ff6b6b',
                            marginTop: 0,
                            fontSize: '2.2rem',
                            textShadow: '0 0 20px rgba(255,107,107,0.4)'
                        }}>
                            Game Over! 🐍
                        </h2>
                        <p style={{ fontSize: '1.4rem', margin: '1rem 0', color: '#e0e0e0' }}>
                            Final Score: <span style={{ color: '#42d392', fontWeight: 'bold' }}>{score}</span>
                        </p>
                        {score >= displayHighScore && score > 0 && (
                            <p style={{ color: '#ffd700', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                🏆 New High Score!
                            </p>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={handleRestart}
                                style={{
                                    padding: '14px 40px',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #42d392 0%, #2ecc71 100%)',
                                    color: '#1a1a2e',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 15px rgba(66,211,146,0.3)'
                                }}
                            >
                                Play Again
                            </button>
                            <button
                                onClick={() => onFinish(lastUpdatedUser)}
                                style={{
                                    padding: '14px 40px',
                                    fontSize: '1.1rem',
                                    background: 'transparent',
                                    color: '#7f8c8d',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Back to Library
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    );
}
