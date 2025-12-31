import { AuthService } from './AuthService';

import { API_BASE_URL } from './config';

const API_URL = API_BASE_URL;

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
    },

    unfriend: async (username) => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/social/unfriend/${username}`, {
            method: 'DELETE',
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to unfriend');
        return response.text();
    },

    getOnlineUsers: async () => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/social/online`, {
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch online users');
        return response.json();
    },

    heartbeat: async () => {
        const authHeader = AuthService.getAuthHeader();
        await fetch(`${API_URL}/api/social/heartbeat`, {
            method: 'POST',
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
    }
};
