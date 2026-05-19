document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. PATIENT: MAIN TOGGLE LOGIC ---
    const hasMedHistoryToggle = document.getElementById('has-medical-history');
    const medicalDetails = document.getElementById('medical-details');
    
    if (hasMedHistoryToggle && medicalDetails) {
        hasMedHistoryToggle.addEventListener('change', (e) => {
            if(e.target.checked) {
                medicalDetails.classList.remove('hidden');
            } else {
                medicalDetails.classList.add('hidden');
            }
        });
    }

    // --- 2. PATIENT: SEARCH AND FILTER LOGIC ---
    const searchInput = document.getElementById('med-search');
    const filterSelect = document.getElementById('med-filter');
    const medOptions = document.querySelectorAll('.med-option');
    
    function filterConditions() {
        if (!searchInput || !filterSelect) return;
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = filterSelect.value;

        medOptions.forEach(option => {
            const text = option.textContent.toLowerCase();
            const category = option.getAttribute('data-category');
            const matchesSearch = text.includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || category === selectedCategory || category === 'all';

            if (matchesSearch && matchesCategory) {
                option.style.display = 'flex'; 
            } else {
                option.style.display = 'none'; 
            }
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterConditions);
    if (filterSelect) filterSelect.addEventListener('change', filterConditions);

    // --- 3. PATIENT: DYNAMIC 'OTHER' ROWS LOGIC ---
    const otherCheckbox = document.getElementById('other-med-checkbox');
    const otherInputContainer = document.getElementById('other-med-input-container');
    const dynamicOtherList = document.getElementById('dynamic-other-list');
    const addOtherBtn = document.getElementById('add-other-med-btn');

    if (otherCheckbox && otherInputContainer && dynamicOtherList && addOtherBtn) {
        function attachRemoveEvent(row) {
            const removeBtn = row.querySelector('.remove-med-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    row.remove(); 
                    if (dynamicOtherList.querySelectorAll('.other-input-row').length === 0) {
                        otherCheckbox.checked = false; 
                        otherInputContainer.classList.add('hidden'); 
                        resetDynamicList(); 
                    }
                });
            }
        }

        function resetDynamicList() {
            dynamicOtherList.innerHTML = `
                <div class="other-input-row">
                    <input type="text" name="medical_history_other[]" placeholder="Please specify your condition..." class="full-width-input other-med-input">
                    <button type="button" class="remove-med-btn" title="Remove this condition">✕</button>
                </div>
            `;
            attachRemoveEvent(dynamicOtherList.querySelector('.other-input-row'));
        }

        attachRemoveEvent(dynamicOtherList.querySelector('.other-input-row'));

        otherCheckbox.addEventListener('change', (e) => {
            if(e.target.checked) {
                otherInputContainer.classList.remove('hidden');
                dynamicOtherList.querySelector('.other-med-input').required = true;
            } else {
                otherInputContainer.classList.add('hidden');
                resetDynamicList(); 
                dynamicOtherList.querySelector('.other-med-input').required = false;
            }
        });

        addOtherBtn.addEventListener('click', () => {
            const newRow = document.createElement('div');
            newRow.className = 'other-input-row';
            newRow.innerHTML = `
                <input type="text" name="medical_history_other[]" placeholder="Please specify your condition..." class="full-width-input other-med-input" required>
                <button type="button" class="remove-med-btn" title="Remove this condition">✕</button>
            `;
            dynamicOtherList.appendChild(newRow);
            attachRemoveEvent(newRow); 
        });
    }

    // --- 4. ADVANCED FORM TOGGLE LOGIC ---
    const registerView = document.getElementById('register-view');
    const loginView = document.getElementById('login-view');
    const clinicRegisterView = document.getElementById('clinic-register-view');

    function hideAllViews() {
        if(registerView) registerView.classList.add('hidden');
        if(loginView) loginView.classList.add('hidden');
        if(clinicRegisterView) clinicRegisterView.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scrolls to top
    }

    const btnShowLogin = document.getElementById('show-login');
    if(btnShowLogin) btnShowLogin.addEventListener('click', () => { hideAllViews(); loginView.classList.remove('hidden'); });

    const btnShowRegister = document.getElementById('show-register');
    if(btnShowRegister) btnShowRegister.addEventListener('click', () => { hideAllViews(); registerView.classList.remove('hidden'); });

    const btnShowClinicRegister = document.getElementById('show-clinic-register');
    if(btnShowClinicRegister) btnShowClinicRegister.addEventListener('click', () => { hideAllViews(); clinicRegisterView.classList.remove('hidden'); });

    const btnShowLoginFromClinic = document.getElementById('show-login-from-clinic');
    if(btnShowLoginFromClinic) btnShowLoginFromClinic.addEventListener('click', () => { hideAllViews(); loginView.classList.remove('hidden'); });

    const btnShowPatientRegister = document.getElementById('show-patient-register');
    if(btnShowPatientRegister) btnShowPatientRegister.addEventListener('click', () => { hideAllViews(); registerView.classList.remove('hidden'); });


    // --- 5. CLINIC: DYNAMIC 'OTHER' SPECIALTY LOGIC ---
    const clinicOtherCheck = document.getElementById('clinic-other-specialty-checkbox');
    const clinicOtherContainer = document.getElementById('clinic-other-specialty-container');
    const clinicDynamicOtherList = document.getElementById('clinic-dynamic-other-list');
    const addClinicOtherBtn = document.getElementById('add-clinic-other-specialty-btn');

    if(clinicOtherCheck && clinicDynamicOtherList) {
        function attachClinicRemoveEvent(row) {
            const removeBtn = row.querySelector('.remove-clinic-specialty-btn');
            if(removeBtn) {
                removeBtn.addEventListener('click', () => {
                    row.remove(); 
                    if (clinicDynamicOtherList.querySelectorAll('.other-input-row').length === 0) {
                        clinicOtherCheck.checked = false; 
                        clinicOtherContainer.classList.add('hidden'); 
                        resetClinicDynamicList(); 
                    }
                });
            }
        }

        function resetClinicDynamicList() {
            clinicDynamicOtherList.innerHTML = `
                <div class="other-input-row">
                    <input type="text" name="clinic_specialty_other[]" placeholder="Please specify your specialty..." class="full-width-input other-med-input">
                    <button type="button" class="remove-clinic-specialty-btn remove-med-btn" title="Remove this specialty">✕</button>
                </div>
            `;
            attachClinicRemoveEvent(clinicDynamicOtherList.querySelector('.other-input-row'));
        }

        attachClinicRemoveEvent(clinicDynamicOtherList.querySelector('.other-input-row'));

        clinicOtherCheck.addEventListener('change', (e) => {
            if(e.target.checked) {
                clinicOtherContainer.classList.remove('hidden');
                const input = clinicDynamicOtherList.querySelector('.other-med-input');
                if(input) input.required = true;
            } else {
                clinicOtherContainer.classList.add('hidden');
                resetClinicDynamicList(); 
                const input = clinicDynamicOtherList.querySelector('.other-med-input');
                if(input) input.required = false;
            }
        });

        if(addClinicOtherBtn) {
            addClinicOtherBtn.addEventListener('click', () => {
                const newRow = document.createElement('div');
                newRow.className = 'other-input-row';
                newRow.innerHTML = `
                    <input type="text" name="clinic_specialty_other[]" placeholder="Please specify your specialty..." class="full-width-input other-med-input" required>
                    <button type="button" class="remove-clinic-specialty-btn remove-med-btn" title="Remove this specialty">✕</button>
                `;
                clinicDynamicOtherList.appendChild(newRow);
                attachClinicRemoveEvent(newRow); 
            });
        }
    }

    // --- 6. CLINIC: SCHEDULE TOGGLE LOGIC ---
    const scheduleType = document.getElementById('schedule-type');
    const simpleSchedule = document.getElementById('simple-schedule-container');
    const customSchedule = document.getElementById('custom-schedule-container');

    if(scheduleType && simpleSchedule && customSchedule) {
        scheduleType.addEventListener('change', (e) => {
            if (e.target.value === 'simple') {
                simpleSchedule.classList.remove('hidden');
                customSchedule.classList.add('hidden');
            } else {
                simpleSchedule.classList.add('hidden');
                customSchedule.classList.remove('hidden');
            }
        });
    }

    // Disable time inputs if "Closed" is checked for a specific day
    const closedChecks = document.querySelectorAll('.closed-check');
    closedChecks.forEach(check => {
        check.addEventListener('change', (e) => {
            const row = e.target.closest('.schedule-row');
            if(row) {
                const timeInputs = row.querySelectorAll('input[type="time"]');
                if(e.target.checked) {
                    timeInputs.forEach(input => { 
                        input.disabled = true; 
                        input.style.opacity = '0.5';
                        input.value = ''; 
                    });
                } else {
                    timeInputs.forEach(input => {
                        input.disabled = false;
                        input.style.opacity = '1';
                    });
                }
            }
        });
    });

});