document.addEventListener('DOMContentLoaded', function () {
    const completedAuctionsSection = document.getElementById('completedAuctions');
    let currentUserId = null;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserId = user.uid;
            loadCompletedAuctions();
        } else {
            completedAuctionsSection.innerHTML = '<p>Please log in to view auction history.</p>';
        }
    });

    function loadCompletedAuctions() {
        firebase.firestore().collection('cargos')
            .where('status', '==', 'closed')
            .orderBy('auctionEnd', 'desc')
            .onSnapshot(snapshot => {
                completedAuctionsSection.innerHTML = '';
                if (snapshot.empty) {
                    completedAuctionsSection.innerHTML = '<p>No completed auctions found.</p>';
                    return;
                }

                let userAuctionsFound = false;

                snapshot.forEach(doc => {
                    const cargo = doc.data();
                    const cargoId = doc.id;

                    // User is either the owner or the winner
                    if (cargo.ownerId === currentUserId || cargo.winnerId === currentUserId) {
                        userAuctionsFound = true;
                        const cargoDiv = document.createElement('div');
                        cargoDiv.className = 'auction-card';

                        const auctionEnd = cargo.auctionEnd ? cargo.auctionEnd.toDate().toLocaleString() : 'N/A';

                        cargoDiv.innerHTML = `
                            <h4>${cargo.origin} → ${cargo.destination}</h4>
                            <div class="details-grid">
                                <div class="detail-item"><strong>Type:</strong> <span>${cargo.cargoType}</span></div>
                                <div class="detail-item"><strong>Weight:</strong> <span>${cargo.weight} kg</span></div>
                                <div class="detail-item"><strong>Ended On:</strong> <span>${auctionEnd}</span></div>
                            </div>
                            <div class="bid-info">
                                <div id="winner-${cargoId}"></div>
                            </div>
                        `;

                        completedAuctionsSection.appendChild(cargoDiv);
                        showWinner(cargoId);
                    }
                });

                if (!userAuctionsFound) {
                    completedAuctionsSection.innerHTML = '<p>No completed auctions found for you.</p>';
                }

            }, err => {
                completedAuctionsSection.innerHTML = `<p>Error loading completed auctions: ${err.message}</p>`;
            });
    }

    function showWinner(cargoId) {
        const winnerDiv = document.getElementById(`winner-${cargoId}`);
        firebase.firestore().collection('cargos').doc(cargoId).get().then(doc => {
            const data = doc.data();
            if (data && data.status === 'closed') {
                if (data.winnerId) {
                    const winnerText = data.winnerId === currentUserId ? 'You won!' : `Winner: ${data.winnerId.slice(0, 6)}...`;
                    winnerDiv.innerHTML = `<strong>${winnerText}</strong> <span style='color:#388e3c;'>(₹${data.winningAmount})</span>`;
                } else {
                    winnerDiv.innerHTML = `<strong>No bids placed. No winner.</strong>`;
                }
            }
        });
    }
});