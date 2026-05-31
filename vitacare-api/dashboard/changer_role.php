<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$pdo = getDB();

$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$user_id = intval($data['user_id'] ?? 0);
$role    = $data['role'] ?? '';

if (!$user_id || !in_array($role, ['client', 'intervenant', 'admin'])) {
    echo json_encode(['success' => false, 'message' => 'Données invalides.']);
    exit;
}

// on ne peut pas se retirer le rôle admin à soi-même
if ($user_id === $_SESSION['user_id']) {
    echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas modifier votre propre rôle.']);
    exit;
}

$stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
$stmt->execute([$role, $user_id]);

echo json_encode(['success' => true]);
