import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../services/GameService';
import { AuthService } from '../services/AuthService';
import { MatchService } from '../services/MatchService';

const RED_PLAYER = 1;
const WHITE_PLAYER = 2;
const RED_KING = 3;
const WHITE_KING = 4;

export default function Checkers({ onFinish, highScore, matchId }) {
    const currentUser = AuthService.getCurrentUser();
    const [match, setMatch] = useState(null);
    const [variant, setVariant] = useState('standard');
    const [isMultiplayer, setIsMultiplayer] = useState(!!matchId);
    const [gameStarted, setGameStarted] = useState(!!matchId);

    // We need to define initialBoard before usage if it wasn't hoisted, but function keyword hoists.
    // However, to be safe and clean, we can rely on the fact it is defined below.
    const [board, setBoard] = useState(initialBoard());
    const [selected, setSelected] = useState(null);
    const [turn, setTurn] = useState(RED_PLAYER);
    const [validMoves, setValidMoves] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [gameOverResult, setGameOverResult] = useState(null);
    const pollInterval = useRef(null); useEffect(() => {
        if (!isMultiplayer && !gameStarted) {
            // Wait for user to select variant
        }
    }, [isMultiplayer, gameStarted]);

    function initialBoard(v = 'standard') {
        const size = v === 'international' ? 10 : 8;
        const b = Array(size).fill(null).map(() => Array(size).fill(0));
        const rows = size;
        // Place pieces
        // Standard/Russian (8x8): 3 rows (12 pieces)
        // International (10x10): 4 rows (20 pieces)
        const piecesRows = v === 'international' ? 4 : 3;

        for (let r = 0; r < piecesRows; r++) {
            for (let c = 0; c < size; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = WHITE_PLAYER;
            }
        }
        for (let r = rows - piecesRows; r < rows; r++) {
            for (let c = 0; c < size; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = RED_PLAYER;
            }
        }
        return b;
    }

    const startGame = (selectedVariant) => {
        setVariant(selectedVariant);
        setBoard(initialBoard(selectedVariant));
        setGameStarted(true);
        setTurn(RED_PLAYER);
    };

    const isKing = (piece) => piece === RED_KING || piece === WHITE_KING;
    const isRed = (piece) => piece === RED_PLAYER || piece === RED_KING;
    const isWhite = (piece) => piece === WHITE_PLAYER || piece === WHITE_KING;

    // Helpers for rules
    const isInternational = () => variant === 'international';
    const isRussian = () => variant === 'russian';
    const isFlyingKing = () => isRussian() || isInternational();
    const menCanCaptureBackward = () => isRussian() || isInternational();
    const isOpponent = (myPiece, targetPiece) => {
        if (isRed(myPiece)) return isWhite(targetPiece);
        if (isWhite(myPiece)) return isRed(targetPiece);
        return false;
    };
    const hasMandatoryCapture = () => isRussian() || isInternational();

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
                    const pieceMoves = getMoves(r, c, b, playerColor);
                    if (pieceMoves.some(m => m.capture)) return true;
                }
            }
        }
        return false;
    };

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

    // Rotate board logic...
    const shouldRotate = () => {
        if (!isMultiplayer || !match) return false;
        return getMyColor() === WHITE_PLAYER;
    };

    const fetchMatch = async () => {
        if (!matchId) return;
        try {
            const data = await MatchService.getMatch(matchId);
            if (data.status === 'FORFEITED' && data.currentTurn === currentUser.username) {
                GameService.submitScore('checkers', 500).then(user => {
                    setLastUpdatedUser(user);
                    setGameOver(true);
                    setGameOverResult({ won: true, message: 'Your opponent resigned! You win! 🎉' });
                });
                return;
            }
            if (data.status === 'FINISHED') {
                alert('This match has ended.');
                onFinish(null);
                return;
            }
            setMatch(data);
            setBoard(JSON.parse(data.boardData));
            setTurn(data.currentTurn === data.player1.username ? RED_PLAYER : WHITE_PLAYER);
            // Detect variant from board size? Or stored metadata?
            // Legacy match system might not support variants. Default to standard if 8x8.
            const boardData = JSON.parse(data.boardData);
            if (boardData.length === 10) setVariant('international');
            else setVariant('standard'); // No way to distinguish Russian in legacy match yet without updates
        } catch (error) {
            console.error('Error polling match:', error);
        }
    };

    // ...useEffect for polling...

    const getMoves = (r, c, b, currentTurn) => {
        const moves = [];
        const piece = b[r][c];
        if (piece === 0) return moves;
        const size = b.length;

        // Flying King Logic
        if (isKing(piece) && isFlyingKing()) {
            const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

            // Moves
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
                        if (foundOpponent) moves.push({ r: nr, c: nc, capture: capturePos });
                    } else {
                        if (foundOpponent) break;
                        if (isOpponent(piece, cell)) {
                            foundOpponent = true;
                            capturePos = { r: nr, c: nc };
                        } else {
                            break;
                        }
                    }
                    d++;
                }
            });
            return moves;
        }

        // Standard Logic
        const moveDirs = [];
        const captureDirs = [];

        if (isKing(piece)) {
            const allDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            moveDirs.push(...allDirs);
            captureDirs.push(...allDirs);
        } else {
            if (isRed(piece)) {
                moveDirs.push([-1, -1], [-1, 1]);
                captureDirs.push([-1, -1], [-1, 1]);
                if (menCanCaptureBackward()) captureDirs.push([1, -1], [1, 1]);
            } else if (isWhite(piece)) {
                moveDirs.push([1, -1], [1, 1]);
                captureDirs.push([1, -1], [1, 1]);
                if (menCanCaptureBackward()) captureDirs.push([-1, -1], [-1, 1]);
            }
        }

        moveDirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && b[nr][nc] === 0) {
                moves.push({ r: nr, c: nc, capture: null });
            }
        });

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
        const myColor = getMyColor();
        if ((isRed(piece) && myColor === RED_PLAYER) || (isWhite(piece) && myColor === WHITE_PLAYER)) {
            let moves = getMoves(r, c, board, turn);

            // Enforce mandatory capture: if any capture is available for this player, only allow captures
            if (hasMandatoryCapture() && anyCaptureAvailable(board, myColor)) {
                // Check if THIS piece has a capture
                const thisHasCapture = moves.some(m => m.capture);
                if (thisHasCapture) {
                    // Only show capture moves for this piece
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
        const newBoard = board.map(row => [...row]);
        const size = newBoard.length;
        let piece = newBoard[fromR][fromC];

        // Apply Move
        newBoard[toR][toC] = piece;
        newBoard[fromR][fromC] = 0;
        if (capture) newBoard[capture.r][capture.c] = 0;

        // Promotion Logic
        let promoted = false;
        if (piece === RED_PLAYER && toR === 0) {
            piece = RED_KING;
            newBoard[toR][toC] = piece;
            promoted = true;
        }
        if (piece === WHITE_PLAYER && toR === size - 1) {
            piece = WHITE_KING;
            newBoard[toR][toC] = piece;
            promoted = true;
        }

        // Multi-jump Check
        let possibleNextMoves = [];
        if (capture) {
            if (promoted) {
                if (isRussian()) {
                    possibleNextMoves = getMoves(toR, toC, newBoard, turn).filter(m => m.capture);
                } else {
                    possibleNextMoves = [];
                }
            } else {
                possibleNextMoves = getMoves(toR, toC, newBoard, turn).filter(m => m.capture);
            }
        }

        const multiJump = possibleNextMoves.length > 0;

        if (isMultiplayer) {
            // ... (keep existing multiplayer logic but ensure it sends newBoard correctly)
            const nextTurnUsername = multiJump ? currentUser.username : (match.player1.username === currentUser.username ? match.player2.username : match.player1.username);
            // ...
            try {
                const updatedMatch = await MatchService.submitMove(matchId, JSON.stringify(newBoard), nextTurnUsername);
                setMatch(updatedMatch);
                setBoard(newBoard);
                setLastMove({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
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
            // Local AI
            setBoard(newBoard);
            setLastMove({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
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
        const size = board.length;
        let allMoves = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (isWhite(board[r][c])) {
                    const moves = getMoves(r, c, board, WHITE_PLAYER);
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
                GameService.submitScore('checkers', score).then(user => {
                    setLastUpdatedUser(user);
                    MatchService.finishMatch(matchId);
                    setGameOver(true);
                    setGameOverResult({ won, message: won ? "You Won the Match! 🎉" : "Opponent Won! Good game." });
                }).catch(err => {
                    console.error('Failed to submit score:', err);
                    MatchService.finishMatch(matchId);
                    setGameOver(true);
                    setGameOverResult({ won, message: won ? "You Won the Match! 🎉" : "Opponent Won! Good game." });
                });
            } else {
                GameService.submitScore('checkers', redCount > 0 ? 500 : 50).then(user => {
                    setLastUpdatedUser(user);
                    setGameOver(true);
                    setGameOverResult({ won: redCount > 0, message: redCount > 0 ? "You Won! 🎉" : "AI Won! Better luck next time." });
                });
            }
        }
    };

    const handleForfeit = () => {
        if (!window.confirm('Are you sure you want to resign? Your opponent will win the match.')) return;
        GameService.submitScore('checkers', 50).then(user => {
            setLastUpdatedUser(user);
            MatchService.forfeitMatch(matchId);
            setGameOver(true);
            setGameOverResult({ won: false, message: 'You resigned. Your opponent wins!' });
        }).catch(err => {
            console.error('Failed to submit score:', err);
            MatchService.forfeitMatch(matchId);
            setGameOver(true);
            setGameOverResult({ won: false, message: 'You resigned. Your opponent wins!' });
        });
    };

    const handleRestart = () => {
        if (!isMultiplayer) {
            // Restart with the same variant
            setBoard(initialBoard(variant));
            setTurn(RED_PLAYER);
            setSelected(null);
            setValidMoves([]);
            setLastMove(null);
            setGameOver(false);
            setGameOverResult(null);
            setLastUpdatedUser(null);
        }
    };

    return (
        <div style={{ textAlign: 'center', userSelect: 'none', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
            <h2 style={{ marginBottom: '1rem' }}>🏁 Checkers {isMultiplayer ? '(Multiplayer)' : '(Solo vs AI)'}</h2>

            {!isMultiplayer && !gameStarted ? (
                <div style={{ background: '#444', padding: '2rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'white' }}>Select Game Mode</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button onClick={() => startGame('standard')} style={{ padding: '12px', fontSize: '1.1rem', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Standard (8x8)</button>
                        <button onClick={() => startGame('international')} style={{ padding: '12px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>International (10x10)</button>
                        <button onClick={() => startGame('russian')} style={{ padding: '12px', fontSize: '1.1rem', background: '#1976D2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Russian (8x8)</button>
                    </div>
                </div>
            ) : (
                <>
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

                    {isMultiplayer && match && match.status === 'ACTIVE' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <button
                                onClick={handleForfeit}
                                style={{
                                    background: 'rgba(255,107,107,0.1)',
                                    color: '#ff6b6b',
                                    border: '1px solid rgba(255,107,107,0.3)',
                                    fontSize: '0.8rem',
                                    padding: '6px 12px'
                                }}
                            >
                                🏳️ Resign
                            </button>
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
                                    const isLastMove = lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c));

                                    let bgColor;
                                    if (isBlackSquare) {
                                        bgColor = isLastMove ? '#8B7355' : '#222';
                                    } else {
                                        bgColor = '#eee';
                                    }

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
                </>
            )}

            {gameOver && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: gameOverResult?.won ? '#42d392' : '#ff6b6b', marginTop: 0 }}>
                        {gameOverResult?.won ? "VICTORY! 🎉" : "GAME OVER"}
                    </h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
                        {gameOverResult?.message}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {!isMultiplayer && (
                            <button onClick={handleRestart} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>Play Again</button>
                        )}
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}

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

