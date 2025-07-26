document.addEventListener('DOMContentLoaded', function () {
    // Auth state for nav
    firebase.auth().onAuthStateChanged(function(user) {
        const loginLink = document.getElementById('nav-login');
        const logoutLink = document.getElementById('nav-logout');
        if (user) {
            if (loginLink) loginLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = '';
        } else {
            if (loginLink) loginLink.style.display = '';
            if (logoutLink) logoutLink.style.display = 'none';
        }
    });
    // Logout handler
    const logoutLink = document.getElementById('nav-logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();
            firebase.auth().signOut().then(function () {
                window.location.href = 'login.html';
            });
        });
    }
    // Dark mode toggle
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
            // Save preference
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', '1');
            } else {
                localStorage.removeItem('darkMode');
            }
        });
        // Load preference
        if (localStorage.getItem('darkMode')) {
            document.body.classList.add('dark-mode');
        }
    }

    // Hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navCenter = document.querySelector('.nav-center');
    hamburger.addEventListener('click', () => {
        navCenter.classList.toggle('active');
    });
}); 