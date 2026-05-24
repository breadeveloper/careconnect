<?php
session_start();
header('Content-Type: application/json');

require '../registration/db_connect.php';

$clinic_id = (int)($_POST['clinic_id'] ?? 0);
$date = $_POST['date'] ?? '';
$duration_minutes = (int)($_POST['duration'] ?? 30); 

if (empty($clinic_id) || empty($date) || empty($duration_minutes)) {
    echo json_encode(['success' => false, 'message' => 'Missing data.']);
    exit();
}

// 1. Figure out what day of the week the patient selected (e.g., 'Monday')
$day_of_week = date('l', strtotime($date));

// 2. Fetch operating hours using the EXACT column names, plus the 'is_closed' flag!
$sched_sql = "SELECT open_time, close_time, is_closed FROM clinic_schedules WHERE clinic_id = ? AND day_of_week = ?";
$stmt = $conn->prepare($sched_sql);

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'SQL Error: ' . $conn->error]);
    exit();
}

$stmt->bind_param("is", $clinic_id, $day_of_week);
$stmt->execute();
$sched_result = $stmt->get_result();

if ($sched_result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => "Clinic has no schedule set for {$day_of_week}s."]);
    exit();
}

$schedule = $sched_result->fetch_assoc();

// Check if the clinic explicitly marked this day as closed in the database
if ($schedule['is_closed'] == 1) {
    echo json_encode(['success' => false, 'message' => "Clinic is closed on {$day_of_week}s."]);
    exit();
}

// The math is now safely using 'open_time' and 'close_time'
$clinic_open = strtotime($date . ' ' . $schedule['open_time']);
$clinic_close = strtotime($date . ' ' . $schedule['close_time']);

// 3. Fetch existing appointments to prevent collisions
$appt_sql = "SELECT appointment_time, duration FROM appointments WHERE clinic_id = ? AND appointment_date = ? AND status IN ('Pending', 'Confirmed')";
$stmt_appt = $conn->prepare($appt_sql);

if (!$stmt_appt) {
    echo json_encode(['success' => false, 'message' => 'SQL Error: ' . $conn->error]);
    exit();
}

$stmt_appt->bind_param("is", $clinic_id, $date);
$stmt_appt->execute();
$appt_result = $stmt_appt->get_result();

$booked_slots = [];
while ($row = $appt_result->fetch_assoc()) {
    $start_stamp = strtotime($date . ' ' . $row['appointment_time']);
    $end_stamp = $start_stamp + ($row['duration'] * 60); 
    $booked_slots[] = ['start' => $start_stamp, 'end' => $end_stamp];
}

// 4. Generate available slots and run collision checks
$available_slots = [];
$current_time = $clinic_open;

while ($current_time + ($duration_minutes * 60) <= $clinic_close) {
    $slot_start = $current_time;
    $slot_end = $current_time + ($duration_minutes * 60);
    
    $collision = false;
    foreach ($booked_slots as $booked) {
        if ($slot_start < $booked['end'] && $booked['start'] < $slot_end) {
            $collision = true;
            break; 
        }
    }
    
    if (!$collision) {
        $available_slots[] = [
            'value' => date('H:i:s', $slot_start), 
            'display' => date('h:i A', $slot_start)
        ];
    }
    
    $current_time += ($duration_minutes * 60);
}

if (empty($available_slots)) {
    echo json_encode(['success' => false, 'message' => 'Fully booked on this date.']);
} else {
    echo json_encode(['success' => true, 'slots' => $available_slots]);
}

$stmt->close();
$stmt_appt->close();
$conn->close();
?>