import { AuthService } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8081';

export const GameService = {
    getGames: async () => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/games`, {
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch games');
        return response.json();
    },

    submitScore: async (gameType, score) => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {})
            },
            body: JSON.stringify({ gameType, score })
        });
        if (!response.ok) throw new Error('Failed to submit score');
        return response.json(); // Returns updated user with new level/score
    },

    getMyScores: async () => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/scores/my`, {
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch scores');
        return response.json();
    }
};
