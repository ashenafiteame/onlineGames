import React, { useState, useEffect, useRef } from 'react';
import { AuthService } from '../services/AuthService';
import { ConnectFourRoomService } from '../services/ConnectFourRoomService';
import { RoomService } from '../services/RoomService';
import { GameService } from '../services/GameService';

const ROWS = 6;
const COLS = 7;
const RED = 'red';
const YELLOW = 'yellow';

export default function ConnectFourMultiplayer({ room, onFinish }) {
    const currentUser = AuthService.getCurrentUser();
    const [gameState, setGameState] = useState(room ? JSON.parse(room.gameState) : null);
    const [board, setBoard] = useState(gameState?.board || Array.from({ length: 6 }, () => Array(7).fill(null)));
    const [players, setPlayers] = useState(gameState?.players || {});
    const [replayRequested, setReplayRequested] = useState(false);
    const [sessionWins, setSessionWins] = useState(room?.sessionWins ? JSON.parse(room.sessionWins) : {});
    const pollInterval = useRef(null);

    // Detect restart
    useEffect(() => {
        if (gameState && !gameState.winner && replayRequested) {
            setReplayRequested(false);
        }
    }, [gameState]);

    const handleReplay = async () => {
        try {
            setReplayRequested(true);
            await ConnectFourRoomService.requestReplay(room.id);
        } catch (error) {
            console.error(error);
            setReplayRequested(false);
            alert("Failed to request replay");
        }
    };

    useEffect(() => {
        if (room && room.gameState) {
            const parsed = JSON.parse(room.gameState);
            setGameState(parsed);
            setBoard(parsed.board);
            setPlayers(parsed.players);
            if (room.sessionWins) {
                setSessionWins(JSON.parse(room.sessionWins));
            }
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
                    if (updatedRoom.sessionWins) {
                        setSessionWins(JSON.parse(updatedRoom.sessionWins));
                    }
                } catch (e) {
                    console.error("Poll error", e);
                }
            }, 1000);
        }
        return () => clearInterval(pollInterval.current);
    }, [room?.id]);

    const getMyColor = () => {
        if (players.red === currentUser.username) return RED;
        return YELLOW;
    };

    const isMyTurn = () => {
        if (!gameState) return false;
        return gameState.turn === getMyColor();
    };

    const getLowestEmptyRow = (b, col) => {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!b[r][col]) return r;
        }
        return -1;
    };

    const checkWinner = (b) => {
        // Horizontal
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (b[r][c] && b[r][c] === b[r][c + 1] && b[r][c] === b[r][c + 2] && b[r][c] === b[r][c + 3]) return b[r][c];
            }
        }
        // Vertical
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c < COLS; c++) {
                if (b[r][c] && b[r][c] === b[r + 1][c] && b[r][c] === b[r + 2][c] && b[r][c] === b[r + 3][c]) return b[r][c];
            }
        }
        // Diagonals
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (b[r][c] && b[r][c] === b[r - 1][c + 1] && b[r][c] === b[r - 2][c + 2] && b[r][c] === b[r - 3][c + 3]) return b[r][c];
            }
        }
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (b[r][c] && b[r][c] === b[r + 1][c + 1] && b[r][c] === b[r + 2][c + 2] && b[r][c] === b[r + 3][c + 3]) return b[r][c];
            }
        }
        // Draw
        if (b[0].every(cell => cell !== null)) return 'draw';
        return null;
    };

    const handleColumnClick = async (col) => {
        if (!isMyTurn() || gameState.winner) return;

        const row = getLowestEmptyRow(board, col);
        if (row === -1) return;

        const newBoard = board.map(r => [...r]); // deep copy not needed if rows immutable? Arrays are mutable.
        // Needs proper deep copy for rows
        const deepBoard = board.map(r => [...r]);
        deepBoard[row][col] = getMyColor();

        const winner = checkWinner(deepBoard);
        const nextTurn = getMyColor() === RED ? YELLOW : RED;

        setBoard(deepBoard); // optimistic

        try {
            await ConnectFourRoomService.makeMove(room.id, deepBoard, nextTurn, winner);
            if (winner) {
                if (winner === getMyColor()) {
                    GameService.submitScore('connectfour', 300).catch(console.error);
                } else if (winner === 'draw') {
                    GameService.submitScore('connectfour', 100).catch(console.error);
                } else {
                    GameService.submitScore('connectfour', 50).catch(console.error);
                }
            }
        } catch (e) {
            console.error("Move error", e);
            alert("Move failed: " + e.message);
        }
    };

    const getStatusMessage = () => {
        if (gameState.winner) {
            if (gameState.winner === 'draw') return "It's a Draw! 🤝";
            if (gameState.winner === getMyColor()) return "You Won! 🎉";
            return "You Lost!";
        }
        if (isMyTurn()) return "YOUR TURN";
        return `Waiting for ${players[gameState.turn === RED ? RED : YELLOW]}...`;
    };

    if (!gameState) return <div>Loading...</div>;

    return (
        <div style={{ textAlign: 'center', userSelect: 'none', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', minHeight: '100vh', padding: '20px', color: 'white' }}>
            <button onClick={() => onFinish(null)} style={{ alignSelf: 'flex-start', marginBottom: '1rem', background: '#333', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Exit</button>

            <div style={{ position: 'absolute', top: 20, right: 20, textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', opacity: 0.9 }}>Session Score</h3>
                <div style={{ color: '#ff6666', fontWeight: 'bold' }}>{players[RED]}: {sessionWins[players[RED]] || 0}</div>
                <div style={{ color: '#ffff66', fontWeight: 'bold' }}>{players[YELLOW]}: {sessionWins[players[YELLOW]] || 0}</div>
            </div>

            <h2 style={{ color: isMyTurn() && !gameState.winner ? '#4CAF50' : 'white' }}>{getStatusMessage()}</h2>

            <div style={{
                background: '#0052cc',
                padding: '15px',
                borderRadius: '15px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                marginTop: '1rem'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${COLS}, 60px)`,
                    gap: '8px'
                }}>
                    {Array.from({ length: COLS }, (_, col) => (
                        <div
                            key={`col-${col}`}
                            onClick={() => handleColumnClick(col)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                cursor: (!gameState.winner && isMyTurn() && board[0][col] === null) ? 'pointer' : 'default'
                            }}
                        >
                            {Array.from({ length: ROWS }, (_, row) => (
                                <div
                                    key={`${row}-${col}`}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: board[row][col] === RED
                                            ? 'radial-gradient(circle at 30% 30%, #ff6666, #cc0000)'
                                            : board[row][col] === YELLOW
                                                ? 'radial-gradient(circle at 30% 30%, #ffff66, #ccaa00)'
                                                : '#003399',
                                        boxShadow: 'inset 3px 3px 8px rgba(0,0,0,0.3)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {gameState.winner && (
                <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleReplay}
                        disabled={replayRequested}
                        style={{
                            padding: '12px 24px',
                            background: replayRequested ? '#888' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: replayRequested ? 'default' : 'pointer'
                        }}
                    >
                        {replayRequested ? 'Waiting for opponent...' : 'Play Again'}
                    </button>
                    <button onClick={() => onFinish(null)} style={{ padding: '12px 24px', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                </div>
            )}
        </div>
    );
}
