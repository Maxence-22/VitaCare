<?php
require_once '../config/cors.php';

session_start();
session_destroy();

echo json_encode(['success' => true]);
