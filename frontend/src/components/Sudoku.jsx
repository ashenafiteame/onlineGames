import React, { useState, useEffect, useCallback } from 'react';
import { GameService } from '../services/GameService';

// Sudoku puzzle generator and solver
const generateEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill(0));

const isValidPlacement = (grid, row, col, num) => {
    // Check row
    for (let c = 0; c < 9; c++) {
        if (grid[row][c] === num) return false;
    }
    // Check column
    for (let r = 0; r < 9; r++) {
        if (grid[r][col] === num) return false;
    }
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (grid[r][c] === num) return false;
        }
    }
    return true;
};

const solveSudoku = (grid) => {
    const gridCopy = grid.map(row => [...row]);
    const solve = (g) => {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (g[r][c] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValidPlacement(g, r, c, num)) {
                            g[r][c] = num;
                            if (solve(g)) return true;
                            g[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    };
    solve(gridCopy);
    return gridCopy;
};

const generatePuzzle = (difficulty) => {
    // Generate a solved grid first
    const grid = generateEmptyGrid();
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Fill diagonal boxes first (they're independent)
    for (let box = 0; box < 9; box += 3) {
        const shuffled = [...numbers].sort(() => Math.random() - 0.5);
        let idx = 0;
        for (let r = box; r < box + 3; r++) {
            for (let c = box; c < box + 3; c++) {
                grid[r][c] = shuffled[idx++];
            }
        }
    }

    // Solve the rest
    const solved = solveSudoku(grid);

    // Remove cells based on difficulty
    const cellsToRemove = { easy: 35, medium: 45, hard: 55 }[difficulty] || 40;
    const puzzle = solved.map(row => [...row]);

    let removed = 0;
    while (removed < cellsToRemove) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            removed++;
        }
    }

    return { puzzle, solution: solved };
};

const Sudoku = ({ onFinish, highScore }) => {
    const [difficulty, setDifficulty] = useState('medium');
    const [grid, setGrid] = useState(generateEmptyGrid());
    const [solution, setSolution] = useState(generateEmptyGrid());
    const [initial, setInitial] = useState(generateEmptyGrid());
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState(Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set())));
    const [notesMode, setNotesMode] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [mistakes, setMistakes] = useState(0);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const startNewGame = useCallback((diff) => {
        const { puzzle, solution: sol } = generatePuzzle(diff);
        setGrid(puzzle.map(row => [...row]));
        setSolution(sol);
        setInitial(puzzle.map(row => [...row]));
        setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set())));
        setSelected(null);
        setTimer(0);
        setIsRunning(true);
        setGameWon(false);
        setMistakes(0);
        setLastUpdatedUser(null);
    }, []);

    useEffect(() => {
        startNewGame(difficulty);
    }, []);

    useEffect(() => {
        let interval;
        if (isRunning && !gameWon) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, gameWon]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selected || gameWon) return;

            // Number keys 1-9
            if (e.key >= '1' && e.key <= '9') {
                handleNumberInput(parseInt(e.key));
            }
            // Backspace or Delete to clear
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                handleNumberInput(0);
            }
            // Arrow keys to navigate
            else if (e.key === 'ArrowUp' && selected.row > 0) {
                setSelected({ ...selected, row: selected.row - 1 });
            }
            else if (e.key === 'ArrowDown' && selected.row < 8) {
                setSelected({ ...selected, row: selected.row + 1 });
            }
            else if (e.key === 'ArrowLeft' && selected.col > 0) {
                setSelected({ ...selected, col: selected.col - 1 });
            }
            else if (e.key === 'ArrowRight' && selected.col < 8) {
                setSelected({ ...selected, col: selected.col + 1 });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selected, gameWon, notesMode, grid, notes, solution, initial]);

    const checkWin = (g) => {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (g[r][c] === 0 || g[r][c] !== solution[r][c]) return false;
            }
        }
        return true;
    };

    const handleCellClick = (row, col) => {
        if (initial[row][col] !== 0) return; // Can't select pre-filled cells
        setSelected({ row, col });
    };

    const handleNumberInput = (num) => {
        if (!selected || initial[selected.row][selected.col] !== 0) return;

        const { row, col } = selected;

        if (notesMode) {
            const newNotes = notes.map(r => r.map(c => new Set(c)));
            if (num === 0) {
                newNotes[row][col].clear();
            } else if (newNotes[row][col].has(num)) {
                newNotes[row][col].delete(num);
            } else {
                newNotes[row][col].add(num);
            }
            setNotes(newNotes);
        } else {
            const newGrid = grid.map(r => [...r]);
            newGrid[row][col] = num;
            setGrid(newGrid);

            // Clear notes for this cell
            const newNotes = notes.map(r => r.map(c => new Set(c)));
            newNotes[row][col].clear();
            setNotes(newNotes);

            if (num !== 0 && num !== solution[row][col]) {
                setMistakes(m => m + 1);
            }

            if (checkWin(newGrid)) {
                setGameWon(true);
                setIsRunning(false);
                // Calculate score based on difficulty and time
                const baseScore = { easy: 100, medium: 200, hard: 300 }[difficulty];
                const timeBonus = Math.max(0, 300 - timer);
                const mistakePenalty = mistakes * 10;
                const finalScore = Math.max(10, baseScore + timeBonus - mistakePenalty);

                GameService.submitScore('sudoku', finalScore).then((user) => setLastUpdatedUser(user));
                if (finalScore > localHighScore) setLocalHighScore(finalScore);
            }
        }
    };

    const handleHint = () => {
        if (!selected || gameWon) return;
        const { row, col } = selected;
        if (initial[row][col] !== 0) return;

        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = solution[row][col];
        setGrid(newGrid);

        if (checkWin(newGrid)) {
            setGameWon(true);
            setIsRunning(false);
            const score = 50; // Minimal score for hint usage
            GameService.submitScore('sudoku', score);
        }
    };

    const getConflicts = (row, col, val) => {
        if (val === 0) return false;
        // Check if this value conflicts with row, column, or box
        for (let c = 0; c < 9; c++) {
            if (c !== col && grid[row][c] === val) return true;
        }
        for (let r = 0; r < 9; r++) {
            if (r !== row && grid[r][col] === val) return true;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && grid[r][c] === val) return true;
            }
        }
        return false;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '20px',
            position: 'relative',
            borderRadius: '8px'
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
            <h1 style={{ fontSize: '42px', margin: '0 0 15px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                🔢 Sudoku
            </h1>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <select
                    value={difficulty}
                    onChange={(e) => { setDifficulty(e.target.value); startNewGame(e.target.value); }}
                    style={{ padding: '8px 15px', borderRadius: '6px', background: '#333', color: 'white', border: '1px solid #555' }}
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <button
                    onClick={() => startNewGame(difficulty)}
                    style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                    New Game
                </button>
                <button
                    onClick={() => setNotesMode(!notesMode)}
                    style={{
                        background: notesMode ? '#ff9800' : '#555',
                        color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer'
                    }}
                >
                    ✏️ Notes {notesMode ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={handleHint}
                    disabled={!selected || gameWon}
                    style={{
                        background: selected && !gameWon ? '#2196F3' : '#444',
                        color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px',
                        cursor: selected && !gameWon ? 'pointer' : 'not-allowed',
                        opacity: selected && !gameWon ? 1 : 0.5
                    }}
                >
                    💡 Hint
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '15px' }}>
                <div>⏱️ {formatTime(timer)}</div>
                <div>❌ Mistakes: {mistakes}</div>
                <div>🏆 Best: {localHighScore}</div>
            </div>

            {/* Game Won */}
            {gameWon && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: '#4CAF50', marginTop: 0 }}>Puzzle Solved!</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Score: {Math.max(10, { easy: 100, medium: 200, hard: 300 }[difficulty] + Math.max(0, 300 - timer) - mistakes * 10)}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={() => startNewGame(difficulty)} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>New Game</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(9, 50px)',
                gap: '2px',
                background: '#333',
                padding: '4px',
                borderRadius: '8px'
            }}>
                {grid.map((row, r) => (
                    row.map((cell, c) => {
                        const isSelected = selected?.row === r && selected?.col === c;
                        const isInitial = initial[r][c] !== 0;
                        const hasConflict = cell !== 0 && getConflicts(r, c, cell);
                        const isHighlighted = selected && (selected.row === r || selected.col === c ||
                            (Math.floor(selected.row / 3) === Math.floor(r / 3) && Math.floor(selected.col / 3) === Math.floor(c / 3)));
                        const cellNotes = notes[r][c];

                        return (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isSelected ? '#4a90d9' :
                                        hasConflict ? '#ff5252' :
                                            isHighlighted ? '#2a3f5f' : '#1a1a2e',
                                    color: isInitial ? '#fff' : '#7eb8ff',
                                    fontSize: cell !== 0 ? '24px' : '10px',
                                    fontWeight: isInitial ? 'bold' : 'normal',
                                    cursor: isInitial ? 'default' : 'pointer',
                                    borderRight: (c + 1) % 3 === 0 && c < 8 ? '3px solid #555' : '1px solid #333',
                                    borderBottom: (r + 1) % 3 === 0 && r < 8 ? '3px solid #555' : '1px solid #333',
                                    transition: 'background 0.15s'
                                }}
                            >
                                {cell !== 0 ? cell : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '1px',
                                        fontSize: '9px',
                                        color: '#888'
                                    }}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                            <span key={n} style={{ opacity: cellNotes.has(n) ? 1 : 0 }}>{n}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ))}
            </div>

            {/* Number Pad */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleNumberInput(num)}
                        style={{
                            width: '50px',
                            height: '50px',
                            fontSize: '24px',
                            background: '#2a3f5f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={() => handleNumberInput(0)}
                    style={{
                        width: '50px',
                        height: '50px',
                        fontSize: '20px',
                        background: '#555',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Menu Button */}
            {/* Removed Bottom Menu Button */}
        </div>
    );
};

export default Sudoku;
