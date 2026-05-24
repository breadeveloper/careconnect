<?php
session_start();
header('Content-Type: application/json');

// Suppress direct HTML error echoing to maintain clean JSON formatting
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    require_once '../registration/db_connect.php';

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Session expired. Please log in again.']);
        exit();
    }

    $patient_id = $_SESSION['user_id'];
    $clinic_id = isset($_POST['clinic_id']) ? $_POST['clinic_id'] : '';
    $reason = isset($_POST['reason']) ? $_POST['reason'] : '';
    $date = isset($_POST['date']) ? $_POST['date'] : '';
    $duration = isset($_POST['duration']) ? $_POST['duration'] : '';
    $time = isset($_POST['time']) ? $_POST['time'] : ''; 

    if (empty($clinic_id) || empty($reason) || empty($date) || empty($duration) || empty($time)) {
        echo json_encode(['success' => false, 'message' => 'All appointment fields are required.']);
        exit();
    }

    // 1. Verify patient exists using your exact schema columns: 'id', 'first_name', 'last_name', and 'email'
    $check_patient = $conn->prepare("SELECT patient_id, full_name, email FROM patients WHERE patient_id = ?");
    if (!$check_patient) {
        throw new Exception("Patients table query verification failed: " . $conn->error);
    }
    
    $check_patient->bind_param("i", $patient_id);
    $check_patient->execute();
    $res = $check_patient->get_result();

    if ($res->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Patient profile validation failed. Record missing.']);
        exit();
    }

    // Extract database fields and cleanly merge the name parts for EmailJS
    $patient_data = $res->fetch_assoc();
    $fetched_name = $patient_data['full_name'];  
    $fetched_email = $patient_data['email']; 

    // 2. Insert into your appointments table (Changed 'appointment_duration' to 'duration')
    $insert = $conn->prepare("INSERT INTO appointments (patient_id, clinic_id, reason, appointment_date, duration, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')");
    if (!$insert) {
        throw new Exception("Appointments table query verification failed: " . $conn->error);
    }

    $insert->bind_param("iissss", $patient_id, $clinic_id, $reason, $date, $duration, $time);

    if ($insert->execute()) {
        // Return clear parameters to match your frontend appointment.js requirements
        echo json_encode([
            'success' => true, 
            'message' => 'Appointment request submitted successfully!',
            'patient_name' => $fetched_name,
            'patient_email' => $fetched_email
        ]);
    } else {
        throw new Exception("Database constraint execution exception: " . $insert->error);
    }

} catch (Throwable $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Database/Backend Error: ' . $e->getMessage()
    ]);
}
?>