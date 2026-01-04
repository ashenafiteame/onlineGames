import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameService } from '../services/GameService';

const BrickBreaker = ({ onFinish, highScore }) => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState("Press Space to Start");
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    const ballRef = useRef({ x: 400, y: 300, dx: 4, dy: -4, radius: 8 });
    const paddleRef = useRef({ x: 350, width: 100, height: 15 });
    const bricksRef = useRef([]);
    const frameRef = useRef(null);
    const keysRef = useRef({});

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const initBricks = () => {
        const bricks = [];
        const rows = 5;
        const cols = 8;
        const width = 80;
        const height = 24;
        const padding = 12;
        const offsetTop = 60;
        const offsetLeft = 35;

        const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                bricks.push({
                    x: c * (width + padding) + offsetLeft,
                    y: r * (height + padding) + offsetTop,
                    width,
                    height,
                    status: 1,
                    color: colors[r]
                });
            }
        }
        bricksRef.current = bricks;
    };

    const startGame = () => {
        setScore(0);
        setLives(3);
        setGameActive(true);
        setGameOver(false);
        setLastUpdatedUser(null);
        setMessage("");
        ballRef.current = { x: 400, y: 300, dx: 4, dy: -4, radius: 8 };
        paddleRef.current = { x: 350, width: 100, height: 15 };
        initBricks();
    };

    const resetBall = () => {
        ballRef.current = { x: 400, y: 400, dx: 4, dy: -4, radius: 8 };
        paddleRef.current.x = 350;
        setGameActive(false);
        setMessage("Press Space to Continue");
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            keysRef.current[e.key] = true;
            if (e.code === 'Space' && !gameActive && !gameOver) {
                if (lives === 3 && score === 0) startGame();
                else setGameActive(true);
            } else if (e.code === 'Space' && gameOver) {
                startGame();
            }
        };
        const handleKeyUp = (e) => keysRef.current[e.key] = false;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameActive, gameOver]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const update = () => {
            if (!gameActive) return;

            // Paddle Movement
            if (keysRef.current['ArrowRight'] && paddleRef.current.x < width - paddleRef.current.width) {
                paddleRef.current.x += 7;
            } else if (keysRef.current['ArrowLeft'] && paddleRef.current.x > 0) {
                paddleRef.current.x -= 7;
            }

            const ball = ballRef.current;
            const paddle = paddleRef.current;

            // Ball Movement
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall Collision
            if (ball.x + ball.radius > width || ball.x - ball.radius < 0) ball.dx = -ball.dx;
            if (ball.y - ball.radius < 0) ball.dy = -ball.dy;

            // Paddle Collision
            if (
                ball.y + ball.radius > height - 30 &&
                ball.x > paddle.x &&
                ball.x < paddle.x + paddle.width
            ) {
                ball.dy = -Math.abs(ball.dy); // Force up
                // Add some angle based on where it hit the paddle
                const hitPoint = ball.x - (paddle.x + paddle.width / 2);
                ball.dx = hitPoint * 0.15;
            }

            // Brick Collision
            bricksRef.current.forEach(b => {
                if (b.status === 1) {
                    if (
                        ball.x > b.x &&
                        ball.x < b.x + b.width &&
                        ball.y > b.y &&
                        ball.y < b.y + b.height
                    ) {
                        ball.dy = -ball.dy;
                        b.status = 0;
                        setScore(s => s + 10);
                        // Check win
                        if (bricksRef.current.every(Brick => Brick.status === 0)) {
                            setGameActive(false);
                            setGameOver(true);
                            setMessage("🎉 You Win!");
                            const finalScore = score + 10 + (lives * 100);
                            GameService.submitScore('brickbreaker', finalScore).then((user) => setLastUpdatedUser(user));
                            if (finalScore > localHighScore) setLocalHighScore(finalScore);
                        }
                    }
                }
            });

            // Floor Collision (Life Loss)
            if (ball.y + ball.radius > height) {
                if (lives > 1) {
                    setLives(l => l - 1);
                    resetBall();
                } else {
                    setLives(0);
                    setGameActive(false);
                    setGameOver(true);
                    setMessage("Game Over");
                    GameService.submitScore('brickbreaker', score).then((user) => setLastUpdatedUser(user));
                    if (score > localHighScore) setLocalHighScore(score);
                }
            }
        };

        const draw = () => {
            // Clear
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, width, height);

            // Bricks
            bricksRef.current.forEach(b => {
                if (b.status === 1) {
                    ctx.fillStyle = b.color;
                    ctx.fillRect(b.x, b.y, b.width, b.height);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(b.x, b.y, b.width, b.height);
                }
            });

            // Paddle
            ctx.fillStyle = '#00bcd4';
            ctx.fillRect(paddleRef.current.x, height - 30, paddleRef.current.width, paddleRef.current.height);

            // Ball
            ctx.beginPath();
            ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.closePath();

            // Score & Lives
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText(`Score: ${score}`, 20, 30);
            ctx.fillText(`Lives: ${lives}`, width - 100, 30);

            if (!gameActive) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = '#fff';
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(message, width / 2, height / 2);
                if (gameOver) {
                    ctx.font = '24px Arial';
                    ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 50);
                }
                ctx.textAlign = 'start';
            }
        };

        const loop = () => {
            update();
            draw();
            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [gameActive, gameOver, score, lives, message, localHighScore]);

    // Initial bricks
    useEffect(() => initBricks(), []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#000', padding: '20px', position: 'relative' }}>
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
            <h1 style={{ color: 'white', margin: '0 0 10px 0' }}>🧱 Brick Breaker</h1>
            <div style={{ color: 'white', marginBottom: '10px' }}>🏆 Best: {localHighScore}</div>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: '2px solid #333', borderRadius: '8px', maxWidth: '100%' }}
            />
            <div style={{ color: '#888', marginTop: '10px' }}>Use Left/Right Arrows to move, Space to Launch</div>
            {/* Removed Bottom Menu Button */}

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.85)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '200px', zIndex: 1000
                }}>
                    <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>{message}</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Score: {score}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Play Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '10px 20px', fontSize: '1rem', background: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrickBreaker;
