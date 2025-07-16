// Cargo listing logic
// To be implemented using Firestore and Firebase Storage

document.addEventListener('DOMContentLoaded', function () {
    const cargoForm = document.getElementById('cargoForm');
    if (cargoForm) {
        cargoForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const origin = document.getElementById('origin').value;
            const destination = document.getElementById('destination').value;
            const weight = document.getElementById('weight').value;
            const description = document.getElementById('description').value;
            const imagesInput = document.getElementById('images');

            const user = firebase.auth().currentUser;
            if (!user) {
                alert('You must be logged in to list cargo.');
                return;
            }

            // Upload images to Firebase Storage and get URLs
            let imageUrls = [];
            if (imagesInput.files.length > 0) {
                const uploadPromises = Array.from(imagesInput.files).map(async (file) => {
                    const storageRef = firebase.storage().ref();
                    const fileRef = storageRef.child('cargo_images/' + Date.now() + '_' + file.name);
                    await fileRef.put(file);
                    return await fileRef.getDownloadURL();
                });
                imageUrls = await Promise.all(uploadPromises);
            }

            // Save cargo details to Firestore
            try {
                await firebase.firestore().collection('cargos').add({
                    origin,
                    destination,
                    weight: Number(weight),
                    description,
                    images: imageUrls,
                    ownerId: user.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'open' // open for bidding
                });
                alert('Cargo listed successfully!');
                cargoForm.reset();
                // Optionally redirect to dashboard or listing page
                // window.location.href = 'dashboard.html';
            } catch (error) {
                alert('Failed to list cargo: ' + error.message);
            }
        });
    }

    // Load all cargos for display below the form
    const allCargosSection = document.getElementById('allCargos');
    let currentUserId = null;
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserId = user.uid;
        }
        loadAllCargos();
    });

    function loadAllCargos() {
        firebase.firestore().collection('cargos')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                allCargosSection.innerHTML = '';
                if (snapshot.empty) {
                    allCargosSection.innerHTML = '<p>No cargos listed yet.</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const cargo = doc.data();
                    const cargoId = doc.id;
                    const isOwner = currentUserId === cargo.ownerId;
                    const imagesHtml = (cargo.images && cargo.images.length > 0)
                        ? cargo.images.map(url => `<img src="${url}" alt="Cargo Image" style="max-width:80px;max-height:80px;margin:2px;">`).join('')
                        : '<em>No images</em>';
                    const cargoDiv = document.createElement('div');
                    cargoDiv.className = 'cargo-list-item';
                    cargoDiv.style = 'border:1px solid #ddd;padding:0.7rem;margin-bottom:0.7rem;border-radius:7px;';
                    cargoDiv.innerHTML = `
                        <h4>${cargo.origin} → ${cargo.destination}</h4>
                        <p><strong>Weight:</strong> ${cargo.weight} kg</p>
                        <p><strong>Description:</strong> ${cargo.description}</p>
                        <div>${imagesHtml}</div>
                    `;
                    // Remove any bid or auction options from listing page
                    // Only show 'Enter Auction' button for non-owners
                    if (!isOwner) {
                        const enterBtn = document.createElement('button');
                        enterBtn.textContent = 'Enter Auction';
                        enterBtn.onclick = function() {
                            window.location.href = `auction.html?cargoId=${cargoId}`;
                        };
                        cargoDiv.appendChild(enterBtn);
                    } else {
                        const ownerMsg = document.createElement('span');
                        ownerMsg.textContent = 'Your Listing';
                        ownerMsg.style = 'margin-left:1rem;color:#1a73e8;font-weight:600;';
                        cargoDiv.appendChild(ownerMsg);
                    }
                    allCargosSection.appendChild(cargoDiv);
                });
            });
    }
}); 