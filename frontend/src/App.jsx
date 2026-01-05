import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import GameLibrary from './components/GameLibrary';
import MemoryMatch from './components/MemoryMatch';
import GuessNumber from './components/GuessNumber';
import SnakeGame from './components/SnakeGame';
import BalloonPopper from './components/BalloonPopper';
import LaneRacer from './components/LaneRacer';
import MotoRacer from './components/MotoRacer';
import AdminDashboard from './components/AdminDashboard';
import { AuthService } from './services/AuthService';
import { GameService } from './services/GameService';
import { AchievementService } from './services/AchievementService';
import { SocialService } from './services/SocialService';
import SocialDashboard from './components/SocialDashboard';
import ActivityFeed from './components/ActivityFeed';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import Checkers from './components/Checkers';
import Chess from './components/Chess';
import TicTacToe from './components/TicTacToe';
import Game2048 from './components/Game2048';
import Tetris from './components/Tetris';
import ConnectFour from './components/ConnectFour';
import Sudoku from './components/Sudoku';
import Blackjack from './components/Blackjack';
import Uno from './components/Uno';
import Solitaire from './components/Solitaire';
import WhackAMole from './components/WhackAMole';
import Minesweeper from './components/Minesweeper';
import Reversi from './components/Reversi';
import Battleship from './components/Battleship';
import FlappyBird from './components/FlappyBird';
import BrickBreaker from './components/BrickBreaker';
import OnlinePanel from './components/OnlinePanel';
import MultiplayerLobby from './components/MultiplayerLobby';
import CheckersMultiplayer from './components/CheckersMultiplayer';
import UnoMultiplayer from './components/UnoMultiplayer';
import TicTacToeMultiplayer from './components/TicTacToeMultiplayer';
import ConnectFourMultiplayer from './components/ConnectFourMultiplayer';
import ChessMultiplayer from './components/ChessMultiplayer';

