import { AuthService } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8081';

export const AchievementService = {
    getMyAchievements: async () => {
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${API_URL}/api/achievements/my`, {
            headers: authHeader ? { 'Authorization': authHeader } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch achievements');
        return response.json();
    }
};
