import { AuthService } from './AuthService';

export const ProfileService = {
    getProfile: async (username) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/profiles/${username}`, {
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
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/profiles/me`, {
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
