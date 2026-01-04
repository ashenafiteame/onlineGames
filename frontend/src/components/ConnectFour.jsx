import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameService } from '../services/GameService';
import { MatchService } from '../services/MatchService';
import { AuthService } from '../services/AuthService';

const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const RED = 'red';
const YELLOW = 'yellow';

const createEmptyBoard = () =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));

const ConnectFour = ({ onFinish, highScore, matchId }) => {
    const [board, setBoard] = useState(createEmptyBoard());
    const [currentPlayer, setCurrentPlayer] = useState(RED);
    const [winner, setWinner] = useState(null);
    const [winningCells, setWinningCells] = useState([]);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [hoverColumn, setHoverColumn] = useState(null);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState([]);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    // Multiplayer state
    const [match, setMatch] = useState(null);
    const currentUser = AuthService.getCurrentUser();
    const isMultiplayer = !!matchId;
    const pollInterval = useRef(null);

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    // Multiplayer: Fetch match data
    const fetchMatch = useCallback(async () => {
        if (!matchId) return;
        try {
            const data = await MatchService.getMatch(matchId);
            setMatch(data);

            if (data.boardData) {
                const boardData = JSON.parse(data.boardData);
                setBoard(boardData);

                // Check for winner after board update
                const result = checkWinner(boardData);
                if (result && !winner) {
                    setWinner(result.winner);
                    setWinningCells(result.cells);
                }
            }

            // Determine current player based on turn
            if (data.currentTurn === data.player1.username) {
                setCurrentPlayer(RED);
            } else {
                setCurrentPlayer(YELLOW);
            }

            if (data.status === 'FORFEITED' && data.currentTurn === currentUser.username && !winner) {
                GameService.submitScore('connectfour', 300).then(user => {
                    setWinner(data.player1.username === currentUser.username ? RED : YELLOW);
                    setLastUpdatedUser(user);
                });
            }

            if (data.status === 'FINISHED' && !winner) {
                const boardData = JSON.parse(data.boardData);
                const result = checkWinner(boardData);
                if (result) {
                    setWinner(result.winner);
                    setWinningCells(result.cells);
                    // Loser or second player to detect finish gets participation XP if they haven't submitted yet
                    if (!lastUpdatedUser) {
                        const isWinner = result.winner === RED && data.player1.username === currentUser.username ||
                            result.winner === YELLOW && data.player2.username === currentUser.username;
                        const xp = isWinner ? 300 : (result.winner === 'draw' ? 100 : 50);
                        GameService.submitScore('connectfour', xp).then(user => setLastUpdatedUser(user));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching match:', error);
        }
    }, [matchId, currentUser, winner, onFinish]);

    useEffect(() => {
        if (isMultiplayer) {
            fetchMatch();
            pollInterval.current = setInterval(fetchMatch, 1000);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isMultiplayer, fetchMatch]);

    const checkWinner = (b) => {
        // Check horizontal
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (b[r][c] && b[r][c] === b[r][c + 1] && b[r][c] === b[r][c + 2] && b[r][c] === b[r][c + 3]) {
                    return { winner: b[r][c], cells: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]] };
                }
            }
        }

        // Check vertical
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c < COLS; c++) {
                if (b[r][c] && b[r][c] === b[r + 1][c] && b[r][c] === b[r + 2][c] && b[r][c] === b[r + 3][c]) {
                    return { winner: b[r][c], cells: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]] };
                }
            }
        }

        // Check diagonal (bottom-left to top-right)
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (b[r][c] && b[r][c] === b[r - 1][c + 1] && b[r][c] === b[r - 2][c + 2] && b[r][c] === b[r - 3][c + 3]) {
                    return { winner: b[r][c], cells: [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]] };
                }
            }
        }

        // Check diagonal (top-left to bottom-right)
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (b[r][c] && b[r][c] === b[r + 1][c + 1] && b[r][c] === b[r + 2][c + 2] && b[r][c] === b[r + 3][c + 3]) {
                    return { winner: b[r][c], cells: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]] };
                }
            }
        }

        // Check draw
        if (b[0].every(cell => cell !== EMPTY)) {
            return { winner: 'draw', cells: [] };
        }

        return null;
    };

    const getLowestEmptyRow = (b, col) => {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (b[r][col] === EMPTY) return r;
        }
        return -1;
    };

    const dropDisc = async (col) => {
        if (winner || isAIThinking) return;

        const row = getLowestEmptyRow(board, col);
        if (row === -1) return;

        // In multiplayer, check if it's our turn
        if (isMultiplayer && match) {
            const isMyTurn = match.currentTurn === currentUser.username;
            if (!isMyTurn) return;
        }

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;

        // Save to history before making move (only in solo mode)
        if (!isMultiplayer) {
            setHistory(prev => [...prev, { board: board.map(r => [...r]), player: currentPlayer }]);
        }

        setBoard(newBoard);

        const result = checkWinner(newBoard);

        if (isMultiplayer && match) {
            try {
                const nextTurn = match.player1.username === currentUser.username ? match.player2.username : match.player1.username;
                await MatchService.submitMove(matchId, JSON.stringify(newBoard), nextTurn);

                if (result) {
                    const isWinner = result.winner === RED && match.player1.username === currentUser.username ||
                        result.winner === YELLOW && match.player2.username === currentUser.username;

                    if (result.winner !== 'draw' && isWinner) {
                        await MatchService.finishMatch(matchId);
                        const xp = 300;
                        const user = await GameService.submitScore('connectfour', xp);
                        setScore(xp);
                        if (xp > localHighScore) setLocalHighScore(xp);
                        setLastUpdatedUser(user);
                    } else if (result.winner === 'draw') {
                        await MatchService.finishMatch(matchId);
                        const xp = 100;
                        const user = await GameService.submitScore('connectfour', xp);
                        setScore(xp);
                        setLastUpdatedUser(user);
                    }
                    setWinner(result.winner);
                    setWinningCells(result.cells);
                }
            } catch (error) {
                console.error('Error submitting move:', error);
            }
        } else {
            if (result) {
                setWinner(result.winner);
                setWinningCells(result.cells);
                if (result.winner === RED) {
                    const xp = 200;
                    setScore(xp);
                    GameService.submitScore('connectfour', xp).then(user => setLastUpdatedUser(user));
                    if (xp > localHighScore) setLocalHighScore(xp);
                }
            } else {
                // Save AI's pending move to history
                setHistory(prev => [...prev, { board: newBoard.map(r => [...r]), player: YELLOW }]);
                setCurrentPlayer(YELLOW);
                setIsAIThinking(true);
            }
        }
    };

    // AI Logic (Minimax with Alpha-Beta Pruning)
    const evaluateWindow = (window, player) => {
        const opponent = player === RED ? YELLOW : RED;
        const playerCount = window.filter(c => c === player).length;
        const opponentCount = window.filter(c => c === opponent).length;
        const emptyCount = window.filter(c => c === EMPTY).length;

        if (playerCount === 4) return 100;
        if (playerCount === 3 && emptyCount === 1) return 5;
        if (playerCount === 2 && emptyCount === 2) return 2;
        if (opponentCount === 3 && emptyCount === 1) return -4;
        return 0;
    };

    const scorePosition = (b, player) => {
        let score = 0;

        // Center column preference
        const centerCol = Math.floor(COLS / 2);
        const centerArray = b.map(row => row[centerCol]);
        score += centerArray.filter(c => c === player).length * 3;

        // Horizontal
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                const window = [b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3]];
                score += evaluateWindow(window, player);
            }
        }

        // Vertical
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r <= ROWS - 4; r++) {
                const window = [b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c]];
                score += evaluateWindow(window, player);
            }
        }

        // Diagonals
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                const window = [b[r][c], b[r + 1][c + 1], b[r + 2][c + 2], b[r + 3][c + 3]];
                score += evaluateWindow(window, player);
            }
        }
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                const window = [b[r][c], b[r - 1][c + 1], b[r - 2][c + 2], b[r - 3][c + 3]];
                score += evaluateWindow(window, player);
            }
        }

        return score;
    };

    const getValidColumns = (b) => {
        return Array.from({ length: COLS }, (_, i) => i).filter(c => b[0][c] === EMPTY);
    };

    const minimax = (b, depth, alpha, beta, maximizing) => {
        const result = checkWinner(b);
        const validCols = getValidColumns(b);

        if (result) {
            if (result.winner === YELLOW) return [null, 100000000];
            if (result.winner === RED) return [null, -100000000];
            return [null, 0];
        }

        if (depth === 0 || validCols.length === 0) {
            return [null, scorePosition(b, YELLOW)];
        }

        if (maximizing) {
            let value = -Infinity;
            let bestCol = validCols[Math.floor(Math.random() * validCols.length)];

            for (const col of validCols) {
                const row = getLowestEmptyRow(b, col);
                const newBoard = b.map(r => [...r]);
                newBoard[row][col] = YELLOW;
                const [, newScore] = minimax(newBoard, depth - 1, alpha, beta, false);
                if (newScore > value) {
                    value = newScore;
                    bestCol = col;
                }
                alpha = Math.max(alpha, value);
                if (alpha >= beta) break;
            }
            return [bestCol, value];
        } else {
            let value = Infinity;
            let bestCol = validCols[Math.floor(Math.random() * validCols.length)];

            for (const col of validCols) {
                const row = getLowestEmptyRow(b, col);
                const newBoard = b.map(r => [...r]);
                newBoard[row][col] = RED;
                const [, newScore] = minimax(newBoard, depth - 1, alpha, beta, true);
                if (newScore < value) {
                    value = newScore;
                    bestCol = col;
                }
                beta = Math.min(beta, value);
                if (alpha >= beta) break;
            }
            return [bestCol, value];
        }
    };

    const aiMove = useCallback(() => {
        if (winner || currentPlayer !== YELLOW || isMultiplayer) return;

        setTimeout(() => {
            const [bestCol] = minimax(board, 4, -Infinity, Infinity, true);
            if (bestCol !== null) {
                const row = getLowestEmptyRow(board, bestCol);
                if (row !== -1) {
                    const newBoard = board.map(r => [...r]);
                    newBoard[row][bestCol] = YELLOW;
                    setBoard(newBoard);

                    const result = checkWinner(newBoard);
                    if (result) {
                        setWinner(result.winner);
                        setWinningCells(result.cells);

                        // AI won or draw - give participation XP
                        if (result.winner === YELLOW) {
                            const xp = 50; // Participation XP for losing
                            setScore(xp);
                            GameService.submitScore('connectfour', xp);
                            if (xp > localHighScore) setLocalHighScore(xp);
                        } else if (result.winner === 'draw') {
                            const xp = 100; // Draw XP
                            setScore(xp);
                            GameService.submitScore('connectfour', xp);
                            if (xp > localHighScore) setLocalHighScore(xp);
                        }
                    } else {
                        setCurrentPlayer(RED);
                    }
                }
            }
            setIsAIThinking(false);
        }, 500);
    }, [board, winner, currentPlayer, isMultiplayer, localHighScore]);

    useEffect(() => {
        if (!isMultiplayer && currentPlayer === YELLOW && !winner) {
            aiMove();
        }
    }, [currentPlayer, winner, isMultiplayer, aiMove]);

    const resetGame = () => {
        setBoard(createEmptyBoard());
        setCurrentPlayer(RED);
        setWinner(null);
        setWinningCells([]);
        setIsAIThinking(false);
        setScore(0);
        setHistory([]);
        setLastUpdatedUser(null);
    };

    const handleUndo = () => {
        if (isMultiplayer || history.length === 0 || winner || isAIThinking) return;

        // In solo mode, undo both player's move and AI's response
        // Pop back to before the player's last move
        const stepsToUndo = history.length >= 2 ? 2 : 1;
        const newHistory = history.slice(0, -stepsToUndo);

        if (newHistory.length > 0) {
            const lastState = newHistory[newHistory.length - 1];
            setBoard(lastState.board);
            setCurrentPlayer(RED); // Always back to player's turn
        } else {
            setBoard(createEmptyBoard());
            setCurrentPlayer(RED);
        }

        setHistory(newHistory);
        setWinner(null);
        setWinningCells([]);
    };

    const isWinningCell = (r, c) => {
        return winningCells.some(([wr, wc]) => wr === r && wc === c);
    };

    const getPlayerColor = () => {
        if (!isMultiplayer) return RED;
        return match?.player1.username === currentUser.username ? RED : YELLOW;
    };

    const isMyTurn = () => {
        if (!isMultiplayer) return currentPlayer === RED;
        return match?.currentTurn === currentUser.username;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '20px',
            position: 'relative'
        }}>
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
            <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                Connect Four
            </h1>

            {/* Status */}
            <div style={{ marginBottom: '20px', fontSize: '20px' }}>
                {winner ? (
                    winner === 'draw' ? (
                        <span>It's a Draw! 🤝</span>
                    ) : (
                        <span style={{ color: winner === RED ? '#ff4444' : '#ffdd00' }}>
                            {winner === RED ? '🔴 Red' : '🟡 Yellow'} Wins! 🎉
                        </span>
                    )
                ) : isAIThinking ? (
                    <span>🤖 AI is thinking...</span>
                ) : isMultiplayer ? (
                    <span>
                        {isMyTurn() ? "Your turn!" : "Waiting for opponent..."}
                        {match && ` (You are ${getPlayerColor() === RED ? '🔴 Red' : '🟡 Yellow'})`}
                    </span>
                ) : (
                    <span style={{ color: currentPlayer === RED ? '#ff4444' : '#ffdd00' }}>
                        {currentPlayer === RED ? '🔴 Red' : '🟡 Yellow'}'s Turn
                    </span>
                )}
            </div>

            {/* Board */}
            <div style={{
                background: '#0052cc',
                padding: '15px',
                borderRadius: '15px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${COLS}, 70px)`,
                    gap: '8px'
                }}>
                    {Array.from({ length: COLS }, (_, col) => (
                        <div
                            key={`col-${col}`}
                            onMouseEnter={() => setHoverColumn(col)}
                            onMouseLeave={() => setHoverColumn(null)}
                            onClick={() => dropDisc(col)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                cursor: winner || isAIThinking || (isMultiplayer && !isMyTurn()) ? 'default' : 'pointer',
                                opacity: hoverColumn === col && !winner && !isAIThinking ? 1 : 0.9,
                                transition: 'opacity 0.2s'
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
                                                : hoverColumn === col && row === getLowestEmptyRow(board, col) && !winner && !isAIThinking && (!isMultiplayer || isMyTurn())
                                                    ? `radial-gradient(circle at 30% 30%, ${currentPlayer === RED ? '#ff666633' : '#ffff6633'}, transparent)`
                                                    : '#003399',
                                        boxShadow: isWinningCell(row, col)
                                            ? '0 0 20px 5px white'
                                            : 'inset 3px 3px 8px rgba(0,0,0,0.3)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scores */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px 25px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>SCORE</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px 25px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>BEST</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.max(score, localHighScore)}</div>
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button
                    onClick={resetGame}
                    style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '12px 30px',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    New Game
                </button>
                {!isMultiplayer && (
                    <button
                        onClick={handleUndo}
                        disabled={history.length === 0 || winner || isAIThinking}
                        style={{
                            background: history.length === 0 || winner || isAIThinking ? '#555' : '#ff9800',
                            color: 'white',
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '8px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: history.length === 0 || winner || isAIThinking ? 'not-allowed' : 'pointer',
                            opacity: history.length === 0 || winner || isAIThinking ? 0.5 : 1
                        }}
                    >
                        ↩ Undo
                    </button>
                )}
                {/* Removed Bottom Menu Button */}
            </div>

            {winner && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: winner === RED ? '#ff4444' : winner === YELLOW ? '#ffdd00' : 'white', marginTop: 0 }}>
                        {winner === 'draw' ? "It's a Draw!" : `${winner === RED ? 'Red' : 'Yellow'} Wins!`}
                    </h2>
                    {score > 0 && <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Score: {score}</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={resetGame} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>New Game</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectFour;
