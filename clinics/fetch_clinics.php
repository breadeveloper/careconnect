<?php
header('Content-Type: application/json; charset=utf-8');

try {
    // 1. Check if the connection file exists and loads
    require '../registration/db_connect.php';

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $clinics = [];
    
    // 2. Main Clinics Query
    $query = "SELECT clinic_id, clinic_name, clinic_contact, barangay, street, latitude, longitude FROM clinics";
    $result = $conn->query($query);

    if (!$result) {
        throw new Exception("Main Clinics Query Failed: " . $conn->error);
    }

    while($row = $result->fetch_assoc()) {
        $clinicId = $row['clinic_id'];

        // 3. Specialties Query
        $specialties = [];
        $specQuery = $conn->prepare("SELECT specialty_name FROM clinic_specialties WHERE clinic_id = ?");
        if (!$specQuery) {
            throw new Exception("Specialty Prepare Failed for Clinic ID $clinicId: " . $conn->error);
        }
        
        $specQuery->bind_param("i", $clinicId);
        $specQuery->execute();
        $specRes = $specQuery->get_result();
        while($specRow = $specRes->fetch_assoc()) {
            $specialties[] = $specRow['specialty_name'];
        }
        $row['specialties'] = $specialties;
        $specQuery->close();

        // 4. Schedules Query
        $schedules = [];
        $schedQuery = $conn->prepare("SELECT day_of_week, open_time, close_time, is_closed FROM clinic_schedules WHERE clinic_id = ? ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')");
        if (!$schedQuery) {
            throw new Exception("Schedule Prepare Failed for Clinic ID $clinicId: " . $conn->error);
        }
        
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

    // 5. Final Encode Check - Clean strings before encoding
    array_walk_recursive($clinics, function(&$value) {
        if (is_string($value)) {
            // This force-re-encodes the string to pure UTF-8, stripping bad characters
            $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
        }
    });

    $json_output = json_encode($clinics);
    
    if ($json_output === false) {
        throw new Exception("JSON Encode Failed: " . json_last_error_msg());
    }

    echo $json_output;

} catch (Throwable $e) {
    // If literally anything breaks above, it will be caught here and printed as valid JSON.
    echo json_encode([
        "success" => false,
        "error_caught" => true,
        "message" => $e->getMessage(),
        "file" => basename($e->getFile()),
        "line" => $e->getLine()
    ]);
}
?>