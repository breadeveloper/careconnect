<?php
session_start();

// FORCE XAMPP TO SHOW THE ERROR DIRECTLY TO THE SCREEN
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Adjust this path if your file is named db_connect.php or is in a different folder!
require_once '../registration/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    die("Error: No active session found. Please log in.");
}

$patient_id = $_SESSION['user_id'];

$query = "SELECT a.*, c.clinic_name 
          FROM appointments a
          JOIN clinics c ON a.clinic_id = c.clinic_id
          WHERE a.patient_id = ? 
          ORDER BY a.appointment_date ASC";

$stmt = $conn->prepare($query);
if (!$stmt) {
    die("Database Query Structure Error: " . $conn->error);
}

$stmt->bind_param("i", $patient_id);
$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
while ($row = $result->fetch_assoc()) {
    $appointments[] = $row;
}

header('Content-Type: application/json');
echo json_encode(['success' => true, 'data' => $appointments]);
?>