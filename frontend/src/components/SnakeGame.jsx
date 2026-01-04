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

    // Update local high score if prop changes (e.g. on mount)
    useEffect(() => {
        setDisplayHighScore(highScore);
    }, [highScore]);

    useEffect(() => {
        const handleKeyDown = (e) => {
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
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);

        // Food
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(foodPos.x * TILE_SIZE, foodPos.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);

        // Snake
        ctx.fillStyle = '#42d392';
        snakeArr.forEach(part => {
            ctx.fillRect(part.x * TILE_SIZE, part.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
        });
    };

    // Initial Draw
    useEffect(() => {
        if (canvasRef.current) draw(snake, food);
    }, []);

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
            <h2>🐍 Snake</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Use <strong>Arrow Keys</strong> to move. Eat food (red) to grow. Avoid walls and your tail!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '0.5rem' }}>
                <p>Score: {score}</p>
                <p style={{ color: '#ffd700' }}>High Score: {displayHighScore}</p>
            </div>
            {!gameStarted && <p>Press any Arrow Key to Start</p>}
            <canvas
                ref={canvasRef}
                width={GRID_SIZE * TILE_SIZE}
                height={GRID_SIZE * TILE_SIZE}
                style={{ border: '2px solid #555', background: '#222', borderRadius: '4px' }}
            />
            {/* Removed redundant bottom Back button */}

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>GAME OVER! 🐍</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0', color: 'white' }}>Score: {score}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={handleRestart} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>Try Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
}
