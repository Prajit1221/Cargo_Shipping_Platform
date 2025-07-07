// Authentication logic for login, signup, and logout
// To be implemented using Firebase Auth

document.addEventListener('DOMContentLoaded', function () {
    // Signup functionality
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            // Prevent submission if step 2 is not visible (user hasn't selected type and clicked Next)
            const step2 = document.getElementById('step2');
            if (step2 && step2.style.display === 'none') {
                alert('Please select your user type and click Next before filling the form.');
                return;
            }
            const role = document.getElementById('role').value;
            let name = '', company = '', mobile = '', license = '', truckReg = '';
            if (role === 'cargo_owner') {
                name = document.getElementById('name').value.trim();
                company = document.getElementById('company').value.trim();
                mobile = document.getElementById('mobile').value.trim();
            } else {
                name = document.getElementById('nameTruck').value.trim();
                mobile = document.getElementById('mobileTruck').value.trim();
                license = document.getElementById('license').value.trim();
                truckReg = document.getElementById('truckReg').value.trim();
            }
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Email format validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            if (!name || !mobile) {
                alert('Please fill in all required fields.');
                return;
            }
            if (role === 'cargo_owner' && !company) {
                alert('Please provide your company name.');
                return;
            }
            if (role === 'truck_owner' && (!license || !truckReg)) {
                alert('Please provide license and truck registration number.');
                return;
            }

            try {
                // Create user with Firebase Auth
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Prepare user data
                const userData = {
                    name: name,
                    mobile: mobile,
                    email: email,
                    role: role,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                if (role === 'cargo_owner') {
                    userData.company = company;
                }
                if (role === 'truck_owner') {
                    userData.license = license;
                    userData.truckReg = truckReg;
                }

                // Store user info in Firestore
                await firebase.firestore().collection('users').doc(user.uid).set(userData);

                // Redirect to dashboard or home
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert('Signup failed: ' + error.message);
            }
        });
    }

    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Sign in user with Firebase Auth
                await firebase.auth().signInWithEmailAndPassword(email, password);
                // Redirect to dashboard or home
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });
    }

    // Password reset functionality
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            if (!email) {
                alert('Please enter your email in the email field above to reset your password.');
                return;
            }
            firebase.auth().sendPasswordResetEmail(email)
                .then(function() {
                    alert('Password reset email sent! Please check your inbox.');
                })
                .catch(function(error) {
                    alert('Error sending password reset email: ' + error.message);
                });
        });
    }
}); 