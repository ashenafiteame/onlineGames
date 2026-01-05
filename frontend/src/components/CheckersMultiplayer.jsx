import React, { useState, useEffect, useRef } from 'react';
import { AuthService } from '../services/AuthService';
import { CheckersRoomService } from '../services/CheckersRoomService';
import { RoomService } from '../services/RoomService';
import { GameService } from '../services/GameService';

const BOARD_SIZE = 8;
const RED_PLAYER = 1; // Host
const WHITE_PLAYER = 2; // Joiner
const RED_KING = 3;
const WHITE_KING = 4;

export default function CheckersMultiplayer({ room, onFinish }) {
    const currentUser = AuthService.getCurrentUser();
    const [gameState, setGameState] = useState(room ? JSON.parse(room.gameState) : null);
    const [board, setBoard] = useState(gameState?.board || []);
    const [selected, setSelected] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const pollInterval = useRef(null);

    // Initial load
    useEffect(() => {
        if (room && room.gameState) {
            const parsed = JSON.parse(room.gameState);
            setGameState(parsed);
            setBoard(parsed.board);
        }
    }, [room]);

    // Polling
    useEffect(() => {
        if (room) {
            pollInterval.current = setInterval(async () => {
                try {
                    const updatedRoom = await RoomService.getRoom(room.id);
                    if (updatedRoom.gameState) {
                        const parsed = JSON.parse(updatedRoom.gameState);
                        setGameState(parsed);
                        // Only update board if turn changed or it's not my turn (to avoid glitches while dragging/clicking)
                        // Or just update always and hope React diffing handles it. 
                        // Better: Update if turn changed or board changed significantly
                        setBoard(parsed.board);
                    }
                    if (updatedRoom.status === 'FINISHED') {
                        // Check winner
                        // handled in rendering usually
                    }
                } catch (e) {
                    console.error("Poll error", e);
                }
            }, 1000);
        }
        return () => clearInterval(pollInterval.current);
    }, [room?.id]);

    const isKing = (piece) => piece === RED_KING || piece === WHITE_KING;
    const isRed = (piece) => piece === RED_PLAYER || piece === RED_KING;
    const isWhite = (piece) => piece === WHITE_PLAYER || piece === WHITE_KING;

    const getMyColor = () => {
        if (!gameState || !gameState.players) return RED_PLAYER;
        // players map: "1": "username1", "2": "username2"
        if (gameState.players["1"] === currentUser.username) return RED_PLAYER;
        return WHITE_PLAYER;
    };

    const isMyTurn = () => {
        if (!gameState) return false;
        // turn is stored as integer 1 or 2
        return gameState.turn === getMyColor();
    };

    // Rotate board for white player
    const shouldRotate = () => {
        return getMyColor() === WHITE_PLAYER;
    };

    const getMoves = (r, c, b) => {
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
        if (!isMyTurn() || room.status !== 'PLAYING') return;

        if (selected) {
            const move = validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                makeMove(selected.r, selected.c, r, c, move.capture);
                return;
            }
        }

        const piece = board[r][c];
        const myColor = getMyColor();
        // Allow selecting own pieces
        if ((isRed(piece) && myColor === RED_PLAYER) || (isWhite(piece) && myColor === WHITE_PLAYER)) {
            setSelected({ r, c });
            setValidMoves(getMoves(r, c, board));
        } else {
            setSelected(null);
            setValidMoves([]);
        }
    };

    const makeMove = async (fromR, fromC, toR, toC, capture) => {
        try {
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
            // Note: backend expects next turn logic. Simplest is to handle logic here.
            // If capture happened, check if same piece can capture again.
            // But strict checkers rules say you MUST continue capturing.
            // For simplicity, we'll allow turn switch unless multi-jump is enforced?

            // Re-using logic from Checkers.jsx roughly
            const possibleNextMoves = capture ? getMoves(toR, toC, newBoard).filter(m => m.capture) : [];
            const multiJump = possibleNextMoves.length > 0;

            let nextTurn = gameState.turn;
            if (!multiJump) {
                nextTurn = (gameState.turn === RED_PLAYER) ? WHITE_PLAYER : RED_PLAYER;
            }

            // Check Game Over
            let redCount = 0;
            let whiteCount = 0;
            newBoard.forEach(row => row.forEach(cell => {
                if (isRed(cell)) redCount++;
                if (isWhite(cell)) whiteCount++;
            }));

            let winner = null;
            if (redCount === 0) winner = "2"; // White wins
            else if (whiteCount === 0) winner = "1"; // Red wins

            // Optimistic update
            setBoard(newBoard);
            setSelected(null);
            setValidMoves([]);
            if (multiJump) {
                setSelected({ r: toR, c: toC });
                setValidMoves(possibleNextMoves);
            }

            await CheckersRoomService.makeMove(room.id, newBoard, nextTurn, winner);

            if (winner) {
                // Submit score if we won
                const amIWinner = winner === (getMyColor() === RED_PLAYER ? "1" : "2");
                if (amIWinner) {
                    GameService.submitScore('checkers', 500).catch(console.error);
                }
            }

        } catch (e) {
            console.error(e);
            alert("Move failed: " + e.message);
        }
    };

    if (!gameState) return <div>Loading board...</div>;

    const getWinnerMessage = () => {
        if (gameState.winner) {
            const myColor = getMyColor();
            const winColor = gameState.winner === "1" ? RED_PLAYER : WHITE_PLAYER;
            if (myColor === winColor) return "You Won! 🎉";
            return "Opponent Won!";
        }
        return null;
    };

    return (
        <div style={{ textAlign: 'center', userSelect: 'none', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header / HUD */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '500px' }}>
                <button onClick={() => onFinish(null)} style={{ background: '#444', border: 'none', color: 'white', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>Exit</button>
                <div>
                    <span style={{ color: gameState.turn === RED_PLAYER ? '#e53e3e' : '#888', fontWeight: 'bold' }}>Red</span>
                    {' vs '}
                    <span style={{ color: gameState.turn === WHITE_PLAYER ? 'white' : '#888', fontWeight: 'bold' }}>White</span>
                </div>
                <div>{/* Placeholder for timer or stats */}</div>
            </div>

            {/* Turn Indicator */}
            {!gameState.winner && (
                <div style={{ marginBottom: '10px', color: isMyTurn() ? '#4CAF50' : '#888' }}>
                    {isMyTurn() ? "YOUR TURN" : (gameState.players[gameState.turn === 1 ? "1" : "2"] + "'s Turn")}
                </div>
            )}

            <div style={{
                display: 'inline-block',
                padding: '12px',
                background: '#444',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                transform: shouldRotate() ? 'rotate(180deg)' : 'none'
            }}>
                {board.map((row, r) => (
                    <div key={r} style={{ display: 'flex' }}>
                        {row.map((cell, c) => {
                            const isBlackSquare = (r + c) % 2 !== 0;
                            const isValid = validMoves.some(m => m.r === r && m.c === c);
                            const isSel = selected && selected.r === r && selected.c === c;

                            let bgColor = isBlackSquare ? '#222' : '#eee';

                            return (
                                <div
                                    key={c}
                                    onClick={() => handleSquareClick(r, c)}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        background: bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: isBlackSquare ? 'pointer' : 'default',
                                        position: 'relative',
                                        border: isSel ? '2px solid var(--primary)' : 'none',
                                        transform: shouldRotate() ? 'rotate(180deg)' : 'none'
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

            {/* Game Over Modal */}
            {gameState.winner && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000
                }}>
                    <h2 style={{ color: '#42d392', marginTop: 0 }}>
                        {getWinnerMessage()}
                    </h2>
                    <button onClick={() => onFinish(null)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                </div>
            )}
        </div>
    );
}
