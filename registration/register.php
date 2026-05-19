<?php
// 1. Include the database connection
require 'db_connect.php';

// 2. Check if the form was actually submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Catch standard fields
    $fullName = $_POST['full_name'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirm_password'];
    
    // Address fields
    $province = $_POST['province'];
    $town = $_POST['town'];
    $barangay = $_POST['barangay'];
    $street = $_POST['street'];
    
    // Other details
    $dob = $_POST['dob'];
    $age = $_POST['age'];
    $sex = $_POST['sex'];
    $contact = $_POST['contact_number'];

    // 3. Security: Check if passwords match
    if ($password !== $confirmPassword) {
        die("Error: Passwords do not match. <a href='registration.html'>Go back</a>");
    }

    // 4. Security: Hash the password securely
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // --- START DATABASE TRANSACTION ---
    // We use a transaction so if the medical history fails, the whole thing rolls back cleanly
    $conn->begin_transaction();

    try {
        // 5. Insert into the main `patients` table using Prepared Statements (Prevents SQL Injection)
        $stmt = $conn->prepare("INSERT INTO patients (full_name, email, password_hash, province, town, barangay, street, dob, age, sex, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssssssiss", $fullName, $email, $hashedPassword, $province, $town, $barangay, $street, $dob, $age, $sex, $contact);
        $stmt->execute();
        
        // Grab the ID of the patient we just created so we can link their medical history
        $patientId = $conn->insert_id;
        $stmt->close();

        // 6. Handle the Dynamic Medical History (Checkboxes)
        if (isset($_POST['medical_history']) && is_array($_POST['medical_history'])) {
            $stmtHist = $conn->prepare("INSERT INTO patient_medical_history (patient_id, condition_name) VALUES (?, ?)");
            foreach ($_POST['medical_history'] as $condition) {
                // Ensure they didn't just check the dummy "Other" box
                if ($condition !== "Other") {
                    $stmtHist->bind_param("is", $patientId, $condition);
                    $stmtHist->execute();
                }
            }
            $stmtHist->close();
        }

        // 7. Handle the Dynamic "Other" Medical History (Text Inputs)
        if (isset($_POST['medical_history_other']) && is_array($_POST['medical_history_other'])) {
            $stmtOther = $conn->prepare("INSERT INTO patient_medical_history (patient_id, condition_name) VALUES (?, ?)");
            foreach ($_POST['medical_history_other'] as $otherCondition) {
                // Only insert if they actually typed something (not empty)
                $trimmedCondition = trim($otherCondition);
                if (!empty($trimmedCondition)) {
                    $stmtOther->bind_param("is", $patientId, $trimmedCondition);
                    $stmtOther->execute();
                }
            }
            $stmtOther->close();
        }

        // Everything worked! Commit to the database.
        $conn->commit();
        
        // Success Message & Redirect back to login
        echo "<script>
                alert('Registration Successful! Please log in.');
                window.location.href = 'registration.html';
              </script>";

    } catch (Exception $e) {
        // If anything failed, undo the insertion
        $conn->rollback();
        // Simple error handling for duplicate emails
        if ($conn->errno == 1062) {
            echo "Error: That email is already registered. <a href='registration.html'>Go back</a>";
        } else {
            echo "Registration Failed: " . $e->getMessage();
        }
    }

    $conn->close();
} else {
    // If someone tries to access this file directly without submitting the form
    header("Location: registration.html");
    exit();
}
?>