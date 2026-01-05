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
                <div style={{ marginTop: '2rem' }}>
                    <button onClick={() => onFinish(null)} style={{ padding: '12px 24px', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                </div>
            )}
        </div>
    );
}
