import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../services/GameService';
import { AuthService } from '../services/AuthService';
import { MatchService } from '../services/MatchService';

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

export default function Chess({ onFinish, highScore, matchId }) {
    const currentUser = AuthService.getCurrentUser();
    const [match, setMatch] = useState(null);
    const [board, setBoard] = useState(initialBoard());
    const [selected, setSelected] = useState(null);
    const [turn, setTurn] = useState('white');
    const [validMoves, setValidMoves] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const [isMultiplayer] = useState(!!matchId);
    const [gameOver, setGameOver] = useState(false);
    const pollInterval = useRef(null);
    const aiThinking = useRef(false);

    function initialBoard() {
        return [
            [B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK],
            [B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN],
            [W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK]
        ];
    }

    const getMyColor = () => {
        if (!match) return 'white';
        return match.player1.username === currentUser.username ? 'white' : 'black';
    };

    const isMyTurn = () => {
        if (!isMultiplayer) return turn === 'white';
        if (!match) return false;
        return match.currentTurn === currentUser.username;
    };

    const shouldRotate = () => {
        if (!isMultiplayer || !match) return false;
        return getMyColor() === 'black';
    };

    const fetchMatch = async () => {
        if (!matchId) return;
        try {
            const data = await MatchService.getMatch(matchId);

            if (data.status === 'FORFEITED' && data.currentTurn === currentUser.username) {
                GameService.submitScore('chess', 500).then(user => {
                    alert('Your opponent resigned! You win! 🎉 (+500 XP)');
                    onFinish(user);
                }).catch(() => {
                    alert('Your opponent resigned! You win! 🎉');
                    onFinish(null);
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
            setTurn(data.currentTurn === data.player1.username ? 'white' : 'black');
        } catch (error) {
            console.error('Error polling match:', error);
        }
    };

    useEffect(() => {
        if (isMultiplayer) {
            if (!match) fetchMatch();
            pollInterval.current = setInterval(fetchMatch, 3000);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [matchId]);

    // Get all valid moves for a piece
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

        // Pawn moves
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
        // Knight moves
        else if (piece === W_KNIGHT || piece === B_KNIGHT) {
            [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                    const t = b[nr][nc];
                    if (t === EMPTY || isEnemy(piece, t)) moves.push({ r: nr, c: nc, capture: t !== EMPTY });
                }
            });
        }
        // Bishop moves
        else if (piece === W_BISHOP || piece === B_BISHOP) {
            addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
        }
        // Rook moves
        else if (piece === W_ROOK || piece === B_ROOK) {
            addSliding([[-1, 0], [1, 0], [0, -1], [0, 1]]);
        }
        // Queen moves
        else if (piece === W_QUEEN || piece === B_QUEEN) {
            addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
        }
        // King moves
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

    const checkGameOverOnBoard = (b) => {
        let whiteKing = false, blackKing = false;
        b.forEach(row => row.forEach(cell => {
            if (cell === W_KING) whiteKing = true;
            if (cell === B_KING) blackKing = true;
        }));
        return { whiteKing, blackKing, isOver: !whiteKing || !blackKing };
    };

    const handleGameOver = (whiteKing, blackKing) => {
        setGameOver(true);
        const won = (getMyColor() === 'white' && whiteKing) || (getMyColor() === 'black' && blackKing);
        const score = won ? 500 : 100;

        if (isMultiplayer) {
            GameService.submitScore('chess', score).then(user => {
                MatchService.finishMatch(matchId).then(() => {
                    alert(won ? "Checkmate! You Win! 🎉 (+500 XP)" : "Checkmate! You Lose! (+100 XP)");
                    onFinish(user);
                });
            }).catch(() => {
                MatchService.finishMatch(matchId).then(() => onFinish(null));
            });
        } else {
            GameService.submitScore('chess', whiteKing ? 500 : 50).then(user => {
                alert(whiteKing ? "You Win! 🎉" : "AI Wins! Better luck next time.");
                onFinish(user);
            });
        }
    };

    const applyMove = (b, fromR, fromC, toR, toC) => {
        const newBoard = b.map(row => [...row]);
        let piece = newBoard[fromR][fromC];

        // Pawn promotion
        if (piece === W_PAWN && toR === 0) piece = W_QUEEN;
        if (piece === B_PAWN && toR === 7) piece = B_QUEEN;

        newBoard[toR][toC] = piece;
        newBoard[fromR][fromC] = EMPTY;
        return newBoard;
    };

    const makePlayerMove = (fromR, fromC, toR, toC) => {
        const newBoard = applyMove(board, fromR, fromC, toR, toC);

        setBoard(newBoard);
        setSelected(null);
        setValidMoves([]);
        setLastMove({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
        setTurn('black');

        // Check for game over
        const { whiteKing, blackKing, isOver } = checkGameOverOnBoard(newBoard);
        if (isOver) {
            handleGameOver(whiteKing, blackKing);
            return;
        }

        if (isMultiplayer && match) {
            const nextPlayer = match.player2.username;
            MatchService.submitMove(matchId, JSON.stringify(newBoard), nextPlayer).catch(console.error);
        } else {
            // Trigger AI move after a delay
            setTimeout(() => aiMove(newBoard), 600);
        }
    };

    const aiMove = (currentBoard) => {
        if (aiThinking.current || gameOver) return;
        aiThinking.current = true;

        // Collect all possible moves for black
        const allMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isBlackPiece(currentBoard[r][c])) {
                    const moves = getValidMoves(r, c, currentBoard);
                    moves.forEach(m => allMoves.push({ fromR: r, fromC: c, ...m }));
                }
            }
        }

        if (allMoves.length === 0) {
            GameService.submitScore('chess', 500).then(user => {
                alert("No moves left! You Win!");
                onFinish(user);
            });
            aiThinking.current = false;
            return;
        }

        // Prioritize captures
        const captures = allMoves.filter(m => m.capture);
        let move;
        if (captures.length > 0) {
            move = captures[Math.floor(Math.random() * captures.length)];
        } else {
            move = allMoves[Math.floor(Math.random() * allMoves.length)];
        }

        const newBoard = applyMove(currentBoard, move.fromR, move.fromC, move.r, move.c);

        setBoard(newBoard);
        setLastMove({ from: { r: move.fromR, c: move.fromC }, to: { r: move.r, c: move.c } });
        setTurn('white');

        // Check for game over
        const { whiteKing, blackKing, isOver } = checkGameOverOnBoard(newBoard);
        if (isOver) {
            handleGameOver(whiteKing, blackKing);
        }

        aiThinking.current = false;
    };

    const handleSquareClick = (r, c) => {
        if (gameOver) return;
        if (!isMultiplayer && turn === 'black') return; // AI's turn
        if (isMultiplayer && !isMyTurn()) return;

        const piece = board[r][c];
        const myPiece = turn === 'white' ? isWhitePiece(piece) : isBlackPiece(piece);

        if (selected) {
            const move = validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                if (isMultiplayer) {
                    // Multiplayer move
                    const newBoard = applyMove(board, selected.r, selected.c, r, c);
                    setBoard(newBoard);
                    setSelected(null);
                    setValidMoves([]);
                    setLastMove({ from: { r: selected.r, c: selected.c }, to: { r, c } });

                    const nextTurn = turn === 'white' ? 'black' : 'white';
                    setTurn(nextTurn);

                    const { whiteKing, blackKing, isOver } = checkGameOverOnBoard(newBoard);
                    if (isOver) {
                        handleGameOver(whiteKing, blackKing);
                        return;
                    }

                    const nextPlayer = turn === 'white' ? match.player2.username : match.player1.username;
                    MatchService.submitMove(matchId, JSON.stringify(newBoard), nextPlayer).catch(console.error);
                } else {
                    makePlayerMove(selected.r, selected.c, r, c);
                }
            } else if (myPiece) {
                setSelected({ r, c });
                setValidMoves(getValidMoves(r, c, board));
            } else {
                setSelected(null);
                setValidMoves([]);
            }
        } else if (myPiece) {
            setSelected({ r, c });
            setValidMoves(getValidMoves(r, c, board));
        }
    };

    const handleForfeit = () => {
        if (!window.confirm('Resign this game? Your opponent wins.')) return;
        GameService.submitScore('chess', 50).then(user => {
            MatchService.forfeitMatch(matchId).then(() => {
                alert('You resigned. (+50 XP)');
                onFinish(user);
            });
        }).catch(() => {
            MatchService.forfeitMatch(matchId).then(() => onFinish(null));
        });
    };

    return (
        <div style={{ textAlign: 'center', userSelect: 'none' }}>
            <h2>♚ Chess {isMultiplayer ? '(Multiplayer)' : '(vs AI)'}</h2>
            {isMultiplayer && match && (
                <p style={{ color: '#888' }}>
                    Playing vs <strong>{match.player1.username === currentUser.username ? match.player2.username : match.player1.username}</strong>
                </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                <div style={{ color: turn === 'white' ? '#fff' : '#666', fontWeight: turn === 'white' ? 'bold' : 'normal' }}>
                    ⚪ White {isMultiplayer && match?.player1.username === currentUser?.username ? '(You)' : !isMultiplayer ? '(You)' : ''}
                </div>
                <div style={{ color: turn === 'black' ? '#fff' : '#666', fontWeight: turn === 'black' ? 'bold' : 'normal' }}>
                    ⚫ Black {isMultiplayer && match?.player2.username === currentUser?.username ? '(You)' : !isMultiplayer ? '(AI)' : ''}
                </div>
            </div>

            {!isMultiplayer && turn === 'black' && (
                <div style={{ color: 'var(--primary)', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                    AI is thinking...
                </div>
            )}

            {isMultiplayer && !isMyTurn() && (
                <div style={{ color: 'var(--primary)', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                    Waiting for opponent...
                </div>
            )}

            {isMultiplayer && match?.status === 'ACTIVE' && (
                <button onClick={handleForfeit} style={{ marginBottom: '1rem', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', fontSize: '0.8rem', padding: '6px 12px' }}>
                    🏳️ Resign
                </button>
            )}

            <div style={{
                display: 'inline-block', padding: '12px', background: '#3d2817', borderRadius: '12px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                transform: shouldRotate() ? 'rotate(180deg)' : 'none'
            }}>
                {board.map((row, r) => (
                    <div key={r} style={{ display: 'flex' }}>
                        {row.map((cell, c) => {
                            const isLight = (r + c) % 2 === 0;
                            const isValid = validMoves.some(m => m.r === r && m.c === c);
                            const isSel = selected?.r === r && selected?.c === c;
                            const isLastMove = lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c));

                            // Determine background color
                            let bgColor;
                            if (isSel) {
                                bgColor = '#7B68EE';
                            } else if (isLastMove) {
                                bgColor = isLight ? '#F6F669' : '#BACA2B';
                            } else {
                                bgColor = isLight ? '#EEEED2' : '#769656';
                            }

                            return (
                                <div
                                    key={c}
                                    onClick={() => handleSquareClick(r, c)}
                                    style={{
                                        width: '65px', height: '65px',
                                        background: bgColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', position: 'relative',
                                        fontSize: '3rem',
                                        transform: shouldRotate() ? 'rotate(180deg)' : 'none',
                                        transition: 'background 0.15s'
                                    }}
                                >
                                    {isValid && (
                                        <div style={{
                                            position: 'absolute', width: '22px', height: '22px',
                                            borderRadius: '50%', background: 'rgba(0,180,0,0.6)',
                                            border: '2px solid rgba(0,200,0,0.8)'
                                        }} />
                                    )}
                                    {cell !== EMPTY && (
                                        <span style={{
                                            color: isWhitePiece(cell) ? '#FFFFFF' : '#1a1a1a',
                                            textShadow: isWhitePiece(cell)
                                                ? '2px 2px 4px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000'
                                                : '2px 2px 4px rgba(255,255,255,0.5), 0 0 8px rgba(255,255,255,0.3)',
                                            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))'
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

            <div style={{ marginTop: '1.5rem' }}>
                <button onClick={() => onFinish(null)} style={{ background: '#444' }}>
                    Back to Library
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
