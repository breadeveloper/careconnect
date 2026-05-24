<?php
session_start();
header('Content-Type: application/json');

// Check if a user is currently logged in
if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => true,
        'user_role' => $_SESSION['user_role'] // Tells us if it's a patient or clinic
    ]);
} else {
    // No active session
    echo json_encode(['logged_in' => false]);
}
?>