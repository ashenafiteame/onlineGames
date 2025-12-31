import { AuthService } from './AuthService';
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/api/matches`;

export const MatchService = {
    getMyMatches: async () => {
        const response = await fetch(`${API_URL}/my`, {
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to fetch matches');
        return response.json();
    },

    invite: async (username, initialBoard, gameType = 'checkers') => {
        const response = await fetch(`${API_URL}/invite/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify({ initialBoard, gameType })
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to send invite');
        }
        return response.json();
    },

    acceptMatch: async (matchId) => {
        const response = await fetch(`${API_URL}/${matchId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to accept match');
        return response.json();
    },

    submitMove: async (matchId, boardData, nextTurn) => {
        const response = await fetch(`${API_URL}/${matchId}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify({ boardData, nextTurn })
        });
        if (!response.ok) throw new Error('Failed to submit move');
        return response.json();
    },

    getMatch: async (matchId) => {
        const response = await fetch(`${API_URL}/${matchId}`, {
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) throw new Error('Match not found');
        return response.json();
    },

    finishMatch: async (matchId, status = 'FINISHED') => {
        const response = await fetch(`${API_URL}/${matchId}/finish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to finish match');
        return response.json();
    },

    declineMatch: async (matchId) => {
        const response = await fetch(`${API_URL}/${matchId}/decline`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to decline match');
        return response.json();
    },

    forfeitMatch: async (matchId) => {
        const response = await fetch(`${API_URL}/${matchId}/forfeit`, {
            method: 'POST',
            headers: { 'Authorization': AuthService.getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to forfeit match');
        return response.json();
    }
};
