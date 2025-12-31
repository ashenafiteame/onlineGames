import React, { useEffect, useState, useRef } from 'react';
import { GameService } from '../services/GameService';

export default function BalloonPopper({ onFinish, highScore }) {
    const [balloons, setBalloons] = useState([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameOver, setGameOver] = useState(false);
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
    }, []); // Run once on mount

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
            alert(`Time's up! Score: ${finalScore}`);
            onFinish(user);
        });
    };

    return (
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2>🎈 Balloon Popper</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Click balloons to pop them before time runs out!
            </p>
            <div style={{ position: 'relative', height: '500px', overflow: 'hidden', border: '2px solid #555', borderRadius: '8px', background: 'linear-gradient(to bottom, #87CEEB, #E0F7FA)' }}>
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

                {gameOver && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem' }}>
                    Game Over!
                </div>}
            </div>
            <button onClick={() => onFinish(null)} style={{ marginTop: '20px', background: '#555' }}>Back</button>
        </div>
    );
}
