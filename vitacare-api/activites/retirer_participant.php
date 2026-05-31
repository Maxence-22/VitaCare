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

// vérifier que l'inscription existe
$stmt = $pdo->prepare('
    SELECT i.id, a.titre FROM inscriptions i
    JOIN activites a ON i.activite_id = a.id
    WHERE i.client_id = ? AND i.activite_id = ? AND i.statut != "annulee"
');
$stmt->execute([$client_id, $activite_id]);
$inscription = $stmt->fetch();

if (!$inscription) {
    echo json_encode(['success' => false, 'message' => 'Inscription introuvable.']);
    exit;
}

// retirer le participant
$stmt = $pdo->prepare('UPDATE inscriptions SET statut = "annulee" WHERE id = ?');
$stmt->execute([$inscription['id']]);

// notifier le client
$stmt = $pdo->prepare('
    INSERT INTO notifications (user_id, titre, message, type)
    VALUES (?, "Désinscription effectuée", ?, "annulation")
');
$stmt->execute([$client_id, 'Vous avez été retiré de l\'activité : ' . $inscription['titre'] . ' par un responsable.']);

echo json_encode(['success' => true, 'message' => 'Participant retiré avec succès.']);
