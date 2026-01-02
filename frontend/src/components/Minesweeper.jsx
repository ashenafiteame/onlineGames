import React, { useState, useEffect, useCallback } from 'react';
import { GameService } from '../services/GameService';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

const Minesweeper = ({ onFinish, highScore }) => {
    const [board, setBoard] = useState([]);
    const [revealed, setRevealed] = useState([]);
    const [flagged, setFlagged] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [timer, setTimer] = useState(0);
    const [started, setStarted] = useState(false);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const initBoard = useCallback(() => {
        const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        let placed = 0;
        while (placed < MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (newBoard[r][c] !== -1) {
                newBoard[r][c] = -1;
                placed++;
            }
        }
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (newBoard[r][c] === -1) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc] === -1) count++;
                    }
                }
                newBoard[r][c] = count;
            }
        }
        setBoard(newBoard);
        setRevealed(Array(ROWS).fill(null).map(() => Array(COLS).fill(false)));
        setFlagged(Array(ROWS).fill(null).map(() => Array(COLS).fill(false)));
        setGameOver(false);
        setWon(false);
        setTimer(0);
        setStarted(false);
    }, []);

    useEffect(() => { initBoard(); }, [initBoard]);

    useEffect(() => {
        if (!started || gameOver || won) return;
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [started, gameOver, won]);

    const revealCell = (r, c, rev = revealed) => {
        if (rev[r][c] || flagged[r][c]) return rev;
        const newRev = rev.map(row => [...row]);
        newRev[r][c] = true;
        if (board[r][c] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        revealCell(nr, nc, newRev);
                    }
                }
            }
        }
        return newRev;
    };

    const handleClick = (r, c) => {
        if (gameOver || won || flagged[r][c]) return;
        if (!started) setStarted(true);
        if (board[r][c] === -1) {
            setGameOver(true);
            setRevealed(Array(ROWS).fill(null).map(() => Array(COLS).fill(true)));
        } else {
            const newRev = revealCell(r, c, revealed);
            setRevealed(newRev);
            checkWin(newRev);
        }
    };

    const handleRightClick = (e, r, c) => {
        e.preventDefault();
        if (gameOver || won || revealed[r][c]) return;
        const newFlagged = flagged.map(row => [...row]);
        newFlagged[r][c] = !newFlagged[r][c];
        setFlagged(newFlagged);
    };

    const checkWin = (rev) => {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] !== -1 && !rev[r][c]) return;
            }
        }
        setWon(true);
        const score = Math.max(10, 500 - timer * 2);
        GameService.submitScore('minesweeper', score);
        if (score > localHighScore) setLocalHighScore(score);
    };

    const getCellContent = (r, c) => {
        if (flagged[r][c]) return '🚩';
        if (!revealed[r][c]) return '';
        if (board[r][c] === -1) return '💣';
        if (board[r][c] === 0) return '';
        return board[r][c];
    };

    const colors = ['', '#0000FF', '#008000', '#FF0000', '#000080', '#800000', '#008080', '#000000', '#808080'];

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', padding: '20px'
        }}>
            <h1 style={{ fontSize: '42px', margin: '0 0 15px 0' }}>💣 Minesweeper</h1>
            <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', fontSize: '18px' }}>
                <div>⏱️ {timer}s</div>
                <div>🚩 {flagged.flat().filter(f => f).length}/{MINES}</div>
                <div>🏆 Best: {localHighScore}</div>
            </div>
            {(gameOver || won) && (
                <div style={{ marginBottom: '15px', fontSize: '24px', color: won ? '#4CAF50' : '#f44336' }}>
                    {won ? '🎉 You Win!' : '💥 Game Over!'}
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 35px)`, gap: '2px', background: '#333', padding: '4px', borderRadius: '8px' }}>
                {board.map((row, r) => row.map((cell, c) => (
                    <div key={`${r}-${c}`} onClick={() => handleClick(r, c)} onContextMenu={(e) => handleRightClick(e, r, c)}
                        style={{
                            width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: revealed[r][c] ? (cell === -1 ? '#f44336' : '#ddd') : '#888', fontSize: '16px', fontWeight: 'bold',
                            color: colors[cell] || '#000', cursor: 'pointer', borderRadius: '3px'
                        }}>{getCellContent(r, c)}</div>
                )))}
            </div>
            <button onClick={initBoard} style={{ marginTop: '20px', padding: '12px 30px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>New Game</button>
            <button onClick={() => onFinish(null)} style={{ marginTop: '15px', background: '#666', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>Menu</button>
        </div>
    );
};

export default Minesweeper;
