document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. INITIALIZE FULLCALENDAR ---
    const calendarEl = document.getElementById('calendar');
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', 
        height: 'auto', // Lets the calendar stretch comfortably 
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        }
    });
    
    calendar.render();

    // --- 2. MODAL LOGIC ---
    const modal = document.getElementById('booking-modal');
    const newApptBtn = document.getElementById('new-appointment-btn');
    const closeBtn = document.querySelector('.close-modal');

    // Open Modal
    newApptBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    // Close Modal via X button
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close Modal by clicking the dark background outside it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // --- 3. POPULATE CLINIC DROPDOWN ---
    const clinicSelect = document.getElementById('modal-clinic-select');
    
    // Fetch real clinics from your DB for the dropdown menu
    fetch('../clinics/fetch_clinics.php')
        .then(response => response.json())
        .then(data => {
            data.forEach(clinic => {
                const option = document.createElement('option');
                option.value = clinic.clinic_id;
                option.textContent = clinic.clinic_name;
                clinicSelect.appendChild(option);
            });
        })
        .catch(err => console.error("Error loading clinics:", err));

    // --- 4. HANDLE FORM SUBMISSION ---
    const bookingForm = document.getElementById('booking-form');
    
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Stop the page from reloading!

        // Gather the inputs
        const formData = new FormData();
        formData.append('clinic_id', clinicSelect.value);
        formData.append('reason', document.getElementById('modal-reason').value);
        formData.append('date', document.getElementById('modal-date').value);
        formData.append('time', document.getElementById('modal-time').value);

        // Send to headless PHP script
        fetch('book_appointment.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(result.message);
                bookingForm.reset(); // Clear the inputs
                modal.classList.add('hidden'); // Close the modal
            } else {
                alert(result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while booking. Please try again.");
        });
    });
});