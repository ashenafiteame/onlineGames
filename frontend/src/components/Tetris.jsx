import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameService } from '../services/GameService';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// Tetromino shapes and colors
const TETROMINOES = {
    I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
    O: { shape: [[1, 1], [1, 1]], color: '#f0f000' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' }
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

const createEmptyBoard = () =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

const getRandomTetromino = () => {
    const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    return { type: key, ...TETROMINOES[key] };
};

const Tetris = ({ onFinish, highScore }) => {
    const [board, setBoard] = useState(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState(null);
    const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
    const [nextPiece, setNextPiece] = useState(null);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    const gameLoopRef = useRef(null);
    const lastDropRef = useRef(Date.now());

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const spawnPiece = useCallback(() => {
        const piece = nextPiece || getRandomTetromino();
        const next = getRandomTetromino();
        const startX = Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2);

        // Check if spawn position is blocked (game over)
        if (checkCollision(board, piece.shape, { x: startX, y: 0 })) {
            setGameOver(true);
            GameService.submitScore('tetris', score).then(user => setLastUpdatedUser(user));
            if (score > localHighScore) setLocalHighScore(score);
            return;
        }

        setCurrentPiece(piece);
        setCurrentPosition({ x: startX, y: 0 });
        setNextPiece(next);
    }, [board, nextPiece, score, localHighScore]);

    const checkCollision = (board, shape, position) => {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = position.x + x;
                    const newY = position.y + y;

                    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                        return true;
                    }
                    if (newY >= 0 && board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const rotatePiece = (shape) => {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = shape[y][x];
            }
        }
        return rotated;
    };

    const lockPiece = useCallback(() => {
        if (!currentPiece) return;

        const newBoard = board.map(row => [...row]);

        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    const boardY = currentPosition.y + y;
                    const boardX = currentPosition.x + x;
                    if (boardY >= 0) {
                        newBoard[boardY][boardX] = currentPiece.color;
                    }
                }
            }
        }

        // Check for completed lines
        let linesCleared = 0;
        const filteredBoard = newBoard.filter(row => {
            if (row.every(cell => cell !== null)) {
                linesCleared++;
                return false;
            }
            return true;
        });

        // Add empty rows at the top
        while (filteredBoard.length < BOARD_HEIGHT) {
            filteredBoard.unshift(Array(BOARD_WIDTH).fill(null));
        }

        // Update score based on lines cleared
        const lineScores = [0, 100, 300, 500, 800];
        const newScore = score + (lineScores[linesCleared] || 0) * level;
        const newLines = lines + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;

        setBoard(filteredBoard);
        setScore(newScore);
        setLines(newLines);
        setLevel(newLevel);
        setCurrentPiece(null);

        if (newScore > localHighScore) setLocalHighScore(newScore);
    }, [board, currentPiece, currentPosition, score, lines, level, localHighScore]);

    const moveDown = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;

        const newPosition = { ...currentPosition, y: currentPosition.y + 1 };

        if (checkCollision(board, currentPiece.shape, newPosition)) {
            lockPiece();
        } else {
            setCurrentPosition(newPosition);
        }
    }, [currentPiece, currentPosition, board, gameOver, isPaused, lockPiece]);

    const moveHorizontal = useCallback((direction) => {
        if (!currentPiece || gameOver || isPaused) return;

        const newPosition = { ...currentPosition, x: currentPosition.x + direction };

        if (!checkCollision(board, currentPiece.shape, newPosition)) {
            setCurrentPosition(newPosition);
        }
    }, [currentPiece, currentPosition, board, gameOver, isPaused]);

    const rotate = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;

        const rotated = rotatePiece(currentPiece.shape);

        // Try normal rotation
        if (!checkCollision(board, rotated, currentPosition)) {
            setCurrentPiece({ ...currentPiece, shape: rotated });
            return;
        }

        // Wall kick attempts
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            const kickedPosition = { ...currentPosition, x: currentPosition.x + kick };
            if (!checkCollision(board, rotated, kickedPosition)) {
                setCurrentPiece({ ...currentPiece, shape: rotated });
                setCurrentPosition(kickedPosition);
                return;
            }
        }
    }, [currentPiece, currentPosition, board, gameOver, isPaused]);

    const hardDrop = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;

        let newY = currentPosition.y;
        while (!checkCollision(board, currentPiece.shape, { ...currentPosition, y: newY + 1 })) {
            newY++;
        }
        setCurrentPosition({ ...currentPosition, y: newY });
        // Lock immediately after hard drop
        setTimeout(() => lockPiece(), 0);
    }, [currentPiece, currentPosition, board, gameOver, isPaused, lockPiece]);

    const handleKeyDown = useCallback((e) => {
        if (gameOver) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                moveHorizontal(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveHorizontal(1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveDown();
                break;
            case 'ArrowUp':
                e.preventDefault();
                rotate();
                break;
            case ' ':
                e.preventDefault();
                hardDrop();
                break;
            case 'p':
            case 'P':
                setIsPaused(prev => !prev);
                break;
            default:
                break;
        }
    }, [gameOver, moveHorizontal, moveDown, rotate, hardDrop]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Game loop
    useEffect(() => {
        if (gameOver || isPaused) return;

        const dropInterval = Math.max(100, 1000 - (level - 1) * 100);

        gameLoopRef.current = setInterval(() => {
            const now = Date.now();
            if (now - lastDropRef.current >= dropInterval) {
                moveDown();
                lastDropRef.current = now;
            }
        }, 50);

        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [gameOver, isPaused, level, moveDown]);

    // Spawn piece when current piece is locked
    useEffect(() => {
        if (!currentPiece && !gameOver) {
            spawnPiece();
        }
    }, [currentPiece, gameOver, spawnPiece]);

    const initGame = () => {
        setBoard(createEmptyBoard());
        setCurrentPiece(null);
        setNextPiece(null);
        setScore(0);
        setLines(0);
        setLevel(1);
        setGameOver(false);
        setIsPaused(false);
        setLastUpdatedUser(null);
    };

    // Render the board with current piece
    const renderBoard = () => {
        const displayBoard = board.map(row => [...row]);

        // Add current piece to display
        if (currentPiece) {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const boardY = currentPosition.y + y;
                        const boardX = currentPosition.x + x;
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                            displayBoard[boardY][boardX] = currentPiece.color;
                        }
                    }
                }
            }
        }

        return displayBoard;
    };

    const renderNextPiece = () => {
        if (!nextPiece) return null;

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 20px)`,
                gap: '2px'
            }}>
                {nextPiece.shape.map((row, y) =>
                    row.map((cell, x) => (
                        <div
                            key={`${y}-${x}`}
                            style={{
                                width: '20px',
                                height: '20px',
                                background: cell ? nextPiece.color : 'transparent',
                                borderRadius: '2px'
                            }}
                        />
                    ))
                )}
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
            position: 'relative',
            padding: '20px'
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
            <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                TETRIS
            </h1>

            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                {/* Game Board */}
                <div style={{
                    background: '#0f0f23',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
                        gap: '1px',
                        background: '#1a1a2e'
                    }}>
                        {renderBoard().map((row, y) =>
                            row.map((cell, x) => (
                                <div
                                    key={`${y}-${x}`}
                                    style={{
                                        width: CELL_SIZE,
                                        height: CELL_SIZE,
                                        background: cell || '#2a2a4a',
                                        borderRadius: '3px',
                                        boxShadow: cell ? 'inset 2px 2px 4px rgba(255,255,255,0.2)' : 'none'
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Side Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Next Piece */}
                    <div style={{
                        background: '#0f0f23',
                        padding: '15px',
                        borderRadius: '8px',
                        minWidth: '120px'
                    }}>
                        <div style={{ fontSize: '14px', marginBottom: '10px', opacity: 0.7 }}>NEXT</div>
                        <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderNextPiece()}
                        </div>
                    </div>

                    {/* Score */}
                    <div style={{ background: '#0f0f23', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>SCORE</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}</div>
                    </div>

                    {/* High Score */}
                    <div style={{ background: '#0f0f23', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>BEST</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.max(score, localHighScore)}</div>
                    </div>

                    {/* Level & Lines */}
                    <div style={{ background: '#0f0f23', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '14px', opacity: 0.7 }}>LEVEL</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{level}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', opacity: 0.7 }}>LINES</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{lines}</div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div style={{ background: '#0f0f23', padding: '15px', borderRadius: '8px', fontSize: '12px', opacity: 0.7 }}>
                        <div>← → Move</div>
                        <div>↑ Rotate</div>
                        <div>↓ Soft Drop</div>
                        <div>Space Hard Drop</div>
                        <div>P Pause</div>
                    </div>

                    {/* Removed Bottom Buttons */}
                </div>
            </div>

            {/* Game Over / Pause Overlay */}
            {isPaused && !gameOver && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <h2 style={{ fontSize: '48px', marginBottom: '20px' }}>PAUSED</h2>
                    <button
                        onClick={() => setIsPaused(false)}
                        style={{
                            background: '#4CAF50', color: 'white', border: 'none',
                            padding: '15px 30px', borderRadius: '5px', fontSize: '20px',
                            fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px'
                        }}
                    >
                        Resume
                    </button>
                    <button
                        onClick={() => onFinish(null)}
                        style={{
                            background: '#666', color: 'white', border: 'none',
                            padding: '15px 30px', borderRadius: '5px', fontSize: '20px', cursor: 'pointer'
                        }}
                    >
                        Menu
                    </button>
                </div>
            )}

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>GAME OVER! 🧱</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0', color: 'white' }}>Score: {score}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={initGame} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>Play Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tetris;
