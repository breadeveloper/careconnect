document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('profile-form');
    
    // Checkboxes and Containers
    const mainToggle = document.getElementById('has-medical-history');
    const medDetails = document.getElementById('medical-details');
    const otherCheckbox = document.getElementById('other-med-checkbox');
    const otherContainer = document.getElementById('other-med-input-container');
    const dynamicOtherList = document.getElementById('dynamic-other-list');
    const addOtherBtn = document.getElementById('add-other-med-btn');
    
    // Search tools
    const searchInput = document.getElementById('med-search');
    const filterSelect = document.getElementById('med-filter');
    const medOptions = document.querySelectorAll('.med-option');

    // Action Buttons
    const btnEdit = document.getElementById('btn-edit');
    const btnBack = document.getElementById('btn-back');
    const btnSave = document.getElementById('btn-save');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');

    // This variable acts as our "Snapshot" memory!
    let originalData = null;

    // --- 1. FETCH & POPULATE ---
    fetch('fetch_profile.php')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                originalData = result.data; // Save the snapshot
                populateForm(originalData); // Fill the UI
                setMode('view');            // Lock it down
            } else {
                console.error("Failed to load profile:", result.message);
            }
        })
        .catch(error => console.error("Error fetching profile:", error));

    // The function that reads data and fills the form
    function populateForm(data) {
        // A. Standard Fields
        document.getElementById('full_name').value = data.full_name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('dob').value = data.dob || '';
        document.getElementById('sex').value = data.sex || '';
        document.getElementById('contact_number').value = data.contact_number || '';
        document.getElementById('province').value = data.province || '';
        document.getElementById('town').value = data.town || '';
        document.getElementById('barangay').value = data.barangay || '';
        document.getElementById('street').value = data.street || '';

        // B. Reset Medical History completely before refilling
        mainToggle.checked = false;
        medDetails.classList.add('hidden');
        otherCheckbox.checked = false;
        otherContainer.classList.add('hidden');
        dynamicOtherList.innerHTML = ''; // Wipe custom text boxes
        document.querySelectorAll('input[name="medical_history[]"]').forEach(cb => cb.checked = false);

        // C. Fill Medical History if it exists
        if (data.medical_conditions) {
            mainToggle.checked = true;
            medDetails.classList.remove('hidden');

            const conditions = data.medical_conditions.split('||');
            const standardCheckboxes = Array.from(document.querySelectorAll('input[name="medical_history[]"]'));
            const standardValues = standardCheckboxes.map(cb => cb.value);

            let hasOtherConditions = false;

            conditions.forEach(condition => {
                if (standardValues.includes(condition)) {
                    document.querySelector(`input[name="medical_history[]"][value="${condition}"]`).checked = true;
                } else if (condition.trim() !== '') {
                    hasOtherConditions = true;
                    addDynamicOtherRow(condition);
                }
            });

            if (hasOtherConditions) {
                otherCheckbox.checked = true;
                otherContainer.classList.remove('hidden');
            }
        }
    }

    // --- 2. STATE MANAGEMENT (View vs. Edit Mode) ---
    // --- 2. STATE MANAGEMENT (View vs. Edit Mode) ---
    function setMode(mode) {
        if (mode === 'edit') {
            form.classList.remove('view-mode');
            
            // Swap Buttons
            btnEdit.classList.add('hidden');
            btnBack.classList.add('hidden');
            btnSave.classList.remove('hidden');
            btnCancelEdit.classList.remove('hidden');
            
            // Make editable fields active (Text & Checkboxes)
            document.querySelectorAll('.editable-field').forEach(el => {
                if(el.tagName === 'INPUT' && el.type === 'text') el.readOnly = false;
                if(el.tagName === 'INPUT' && el.type === 'checkbox') el.disabled = false; // <--- ADD THIS
            });

        } else if (mode === 'view') {
            form.classList.add('view-mode');
            
            // Swap Buttons
            btnEdit.classList.remove('hidden');
            btnBack.classList.remove('hidden');
            btnSave.classList.add('hidden');
            btnCancelEdit.classList.add('hidden');
            
            // Lock fields (Text & Checkboxes)
            document.querySelectorAll('.editable-field').forEach(el => {
                if(el.tagName === 'INPUT' && el.type === 'text') el.readOnly = true;
                if(el.tagName === 'INPUT' && el.type === 'checkbox') el.disabled = true; // <--- ADD THIS
            });
        }
    }

    // Button Listeners for Mode Switching
    btnEdit.addEventListener('click', () => setMode('edit'));
    
    btnCancelEdit.addEventListener('click', () => {
        // User canceled! Restore the snapshot and go back to view mode.
        populateForm(originalData); 
        setMode('view');
    });

    // --- 3. UI INTERACTION LOGIC (Toggles & Search) ---
    mainToggle.addEventListener('change', (e) => {
        e.target.checked ? medDetails.classList.remove('hidden') : medDetails.classList.add('hidden');
    });

    otherCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            otherContainer.classList.remove('hidden');
            if (dynamicOtherList.children.length === 0) addDynamicOtherRow('');
        } else {
            otherContainer.classList.add('hidden');
            dynamicOtherList.innerHTML = '';
        }
    });

    addOtherBtn.addEventListener('click', () => addDynamicOtherRow(''));

    function addDynamicOtherRow(value = '') {
        const row = document.createElement('div');
        row.className = 'other-input-row';
        row.innerHTML = `
            <input type="text" name="medical_history_other[]" value="${value}" placeholder="Please specify your condition..." class="full-width-input other-med-input editable-field" required>
            <button type="button" class="remove-med-btn" title="Remove this condition">✕</button>
        `;
        dynamicOtherList.appendChild(row);
    }

    dynamicOtherList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-med-btn')) {
            e.target.closest('.other-input-row').remove();
            if (dynamicOtherList.children.length === 0) {
                otherCheckbox.checked = false;
                otherContainer.classList.add('hidden');
            }
        }
    });

    // Search and Filter Functionality
    function filterConditions() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = filterSelect.value;

        medOptions.forEach(option => {
            const text = option.textContent.toLowerCase();
            const optCat = option.getAttribute('data-category');
            const matchesSearch = text.includes(searchTerm);
            const matchesCategory = (category === 'all' || optCat === category || optCat === 'all'); 
            
            option.style.display = (matchesSearch && matchesCategory) ? 'flex' : 'none';
        });
    }
    searchInput.addEventListener('input', filterConditions);
    filterSelect.addEventListener('change', filterConditions);

    // --- 4. FORM SUBMISSION ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const formData = new FormData(form);
        
        fetch('update_profile.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Profile updated successfully!');
                
                // Important: Update our local "Snapshot" so Cancel works properly with the new data!
                // We re-fetch from the database to guarantee our snapshot matches reality.
                fetch('fetch_profile.php')
                    .then(res => res.json())
                    .then(newData => {
                        originalData = newData.data;
                        populateForm(originalData);
                        setMode('view');
                    });
                    
            } else {
                alert('Error updating profile: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('A system error occurred while saving.');
        });
    });
});