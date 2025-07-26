document.addEventListener('DOMContentLoaded', function () {
    const cargoInfoSection = document.getElementById('cargoInfo');
    const cargoTypeSpan = document.getElementById('cargoType');
    const cargoWeightSpan = document.getElementById('cargoWeight');
    const cargoDimensionsSpan = document.getElementById('cargoDimensions');
    const cargoPickupDateSpan = document.getElementById('cargoPickupDate');
    const cargoDescriptionSpan = document.getElementById('cargoDescription');
    const cargoHandlingInstructionsSpan = document.getElementById('cargoHandlingInstructions');
    const viewRouteBtn = document.getElementById('viewRouteBtn');
    const bidHistorySection = document.getElementById('bidHistory');

    const urlParams = new URLSearchParams(window.location.search);
    const cargoId = urlParams.get('cargoId');

    if (!cargoId) {
        cargoInfoSection.innerHTML = '<p>No cargo ID provided.</p>';
        return;
    }

    firebase.firestore().collection('cargos').doc(cargoId)
        .onSnapshot(doc => {
            if (!doc.exists) {
                cargoInfoSection.innerHTML = '<p>Cargo not found.</p>';
                return;
            }
            const cargo = doc.data();

            cargoTypeSpan.textContent = cargo.cargoType;
            cargoWeightSpan.textContent = `${cargo.weight} kg`;
            cargoDimensionsSpan.textContent = `${cargo.dimensions.length}x${cargo.dimensions.width}x${cargo.dimensions.height} cm`;
            cargoPickupDateSpan.textContent = cargo.pickupDate;
            cargoDescriptionSpan.textContent = cargo.description;
            cargoHandlingInstructionsSpan.textContent = cargo.handlingInstructions || 'N/A';

            viewRouteBtn.onclick = function() {
                showRouteOnMap(cargo.origin, cargo.destination);
            };

            loadBidHistory(cargoId);
        }, err => {
            cargoInfoSection.innerHTML = `<p>Error loading cargo: ${err.message}</p>`;
        });

    function loadBidHistory(cargoId) {
        firebase.firestore()
            .collection('cargos').doc(cargoId)
            .collection('bids')
            .orderBy('amount', 'asc')
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    bidHistorySection.innerHTML = '<h3>Bid History</h3><p>No bids yet</p>';
                } else {
                    let html = '<h3>Bid History</h3><ul style="padding-left:1.2em;">';
                    snapshot.forEach(doc => {
                        const bid = doc.data();
                        const time = bid.createdAt && bid.createdAt.toDate ? bid.createdAt.toDate().toLocaleString() : '';
                        html += `<li>₹${bid.amount} by <span style='color:#1a73e8;'>${bid.userId.slice(0,6)}...</span> at ${time}</li>`;
                    });
                    html += '</ul>';
                    bidHistorySection.innerHTML = html;
                }
            }, err => {
                bidHistorySection.innerHTML = `<h3>Bid History</h3><em>Error loading bid history: ${err.message}</em>`;
            });
    }

    // Map integration with Leaflet, Nominatim, and OSRM (copied from auction.js)
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