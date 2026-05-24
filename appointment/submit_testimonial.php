<?php
session_start();
header('Content-Type: application/json');

// Security Check: Only logged-in patients should be posting testimonials
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'patient') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

require '../registration/db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $patient_name = trim($_POST['patient_name'] ?? '');
    $rating = intval($_POST['rating'] ?? 0);
    $comments = trim($_POST['comments'] ?? '');
    $submission_date = date('Y-m-d'); 

    if (empty($patient_name) || $rating < 1 || $rating > 5 || empty($comments)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required and rating must be between 1 and 5.']);
        exit();
    }

    try {
        $stmt = $conn->prepare("INSERT INTO testimonials (patient_name, rating, comments, submission_date) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("siss", $patient_name, $rating, $comments, $submission_date);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Testimonial saved successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database execution error: ' . $stmt->error]);
        }
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
    }
    
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
?>