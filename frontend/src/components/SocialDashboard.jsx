import React, { useEffect, useState } from 'react';
import { SocialService } from '../services/SocialService';

export default function SocialDashboard({ onBack, onViewProfile }) {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const refreshData = () => {
        SocialService.getFriends().then(setFriends).catch(console.error);
        SocialService.getPendingRequests().then(setRequests).catch(console.error);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleSendRequest = (e) => {
        e.preventDefault();
        SocialService.sendFriendRequest(searchQuery)
            .then(() => {
                setStatusMsg(`Request sent to ${searchQuery}`);
                setSearchQuery('');
                setTimeout(() => setStatusMsg(''), 3000);
            })
            .catch(err => setStatusMsg(`Error: ${err.message}`));
    };

    const handleAccept = (requestId) => {
        SocialService.acceptRequest(requestId)
            .then(() => {
                refreshData();
                setStatusMsg('Friend request accepted!');
                setTimeout(() => setStatusMsg(''), 3000);
            })
            .catch(console.error);
    };

    const handleUnfriend = async (username) => {
        if (window.confirm(`Are you sure you want to unfriend ${username}?`)) {
            try {
                await SocialService.unfriend(username);
                refreshData();
                setStatusMsg(`Unfriended ${username}`);
                setTimeout(() => setStatusMsg(''), 3000);
            } catch (err) {
                setStatusMsg('Error: ' + err.message);
            }
        }
    };

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
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                            onClick={() => onViewProfile(friend.username)}
                                        >
                                            View Profile
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

                {/* Right: Pending Requests */}
                <div>
                    <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>Pending Requests ({requests.length})</h3>
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
                </div>
            </div>
        </div>
    );
}
