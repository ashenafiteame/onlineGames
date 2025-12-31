import { AuthService } from './AuthService';

import { API_BASE_URL } from './config';

const API_URL = API_BASE_URL;

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
