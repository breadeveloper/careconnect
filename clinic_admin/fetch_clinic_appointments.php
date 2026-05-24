<?php
session_start();
header('Content-Type: application/json');

// Security Check: Only logged-in clinics can access this data
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'clinic') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

require '../registration/db_connect.php';

$clinic_id = $_SESSION['user_id'];

// FIX: We are now pulling the actual 'full_name' column from your patients table!
$sql = "SELECT 
            a.appointment_id, 
            a.appointment_date, 
            a.appointment_time, 
            a.reason, 
            a.status,
            p.full_name AS patient_name,
            p.contact_number AS patient_contact,
            p.email AS patient_email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        WHERE a.clinic_id = ?
        ORDER BY 
            CASE WHEN a.status = 'Pending' THEN 1 ELSE 2 END, 
            a.appointment_date ASC, 
            a.appointment_time ASC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    // If the SQL fails to prepare, this will catch the error and send it to your console instead of crashing blindly
    echo json_encode(['success' => false, 'message' => 'SQL Error: ' . $conn->error]);
    exit();
}

$stmt->bind_param("i", $clinic_id);
$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
while ($row = $result->fetch_assoc()) {
    $appointments[] = $row;
}

echo json_encode(['success' => true, 'data' => $appointments]);

$stmt->close();
$conn->close();
?>