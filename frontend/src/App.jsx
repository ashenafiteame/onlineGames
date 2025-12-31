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

function App() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [view, setView] = useState('login');
  const [showHelp, setShowHelp] = useState(false);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (user) {
      GameService.getMyScores().then(setScores).catch(console.error);
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
    if (updatedUser) {
      setUser(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem('user', JSON.stringify({ ...AuthService.getCurrentUser(), ...updatedUser }));
      GameService.getMyScores().then(setScores).catch(console.error);
    }
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
      case 'library':
        return <GameLibrary onSelectGame={(type) => setView(`game-${type}`)} />;
      case 'game-memory':
        return <MemoryMatch onFinish={handleGameFinish} highScore={getHighScore('memory')} />;
      case 'game-guess':
        return <GuessNumber onFinish={handleGameFinish} highScore={getHighScore('guess')} />;
      case 'game-snake':
        return <SnakeGame onFinish={handleGameFinish} highScore={getHighScore('snake')} />;
      case 'game-balloon':
        return <BalloonPopper onFinish={handleGameFinish} highScore={getHighScore('balloon')} />;
      case 'game-lane-racer':
        return <LaneRacer onFinish={handleGameFinish} highScore={getHighScore('lane-racer')} />;
      case 'game-moto-racer':
        return <MotoRacer onFinish={handleGameFinish} highScore={getHighScore('moto-racer')} />;
      default:
        return <GameLibrary onSelectGame={(type) => setView(`game-${type}`)} />;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🕹️ Online Game Studio</h1>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold' }}>{user.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                {isAdmin && <span style={{ background: '#764ba2', padding: '0.15rem 0.4rem', borderRadius: '4px', marginRight: '0.5rem', fontSize: '0.7rem' }}>ADMIN</span>}
                Level {user.level || 1} • Score: {user.totalScore || 0}
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setView('admin')} style={{ background: '#2d3748' }}>🛡️ Admin</button>
            )}
            <button onClick={() => setShowHelp(true)} style={{ background: '#444' }}>?</button>
            <button onClick={handleLogout} style={{ background: '#3a1c1c', color: '#ff6b6b' }}>Logout</button>
          </div>
        )}
      </div>

      {showHelp && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#242424', padding: '2rem', borderRadius: '12px', maxWidth: '500px',
            border: '1px solid rgba(255,255,255,0.1)', position: 'relative'
          }}>
            <h2 style={{ marginTop: 0 }}>🏆 How to Play</h2>
            <ul style={{ lineHeight: '1.6', paddingLeft: '1.2rem' }}>
              <li><strong>Play Games:</strong> Earn XP by playing any game in the library.</li>
              <li><strong>Scoring:</strong> Higher scores in games = more XP.</li>
              <li><strong>Level Up:</strong> You gain a Level for every <strong>1000 XP</strong>.</li>
            </ul>
            <button onClick={() => setShowHelp(false)} style={{ marginTop: '1rem', width: '100%' }}>Got it!</button>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
}

export default App;
