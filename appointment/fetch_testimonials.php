<?php
header('Content-Type: application/json');
require '../registration/db_connect.php';

try {
    $sql = "SELECT patient_name, rating, comments, submission_date FROM testimonials ORDER BY testimonial_id DESC LIMIT 10";
    $result = $conn->query($sql);
    
    $testimonials = [];
    while ($row = $result->fetch_assoc()) {
        $dateObj = new DateTime($row['submission_date']);
        $row['formatted_date'] = $dateObj->format('M j, Y');
        $testimonials[] = $row;
    }
    
    echo json_encode(['success' => true, 'data' => $testimonials]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}

$conn->close();
?>