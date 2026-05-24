<?php
session_start();
header('Content-Type: application/json');

// Security: Only logged-in clinics
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'clinic') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

require '../registration/db_connect.php';

$clinic_id = $_SESSION['user_id'];
$response_data = [];

// 1. Fetch Core Clinic Details
// (Assuming you added 'schedule_type' to your clinics table during registration. If not, you may need to add it!)
$sql_clinic = "SELECT * FROM clinics WHERE clinic_id = ?";
$stmt = $conn->prepare($sql_clinic);
$stmt->bind_param("i", $clinic_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $response_data = $row;
} else {
    echo json_encode(['success' => false, 'message' => 'Clinic record not found.']);
    exit();
}
$stmt->close();

// 2. Fetch the Schedule Array
$sql_schedules = "SELECT day_of_week, open_time, close_time FROM clinic_schedules WHERE clinic_id = ?";
$stmt_sch = $conn->prepare($sql_schedules);
$stmt_sch->bind_param("i", $clinic_id);
$stmt_sch->execute();
$result_sch = $stmt_sch->get_result();

$schedules = [];
while ($sch_row = $result_sch->fetch_assoc()) {
    $schedules[] = $sch_row;
}
$response_data['schedules'] = $schedules; // Attach schedules to the main payload

$stmt_sch->close();
$conn->close();

echo json_encode(['success' => true, 'data' => $response_data]);
?>