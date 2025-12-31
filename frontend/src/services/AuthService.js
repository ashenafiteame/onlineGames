const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/auth`
    : 'http://localhost:8081/api/auth';

export const AuthService = {
    login: async (username, password) => {
        const authHeader = 'Basic ' + btoa(username + ':' + password);
        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader
            }
        });

        if (response.ok) {
            const user = await response.json();
            const userData = { ...user, authHeader };
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        }
        throw new Error('Login failed');
    },

    signup: async (username, password) => {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Signup failed');
        }
        return response.text();
    },

    logout: () => {
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },

    getAuthHeader: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user ? user.authHeader : null;
    }
};
