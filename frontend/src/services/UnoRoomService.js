import { AuthService } from './AuthService';
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/api/uno`;

export const UnoRoomService = {
    // Create a new room
    createRoom: async (maxPlayers = 4) => {
        const response = await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify({ maxPlayers })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create room');
        }
        return response.json();
    },

    // Get room by ID
    getRoom: async (roomId) => {
        const response = await fetch(`${API_URL}/rooms/${roomId}`, {
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Room not found');
        }
        return response.json();
    },

    // Get room by invite code
    getRoomByCode: async (inviteCode) => {
        const response = await fetch(`${API_URL}/rooms/code/${inviteCode}`, {
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Room not found');
        }
        return response.json();
    },

    // Join a room by invite code
    joinRoom: async (inviteCode) => {
        const response = await fetch(`${API_URL}/rooms/join/${inviteCode}`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to join room');
        }
        return response.json();
    },

    // Leave a room
    leaveRoom: async (roomId) => {
        const response = await fetch(`${API_URL}/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to leave room');
        }
        return response.json();
    },

    // Start the game (host only)
    startGame: async (roomId) => {
        const response = await fetch(`${API_URL}/rooms/${roomId}/start`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start game');
        }
        return response.json();
    },

    // Play a card
    playCard: async (roomId, cardId, chosenColor = null) => {
        const response = await fetch(`${API_URL}/rooms/${roomId}/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify({ cardId, chosenColor })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to play card');
        }
        return response.json();
    },

    // Draw a card
    drawCard: async (roomId) => {
        const response = await fetch(`${API_URL}/rooms/${roomId}/draw`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to draw card');
        }
        return response.json();
    },

    // Pass turn (after drawing a playable card)
    passTurn: async (roomId) => {
        const response = await fetch(`${API_URL}/rooms/${roomId}/pass`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to pass turn');
        }
        return response.json();
    },

    // Get user's active UNO rooms
    getMyRooms: async () => {
        const response = await fetch(`${API_URL}/my-rooms`, {
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get rooms');
        }
        return response.json();
    },

    // Play again (host only)
    playAgain: async (roomId) => {
        const response = await fetch(`${API_URL}/rooms/${roomId}/play-again`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to restart game');
        }
        return response.json();
    }
};
