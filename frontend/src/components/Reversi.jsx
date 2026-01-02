import React, { useState, useCallback } from 'react';
import { GameService } from '../services/GameService';

const SIZE = 8;
const EMPTY = 0, BLACK = 1, WHITE = 2;

const Reversi = ({ onFinish, highScore }) => {
    const initBoard = useCallback(() => {
        const b = Array(SIZE).fill(null).map(() => Array(SIZE).fill(EMPTY));
        b[3][3] = WHITE; b[3][4] = BLACK;
        b[4][3] = BLACK; b[4][4] = WHITE;
        return b;
    }, []);

    const [board, setBoard] = useState(initBoard());
    const [currentPlayer, setCurrentPlayer] = useState(BLACK);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState('Your turn (Black)');
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);

    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    const getFlips = (b, r, c, player) => {
        if (b[r][c] !== EMPTY) return [];
        const opponent = player === BLACK ? WHITE : BLACK;
        let allFlips = [];
        for (const [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            const flips = [];
            while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === opponent) {
                flips.push([nr, nc]);
                nr += dr; nc += dc;
            }
            if (flips.length > 0 && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === player) {
                allFlips = [...allFlips, ...flips];
            }
        }
        return allFlips;
    };

    const getValidMoves = (b, player) => {
        const moves = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (getFlips(b, r, c, player).length > 0) moves.push([r, c]);
            }
        }
        return moves;
    };

    const countPieces = (b) => {
        let black = 0, white = 0;
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (b[r][c] === BLACK) black++;
                else if (b[r][c] === WHITE) white++;
            }
        }
        return { black, white };
    };

    const makeMove = (b, r, c, player) => {
        const flips = getFlips(b, r, c, player);
        if (flips.length === 0) return null;
        const newBoard = b.map(row => [...row]);
        newBoard[r][c] = player;
        for (const [fr, fc] of flips) newBoard[fr][fc] = player;
        return newBoard;
    };

    const checkGameEnd = (b) => {
        const blackMoves = getValidMoves(b, BLACK);
        const whiteMoves = getValidMoves(b, WHITE);
        return blackMoves.length === 0 && whiteMoves.length === 0;
    };

    const aiMove = useCallback((b) => {
        const moves = getValidMoves(b, WHITE);
        if (moves.length === 0) return null;
        // Simple AI: pick move with most flips
        let bestMove = moves[0], bestFlips = 0;
        for (const [r, c] of moves) {
            const flips = getFlips(b, r, c, WHITE).length;
            if (flips > bestFlips) { bestFlips = flips; bestMove = [r, c]; }
        }
        return bestMove;
    }, []);

    const handleClick = (r, c) => {
        if (gameOver || currentPlayer !== BLACK) return;
        const newBoard = makeMove(board, r, c, BLACK);
        if (!newBoard) return;
        setBoard(newBoard);

        if (checkGameEnd(newBoard)) {
            endGame(newBoard);
            return;
        }

        if (getValidMoves(newBoard, WHITE).length > 0) {
            setCurrentPlayer(WHITE);
            setMessage('AI thinking...');
            setTimeout(() => {
                const move = aiMove(newBoard);
                if (move) {
                    const aiBoard = makeMove(newBoard, move[0], move[1], WHITE);
                    setBoard(aiBoard);
                    if (checkGameEnd(aiBoard)) {
                        endGame(aiBoard);
                    } else if (getValidMoves(aiBoard, BLACK).length > 0) {
                        setCurrentPlayer(BLACK);
                        setMessage('Your turn (Black)');
                    } else {
                        setTimeout(() => handleAiTurn(aiBoard), 500);
                    }
                }
            }, 500);
        } else {
            setMessage('AI has no moves. Your turn.');
        }
    };

    const handleAiTurn = (b) => {
        const move = aiMove(b);
        if (move) {
            const aiBoard = makeMove(b, move[0], move[1], WHITE);
            setBoard(aiBoard);
            if (checkGameEnd(aiBoard)) endGame(aiBoard);
            else if (getValidMoves(aiBoard, BLACK).length > 0) {
                setCurrentPlayer(BLACK);
                setMessage('Your turn (Black)');
            }
        }
    };

    const endGame = (b) => {
        setGameOver(true);
        const { black, white } = countPieces(b);
        if (black > white) {
            setMessage(`You win! ${black}-${white}`);
            const score = black * 10;
            GameService.submitScore('reversi', score);
            if (score > localHighScore) setLocalHighScore(score);
        } else if (white > black) {
            setMessage(`AI wins! ${white}-${black}`);
        } else {
            setMessage(`Tie! ${black}-${white}`);
        }
    };

    const restart = () => {
        setBoard(initBoard());
        setCurrentPlayer(BLACK);
        setGameOver(false);
        setMessage('Your turn (Black)');
    };

    const validMoves = currentPlayer === BLACK ? getValidMoves(board, BLACK) : [];
    const { black, white } = countPieces(board);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a472a 0%, #0d5c36 100%)', color: 'white', padding: '20px' }}>
            <h1 style={{ fontSize: '42px', margin: '0 0 15px 0' }}>⚫ Reversi / Othello</h1>
            <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', fontSize: '18px' }}>
                <div>⚫ {black}</div><div>⚪ {white}</div><div>🏆 Best: {localHighScore}</div>
            </div>
            <div style={{ marginBottom: '15px', fontSize: '18px', padding: '10px 20px', background: '#333', borderRadius: '8px' }}>{message}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 45px)', gap: '2px', background: '#333', padding: '4px', borderRadius: '8px' }}>
                {board.map((row, r) => row.map((cell, c) => {
                    const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
                    return (
                        <div key={`${r}-${c}`} onClick={() => handleClick(r, c)} style={{
                            width: '45px', height: '45px', background: isValid ? '#3d6b4f' : '#2a5a3a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isValid ? 'pointer' : 'default'
                        }}>
                            {cell !== EMPTY && (
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: cell === BLACK ? 'radial-gradient(circle at 30% 30%, #444, #000)' : 'radial-gradient(circle at 30% 30%, #fff, #ccc)',
                                    boxShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                                }} />
                            )}
                        </div>
                    );
                }))}
            </div>
            <button onClick={restart} style={{ marginTop: '20px', padding: '12px 30px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>New Game</button>
            <button onClick={() => onFinish(null)} style={{ marginTop: '15px', background: '#666', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>Menu</button>
        </div>
    );
};

export default Reversi;
