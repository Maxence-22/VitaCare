<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Connectez-vous pour vous inscrire.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$activite_id = intval($data['activite_id'] ?? 0);

if (!$activite_id) {
    echo json_encode(['success' => false, 'message' => 'activite_id manquant.']);
    exit;
}

$pdo = getDB();
$client_id = $_SESSION['user_id'];

// vérifier que l'activité existe, est ouverte et dans le futur
$stmt = $pdo->prepare('
    SELECT * FROM activites
    WHERE id = ? AND statut = "ouverte" AND date_heure_debut > NOW()
');
$stmt->execute([$activite_id]);
$activite = $stmt->fetch();

if (!$activite) {
    echo json_encode(['success' => false, 'message' => 'Cette activité n\'est plus disponible.']);
    exit;
}

// vérifier la date limite d'inscription
if ($activite['date_limite_inscription'] && strtotime($activite['date_limite_inscription']) < time()) {
    echo json_encode(['success' => false, 'message' => 'Les inscriptions sont fermées pour cette activité.']);
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
    SELECT id FROM inscriptions
    WHERE client_id = ? AND activite_id = ? AND statut != "annulee"
');
$stmt->execute([$client_id, $activite_id]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Vous êtes déjà inscrit à cette activité.']);
    exit;
}

// créer l'inscription
$stmt = $pdo->prepare('INSERT INTO inscriptions (client_id, activite_id, statut) VALUES (?, ?, "confirmee")');
$stmt->execute([$client_id, $activite_id]);

// notification
$stmt = $pdo->prepare('
    INSERT INTO notifications (user_id, titre, message, type)
    VALUES (?, "Inscription confirmée", ?, "inscription")
');
$stmt->execute([$client_id, 'Vous êtes inscrit à l\'activité : ' . $activite['titre']]);

echo json_encode(['success' => true, 'message' => 'Inscription réussie !']);
