import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../services/GameService';
import { AuthService } from '../services/AuthService';
import { MatchService } from '../services/MatchService';

const EMPTY = null;
const X = 'X';
const O = 'O';

export default function TicTacToe({ onFinish, highScore, matchId, onRematch }) {
    const currentUser = AuthService.getCurrentUser();
    const [match, setMatch] = useState(null);
    const [board, setBoard] = useState(Array(9).fill(EMPTY));
    const [turn, setTurn] = useState(X);
    const [winner, setWinner] = useState(null);
    const [winLine, setWinLine] = useState(null);
    const [isMultiplayer] = useState(!!matchId);
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    // Rematch states: null (idle), 'sending', 'waiting' (sent, waiting for accept), 'invited' (received invite)
    const [rematchStatus, setRematchStatus] = useState(null);
    const [pendingRematchId, setPendingRematchId] = useState(null);

    const pollInterval = useRef(null);
    const rematchPollRef = useRef(null);

    const WINNING_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const getMySymbol = () => {
        if (!match) return X;
        return match.player1.username === currentUser.username ? X : O;
    };

    const isMyTurn = () => {
        if (!isMultiplayer) return turn === X;
        if (!match) return false;
        return match.currentTurn === currentUser.username;
    };

    const fetchMatch = async () => {
        if (!matchId) return;
        try {
            const data = await MatchService.getMatch(matchId);

            if (data.status === 'FORFEITED' && data.currentTurn === currentUser.username) {
                GameService.submitScore('tictactoe', 300).then(user => {
                    alert('Your opponent resigned! You win! 🎉 (+300 XP)');
                    onFinish(user);
                }).catch(() => {
                    alert('Your opponent resigned! You win! 🎉');
                    onFinish(null);
                });
                return;
            }

            if (data.status === 'FINISHED' && !winner) {
                setMatch(data);
            }

            setMatch(data);
            const boardData = JSON.parse(data.boardData);
            setBoard(boardData);
            setTurn(data.currentTurn === data.player1.username ? X : O);

            // Check for winner on fetched board
            const detectedResult = checkWinner(boardData);

            if (data.status === 'FINISHED' && !detectedResult && !showRestartModal) {
                if (boardData.every(c => c !== null)) {
                    setWinner('draw');
                }
            }
        } catch (error) {
            console.error('Error polling match:', error);
        }
    };

    useEffect(() => {
        if (isMultiplayer) {
            if (!match) fetchMatch();
            pollInterval.current = setInterval(fetchMatch, 1000);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [matchId]);

    // Poll for rematch updates when modal is open in multiplayer
    useEffect(() => {
        if (showRestartModal && isMultiplayer) {
            rematchPollRef.current = setInterval(async () => {
                // Case 1: We sent an invite, waiting for acceptance
                if (rematchStatus === 'waiting' && pendingRematchId) {
                    try {
                        const m = await MatchService.getMatch(pendingRematchId);
                        if (m.status === 'ACTIVE') {
                            onRematch(m.id);
                        }
                    } catch (e) { console.error(e); }
                }
                // Case 2: We are idle, waiting for invite from opponent
                else if (!rematchStatus) {
                    try {
                        const myMatches = await MatchService.getMyMatches();
                        const opponent = match.player1.username === currentUser.username ? match.player2.username : match.player1.username;

                        // Look for a PENDING invite from the opponent for TicTacToe
                        const invite = myMatches.find(m =>
                            m.status === 'PENDING' &&
                            m.player1.username === opponent &&
                            m.gameType === 'tictactoe'
                        );

                        if (invite) {
                            setPendingRematchId(invite.id);
                            setRematchStatus('invited');
                        }
                    } catch (e) { console.error(e); }
                }
            }, 2000);
        }
        return () => {
            if (rematchPollRef.current) clearInterval(rematchPollRef.current);
        };
    }, [showRestartModal, rematchStatus, pendingRematchId, match?.player1, match?.player2, currentUser, isMultiplayer, onRematch]); // Dependencies crucial here

    // Trigger Game Over modal when winner is determined
    useEffect(() => {
        if (winner && !showRestartModal) {
            // Wait a small moment to let user see the final move
            const timer = setTimeout(() => {
                setShowRestartModal(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [winner, showRestartModal]);

    const checkWinner = (b) => {
        for (const [a, bIdx, c] of WINNING_LINES) {
            if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
                setWinner(b[a]);
                setWinLine([a, bIdx, c]);
                return b[a];
            }
        }
        if (b.every(cell => cell !== EMPTY)) {
            setWinner('draw');
            return 'draw';
        }
        return null;
    };

    const handleGameOver = (result) => {
        // Just submit scores here, the useEffect handles the modal
        if (result === 'draw') {
            GameService.submitScore('tictactoe', 100).then((user) => {
                setLastUpdatedUser(user);
                if (isMultiplayer) MatchService.finishMatch(matchId);
            });
        } else {
            const mySymbol = isMultiplayer ? getMySymbol() : X;
            const won = result === mySymbol;
            const score = won ? 300 : 50;

            GameService.submitScore('tictactoe', score).then((user) => {
                setLastUpdatedUser(user);
                // Only the winner needs to signal finish in MP to avoid race, but it's safe if both do
                if (isMultiplayer) MatchService.finishMatch(matchId);
            }).catch(() => {
                // Ignore error if score already submitted
            });
        }
    };

    const makeMove = (index) => {
        if (board[index] !== EMPTY || winner) return;
        if (isMultiplayer && !isMyTurn()) return;
        if (!isMultiplayer && turn !== X) return;

        const newBoard = [...board];
        newBoard[index] = turn;
        setBoard(newBoard);

        const result = checkWinner(newBoard);
        if (result) {
            handleGameOver(result);
            return;
        }

        const nextTurn = turn === X ? O : X;
        setTurn(nextTurn);

        if (isMultiplayer && match) {
            const nextPlayer = turn === X ? match.player2.username : match.player1.username;
            MatchService.submitMove(matchId, JSON.stringify(newBoard), nextPlayer).catch(console.error);
        } else if (!isMultiplayer) {
            // AI move
            setTimeout(() => aiMove(newBoard), 400);
        }
    };

    const aiMove = (currentBoard) => {
        if (winner) return;

        // Try to win
        for (const [a, b, c] of WINNING_LINES) {
            const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
            if (line.filter(x => x === O).length === 2 && line.includes(EMPTY)) {
                const idx = [a, b, c][line.indexOf(EMPTY)];
                finishAiMove(currentBoard, idx);
                return;
            }
        }

        // Block player from winning
        for (const [a, b, c] of WINNING_LINES) {
            const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
            if (line.filter(x => x === X).length === 2 && line.includes(EMPTY)) {
                const idx = [a, b, c][line.indexOf(EMPTY)];
                finishAiMove(currentBoard, idx);
                return;
            }
        }

        // Take center if available
        if (currentBoard[4] === EMPTY) {
            finishAiMove(currentBoard, 4);
            return;
        }

        // Take a corner
        const corners = [0, 2, 6, 8].filter(i => currentBoard[i] === EMPTY);
        if (corners.length > 0) {
            finishAiMove(currentBoard, corners[Math.floor(Math.random() * corners.length)]);
            return;
        }

        // Take any available
        const available = currentBoard.map((c, i) => c === EMPTY ? i : null).filter(i => i !== null);
        if (available.length > 0) {
            finishAiMove(currentBoard, available[Math.floor(Math.random() * available.length)]);
        }
    };

    const finishAiMove = (currentBoard, index) => {
        const newBoard = [...currentBoard];
        newBoard[index] = O;
        setBoard(newBoard);
        setTurn(X);

        const result = checkWinner(newBoard);
        if (result) {
            handleGameOver(result);
        }
    };

    const handleForfeit = () => {
        if (!window.confirm('Resign this game? Your opponent wins.')) return;
        GameService.submitScore('tictactoe', 25).then(user => {
            MatchService.forfeitMatch(matchId).then(() => {
                alert('You resigned. (+25 XP)');
                onFinish(user);
            });
        }).catch(() => {
            MatchService.forfeitMatch(matchId).then(() => onFinish(null));
        });
    };

    const handlePlayAgain = async () => {
        if (isMultiplayer) {
            setRematchStatus('sending');
            try {
                const opponent = match.player1.username === currentUser.username ? match.player2.username : match.player1.username;

                // 1. Check if opponent ALREADY sent us an invite (race condition handling)
                const myMatches = await MatchService.getMyMatches();
                const existingInvite = myMatches.find(m =>
                    m.status === 'PENDING' &&
                    m.player1.username === opponent &&
                    m.gameType === 'tictactoe'
                );

                if (existingInvite) {
                    // They beat us to it! Just accept theirs.
                    await MatchService.acceptMatch(existingInvite.id);
                    onRematch(existingInvite.id);
                    return;
                }

                // 2. No invite found, send ours
                const emptyBoard = Array(9).fill(null);
                const newMatch = await MatchService.invite(opponent, JSON.stringify(emptyBoard), 'tictactoe');
                setRematchStatus('waiting');
                setPendingRematchId(newMatch.id);
            } catch (err) {
                alert("Failed to initiate rematch: " + err.message);
                setRematchStatus(null);
            }
        } else {
            // Reset local game
            setBoard(Array(9).fill(EMPTY));
            setTurn(X);
            setWinner(null);
            setWinLine(null);
            setShowRestartModal(false);
            setLastUpdatedUser(null);
        }
    };

    const handleAcceptRematch = () => {
        if (pendingRematchId) {
            MatchService.acceptMatch(pendingRematchId)
                .then(m => {
                    onRematch(m.id);
                })
                .catch(err => alert("Failed to accept: " + err.message));
        }
    };

    const getCellStyle = (index) => {
        const isWinCell = winLine && winLine.includes(index);
        return {
            width: '100px',
            height: '100px',
            background: isWinCell ? 'rgba(66, 211, 146, 0.3)' : 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3.5rem',
            fontWeight: 'bold',
            cursor: board[index] === EMPTY && !winner ? 'pointer' : 'default',
            transition: 'all 0.2s',
            color: board[index] === X ? '#667eea' : '#ff6b6b'
        };
    };

    return (
        <div style={{ textAlign: 'center', userSelect: 'none', position: 'relative' }}>
            <button
                onClick={() => onFinish(null)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    zIndex: 100,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                Exit
            </button>
            <h2 style={{ marginBottom: '0.5rem' }}>❌⭕ Tic-Tac-Toe {isMultiplayer ? '(Multiplayer)' : '(vs AI)'}</h2>

            {isMultiplayer && match && (
                <p style={{ color: '#888', marginBottom: '1rem' }}>
                    Playing vs <strong>{match.player1.username === currentUser.username ? match.player2.username : match.player1.username}</strong>
                </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                <div style={{
                    color: turn === X ? '#667eea' : '#666',
                    fontWeight: turn === X ? 'bold' : 'normal',
                    fontSize: '1.2rem'
                }}>
                    ❌ {isMultiplayer && match?.player1.username === currentUser?.username ? '(You)' : !isMultiplayer ? '(You)' : match?.player1.username}
                </div>
                <div style={{
                    color: turn === O ? '#ff6b6b' : '#666',
                    fontWeight: turn === O ? 'bold' : 'normal',
                    fontSize: '1.2rem'
                }}>
                    ⭕ {isMultiplayer && match?.player2.username === currentUser?.username ? '(You)' : !isMultiplayer ? '(AI)' : match?.player2.username}
                </div>
            </div>

            {!winner && !isMyTurn() && isMultiplayer && (
                <div style={{ color: 'var(--primary)', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                    Waiting for opponent...
                </div>
            )}

            {!winner && !isMultiplayer && turn === O && (
                <div style={{ color: 'var(--primary)', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                    AI is thinking...
                </div>
            )}

            {isMultiplayer && match?.status === 'ACTIVE' && !winner && (
                <button onClick={handleForfeit} style={{
                    marginBottom: '1rem',
                    background: 'rgba(255,107,107,0.1)',
                    color: '#ff6b6b',
                    border: '1px solid rgba(255,107,107,0.3)',
                    fontSize: '0.8rem',
                    padding: '6px 12px'
                }}>
                    🏳️ Resign
                </button>
            )}

            <div style={{
                display: 'inline-grid',
                gridTemplateColumns: 'repeat(3, 100px)',
                gap: '10px',
                padding: '20px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
                {board.map((cell, index) => (
                    <div
                        key={index}
                        onClick={() => makeMove(index)}
                        style={getCellStyle(index)}
                        onMouseEnter={(e) => {
                            if (board[index] === EMPTY && !winner) {
                                e.target.style.background = 'rgba(255,255,255,0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!winLine?.includes(index)) {
                                e.target.style.background = 'rgba(255,255,255,0.05)';
                            }
                        }}
                    >
                        {cell}
                    </div>
                ))}
            </div>

            {winner && !showRestartModal && (
                <div style={{
                    marginTop: '1.5rem',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: winner === 'draw' ? '#888' : winner === getMySymbol() ? '#42d392' : '#ff6b6b'
                }}>
                    {winner === 'draw' ? "It's a Draw! 🤝" :
                        winner === (isMultiplayer ? getMySymbol() : X) ? "You Win! 🎉" : "You Lose!"}
                </div>
            )}

            {/* Restart Modal */}
            {showRestartModal && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: '#1a1a1a', padding: '2rem', borderRadius: '16px', zIndex: 101,
                        border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', minWidth: '300px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            {winner === 'draw' ? "🤝" : winner === (isMultiplayer ? getMySymbol() : X) ? "🏆" : "💀"}
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem 0', color: winner === 'draw' ? '#fff' : winner === (isMultiplayer ? getMySymbol() : X) ? '#42d392' : '#ff6b6b' }}>
                            {winner === 'draw' ? "It's a Draw!" :
                                winner === (isMultiplayer ? getMySymbol() : X) ? "You Won!" : "You Lost!"}
                        </h2>
                        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                            {winner === (isMultiplayer ? getMySymbol() : X) ? "+300 XP Earned" : winner === 'draw' ? "+100 XP Earned" : "+50 XP Earned"}
                        </p>

                        {/* Rematch Status Message */}
                        {rematchStatus === 'waiting' && (
                            <div style={{ marginBottom: '1rem', color: '#667eea', animation: 'pulse 1s infinite' }}>
                                Searching for opponent...
                            </div>
                        )}
                        {rematchStatus === 'invited' && (
                            <div style={{ marginBottom: '1rem', color: '#42d392', fontWeight: 'bold' }}>
                                Opponent wants a rematch!
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => onFinish(lastUpdatedUser)}
                                style={{ padding: '12px 24px', background: '#444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Back to Library
                            </button>

                            {rematchStatus === 'invited' ? (
                                <button
                                    onClick={handleAcceptRematch}
                                    style={{ padding: '12px 24px', background: '#42d392', border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Accept Rematch ✅
                                </button>
                            ) : (
                                <button
                                    onClick={handlePlayAgain}
                                    disabled={rematchStatus === 'waiting' || rematchStatus === 'sending'}
                                    style={{
                                        padding: '12px 24px',
                                        background: rematchStatus === 'waiting' ? '#666' : 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: rematchStatus === 'waiting' ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isMultiplayer ? (rematchStatus === 'waiting' ? 'Sent...' : 'Rematch ⚔️') : 'Play Again 🔄'}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Removed Bottom Button */}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
