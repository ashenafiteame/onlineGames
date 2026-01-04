import React, { useEffect, useRef, useState } from 'react';
import { GameService } from '../services/GameService';

const ROAD_WIDTH = 300;
const BIKE_WIDTH = 40;
const BIKE_HEIGHT = 60;
const CANVAS_WIDTH = 400; // Wider than road to show grass
const CANVAS_HEIGHT = 500;

export default function MotoRacer({ onFinish, highScore }) {
    const canvasRef = useRef(null);
    const [playerX, setPlayerX] = useState(CANVAS_WIDTH / 2); // Center of canvas
    const [velocity, setVelocity] = useState(0);
    const [obstacles, setObstacles] = useState([]);
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(8); // Faster than cars
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    const scoreRef = useRef(0);
    scoreRef.current = score;

    const obstaclesRef = useRef([]);
    obstaclesRef.current = obstacles;

    // Smooth movement loop
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) setGameStarted(true);
            if (e.key === 'ArrowLeft') setVelocity(-5);
            if (e.key === 'ArrowRight') setVelocity(5);
        };
        const handleKeyUp = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setVelocity(0);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameStarted]);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const gameLoop = setInterval(() => {
            // Move Player
            setPlayerX(prev => {
                let next = prev + velocity;
                // Road boundaries (allow slightly off road but slow down?)
                // Hard boundaries for now
                const ROAD_LEFT = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
                const ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH;

                if (next < ROAD_LEFT) next = ROAD_LEFT;
                if (next > ROAD_RIGHT - BIKE_WIDTH) next = ROAD_RIGHT - BIKE_WIDTH;
                return next;
            });

            // Spawn Obstacles (Rocks, Puddles)
            if (Math.random() < 0.08) {
                const ROAD_LEFT = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
                const spawnX = ROAD_LEFT + Math.random() * (ROAD_WIDTH - 40);
                const type = Math.random() > 0.5 ? 'rock' : 'puddle';
                setObstacles(prev => [...prev, { x: spawnX, y: -50, type }]);
            }

            // Move Obstacles
            setObstacles(prev => {
                const next = prev.map(o => ({ ...o, y: o.y + speed })).filter(o => o.y < CANVAS_HEIGHT + 50);

                // Collision Detection
                for (let obs of next) {
                    // Simple AABB
                    const pX = playerX; // State variable might be stale in loop if not careful, but setPlayerX update uses prev. 
                    // Wait, we need current playerX here.
                    // Using ref for playerX or checking inside setPlayerX? 
                    // Let's use a ref for playerX to be safe inside interval

                    // Actually, simpler: check collision in render or separate effect? No, update loop is best.
                    // We need access to latest playerX.
                }
                return next;
            });

            setScore(prev => prev + 1);
            // Speed up
            if (scoreRef.current % 1000 === 0) setSpeed(prev => prev + 1);

        }, 20); // 50fps

        return () => clearInterval(gameLoop);
    }, [gameStarted, gameOver, velocity, speed]); // playerX dependency missing? If we add it, loop restarts.

    // Use a ref for playerX for collision detection
    const playerXRef = useRef(playerX);
    playerXRef.current = playerX;

    useEffect(() => {
        if (!gameStarted || gameOver) return;
        // Separate collision check to access latest refs
        const checkCollision = setInterval(() => {
            const px = playerXRef.current;
            const py = CANVAS_HEIGHT - BIKE_HEIGHT - 20;

            obstaclesRef.current.forEach(obs => {
                if (
                    px < obs.x + 30 &&
                    px + BIKE_WIDTH > obs.x &&
                    py < obs.y + 30 &&
                    py + BIKE_HEIGHT > obs.y
                ) {
                    endGame();
                }
            });
        }, 50);
        return () => clearInterval(checkCollision);
    }, [gameStarted, gameOver]);


    const endGame = () => {
        setGameOver(true);
        const finalScore = Math.floor(scoreRef.current / 5);
        GameService.submitScore('moto-racer', finalScore).then((user) => {
            setLastUpdatedUser(user);
        });
    };

    const handleRestart = () => {
        setScore(0);
        scoreRef.current = 0;
        setGameOver(false);
        setGameStarted(false);
        setObstacles([]);
        setPlayerX(CANVAS_WIDTH / 2 - 20); // BIKE_WIDTH / 2 roughly
        setVelocity(0);
        setSpeed(8);
        setLastUpdatedUser(null);
    };

    // Rendering
    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');

        // Grass
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Road
        const ROAD_LEFT = (CANVAS_WIDTH - ROAD_WIDTH) / 2;
        ctx.fillStyle = '#555';
        ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);

        // Lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.setLineDash([40, 40]);
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, - (score % 80)); // Animate lines
        ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
        ctx.stroke();

        // Draw Player Bike
        const px = playerX;
        const py = CANVAS_HEIGHT - BIKE_HEIGHT - 20;

        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // Rotate bike slightly based on velocity?
        ctx.save();
        ctx.translate(px + BIKE_WIDTH / 2, py + BIKE_HEIGHT / 2);
        ctx.rotate(velocity * 0.05);
        ctx.fillText('🏍️', 0, -BIKE_HEIGHT / 2);
        ctx.restore();

        // Obstacles
        obstacles.forEach(obs => {
            ctx.font = '40px Arial';
            ctx.fillText(obs.type === 'rock' ? '🪨' : '💧', obs.x + 15, obs.y);
        });

    }, [playerX, obstacles, score, velocity]);


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
            <h2>🏍️ Moto Racer</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Use <strong>Left/Right Arrows</strong> to steer. Dodge rocks and puddles!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '0.5rem' }}>
                <p>Score: {Math.floor(score / 5)}</p>
                <p style={{ color: '#ffd700' }}>Best: {highScore}</p>
            </div>
            {!gameStarted && !gameOver && <p>Press Arrow Keys to Start Engine</p>}
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{ border: '4px solid #333', borderRadius: '4px' }}
            />

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.85)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '200px', zIndex: 1000
                }}>
                    <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>WIPEOUT!</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Score: {Math.floor(score / 5)}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={handleRestart} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Try Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '10px 20px', fontSize: '1rem', background: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
}
