<?php
// Include your existing database connection (adjust path if needed)
require '../registration/db_connect.php';
header('Content-Type: application/json');

$clinics = [];
// 1. Fetch the main clinic profile
$query = "SELECT clinic_id, clinic_name, clinic_contact, barangay, street FROM clinics";
$result = $conn->query($query);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $clinicId = $row['clinic_id'];
        
        // 2. Fetch all specialties for this clinic
        $specialties = [];
        $specQuery = $conn->prepare("SELECT specialty_name FROM clinic_specialties WHERE clinic_id = ?");
        $specQuery->bind_param("i", $clinicId);
        $specQuery->execute();
        $specRes = $specQuery->get_result();
        while($specRow = $specRes->fetch_assoc()) {
            $specialties[] = $specRow['specialty_name'];
        }
        $row['specialties'] = $specialties;
        $specQuery->close();
        
        // 3. Fetch the 7-day schedule, ordered from Monday to Sunday
        $schedules = [];
        $schedQuery = $conn->prepare("SELECT day_of_week, open_time, close_time, is_closed FROM clinic_schedules WHERE clinic_id = ? ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')");
        $schedQuery->bind_param("i", $clinicId);
        $schedQuery->execute();
        $schedRes = $schedQuery->get_result();
        while($schedRow = $schedRes->fetch_assoc()) {
            $schedules[] = $schedRow;
        }
        $row['schedules'] = $schedules;
        $schedQuery->close();

        $clinics[] = $row;
    }
}

echo json_encode($clinics);
$conn->close();
?>