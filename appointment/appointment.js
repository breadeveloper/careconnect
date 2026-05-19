document.addEventListener("DOMContentLoaded", function () {
    const previewBtn = document.getElementById("previewBtn");
    const confirmBtn = document.getElementById("confirmBtn");
    const form = document.getElementById("appointmentForm");
    const summaryDiv = document.getElementById("summary");

    // Hide confirm button by default
    confirmBtn.style.display = "none";

    previewBtn.addEventListener("click", function () {
        // Check if all required fields are filled
        const requiredFields = form.querySelectorAll("[required]");
        let allFilled = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allFilled = false;
            }
        });

        if (!allFilled) {
            alert("Please fill out all required fields before previewing.");
            return;
        }

        // Populate summary section
        document.getElementById("summaryname").textContent = document.getElementById("name").value;
        document.getElementById("summarycontact").textContent = document.getElementById("contact").value;
        document.getElementById("summarydatebirth").textContent = document.getElementById("datebirth").value;
        document.getElementById("summarygender").textContent = document.getElementById("gender").value;
        document.getElementById("summarymedical").textContent = document.getElementById("medical").value;
        document.getElementById("summarypreferdate").textContent = document.getElementById("preferdate").value;
        document.getElementById("summaryprefertime").textContent = document.getElementById("prefertime").value;
        document.getElementById("summarytype").textContent = document.getElementById("type").value;
        document.getElementById("summaryreason").textContent = document.getElementById("reason").value;

        // Show summary & confirm button
        summaryDiv.style.display = "block";
        confirmBtn.style.display = "inline-block";
    });

    // Handle final submission
    form.addEventListener("confirmBtn", function (event) {
        event.preventDefault();
        alert("Appointment booked successfully!");

        // Reset the form & hide summary + confirm button
        form.reset();
        summaryDiv.style.display = "none";
        confirmBtn.style.display = "none";
    });
});



document.addEventListener("DOMContentLoaded", function () {
    const appointmentForm = document.getElementById("appointmentForm"); // Use ID for accuracy

    appointmentForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent page reload

        const formData = {
            name: document.getElementById("name").value.trim(),
            contact: document.getElementById("contact").value.trim(),
            dateOfBirth: document.getElementById("datebirth").value,
            gender: document.getElementById("gender").value,
            medicalHistory: document.getElementById("medical").value.trim(),
            preferredDate: document.getElementById("preferdate").value,
            preferredTime: document.getElementById("prefertime").value,
            appointmentType: document.getElementById("type").value,
            reason: document.getElementById("reason").value.trim()
        };

        console.log("Submitting appointment:", formData); 

        fetch("https://script.google.com/macros/s/AKfycbzvPdQIuaJnaKDocnNqaQk4v2HCOefMMfFXXkqN-kG2h85aqbWSGkUp8Nfrq2DATdzNUw/exec", {  
            method: "POST",
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
        .then(() => {
            alert("Appointment booked successfully!"); 
            appointmentForm.reset(); 
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Failed to book appointment. Please try again.");
        });
    });
});

