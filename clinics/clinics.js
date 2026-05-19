document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const filterSpecialty = document.getElementById('filter-specialty');
    const filterStatus = document.getElementById('filter-status');

    // --- 1. INITIALIZE THE LEAFLET MAP ---
    // Centered exactly on Daet, Camarines Norte
    const map = L.map('clinic-map').setView([14.1153, 122.9546], 15);
    
    // Load the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Keep track of markers so we can filter them later if needed
    const markers = [];

    // --- Helper: Highlight Card when Pin is Clicked ---
    function highlightCard(cardElement) {
        // Scroll down to the specific clinic card smoothly
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a temporary blue glow to catch the user's eye
        cardElement.style.transition = 'all 0.3s ease';
        cardElement.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.6)';
        cardElement.style.transform = 'scale(1.02)';
        
        // Remove the glow after 2 seconds
        setTimeout(() => {
            cardElement.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.1)';
            cardElement.style.transform = 'none';
        }, 2000);
    }

    function formatTagName(str) {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function updateTagsForCard(card, activeFilter) {
        const tagsContainer = card.querySelector('.card-tags');
        if (!tagsContainer) return;

        const statusTag = tagsContainer.querySelector('.status-open, .status-closed');
        let rawSpecs = card.getAttribute('data-specialties') || card.getAttribute('data-specialty') || 'General';
        let specialties = rawSpecs.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');

        if (activeFilter !== 'all' && specialties.includes(activeFilter)) {
            specialties = specialties.filter(s => s !== activeFilter);
            specialties.unshift(activeFilter);
        }

        let newTagsHTML = statusTag ? statusTag.outerHTML : '';
        const MAX_TAGS = 2; 

        specialties.slice(0, MAX_TAGS).forEach(spec => {
            newTagsHTML += `<span class="tag specialty">${formatTagName(spec)}</span>`;
        });

        if (specialties.length > MAX_TAGS) {
            const hiddenSpecs = specialties.slice(MAX_TAGS).map(formatTagName).join(', ');
            newTagsHTML += `<span class="tag specialty tag-more" title="${hiddenSpecs}">...</span>`;
        }

        tagsContainer.innerHTML = newTagsHTML;
    }

    function filterClinics() {
        const clinicCards = document.querySelectorAll('.clinic-card'); 
        const searchTerm = searchInput.value.toLowerCase();
        const selectedSpecialty = filterSpecialty.value.toLowerCase();
        const selectedStatus = filterStatus.value.toLowerCase();

        clinicCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const locationElem = card.querySelector('.clinic-location');
            const location = locationElem ? locationElem.textContent.toLowerCase() : '';
            
            const cardSpecialties = card.getAttribute('data-specialties') || card.getAttribute('data-specialty') || '';
            const cardStatus = card.getAttribute('data-status') || '';

            const matchesSearch = title.includes(searchTerm) || location.includes(searchTerm);
            const matchesSpecialty = selectedSpecialty === 'all' || cardSpecialties.toLowerCase().includes(selectedSpecialty);
            const matchesStatus = selectedStatus === 'all' || cardStatus === selectedStatus;

            if (matchesSearch && matchesSpecialty && matchesStatus) {
                card.style.display = 'flex'; 
                updateTagsForCard(card, selectedSpecialty);
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', filterClinics);
    filterSpecialty.addEventListener('change', filterClinics);
    filterStatus.addEventListener('change', filterClinics);

    function loadRealClinics() {
        fetch('fetch_clinics.php')
            .then(response => response.json())
            .then(realClinics => {
                
                const uniqueSpecialties = new Set([
                    'general practice', 'pediatrics', 'dental', 'ob-gyn', 'optometry'
                ]);

                realClinics.forEach(dbClinic => {
                    if (dbClinic.specialties) {
                        dbClinic.specialties.forEach(spec => {
                            uniqueSpecialties.add(spec.toLowerCase().trim());
                        });
                    }
                });

                filterSpecialty.innerHTML = '<option value="all">All Specialties</option>';
                
                Array.from(uniqueSpecialties).sort().forEach(spec => {
                    const option = document.createElement('option');
                    option.value = spec;
                    option.textContent = formatTagName(spec); 
                    filterSpecialty.appendChild(option);
                });

                const container = document.getElementById('clinics-grid');
                if (!container) return;

                realClinics.forEach(dbClinic => {
                    const card = document.createElement('div');
                    card.className = 'clinic-card';
                    
                    const allSpecialties = dbClinic.specialties && dbClinic.specialties.length > 0 
                        ? dbClinic.specialties.join(',') 
                        : 'General';
                        
                    card.setAttribute('data-specialties', allSpecialties.toLowerCase());
                    card.setAttribute('data-status', 'open');

                    const locationText = `${dbClinic.street}, Daet`;

                    let cleanContact = dbClinic.clinic_contact.replace(/\s+/g, '');
                    let formattedContact = cleanContact;
                    if (cleanContact.startsWith('09') && cleanContact.length === 11) {
                        formattedContact = `+639 ${cleanContact.substring(2,5)} ${cleanContact.substring(5,8)} ${cleanContact.substring(8,11)}`;
                    } else if (cleanContact.startsWith('0')) {
                        formattedContact = '+63 ' + cleanContact.substring(1);
                    }

                    const wazeDeepLink = (dbClinic.latitude && dbClinic.longitude) 
                        ? `https://waze.com/ul?ll=${dbClinic.latitude},${dbClinic.longitude}&navigate=yes`
                        : `https://waze.com/ul?q=${encodeURIComponent(locationText)}&navigate=yes`;

                    // THE HTML HAS BEEN UPDATED HERE (Removed the <a> wrapper on the header)
                    card.innerHTML = `
                        <div class="card-header clickable-card-header" style="cursor: pointer; transition: background-color 0.2s;" title="Click to locate on map">
                            <div class="clinic-logo-placeholder">
                                <img src="hospital.png" alt="Hospital Icon" class="clinic-icon">
                            </div>
                            <div class="clinic-title-area">
                                <h3 class="interactive-title">${dbClinic.clinic_name}</h3>
                                <p class="clinic-location" style="margin-bottom: 4px;">
                                    <img src="location.png" alt="Location" class="loc-icon"> ${locationText}
                                </p>
                                <p class="clinic-location" style="margin-bottom: 0;">
                                    <img src="call.png" alt="Contact" class="loc-icon" style="width: 14px; margin-right: 5px;"> ${formattedContact}
                                </p>
                            </div>
                        </div>
                        
                        <div class="card-tags">
                            <span class="tag status-open">● Open Now</span>
                        </div>
                        
                        <div class="card-actions">
                            <a href="../appointment/appointment.html?clinic=${dbClinic.clinic_id}" class="btn primary-btn">Book Now</a>
                            <button class="btn secondary-btn" onclick="window.open('${wazeDeepLink}', '_blank')">
                                <img src="directions.png" alt="Direction" class="btn-icon"> Map Directions
                            </button>
                        </div>
                    `;
                    
                    container.prepend(card);

                    // --- TWO-WAY BINDING LOGIC HAS BEEN INJECTED HERE ---
                    if (dbClinic.latitude && dbClinic.longitude) {
                        // 1. Drop a pin on the map
                        const marker = L.marker([dbClinic.latitude, dbClinic.longitude]).addTo(map);
                        marker.bindPopup(`<b>${dbClinic.clinic_name}</b><br>${locationText}`);
                        
                        // 2. Map Pin -> Clicks -> Highlights Card
                        marker.on('click', () => {
                            highlightCard(card);
                        });
                        markers.push(marker);

                        // 3. Card -> Clicks -> Moves Map
                        const headerElement = card.querySelector('.clickable-card-header');
                        if (headerElement) {
                            headerElement.addEventListener('click', () => {
                                map.flyTo([dbClinic.latitude, dbClinic.longitude], 17, {
                                    animate: true,
                                    duration: 1.5
                                });
                                marker.openPopup();
                                document.getElementById('clinic-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
                            });
                        }
                    } else {
                        // Fallback if no exact coordinates exist
                        const headerElement = card.querySelector('.clickable-card-header');
                        if (headerElement) {
                            headerElement.addEventListener('click', () => {
                                alert('Precise map coordinates not available for this clinic yet. Click Map Directions to search via Waze.');
                            });
                        }
                    }
                });

                filterClinics(); 
            })
            .catch(error => console.error('Error fetching real clinics:', error));
    }

    loadRealClinics();
});