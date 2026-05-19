<?php
session_start();
header('Content-Type: application/json');

// Check if a patient session exists
if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'patient') {
    echo json_encode(["logged_in" => true]);
} else {
    echo json_encode(["logged_in" => false]);
}
?>