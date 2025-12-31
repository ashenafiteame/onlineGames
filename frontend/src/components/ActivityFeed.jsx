import React, { useEffect, useState } from 'react';
import { SocialService } from '../services/SocialService';

export default function ActivityFeed() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshFeed = () => {
        SocialService.getFeed()
            .then(setActivities)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshFeed();
        const interval = setInterval(refreshFeed, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'SCORE': return '🎮';
            case 'ACHIEVEMENT': return '🏆';
            case 'FRIEND_ADDED': return '🤝';
            default: return '📍';
        }
    };

    return (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '400px',
            overflowY: 'auto'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌐 Community Activity
            </h3>
            {loading ? <p>Loading activity...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activities.length === 0 ? <p style={{ color: '#888' }}>No recent activity.</p> : activities.map(activity => (
                        <div key={activity.id} style={{
                            display: 'flex',
                            gap: '12px',
                            fontSize: '0.9rem',
                            paddingBottom: '8px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{getActivityIcon(activity.type)}</span>
                            <div>
                                <strong style={{ color: 'var(--primary)' }}>{activity.user.username}</strong>
                                <span style={{ marginLeft: '4px', color: '#ccc' }}>{activity.content}</span>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>
                                    {new Date(activity.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
