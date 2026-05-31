<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$pdo = getDB();

// vérifier que c'est un admin
$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

// on récupère toutes les stats en une fois
$stats = [];

$stats['total_reservations'] = $pdo->query('SELECT COUNT(*) FROM reservations')->fetchColumn();
$stats['reservations_en_attente'] = $pdo->query('SELECT COUNT(*) FROM reservations WHERE statut = "en_attente"')->fetchColumn();
$stats['total_clients'] = $pdo->query('SELECT COUNT(*) FROM users WHERE role = "client"')->fetchColumn();
$stats['total_activites'] = $pdo->query('SELECT COUNT(*) FROM activites WHERE statut != "annulee"')->fetchColumn();
$stats['total_services'] = $pdo->query('SELECT COUNT(*) FROM services WHERE actif = 1')->fetchColumn();
$stats['inscriptions_total'] = $pdo->query('SELECT COUNT(*) FROM inscriptions WHERE statut != "annulee"')->fetchColumn();

echo json_encode(['success' => true, 'stats' => $stats]);
