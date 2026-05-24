document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. SECURITY: GUEST LOCKDOWN CHECK ---
    fetch('../registration/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in || data.user_role !== 'patient') {
                const overlay = document.getElementById('guest-overlay');
                if (overlay) overlay.classList.remove('hidden');

                const allInputs = document.querySelectorAll('.dashboard-container input, .dashboard-container select, .dashboard-container button, .modal input, .modal select, .modal button');
                
                allInputs.forEach(input => {
                    if (!input.closest('#guest-overlay')) {
                        input.disabled = true;
                        input.style.cursor = 'not-allowed';
                        input.style.opacity = '0.6';
                    }
                });
            }
        })
        .catch(err => console.error("Security check failed:", err));

    // --- 1. INITIALIZE FULLCALENDAR ---
    const calendarEl = document.getElementById('calendar');
    let calendar;
    
    if (calendarEl) {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', 
            height: 'auto', 
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            eventDisplay: 'block', 
            displayEventTime: false 
        });
        calendar.render();
    }

    // --- 2. MODAL LOGIC ---
    const modal = document.getElementById('booking-modal');
    const newApptBtn = document.getElementById('new-appointment-btn');
    const closeBtn = document.querySelector('.close-modal');

    if (newApptBtn && modal) {
        newApptBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    // --- 2.5 FEEDBACK MODAL OPEN/CLOSE LOGIC ---
    const feedbackModal = document.getElementById('feedback-modal');
    const giveFeedbackBtn = document.getElementById('give-feedback-btn');
    const closeFeedbackBtn = document.querySelector('.close-feedback-modal');
    const feedbackForm = document.getElementById('feedback-form');

    if (giveFeedbackBtn && feedbackModal) {
        giveFeedbackBtn.addEventListener('click', () => feedbackModal.classList.remove('hidden'));
    }
    if (closeFeedbackBtn && feedbackModal) {
        closeFeedbackBtn.addEventListener('click', () => feedbackModal.classList.add('hidden'));
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.classList.add('hidden');
        if (event.target === feedbackModal) feedbackModal.classList.add('hidden');
    });

    // --- 3. POPULATE CLINIC DROPDOWN ---
    const clinicSelect = document.getElementById('modal-clinic-select');
    if (clinicSelect) {
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
    }

    // --- 3.5 INTELLIGENT TIME SLOTS LOGIC ---
    const dateInput = document.getElementById('modal-date');
    const durationSelect = document.getElementById('modal-duration');
    const timeSelect = document.getElementById('modal-time');

    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    function fetchAvailableTimeSlots() {
        if (!clinicSelect || !dateInput || !durationSelect || !timeSelect) return;

        const clinicId = clinicSelect.value;
        const dateVal = dateInput.value;
        const durationVal = durationSelect.value;

        if (!clinicId || !dateVal || !durationVal) {
            timeSelect.innerHTML = '<option value="">Select a clinic, date, and duration first...</option>';
            timeSelect.disabled = true;
            return;
        }

        timeSelect.innerHTML = '<option value="">Searching for available slots...</option>';
        timeSelect.disabled = true;

        const formData = new FormData();
        formData.append('clinic_id', clinicId);
        formData.append('date', dateVal);
        formData.append('duration', durationVal);

        fetch('fetch_available_slots.php', { method: 'POST', body: formData })
        .then(response => response.text()) 
        .then(text => {
            try {
                const data = JSON.parse(text); 
                timeSelect.innerHTML = '<option value="">Choose an available time...</option>';
                
                if (data.success && data.slots.length > 0) {
                    data.slots.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot.value;     
                        option.textContent = slot.display; 
                        timeSelect.appendChild(option);
                    });
                    timeSelect.disabled = false; 
                } else {
                    timeSelect.innerHTML = `<option value="">${data.message || 'No slots available'}</option>`;
                }
            } catch (parseError) {
                console.error("🚨 RAW PHP ERROR CAUGHT:", text);
                timeSelect.innerHTML = `<option value="">Database Crash. Check Console.</option>`;
            }
        })
        .catch(err => {
            console.error('Network Error:', err);
            timeSelect.innerHTML = '<option value="">Network error. Try again.</option>';
        });
    }

    if (clinicSelect) clinicSelect.addEventListener('change', fetchAvailableTimeSlots);
    if (dateInput) dateInput.addEventListener('change', fetchAvailableTimeSlots);
    if (durationSelect) durationSelect.addEventListener('change', fetchAvailableTimeSlots);

    // --- 4. HANDLE FORM SUBMISSION ---
    const bookingForm = document.getElementById('booking-form');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            
            const clinicSelect = document.getElementById('modal-clinic-select');
            const durationSelect = document.getElementById('modal-duration');
            const timeSelect = document.getElementById('modal-time');

            if (!clinicSelect || !durationSelect || !timeSelect) {
                console.error("Booking form variables are missing from the active DOM.");
                return;
            }

            const clinicId = clinicSelect.value;
            const clinicName = clinicSelect.selectedIndex !== -1 ? clinicSelect.options[clinicSelect.selectedIndex].text : '';
            const reasonVal = document.getElementById('modal-reason').value;
            const dateVal = document.getElementById('modal-date').value;
            const durationVal = durationSelect.value;
            const timeVal = timeSelect.selectedIndex !== -1 ? timeSelect.options[timeSelect.selectedIndex].text : ''; 

            const formData = new FormData();
            formData.append('clinic_id', clinicId);
            formData.append('reason', reasonVal);
            formData.append('date', dateVal);
            formData.append('duration', durationVal); 
            formData.append('time', timeSelect.value); 

            fetch('book_appointment.php', { method: 'POST', body: formData })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    
                    // Bundle up the payload fields
                    const templateParams = {
                        clinic_name: clinicName,
                        reason: reasonVal,
                        appointment_date: dateVal,
                        appointment_time: timeVal,
                        duration: durationVal,
                        patient_name: result.patient_name,
                        patient_email: result.patient_email  // Maps to your dashboard's {{patient_email}}
                    };

                    if (typeof emailjs !== 'undefined') {
                        
                        // 📩 ONLY ONE CALL NEEDED!
                        // Because your EmailJS dashboard has "To Email" as {{patient_email}} 
                        // and YOUR email in BCC, this single line sends it to both of you.
                        emailjs.send("service_b577zon", "template_k26gaoh", templateParams)
                            .then((response) => {
                               console.log('Appointment copy successfully dispatched to patient and admin via BCC!', response.status, response.text);
                            }, (error) => {
                               console.error('Email delivery error:', error);
                            });

                    } else {
                        console.warn("EmailJS global script instance is currently unavailable.");
                    }

                    alert(result.message);
                    bookingForm.reset(); 
                    
                    const modal = document.getElementById('booking-modal');
                    if (modal) modal.classList.add('hidden'); 
                    
                    if (typeof loadAppointments === "function") loadAppointments(); 
                } else {
                    alert(result.message);
                }
            })
            .catch(error => {
                console.error('Error handling booking submission:', error);
                alert("An error occurred while booking.");
            });
        });
    }

    // --- 4.5 HANDLE PATIENT TESTIMONY SUBMISSION ---
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const patientName = document.getElementById('feedback-name').value;
            const rating = document.getElementById('feedback-rating').value;
            const comments = document.getElementById('feedback-comments').value;

            const dbFormData = new FormData();
            dbFormData.append('patient_name', patientName);
            dbFormData.append('rating', rating);
            dbFormData.append('comments', comments);

            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Processing...";

            try {
                const dbResponse = await fetch('submit_testimonial.php', { method: 'POST', body: dbFormData });
                const rawText = await dbResponse.text();
                console.log("=== RAW PHP OUTPUT ===", rawText);

                let dbResult;
                try {
                    dbResult = JSON.parse(rawText);
                } catch (jsonError) {
                    console.error("❌ PHP did not return valid JSON. Look at RAW PHP OUTPUT above.");
                    alert("Submission configuration mismatch. Verify backend file exists locally.");
                    return;
                }

                if (dbResult.success) {
                    // Triggering EmailJS notification for Testimonial submittals
                    if (typeof emailjs !== 'undefined') {
                        const testimonialParams = {
                            patient_name: patientName,
                            rating: rating,
                            comments: comments
                        };

                        emailjs.send("service_b577zon", "template_zbf4jm4", testimonialParams)
                            .then((response) => {
                               console.log('Testimonial notification email sent successfully!', response.status, response.text);
                            }, (error) => {
                               console.error('Testimonial email notification failed to dispatch:', error);
                            });
                    } else {
                        console.warn("EmailJS global script instance is currently unavailable.");
                    }

                    alert("Thank you! Your testimony has been securely captured.");
                    feedbackForm.reset();
                    if (feedbackModal) feedbackModal.classList.add('hidden');
                    loadTestimonials(); 
                } else {
                    alert("Server Error: " + dbResult.message);
                }
            } catch (error) {
                console.error('System synchronization exception caught:', error);
                alert("Oops! We encountered an error saving your feedback locally.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Testimony";
            }
        });
    }

    // --- 4.8 FETCH TESTIMONIAL FEED ---
    const testimonialsContainer = document.getElementById('testimonials-container');
    function loadTestimonials() {
        if (!testimonialsContainer) return;

        fetch('fetch_testimonials.php')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    testimonialsContainer.innerHTML = '';
                    if (result.data.length === 0) {
                        testimonialsContainer.innerHTML = '<p style="color:#666; font-style:italic;">No testimonies published yet.</p>';
                        return;
                    }
                    result.data.forEach(review => {
                        const div = document.createElement('div');
                        div.style.borderBottom = "1px dashed #ddd";
                        div.style.padding = "10px 0";
                        div.innerHTML = `<strong>${review.patient_name}</strong> (${'⭐'.repeat(review.rating)})<br><span style="color:#555;">"${review.comments}"</span>`;
                        testimonialsContainer.appendChild(div);
                    });
                }
            })
            .catch(err => console.error("Testimonials load skipped or failing:", err));
    }

    // --- 5. FETCH APPOINTMENTS & BUILD TABLE ---
    const tableBody = document.getElementById('appointment-table-body');
    const selectAllCheckbox = document.getElementById('select-all');
    const bulkCancelBtn = document.getElementById('bulk-cancel-btn');

    function loadAppointments() {
        if (!tableBody) return;

        fetch('fetch_appointments.php')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    tableBody.innerHTML = ''; 
                    if (calendar) calendar.removeAllEvents(); 
                    if (selectAllCheckbox) selectAllCheckbox.checked = false; 

                    const appointments = result.data;
                    const calendarEvents = []; 

                    if (appointments.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No appointments found.</td></tr>';
                        updateBulkButtonsState();
                        return;
                    }

                    appointments.forEach(appt => {
                        const dateObj = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
                        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const currentStatus = appt.status.trim().toLowerCase();

                        let statusColor = '#333';
                        let textColor = '#fff'; 
                        let addToCalendar = true; 

                        if (currentStatus === 'confirmed') statusColor = '#28a745';
                        else if (currentStatus === 'pending') { statusColor = '#ffc107'; textColor = '#000'; }
                        else if (currentStatus === 'rejected') statusColor = '#dc3545';
                        else if (currentStatus === 'cancelled') { statusColor = '#6c757d'; addToCalendar = false; }

                        let checkboxHtml = '';
                        if (currentStatus === 'pending' || currentStatus === 'confirmed') {
                            checkboxHtml = `<input type="checkbox" class="row-checkbox" value="${appt.appointment_id}">`;
                        }

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="text-align: center;">${checkboxHtml}</td> 
                            <td><strong>${formattedDate}</strong> <br> <small style="color: #666;">${formattedTime}</small></td>
                            <td>${appt.clinic_name}</td>
                            <td>${appt.reason}</td>
                            <td style="font-weight: bold; color: ${statusColor};">${appt.status}</td>
                        `;
                        
                        tr.setAttribute('data-search', `${appt.clinic_name} ${appt.reason}`.toLowerCase());
                        tr.setAttribute('data-status', currentStatus);
                        tableBody.appendChild(tr);

                        if (addToCalendar && calendar) {
                            calendarEvents.push({
                                id: appt.appointment_id,
                                title: appt.clinic_name, 
                                start: `${appt.appointment_date}T${appt.appointment_time}`,
                                backgroundColor: statusColor,
                                borderColor: statusColor,
                                textColor: textColor
                            });
                        }
                    });

                    if (calendar) calendar.addEventSource(calendarEvents);
                    applyFilters(); 
                    attachCheckboxListeners();
                }
            })
            .catch(error => console.error('Error fetching appointments:', error));
    }

    // --- 6. SEARCH AND FILTER LOGIC ---
    const searchInput = document.getElementById('appointment-search');
    const statusFilter = document.getElementById('appointment-status-filter');

    function applyFilters() {
        if (!tableBody || !searchInput || !statusFilter) return;
        const searchTerm = searchInput.value.toLowerCase();
        const statusTerm = statusFilter.value.toLowerCase();
        const rows = tableBody.querySelectorAll('tr[data-search]');

        rows.forEach(row => {
            const matchesSearch = row.getAttribute('data-search').includes(searchTerm);
            const matchesStatus = (statusTerm === 'all') || (row.getAttribute('data-status') === statusTerm);
            
            row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
            
            if (row.style.display === 'none') {
                const cb = row.querySelector('.row-checkbox');
                if (cb) cb.checked = false;
            }
        });
        updateBulkButtonsState();
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // --- 7. BULK CHECKBOX LOGIC ---
    function attachCheckboxListeners() {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        if (!selectAllCheckbox) return;
        
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
        if (!bulkCancelBtn || !selectAllCheckbox) return;
        const anyChecked = document.querySelectorAll('.row-checkbox:checked').length > 0;
        bulkCancelBtn.disabled = !anyChecked;
        
        const visibleCheckboxes = Array.from(document.querySelectorAll('.row-checkbox')).filter(cb => cb.closest('tr').style.display !== 'none');
        selectAllCheckbox.checked = visibleCheckboxes.length > 0 && visibleCheckboxes.every(cb => cb.checked);
    }

    // --- 8. EXECUTE BULK CANCEL ---
    if (bulkCancelBtn) {
        bulkCancelBtn.addEventListener('click', () => {
            const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
            const ids = Array.from(selectedCheckboxes).map(cb => cb.value);

            if (ids.length === 0) return;

            if (confirm(`Are you sure you want to cancel ${ids.length} selected appointment(s)?`)) {
                const cancelPromises = ids.map(id => {
                    const formData = new FormData();
                    formData.append('appointment_id', id);
                    return fetch('cancel_appointment.php', { method: 'POST', body: formData }).then(res => res.json());
                });

                Promise.all(cancelPromises)
                    .then(results => {
                        alert('Selected appointments successfully cancelled.');
                        loadAppointments(); 
                    })
                    .catch(error => {
                        console.error('Error cancelling bulk:', error);
                        alert('An error occurred during cancellation.');
                    });
            }
        });
    }

    // Run layout engines safely on launch
    loadAppointments();
    loadTestimonials();
});