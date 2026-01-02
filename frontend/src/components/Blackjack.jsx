import React, { useState, useEffect } from 'react';
import { GameService } from '../services/GameService';

// Card suits and ranks
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': '#fff', '♥': '#ff4444', '♦': '#ff4444', '♣': '#fff' };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
};

const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
};

const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        value += getCardValue(card);
        if (card.rank === 'A') aces++;
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
};

const Card = ({ card, hidden = false }) => {
    if (hidden) {
        return (
            <div style={{
                width: '80px',
                height: '110px',
                background: 'linear-gradient(135deg, #1a5f7a, #185a6e)',
                borderRadius: '8px',
                border: '2px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                color: '#fff',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
                🂠
            </div>
        );
    }

    return (
        <div style={{
            width: '80px',
            height: '110px',
            background: '#fff',
            borderRadius: '8px',
            border: '2px solid #333',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
            <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: SUIT_COLORS[card.suit] === '#ff4444' ? '#d32f2f' : '#333'
            }}>
                {card.rank}
            </div>
            <div style={{
                fontSize: '32px',
                color: SUIT_COLORS[card.suit] === '#ff4444' ? '#d32f2f' : '#333'
            }}>
                {card.suit}
            </div>
        </div>
    );
};

const Hand = ({ cards, label, value, hideFirst = false }) => (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>
            {label} {!hideFirst && <span style={{ color: '#ffd700' }}>({value})</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {cards.map((card, i) => (
                <Card key={i} card={card} hidden={hideFirst && i === 0} />
            ))}
        </div>
    </div>
);

const Blackjack = ({ onFinish, highScore }) => {
    const [deck, setDeck] = useState([]);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [chips, setChips] = useState(1000);
    const [bet, setBet] = useState(100);
    const [gamePhase, setGamePhase] = useState('betting'); // betting, playing, dealerTurn, gameOver
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('Place your bet!');
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const dealCards = () => {
        if (bet > chips) {
            setMessage("Not enough chips!");
            return;
        }

        const newDeck = shuffleDeck(createDeck());
        const pHand = [newDeck.pop(), newDeck.pop()];
        const dHand = [newDeck.pop(), newDeck.pop()];

        setDeck(newDeck);
        setPlayerHand(pHand);
        setDealerHand(dHand);
        setChips(chips - bet);
        setGamePhase('playing');
        setResult(null);

        // Check for blackjack
        const playerValue = calculateHandValue(pHand);
        const dealerValue = calculateHandValue(dHand);

        if (playerValue === 21 && dealerValue === 21) {
            setMessage("Both Blackjack! Push.");
            setResult('push');
            setChips(c => c + bet);
            setGamePhase('gameOver');
        } else if (playerValue === 21) {
            setMessage("Blackjack! You win 1.5x!");
            setResult('blackjack');
            setChips(c => c + bet + Math.floor(bet * 1.5));
            setGamePhase('gameOver');
            const xp = 250;
            GameService.submitScore('blackjack', xp);
            if (xp > localHighScore) setLocalHighScore(xp);
        } else if (dealerValue === 21) {
            setMessage("Dealer Blackjack! You lose.");
            setResult('lose');
            setGamePhase('gameOver');
        } else {
            setMessage("Hit or Stand?");
        }
    };

    const hit = () => {
        if (gamePhase !== 'playing') return;

        const newDeck = [...deck];
        const newHand = [...playerHand, newDeck.pop()];
        setDeck(newDeck);
        setPlayerHand(newHand);

        const value = calculateHandValue(newHand);
        if (value > 21) {
            setMessage("Bust! You lose.");
            setResult('lose');
            setGamePhase('gameOver');
        } else if (value === 21) {
            stand();
        }
    };

    const stand = () => {
        if (gamePhase !== 'playing') return;
        setGamePhase('dealerTurn');
        dealerPlay();
    };

    const doubleDown = () => {
        if (gamePhase !== 'playing' || playerHand.length !== 2 || bet > chips) return;

        setChips(chips - bet);
        setBet(bet * 2);

        const newDeck = [...deck];
        const newHand = [...playerHand, newDeck.pop()];
        setDeck(newDeck);
        setPlayerHand(newHand);

        const value = calculateHandValue(newHand);
        if (value > 21) {
            setMessage("Bust! You lose.");
            setResult('lose');
            setGamePhase('gameOver');
        } else {
            setTimeout(() => dealerPlay(), 500);
        }
    };

    const dealerPlay = () => {
        let currentDeck = [...deck];
        let currentDealerHand = [...dealerHand];

        const playDealer = () => {
            const dealerValue = calculateHandValue(currentDealerHand);

            if (dealerValue < 17) {
                currentDealerHand = [...currentDealerHand, currentDeck.pop()];
                setDealerHand([...currentDealerHand]);
                setDeck([...currentDeck]);
                setTimeout(playDealer, 600);
            } else {
                // Determine winner
                const playerValue = calculateHandValue(playerHand);
                const finalDealerValue = calculateHandValue(currentDealerHand);

                if (finalDealerValue > 21) {
                    setMessage("Dealer busts! You win!");
                    setResult('win');
                    setChips(c => c + bet * 2);
                    const xp = 200;
                    GameService.submitScore('blackjack', xp);
                    if (xp > localHighScore) setLocalHighScore(xp);
                } else if (playerValue > finalDealerValue) {
                    setMessage("You win!");
                    setResult('win');
                    setChips(c => c + bet * 2);
                    const xp = 150;
                    GameService.submitScore('blackjack', xp);
                    if (xp > localHighScore) setLocalHighScore(xp);
                } else if (playerValue < finalDealerValue) {
                    setMessage("Dealer wins!");
                    setResult('lose');
                } else {
                    setMessage("Push! Bet returned.");
                    setResult('push');
                    setChips(c => c + bet);
                }
                setGamePhase('gameOver');
            }
        };

        setGamePhase('dealerTurn');
        playDealer();
    };

    const newRound = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setBet(Math.min(100, chips));
        setGamePhase('betting');
        setResult(null);
        setMessage('Place your bet!');
    };

    const isGameOver = chips <= 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a472a 0%, #0d5c36 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '42px', margin: '0 0 10px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                🃏 Blackjack
            </h1>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', fontSize: '18px' }}>
                <div>💰 Chips: <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{chips}</span></div>
                <div>🏆 Best: {localHighScore}</div>
            </div>

            {/* Message */}
            <div style={{
                background: result === 'win' || result === 'blackjack' ? '#4CAF50' :
                    result === 'lose' ? '#f44336' :
                        result === 'push' ? '#ff9800' : '#333',
                padding: '12px 30px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '20px',
                fontWeight: 'bold'
            }}>
                {message}
            </div>

            {/* Betting Phase */}
            {gamePhase === 'betting' && !isGameOver && (
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ marginRight: '10px' }}>Bet:</label>
                        <input
                            type="range"
                            min="10"
                            max={chips}
                            step="10"
                            value={bet}
                            onChange={(e) => setBet(parseInt(e.target.value))}
                            style={{ width: '200px', marginRight: '15px' }}
                        />
                        <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '24px' }}>{bet}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        {[10, 25, 50, 100, 250].map(amount => (
                            <button
                                key={amount}
                                onClick={() => setBet(Math.min(amount, chips))}
                                disabled={amount > chips}
                                style={{
                                    padding: '8px 15px',
                                    background: amount <= chips ? '#ffd700' : '#555',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: amount <= chips ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold'
                                }}
                            >
                                {amount}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={dealCards}
                        style={{
                            marginTop: '20px',
                            padding: '15px 50px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Deal
                    </button>
                </div>
            )}

            {/* Game Over - No chips */}
            {isGameOver && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '20px', color: '#f44336' }}>
                        💸 Out of chips! Game Over
                    </div>
                    <button
                        onClick={() => { setChips(1000); newRound(); }}
                        style={{
                            padding: '15px 30px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '18px',
                            cursor: 'pointer'
                        }}
                    >
                        Start Fresh (1000 chips)
                    </button>
                </div>
            )}

            {/* Cards */}
            {(gamePhase === 'playing' || gamePhase === 'dealerTurn' || gamePhase === 'gameOver') && (
                <>
                    <Hand
                        cards={dealerHand}
                        label="Dealer"
                        value={calculateHandValue(dealerHand)}
                        hideFirst={gamePhase === 'playing'}
                    />
                    <Hand
                        cards={playerHand}
                        label="You"
                        value={calculateHandValue(playerHand)}
                    />
                </>
            )}

            {/* Action Buttons */}
            {gamePhase === 'playing' && (
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button
                        onClick={hit}
                        style={{
                            padding: '15px 40px',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Hit
                    </button>
                    <button
                        onClick={stand}
                        style={{
                            padding: '15px 40px',
                            background: '#ff9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Stand
                    </button>
                    {playerHand.length === 2 && bet <= chips && (
                        <button
                            onClick={doubleDown}
                            style={{
                                padding: '15px 40px',
                                background: '#9c27b0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Double
                        </button>
                    )}
                </div>
            )}

            {/* New Round Button */}
            {gamePhase === 'gameOver' && !isGameOver && (
                <button
                    onClick={newRound}
                    style={{
                        marginTop: '20px',
                        padding: '15px 40px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    New Round
                </button>
            )}

            {/* Menu Button */}
            <button
                onClick={() => onFinish(null)}
                style={{
                    marginTop: '30px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                }}
            >
                Menu
            </button>
        </div>
    );
};

export default Blackjack;
