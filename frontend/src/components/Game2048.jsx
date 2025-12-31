import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../services/GameService';

const Game2048 = ({ onFinish, highScore }) => {
    const [grid, setGrid] = useState(Array(4).fill().map(() => Array(4).fill(0)));
    const [score, setScore] = useState(0);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    // For handling swipe gestures
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    const initializeGame = () => {
        let newGrid = Array(4).fill().map(() => Array(4).fill(0));
        addRandomTile(newGrid);
        addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
        setWon(false);
    };

    useEffect(() => {
        initializeGame();
    }, []);

    const addRandomTile = (currentGrid) => {
        const available = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentGrid[r][c] === 0) available.push({ r, c });
            }
        }

        if (available.length > 0) {
            const spot = available[Math.floor(Math.random() * available.length)];
            currentGrid[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
        }
    };

    const slide = (row) => {
        let arr = row.filter(val => val);
        let missing = 4 - arr.length;
        let zeros = Array(missing).fill(0);
        return arr.concat(zeros);
    };

    const combine = (row, currentScore) => {
        let newScore = currentScore;
        for (let i = 0; i < 3; i++) {
            if (row[i] !== 0 && row[i] === row[i + 1]) {
                row[i] = row[i] * 2;
                row[i + 1] = 0;
                newScore += row[i];
                if (row[i] === 2048 && !won) {
                    setWon(true);
                    GameService.submitScore('2048', newScore);
                    if (newScore > localHighScore) setLocalHighScore(newScore);
                }
            }
        }
        return { newRow: row, scoreAdded: newScore - currentScore };
    };

    const operate = (direction) => {
        if (gameOver) return;

        let oldGrid = JSON.stringify(grid);
        let newGrid = [...grid.map(row => [...row])];
        let scoreGain = 0;

        if (direction === 'left' || direction === 'right') {
            for (let i = 0; i < 4; i++) {
                let row = newGrid[i];
                if (direction === 'right') row.reverse();

                row = slide(row);
                let combined = combine(row, 0);
                scoreGain += combined.scoreAdded;
                row = combined.newRow;
                row = slide(row);

                if (direction === 'right') row.reverse();
                newGrid[i] = row;
            }
        } else if (direction === 'up' || direction === 'down') {
            for (let c = 0; c < 4; c++) {
                let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
                if (direction === 'down') col.reverse();

                col = slide(col);
                let combined = combine(col, 0);
                scoreGain += combined.scoreAdded;
                col = combined.newRow;
                col = slide(col);

                if (direction === 'down') col.reverse();

                for (let r = 0; r < 4; r++) {
                    newGrid[r][c] = col[r];
                }
            }
        }

        if (JSON.stringify(newGrid) !== oldGrid) {
            addRandomTile(newGrid);
            setGrid(newGrid);
            const newTotalScore = score + scoreGain;
            setScore(newTotalScore);
            checkGameOver(newGrid, newTotalScore);
        }
    };

    const checkGameOver = (currentGrid, currentScore) => {
        // Check for 2048 win is handled in combine, but visual handled by logic

        // Check for available moves
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentGrid[r][c] === 0) return;
                if (c < 3 && currentGrid[r][c] === currentGrid[r][c + 1]) return;
                if (r < 3 && currentGrid[r][c] === currentGrid[r + 1][c]) return;
            }
        }
        setGameOver(true);
        GameService.submitScore('2048', currentScore);
        if (currentScore > localHighScore) setLocalHighScore(currentScore);
    };

    const handleKeyDown = (e) => {
        e.preventDefault();
        if (gameOver) return;
        switch (e.key) {
            case 'ArrowLeft': operate('left'); break;
            case 'ArrowRight': operate('right'); break;
            case 'ArrowUp': operate('up'); break;
            case 'ArrowDown': operate('down'); break;
            default: break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const getTileColor = (value) => {
        const colors = {
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edcc61',
            512: '#edc850',
            1024: '#edc53f',
            2048: '#edc22e'
        };
        return colors[value] || '#3c3a32';
    };

    const getTextColor = (value) => {
        return value <= 4 ? '#776e65' : '#f9f6f2';
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#faf8ef', fontFamily: 'sans-serif', color: '#776e65'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '500px', marginBottom: '20px', alignItems: 'center' }}>
                <h1 style={{ fontSize: '60px', margin: 0, fontWeight: 'bold' }}>2048</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ background: '#bbada0', padding: '10px 20px', borderRadius: '5px', color: 'white', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>SCORE</div>
                        <div style={{ fontSize: '25px', fontWeight: 'bold' }}>{score}</div>
                    </div>
                    <div style={{ background: '#bbada0', padding: '10px 20px', borderRadius: '5px', color: 'white', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>BEST</div>
                        <div style={{ fontSize: '25px', fontWeight: 'bold' }}>{Math.max(score, localHighScore)}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '500px', marginBottom: '20px' }}>
                <p style={{ fontSize: '18px' }}>Join the numbers and get to the <strong>2048 tile!</strong></p>
                <button
                    onClick={initializeGame}
                    style={{ background: '#8f7a66', color: '#f9f6f2', border: 'none', borderRadius: '3px', padding: '10px 20px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    New Game
                </button>
            </div>

            <div style={{
                position: 'relative', background: '#bbada0', padding: '15px', borderRadius: '6px',
                width: '500px', height: '500px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px'
            }}>
                {grid.map((row, r) => row.map((val, c) => (
                    <div key={`${r}-${c}`} style={{
                        width: '100%', height: '100%', background: val === 0 ? 'rgba(238, 228, 218, 0.35)' : getTileColor(val),
                        borderRadius: '3px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: val < 100 ? '55px' : val < 1000 ? '45px' : '35px',
                        fontWeight: 'bold', color: val === 0 ? 'transparent' : getTextColor(val),
                        transition: 'all 100ms ease-in-out'
                    }}>
                        {val !== 0 ? val : ''}
                    </div>
                )))}

                {(gameOver || won) && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(238, 228, 218, 0.73)', display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center', borderRadius: '6px'
                    }}>
                        <h1 style={{ fontSize: '60px', fontWeight: 'bold', color: '#776e65', marginBottom: '20px' }}>
                            {won ? 'You Win!' : 'Game Over!'}
                        </h1>
                        <button
                            onClick={initializeGame}
                            style={{ background: '#8f7a66', color: '#f9f6f2', border: 'none', borderRadius: '3px', padding: '10px 20px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => onFinish({ score: score })} // Or just go back
                            style={{ background: '#776e65', color: '#f9f6f2', border: 'none', borderRadius: '3px', padding: '10px 20px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Menu
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Game2048;
