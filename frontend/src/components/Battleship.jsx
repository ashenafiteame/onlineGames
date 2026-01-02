import React, { useState, useCallback } from 'react';
import { GameService } from '../services/GameService';

const SIZE = 10;
const SHIPS = [5, 4, 3, 3, 2]; // Carrier, Battleship, Cruiser, Submarine, Destroyer

const Battleship = ({ onFinish, highScore }) => {
    const createEmptyBoard = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

    const [playerBoard, setPlayerBoard] = useState(createEmptyBoard());
    const [enemyBoard, setEnemyBoard] = useState(createEmptyBoard());
    const [playerShots, setPlayerShots] = useState(createEmptyBoard());
    const [enemyShots, setEnemyShots] = useState(createEmptyBoard());
    const [phase, setPhase] = useState('placing'); // placing, playing, gameOver
    const [currentShipIdx, setCurrentShipIdx] = useState(0);
    const [isHorizontal, setIsHorizontal] = useState(true);
    const [message, setMessage] = useState('Place your ships! Click to place, R to rotate.');
    const [winner, setWinner] = useState(null);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);

    const placeShipsRandomly = useCallback((board) => {
        const b = board.map(r => [...r]);
        for (const shipLen of SHIPS) {
            let placed = false;
            while (!placed) {
                const horiz = Math.random() > 0.5;
                const r = Math.floor(Math.random() * (horiz ? SIZE : SIZE - shipLen));
                const c = Math.floor(Math.random() * (horiz ? SIZE - shipLen : SIZE));
                let canPlace = true;
                for (let i = 0; i < shipLen; i++) {
                    const nr = horiz ? r : r + i;
                    const nc = horiz ? c + i : c;
                    if (b[nr][nc] !== 0) { canPlace = false; break; }
                }
                if (canPlace) {
                    for (let i = 0; i < shipLen; i++) {
                        const nr = horiz ? r : r + i;
                        const nc = horiz ? c + i : c;
                        b[nr][nc] = 1;
                    }
                    placed = true;
                }
            }
        }
        return b;
    }, []);

    const placeShip = (r, c) => {
        if (phase !== 'placing' || currentShipIdx >= SHIPS.length) return;
        const shipLen = SHIPS[currentShipIdx];
        const newBoard = playerBoard.map(row => [...row]);
        for (let i = 0; i < shipLen; i++) {
            const nr = isHorizontal ? r : r + i;
            const nc = isHorizontal ? c + i : c;
            if (nr >= SIZE || nc >= SIZE || newBoard[nr][nc] !== 0) return;
        }
        for (let i = 0; i < shipLen; i++) {
            const nr = isHorizontal ? r : r + i;
            const nc = isHorizontal ? c + i : c;
            newBoard[nr][nc] = 1;
        }
        setPlayerBoard(newBoard);
        if (currentShipIdx + 1 >= SHIPS.length) {
            setEnemyBoard(placeShipsRandomly(createEmptyBoard()));
            setPhase('playing');
            setMessage('Your turn! Click enemy grid to fire.');
        } else {
            setCurrentShipIdx(currentShipIdx + 1);
        }
    };

    const checkWin = (shots, board) => {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] === 1 && shots[r][c] !== 1) return false;
            }
        }
        return true;
    };

    const fire = (r, c) => {
        if (phase !== 'playing' || playerShots[r][c] !== 0) return;
        const newShots = playerShots.map(row => [...row]);
        newShots[r][c] = enemyBoard[r][c] === 1 ? 1 : -1;
        setPlayerShots(newShots);

        if (checkWin(newShots, enemyBoard)) {
            setPhase('gameOver');
            setWinner('player');
            setMessage('🎉 You Win!');
            const score = 500;
            GameService.submitScore('battleship', score);
            if (score > localHighScore) setLocalHighScore(score);
            return;
        }

        // Enemy turn
        setTimeout(() => {
            const newEnemyShots = enemyShots.map(row => [...row]);
            let er, ec;
            do {
                er = Math.floor(Math.random() * SIZE);
                ec = Math.floor(Math.random() * SIZE);
            } while (newEnemyShots[er][ec] !== 0);
            newEnemyShots[er][ec] = playerBoard[er][ec] === 1 ? 1 : -1;
            setEnemyShots(newEnemyShots);

            if (checkWin(newEnemyShots, playerBoard)) {
                setPhase('gameOver');
                setWinner('enemy');
                setMessage('💥 Enemy Wins!');
            }
        }, 500);
    };

    const restart = () => {
        setPlayerBoard(createEmptyBoard());
        setEnemyBoard(createEmptyBoard());
        setPlayerShots(createEmptyBoard());
        setEnemyShots(createEmptyBoard());
        setPhase('placing');
        setCurrentShipIdx(0);
        setMessage('Place your ships!');
        setWinner(null);
    };

    React.useEffect(() => {
        const handleKey = (e) => { if (e.key === 'r' || e.key === 'R') setIsHorizontal(h => !h); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const renderBoard = (board, shots, isEnemy, onClick) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 32px)`, gap: '2px', background: '#333', padding: '4px', borderRadius: '8px' }}>
            {board.map((row, r) => row.map((cell, c) => {
                const shot = shots[r][c];
                let bg = '#1565c0';
                if (shot === 1) bg = '#f44336';
                else if (shot === -1) bg = '#666';
                else if (!isEnemy && cell === 1) bg = '#4CAF50';
                return (
                    <div key={`${r}-${c}`} onClick={() => onClick && onClick(r, c)} style={{
                        width: '32px', height: '32px', background: bg, cursor: onClick && shot === 0 ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                    }}>
                        {shot === 1 ? '💥' : shot === -1 ? '•' : ''}
                    </div>
                );
            }))}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', color: 'white', padding: '20px' }}>
            <h1 style={{ fontSize: '36px', margin: '0 0 15px 0' }}>🚢 Battleship</h1>
            <div style={{ marginBottom: '15px', fontSize: '16px', padding: '10px 20px', background: '#333', borderRadius: '8px' }}>{message}</div>
            {phase === 'placing' && <div style={{ marginBottom: '10px' }}>Ship {currentShipIdx + 1}/{SHIPS.length} (Length: {SHIPS[currentShipIdx]}) - {isHorizontal ? 'Horizontal' : 'Vertical'}</div>}
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>Your Fleet</div>
                    {renderBoard(playerBoard, enemyShots, false, phase === 'placing' ? placeShip : null)}
                </div>
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>Enemy Fleet</div>
                    {renderBoard(enemyBoard, playerShots, true, phase === 'playing' ? fire : null)}
                </div>
            </div>
            <button onClick={restart} style={{ marginTop: '20px', padding: '12px 30px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>New Game</button>
            <button onClick={() => onFinish(null)} style={{ marginTop: '15px', background: '#666', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>Menu</button>
        </div>
    );
};

export default Battleship;
