document.addEventListener('DOMContentLoaded', () => {
    // Silently ask the server if the user is logged in
    fetch('../registration/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (data.logged_in) {
                
                // --- 1. LOGIN TO LOGOUT BUTTON ---
                const loginLink = document.getElementById('login-nav-link');
                if (loginLink) {
                    loginLink.textContent = 'Logout';
                    loginLink.href = '../registration/logout.php';
                    loginLink.style.backgroundColor = '#ff6b6b'; 
                    loginLink.style.color = '#fff';
                }

                // --- 2. FIND EXISTING TABS ---
                const navLinks = document.querySelectorAll('nav ul li a');
                let clinicsLink = null;
                let appointmentLink = null;

                navLinks.forEach(link => {
                    if (link.textContent.trim() === 'Clinics') clinicsLink = link;
                    if (link.textContent.trim() === 'Appointment') appointmentLink = link;
                });

                // --- 3. ROLE-BASED ROUTING & AVATAR SELECTION ---
                const profileLi = document.createElement('li');
                let profileUrl = '#';
                let iconSrc = '../home/account.png'; // Default to patient icon

                if (data.user_role === 'patient') {
                    // Patient Routing
                    profileUrl = '../patient_page/profile.html';
                    iconSrc = '../home/account.png';
                    
                } else if (data.user_role === 'clinic') {
                    // Clinic Routing
                    profileUrl = '../clinic_admin/profile.html'; 
                    iconSrc = '../clinic_admin/reception.png'; // Distinct Clinic Icon!
                    
                    // Hide the Clinics tab completely
                    if (clinicsLink) {
                        clinicsLink.parentElement.style.display = 'none';
                    }
                    
                    // Reroute the Appointment tab to the clinic's management dashboard
                    if (appointmentLink) {
                        appointmentLink.href = '../clinic_admin/appointments.html';
                    }
                }

                // --- 4. INJECT THE PROFILE ICON ---
                profileLi.innerHTML = `
                    <a href="${profileUrl}" title="My Profile" style="background-color: transparent; width: auto; padding: 0; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; margin-left: 5px; transform: translateY(-5px);">
                        <img src="${iconSrc}" alt="Profile" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #a9c8fc; object-fit: contain; background-color: #fff; padding: 5px; transition: transform 0.2s;">
                    </a>
                `;

                const navUl = document.querySelector('nav ul');
                if (navUl) navUl.appendChild(profileLi);
            }
        })
        .catch(error => console.error("Authentication check failed:", error));
});