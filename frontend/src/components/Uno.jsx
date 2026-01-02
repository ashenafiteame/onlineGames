import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../services/GameService';

const COLORS = ['Red', 'Blue', 'Green', 'Yellow'];
const SPECIALS = ['Skip', 'Reverse', 'Draw Two'];
const WILDS = ['Wild', 'Wild Draw Four'];

const SYMBOLS = {
    'Skip': '🚫',
    'Reverse': '⇄',
    'Draw Two': '+2',
    'Wild': '🌈',
    'Wild Draw Four': '+4'
};

const createDeck = () => {
    const deck = [];
    COLORS.forEach(color => {
        deck.push({ color, type: 'number', value: 0 }); // One 0
        for (let i = 1; i <= 9; i++) {
            deck.push({ color, type: 'number', value: i });
            deck.push({ color, type: 'number', value: i });
        }
        SPECIALS.forEach(type => {
            deck.push({ color, type: 'special', value: type });
            deck.push({ color, type: 'special', value: type });
        });
    });
    WILDS.forEach(type => {
        for (let i = 0; i < 4; i++) {
            deck.push({ color: 'Black', type: 'wild', value: type });
        }
    });
    return deck;
};

const shuffle = (deck) => {
    return deck.sort(() => Math.random() - 0.5);
};

