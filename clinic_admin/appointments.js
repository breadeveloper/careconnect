document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('appointment-table-body');
    const searchBar = document.getElementById('search-bar');
    const statusFilter = document.getElementById('status-filter');
    
    const selectAllCheckbox = document.getElementById('select-all');
    const bulkButtons = document.querySelectorAll('.bulk-actions button');

    // --- 1. LOAD APPOINTMENTS (Real Database Fetch) ---
    function loadClinicAppointments() {
        fetch('fetch_clinic_appointments.php')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    renderTable(result.data);
                } else {
                    tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">Error: ${result.message}</td></tr>`;
                }
            })
            .catch(error => {
                console.error('Error fetching appointments:', error);
                tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">Failed to connect to database.</td></tr>`;
            });
    }

    // --- 2. RENDER TABLE ROWS ---
    function renderTable(appointments) {
        tableBody.innerHTML = '';
        selectAllCheckbox.checked = false; // Reset master checkbox on load

        if (appointments.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">No appointment requests found.</td></tr>`;
            updateBulkButtonsState();
            return;
        }

        appointments.forEach(appt => {
            const dateObj = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const currentStatus = appt.status.trim().toLowerCase();
            let badgeClass = 'status-pending';
            if (currentStatus === 'confirmed') badgeClass = 'status-confirmed';
            // Both cancelled and rejected get the red badge on the clinic side
            if (currentStatus === 'cancelled' || currentStatus === 'rejected') badgeClass = 'status-cancelled';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center;">
                    <input type="checkbox" class="row-checkbox" value="${appt.appointment_id}">
                </td>
                <td class="patient-info">
                    <strong>${appt.patient_name}</strong>
                    <span>${appt.patient_contact}</span>
                    <span>${appt.patient_email}</span>
                </td>
                <td><strong>${formattedDate}</strong><br><span>${formattedTime}</span></td>
                <td>${appt.reason}</td>
                <td><span class="status-badge ${badgeClass}">${appt.status}</span></td>
            `;
            
            tr.setAttribute('data-search', `${appt.patient_name} ${appt.reason}`.toLowerCase());
            tr.setAttribute('data-status', currentStatus);
            tableBody.appendChild(tr);
        });

        applyFilters(); 
        attachCheckboxListeners(); 
    }

    // --- 3. FILTER LOGIC ---
    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        const statusTerm = statusFilter.value.toLowerCase();
        
        const rows = tableBody.querySelectorAll('tr[data-search]');
        
        rows.forEach(row => {
            const matchesSearch = row.getAttribute('data-search').includes(searchTerm);
            const matchesStatus = (statusTerm === 'all') || (row.getAttribute('data-status') === statusTerm);
            
            row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
            
            if(row.style.display === 'none') {
                row.querySelector('.row-checkbox').checked = false;
            }
        });
        
        updateBulkButtonsState(); 
    }

    searchBar.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    // --- 4. BULK CHECKBOX LOGIC ---
    function attachCheckboxListeners() {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            rowCheckboxes.forEach(cb => {
                const row = cb.closest('tr');
                if (row.style.display !== 'none') cb.checked = isChecked;
            });
            updateBulkButtonsState();
        });

        rowCheckboxes.forEach(cb => {
            cb.addEventListener('change', updateBulkButtonsState);
        });
    }

    function updateBulkButtonsState() {
        const anyChecked = document.querySelectorAll('.row-checkbox:checked').length > 0;
        bulkButtons.forEach(btn => btn.disabled = !anyChecked);
        
        const visibleCheckboxes = Array.from(document.querySelectorAll('.row-checkbox')).filter(cb => cb.closest('tr').style.display !== 'none');
        selectAllCheckbox.checked = visibleCheckboxes.length > 0 && visibleCheckboxes.every(cb => cb.checked);
    }

    function getSelectedIds() {
        return Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
    }

    // --- 5. EXECUTE BULK ACTIONS TO DATABASE ---
    function processBulkAction(actionType, actionVerb) {
        const ids = getSelectedIds();
        if (ids.length === 0) return;

        if (confirm(`Are you sure you want to ${actionVerb} ${ids.length} selected appointment(s)?`)) {
            
            // Send the Action and the Array of IDs securely to PHP
            fetch('bulk_action_appointments.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: actionType, ids: ids })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // TODO: We will trigger EmailJS here for "approve" and "reject" later!
                    loadClinicAppointments(); // Instantly refresh the table to show new statuses!
                } else {
                    alert('Error processing action: ' + result.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('A system error occurred.');
            });
        }
    }

    document.getElementById('bulk-approve').addEventListener('click', () => processBulkAction('approve', 'APPROVE'));
    document.getElementById('bulk-reject').addEventListener('click', () => processBulkAction('reject', 'REJECT and CANCEL'));
    document.getElementById('bulk-delete').addEventListener('click', () => processBulkAction('delete', 'PERMANENTLY DELETE'));

    // Start
    loadClinicAppointments();
});