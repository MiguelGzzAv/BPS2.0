// --- Authentication Helper ---

/**
 * Retrieves the logged-in user's data from localStorage.
 * If no user is found, it redirects to the login page.
 * @returns {object|null} The user object or null if not found.
 */
function getLoggedInUser() {
    const userJSON = localStorage.getItem('user');
    if (!userJSON) {
        window.location.href = '/login.html';
        return null;
    }
    return JSON.parse(userJSON);
}

/**
 * A wrapper for the fetch API that automatically adds the
 * 'x-user-id' authentication header to every request.
 * It also handles unauthorized errors by redirecting to the login page.
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options for the fetch request.
 * @returns {Promise<Response>} The fetch response.
 */
async function fetchWithAuth(url, options = {}) {
    const user = getLoggedInUser();
    if (!user) {
        // This will be caught by the check above, but it's a safeguard.
        return Promise.reject('No user is logged in.');
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            // If the token is invalid or expired, clear storage and redirect.
            logout();
            return Promise.reject('Unauthorized');
        }
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        return Promise.reject(error);
    }
}

/**
 * Logs the user out by clearing localStorage and redirecting to the login page.
 */
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

/**
 * Call this function at the start of any protected page to ensure
 * a user is logged in.
 */
function protectPage() {
    getLoggedInUser();
}