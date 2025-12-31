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


function App() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [view, setView] = useState('login');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [scores, setScores] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);



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
    if (updatedUser) {
      setUser(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem('user', JSON.stringify({ ...AuthService.getCurrentUser(), ...updatedUser }));
      GameService.getMyScores().then(setScores).catch(console.error);
      AchievementService.getMyAchievements().then(setAchievements).catch(console.error);
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
      case 'social':
        return <SocialDashboard
          onBack={() => setView('library')}
          onViewProfile={(username) => {
            setSelectedProfile(username);
            setView('profile');
          }}
          onStartMatch={(matchId) => {
            setSelectedMatch(matchId);
            setView('game-checkers');
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
            <GameLibrary onSelectGame={(type) => setView(`game-${type}`)} />
            <ActivityFeed />
          </div>
        );
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
      case 'game-checkers':
        return <Checkers
          onFinish={(user) => {
            handleGameFinish(user);
            setSelectedMatch(null);
          }}
          highScore={getHighScore('checkers')}
          matchId={selectedMatch}
        />;
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
            <div
              style={{ textAlign: 'right', cursor: 'pointer' }}
              onClick={() => {
                setSelectedProfile(user.username);
                setView('profile');
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{user.displayName || user.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                {isAdmin && <span style={{ background: '#764ba2', padding: '0.15rem 0.4rem', borderRadius: '4px', marginRight: '0.5rem', fontSize: '0.7rem' }}>ADMIN</span>}
                Level {user.level || 1} • Score: {user.totalScore || 0}
              </div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                {achievements.map((a, i) => (
                  <span
                    key={i}
                    data-tooltip={`${a.name}\n${a.description}`}
                    style={{ fontSize: '1.2rem' }}
                  >
                    {a.badge}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.6rem 1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1.2rem',
                  transition: 'all 0.2s'
                }}
              >
                {user.avatarEmoji || '👤'}
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{showMenu ? '▲' : '▼'}</span>
              </button>

              {showMenu && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                    onClick={() => setShowMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    background: '#242424',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    width: '200px',
                    zIndex: 100,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user.displayName || user.username}</div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => { setView('admin'); setShowMenu(false); }}
                        style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem', color: '#a0aec0' }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                      >
                        🛡️ Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => { setView('social'); setShowMenu(false); }}
                      style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem' }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      👥 Social Hub
                    </button>
                    <button
                      onClick={() => { setView('leaderboard'); setShowMenu(false); }}
                      style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem' }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      🏆 Rankings
                    </button>
                    <button
                      onClick={() => { setShowHelp(true); setShowMenu(false); }}
                      style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem' }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      ❓ Help & Guide
                    </button>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{ background: 'transparent', textAlign: 'left', padding: '10px 12px', fontSize: '0.9rem', color: '#ff6b6b' }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(255,107,107,0.1)'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}
            </div>
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
