/**
 * A wrapper for the fetch API that automatically adds the
 * 'x-user-id' authentication header to every request.
 * It reads the user object from localStorage.
 *
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options for the fetch request.
 * @returns {Promise<Response>} The fetch response.
 */
export const fetchWithAuth = async (url, options = {}) => {
    const userJSON = localStorage.getItem('user');
    if (!userJSON) {
        // This case should ideally be handled by protected routes,
        // but it's a good safeguard.
        return Promise.reject(new Error('No user found in localStorage.'));
    }

    const user = JSON.parse(userJSON);

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            ...options.headers,
        },
    };

    // Automatically stringify the body if it's an object
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    // If the server returns 401 or 403, it means the user is unauthorized
    // or the session is invalid. We should log them out.
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('user');
        sessionStorage.clear();
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(new Error('Unauthorized'));
    }

    return response;
};