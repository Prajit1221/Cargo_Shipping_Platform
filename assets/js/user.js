// User profile, badges, and verification logic
// To be implemented using Firestore and Firebase Auth

document.addEventListener('DOMContentLoaded', function () {
    // Wait for Firebase Auth to confirm user is logged in
    firebase.auth().onAuthStateChanged(async function(user) {
        if (user) {
            const userInfoSection = document.getElementById('userInfo');
            const memberSince = document.getElementById('memberSince');
            try {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    let details = `<div><strong>Name:</strong> ${data.name}</div>`;
                    details += `<div><strong>Role:</strong> ${data.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>`;
                    if (data.role === 'cargo_owner') {
                        details += `<div><strong>Company:</strong> ${data.company || '-'}</div>`;
                    }
                    if (data.role === 'truck_owner') {
                        details += `<div><strong>License No:</strong> ${data.license || '-'}</div>`;
                        details += `<div><strong>Truck Reg. No:</strong> ${data.truckReg || '-'}</div>`;
                    }
                    details += `<div><strong>Email:</strong> ${data.email}</div>`;
                    details += `<div><strong>Mobile:</strong> ${data.mobile}</div>`;
                    userInfoSection.innerHTML = details;
                    if (data.createdAt && data.createdAt.toDate) {
                        memberSince.textContent = `Member Since: ${data.createdAt.toDate().toLocaleDateString()}`;
                    }
                } else {
                    userInfoSection.innerHTML = '<p>User data not found.</p>';
                }
            } catch (error) {
                userInfoSection.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
            }
        }
    });
}); 