// This script should be included in every protected page.
// It checks for a valid session and makes user data available.

(function() {
    // A list of pages that do not require authentication.
    const publicPages = ['/login.html', '/forgot-password.html'];

    // Check if the current page is public.
    const isPublicPage = publicPages.some(page => window.location.pathname.endsWith(page));

    // Get user data from sessionStorage.
    const userString = sessionStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (user) {
        // If the user is logged in, make their data globally available for other scripts.
        window.loggedInUser = user;
    } else {
        // If the user is not logged in and the page is not public, redirect to the login page.
        if (!isPublicPage) {
            window.location.href = '/login.html';
        }
    }
})();