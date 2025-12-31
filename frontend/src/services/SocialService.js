import { AuthService } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8081';

export const SocialService = {
    getFeed: async () => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/social/feed`, {
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch feed');
        return response.json();
    },

    getFriends: async () => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/social/friends`, {
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch friends');
        return response.json();
    },

    getPendingRequests: async () => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/social/requests/pending`, {
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch requests');
        return response.json();
    },

    sendFriendRequest: async (username) => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/social/request/${username}`, {
            method: 'POST',
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to send request');
        }
        return response.text();
    },

    acceptRequest: async (requestId) => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/social/accept/${requestId}`, {
            method: 'POST',
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to accept request');
        return response.text();
    }
};
