import React, { useState, useEffect, useRef } from 'react';
import { AuthService } from '../services/AuthService';
import { TicTacToeRoomService } from '../services/TicTacToeRoomService';
import { RoomService } from '../services/RoomService';
import { GameService } from '../services/GameService';

const X = 'X';
const O = 'O';
const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

export default function TicTacToeMultiplayer({ room, onFinish }) {
    const currentUser = AuthService.getCurrentUser();
    const [gameState, setGameState] = useState(room ? JSON.parse(room.gameState) : null);
    const [board, setBoard] = useState(gameState?.board || Array(9).fill(null));
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
            await TicTacToeRoomService.requestReplay(room.id);
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

    const getMySymbol = () => {
        if (players.X === currentUser.username) return X;
        return O; // default or incorrect
    };

    const isMyTurn = () => {
        if (!gameState) return false;
        return gameState.turn === getMySymbol();
    };

    const checkWinner = (b) => {
        for (const [a, bIdx, c] of WINNING_LINES) {
            if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
                return b[a];
            }
        }
        if (b.every(cell => cell !== null)) {
            return 'draw';
        }
        return null; // ongoing
    };

    const handleCellClick = async (index) => {
        if (!isMyTurn() || board[index] || gameState.winner) return;

        const newBoard = [...board];
        const mySymbol = getMySymbol();
        newBoard[index] = mySymbol;

        const winner = checkWinner(newBoard); // 'X', 'O', 'draw', or null
        const nextTurn = mySymbol === X ? O : X;

        // Optimistic update
        setBoard(newBoard);

        try {
            await TicTacToeRoomService.makeMove(room.id, newBoard, nextTurn, winner);
            if (winner) {
                // Determine if I won
                if (winner === mySymbol) {
                    GameService.submitScore('tictactoe', 300).catch(console.error);
                } else if (winner === 'draw') {
                    GameService.submitScore('tictactoe', 100).catch(console.error);
                } else {
                    GameService.submitScore('tictactoe', 50).catch(console.error);
                }
            }
        } catch (e) {
            console.error("Move failed", e);
            alert("Move failed: " + e.message);
        }
    };

    const getStatusMessage = () => {
        if (gameState.winner) {
            if (gameState.winner === 'draw') return "It's a Draw! 🤝";
            if (gameState.winner === getMySymbol()) return "You Won! 🎉";
            return "You Lost!";
        }
        if (isMyTurn()) return "YOUR TURN";
        return `Waiting for ${players[gameState.turn === X ? X : O]}...`; // show username
    };

    if (!gameState) return <div>Loading...</div>;

    return (
        <div style={{ textAlign: 'center', userSelect: 'none', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={() => onFinish(null)} style={{ marginBottom: '1rem', background: '#444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start' }}>Exit</button>

            <div style={{ position: 'absolute', top: 20, right: 20, textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', opacity: 0.9 }}>Session Score</h3>
                <div style={{ color: '#667eea', fontWeight: 'bold' }}>{players[X]}: {sessionWins[players[X]] || 0}</div>
                <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{players[O]}: {sessionWins[players[O]] || 0}</div>
            </div>

            <h2 style={{ color: isMyTurn() && !gameState.winner ? '#4CAF50' : 'white' }}>{getStatusMessage()}</h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 100px)',
                gap: '10px',
                padding: '20px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '16px',
                marginTop: '1rem'
            }}>
                {board.map((cell, index) => (
                    <div
                        key={index}
                        onClick={() => handleCellClick(index)}
                        style={{
                            width: '100px',
                            height: '100px',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            cursor: (!board[index] && isMyTurn() && !gameState.winner) ? 'pointer' : 'default',
                            color: cell === X ? '#667eea' : '#ff6b6b',
                            borderRadius: '8px'
                        }}
                    >
                        {cell}
                    </div>
                ))}
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
