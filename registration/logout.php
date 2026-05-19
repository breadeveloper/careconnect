<?php
session_start();

// Unset all session variables
$_SESSION = array();

// Destroy the session
session_destroy();

// Send them back to the newly reverted homepage
header("Location: ../home/index.html");
exit();
?>