import React, { useState, useEffect } from 'react';
import { GameService } from '../services/GameService';

const BOARD_SIZE = 8;
const PLAYER = 1; // Red
const AI = 2; // White
const PLAYER_KING = 3;
const AI_KING = 4;

export default function Checkers({ onFinish, highScore }) {
    const [board, setBoard] = useState(initialBoard());
    const [selected, setSelected] = useState(null);
    const [turn, setTurn] = useState(PLAYER);
    const [validMoves, setValidMoves] = useState([]);

    function initialBoard() {
        const b = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = AI;
            }
        }
        for (let r = 5; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = PLAYER;
            }
        }
        return b;
    }

    const isKing = (piece) => piece === PLAYER_KING || piece === AI_KING;
    const isPlayer = (piece) => piece === PLAYER || piece === PLAYER_KING;
    const isAI = (piece) => piece === AI || piece === AI_KING;

    const getMoves = (r, c, b, currentTurn) => {
        const moves = [];
        const piece = b[r][c];
        if (piece === 0) return moves;

        const directions = [];
        if (piece === PLAYER || isKing(piece)) {
            directions.push([-1, -1], [-1, 1]);
        }
        if (piece === AI || isKing(piece)) {
            directions.push([1, -1], [1, 1]);
        }

        directions.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (b[nr][nc] === 0) {
                    moves.push({ r: nr, c: nc, capture: null });
                } else if ((isPlayer(piece) && isAI(b[nr][nc])) || (isAI(piece) && isPlayer(b[nr][nc]))) {
                    const jr = nr + dr;
                    const jc = nc + dc;
                    if (jr >= 0 && jr < BOARD_SIZE && jc >= 0 && jc < BOARD_SIZE && b[jr][jc] === 0) {
                        moves.push({ r: jr, c: jc, capture: { r: nr, c: nc } });
                    }
                }
            }
        });
        return moves;
    };

    const handleSquareClick = (r, c) => {
        if (turn !== PLAYER) return;

        if (selected) {
            const move = validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                makeMove(selected.r, selected.c, r, c, move.capture);
                return;
            }
        }

        if (isPlayer(board[r][c])) {
            setSelected({ r, c });
            setValidMoves(getMoves(r, c, board, PLAYER));
        } else {
            setSelected(null);
            setValidMoves([]);
        }
    };

    const makeMove = (fromR, fromC, toR, toC, capture) => {
        const newBoard = board.map(row => [...row]);
        let piece = newBoard[fromR][fromC];

        // Kinging
        if (piece === PLAYER && toR === 0) piece = PLAYER_KING;
        if (piece === AI && toR === BOARD_SIZE - 1) piece = AI_KING;

        newBoard[toR][toC] = piece;
        newBoard[fromR][fromC] = 0;

        if (capture) {
            newBoard[capture.r][capture.c] = 0;
        }

        setBoard(newBoard);
        setSelected(null);
        setValidMoves([]);

        if (capture && getMoves(toR, toC, newBoard, turn).filter(m => m.capture).length > 0) {
            // Check for multi-jump
            setSelected({ r: toR, c: toC });
            setValidMoves(getMoves(toR, toC, newBoard, turn).filter(m => m.capture));
        } else {
            setTurn(turn === PLAYER ? AI : PLAYER);
        }
    };

    useEffect(() => {
        if (turn === AI) {
            setTimeout(aiMove, 1000);
        }
        checkGameOver();
    }, [turn]);

    const aiMove = () => {
        let allMoves = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isAI(board[r][c])) {
                    const moves = getMoves(r, c, board, AI);
                    moves.forEach(m => allMoves.push({ fromR: r, fromC: c, ...m }));
                }
            }
        }

        if (allMoves.length === 0) return;

        // Prioritize captures
        const captures = allMoves.filter(m => m.capture);
        const move = captures.length > 0
            ? captures[Math.floor(Math.random() * captures.length)]
            : allMoves[Math.floor(Math.random() * allMoves.length)];

        makeMove(move.fromR, move.fromC, move.r, move.c, move.capture);
    };

    const checkGameOver = () => {
        let pCount = 0;
        let aiCount = 0;
        board.forEach(row => row.forEach(cell => {
            if (isPlayer(cell)) pCount++;
            if (isAI(cell)) aiCount++;
        }));

        if (pCount === 0 || aiCount === 0) {
            const won = pCount > 0;
            const score = won ? 500 + pCount * 50 : pCount * 20;
            GameService.submitScore('checkers', score).then(user => {
                alert(won ? "You Won! 🎉" : "AI Won! Better luck next time.");
                onFinish(user);
            });
        }
    };

    return (
        <div style={{ textAlign: 'center', userSelect: 'none' }}>
            <h2 style={{ marginBottom: '1rem' }}>🏁 Checkers</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                <div style={{ color: turn === PLAYER ? 'var(--primary)' : '#888', fontWeight: turn === PLAYER ? 'bold' : 'normal' }}>
                    Your Turn (Red)
                </div>
                <div style={{ color: turn === AI ? '#fff' : '#888', fontWeight: turn === AI ? 'bold' : 'normal' }}>
                    AI Turn (White)
                </div>
            </div>

            <div style={{
                display: 'inline-block',
                padding: '12px',
                background: '#444',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {board.map((row, r) => (
                    <div key={r} style={{ display: 'flex' }}>
                        {row.map((cell, c) => {
                            const isBlack = (r + c) % 2 !== 0;
                            const isValid = validMoves.some(m => m.r === r && m.c === c);
                            const isSel = selected && selected.r === r && selected.c === c;

                            return (
                                <div
                                    key={c}
                                    onClick={() => handleSquareClick(r, c)}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        background: isBlack ? '#222' : '#eee',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: isBlack ? 'pointer' : 'default',
                                        position: 'relative',
                                        border: isSel ? '2px solid var(--primary)' : 'none'
                                    }}
                                >
                                    {isValid && (
                                        <div style={{
                                            position: 'absolute',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: 'rgba(66, 211, 146, 0.4)',
                                            border: '2px solid #42d392'
                                        }} />
                                    )}
                                    {cell !== 0 && (
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: isPlayer(cell) ? '#e53e3e' : '#fff',
                                            boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isPlayer(cell) ? '#fff' : '#000',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            transition: 'transform 0.2s'
                                        }}>
                                            {isKing(cell) ? '👑' : ''}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                    onClick={() => { if (window.confirm("Restart game?")) setBoard(initialBoard()); setTurn(PLAYER); setSelected(null); setValidMoves([]); }}
                    style={{ background: '#444' }}
                >
                    Restart
                </button>
                <button
                    onClick={() => onFinish(null)}
                    style={{ background: '#333' }}
                >
                    Back to Library
                </button>
            </div>
        </div>
    );
}
