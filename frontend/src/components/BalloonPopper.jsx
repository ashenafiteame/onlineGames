import React, { useEffect, useState, useRef } from 'react';
import { GameService } from '../services/GameService';

export default function BalloonPopper({ onFinish, highScore }) {
    const [balloons, setBalloons] = useState([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameOver, setGameOver] = useState(false);
    const [restartKey, setRestartKey] = useState(0);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);
    const containerRef = useRef(null);
    const gameLoopRef = useRef(null);

    useEffect(() => {
        // Game Timer
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Initial Spawn
        spawnBalloon();

        // Game Loop for spawning and moving
        gameLoopRef.current = setInterval(() => {
            if (Math.random() > 0.7) spawnBalloon();
            moveBalloons();
        }, 100);

        return () => {
            clearInterval(timer);
            clearInterval(gameLoopRef.current);
        };
    }, [restartKey]);

    // We need a ref to access latest state inside interval
    const balloonsRef = useRef([]);
    balloonsRef.current = balloons;

    const scoreRef = useRef(0);
    scoreRef.current = score;

    const spawnBalloon = () => {
        const id = Date.now() + Math.random();
        const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        const left = Math.random() * 90; // Percentage
        const newBalloon = { id, x: left, y: 100, color, speed: 2 + Math.random() * 3 };

        setBalloons(prev => [...prev, newBalloon]);
    };

    const moveBalloons = () => {
        setBalloons(prev => prev.map(b => ({ ...b, y: b.y - b.speed }))
            .filter(b => b.y > -20)); // Remove if off screen
    };

    const popBalloon = (id) => {
        if (gameOver) return;
        setBalloons(prev => prev.filter(b => b.id !== id));
        setScore(prev => prev + 10);
    };

    const endGame = () => {
        setGameOver(true);
        clearInterval(gameLoopRef.current);
        const finalScore = scoreRef.current;

        GameService.submitScore('balloon', finalScore).then((user) => {
            setLastUpdatedUser(user);
        });
    };

    const handleRestart = () => {
        setScore(0);
        scoreRef.current = 0;
        setTimeLeft(30);
        setBalloons([]);
        setGameOver(false);
        setLastUpdatedUser(null);
        setRestartKey(prev => prev + 1);
    };

    return (
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
            <button
                onClick={() => onFinish(null)}
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '-40px',
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
            <h2>🎈 Balloon Popper</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Click balloons to pop them before time runs out!
            </p>
            <div style={{ position: 'relative', height: '500px', width: '100%', overflow: 'hidden', border: '2px solid #555', borderRadius: '8px', background: 'linear-gradient(to bottom, #87CEEB, #E0F7FA)' }}>
                <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', zIndex: 10, color: '#000', fontWeight: 'bold' }}>
                    <span>Score: {score}</span>
                    <span>Time: {timeLeft}s</span>
                </div>

                {balloons.map(balloon => (
                    <div
                        key={balloon.id}
                        onClick={() => popBalloon(balloon.id)}
                        style={{
                            position: 'absolute',
                            left: `${balloon.x}%`,
                            top: `${balloon.y}%`,
                            width: '40px',
                            height: '50px',
                            backgroundColor: balloon.color,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.2)'
                        }}
                    >
                        {/* String */}
                        <div style={{ position: 'absolute', bottom: -10, left: 19, width: 2, height: 10, background: '#000' }}></div>
                    </div>
                ))}

                {gameOver && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(0,0,0,0.85)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                        textAlign: 'center', minWidth: '200px', zIndex: 1000
                    }}>
                        <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>Time's Up!</h2>
                        <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Score: {score}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={handleRestart} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Play Again</button>
                            <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '10px 20px', fontSize: '1rem', background: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Back to Library</button>
                        </div>
                    </div>
                )}
            </div>
            {/* Removed bottom button */}
        </div>
    );
}
