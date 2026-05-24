document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('profile-form');
    
    const btnEdit = document.getElementById('btn-edit');
    const btnBack = document.getElementById('btn-back');
    const btnSave = document.getElementById('btn-save');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');

    const customCheckboxes = document.querySelectorAll('.custom-day-cb');
    let originalData = null;

    // --- 0. CHECKBOX UNLOCK LOGIC ---
    customCheckboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const row = e.target.closest('.custom-day-row');
            const timeInputs = row.querySelectorAll('.custom-time');
            const isEditMode = !form.classList.contains('view-mode');
            
            timeInputs.forEach(input => {
                input.disabled = !(e.target.checked && isEditMode);
                input.readOnly = !(e.target.checked && isEditMode);
                if (!e.target.checked) input.value = ''; 
            });
        });
    });

    // --- 1. FETCH & POPULATE DATA ---
    fetch('fetch_clinic_profile.php')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                originalData = result.data; 
                populateForm(originalData); 
                setMode('view');            
            } else {
                console.error("Failed to load profile:", result.message);
            }
        })
        .catch(error => console.error("Error:", error));

    function populateForm(data) {
        // MATCHING EXACT DATABASE COLUMNS
        document.getElementById('clinic_name').value = data.clinic_name || '';
        document.getElementById('clinic_email').value = data.clinic_email || '';
        document.getElementById('clinic_contact').value = data.clinic_contact || '';
        document.getElementById('barangay').value = data.barangay || '';
        document.getElementById('street').value = data.street || '';
        document.getElementById('latitude').value = data.latitude || '';
        document.getElementById('longitude').value = data.longitude || '';

        // Wipe time boxes clean before filling
        customCheckboxes.forEach(cb => {
            cb.checked = false;
            const row = cb.closest('.custom-day-row');
            row.querySelector('input[name$="_open"]').value = '';
            row.querySelector('input[name$="_close"]').value = '';
        });

        // Helper function to slice "08:00:00" down to "08:00" for the browser
        function formatTime(dbTime) {
            if (!dbTime) return '';
            return dbTime.substring(0, 5); 
        }

        // Map the DB days directly to the dynamic HTML inputs
        if (data.schedules && data.schedules.length > 0) {
            data.schedules.forEach(sch => {
                const cb = Array.from(customCheckboxes).find(c => c.value === sch.day_of_week);
                if (cb) {
                    cb.checked = true;
                    const row = cb.closest('.custom-day-row');
                    const prefix = sch.day_of_week.substring(0, 3).toLowerCase();
                    
                    row.querySelector(`input[name="${prefix}_open"]`).value = formatTime(sch.open_time);
                    row.querySelector(`input[name="${prefix}_close"]`).value = formatTime(sch.close_time);
                }
            });
        }
    }

    // --- 2. STATE MANAGEMENT ---
    function setMode(mode) {
        const isEdit = (mode === 'edit');
        
        isEdit ? form.classList.remove('view-mode') : form.classList.add('view-mode');
        
        btnEdit.classList.toggle('hidden', isEdit);
        btnBack.classList.toggle('hidden', isEdit);
        btnSave.classList.toggle('hidden', !isEdit);
        btnCancelEdit.classList.toggle('hidden', !isEdit);

        document.querySelectorAll('.editable-field').forEach(el => {
            if(el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'time')) el.readOnly = !isEdit;
            if(el.tagName === 'INPUT' && el.type === 'checkbox') el.disabled = !isEdit;
        });

        customCheckboxes.forEach(cb => {
            const row = cb.closest('.custom-day-row');
            row.querySelectorAll('.custom-time').forEach(input => {
                input.readOnly = !(isEdit && cb.checked);
                input.disabled = !(isEdit && cb.checked);
            });
        });
    }

    btnEdit.addEventListener('click', () => setMode('edit'));
    btnCancelEdit.addEventListener('click', () => {
        populateForm(originalData); 
        setMode('view');
    });

    // --- 3. FORM SUBMISSION ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const formData = new FormData(form);
        
        fetch('update_clinic_profile.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('Clinic profile updated successfully!');
                fetch('fetch_clinic_profile.php')
                    .then(res => res.json())
                    .then(newData => {
                        originalData = newData.data;
                        populateForm(originalData);
                        setMode('view');
                    });
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(err => alert('A system error occurred.'));
    });
});