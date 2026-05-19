<?php
// Start a secure session tracking system
session_start();
require 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $email = trim($_POST['login_email']);
    $password = $_POST['login_password'];

    // 1. Phase One: Query the Patient Table
    $patientQuery = $conn->prepare("SELECT patient_id, full_name, password_hash FROM patients WHERE email = ?");
    $patientQuery->bind_param("s", $email);
    $patientQuery->execute();
    $patientResult = $patientQuery->get_result();

    if ($patientResult->num_rows === 1) {
        $user = $patientResult->fetch_assoc();
        
        // Check encrypted hash match
        if (password_verify($password, $user['password_hash'])) {
            // Store operational tokens inside the global session system
            $_SESSION['user_id'] = $user['patient_id'];
            $_SESSION['user_name'] = $user['full_name'];
            $_SESSION['user_role'] = 'patient';

            echo "<script>
                    alert('Welcome back, " . htmlspecialchars($user['full_name']) . "!');
                    window.location.href = '../home/index.html';
                  </script>";
            exit();
        }
    }
    $patientQuery->close();

    // 2. Phase Two: Query the Clinic Table (Fallback Router)
    $clinicQuery = $conn->prepare("SELECT clinic_id, clinic_name, password_hash FROM clinics WHERE clinic_email = ?");
    $clinicQuery->bind_param("s", $email);
    $clinicQuery->execute();
    $clinicResult = $clinicQuery->get_result();

    if ($clinicResult->num_rows === 1) {
        $clinic = $clinicResult->fetch_assoc();
        
        // Check encrypted hash match
        if (password_verify($password, $clinic['password_hash'])) {
            $_SESSION['user_id'] = $clinic['clinic_id'];
            $_SESSION['user_name'] = $clinic['clinic_name'];
            $_SESSION['user_role'] = 'clinic';

            // You can route them directly to an administrative panel later!
            echo "<script>
                    alert('Connected to Clinic Dashboard: " . htmlspecialchars($clinic['clinic_name']) . "');
                    window.location.href = '../home/index.html';
                  </script>";
            exit();
        }
    }
    $clinicQuery->close();

    // 3. Fallback: If no checks match, issue a clean error state
    echo "<script>
            alert('Invalid email address or password combination.');
            window.location.href = 'registration.html';
          </script>";
    
    $conn->close();
} else {
    header("Location: registration.html");
    exit();
}
?>