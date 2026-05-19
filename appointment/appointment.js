document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. INITIALIZE FULLCALENDAR ---
    const calendarEl = document.getElementById('calendar');
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Default view is the full month
        height: '100%', // Bound to the CSS max-height
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek' // Allow toggling between month and week views
        },
        // We will replace this with a PHP fetch later! Just mocking some data to see how it looks.
        events: [
            {
                title: 'Dental Checkup - SmileMakers',
                start: '2026-05-22T10:00:00',
                backgroundColor: '#007bff', // Blue for confirmed
                borderColor: '#007bff'
            },
            {
                title: 'Pending: ENT Consultation',
                start: '2026-05-25T14:30:00',
                backgroundColor: '#ffc107', // Yellow for pending
                borderColor: '#e0a800',
                textColor: '#000'
            }
        ],
        // Interactive Two-Way Binding placeholder
        eventClick: function(info) {
            alert('You clicked on appointment: ' + info.event.title + '\n\nLater, this will highlight the exact row in the table below!');
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

});