import React, { useEffect, useState } from 'react';
import { ProfileService } from '../services/ProfileService';
import { AuthService } from '../services/AuthService';

export default function Profile({ username, onBack }) {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [twitter, setTwitter] = useState('');
    const [discord, setDiscord] = useState('');
    const [github, setGithub] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = currentUser?.username === username;

    useEffect(() => {
        setLoading(true);
        setError(null);
        ProfileService.getProfile(username)
            .then(data => {
                setProfile(data);
                setBio(data.user.bio || '');
                setTwitter(data.user.twitter || '');
                setDiscord(data.user.discord || '');
                setGithub(data.user.github || '');
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [username]);

    const handleSaveProfile = () => {
        const profileData = { bio, twitter, discord, github };
        ProfileService.updateProfile(profileData)
            .then(updatedUser => {
                setProfile(prev => ({ ...prev, user: updatedUser }));
                setIsEditing(false);
                // Update local storage to keep sync if it's own profile
                if (isOwnProfile) {
                    const localUser = AuthService.getCurrentUser();
                    localStorage.setItem('user', JSON.stringify({ ...localUser, ...updatedUser }));
                }
            })
            .catch(console.error);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</div>;
    if (error) return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#ff6b6b' }}>Error: {error}</p>
            <button onClick={onBack} style={{ background: '#444' }}>Back</button>
        </div>
    );
    if (!profile) return <div style={{ textAlign: 'center', padding: '2rem' }}>User not found.</div>;

    const { user, achievements, recentActivities } = profile;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 'bold', color: 'white', border: '4px solid rgba(255,255,255,0.1)'
                    }}>
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '2rem' }}>{user.username}</h2>
                        <div style={{ display: 'flex', gap: '1rem', color: '#888', marginTop: '0.25rem' }}>
                            <span>Level {user.level}</span>
                            <span>•</span>
                            <span>Total Score: {user.totalScore}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onBack} style={{ background: '#444' }}>Back</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Side: Bio & Achievements */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Bio</h3>
                            {isOwnProfile && !isEditing && (
                                <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Edit</button>
                            )}
                        </div>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        style={{ width: '100%', minHeight: '80px', background: '#333', border: '1px solid #444', color: 'white', padding: '0.5rem', borderRadius: '8px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Twitter</label>
                                        <input
                                            value={twitter}
                                            onChange={(e) => setTwitter(e.target.value)}
                                            placeholder="@handle"
                                            style={{ width: '100%', background: '#333', border: '1px solid #444', color: 'white', padding: '0.5rem', borderRadius: '8px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>GitHub</label>
                                        <input
                                            value={github}
                                            onChange={(e) => setGithub(e.target.value)}
                                            placeholder="username"
                                            style={{ width: '100%', background: '#333', border: '1px solid #444', color: 'white', padding: '0.5rem', borderRadius: '8px' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Discord</label>
                                    <input
                                        value={discord}
                                        onChange={(e) => setDiscord(e.target.value)}
                                        placeholder="username#0000"
                                        style={{ width: '100%', background: '#333', border: '1px solid #444', color: 'white', padding: '0.5rem', borderRadius: '8px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setIsEditing(false)} style={{ background: '#444', fontSize: '0.8rem' }}>Cancel</button>
                                    <button onClick={handleSaveProfile} style={{ background: '#42d392', color: '#000', fontSize: '0.8rem', fontWeight: 'bold' }}>Save Changes</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{ color: '#ccc', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
                                    {user.bio || (isOwnProfile ? "No bio yet. Click edit to add one!" : "This user hasn't added a bio yet.")}
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                    {user.twitter && (
                                        <a href={`https://twitter.com/${user.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#1DA1F2', textDecoration: 'none', fontSize: '0.9rem' }}>🐦 Twitter</a>
                                    )}
                                    {user.github && (
                                        <a href={`https://github.com/${user.github}`} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.9rem' }}>🐙 GitHub</a>
                                    )}
                                    {user.discord && (
                                        <span style={{ color: '#5865F2', fontSize: '0.9rem' }}>🎮 {user.discord}</span>
                                    )}
                                    {!user.twitter && !user.github && !user.discord && (
                                        <span style={{ color: '#666', fontSize: '0.8rem italic' }}>No social handles linked</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Achievements ({achievements.length})</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '1rem' }}>
                            {achievements.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.9rem' }}>No achievements earned yet.</p>
                            ) : achievements.map((a, i) => (
                                <div
                                    key={i}
                                    data-tooltip={`${a.name}\n${a.description}`}
                                    style={{
                                        fontSize: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px'
                                    }}
                                >
                                    {a.badge}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Side: Activity Feed */}
                <section style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Recent Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentActivities.length === 0 ? (
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>No recent activities.</p>
                        ) : recentActivities.map((act, i) => (
                            <div key={i} style={{
                                padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                borderLeft: '3px solid #667eea', fontSize: '0.9rem'
                            }}>
                                <div style={{ color: '#ccc' }}>{act.content}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                                    {new Date(act.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
