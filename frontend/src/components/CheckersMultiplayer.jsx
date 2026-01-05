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
    const [sessionWins, setSessionWins] = useState({});
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
                        setBoard(parsed.board);
                    }
                    // Fetch session wins
                    if (updatedRoom.sessionWins) {
                        try {
                            const wins = typeof updatedRoom.sessionWins === 'string'
                                ? JSON.parse(updatedRoom.sessionWins)
                                : updatedRoom.sessionWins;
                            setSessionWins(wins);
                        } catch (e) { /* ignore parse errors */ }
                    }
                    if (updatedRoom.status === 'FINISHED') {
                        // handled in rendering
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

    const isInternational = () => {
        try {
            const s = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;
            return s && s.variant === 'international';
        } catch (e) { return false; }
    };

    const isRussian = () => {
        try {
            const s = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;
            return s && s.variant === 'russian';
        } catch (e) { return false; }
    };

    // Flying Kings: Russian and International
    const isFlyingKing = () => isRussian() || isInternational();
    // Backward Capture for Men: Russian and International
    const menCanCaptureBackward = () => isRussian() || isInternational();

    const isOpponent = (myPiece, targetPiece) => {
        if (isRed(myPiece)) return isWhite(targetPiece);
        if (isWhite(myPiece)) return isRed(targetPiece);
        return false;
    };
    const hasMandatoryCapture = () => isRussian() || isInternational();

    const getMoves = (r, c, b) => {
        const moves = [];
        const piece = b[r][c];
        if (piece === 0) return moves;
        const size = b.length;

        // Flying King Logic (Russian/International)
        if (isKing(piece) && isFlyingKing()) {
            const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

            // Moves (non-capture)
            dirs.forEach(([dr, dc]) => {
                let d = 1;
                while (true) {
                    const nr = r + dr * d;
                    const nc = c + dc * d;
                    if (nr < 0 || nr >= size || nc < 0 || nc >= size || b[nr][nc] !== 0) break;
                    moves.push({ r: nr, c: nc, capture: null });
                    d++;
                }
            });

            // Captures
            dirs.forEach(([dr, dc]) => {
                let d = 1;
                let foundOpponent = false;
                let capturePos = null;
                while (true) {
                    const nr = r + dr * d;
                    const nc = c + dc * d;
                    if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;

                    const cell = b[nr][nc];
                    if (cell === 0) {
                        if (foundOpponent) {
                            moves.push({ r: nr, c: nc, capture: capturePos });
                        }
                    } else {
                        if (foundOpponent) break; // Cannot jump two pieces
                        if (isOpponent(piece, cell)) {
                            foundOpponent = true;
                            capturePos = { r: nr, c: nc };
                        } else {
                            break; // Blocked by own piece
                        }
                    }
                    d++;
                }
            });
            return moves;
        }

        // Standard Logic (or Non-Flying King)
        const moveDirs = [];
        const captureDirs = [];

        if (isKing(piece)) {
            // Standard King: 1 step any dir
            const allDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            moveDirs.push(...allDirs);
            captureDirs.push(...allDirs);
        } else {
            // Men
            if (isRed(piece)) {
                moveDirs.push([-1, -1], [-1, 1]); // fwd
                captureDirs.push([-1, -1], [-1, 1]); // fwd
                if (menCanCaptureBackward()) captureDirs.push([1, -1], [1, 1]); // bwd
            } else if (isWhite(piece)) {
                moveDirs.push([1, -1], [1, 1]); // fwd
                captureDirs.push([1, -1], [1, 1]); // fwd
                if (menCanCaptureBackward()) captureDirs.push([-1, -1], [-1, 1]); // bwd
            }
        }

        // Apply Standard Moves
        moveDirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && b[nr][nc] === 0) {
                moves.push({ r: nr, c: nc, capture: null });
            }
        });

        // Apply Standard Captures
        captureDirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (isOpponent(piece, b[nr][nc])) {
                    const jr = nr + dr;
                    const jc = nc + dc;
                    if (jr >= 0 && jr < size && jc >= 0 && jc < size && b[jr][jc] === 0) {
                        moves.push({ r: jr, c: jc, capture: { r: nr, c: nc } });
                    }
                }
            }
        });

        return moves;
    };

    // Check if any piece of given color has a capture available
    const anyCaptureAvailable = (b, playerColor) => {
        const size = b.length;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const piece = b[r][c];
                if (piece === 0) continue;
                const pieceIsPlayer = (playerColor === RED_PLAYER && isRed(piece)) ||
                    (playerColor === WHITE_PLAYER && isWhite(piece));
                if (pieceIsPlayer) {
                    const pieceMoves = getMoves(r, c, b);
                    if (pieceMoves.some(m => m.capture)) return true;
                }
            }
        }
        return false;
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
            let moves = getMoves(r, c, board);

            // Enforce mandatory capture: if any capture is available for this player, only allow captures
            if (hasMandatoryCapture() && anyCaptureAvailable(board, myColor)) {
                const thisHasCapture = moves.some(m => m.capture);
                if (thisHasCapture) {
                    moves = moves.filter(m => m.capture);
                    setSelected({ r, c });
                    setValidMoves(moves);
                } else {
                    // This piece has no capture but another does - can't select this piece
                    setSelected(null);
                    setValidMoves([]);
                }
            } else {
                setSelected({ r, c });
                setValidMoves(moves);
            }
        } else {
            setSelected(null);
            setValidMoves([]);
        }
    };

    const makeMove = async (fromR, fromC, toR, toC, capture) => {
        try {
            const newBoard = board.map(row => [...row]);
            const size = newBoard.length;
            let piece = newBoard[fromR][fromC];

            // Kinging
            if (piece === RED_PLAYER && toR === 0) piece = RED_KING;
            if (piece === WHITE_PLAYER && toR === size - 1) piece = WHITE_KING;

            // Apply move
            newBoard[toR][toC] = piece;
            newBoard[fromR][fromC] = 0;
            if (capture) {
                newBoard[capture.r][capture.c] = 0;
            }

            // Promotion Logic
            let promoted = false;
            // Red
            if (piece === RED_PLAYER && toR === 0) {
                piece = RED_KING; // Promote
                newBoard[toR][toC] = piece;
                promoted = true;
            }
            // White
            if (piece === WHITE_PLAYER && toR === size - 1) {
                piece = WHITE_KING; // Promote
                newBoard[toR][toC] = piece;
                promoted = true;
            }

            // Check for multi-jump
            let possibleNextMoves = [];
            if (capture) {
                if (promoted) {
                    if (isRussian()) {
                        // Russian: Continue capturing as King
                        possibleNextMoves = getMoves(toR, toC, newBoard).filter(m => m.capture);
                    } else {
                        // Standard/Intl: Promotion ends turn (or standard rule: stop)
                        possibleNextMoves = [];
                    }
                } else {
                    // Not promoted: continue capturing if possible
                    possibleNextMoves = getMoves(toR, toC, newBoard).filter(m => m.capture);
                }
            }

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={async () => {
                                try {
                                    await CheckersRoomService.requestReplay(room.id);
                                } catch (err) {
                                    console.error('Failed to request replay:', err);
                                }
                            }}
                            style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Play Again
                        </button>
                        <button onClick={() => onFinish(null)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
}
