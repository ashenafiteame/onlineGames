import React, { useState, useCallback } from 'react';
import { GameService } from '../services/GameService';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED_SUITS = ['♥', '♦'];

const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, faceUp: false });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

const getRankValue = (rank) => RANKS.indexOf(rank);
const isRed = (card) => RED_SUITS.includes(card.suit);

const Solitaire = ({ onFinish, highScore }) => {
    const initGame = useCallback(() => {
        const deck = createDeck();
        const tableau = [];
        let idx = 0;
        for (let i = 0; i < 7; i++) {
            const pile = [];
            for (let j = 0; j <= i; j++) {
                const card = { ...deck[idx++] };
                card.faceUp = j === i;
                pile.push(card);
            }
            tableau.push(pile);
        }
        return {
            stock: deck.slice(idx),
            waste: [],
            foundations: [[], [], [], []],
            tableau
        };
    }, []);

    const [game, setGame] = useState(initGame);
    const [selected, setSelected] = useState(null);
    const [moves, setMoves] = useState(0);
    const [won, setWon] = useState(false);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [lastUpdatedUser, setLastUpdatedUser] = useState(null);

    const checkWin = (foundations) => foundations.every(f => f.length === 13);

    const canPlaceOnFoundation = (card, foundation) => {
        if (foundation.length === 0) return card.rank === 'A';
        const top = foundation[foundation.length - 1];
        return top.suit === card.suit && getRankValue(card.rank) === getRankValue(top.rank) + 1;
    };

    const canPlaceOnTableau = (card, pile) => {
        if (pile.length === 0) return card.rank === 'K';
        const top = pile[pile.length - 1];
        return top.faceUp && isRed(card) !== isRed(top) && getRankValue(card.rank) === getRankValue(top.rank) - 1;
    };

    const drawFromStock = () => {
        setGame(g => {
            if (g.stock.length === 0) {
                return { ...g, stock: g.waste.map(c => ({ ...c, faceUp: false })).reverse(), waste: [] };
            }
            const card = { ...g.stock[g.stock.length - 1], faceUp: true };
            return { ...g, stock: g.stock.slice(0, -1), waste: [...g.waste, card] };
        });
        setMoves(m => m + 1);
    };

    const handleClick = (source, idx, cardIdx) => {
        if (won) return;
        if (source === 'stock') { drawFromStock(); return; }

        if (!selected) {
            if (source === 'waste' && game.waste.length > 0) {
                setSelected({ source: 'waste', card: game.waste[game.waste.length - 1] });
            } else if (source === 'tableau' && game.tableau[idx].length > 0) {
                const pile = game.tableau[idx];
                if (cardIdx !== undefined && pile[cardIdx]?.faceUp) {
                    setSelected({ source: 'tableau', pileIdx: idx, cardIdx, cards: pile.slice(cardIdx) });
                }
            } else if (source === 'foundation' && game.foundations[idx].length > 0) {
                setSelected({ source: 'foundation', foundationIdx: idx, card: game.foundations[idx][game.foundations[idx].length - 1] });
            }
        } else {
            // Try to place
            let newGame = { ...game, tableau: game.tableau.map(p => [...p]), foundations: game.foundations.map(f => [...f]), waste: [...game.waste] };
            let moved = false;

            if (source === 'foundation') {
                const card = selected.cards ? selected.cards[0] : selected.card;
                if (selected.cards?.length === 1 || !selected.cards) {
                    if (canPlaceOnFoundation(card, newGame.foundations[idx])) {
                        newGame.foundations[idx].push({ ...card });
                        if (selected.source === 'waste') newGame.waste.pop();
                        else if (selected.source === 'tableau') {
                            newGame.tableau[selected.pileIdx] = newGame.tableau[selected.pileIdx].slice(0, selected.cardIdx);
                            if (newGame.tableau[selected.pileIdx].length > 0) {
                                newGame.tableau[selected.pileIdx][newGame.tableau[selected.pileIdx].length - 1].faceUp = true;
                            }
                        } else if (selected.source === 'foundation') {
                            newGame.foundations[selected.foundationIdx].pop();
                        }
                        moved = true;
                    }
                }
            } else if (source === 'tableau') {
                const card = selected.cards ? selected.cards[0] : selected.card;
                if (canPlaceOnTableau(card, newGame.tableau[idx])) {
                    const cardsToMove = selected.cards || [selected.card];
                    newGame.tableau[idx].push(...cardsToMove.map(c => ({ ...c })));
                    if (selected.source === 'waste') newGame.waste.pop();
                    else if (selected.source === 'tableau') {
                        newGame.tableau[selected.pileIdx] = newGame.tableau[selected.pileIdx].slice(0, selected.cardIdx);
                        if (newGame.tableau[selected.pileIdx].length > 0) {
                            newGame.tableau[selected.pileIdx][newGame.tableau[selected.pileIdx].length - 1].faceUp = true;
                        }
                    } else if (selected.source === 'foundation') {
                        newGame.foundations[selected.foundationIdx].pop();
                    }
                    moved = true;
                }
            }

            if (moved) {
                setGame(newGame);
                setMoves(m => m + 1);
                if (checkWin(newGame.foundations)) {
                    setWon(true);
                    const score = Math.max(10, 1000 - moves * 5);
                    GameService.submitScore('solitaire', score).then(user => setLastUpdatedUser(user));
                    if (score > localHighScore) setLocalHighScore(score);
                }
            }
            setSelected(null);
        }
    };

    const Card = ({ card, onClick, isSelected }) => (
        <div onClick={onClick} style={{
            width: '50px', height: '70px', borderRadius: '5px',
            background: card.faceUp ? '#fff' : 'linear-gradient(135deg, #1565c0, #0d47a1)',
            border: isSelected ? '3px solid #ffd700' : '1px solid #333',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: isRed(card) ? '#d32f2f' : '#000', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
            {card.faceUp && <><div>{card.rank}</div><div style={{ fontSize: '18px' }}>{card.suit}</div></>}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #1a472a 0%, #0d5c36 100%)', color: 'white', padding: '20px', position: 'relative' }}>
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
            <h1 style={{ fontSize: '36px', margin: '0 0 15px 0' }}>🃏 Solitaire</h1>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <span>Moves: {moves}</span><span>🏆 Best: {localHighScore}</span>
            </div>
            {/* Removed inline status */}

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div onClick={() => handleClick('stock')} style={{ width: '50px', height: '70px', borderRadius: '5px', background: game.stock.length ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : '#2a5a3a', border: '2px dashed #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {game.stock.length > 0 ? '🂠' : '↺'}
                </div>
                <div onClick={() => handleClick('waste')} style={{ width: '50px', height: '70px' }}>
                    {game.waste.length > 0 && <Card card={game.waste[game.waste.length - 1]} onClick={() => { }} isSelected={selected?.source === 'waste'} />}
                </div>
                <div style={{ width: '30px' }} />
                {game.foundations.map((f, i) => (
                    <div key={i} onClick={() => handleClick('foundation', i)} style={{ width: '50px', height: '70px', borderRadius: '5px', background: '#2a5a3a', border: '2px dashed #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {f.length > 0 ? <Card card={f[f.length - 1]} onClick={() => { }} /> : SUITS[i]}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                {game.tableau.map((pile, i) => (
                    <div key={i} style={{ width: '55px', minHeight: '200px' }}>
                        {pile.map((card, j) => (
                            <div key={j} onClick={() => handleClick('tableau', i, j)} style={{ marginTop: j > 0 ? '-50px' : 0, position: 'relative', zIndex: j }}>
                                <Card card={card} isSelected={selected?.source === 'tableau' && selected?.pileIdx === i && j >= selected?.cardIdx} />
                            </div>
                        ))}
                        {pile.length === 0 && <div onClick={() => handleClick('tableau', i)} style={{ width: '50px', height: '70px', borderRadius: '5px', background: '#2a5a3a', border: '2px dashed #555' }} />}
                    </div>
                ))}
            </div>

            {/* Removed Bottom Buttons */}

            {won && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.95)', padding: '2rem', borderRadius: '10px', border: '1px solid #444',
                    textAlign: 'center', minWidth: '300px', zIndex: 1000, boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }}>
                    <h2 style={{ color: '#ffd700', marginTop: 0 }}>VICTORY! 🎉</h2>
                    <p style={{ fontSize: '1.2rem', margin: '1rem 0', color: 'white' }}>
                        You cleared the deck in {moves} moves!
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={() => { setGame(initGame()); setMoves(0); setWon(false); setLastUpdatedUser(null); }} style={{ padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px' }}>Play Again</button>
                        <button onClick={() => onFinish(lastUpdatedUser)} style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Library</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Solitaire;
