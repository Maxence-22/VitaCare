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

if (!$user || !in_array($user['role'], ['admin', 'intervenant'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$activite_id = intval($data['activite_id'] ?? 0);
$client_id   = intval($data['client_id'] ?? 0);

if (!$activite_id || !$client_id) {
    echo json_encode(['success' => false, 'message' => 'Données manquantes.']);
    exit;
}

// vérifier que l'activité existe
$stmt = $pdo->prepare('SELECT * FROM activites WHERE id = ?');
$stmt->execute([$activite_id]);
$activite = $stmt->fetch();

if (!$activite) {
    echo json_encode(['success' => false, 'message' => 'Activité introuvable.']);
    exit;
}

// vérifier les places restantes
$stmt = $pdo->prepare('
    SELECT COUNT(*) AS nb FROM inscriptions
    WHERE activite_id = ? AND statut IN ("en_attente", "confirmee")
');
$stmt->execute([$activite_id]);
$count = $stmt->fetch();

if ($count['nb'] >= $activite['places_max']) {
    echo json_encode(['success' => false, 'message' => 'Cette activité est complète.']);
    exit;
}

// vérifier que l'utilisateur n'est pas déjà inscrit
$stmt = $pdo->prepare('
    SELECT id, statut FROM inscriptions
    WHERE client_id = ? AND activite_id = ?
');
$stmt->execute([$client_id, $activite_id]);
$existing = $stmt->fetch();

if ($existing) {
    if ($existing['statut'] !== 'annulee') {
        echo json_encode(['success' => false, 'message' => 'Cet utilisateur est déjà inscrit.']);
        exit;
    }
    // réactiver une inscription annulée
    $stmt = $pdo->prepare('UPDATE inscriptions SET statut = "confirmee" WHERE id = ?');
    $stmt->execute([$existing['id']]);
} else {
    // nouvelle inscription
    $stmt = $pdo->prepare('INSERT INTO inscriptions (client_id, activite_id, statut) VALUES (?, ?, "confirmee")');
    $stmt->execute([$client_id, $activite_id]);
}

// notifier le client
$stmt = $pdo->prepare('
    INSERT INTO notifications (user_id, titre, message, type)
    VALUES (?, "Inscription confirmée", ?, "inscription")
');
$stmt->execute([$client_id, 'Vous avez été inscrit à l\'activité : ' . $activite['titre'] . ' par un responsable.']);

echo json_encode(['success' => true, 'message' => 'Participant ajouté avec succès.']);
