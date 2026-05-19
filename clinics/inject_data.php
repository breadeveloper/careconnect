<?php
// Turn on error reporting for visibility
error_reporting(E_ALL);
ini_set('display_errors', 1);

require '../registration/db_connect.php';

// The generic password you requested, properly hashed!
$generic_password = "1234";
$hashed_password = password_hash($generic_password, PASSWORD_DEFAULT);

$mock_clinics = [
    [
        'email' => 'general@gmail.com', 'name' => 'Leoncio General Hospital',
        'contact' => '09171112222', 'barangay' => 'Barangay II', 'street' => 'Panotes Avenue',
        'lat' => 14.11530000, 'lng' => 122.95460000,
        'specialties' => ['General Practice', 'Emergency'],
        'open' => '00:00:00', 'close' => '23:59:00' // 24/7
    ],
    [
        'email' => 'provincial@gmail.com', 'name' => 'Camarines Norte Provincial Hospital',
        'contact' => '09182223333', 'barangay' => 'Bagasbas', 'street' => 'Bagasbas Road',
        'lat' => 14.12050000, 'lng' => 122.95820000,
        'specialties' => ['General Practice', 'Surgery'],
        'open' => '00:00:00', 'close' => '23:59:00' // 24/7
    ],
    [
        'email' => 'doctors@gmail.com', 'name' => 'Daet Doctors Hospital',
        'contact' => '09193334444', 'barangay' => 'Barangay IV', 'street' => 'Vinzons Avenue',
        'lat' => 14.11180000, 'lng' => 122.95050000,
        'specialties' => ['General Practice', 'Cardiology'],
        'open' => '00:00:00', 'close' => '23:59:00' // 24/7
    ],
    [
        'email' => 'dental@gmail.com', 'name' => 'SmileMakers Dental Clinic',
        'contact' => '09204445555', 'barangay' => 'Barangay III', 'street' => 'J. Lukban Street',
        'lat' => 14.11350000, 'lng' => 122.95650000,
        'specialties' => ['Dental', 'Orthodontics'],
        'open' => '08:00:00', 'close' => '17:00:00' // 8 to 5
    ],
    [
        'email' => 'pedia@gmail.com', 'name' => 'First Steps Pediatrics',
        'contact' => '09215556666', 'barangay' => 'Barangay I', 'street' => 'F. Pimentel Avenue',
        'lat' => 14.11650000, 'lng' => 122.95250000,
        'specialties' => ['Pediatrics'],
        'open' => '09:00:00', 'close' => '16:00:00' // 9 to 4
    ]
];

$days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

foreach ($mock_clinics as $clinic) {
    // 1. Insert the Clinic
    $stmt = $conn->prepare("INSERT INTO clinics (clinic_email, password_hash, clinic_name, clinic_contact, barangay, street, latitude, longitude, schedule_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'custom')");
    $stmt->bind_param("ssssssdd", $clinic['email'], $hashed_password, $clinic['name'], $clinic['contact'], $clinic['barangay'], $clinic['street'], $clinic['lat'], $clinic['lng']);
    
    if ($stmt->execute()) {
        $clinic_id = $stmt->insert_id;

        // 2. Insert Specialties
        foreach ($clinic['specialties'] as $spec) {
            $spec_stmt = $conn->prepare("INSERT INTO clinic_specialties (clinic_id, specialty_name) VALUES (?, ?)");
            $spec_stmt->bind_param("is", $clinic_id, $spec);
            $spec_stmt->execute();
        }

        // 3. Insert 7-Day Schedule
        foreach ($days_of_week as $day) {
            // For Dental/Pedia, let's close them on Sunday to make the data realistic
            $is_closed = ($day === 'Sunday' && $clinic['name'] !== 'Leoncio General Hospital' && $clinic['name'] !== 'Camarines Norte Provincial Hospital' && $clinic['name'] !== 'Daet Doctors Hospital') ? 1 : 0;
            
            $sched_stmt = $conn->prepare("INSERT INTO clinic_schedules (clinic_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)");
            $sched_stmt->bind_param("isssi", $clinic_id, $day, $clinic['open'], $clinic['close'], $is_closed);
            $sched_stmt->execute();
        }
        echo "Successfully injected: " . $clinic['name'] . "<br>";
    } else {
        echo "Error inserting " . $clinic['name'] . ": " . $stmt->error . "<br>";
    }
}

echo "<br><b>All mock data injected! You can now delete this file.</b>";
$conn->close();
?>