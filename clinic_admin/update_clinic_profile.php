<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'clinic') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

require '../registration/db_connect.php';

$clinic_id = $_SESSION['user_id'];
$clinic_contact = $_POST['clinic_contact'] ?? '';
$barangay = $_POST['barangay'] ?? '';
$street = $_POST['street'] ?? '';
// Handle coordinates (allowing them to be empty if they don't have them yet)
$latitude = !empty($_POST['latitude']) ? $_POST['latitude'] : null;
$longitude = !empty($_POST['longitude']) ? $_POST['longitude'] : null;

// Start Database Transaction
$conn->begin_transaction();

try {
    // 1. Update Core Clinic Info to match precise DB columns
    $sql_clinic = "UPDATE clinics SET clinic_contact=?, barangay=?, street=?, latitude=?, longitude=? WHERE clinic_id=?";
    $stmt = $conn->prepare($sql_clinic);
    $stmt->bind_param("sssssi", $clinic_contact, $barangay, $street, $latitude, $longitude, $clinic_id);
    $stmt->execute();
    $stmt->close();

    // 2. Wipe existing schedules
    $sql_del = "DELETE FROM clinic_schedules WHERE clinic_id=?";
    $stmt_del = $conn->prepare($sql_del);
    $stmt_del->bind_param("i", $clinic_id);
    $stmt_del->execute();
    $stmt_del->close();

    // 3. Insert new schedules based purely on the checkboxes
    $sql_insert = "INSERT INTO clinic_schedules (clinic_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)";
    $stmt_ins = $conn->prepare($sql_insert);

    if (isset($_POST['custom_days']) && is_array($_POST['custom_days'])) {
        foreach ($_POST['custom_days'] as $day) {
            $prefix = strtolower(substr($day, 0, 3)); 
            $open = $_POST[$prefix . '_open'] ?? '';
            $close = $_POST[$prefix . '_close'] ?? '';
            
            if (!empty($open) && !empty($close)) {
                $stmt_ins->bind_param("isss", $clinic_id, $day, $open, $close);
                $stmt_ins->execute();
            }
        }
    }
    
    $stmt_ins->close();

    // Commit Transaction!
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

$conn->close();
?>