function App() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [view, setView] = useState('login');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [scores, setScores] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [unoRoom, setUnoRoom] = useState(null);
  const [checkersRoom, setCheckersRoom] = useState(null);
  const [tictactoeRoom, setTicTacToeRoom] = useState(null);
  const [connectFourRoom, setConnectFourRoom] = useState(null);
  const [chessRoom, setChessRoom] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);

  // Check URL for invite code on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room') || params.get('uno');
    if (code) {
      setInviteCode(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Auto-navigate to lobby if invite code present
  useEffect(() => {
    if (inviteCode && user && view === 'library') {
      // Default to a generic lobby join behavior? 
      // Since we don't know the game, we rely on the user navigating or 
      // we could add a "Join Game" generic input in Library.
      // For now, if the param was 'uno', we default to unofficial Uno Lobby hack
      const params = new URLSearchParams(window.location.search);
      if (params.get('uno')) {
        setView('game-uno-lobby');
      } else {
        // For now, stay in library, but maybe alert?
        // "You have an invite code: " + inviteCode + ". Select the game to join."
      }
    }
  }, [inviteCode, user, view]);

  const refreshUser = () => {
    setUser(AuthService.getCurrentUser());
  };

  useEffect(() => {
    if (user) {
      GameService.getMyScores().then(setScores).catch(console.error);
      AchievementService.getMyAchievements().then(setAchievements).catch(console.error);
    }
  }, [user]);

  const getHighScore = (gameType) => {
    const gameScores = scores.filter(s => s.game.type === gameType);
    if (gameScores.length === 0) return 0;
    return Math.max(...gameScores.map(s => s.scoreValue));
  };

  useEffect(() => {
    if (user) {
      if (view === 'login' || view === 'signup') {
        setView('library');
      }
    } else {
      setView('login');
    }
  }, [user]);

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  const handleGameFinish = (updatedUser) => {
    const latestUser = AuthService.getCurrentUser();
    if (latestUser) {
      setUser(latestUser);
    }
    if (updatedUser) {
      setUser(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem('user', JSON.stringify({ ...latestUser, ...updatedUser }));
    }
    GameService.getMyScores().then(setScores).catch(console.error);
    AchievementService.getMyAchievements().then(setAchievements).catch(console.error);
    setView('library');
  };

  const isAdmin = user?.role === 'ADMIN';

  const renderContent = () => {
    if (!user) {
      if (view === 'signup') return <Signup switchToLogin={() => setView('login')} />;
      return <Login onLogin={setUser} switchToSignup={() => setView('signup')} />;
    }

    switch (view) {
      case 'admin':
        return <AdminDashboard onBack={() => setView('library')} />;
      case 'social':
        return <SocialDashboard
          onBack={() => setView('library')}
          onViewProfile={(username) => {
            setSelectedProfile(username);
            setView('profile');
          }}
        />;
      case 'profile':
        return <Profile
          username={selectedProfile}
          onBack={() => setView(selectedProfile === user.username ? 'library' : 'social')}
          onUpdate={refreshUser}
        />;
      case 'leaderboard':
        return <Leaderboard onBack={() => setView('library')} />;
      case 'library':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
            <GameLibrary onSelectGame={(type) => {
              setSelectedMatch(null);
              setView(`game-${type}`);
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <OnlinePanel onStartMatch={(matchId, gameType) => {
                setSelectedMatch(matchId);
                setView(`game-${gameType || 'checkers'}`);
              }} />
              <ActivityFeed onViewProfile={(username) => {
                setSelectedProfile(username);
                setView('profile');
              }} />
            </div>
          </div>
        );

      // Games
      case 'game-memory': return <MemoryMatch onFinish={handleGameFinish} highScore={getHighScore('memory')} />;
      case 'game-guess': return <GuessNumber onFinish={handleGameFinish} highScore={getHighScore('guess')} />;
      case 'game-snake': return <SnakeGame onFinish={handleGameFinish} highScore={getHighScore('snake')} />;
      case 'game-balloon': return <BalloonPopper onFinish={handleGameFinish} highScore={getHighScore('balloon')} />;
      case 'game-lane-racer': return <LaneRacer onFinish={handleGameFinish} highScore={getHighScore('lane-racer')} />;
      case 'game-moto-racer': return <MotoRacer onFinish={handleGameFinish} highScore={getHighScore('moto-racer')} />;

      // Checkers
      case 'game-checkers-solo':
        return <Checkers onFinish={handleGameFinish} highScore={getHighScore('checkers')} matchId={selectedMatch} />;
      case 'game-checkers-lobby':
        return <MultiplayerLobby
          gameType="checkers"
          gameName="Checkers"
          initialInviteCode={inviteCode}
          onBack={() => { setInviteCode(null); setView('library'); }}
          onStart={(room) => {
            setCheckersRoom(room);
            setInviteCode(null);
            setView('game-checkers-multiplayer');
          }}
        />;
      case 'game-checkers-multiplayer':
        return <CheckersMultiplayer
          room={checkersRoom}
          onFinish={() => {
            setCheckersRoom(null);
            handleGameFinish(null);
          }}
        />;

      // Chess
      case 'game-chess-solo':
        return <Chess onFinish={handleGameFinish} highScore={getHighScore('chess')} matchId={selectedMatch} />;
      case 'game-chess-lobby':
        return <MultiplayerLobby
          gameType="chess"
          gameName="Chess"
          initialInviteCode={inviteCode}
          onBack={() => { setInviteCode(null); setView('library'); }}
          onStart={(room) => {
            setChessRoom(room);
            setInviteCode(null);
            setView('game-chess-multiplayer');
          }}
        />;
      case 'game-chess-multiplayer':
        return <ChessMultiplayer
          room={chessRoom}
          onFinish={() => {
            setChessRoom(null);
            handleGameFinish(null);
          }}
        />;
      // Tic-Tac-Toe
      case 'game-tictactoe-solo':
        return <TicTacToe onFinish={handleGameFinish} onRematch={(matchId) => setSelectedMatch(matchId)} highScore={getHighScore('tictactoe')} matchId={selectedMatch} />;
      case 'game-tictactoe-lobby':
        return <MultiplayerLobby
          gameType="tictactoe"
          gameName="Tic-Tac-Toe"
          initialInviteCode={inviteCode}
          onBack={() => { setInviteCode(null); setView('library'); }}
          onStart={(room) => {
            setTicTacToeRoom(room);
            setInviteCode(null);
            setView('game-tictactoe-multiplayer');
          }}
        />;
      case 'game-tictactoe-multiplayer':
        return <TicTacToeMultiplayer
          room={tictactoeRoom}
          onFinish={() => {
            setTicTacToeRoom(null);
            handleGameFinish(null);
          }}
        />;
      case 'game-2048': return <Game2048 onFinish={handleGameFinish} highScore={getHighScore('2048')} />;
      case 'game-tetris': return <Tetris onFinish={handleGameFinish} highScore={getHighScore('tetris')} />;
      // Connect Four
      case 'game-connectfour-solo':
        return <ConnectFour onFinish={handleGameFinish} highScore={getHighScore('connectfour')} matchId={selectedMatch} />;
      case 'game-connectfour-lobby':
        return <MultiplayerLobby
          gameType="connectfour"
          gameName="Connect Four"
          initialInviteCode={inviteCode}
          onBack={() => { setInviteCode(null); setView('library'); }}
          onStart={(room) => {
            setConnectFourRoom(room);
            setInviteCode(null);
            setView('game-connectfour-multiplayer');
          }}
        />;
      case 'game-connectfour-multiplayer':
        return <ConnectFourMultiplayer
          room={connectFourRoom}
          onFinish={() => {
            setConnectFourRoom(null);
            handleGameFinish(null);
          }}
        />;
      case 'game-sudoku': return <Sudoku onFinish={handleGameFinish} highScore={getHighScore('sudoku')} />;
      case 'game-blackjack': return <Blackjack onFinish={handleGameFinish} highScore={getHighScore('blackjack')} />;

      // UNO
      case 'game-uno-solo':
        return <Uno onFinish={handleGameFinish} highScore={getHighScore('uno')} />;
      case 'game-uno-lobby':
        return <MultiplayerLobby
          gameType="uno"
          gameName="UNO"
          initialInviteCode={inviteCode}
          onBack={() => {
            setInviteCode(null);
            setView('library');
          }}
          onStart={(room) => {
            setUnoRoom(room);
            setInviteCode(null);
            setView('game-uno-multiplayer');
          }}
        />;
      case 'game-uno-multiplayer':
        return <UnoMultiplayer
          room={unoRoom}
          onFinish={() => {
            setUnoRoom(null);
            handleGameFinish(null);
          }}
        />;

      case 'game-solitaire': return <Solitaire onFinish={handleGameFinish} highScore={getHighScore('solitaire')} />;
      case 'game-whackamole': return <WhackAMole onFinish={handleGameFinish} highScore={getHighScore('whackamole')} />;
      case 'game-minesweeper': return <Minesweeper onFinish={handleGameFinish} highScore={getHighScore('minesweeper')} />;
      case 'game-reversi': return <Reversi onFinish={handleGameFinish} highScore={getHighScore('reversi')} />;
      case 'game-battleship': return <Battleship onFinish={handleGameFinish} highScore={getHighScore('battleship')} />;
      case 'game-flappybird': return <FlappyBird onFinish={handleGameFinish} highScore={getHighScore('flappybird')} />;
      case 'game-brickbreaker': return <BrickBreaker onFinish={handleGameFinish} highScore={getHighScore('brickbreaker')} />;

      default: return <GameLibrary onSelectGame={(type) => setView(`game-${type}`)} />;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 onClick={() => setView('library')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Return to Game Library">
          🕹️ Online Game Studio
        </h1>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => { setSelectedProfile(user.username); setView('profile'); }}>
              <div style={{ fontWeight: 'bold' }}>{user.displayName || user.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                {isAdmin && <span style={{ background: '#764ba2', padding: '0.15rem 0.4rem', borderRadius: '4px', marginRight: '0.5rem', fontSize: '0.7rem' }}>ADMIN</span>}
                Level {user.level || 1} • Score: {user.totalScore || 0}
              </div>
            </div>
            {/* User Menu */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                {user.avatarEmoji || '👤'} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{showMenu ? '▲' : '▼'}</span>
              </button>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowMenu(false)} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#242424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', width: '200px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button onClick={() => { setView('social'); setShowMenu(false); }} style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem' }}>👥 Social Hub</button>
                    <button onClick={() => { setView('leaderboard'); setShowMenu(false); }} style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem' }}>🏆 Rankings</button>
                    <button onClick={() => { setShowHelp(true); setShowMenu(false); }} style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem' }}>❓ Help</button>
                    {isAdmin && <button onClick={() => { setView('admin'); setShowMenu(false); }} style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem', color: '#a0aec0' }}>🛡️ Admin</button>}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                    <button onClick={handleLogout} style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem', color: '#ff6b6b' }}>🚪 Logout</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#242424', padding: '2rem', borderRadius: '12px', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2>How to Play</h2>
            <p>Earn XP by playing games. Level up every 1000 XP.</p>
            <button onClick={() => setShowHelp(false)}>Got it!</button>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
}

export default App;
