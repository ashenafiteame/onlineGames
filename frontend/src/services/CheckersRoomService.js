import { API_BASE_URL } from './config';
import { AuthService } from './AuthService';

const API_URL = `${API_BASE_URL}/api/checkers/rooms`;

export const CheckersRoomService = {
    // Start game
    startGame: async (roomId) => {
        const response = await fetch(`${API_URL}/${roomId}/start`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start game');
        }
        return response.json(); // Returns updated Room
    },

    // Make move
    makeMove: async (roomId, board, nextTurn, winner) => {
        const response = await fetch(`${API_URL}/${roomId}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify({ board, nextTurn, winner })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to make move');
        }
        return response.json();
    },

    // Request replay
    requestReplay: async (roomId) => {
        const response = await fetch(`${API_URL}/${roomId}/replay`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to request replay');
        }
        return response.json();
    }
};
