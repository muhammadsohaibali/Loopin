function showLoader(show) {
    const loader = document.getElementById('loader-container');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}