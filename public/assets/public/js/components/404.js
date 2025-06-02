document.addEventListener('DOMContentLoaded', function () {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryType = urlParams.get('q');
        const requestedPath = decodeURIComponent(urlParams.get('path') || '');
        const errorMessageEl = document.getElementById('error-message');

        const displayPath = requestedPath.replace(/^\/+|\/+$/g, '');
        const cleanPath = displayPath.replace(/\.html$/, '');
        const friendlyPath = cleanPath.split('/').pop().replace(/-/g, ' ');

        if (queryType === 'html' && displayPath.endsWith('.html')) {
            errorMessageEl.innerHTML = `The HTML file <strong>"${displayPath}"</strong> wasn't found.`;
        }
        else if (cleanPath) {
            errorMessageEl.innerHTML = `The page <strong>"${friendlyPath}"</strong> couldn't be found.`;
        }

    } catch (error) {
        console.error('Error processing 404 page:', error);
    }
});