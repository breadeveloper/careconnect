<?php
// infinityfree database connection details
$servername = "sql213.infinityfree.com";
$username = "if0_42006534";
$password = "SXPrVFawIVcuqC"; 
$dbname = "if0_42006534_careconnect_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Database Connection Failed: " . $conn->connect_error);
}
?>  