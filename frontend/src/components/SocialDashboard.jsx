import React, { useState, useEffect } from 'react';
import { SocialService } from '../services/SocialService';
import { MatchService } from '../services/MatchService';
import { AuthService } from '../services/AuthService';

export default function SocialDashboard({ onBack, onViewProfile, onStartMatch }) {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [matches, setMatches] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        SocialService.getFriends().then(setFriends).catch(console.error);
        SocialService.getPendingRequests().then(setRequests).catch(console.error);
        MatchService.getMyMatches().then(setMatches).catch(console.error);
    };

    const handleSendRequest = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        SocialService.sendFriendRequest(searchQuery.trim())
            .then(() => {
                setStatusMsg(`Friend request sent to ${searchQuery}!`);
                setSearchQuery('');
                setTimeout(() => setStatusMsg(''), 3000);
            })
            .catch(err => setStatusMsg(`Error: ${err.message}`));
    };

    const handleAccept = (requestId) => {
        SocialService.acceptFriendRequest(requestId)
            .then(() => {
                refreshData();
                setStatusMsg('Friend request accepted!');
                setTimeout(() => setStatusMsg(''), 3000);
            })
            .catch(console.error);
    };

    const handleUnfriend = (username) => {
        if (!window.confirm(`Are you sure you want to unfriend ${username}?`)) return;
        SocialService.unfriend(username)
            .then(() => {
                refreshData();
                setStatusMsg(`Unfriended ${username}`);
                setTimeout(() => setStatusMsg(''), 3000);
            })
            .catch(err => setStatusMsg(`Error: ${err.message}`));
    };

    const handleChallenge = (friendUsername) => {
        const BOARD_SIZE = 8;
        const b = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = 2;
            }
        }
        for (let r = 5; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if ((r + c) % 2 !== 0) b[r][c] = 1;
            }
        }

        MatchService.invite(friendUsername, JSON.stringify(b))
            .then(() => {
                setStatusMsg(`Challenge sent to ${friendUsername}!`);
                refreshData();
                setTimeout(() => setStatusMsg(''), 3000);
            })
            .catch(err => setStatusMsg(`Error: ${err.message}`));
    };

    const handleAcceptMatch = (matchId) => {
        MatchService.acceptMatch(matchId)
            .then((match) => {
                onStartMatch(match.id);
            })
            .catch(console.error);
    };

    const currentUser = AuthService.getCurrentUser();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>👥 Social Hub</h2>
                <button onClick={onBack} style={{ background: '#444' }}>Back to Library</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left: Friends List & Search */}
                <div>
                    <section style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>Add Friend</h3>
                        <form onSubmit={handleSendRequest} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Username..."
                                style={{ flex: 1 }}
                                required
                            />
                            <button type="submit">Send Request</button>
                        </form>
                        {statusMsg && <p style={{ fontSize: '0.8rem', marginTop: '8px', color: statusMsg.startsWith('Error') ? '#ff6b6b' : '#42d392' }}>{statusMsg}</p>}
                    </section>

                    <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>My Friends ({friends.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {friends.length === 0 ? <p style={{ color: '#888' }}>No friends yet. Add some people!</p> : friends.map(friend => (
                                <div key={friend.username} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '8px'
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', background: 'var(--bg-card)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '1.2rem'
                                    }}>
                                        {friend.avatarEmoji || friend.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{friend.displayName || friend.username}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>Level {friend.level}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        <button
                                            style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'var(--primary)', color: 'white' }}
                                            onClick={() => handleChallenge(friend.username)}
                                        >
                                            Challenge 🎲
                                        </button>
                                        <button
                                            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                            onClick={() => onViewProfile(friend.username)}
                                        >
                                            Profile
                                        </button>
                                        <button
                                            style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.2)' }}
                                            onClick={() => handleUnfriend(friend.username)}
                                        >
                                            Unfriend
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Pending Requests & Match Invites */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>Pending Friends ({requests.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {requests.length === 0 ? <p style={{ color: '#888' }}>No pending requests.</p> : requests.map(req => (
                                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div>
                                        <strong>{req.sender.username}</strong>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>wants to be friends</div>
                                    </div>
                                    <button onClick={() => handleAccept(req.id)} style={{ background: '#42d392', color: '#000', fontWeight: 'bold' }}>Accept</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>Match Invites ({matches.filter(m => m.status === 'PENDING' && m.player2.username === currentUser?.username).length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {matches.filter(m => m.status === 'PENDING' && m.player2.username === currentUser?.username).length === 0 ? <p style={{ color: '#888' }}>No new challenges.</p> : matches.filter(m => m.status === 'PENDING' && m.player2.username === currentUser?.username).map(match => (
                                <div key={match.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '8px' }}>
                                    <div>
                                        <strong>{match.player1.username}</strong>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>challenged you to {match.gameType}</div>
                                    </div>
                                    <button onClick={() => handleAcceptMatch(match.id)} style={{ background: '#e53e3e', color: '#fff', fontWeight: 'bold' }}>Accept & Play</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {matches.filter(m => m.status === 'ACTIVE').length > 0 && (
                        <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                            <h3 style={{ marginTop: 0 }}>Ongoing Matches ({matches.filter(m => m.status === 'ACTIVE').length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {matches.filter(m => m.status === 'ACTIVE').map(match => (
                                    <div key={match.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <div>
                                            <strong>Vs {match.player1.username === currentUser?.username ? match.player2.username : match.player1.username}</strong>
                                            <div style={{ fontSize: '0.7rem', color: match.currentTurn === currentUser?.username ? '#42d392' : '#888' }}>
                                                {match.currentTurn === currentUser?.username ? "Your turn!" : "Waiting for opponent..."}
                                            </div>
                                        </div>
                                        <button onClick={() => onStartMatch(match.id)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.8rem' }}>Rejoin</button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
