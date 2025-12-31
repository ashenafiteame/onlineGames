import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../services/GameService';
import { AuthService } from '../services/AuthService';
import { MatchService } from '../services/MatchService';

const BOARD_SIZE = 8;
const RED_PLAYER = 1; // Player 1 (Inviter)
const WHITE_PLAYER = 2; // Player 2 (Invited)
const RED_KING = 3;
const WHITE_KING = 4;

export default function Checkers({ onFinish, highScore, matchId }) {
    const currentUser = AuthService.getCurrentUser();
    const [match, setMatch] = useState(null);
    const [board, setBoard] = useState(initialBoard());
    const [selected, setSelected] = useState(null);
    const [turn, setTurn] = useState(RED_PLAYER); // By default Red starts
    const [validMoves, setValidMoves] = useState([]);
    const [isMultiplayer, setIsMultiplayer] = useState(!!matchId);
    const pollInterval = useRef(null);

    function initialBoard() {
        const b = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = WHITE_PLAYER;
            }
        }
        for (let r = 5; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = RED_PLAYER;
            }
        }
        return b;
    }

    const isKing = (piece) => piece === RED_KING || piece === WHITE_KING;
    const isRed = (piece) => piece === RED_PLAYER || piece === RED_KING;
    const isWhite = (piece) => piece === WHITE_PLAYER || piece === WHITE_KING;

    // Multiplayer Helpers
    const getMyColor = () => {
        if (!match) return RED_PLAYER;
        return match.player1.username === currentUser.username ? RED_PLAYER : WHITE_PLAYER;
    };

    const isMyTurn = () => {
        if (!isMultiplayer) return turn === RED_PLAYER; // In single player, user is always Red
        if (!match) return false;
        return match.currentTurn === currentUser.username;
    };

    const fetchMatch = async () => {
        if (!matchId) return;
        try {
            const data = await MatchService.getMatch(matchId);
            setMatch(data);
            setBoard(JSON.parse(data.boardData));
            setTurn(data.currentTurn === data.player1.username ? RED_PLAYER : WHITE_PLAYER);
        } catch (error) {
            console.error('Error polling match:', error);
        }
    };

    useEffect(() => {
        if (isMultiplayer) {
            // Initial fetch
            if (!match) fetchMatch();

            pollInterval.current = setInterval(() => {
                // We use a ref or simply rely on the fact that this effect 
                // re-runs when dependencies change, so 'match' is fresh.
                // But better to be explicit: check if it's NOT our turn before overwriting state.
                if (!isMyTurn()) {
                    fetchMatch();
                }
            }, 3000);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [matchId, match, turn]); // Added dependencies to ensure fresh closure

    const getMoves = (r, c, b, currentTurn) => {
        const moves = [];
        const piece = b[r][c];
        if (piece === 0) return moves;

        const directions = [];
        if (isRed(piece) || isKing(piece)) {
            directions.push([-1, -1], [-1, 1]);
        }
        if (isWhite(piece) || isKing(piece)) {
            directions.push([1, -1], [1, 1]);
        }

        directions.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (b[nr][nc] === 0) {
                    moves.push({ r: nr, c: nc, capture: null });
                } else if ((isRed(piece) && isWhite(b[nr][nc])) || (isWhite(piece) && isRed(b[nr][nc]))) {
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
        if (!isMyTurn()) return;

        if (selected) {
            const move = validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                makeMove(selected.r, selected.c, r, c, move.capture);
                return;
            }
        }

        const piece = board[r][c];
        if ((isRed(piece) && getMyColor() === RED_PLAYER) || (isWhite(piece) && getMyColor() === WHITE_PLAYER)) {
            setSelected({ r, c });
            setValidMoves(getMoves(r, c, board, turn));
        } else {
            setSelected(null);
            setValidMoves([]);
        }
    };

    const makeMove = async (fromR, fromC, toR, toC, capture) => {
        const newBoard = board.map(row => [...row]);
        let piece = newBoard[fromR][fromC];

        // Kinging
        if (piece === RED_PLAYER && toR === 0) piece = RED_KING;
        if (piece === WHITE_PLAYER && toR === BOARD_SIZE - 1) piece = WHITE_KING;

        newBoard[toR][toC] = piece;
        newBoard[fromR][fromC] = 0;

        if (capture) {
            newBoard[capture.r][capture.c] = 0;
        }

        // Check for multi-jump
        const possibleNextMoves = capture ? getMoves(toR, toC, newBoard, turn).filter(m => m.capture) : [];
        const multiJump = possibleNextMoves.length > 0;

        if (isMultiplayer) {
            const nextTurnUsername = multiJump ? currentUser.username : (match.player1.username === currentUser.username ? match.player2.username : match.player1.username);
            try {
                const updatedMatch = await MatchService.submitMove(matchId, JSON.stringify(newBoard), nextTurnUsername);
                setMatch(updatedMatch);
                setBoard(newBoard);
                if (multiJump) {
                    setSelected({ r: toR, c: toC });
                    setValidMoves(possibleNextMoves);
                } else {
                    setSelected(null);
                    setValidMoves([]);
                    setTurn(updatedMatch.currentTurn === updatedMatch.player1.username ? RED_PLAYER : WHITE_PLAYER);
                }
            } catch (err) {
                alert("Failed to submit move: " + err.message);
            }
        } else {
            // Local AI Logic
            setBoard(newBoard);
            setSelected(null);
            setValidMoves([]);

            if (multiJump) {
                setSelected({ r: toR, c: toC });
                setValidMoves(possibleNextMoves);
            } else {
                setTurn(turn === RED_PLAYER ? WHITE_PLAYER : RED_PLAYER);
            }
        }
    };

    useEffect(() => {
        if (!isMultiplayer && turn === WHITE_PLAYER) {
            setTimeout(aiMove, 1000);
        }
        checkGameOver();
    }, [turn, board]);

    const aiMove = () => {
        let allMoves = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isWhite(board[r][c])) {
                    const moves = getMoves(r, c, board, WHITE_PLAYER);
                    moves.forEach(m => allMoves.push({ fromR: r, fromC: c, ...m }));
                }
            }
        }

        if (allMoves.length === 0) return;

        const captures = allMoves.filter(m => m.capture);
        const move = captures.length > 0
            ? captures[Math.floor(Math.random() * captures.length)]
            : allMoves[Math.floor(Math.random() * allMoves.length)];

        makeMove(move.fromR, move.fromC, move.r, move.c, move.capture);
    };

    const checkGameOver = () => {
        let redCount = 0;
        let whiteCount = 0;
        board.forEach(row => row.forEach(cell => {
            if (isRed(cell)) redCount++;
            if (isWhite(cell)) whiteCount++;
        }));

        if (redCount === 0 || whiteCount === 0) {
            const won = (getMyColor() === RED_PLAYER && redCount > 0) || (getMyColor() === WHITE_PLAYER && whiteCount > 0);
            const score = won ? 500 : 100;

            if (isMultiplayer) {
                MatchService.finishMatch(matchId).then(() => {
                    alert(won ? "You Won the Match! 🎉" : "Opponent Won! Good game.");
                    onFinish(null); // Simple finish for multiplayer
                });
            } else {
                GameService.submitScore('checkers', redCount > 0 ? 500 : 50).then(user => {
                    alert(redCount > 0 ? "You Won! 🎉" : "AI Won! Better luck next time.");
                    onFinish(user);
                });
            }
        }
    };

    return (
        <div style={{ textAlign: 'center', userSelect: 'none' }}>
            <h2 style={{ marginBottom: '1rem' }}>🏁 Checkers {isMultiplayer ? '(Multiplayer)' : '(Solo vs AI)'}</h2>
            {isMultiplayer && match && (
                <p style={{ color: '#888', marginBottom: '1rem' }}>
                    Playing vs <strong>{match.player1.username === currentUser.username ? match.player2.username : match.player1.username}</strong>
                </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                <div style={{ color: turn === RED_PLAYER ? '#e53e3e' : '#888', fontWeight: turn === RED_PLAYER ? 'bold' : 'normal', borderBottom: turn === RED_PLAYER ? '2px solid #e53e3e' : 'none' }}>
                    Red {match && match.player1.username === currentUser.username ? '(You)' : ''}
                </div>
                <div style={{ color: turn === WHITE_PLAYER ? '#fff' : '#888', fontWeight: turn === WHITE_PLAYER ? 'bold' : 'normal', borderBottom: turn === WHITE_PLAYER ? '2px solid #fff' : 'none' }}>
                    White {match && match.player2.username === currentUser.username ? '(You)' : ''}
                </div>
            </div>

            {!isMyTurn() && isMultiplayer && (
                <div style={{ color: 'var(--primary)', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                    Waiting for opponent's move...
                </div>
            )}

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
                                            background: isRed(cell) ? '#e53e3e' : '#fff',
                                            boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isRed(cell) ? '#fff' : '#000',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            transition: 'transform 0.2s',
                                            transform: isSel ? 'scale(1.1)' : 'scale(1)'
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
                {!isMultiplayer && (
                    <button
                        onClick={() => { if (window.confirm("Restart game?")) { setBoard(initialBoard()); setTurn(RED_PLAYER); setSelected(null); setValidMoves([]); } }}
                        style={{ background: '#444' }}
                    >
                        Restart
                    </button>
                )}
                <button
                    onClick={() => onFinish(null)}
                    style={{ background: '#333' }}
                >
                    Back to Library
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
