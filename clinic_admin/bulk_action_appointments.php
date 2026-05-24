<?php
session_start();
header('Content-Type: application/json');

// Security Check
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'clinic') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

require '../registration/db_connect.php';

$clinic_id = $_SESSION['user_id'];

// Receive the JSON payload from JavaScript
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';
$ids = $data['ids'] ?? [];

if (empty($ids) || !is_array($ids)) {
    echo json_encode(['success' => false, 'message' => 'No appointments selected.']);
    exit();
}

// Determine the correct SQL Query based on the requested action
$sql = "";
if ($action === 'approve') {
    $sql = "UPDATE appointments SET status = 'Confirmed' WHERE appointment_id = ? AND clinic_id = ?";
} elseif ($action === 'reject') {
    // FIX: The clinic now officially 'Rejects' the appointment
    $sql = "UPDATE appointments SET status = 'Rejected' WHERE appointment_id = ? AND clinic_id = ?";
} elseif ($action === 'delete') {
    $sql = "DELETE FROM appointments WHERE appointment_id = ? AND clinic_id = ?";
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action type.']);
    exit();
}

// Loop through the selected IDs and execute the query for each one safely
$stmt = $conn->prepare($sql);
$success_count = 0;

foreach ($ids as $appointment_id) {
    $stmt->bind_param("ii", $appointment_id, $clinic_id);
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        $success_count++;
    }
}

$stmt->close();
$conn->close();

if ($success_count > 0) {
    echo json_encode(['success' => true, 'message' => "Successfully processed $success_count records."]);
} else {
    // If 0 rows were affected, it means the IDs didn't match the clinic_id or were already deleted
    echo json_encode(['success' => false, 'message' => 'No changes made. Records may not exist or belong to another clinic.']);
}
?>