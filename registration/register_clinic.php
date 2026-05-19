<?php
// Include the shared database connection
require 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Account details
    $email = $_POST['clinic_email'];
    $password = $_POST['clinic_password'];
    $confirmPassword = $_POST['clinic_confirm_password'];
    
    // Profile details
    $clinicName = $_POST['clinic_name'];
    $contact = $_POST['clinic_contact'];
    
    // Address (Optimized for Daet)
    $barangay = $_POST['clinic_barangay'];
    $street = $_POST['clinic_street'];
    
    // Scheduling metadata
    $scheduleType = $_POST['schedule_type'];

    // 1. Security: Password match validation
    if ($password !== $confirmPassword) {
        die("Error: Passwords do not match. <a href='registration.html'>Go back</a>");
    }

    // 2. Security: Securely hash the clinic account password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // --- START DATABASE TRANSACTION ---
    $conn->begin_transaction();

    try {
        // 3. Insert core profile into 'clinics' table
        $stmt = $conn->prepare("INSERT INTO clinics (clinic_email, password_hash, clinic_name, clinic_contact, barangay, street, schedule_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssss", $email, $hashedPassword, $clinicName, $contact, $barangay, $street, $scheduleType);
        $stmt->execute();
        
        $clinicId = $conn->insert_id; // Grab the newly created clinic's ID
        $stmt->close();

        // 4. Handle Checkbox Medical Specialties
        if (isset($_POST['clinic_specialty']) && is_array($_POST['clinic_specialty'])) {
            $stmtSpec = $conn->prepare("INSERT INTO clinic_specialties (clinic_id, specialty_name) VALUES (?, ?)");
            foreach ($_POST['clinic_specialty'] as $specialty) {
                if ($specialty !== "Other") {
                    $stmtSpec->bind_param("is", $clinicId, $specialty);
                    $stmtSpec->execute();
                }
            }
            $stmtSpec->close();
        }

        // 5. Handle Dynamic "Other" Custom Specialties
        if (isset($_POST['clinic_specialty_other']) && is_array($_POST['clinic_specialty_other'])) {
            $stmtOtherSpec = $conn->prepare("INSERT INTO clinic_specialties (clinic_id, specialty_name) VALUES (?, ?)");
            foreach ($_POST['clinic_specialty_other'] as $customSpecialty) {
                $trimmed = trim($customSpecialty);
                if (!empty($trimmed)) {
                    $stmtOtherSpec->bind_param("is", $clinicId, $trimmed);
                    $stmtOtherSpec->execute();
                }
            }
            $stmtOtherSpec->close();
        }

        // 6. Handle Smart Operating Hours Scheduling
        $stmtSched = $conn->prepare("INSERT INTO clinic_schedules (clinic_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)");
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        if ($scheduleType === 'simple') {
            // Apply the same time settings across all 7 days
            $simpleOpen  = !empty($_POST['simple_open_time']) ? $_POST['simple_open_time'] : null;
            $simpleClose = !empty($_POST['simple_close_time']) ? $_POST['simple_close_time'] : null;
            $isClosed = ($simpleOpen === null || $simpleClose === null) ? 1 : 0;

            foreach ($days as $day) {
                $stmtSched->bind_param("isssi", $clinicId, $day, $simpleOpen, $simpleClose, $isClosed);
                $stmtSched->execute();
            }
        } else {
            // Process the custom input rows for each day individually
            $dayPrefixes = [
                'Monday'    => 'mon',
                'Tuesday'   => 'tue',
                'Wednesday' => 'wed',
                'Thursday'  => 'thu',
                'Friday'    => 'fri',
                'Saturday'  => 'sat',
                'Sunday'    => 'sun'
            ];

            foreach ($dayPrefixes as $fullDayName => $prefix) {
                $closedCheckbox = isset($_POST[$prefix . '_closed']) ? 1 : 0;
                
                if ($closedCheckbox == 1) {
                    $openTime = null;
                    $closeTime = null;
                } else {
                    $openTime  = !empty($_POST[$prefix . '_open']) ? $_POST[$prefix . '_open'] : null;
                    $closeTime = !empty($_POST[$prefix . '_close']) ? $_POST[$prefix . '_close'] : null;
                    // If no times provided, treat as closed fallback
                    if ($openTime === null || $closeTime === null) {
                        $closedCheckbox = 1;
                    }
                }

                $stmtSched->bind_param("isssi", $clinicId, $fullDayName, $openTime, $closeTime, $closedCheckbox);
                $stmtSched->execute();
            }
        }
        $stmtSched->close();

        // Commit transaction if no execution errors occurred
        $conn->commit();
        
        echo "<script>
                alert('Clinic Profile Registered Successfully! Proceeding to login.');
                window.location.href = 'registration.html';
              </script>";

    } catch (Exception $e) {
        $conn->rollback(); // Cancel inputs if a process failed
        if ($conn->errno == 1062) {
            echo "Error: This account email address is already registered. <a href='registration.html'>Go back</a>";
        } else {
            echo "Clinic Registration Failed: " . $e->getMessage();
        }
    }

    $conn->close();
} else {
    header("Location: registration.html");
    exit();
}
?>