<?php
session_start();
header('Content-Type: application/json');

// 1. Security Check: Ensure a patient is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'patient') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

require '../registration/db_connect.php';

$patient_id = $_SESSION['user_id'];

// 2. Catch the incoming data from the Javascript FormData
$contact_number = $_POST['contact_number'] ?? '';
$province = $_POST['province'] ?? '';
$town = $_POST['town'] ?? '';
$barangay = $_POST['barangay'] ?? '';
$street = $_POST['street'] ?? '';

// --- START DATABASE TRANSACTION ---
// This ensures that if the medical history update fails, the main profile update is reversed, keeping data perfectly synced.
$conn->begin_transaction();

try {
    // PHASE 1: Update the Core Profile (Location & Contact Only)
    // Notice we do NOT update Name, Email, DOB, or Sex here for security purposes.
    $updateSql = "UPDATE patients 
                  SET contact_number = ?, province = ?, town = ?, barangay = ?, street = ? 
                  WHERE patient_id = ?";
    $stmt = $conn->prepare($updateSql);
    $stmt->bind_param("sssssi", $contact_number, $province, $town, $barangay, $street, $patient_id);
    $stmt->execute();
    $stmt->close();

    // PHASE 2: "Wipe and Replace" Medical History
    // First, delete all existing records for this specific patient
    $deleteSql = "DELETE FROM patient_medical_history WHERE patient_id = ?";
    $stmtDel = $conn->prepare($deleteSql);
    $stmtDel->bind_param("i", $patient_id);
    $stmtDel->execute();
    $stmtDel->close();

    // Next, re-insert the standard checkboxes (if they checked any)
    if (isset($_POST['medical_history']) && is_array($_POST['medical_history'])) {
        $insertHistSql = "INSERT INTO patient_medical_history (patient_id, condition_name) VALUES (?, ?)";
        $stmtHist = $conn->prepare($insertHistSql);
        
        foreach ($_POST['medical_history'] as $condition) {
            // We ignore the dummy "Other" checkbox value itself
            if ($condition !== "Other") {
                $stmtHist->bind_param("is", $patient_id, $condition);
                $stmtHist->execute();
            }
        }
        $stmtHist->close();
    }

    // Finally, re-insert the dynamic text fields (if they typed any)
    if (isset($_POST['medical_history_other']) && is_array($_POST['medical_history_other'])) {
        $insertOtherSql = "INSERT INTO patient_medical_history (patient_id, condition_name) VALUES (?, ?)";
        $stmtOther = $conn->prepare($insertOtherSql);
        
        foreach ($_POST['medical_history_other'] as $otherCondition) {
            $trimmedCondition = trim($otherCondition);
            // Only insert if the text box isn't empty
            if (!empty($trimmedCondition)) {
                $stmtOther->bind_param("is", $patient_id, $trimmedCondition);
                $stmtOther->execute();
            }
        }
        $stmtOther->close();
    }

    // PHASE 3: Commit the Transaction
    // Everything succeeded without errors! Make the changes permanent.
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);

} catch (Exception $e) {
    // If anything crashed, rollback the database to exactly how it was before they hit save.
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

$conn->close();
?>