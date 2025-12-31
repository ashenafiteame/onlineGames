import React, { useEffect, useRef, useState } from 'react';
import { GameService } from '../services/GameService';

const LANE_WIDTH = 100;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 80;
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 500;

export default function LaneRacer({ onFinish, highScore }) {
    const canvasRef = useRef(null);
    const [playerLane, setPlayerLane] = useState(1); // 0, 1, 2
    const [obstacles, setObstacles] = useState([]);
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(5);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const scoreRef = useRef(0);
    scoreRef.current = score;

    const obstaclesRef = useRef([]);
    obstaclesRef.current = obstacles;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setGameStarted(true);
                return;
            }
            if (gameOver) return;
            if (e.key === 'ArrowLeft') setPlayerLane(prev => Math.max(0, prev - 1));
            if (e.key === 'ArrowRight') setPlayerLane(prev => Math.min(2, prev + 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameOver, gameStarted]);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const gameLoop = setInterval(() => {
            // Spawn Obstacles
            if (Math.random() < 0.05 * (speed / 3)) {
                const lane = Math.floor(Math.random() * 3);
                // Check existing obstacles near spawn area
                const recentObstacles = obstaclesRef.current.filter(o => o.y < 150);
                // Don't spawn on top of another
                const tooClose = recentObstacles.some(o => o.lane === lane);

                // Ensure we don't block all lanes. 
                // If there are already obstacles in other lanes at similar Y, checking count might be enough.
                const blockedLanes = new Set(recentObstacles.map(o => o.lane));

                if (!tooClose && blockedLanes.size < 2) {
                    // Only spawn if fewer than 2 lanes are currently blocked in this wave
                    setObstacles(prev => [...prev, { lane, y: -100, color: '#ff4444' }]);
                }
            }

            // Move Obstacles
            setObstacles(prev => {
                const next = prev.map(o => ({ ...o, y: o.y + speed })).filter(o => o.y < CANVAS_HEIGHT + 100);

                // Collision Detection
                const playerX = playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
                const playerY = CANVAS_HEIGHT - CAR_HEIGHT - 20;

                for (let obs of next) {
                    const obsX = obs.lane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
                    const obsY = obs.y;

                    if (
                        playerX < obsX + CAR_WIDTH &&
                        playerX + CAR_WIDTH > obsX &&
                        playerY < obsY + CAR_HEIGHT &&
                        playerY + CAR_HEIGHT > obsY
                    ) {
                        endGame();
                    }
                }
                return next;
            });

            // Score & Speed
            setScore(prev => prev + 1);
            if (scoreRef.current % 500 === 0) setSpeed(prev => prev + 1);

        }, 30);

        return () => clearInterval(gameLoop);
    }, [gameStarted, gameOver, playerLane, speed]);

    const endGame = () => {
        setGameOver(true);
        const finalScore = Math.floor(scoreRef.current / 10);
        GameService.submitScore('lane-racer', finalScore).then((user) => {
            alert(`CRASHED! Score: ${finalScore}`);
            onFinish(user);
        });
    };

    // Rendering
    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');

        // Road
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Lane Markers
        ctx.strokeStyle = '#fff';
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(LANE_WIDTH, 0);
        ctx.lineTo(LANE_WIDTH, CANVAS_HEIGHT);
        ctx.moveTo(LANE_WIDTH * 2, 0);
        ctx.lineTo(LANE_WIDTH * 2, CANVAS_HEIGHT);
        ctx.stroke();

        // Player Car
        const playerX = playerLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
        const playerY = CANVAS_HEIGHT - CAR_HEIGHT - 20;

        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('🏎️', playerX + CAR_WIDTH / 2, playerY);

        // Obstacles
        obstacles.forEach(obs => {
            const obsX = obs.lane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
            ctx.fillStyle = obs.color;
            ctx.fillText('🚗', obsX + CAR_WIDTH / 2, obs.y);
            // Debug Hitbox (Optional, commented out)
            // ctx.globalAlpha = 0.3;
            // ctx.fillRect(obsX, obs.y, CAR_WIDTH, CAR_HEIGHT);
            // ctx.globalAlpha = 1.0;
        });

    }, [playerLane, obstacles, score]);


    return (
        <div style={{ textAlign: 'center' }}>
            <h2>🏎️ Lane Racer</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Use <strong>Left/Right Arrows</strong> to switch lanes and dodge traffic.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '0.5rem' }}>
                <p>Score: {Math.floor(score / 10)}</p>
                <p style={{ color: '#ffd700' }}>Best: {highScore}</p>
            </div>
            {!gameStarted && <p>Press Left or Right Arrow to Start</p>}
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{ border: '4px solid #555', borderRadius: '4px' }}
            />
            <div>
                <button onClick={() => onFinish(null)} style={{ marginTop: '20px', background: '#555' }}>Back</button>
            </div>
        </div>
    );
}
