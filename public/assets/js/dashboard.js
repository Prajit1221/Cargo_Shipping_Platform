// Dashboard logic for Safe Haul

document.addEventListener('DOMContentLoaded', function () {
    firebase.auth().onAuthStateChanged(async function(user) {
        if (!user) return;
        const userId = user.uid;
        // Fetch user info
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        // Welcome section
        const welcomeSection = document.getElementById('welcomeSection');
        welcomeSection.innerHTML = `<h3>Welcome, ${userData.name || 'User'}!</h3><p>Role: <strong>${userData.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong></p>`;
        // Stats section
        const statsSection = document.getElementById('statsSection');
        let statsHtml = '';
        if (userData.role === 'cargo_owner') {
            // Count cargos listed
            const cargosSnap = await firebase.firestore().collection('cargos').where('ownerId', '==', userId).get();
            statsHtml += `<div><h4>🚚 Cargos Listed</h4><p style='font-size:1.5rem;font-weight:700;'>${cargosSnap.size}</p></div>`;
            // Count auctions won (not relevant for owner)
        } else {
            // Count bids placed
            const bidsSnap = await firebase.firestore().collectionGroup('bids').where('userId', '==', userId).get();
            statsHtml += `<div><h4>💸 Bids Placed</h4><p style='font-size:1.5rem;font-weight:700;'>${bidsSnap.size}</p></div>`;
            // Count auctions won
            const wonSnap = await firebase.firestore().collection('cargos').where('winnerId', '==', userId).get();
            statsHtml += `<div><h4>🏆 Auctions Won</h4><p style='font-size:1.5rem;font-weight:700;'>${wonSnap.size}</p></div>`;
        }
        statsSection.innerHTML = statsHtml;
        // Notifications section
        const notificationsList = document.getElementById('notificationsList');
        firebase.firestore().collection('notifications')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .onSnapshot(snapshot => {
                notificationsList.innerHTML = '';
                if (snapshot.empty) {
                    notificationsList.innerHTML = '<li>No notifications yet.</li>';
                } else {
                    snapshot.forEach(doc => {
                        const n = doc.data();
                        const time = n.timestamp && n.timestamp.toDate ? n.timestamp.toDate().toLocaleString() : '';
                        notificationsList.innerHTML += `<li style='margin-bottom:0.5rem;'><span style='color:#1a73e8;'>${n.message}</span><br><span style='font-size:0.9rem;color:#888;'>${time}</span></li>`;
                    });
                }
            });
        // Role-specific section
        const roleSection = document.getElementById('roleSection');
        if (userData.role === 'cargo_owner') {
            // List cargos posted by this user
            firebase.firestore().collection('cargos').where('ownerId', '==', userId).orderBy('createdAt', 'desc').onSnapshot(snapshot => {
                let html = `<h3 style='margin-top:0;'>Your Cargos</h3>`;
                if (snapshot.empty) {
                    html += '<p>No cargos listed yet. <a href="listing.html">List a new cargo</a></p>';
                } else {
                    html += '<ul style="list-style:none;padding:0;">';
                    snapshot.forEach(doc => {
                        const c = doc.data();
                        html += `<li style='margin-bottom:1rem;padding:1rem;background:#f5faff;border-radius:8px;box-shadow:0 1px 4px rgba(26,115,232,0.05);'>
                            <strong>${c.origin} → ${c.destination}</strong><br>
                            Status: <span style='color:${c.status === 'closed' ? '#e53935' : '#43a047'};'>${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span><br>
                            ${c.status === 'closed' && c.winnerId ? `Winner: <span style='color:#388e3c;'>${c.winnerId.slice(0,6)}...</span> (₹${c.winningAmount})` : ''}
                        </li>`;
                    });
                    html += '</ul>';
                }
                roleSection.innerHTML = html;
            });
        } else {
            // List cargos this user has bid on
            firebase.firestore().collectionGroup('bids').where('userId', '==', userId).onSnapshot(async snapshot => {
                let html = `<h3 style='margin-top:0;'>Your Bids</h3>`;
                if (snapshot.empty) {
                    html += '<p>No bids placed yet. <a href="auction.html">Browse auctions</a></p>';
                } else {
                    html += '<ul style="list-style:none;padding:0;">';
                    for (const doc of snapshot.docs) {
                        const bid = doc.data();
                        const cargoRef = doc.ref.parent.parent;
                        const cargoDoc = await cargoRef.get();
                        const c = cargoDoc.data();
                        html += `<li style='margin-bottom:1rem;padding:1rem;background:#f5faff;border-radius:8px;box-shadow:0 1px 4px rgba(26,115,232,0.05);'>
                            <strong>${c.origin} → ${c.destination}</strong><br>
                            Your Bid: ₹${bid.amount}<br>
                            Status: <span style='color:${c.status === 'closed' ? '#e53935' : '#43a047'};'>${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span><br>
                            ${c.status === 'closed' && c.winnerId === userId ? `<span style='color:#388e3c;'>You won this auction!</span>` : ''}
                        </li>`;
                    }
                    html += '</ul>';
                }
                roleSection.innerHTML = html;
            });
        }
        // Pie chart and bar graph data
        if (userData.role === 'cargo_owner') {
            // Pie chart: cargos by status
            firebase.firestore().collection('cargos').where('ownerId', '==', userId).onSnapshot(snapshot => {
                const statusCounts = {open: 0, running: 0, closed: 0};
                const now = new Date();
                const activityByDate = {};
                snapshot.forEach(doc => {
                    const c = doc.data();
                    // Auction timing logic
                    const createdAt = c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : new Date();
                    const auctionStart = new Date(createdAt.getTime() + 10 * 60 * 1000);
                    const auctionEnd = new Date(auctionStart.getTime() + 5 * 60 * 1000);
                    let status = 'open';
                    if (now < auctionStart) status = 'open';
                    else if (now >= auctionStart && now < auctionEnd) status = 'running';
                    else status = 'closed';
                    statusCounts[status]++;
                    // Bar graph: count by date (YYYY-MM-DD)
                    const dateStr = createdAt.toISOString().slice(0, 10);
                    activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
                });
                renderPieChart(['Open', 'Running', 'Closed'], [statusCounts.open, statusCounts.running, statusCounts.closed]);
                renderBarChart(activityByDate, 'Cargos Listed');
            });
            // History table: last 5 cargos
            firebase.firestore().collection('cargos').where('ownerId', '==', userId).orderBy('createdAt', 'desc').limit(5).onSnapshot(snapshot => {
                const tbody = document.querySelector('#historyTable tbody');
                tbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const c = doc.data();
                    const date = c.createdAt && c.createdAt.toDate ? c.createdAt.toDate().toLocaleString() : '';
                    tbody.innerHTML += `<tr><td>${date}</td><td>Listed Cargo</td><td>${c.origin} → ${c.destination}</td></tr>`;
                });
            });
        } else {
            // Pie chart: bids by status (active, won, lost)
            firebase.firestore().collectionGroup('bids').where('userId', '==', userId).onSnapshot(async snapshot => {
                let active = 0, won = 0, lost = 0;
                const activityByDate = {};
                for (const doc of snapshot.docs) {
                    const bid = doc.data();
                    const cargoRef = doc.ref.parent.parent;
                    const cargoDoc = await cargoRef.get();
                    const c = cargoDoc.data();
                    // Auction timing logic
                    const createdAt = c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : new Date();
                    const auctionStart = new Date(createdAt.getTime() + 10 * 60 * 1000);
                    const auctionEnd = new Date(auctionStart.getTime() + 5 * 60 * 1000);
                    const now = new Date();
                    let status = 'active';
                    if (now < auctionStart) status = 'active';
                    else if (now >= auctionStart && now < auctionEnd) status = 'active';
                    else if (c.winnerId === userId) status = 'won';
                    else status = 'lost';
                    if (status === 'active') active++;
                    else if (status === 'won') won++;
                    else lost++;
                    // Bar graph: count by date (YYYY-MM-DD)
                    const dateStr = createdAt.toISOString().slice(0, 10);
                    activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
                }
                renderPieChart(['Active', 'Won', 'Lost'], [active, won, lost]);
                renderBarChart(activityByDate, 'Bids Placed');
            });
            // History table: last 5 bids
            firebase.firestore().collectionGroup('bids').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(5).onSnapshot(async snapshot => {
                const tbody = document.querySelector('#historyTable tbody');
                tbody.innerHTML = '';
                for (const doc of snapshot.docs) {
                    const bid = doc.data();
                    const cargoRef = doc.ref.parent.parent;
                    const cargoDoc = await cargoRef.get();
                    const c = cargoDoc.data();
                    const date = bid.createdAt && bid.createdAt.toDate ? bid.createdAt.toDate().toLocaleString() : '';
                    tbody.innerHTML += `<tr><td>${date}</td><td>Placed Bid</td><td>${c.origin} → ${c.destination} (₹${bid.amount})</td></tr>`;
                }
            });
        }
    });
});

// Chart.js rendering functions
let pieChartInstance = null;
let barChartInstance = null;
function renderPieChart(labels, data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#1a73e8', '#43a047', '#e53935'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {position: 'bottom'}}
        }
    });
}
function renderBarChart(activityByDate, label) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();
    // Sort dates
    const dates = Object.keys(activityByDate).sort();
    const counts = dates.map(d => activityByDate[d]);
    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: label,
                data: counts,
                backgroundColor: '#1a73e8',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {x: {grid: {display: false}}, y: {beginAtZero: true}}
        }
    });
} 