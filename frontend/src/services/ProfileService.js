import { AuthService } from './AuthService';
import { API_BASE_URL } from './config';

export const ProfileService = {
    getProfile: async (username) => {
        const response = await fetch(`${API_BASE_URL}/api/profiles/${username}`, {
            headers: {
                'Authorization': AuthService.getAuthHeader()
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch profile');
        }
        return response.json();
    },

    updateProfile: async (profileData) => {
        const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AuthService.getAuthHeader()
            },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return response.json();
    }
};
