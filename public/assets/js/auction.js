// Auction and bidding logic
// To be implemented using Firestore for real-time updates

document.addEventListener('DOMContentLoaded', function () {
    const cargoListSection = document.getElementById('cargoList');
    let currentUserId = null;
    let countdownIntervals = {};
    const urlParams = new URLSearchParams(window.location.search);
    const singleCargoId = urlParams.get('cargoId');
    const bidSection = document.getElementById('bidSection');
    let currentCargoOwnerId = null;

    // Get current user ID
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserId = user.uid;
            if (singleCargoId) {
                loadSingleCargo(singleCargoId);
            } else {
                loadCargos();
            }
        }
    });

    function loadCargos() {
        firebase.firestore().collection('cargos')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                cargoListSection.innerHTML = '';
                // Clear all previous countdown intervals
                Object.values(countdownIntervals).forEach(clearInterval);
                countdownIntervals = {};
                if (snapshot.empty) {
                    cargoListSection.innerHTML = '<p>No cargos available for auction.</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const cargo = doc.data();
                    const cargoId = doc.id;
                    const createdAt = cargo.createdAt && cargo.createdAt.toDate ? cargo.createdAt.toDate() : new Date();
                    const auctionStart = new Date(createdAt.getTime() + 10 * 60 * 1000);
                    const auctionEnd = new Date(auctionStart.getTime() + 5 * 60 * 1000);
                    const now = new Date();
                    let auctionStatus = '';
                    if (now < auctionStart) {
                        auctionStatus = 'not_started';
                    } else if (now >= auctionStart && now < auctionEnd) {
                        auctionStatus = 'running';
                    } else {
                        auctionStatus = 'ended';
                    }
                    const isOwner = currentUserId === cargo.ownerId;
                    const imagesHtml = (cargo.images && cargo.images.length > 0)
                        ? cargo.images.map(url => `<img src="${url}" alt="Cargo Image" style="max-width:100px;max-height:100px;margin:4px;">`).join('')
                        : '<em>No images</em>';

                    // Container for each cargo
                    const cargoDiv = document.createElement('div');
                    cargoDiv.className = 'cargo-item';
                    cargoDiv.style = 'border:1px solid #ccc;padding:1rem;margin-bottom:1rem;border-radius:8px;';
                    cargoDiv.innerHTML = `
                        <h4>${cargo.origin} → ${cargo.destination}</h4>
                        <p><strong>Weight:</strong> ${cargo.weight} kg</p>
                        <p><strong>Description:</strong> ${cargo.description}</p>
                        <div>${imagesHtml}</div>
                        <div id="auctionTimer-${cargoId}"><em>Loading timer...</em></div>
                        <div id="winner-${cargoId}"></div>
                        <div id="lowestBid-${cargoId}"><em>Loading current lowest bid...</em></div>
                        <div id="bidHistory-${cargoId}"><em>Loading bid history...</em></div>
                    `;

                    // Only show Bid button if not owner and auction is running
                    if (!isOwner && auctionStatus === 'running') {
                        const bidBtn = document.createElement('button');
                        bidBtn.textContent = 'Bid';
                        bidBtn.onclick = function() {
                            showBidForm(cargoDiv, cargoId, auctionEnd);
                        };
                        cargoDiv.appendChild(bidBtn);
                    } else if (auctionStatus === 'not_started') {
                        const notStartedMsg = document.createElement('p');
                        notStartedMsg.innerHTML = '<strong>Auction not started</strong>';
                        cargoDiv.appendChild(notStartedMsg);
                    } else if (auctionStatus === 'ended') {
                        const closedMsg = document.createElement('p');
                        closedMsg.innerHTML = '<strong>Auction ended</strong>';
                        cargoDiv.appendChild(closedMsg);
                    } else if (isOwner) {
                        const ownerMsg = document.createElement('p');
                        ownerMsg.innerHTML = '<strong>Your listing</strong>';
                        cargoDiv.appendChild(ownerMsg);
                    }

                    // Add View Route button
                    const routeBtn = document.createElement('button');
                    routeBtn.textContent = 'View Route';
                    routeBtn.style.marginTop = '0.5rem';
                    routeBtn.onclick = function() {
                        showRouteOnMap(cargo.origin, cargo.destination);
                    };
                    cargoDiv.appendChild(routeBtn);

                    cargoListSection.appendChild(cargoDiv);
                    startAuctionTimer(cargoId, createdAt, auctionStart, auctionEnd, auctionStatus);
                    loadLowestBid(cargoId);
                    loadBidHistory(cargoId);
                    if (auctionStatus === 'ended') {
                        showWinner(cargoId);
                    }
                });
            }, err => {
                cargoListSection.innerHTML = `<p>Error loading cargos: ${err.message}</p>`;
            });
    }

    function loadSingleCargo(cargoId) {
        firebase.firestore().collection('cargos').doc(cargoId)
            .onSnapshot(doc => {
                cargoListSection.innerHTML = '';
                if (!doc.exists) {
                    cargoListSection.innerHTML = '<p>Cargo not found.</p>';
                    bidSection.style.display = 'none';
                    return;
                }
                const cargo = doc.data();
                currentCargoOwnerId = cargo.ownerId;
                const createdAt = cargo.createdAt && cargo.createdAt.toDate ? cargo.createdAt.toDate() : new Date();
                const auctionStart = new Date(createdAt.getTime() + 10 * 60 * 1000);
                const auctionEnd = new Date(auctionStart.getTime() + 5 * 60 * 1000);
                const now = new Date();
                let auctionStatus = '';
                if (now < auctionStart) {
                    auctionStatus = 'not_started';
                } else if (now >= auctionStart && now < auctionEnd) {
                    auctionStatus = 'running';
                } else {
                    auctionStatus = 'ended';
                }
                const isOwner = currentUserId === cargo.ownerId;
                const imagesHtml = (cargo.images && cargo.images.length > 0)
                    ? cargo.images.map(url => `<img src="${url}" alt="Cargo Image" style="max-width:100px;max-height:100px;margin:4px;">`).join('')
                    : '<em>No images</em>';
                const cargoDiv = document.createElement('div');
                cargoDiv.className = 'cargo-item';
                cargoDiv.style = 'border:1px solid #ccc;padding:1rem;margin-bottom:1rem;border-radius:8px;';
                cargoDiv.innerHTML = `
                    <h4>${cargo.origin} → ${cargo.destination}</h4>
                    <p><strong>Weight:</strong> ${cargo.weight} kg</p>
                    <p><strong>Description:</strong> ${cargo.description}</p>
                    <div>${imagesHtml}</div>
                    <div id="auctionTimer-${cargoId}"><em>Loading timer...</em></div>
                    <div id="winner-${cargoId}"></div>
                    <div id="lowestBid-${cargoId}"><em>Loading current lowest bid...</em></div>
                    <div id="bidHistory-${cargoId}"><em>Loading bid history...</em></div>
                `;
                cargoListSection.appendChild(cargoDiv);
                startAuctionTimer(cargoId, createdAt, auctionStart, auctionEnd, auctionStatus);
                loadLowestBid(cargoId);
                loadBidHistory(cargoId);
                if (auctionStatus === 'ended') {
                    showWinner(cargoId);
                }
                // Show/hide bid section
                if (!isOwner && auctionStatus === 'running') {
                    bidSection.style.display = '';
                } else {
                    bidSection.style.display = 'none';
                }
            }, err => {
                cargoListSection.innerHTML = `<p>Error loading cargo: ${err.message}</p>`;
                bidSection.style.display = 'none';
            });
    }

    function startAuctionTimer(cargoId, createdAt, auctionStart, auctionEnd, auctionStatus) {
        const timerDiv = document.getElementById(`auctionTimer-${cargoId}`);
        function updateTimer() {
            const now = new Date();
            if (now < auctionStart) {
                const diff = auctionStart - now;
                const min = Math.floor(diff / 60000);
                const sec = Math.floor((diff % 60000) / 1000);
                timerDiv.innerHTML = `<strong>Auction starts in:</strong> ${min}m ${sec}s`;
            } else if (now >= auctionStart && now < auctionEnd) {
                const diff = auctionEnd - now;
                const min = Math.floor(diff / 60000);
                const sec = Math.floor((diff % 60000) / 1000);
                timerDiv.innerHTML = `<strong>Time left:</strong> ${min}m ${sec}s`;
            } else {
                timerDiv.innerHTML = '<strong>Auction ended</strong>';
            }
        }
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    async function closeAuctionAndSelectWinner(cargoId) {
        // Get the lowest bid
        const bidsSnapshot = await firebase.firestore()
            .collection('cargos').doc(cargoId)
            .collection('bids')
            .orderBy('amount', 'asc')
            .limit(1)
            .get();
        let winnerId = null;
        let winningAmount = null;
        if (!bidsSnapshot.empty) {
            const bid = bidsSnapshot.docs[0].data();
            winnerId = bid.userId;
            winningAmount = bid.amount;
        }
        // Get cargo info for notifications
        const cargoDoc = await firebase.firestore().collection('cargos').doc(cargoId).get();
        const cargoData = cargoDoc.data();
        // Update cargo status and winner in Firestore
        await firebase.firestore().collection('cargos').doc(cargoId).update({
            status: 'closed',
            winnerId: winnerId || null,
            winningAmount: winningAmount || null
        });
        // Send notifications
        const notifications = [];
        // Notify cargo owner
        notifications.push(firebase.firestore().collection('notifications').add({
            userId: cargoData.ownerId,
            type: 'auction_result',
            cargoId: cargoId,
            message: winnerId ? `Auction ended. Winner: ${winnerId.slice(0,6)}... (₹${winningAmount})` : 'Auction ended. No bids placed.',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }));
        // Notify winner
        if (winnerId) {
            notifications.push(firebase.firestore().collection('notifications').add({
                userId: winnerId,
                type: 'auction_win',
                cargoId: cargoId,
                message: `Congratulations! You won the auction for ${cargoData.origin} → ${cargoData.destination} (₹${winningAmount})`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }));
        }
        await Promise.all(notifications);
        showWinner(cargoId);
    }

    function showWinner(cargoId) {
        const winnerDiv = document.getElementById(`winner-${cargoId}`);
        firebase.firestore().collection('cargos').doc(cargoId).get().then(doc => {
            const data = doc.data();
            if (data && data.status === 'closed') {
                if (data.winnerId) {
                    winnerDiv.innerHTML = `<strong>Winner:</strong> <span style='color:#388e3c;'>${data.winnerId.slice(0,6)}...</span> (₹${data.winningAmount})`;
                } else {
                    winnerDiv.innerHTML = `<strong>No bids placed. No winner.</strong>`;
                }
            } else {
                winnerDiv.innerHTML = '';
            }
        });
    }

    function showBidForm(container, cargoId, endTime) {
        // Remove any existing bid form
        const existingForm = container.querySelector('.bid-form');
        if (existingForm) existingForm.remove();

        // Check if auction is still open
        if (new Date() > endTime) {
            alert('Auction has ended.');
            return;
        }

        // Create bid form
        const form = document.createElement('form');
        form.className = 'bid-form';
        form.innerHTML = `
            <label for="bidAmount">Your Bid Amount:</label>
            <input type="number" name="bidAmount" min="1" required style="width:150px;">
            <button type="submit">Place Bid</button>
        `;
        form.onsubmit = async function(e) {
            e.preventDefault();
            const bidAmount = Number(form.bidAmount.value);
            if (!bidAmount || bidAmount <= 0) {
                alert('Please enter a valid bid amount.');
                return;
            }
            try {
                // Check if user already has a bid for this cargo
                const bidsRef = firebase.firestore()
                    .collection('cargos').doc(cargoId)
                    .collection('bids');
                const existingBidSnapshot = await bidsRef.where('userId', '==', currentUserId).limit(1).get();
                if (!existingBidSnapshot.empty) {
                    // Update the existing bid
                    const bidDocId = existingBidSnapshot.docs[0].id;
                    await bidsRef.doc(bidDocId).update({
                        amount: bidAmount,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Add a new bid
                    await bidsRef.add({
                        amount: bidAmount,
                        userId: currentUserId,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                alert('Bid placed successfully!');
                form.remove();
                loadLowestBid(cargoId);
                loadBidHistory(cargoId);
            } catch (error) {
                alert('Failed to place bid: ' + error.message);
            }
        };
        container.appendChild(form);
    }

    function loadLowestBid(cargoId) {
        const lowestBidDiv = document.getElementById(`lowestBid-${cargoId}`);
        firebase.firestore()
            .collection('cargos').doc(cargoId)
            .collection('bids')
            .orderBy('amount', 'asc')
            .limit(1)
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    lowestBidDiv.innerHTML = '<em>No bids yet</em>';
                } else {
                    const bid = snapshot.docs[0].data();
                    lowestBidDiv.innerHTML = `<strong>Current Lowest Bid:</strong> ₹${bid.amount}`;
                }
            }, err => {
                lowestBidDiv.innerHTML = `<em>Error loading bids: ${err.message}</em>`;
            });
    }

    function loadBidHistory(cargoId) {
        const bidHistoryDiv = document.getElementById(`bidHistory-${cargoId}`);
        firebase.firestore()
            .collection('cargos').doc(cargoId)
            .collection('bids')
            .orderBy('amount', 'asc')
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    bidHistoryDiv.innerHTML = '<em>No bids yet</em>';
                } else {
                    let html = '<strong>Bid History:</strong><ul style="padding-left:1.2em;">';
                    snapshot.forEach(doc => {
                        const bid = doc.data();
                        const time = bid.createdAt && bid.createdAt.toDate ? bid.createdAt.toDate().toLocaleString() : '';
                        html += `<li>₹${bid.amount} by <span style='color:#1a73e8;'>${bid.userId.slice(0,6)}...</span> at ${time}</li>`;
                    });
                    html += '</ul>';
                    bidHistoryDiv.innerHTML = html;
                }
            }, err => {
                bidHistoryDiv.innerHTML = `<em>Error loading bid history: ${err.message}</em>`;
            });
    }

    // Map integration with Leaflet, Nominatim, and OSRM
    function showRouteOnMap(origin, destination) {
        const modal = document.getElementById('mapModal');
        const closeBtn = document.getElementById('closeMapModal');
        const mapDiv = document.getElementById('map');
        const mapInfo = document.getElementById('mapInfo');
        modal.style.display = 'flex';
        mapDiv.innerHTML = '';
        mapInfo.innerHTML = 'Loading route...';
        let map, routeLayer;
        // Close modal handler
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            if (map && routeLayer) map.remove();
        };
        // Geocode origin and destination
        Promise.all([
            geocodeNominatim(origin),
            geocodeNominatim(destination)
        ]).then(([originCoord, destCoord]) => {
            map = L.map('map').setView(originCoord, 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            // Route with OSRM
            fetch(`https://router.project-osrm.org/route/v1/driving/${originCoord[1]},${originCoord[0]};${destCoord[1]},${destCoord[0]}?overview=full&geometries=geojson`)
                .then(res => res.json())
                .then(data => {
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        routeLayer = L.geoJSON(route.geometry).addTo(map);
                        map.fitBounds(routeLayer.getBounds(), {padding: [30, 30]});
                        const distKm = (route.distance / 1000).toFixed(2);
                        const durationMin = Math.round(route.duration / 60);
                        mapInfo.innerHTML = `<strong>Distance:</strong> ${distKm} km<br><strong>Estimated Time:</strong> ${durationMin} min`;
                    } else {
                        mapInfo.innerHTML = 'No route found.';
                    }
                })
                .catch(() => { mapInfo.innerHTML = 'Error loading route.'; });
            // Markers
            L.marker(originCoord).addTo(map).bindPopup('Origin').openPopup();
            L.marker(destCoord).addTo(map).bindPopup('Destination');
        }).catch(() => {
            mapInfo.innerHTML = 'Error geocoding addresses.';
        });
    }
    function geocodeNominatim(address) {
        return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
            .then(res => res.json())
            .then(results => {
                if (results && results.length > 0) {
                    return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
                } else {
                    throw new Error('No results');
                }
            });
    }
}); 