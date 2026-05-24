<?php
session_start();
header('Content-Type: application/json');

// Security Check
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'patient') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require '../registration/db_connect.php';

$patient_id = $_SESSION['user_id'];

// SQL: Grab all new fields, and safely group the medical conditions using '||'
$sql = "SELECT p.full_name, p.email, p.dob, p.sex, p.contact_number, p.province, p.town, p.barangay, p.street,
               GROUP_CONCAT(h.condition_name SEPARATOR '||') AS medical_conditions
        FROM patients p
        LEFT JOIN patient_medical_history h ON p.patient_id = h.patient_id
        WHERE p.patient_id = ?
        GROUP BY p.patient_id";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $patient_id);
$stmt->execute();
$result = $stmt->get_result();

if ($data = $result->fetch_assoc()) {
    echo json_encode(['success' => true, 'data' => $data]);
} else {
    echo json_encode(['success' => false, 'message' => 'Profile not found.']);
}

$stmt->close();
$conn->close();
?>