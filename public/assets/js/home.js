document.addEventListener('DOMContentLoaded', function () {
    const auctionList = document.getElementById('auction-list');

    if (auctionList) {
        firebase.firestore().collection('cargos').orderBy('createdAt', 'desc').limit(3).onSnapshot(snapshot => {
            auctionList.innerHTML = '';
            if (snapshot.empty) {
                auctionList.innerHTML = '<p>No auctions available at the moment.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const cargo = doc.data();
                const cargoId = doc.id;
                const auctionCard = document.createElement('div');
                auctionCard.className = 'auction-card';
                auctionCard.innerHTML = `
                    <h4>${cargo.origin} → ${cargo.destination}</h4>
                    <p><strong>Weight:</strong> ${cargo.weight} kg</p>
                    <a href="auction.html?cargoId=${cargoId}" class="btn btn-primary">View Auction</a>
                `;
                auctionList.appendChild(auctionCard);
            });
        });
    }
});
