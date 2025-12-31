import React, { useEffect, useState } from 'react';
import { SocialService } from '../services/SocialService';

export default function SocialDashboard({ onBack }) {
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
                                <div key={friend.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <strong>{friend.username}</strong>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>Level {friend.level}</div>
                                    </div>
                                    <button style={{ fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => alert("Profile View TBD")}>View Profile</button>
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
