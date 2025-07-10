// Session management: Redirect to login if not authenticated

document.addEventListener('DOMContentLoaded', function () {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // Not logged in, redirect to login page
            window.location.href = 'login.html';
        }
        // If logged in, you can access user info here if needed
    });
}); 