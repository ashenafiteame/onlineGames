import React, { useState, useEffect, useRef } from 'react';
import { AuthService } from '../services/AuthService';
import { ChessRoomService } from '../services/ChessRoomService';
import { RoomService } from '../services/RoomService';
import { GameService } from '../services/GameService';

// Piece types
const EMPTY = 0;
const W_PAWN = 1, W_ROOK = 2, W_KNIGHT = 3, W_BISHOP = 4, W_QUEEN = 5, W_KING = 6;
const B_PAWN = 11, B_ROOK = 12, B_KNIGHT = 13, B_BISHOP = 14, B_QUEEN = 15, B_KING = 16;

const PIECE_SYMBOLS = {
    [W_PAWN]: '♙', [W_ROOK]: '♖', [W_KNIGHT]: '♘', [W_BISHOP]: '♗', [W_QUEEN]: '♕', [W_KING]: '♔',
    [B_PAWN]: '♟', [B_ROOK]: '♜', [B_KNIGHT]: '♞', [B_BISHOP]: '♝', [B_QUEEN]: '♛', [B_KING]: '♚'
};

const isWhitePiece = (p) => p >= 1 && p <= 6;
const isBlackPiece = (p) => p >= 11 && p <= 16;
const isEnemy = (p1, p2) => (isWhitePiece(p1) && isBlackPiece(p2)) || (isBlackPiece(p1) && isWhitePiece(p2));

