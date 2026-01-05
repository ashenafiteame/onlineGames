import { API_BASE_URL } from './config';
import { AuthService } from './AuthService';

const API_URL = `${API_BASE_URL}/api/rooms`;

export const RoomService = {
    // Create a new room
    createRoom: async (gameType, maxPlayers, settings = {}) => {
        const response = await fetch(`${API_URL}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify({ gameType, maxPlayers, settings })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create room');
        }
        return response.json();
    },

    // Join a room
    joinRoom: async (code) => {
        const response = await fetch(`${API_URL}/join/${code}`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to join room');
        }
        return response.json();
    },

    // Get room details
    getRoom: async (roomId) => {
        const response = await fetch(`${API_URL}/${roomId}`, {
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            throw new Error('Failed to get room');
        }
        return response.json();
    },

    // Leave a room
    leaveRoom: async (roomId) => {
        const response = await fetch(`${API_URL}/${roomId}/leave`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            throw new Error('Failed to leave room');
        }
        return response.json();
    }
};
