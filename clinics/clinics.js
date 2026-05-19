document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const filterSpecialty = document.getElementById('filter-specialty');
    const filterStatus = document.getElementById('filter-status');

    function formatTagName(str) {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // --- 1. THE SMART TAG RENDERER (CONTEXT SWAP) ---
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

    // --- 2. FILTER & SEARCH LOGIC ---
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

    // --- 3. DATABASE FETCH & RENDER LOGIC ---
    function loadRealClinics() {
        fetch('fetch_clinics.php')
            .then(response => response.json())
            .then(realClinics => {
                
                // DYNAMIC DROPDOWN GENERATOR
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

                const firstCard = document.querySelector('.clinic-card');
                if (!firstCard) return;
                const container = firstCard.parentElement;

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

                    // Notice the <a> tag wrapping the card-header, and your updated call.png!
                    card.innerHTML = `
                        <a href="clinic_profile.html?id=${dbClinic.clinic_id}" class="clickable-card-header" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                            <div class="card-header">
                                <div class="clinic-logo-placeholder">
                                    <img src="hospital.png" alt="Hospital Icon" class="clinic-icon">
                                </div>
                                <div class="clinic-title-area">
                                    <h3>${dbClinic.clinic_name}</h3>
                                    <p class="clinic-location" style="margin-bottom: 4px;">
                                        <img src="location.png" alt="Location" class="loc-icon"> ${locationText}
                                    </p>
                                    <p class="clinic-location" style="margin-bottom: 0;">
                                        <img src="call.png" alt="Contact" class="loc-icon" style="width: 14px; margin-right: 5px;"> ${formattedContact}
                                    </p>
                                </div>
                            </div>
                        </a>
                        
                        <div class="card-tags">
                            <span class="tag status-open">● Open Now</span>
                            </div>
                        
                        <div class="card-actions">
                            <a href="../appointment/appointment.html?clinic=${dbClinic.clinic_id}" class="btn primary-btn">Book Now</a>
                            <button class="btn secondary-btn" onclick="window.open('https://waze.com/ul', '_blank')">
                                <img src="directions.png" alt="Direction" class="btn-icon"> Map Directions
                            </button>
                        </div>
                    `;
                    
                    container.prepend(card);
                });

                filterClinics(); 
            })
            .catch(error => console.error('Error fetching real clinics:', error));
    }

    loadRealClinics();
});