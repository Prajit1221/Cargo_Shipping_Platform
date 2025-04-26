document.addEventListener('DOMContentLoaded', function () {
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

  if (!postCargoLink || !postCargoSection || !cargoListingsSection || !cargoListingsContainer || !cargoDetailSection || !backToListingsButton || !backToListingsDetailButton || !postCargoForm || !navLinks || !cargoListingTemplate) {
      console.error("One or more required elements not found.");
      return;
  }

  function showSection(section) {
      postCargoSection.style.display = (section === 'post') ? 'block' : 'none';
      cargoListingsSection.style.display = (section === 'listings') ? 'block' : 'none';
      cargoDetailSection.style.display = (section === 'detail') ? 'block' : 'none';
  }

  function setActiveNavLink(path) {
      navLinks.forEach(link => link.classList.remove('active'));
      const targetLink = Array.from(navLinks).find(link => link.getAttribute('href') === path);
      if (targetLink) {
          targetLink.classList.add('active');
      }
  }

  postCargoLink.addEventListener('click', function (event) {
      event.preventDefault();
      showSection('post');
      setActiveNavLink('/post');
  });

  backToListingsButton.addEventListener('click', function () {
      showSection('listings');
      setActiveNavLink('/');
  });

  backToListingsDetailButton.addEventListener('click', function () {
      showSection('listings');
      const listingsLink = Array.from(navLinks).find(link => link.getAttribute('href') === '/listings');
      if (listingsLink) {
          listingsLink.classList.add('active');
      } else {
          setActiveNavLink('/');
      }
  });

  if (window.location.pathname === '/' || window.location.pathname === '/listings') {
      showSection('listings');
      setActiveNavLink('/');
  }

  postCargoForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      try {
          const cargoData = {
              fromCity: document.getElementById('from-city').value,
              toCity: document.getElementById('to-city').value,
              weight: parseFloat(document.getElementById('weight').value),
              height: parseFloat(document.getElementById('height').value) || 0,
              width: parseFloat(document.getElementById('width').value) || 0,
              length: parseFloat(document.getElementById('length').value) || 0,
              fragile: document.getElementById('fragile').checked,
              distance: parseFloat(document.getElementById('distance').value),
              timeLimit: document.getElementById('time-limit').value,
              postedAt: serverTimestamp()
          };

          const cargoCollectionRef = collection(window.db, 'cargo');
          const docRef = await addDoc(cargoCollectionRef, cargoData);

          console.log("Cargo posted with ID:", docRef.id);
          alert("Cargo posted successfully!");
          postCargoForm.reset();
          showSection('listings');
          fetchCargoListings();
      } catch (error) {
          console.error("Error adding cargo:", error);
          alert("Failed to post cargo.");
      }
  });

  async function fetchCargoListings() {
      try {
          const cargoCollectionRef = collection(window.db, 'cargo');
          const querySnapshot = await getDocs(cargoCollectionRef);

          cargoListingsContainer.innerHTML = '';

          querySnapshot.forEach(doc => {
              const cargoData = doc.data();
              const cargoId = doc.id;

              const listingDiv = cargoListingTemplate.content.cloneNode(true);
              listingDiv.querySelector('.from-city').textContent = cargoData.fromCity;
              listingDiv.querySelector('.to-city').textContent = cargoData.toCity;
              listingDiv.querySelector('.weight').textContent = cargoData.weight;
              listingDiv.querySelector('.distance').textContent = cargoData.distance;
              listingDiv.querySelector('.view-details-btn').setAttribute('data-cargo-id', cargoId);

              cargoListingsContainer.appendChild(listingDiv);
          });

          const viewDetailsButtons = cargoListingsContainer.querySelectorAll('.view-details-btn');
          viewDetailsButtons.forEach(button => {
              button.addEventListener('click', function () {
                  const cargoId = this.getAttribute('data-cargo-id');
                  console.log('View details clicked for cargo ID:', cargoId);
                  showSection('detail');
                  fetchCargoDetails(cargoId);
              });
          });
      } catch (error) {
          console.error("Error fetching cargo listings:", error);
      }
  }

  async function fetchCargoDetails(cargoId) {
      try {
          const cargoDocRef = doc(window.db, 'cargo', cargoId);
          const docSnap = await getDoc(cargoDocRef);

          if (!docSnap.exists()) {
              console.error(`Cargo document with ID ${cargoId} not found.`);
              alert("Could not load cargo details. Cargo may not exist.");
              showSection('listings');
              return;
          }

          const cargoData = docSnap.data();
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

          for (const [elementId, value] of Object.entries(detailFields)) {
              const element = document.getElementById(elementId);
              if (element) {
                  element.textContent = value;
              } else {
                  console.warn(`Element with ID ${elementId} not found.`);
              }
          }
      } catch (error) {
          console.error("Error fetching cargo details:", error);
          alert("Failed to load cargo details. Please check your network connection.");
          showSection('listings');
      }
  }

  // Initialize listings on page load
  fetchCargoListings();
});
