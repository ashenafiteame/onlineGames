import { AuthService } from "./AuthService";

import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/api/connectfour/rooms`;

export const ConnectFourRoomService = {
    startGame: async (roomId) => {
        const response = await fetch(`${API_URL}/${roomId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': AuthService.getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start game');
        }
        return response.json();
    },

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
    }
};