export default function ChessMultiplayer({ room, onFinish }) {
    const currentUser = AuthService.getCurrentUser();
    const [gameState, setGameState] = useState(room ? JSON.parse(room.gameState) : null);
    const [board, setBoard] = useState(gameState?.board || []);
    const [players, setPlayers] = useState(gameState?.players || {});
    const [selected, setSelected] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const pollInterval = useRef(null);

    useEffect(() => {
        if (room && room.gameState) {
            const parsed = JSON.parse(room.gameState);
            setGameState(parsed);
            setBoard(parsed.board);
            setPlayers(parsed.players);
        }
    }, [room]);

    useEffect(() => {
        if (room) {
            pollInterval.current = setInterval(async () => {
                try {
                    const updatedRoom = await RoomService.getRoom(room.id);
                    if (updatedRoom.gameState) {
                        const parsed = JSON.parse(updatedRoom.gameState);
                        setGameState(parsed);
                        setBoard(parsed.board);
                        setPlayers(parsed.players);
                    }
                } catch (e) {
                    console.error("Poll error", e);
                }
            }, 1500);
        }
        return () => clearInterval(pollInterval.current);
    }, [room?.id]);

    const getMyColor = () => {
        if (players.white === currentUser.username) return 'white';
        return 'black';
    };

    const isMyTurn = () => {
        if (!gameState) return false;
        return gameState.turn === getMyColor();
    };

    const shouldRotate = () => {
        return getMyColor() === 'black';
    };

    // --- Chess Logic (Simplified from Chess.jsx) ---

    const getValidMoves = (r, c, b) => {
        const piece = b[r][c];
        if (piece === EMPTY) return [];
        const moves = [];

        const addMove = (nr, nc) => {
            if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
            const target = b[nr][nc];
            if (target === EMPTY) {
                moves.push({ r: nr, c: nc });
                return true;
            }
            if (isEnemy(piece, target)) {
                moves.push({ r: nr, c: nc, capture: true });
            }
            return false;
        };

        const addSliding = (dirs) => {
            dirs.forEach(([dr, dc]) => {
                for (let i = 1; i < 8; i++) {
                    const nr = r + dr * i;
                    const nc = c + dc * i;
                    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
                    const target = b[nr][nc];
                    if (target === EMPTY) {
                        moves.push({ r: nr, c: nc });
                    } else {
                        if (isEnemy(piece, target)) {
                            moves.push({ r: nr, c: nc, capture: true });
                        }
                        break;
                    }
                }
            });
        };

        if (piece === W_PAWN) {
            if (r > 0 && b[r - 1][c] === EMPTY) {
                moves.push({ r: r - 1, c });
                if (r === 6 && b[r - 2][c] === EMPTY) moves.push({ r: r - 2, c });
            }
            if (r > 0 && c > 0 && isBlackPiece(b[r - 1][c - 1])) moves.push({ r: r - 1, c: c - 1, capture: true });
            if (r > 0 && c < 7 && isBlackPiece(b[r - 1][c + 1])) moves.push({ r: r - 1, c: c + 1, capture: true });
        } else if (piece === B_PAWN) {
            if (r < 7 && b[r + 1][c] === EMPTY) {
                moves.push({ r: r + 1, c });
                if (r === 1 && b[r + 2][c] === EMPTY) moves.push({ r: r + 2, c });
            }
            if (r < 7 && c > 0 && isWhitePiece(b[r + 1][c - 1])) moves.push({ r: r + 1, c: c - 1, capture: true });
            if (r < 7 && c < 7 && isWhitePiece(b[r + 1][c + 1])) moves.push({ r: r + 1, c: c + 1, capture: true });
        }
        else if (piece === W_KNIGHT || piece === B_KNIGHT) {
            [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                    const t = b[nr][nc];
                    if (t === EMPTY || isEnemy(piece, t)) moves.push({ r: nr, c: nc, capture: t !== EMPTY });
                }
            });
        }
        else if (piece === W_BISHOP || piece === B_BISHOP) {
            addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
        }
        else if (piece === W_ROOK || piece === B_ROOK) {
            addSliding([[-1, 0], [1, 0], [0, -1], [0, 1]]);
        }
        else if (piece === W_QUEEN || piece === B_QUEEN) {
            addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
        }
        else if (piece === W_KING || piece === B_KING) {
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                    const t = b[nr][nc];
                    if (t === EMPTY || isEnemy(piece, t)) moves.push({ r: nr, c: nc, capture: t !== EMPTY });
                }
            });
        }

        return moves;
    };

    const applyMove = (b, fromR, fromC, toR, toC) => {
        const newBoard = b.map(row => [...row]);
        let piece = newBoard[fromR][fromC];
        // Promotion
        if (piece === W_PAWN && toR === 0) piece = W_QUEEN;
        if (piece === B_PAWN && toR === 7) piece = B_QUEEN;
        newBoard[toR][toC] = piece;
        newBoard[fromR][fromC] = EMPTY;
        return newBoard;
    };

    const checkGameOverOnBoard = (b) => {
        let whiteKing = false, blackKing = false;
        b.forEach(row => row.forEach(cell => {
            if (cell === W_KING) whiteKing = true;
            if (cell === B_KING) blackKing = true;
        }));
        return { whiteKing, blackKing, isOver: !whiteKing || !blackKing };
    };

    const handleSquareClick = async (r, c) => {
        if (gameState.winner) return;
        if (!isMyTurn()) return;

        const piece = board[r][c];
        const myColor = getMyColor();
        const myPiece = myColor === 'white' ? isWhitePiece(piece) : isBlackPiece(piece);

        if (selected) {
            const move = validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                // Execute move
                const newBoard = applyMove(board, selected.r, selected.c, r, c);

                // Optimistic check
                const { whiteKing, blackKing, isOver } = checkGameOverOnBoard(newBoard);
                let winner = null;
                if (isOver) {
                    winner = whiteKing ? 'white' : 'black';
                }

                setBoard(newBoard);
                setSelected(null);
                setValidMoves([]);
                setLastMove({ from: { r: selected.r, c: selected.c }, to: { r, c } });

                const nextTurn = myColor === 'white' ? 'black' : 'white';

                try {
                    await ChessRoomService.makeMove(room.id, newBoard, nextTurn, winner);
                    if (winner) {
                        const score = winner === myColor ? 500 : 50;
                        GameService.submitScore('chess', score).catch(console.error);
                    }
                } catch (e) {
                    console.error("Move failed", e);
                }

            } else if (myPiece) {
                // Change selection
                setSelected({ r, c });
                setValidMoves(getValidMoves(r, c, board));
            } else {
                // Deselect
                setSelected(null);
                setValidMoves([]);
            }
        } else if (myPiece) {
            // Select
            setSelected({ r, c });
            setValidMoves(getValidMoves(r, c, board));
        }
    };

    if (!gameState) return <div>Loading...</div>;

    const winnerMessage = () => {
        if (gameState.winner === 'draw') return "Draw";
        if (gameState.winner === getMyColor()) return "Victory!";
        return "Defeat";
    };

    return (
        <div style={{ textAlign: 'center', userSelect: 'none', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={() => onFinish(null)} style={{ alignSelf: 'flex-start', marginBottom: '1rem', background: '#333', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Exit</button>

            <h2 style={{
                color: 'white',
                marginBottom: '1rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
                {gameState.winner ? (
                    <span style={{ color: gameState.winner === getMyColor() ? '#4CAF50' : '#f44336', fontSize: '2rem' }}>{winnerMessage()}</span>
                ) : (
                    isMyTurn() ? <span style={{ color: '#4CAF50', fontSize: '1.5rem' }}>Your Turn</span> :
                        <span style={{ color: '#bbb' }}>Waiting for {players[gameState.turn === 'white' ? 'white' : 'black']}...</span>
                )}
            </h2>

            {/* Session stats or captured pieces could go here */}

            <div style={{
                display: 'inline-block', padding: '16px', background: '#3d2817', borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)',
                transform: shouldRotate() ? 'rotate(180deg)' : 'none',
                marginTop: '1rem',
                border: '4px solid #2a1b0e'
            }}>
                {board.map((row, r) => (
                    <div key={r} style={{ display: 'flex' }}>
                        {row.map((cell, c) => {
                            const isLight = (r + c) % 2 === 0;
                            const isValid = validMoves.some(m => m.r === r && m.c === c);
                            const isSel = selected?.r === r && selected?.c === c;
                            const isLastMove = lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c));

                            // Classic Wood Theme
                            let bgColor = isSel ? '#BBCB2B' : // Selected Green/Yellow
                                (isLastMove ? (isLight ? '#F7EC74' : '#DAC34A') : // Last Move Highlight
                                    (isLight ? '#F0D9B5' : '#B58863')); // Light/Dark Wood

                            return (
                                <div
                                    key={c}
                                    onClick={() => handleSquareClick(r, c)}
                                    style={{
                                        width: '75px', height: '75px', // Larger squares
                                        background: bgColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', position: 'relative',
                                        transform: shouldRotate() ? 'rotate(180deg)' : 'none'
                                    }}
                                >
                                    {/* Valid Move Marker */}
                                    {isValid && (
                                        <div style={{
                                            position: 'absolute',
                                            width: '24px', height: '24px',
                                            borderRadius: '50%',
                                            background: cell === EMPTY ? 'rgba(100, 120, 50, 0.4)' : 'rgba(200, 50, 50, 0.6)',
                                            border: cell === EMPTY ? 'none' : '4px solid rgba(255,255,255,0.6)', // Ring for capture
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                    )}

                                    {/* Coordinate Labels (optional, simplified) */}
                                    {c === 0 && r === 7 && <span style={{ position: 'absolute', left: '2px', bottom: '0', fontSize: '10px', color: isLight ? '#b58863' : '#f0d9b5', fontWeight: 'bold' }}>a1</span>}

                                    {cell !== EMPTY && (
                                        <span style={{
                                            color: isWhitePiece(cell) ? '#ffffff' : '#111111',
                                            fontSize: '4.5rem',
                                            lineHeight: 1,
                                            // Enhanced visibility
                                            filter: isWhitePiece(cell)
                                                ? 'drop-shadow(0 4px 3px rgba(0,0,0,0.6))'
                                                : 'drop-shadow(0 2px 2px rgba(255,255,255,0.4))',
                                            transition: 'transform 0.1s'
                                        }}>
                                            {PIECE_SYMBOLS[cell]}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1rem', color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Captured: Red/White indicators would go here
            </div>
        </div>
    );
}
