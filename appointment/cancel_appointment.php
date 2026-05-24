<?php
session_start();
header('Content-Type: application/json');

// Security Check: Only logged-in patients can do this
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'patient') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

require '../registration/db_connect.php';

$patient_id = $_SESSION['user_id'];
$appointment_id = $_POST['appointment_id'] ?? '';

if (empty($appointment_id)) {
    echo json_encode(['success' => false, 'message' => 'No appointment selected.']);
    exit();
}

// UPDATE query: We change the status to 'Cancelled'
// Crucial Security: We include "AND patient_id = ?" so they can ONLY cancel their own records
$sql = "UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ? AND patient_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $appointment_id, $patient_id);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Appointment cancelled successfully.']);
} else {
    // If affected_rows is 0, it means the ID didn't match or was already cancelled
    echo json_encode(['success' => false, 'message' => 'Could not cancel. Appointment may not exist or has already been updated.']);
}

$stmt->close();
$conn->close();
?>