<?php
session_start();
header('Content-Type: application/json');

// 1. Security Check: Make sure the user is actually logged in and is a patient!
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'patient') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in as a patient to book an appointment.']);
    exit();
}

// Include the database connection (adjusting the path to reach the registration folder)
require '../registration/db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 2. Gather the data
    $patient_id = $_SESSION['user_id']; 
    $clinic_id = $_POST['clinic_id'];
    $reason = $_POST['reason'];
    $date = $_POST['date'];
    $time = $_POST['time'];

    // 3. Basic Validation
    if (empty($clinic_id) || empty($reason) || empty($date) || empty($time)) {
        echo json_encode(['success' => false, 'message' => 'Error: All fields are required.']);
        exit();
    }

    try {
        // 4. The SQL Insert Command
        // We hardcode 'Pending' here so a patient cannot accidentally force a 'Confirmed' status
        $stmt = $conn->prepare("INSERT INTO appointments (patient_id, clinic_id, reason, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, 'Pending')");
        
        // "iisss" = Integer, Integer, String, String, String
        $stmt->bind_param("iisss", $patient_id, $clinic_id, $reason, $date, $time);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Appointment request submitted successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
        }
        $stmt->close();
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'System Error: ' . $e->getMessage()]);
    }

    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
?>