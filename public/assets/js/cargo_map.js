// Map modal logic for cargo details, dashboard, and profile pages

document.addEventListener('DOMContentLoaded', function () {
    const viewRouteBtn = document.getElementById('viewRouteBtn');
    if (viewRouteBtn) {
        // Example: get origin/destination from cargoInfo section or dataset
        viewRouteBtn.addEventListener('click', function () {
            // You may need to adjust how you get these values based on your page logic
            let origin = '';
            let destination = '';
            // Try to extract from cargoInfo section
            const infoSection = document.getElementById('cargoInfo');
            if (infoSection) {
                const originMatch = infoSection.innerText.match(/Origin:\s*(.*)/i);
                const destMatch = infoSection.innerText.match(/Destination:\s*(.*)/i);
                if (originMatch) origin = originMatch[1].trim();
                if (destMatch) destination = destMatch[1].trim();
            }
            if (!origin || !destination) {
                alert('Origin or destination not found.');
                return;
            }
            showRouteOnMap(origin, destination);
        });
    }
});

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