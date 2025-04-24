document.addEventListener('DOMContentLoaded', function() {
    const postCargoLink = document.getElementById('post-cargo-link');
    const postCargoSection = document.getElementById('post-cargo-section');
    const cargoListingsSection = document.getElementById('cargo-listings-section');
    const cargoListingsContainer = document.getElementById('cargo-listings');
    const cargoDetailSection = document.getElementById('cargo-detail-section');
    const backToListingsButton = document.getElementById('back-to-listings');
    const backToListingsDetailButton = document.getElementById('back-to-listings-detail');
    const postCargoForm = document.getElementById('post-cargo-form');
    const navLinks = document.querySelectorAll('nav a');
    const cargoListingTemplate = document.getElementById('cargo-listing-template');

    if (postCargoLink && postCargoSection && cargoListingsSection && cargoListingsContainer && cargoDetailSection && backToListingsButton && postCargoForm && navLinks && cargoListingTemplate && backToListingsDetailButton) {
        postCargoLink.addEventListener('click', function(event) {
            event.preventDefault();
            postCargoSection.style.display = 'block';
            cargoListingsSection.style.display = 'none';
            cargoDetailSection.style.display = 'none';

            navLinks.forEach(link => link.classList.remove('active'));
            postCargoLink.classList.add('active');
        });

        backToListingsButton.addEventListener('click', function() {
            postCargoSection.style.display = 'none';
            cargoListingsSection.style.display = 'block';
            cargoDetailSection.style.display = 'none';

            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = Array.from(navLinks).find(link => link.getAttribute('href') === '/');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        });

        backToListingsDetailButton.addEventListener('click', function() {
            postCargoSection.style.display = 'none';
            cargoListingsSection.style.display = 'block';
            cargoDetailSection.style.display = 'none';

            navLinks.forEach(link => link.classList.remove('active'));
            const listingsLink = Array.from(navLinks).find(link => link.getAttribute('href') === '/listings');
            if (listingsLink) {
                listingsLink.classList.add('active');
            } else {
                const homeLink = Array.from(navLinks).find(link => link.getAttribute('href') === '/');
                if (homeLink) {
                    homeLink.classList.add('active');
                }
            }
        });

        if (window.location.pathname === '/' || window.location.pathname === '/listings') {
            cargoListingsSection.style.display = 'block';
            postCargoSection.style.display = 'none';
            cargoDetailSection.style.display = 'none';
            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = Array.from(navLinks).find(link => link.getAttribute('href') === '/');
            if (homeLink) {
                homeLink.classList.add('active');
            } else {
                const listingsLink = Array.from(navLinks).find(link => link.getAttribute('href') === '/listings');
                if (listingsLink) {
                    listingsLink.classList.add('active');
                }
            }
        }

        postCargoForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const fromCity = document.getElementById('from-city').value;
            const toCity = document.getElementById('to-city').value;
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value) || 0;
            const width = parseFloat(document.getElementById('width').value) || 0;
            const length = parseFloat(document.getElementById('length').value) || 0;
            const fragile = document.getElementById('fragile').checked;
            const distance = parseFloat(document.getElementById('distance').value);
            const timeLimit = document.getElementById('time-limit').value;

            try {
                const cargoCollectionRef = collection(window.db, 'cargo');
                const docRef = await addDoc(cargoCollectionRef, {
                    fromCity: fromCity,
                    toCity: toCity,
                    weight: weight,
                    height: height,
                    width: width,
                    length: length,
                    fragile: fragile,
                    distance: distance,
                    timeLimit: timeLimit,
                    postedAt: serverTimestamp()
                });
                console.log("Cargo posted with ID: ", docRef.id);
                postCargoForm.reset();
                alert("Cargo posted successfully!");
                postCargoSection.style.display = 'none';
                cargoListingsSection.style.display = 'block';
                fetchCargoListings(); // Reload listings after posting
            } catch (error) {
                console.error("Error adding document: ", error);
                alert("Failed to post cargo.");
            }
        });

        async function fetchCargoListings() {
            const cargoCollectionRef = collection(window.db, 'cargo');
            const querySnapshot = await getDocs(cargoCollectionRef);
            const cargoListingsContainer = document.getElementById('cargo-listings');

            if (!cargoListingsContainer || !cargoListingTemplate) {
                console.error("Cargo listings container or template not found in HTML.");
                return;
            }

            cargoListingsContainer.innerHTML = ''; // Clear previous listings

            querySnapshot.forEach((doc) => {
                const cargoData = doc.data();
                const cargoId = doc.id;

                // Clone the template
                const listingDiv = cargoListingTemplate.content.cloneNode(true);

                // Populate the cloned template with data
                listingDiv.querySelector('.from-city').textContent = cargoData.fromCity;
                listingDiv.querySelector('.to-city').textContent = cargoData.toCity;
                listingDiv.querySelector('.weight').textContent = cargoData.weight;
                listingDiv.querySelector('.distance').textContent = cargoData.distance;
                listingDiv.querySelector('.view-details-btn').setAttribute('data-cargo-id', cargoId);

                // Append the populated template to the container
                cargoListingsContainer.appendChild(listingDiv);
            });

            // Add event listeners to the "View Details & Bid" buttons after they are created
            const viewDetailsButtons = cargoListingsContainer.querySelectorAll('.view-details-btn');
            viewDetailsButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const cargoId = this.getAttribute('data-cargo-id');
                    console.log('View details clicked for cargo ID:', cargoId);
                    cargoListingsSection.style.display = 'none';
                    cargoDetailSection.style.display = 'block';
                    fetchCargoDetails(cargoId);
                });
            });
        }

        async function fetchCargoDetails(cargoId) {
            try {
                const cargoDocRef = doc(window.db, 'cargo', cargoId);
                const docSnap = await getDoc(cargoDocRef);
        
                if (!docSnap.exists()) {
                    console.error(`Cargo document with ID ${cargoId} not found.`);
                    alert("Could not load cargo details. Cargo may not exist.");
                    goToCargoListings(); // Use helper function
                    return; // Important: Stop execution here
                }
        
                const cargoData = docSnap.data();
                console.log("Cargo Details:", cargoData);
        
                // Improved:  Use an object to map data to HTML element IDs.
                const detailFields = {
                    'detail-id': cargoId,
                    'detail-from': cargoData.fromCity,
                    'detail-to': cargoData.toCity,
                    'detail-weight': cargoData.weight,
                    'detail-height': cargoData.height || 'N/A',
                    'detail-width': cargoData.width || 'N/A',
                    'detail-length': cargoData.length || 'N/A',
                    'detail-fragile': cargoData.fragile ? 'Yes' : 'No',
                    'detail-distance': cargoData.distance,
                    'detail-time-limit': cargoData.timeLimit,
                };
        
                //  Iterate through the object to set the text content.
                for (const [elementId, value] of Object.entries(detailFields)) {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.textContent = value;
                    } else {
                        console.warn(`Element with ID ${elementId} not found in HTML.`);
                        //  Consider showing a user-friendly message, or logging.
                    }
                }
                //  [Placeholder for Bid Handling]
        
            } catch (error) {
                console.error("Error fetching cargo details:", error);
                alert("Failed to load cargo details. Please check your network connection.");
                goToCargoListings(); // Use helper
            }
            function goToCargoListings() {
                cargoListingsSection.style.display = 'block';
                cargoDetailSection.style.display = 'none';
            }
        }
        
        // Call the function to fetch listings when the page loads
        fetchCargoListings();
    }
});