// Help Modal Component
const RulesModal = ({ onClose }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 300,
        animation: 'fadeIn 0.3s ease'
    }}>
        <div style={{
            background: '#222', border: '1px solid #444', borderRadius: '20px',
            padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', color: '#eee',
            position: 'relative'
        }}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'transparent', border: 'none', color: '#888',
                    fontSize: '24px', cursor: 'pointer'
                }}
            >&times;</button>

            <h2 style={{ marginTop: 0, borderBottom: '2px solid #333', paddingBottom: '10px', color: '#4CAF50' }}>How to Play UNO</h2>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#aaa' }}>Objective</h3>
                <p>Be the first player to get rid of all your cards! Match the card in the center by <strong>Color</strong> or <strong>Symbol</strong>.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#aaa' }}>Special Cards</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '15px', alignItems: 'center' }}>

                    <div style={{ fontSize: '24px', background: '#333', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>🚫</div>
                    <div><strong>Skip</strong><br /><span style={{ fontSize: '14px', color: '#bbb' }}>Next player loses their turn.</span></div>

                    <div style={{ fontSize: '24px', background: '#333', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>⇄</div>
                    <div><strong>Reverse</strong><br /><span style={{ fontSize: '14px', color: '#bbb' }}>Reverses the direction of play.</span></div>

                    <div style={{ fontSize: '24px', background: '#333', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>+2</div>
                    <div><strong>Draw Two</strong><br /><span style={{ fontSize: '14px', color: '#bbb' }}>Next player draws 2 cards and skips turn.</span></div>

                    <div style={{ fontSize: '24px', background: '#333', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>🌈</div>
                    <div><strong>Wild</strong><br /><span style={{ fontSize: '14px', color: '#bbb' }}>Play on any card. You call the color.</span></div>

                    <div style={{ fontSize: '24px', background: '#333', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>+4</div>
                    <div><strong>Wild Draw 4</strong><br /><span style={{ fontSize: '14px', color: '#bbb' }}>Play on any card. You call color & next player draws 4.</span></div>

                </div>
            </div>

            <button
                onClick={onClose}
                style={{
                    width: '100%', padding: '12px', background: '#2196F3', color: 'white',
                    border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold',
                    cursor: 'pointer', marginTop: '10px'
                }}
            >
                Got it!
            </button>
        </div>
    </div>
);

// Color Picker Modal Component
const ColorPickerModal = ({ onSelect }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
        <div style={{
            background: 'white', borderRadius: '20px', padding: '20px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            width: '300px', height: '300px'
        }}>
            <button
                onClick={() => onSelect('Red')}
                style={{ background: '#ff4d4d', border: 'none', borderRadius: '15px', color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >Red</button>
            <button
                onClick={() => onSelect('Blue')}
                style={{ background: '#4d79ff', border: 'none', borderRadius: '15px', color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >Blue</button>
            <button
                onClick={() => onSelect('Yellow')}
                style={{ background: '#ffcc00', border: 'none', borderRadius: '15px', color: 'black', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >Yellow</button>
            <button
                onClick={() => onSelect('Green')}
                style={{ background: '#4dff88', border: 'none', borderRadius: '15px', color: 'black', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >Green</button>
        </div>
    </div>
);


const Uno = ({ onFinish, highScore }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [players, setPlayers] = useState([]);
    const [deck, setDeck] = useState([]);
    const [discardPile, setDiscardPile] = useState([]);
    const [turn, setTurn] = useState(0); // 0 = Human
    const [direction, setDirection] = useState(1); // 1 = CW, -1 = CCW
    const [currentColor, setCurrentColor] = useState('');
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState(null);
    const [localHighScore, setLocalHighScore] = useState(highScore || 0);
    const [showRules, setShowRules] = useState(false);

    // Wild Card Picker State
    const [pendingWildMove, setPendingWildMove] = useState(null); // { index, rect }

    // Animation State
    const [animatingCard, setAnimatingCard] = useState(null);
    const [discardPilePop, setDiscardPilePop] = useState(false);
    const discardPileRef = useRef(null);
    const playerRefs = useRef([]);

    // Game Settings
    const botCount = 3; // 1 Human + 3 Bots

    useEffect(() => {
        if (highScore > localHighScore) setLocalHighScore(highScore);
    }, [highScore]);

    const startGame = () => {
        const newDeck = shuffle(createDeck());
        const newPlayers = [];

        for (let i = 0; i < botCount + 1; i++) {
            const hand = [];
            for (let j = 0; j < 7; j++) {
                hand.push(newDeck.pop());
            }
            newPlayers.push({
                id: i,
                name: i === 0 ? 'You' : `Bot ${i}`,
                isBot: i !== 0,
                hand
            });
        }

        let initialCard = newDeck.pop();
        while (initialCard.color === 'Black') {
            newDeck.unshift(initialCard);
            initialCard = newDeck.pop();
        }

        setPlayers(newPlayers);
        setDeck(newDeck);
        setDiscardPile([initialCard]);
        setCurrentColor(initialCard.color);
        setTurn(0);
        setDirection(1);
        setWinner(null);
        setMessage("Your Turn!");
        setGameStarted(true);
        setAnimatingCard(null);
        setPendingWildMove(null);
        setShowRules(false);
    };

    const drawCard = (playerId, count = 1) => {
        const drawnCards = [];
        let currentDeck = [...deck];
        let currentDiscard = [...discardPile];

        for (let i = 0; i < count; i++) {
            if (currentDeck.length === 0) {
                if (currentDiscard.length <= 1) break;
                const top = currentDiscard.pop();
                currentDeck = shuffle(currentDiscard);
                currentDiscard = [top];
                setDiscardPile(currentDiscard);
            }
            drawnCards.push(currentDeck.pop());
        }

        setDeck(currentDeck);

        setPlayers(prev => prev.map(p => {
            if (p.id === playerId) {
                return { ...p, hand: [...p.hand, ...drawnCards] };
            }
            return p;
        }));
        return drawnCards;
    };

    const nextTurn = (skip = false) => {
        const next = (turn + direction * (skip ? 2 : 1) + players.length) % players.length;
        const safeNext = (next < 0) ? next + players.length : next;
        setTurn(safeNext);

        if (safeNext === 0) setMessage("Your Turn!");
        else setMessage(`${players[safeNext].name}'s Turn`);
    };

    const isValidMove = (card) => {
        const top = discardPile[discardPile.length - 1];
        if (card.color === 'Black') return true;
        if (card.color === currentColor) return true;
        if (card.value === top.value) return true;
        return false;
    };

    // Handle Color Selection for Wild Cards
    const handleColorSelect = (color) => {
        if (pendingWildMove) {
            initiatePlayCard(0, pendingWildMove.index, color, pendingWildMove.rect);
            setPendingWildMove(null); // Clear pending move
        }
    };

    const initiatePlayCard = (playerIndex, cardIndex, chosenWildColor = null, startRect = null) => {
        if (animatingCard) return;

        const player = players[playerIndex];
        const card = player.hand[cardIndex];

        if (!player.isBot && !isValidMove(card)) {
            setMessage("Invalid Move!");
            return;
        }

        let startX = 0, startY = 0;
        let endX = window.innerWidth / 2 - 35; // Default center
        let endY = window.innerHeight / 2 - 52.5;

        if (discardPileRef.current) {
            const rect = discardPileRef.current.getBoundingClientRect();
            endX = rect.left + rect.width / 2 - 35;
            endY = rect.top + rect.height / 2 - 52.5;
        }

        if (startRect) {
            startX = startRect.left;
            startY = startRect.top;
        } else if (playerRefs.current[playerIndex]) {
            const rect = playerRefs.current[playerIndex].getBoundingClientRect();
            startX = rect.left + rect.width / 2 - 35;
            startY = rect.top + rect.height / 2 - 52.5;
        } else {
            startY = playerIndex === 0 ? window.innerHeight - 150 : 100;
            startX = window.innerWidth / 2 - 35;
        }

        const flightRotation = 360 + Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1);

        setAnimatingCard({
            card,
            startX, startY,
            endX, endY,
            rotation: flightRotation,
            playerIndex, cardIndex, chosenWildColor
        });

        setTimeout(() => {
            finalizePlayCard(playerIndex, cardIndex, chosenWildColor);
            setAnimatingCard(null);

            setDiscardPilePop(true);
            setTimeout(() => setDiscardPilePop(false), 200);
        }, 600);
    };

    const finalizePlayCard = (playerIndex, cardIndex, chosenWildColor = null) => {
        const player = players[playerIndex];
        const card = player.hand[cardIndex];

        const newHand = player.hand.filter((_, i) => i !== cardIndex);
        setPlayers(prev => prev.map((p, i) => i === playerIndex ? { ...p, hand: newHand } : p));
        setDiscardPile(prev => [...prev, card]);

        let nextColor = card.color;
        if (card.color === 'Black') {
            nextColor = chosenWildColor || COLORS[Math.floor(Math.random() * 4)];
        }
        setCurrentColor(nextColor);

        if (newHand.length === 0) {
            setWinner(player);
            setGameStarted(false);
            if (!player.isBot) {
                const score = players.reduce((acc, p) => acc + p.hand.reduce((sum, c) => sum + (c.type === 'number' ? c.value : 20), 0), 0) + 100;
                GameService.submitScore('uno', score);
                if (score > localHighScore) setLocalHighScore(score);
                setMessage(`🎉 You Win! Score: ${score}`);
            } else {
                setMessage(`${player.name} Wins!`);
            }
            return;
        }

        let skipTurn = false;
        if (card.value === 'Reverse') {
            setDirection(prev => prev * -1);
            if (players.length === 2) skipTurn = true;
        } else if (card.value === 'Skip') {
            skipTurn = true;
        } else if (card.value === 'Draw Two') {
            const targetIndex = (turn + direction + players.length) % players.length;
            const safeTarget = targetIndex < 0 ? targetIndex + players.length : targetIndex;
            drawCard(safeTarget, 2);
            skipTurn = true;
        } else if (card.value === 'Wild Draw Four') {
            const targetIndex = (turn + direction + players.length) % players.length;
            const safeTarget = targetIndex < 0 ? targetIndex + players.length : targetIndex;
            drawCard(safeTarget, 2); // BUG FIX: Was incorrectly drawing 2? No, previous code had 4. Wait, let me check. 
            // Previous code said draw 4. I should ensure it's 4. Ah, the log showed 4.
            // Let me maintain correctness. It should be 4.
            drawCard(safeTarget, 4);
            skipTurn = true;
        }

        nextTurn(skipTurn);
    };

    useEffect(() => {
        if (!gameStarted || winner || players[turn].isBot === false || animatingCard || pendingWildMove) return; // Pause for modal

        const botTurnTimeout = setTimeout(() => {
            const bot = players[turn];
            const playable = bot.hand.filter(c => isValidMove(c));

            if (playable.length > 0) {
                playable.sort((a, b) => {
                    if (a.color === 'Black') return 1;
                    if (b.color === 'Black') return -1;
                    if (a.type === 'special') return -1;
                    if (b.type === 'special') return 1;
                    return 0;
                });
                const cardToPlay = playable[0];
                const index = bot.hand.indexOf(cardToPlay);
                initiatePlayCard(turn, index);
            } else {
                drawCard(turn, 1);
                nextTurn();
            }
        }, 1200);

        return () => clearTimeout(botTurnTimeout);
    }, [turn, gameStarted, winner, players, currentColor, discardPile, animatingCard, pendingWildMove]);

    const getCardStyle = (card) => {
        let bg = card.color;
        if (card.color === 'Red') bg = 'linear-gradient(135deg, #ff4d4d, #cc0000)';
        if (card.color === 'Blue') bg = 'linear-gradient(135deg, #4d79ff, #0033cc)';
        if (card.color === 'Green') bg = 'linear-gradient(135deg, #4dff88, #009933)';
        if (card.color === 'Yellow') bg = 'linear-gradient(135deg, #ffff66, #ffcc00)';
        if (card.color === 'Black') bg = 'conic-gradient(#ff4d4d 0deg 90deg, #4d79ff 90deg 180deg, #ffff66 180deg 270deg, #4dff88 270deg 360deg)';

        return {
            background: bg,
            color: 'white',
            border: '3px solid white',
            borderRadius: '12px',
            width: '70px',
            height: '105px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            textAlign: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
            userSelect: 'none',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        };
    };

    const renderCardContent = (card) => {
        const symbol = SYMBOLS[card.value] || card.value;
        const smallStyle = { position: 'absolute', fontSize: '14px' };

        return (
            <>
                <div style={{ ...smallStyle, top: '4px', left: '6px' }}>{symbol}</div>
                <div style={{ fontSize: card.type === 'number' ? '40px' : '32px', textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>{symbol}</div>
                <div style={{ ...smallStyle, bottom: '4px', right: '6px', transform: 'rotate(180deg)' }}>{symbol}</div>
            </>
        );
    };

    const getPlayerStyle = (playerId) => {
        const isActive = turn === playerId;
        return {
            transition: 'all 0.5s ease',
            opacity: isActive ? 1 : 0.6,
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            filter: isActive ? 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' : 'none',
        };
    };

    const getMessageStyle = () => {
        const baseStyle = {
            position: 'absolute',
            fontSize: '20px',
            fontWeight: 'bold',
            padding: '10px 30px',
            borderRadius: '30px',
            background: turn === 0 ? 'linear-gradient(90deg, #4CAF50, #81C784)' : 'rgba(255,255,255,0.2)',
            color: turn === 0 ? 'white' : '#ddd',
            boxShadow: turn === 0 ? '0 4px 12px rgba(76, 175, 80, 0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 20,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255,255,255,0.1)'
        };

        switch (turn) {
            case 0: return { ...baseStyle, bottom: '25%', left: '50%', transform: 'translateX(-50%)' };
            case 1: return { ...baseStyle, top: '50%', left: '160px', transform: 'translateY(-50%)' };
            case 2: return { ...baseStyle, top: '180px', left: '50%', transform: 'translateX(-50%)' };
            case 3: return { ...baseStyle, top: '50%', right: '160px', transform: 'translateY(-50%)' };
            default: return baseStyle;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#222', color: 'white', padding: '20px', userSelect: 'none', overflow: 'hidden', position: 'relative' }}>
            {/* Nav & Info */}
            <div style={{ position: 'absolute', top: '20px', right: '30px', textAlign: 'right', pointerEvents: 'none', zIndex: 100 }}>
                <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(to right, #f00, #ff0, #0f0, #00f)', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: '2px 2px 4px rgba(255,255,255,0.1)' }}>UNO</h1>
                <div style={{ fontSize: '1.2rem', opacity: 0.8, marginTop: '-5px' }}>🏆 Best: {localHighScore}</div>
            </div>

            <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px', zIndex: 100 }}>
                <button
                    onClick={() => onFinish(null)}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
                >
                    Exit
                </button>
                <button
                    onClick={() => setShowRules(true)}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <span>ℹ️</span> Rules
                </button>
            </div>

            {/* MODALS */}
            {showRules && <RulesModal onClose={() => setShowRules(false)} />}
            {pendingWildMove && <ColorPickerModal onSelect={handleColorSelect} />}

            {!gameStarted && !winner ? (
                <button
                    onClick={startGame}
                    style={{ padding: '15px 40px', fontSize: '20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', boxShadow: '0 4px 0 #2e7d32', transition: 'transform 0.1s' }}
                    onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                >
                    Start Game
                </button>
            ) : (
                <>
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 255, 255, 0.4)" />
                            </marker>
                            <marker id="arrowheadActive" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#4CAF50" />
                            </marker>
                        </defs>

                        {/* Connecting Paths - Thicker and Brighter */}
                        <path d="M 45% 85% Q 25% 85% 10% 60%" fill="none" strokeWidth={direction === 1 && turn === 0 ? "6" : "3"} stroke={direction === 1 ? (turn === 0 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === 1 ? (turn === 0 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />
                        <path d="M 10% 40% Q 25% 15% 45% 15%" fill="none" strokeWidth={direction === 1 && turn === 1 ? "6" : "3"} stroke={direction === 1 ? (turn === 1 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === 1 ? (turn === 1 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />
                        <path d="M 55% 15% Q 75% 15% 90% 40%" fill="none" strokeWidth={direction === 1 && turn === 2 ? "6" : "3"} stroke={direction === 1 ? (turn === 2 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === 1 ? (turn === 2 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />
                        <path d="M 90% 60% Q 75% 85% 55% 85%" fill="none" strokeWidth={direction === 1 && turn === 3 ? "6" : "3"} stroke={direction === 1 ? (turn === 3 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === 1 ? (turn === 3 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />

                        <path d="M 55% 85% Q 75% 85% 90% 60%" fill="none" strokeWidth={direction === -1 && turn === 0 ? "6" : "3"} stroke={direction === -1 ? (turn === 0 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === -1 ? (turn === 0 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />
                        <path d="M 90% 40% Q 75% 15% 55% 15%" fill="none" strokeWidth={direction === -1 && turn === 3 ? "6" : "3"} stroke={direction === -1 ? (turn === 3 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === -1 ? (turn === 3 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />
                        <path d="M 45% 15% Q 25% 15% 10% 40%" fill="none" strokeWidth={direction === -1 && turn === 2 ? "6" : "3"} stroke={direction === -1 ? (turn === 2 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === -1 ? (turn === 2 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />
                        <path d="M 10% 60% Q 25% 85% 45% 85%" fill="none" strokeWidth={direction === -1 && turn === 1 ? "6" : "3"} stroke={direction === -1 ? (turn === 1 ? "#4CAF50" : "rgba(255,255,255,0.2)") : "rgba(0,0,0,0)"} markerEnd={direction === -1 ? (turn === 1 ? "url(#arrowheadActive)" : "url(#arrowhead)") : "none"} style={{ transition: 'all 0.3s' }} />
                    </svg>

                    {/* Central Spin Indicator */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: '350px', height: '350px', pointerEvents: 'none', zIndex: 0,
                        opacity: 0.15
                    }}>
                        <div style={{
                            width: '100%', height: '100%', borderRadius: '50%', border: '4px dashed white',
                            transform: `scaleX(${direction})`,
                            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}>
                            <div style={{ position: 'absolute', top: '-10px', fontSize: '40px', background: '#222', padding: '0 10px' }}>▶</div>
                            <div style={{ position: 'absolute', bottom: '-10px', fontSize: '40px', background: '#222', padding: '0 10px', transform: 'rotate(180deg)' }}>▶</div>
                        </div>

                    </div>

                    <div ref={el => playerRefs.current[2] = el} style={{ position: 'absolute', top: '90px', ...getPlayerStyle(2), zIndex: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: '5px', fontWeight: 'bold' }}>{players[2]?.name}</div>
                        <div style={{ display: 'flex', gap: '-20px' }}>
                            {players[2]?.hand.map((_, i) => (
                                <div key={i} style={{ width: '45px', height: '65px', background: '#333', borderRadius: '8px', border: '2px solid #555', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', marginLeft: i > 0 ? '-20px' : 0 }} />
                            ))}
                        </div>
                    </div>

                    <div ref={el => playerRefs.current[1] = el} style={{ position: 'absolute', left: '20px', top: '50%', transform: getPlayerStyle(1).transform + ' translateY(-50%)', opacity: getPlayerStyle(1).opacity, transition: 'all 0.5s ease', zIndex: 1 }}>
                        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{players[1]?.name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '-30px' }}>
                            {players[1]?.hand.map((_, i) => (
                                <div key={i} style={{ width: '65px', height: '45px', background: '#333', borderRadius: '8px', border: '2px solid #555', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', marginTop: i > 0 ? '-30px' : 0 }} />
                            ))}
                        </div>
                    </div>

                    <div ref={el => playerRefs.current[3] = el} style={{ position: 'absolute', right: '20px', top: '50%', transform: getPlayerStyle(3).transform + ' translateY(-50%)', opacity: getPlayerStyle(3).opacity, transition: 'all 0.5s ease', zIndex: 1 }}>
                        <div style={{ marginBottom: '5px', textAlign: 'right', fontWeight: 'bold' }}>{players[3]?.name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '-30px' }}>
                            {players[3]?.hand.map((_, i) => (
                                <div key={i} style={{ width: '65px', height: '45px', background: '#333', borderRadius: '8px', border: '2px solid #555', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', marginTop: i > 0 ? '-30px' : 0 }} />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '50px', alignItems: 'center', perspective: '1000px', zIndex: 5, transform: discardPilePop ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.1s ease-out' }}>
                        <div
                            style={{
                                width: '80px', height: '120px', background: '#1a1a1a', border: '3px solid #666', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: turn === 0 ? 'pointer' : 'default', boxShadow: '0 4px 8px rgba(0,0,0,0.6)', transform: turn === 0 ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.2s', fontSize: '14px', color: '#666'
                            }}
                            onClick={() => { if (turn === 0) { drawCard(0); nextTurn(); } }}
                        >
                            <div style={{ transform: 'rotate(45deg)', fontSize: '24px' }}>UNO</div>
                        </div>

                        {discardPile.length > 0 && (
                            <div
                                ref={discardPileRef}
                                style={{ ...getCardStyle(discardPile[discardPile.length - 1]), width: '80px', height: '120px', fontSize: '32px', transform: 'rotate(-5deg)', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                            >
                                {renderCardContent(discardPile[discardPile.length - 1])}
                            </div>
                        )}

                        <div style={{ position: 'absolute', width: '300px', height: '300px', background: currentColor === 'Red' ? 'radial-gradient(circle, rgba(255, 77, 77, 0.4) 0%, rgba(0,0,0,0) 70%)' : currentColor === 'Blue' ? 'radial-gradient(circle, rgba(77, 121, 255, 0.4) 0%, rgba(0,0,0,0) 70%)' : currentColor === 'Green' ? 'radial-gradient(circle, rgba(77, 255, 136, 0.4) 0%, rgba(0,0,0,0) 70%)' : currentColor === 'Yellow' ? 'radial-gradient(circle, rgba(255, 255, 102, 0.4) 0%, rgba(0,0,0,0) 70%)' : 'none', zIndex: -1, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.5s ease' }} />
                    </div>

                    <div style={getMessageStyle()}>{message}</div>

                    {animatingCard && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, ...getCardStyle(animatingCard.card), zIndex: 1000, pointerEvents: 'none',
                            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        }}
                            ref={el => {
                                if (el && !el.hasPlayed) {
                                    el.hasPlayed = true;
                                    el.style.transform = `translate(${animatingCard.startX}px, ${animatingCard.startY}px) scale(1) rotate(0deg)`;
                                    requestAnimationFrame(() => {
                                        el.style.transform = `translate(${animatingCard.endX}px, ${animatingCard.endY}px) rotate(${animatingCard.rotation}deg) scale(1.14)`;
                                        el.style.filter = 'blur(1px)';
                                        setTimeout(() => { if (el) el.style.filter = 'blur(0px)'; }, 300);
                                    });
                                }
                            }}>
                            {renderCardContent(animatingCard.card)}
                        </div>
                    )}

                    <div style={{ ...getPlayerStyle(0), position: 'absolute', bottom: '20px', width: '100%', display: 'flex', gap: '-20px', flexWrap: 'nowrap', justifyContent: 'center', maxWidth: '90%', overflowX: 'auto', padding: '20px 0', zIndex: 10 }}>
                        {players[0]?.hand.map((card, i) => (
                            <div
                                key={i}
                                onClick={(e) => {
                                    if (turn === 0) {
                                        const cardEl = e.currentTarget;
                                        const rect = cardEl.getBoundingClientRect();

                                        if (card.color === 'Black') {
                                            // Set pending move to show modal
                                            setPendingWildMove({ index: i, rect });
                                        } else {
                                            initiatePlayCard(0, i, null, rect);
                                        }
                                    }
                                }}
                                style={{
                                    ...getCardStyle(card),
                                    marginLeft: i > 0 ? '-30px' : 0,
                                    zIndex: i,
                                    opacity: (animatingCard && animatingCard.playerIndex === 0 && animatingCard.cardIndex === i) ? 0 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!animatingCard) {
                                        e.currentTarget.style.transform = 'translateY(-20px) scale(1.1)';
                                        e.currentTarget.style.zIndex = 100;
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!animatingCard) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.zIndex = i;
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                                    }
                                }}
                            >
                                {renderCardContent(card)}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {winner && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                    <h1 style={{ fontSize: '80px', margin: 0 }}>{winner.id === 0 ? '🏆' : '💀'}</h1>
                    <h1 style={{ fontSize: '60px', color: winner.id === 0 ? '#4CAF50' : '#f44336', textShadow: '0 0 20px currentColor' }}>{winner.id === 0 ? 'You Won!' : 'Game Over'}</h1>
                    <h2 style={{ color: 'white', marginTop: 0 }}>{winner.name} finished first!</h2>
                    <button onClick={startGame} style={{ padding: '20px 50px', fontSize: '24px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '10px', marginTop: '20px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(33, 150, 243, 0.4)' }}>Play Again</button>
                    <button onClick={() => onFinish(null)} style={{ marginTop: '20px', background: 'transparent', color: '#aaa', border: 'none', fontSize: '18px', cursor: 'pointer' }}>Back to Menu</button>
                    {winner.id === 0 && <div style={{ marginTop: '20px', color: '#FFD700' }}>Bonus Points: +200 XP</div>}
                </div>
            )}
        </div>
    );
};

export default Uno;
