const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/admin`
    : 'http://localhost:8081/api/admin';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.authHeader : null;
};

export const AdminService = {
    getDashboard: async () => {
        const response = await fetch(`${API_URL}/dashboard`, {
            headers: { 'Authorization': getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        return response.json();
    },

    getUsers: async () => {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    deleteUser: async (id) => {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return response.text();
    },

    toggleUserRole: async (id) => {
        const response = await fetch(`${API_URL}/users/${id}/toggle-role`, {
            method: 'PUT',
            headers: { 'Authorization': getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to toggle user role');
        return response.json();
    },

    getLeaderboard: async () => {
        const response = await fetch(`${API_URL}/leaderboard`, {
            headers: { 'Authorization': getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        return response.json();
    },

    getGames: async () => {
        const response = await fetch(`${API_URL}/games`, {
            headers: { 'Authorization': getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to fetch games');
        return response.json();
    },

    deleteGame: async (id) => {
        const response = await fetch(`${API_URL}/games/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': getAuthHeader() }
        });
        if (!response.ok) throw new Error('Failed to delete game');
        return response.text();
    }
};
