<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$reservation_id       = intval($data['reservation_id'] ?? 0);
$nouvelle_dispo_id    = intval($data['nouvelle_disponibilite_id'] ?? 0);

if (!$reservation_id || !$nouvelle_dispo_id) {
    echo json_encode(['success' => false, 'message' => 'Données manquantes.']);
    exit;
}

$pdo = getDB();

// vérifier que la réservation appartient à l'utilisateur connecté
$stmt = $pdo->prepare('
    SELECT r.*, d.service_id
    FROM reservations r
    JOIN disponibilites d ON r.disponibilite_id = d.id
    WHERE r.id = ? AND r.client_id = ?
');
$stmt->execute([$reservation_id, $_SESSION['user_id']]);
$reservation = $stmt->fetch();

if (!$reservation) {
    echo json_encode(['success' => false, 'message' => 'Réservation introuvable.']);
    exit;
}

if (in_array($reservation['statut'], ['annulee', 'refusee'])) {
    echo json_encode(['success' => false, 'message' => 'Impossible de modifier une réservation annulée ou refusée.']);
    exit;
}

// vérifier que le nouveau créneau est dans le futur et pour le même service
$stmt = $pdo->prepare('
    SELECT * FROM disponibilites
    WHERE id = ? AND service_id = ? AND date_heure_debut > NOW() AND statut != "annule"
');
$stmt->execute([$nouvelle_dispo_id, $reservation['service_id']]);
$nouvelle_dispo = $stmt->fetch();

if (!$nouvelle_dispo) {
    echo json_encode(['success' => false, 'message' => 'Ce créneau n\'est pas disponible.']);
    exit;
}

// vérifier qu'il reste de la place sur le nouveau créneau
$stmt = $pdo->prepare('
    SELECT COUNT(*) AS nb FROM reservations
    WHERE disponibilite_id = ? AND statut IN ("en_attente", "confirmee") AND id != ?
');
$stmt->execute([$nouvelle_dispo_id, $reservation_id]);
$count = $stmt->fetch();

if ($count['nb'] >= $nouvelle_dispo['places_max']) {
    echo json_encode(['success' => false, 'message' => 'Ce créneau est complet.']);
    exit;
}

// modifier la réservation
$stmt = $pdo->prepare('
    UPDATE reservations SET disponibilite_id = ?, statut = "en_attente", updated_at = NOW()
    WHERE id = ?
');
$stmt->execute([$nouvelle_dispo_id, $reservation_id]);

// notification
$stmt = $pdo->prepare('
    INSERT INTO notifications (user_id, titre, message, type)
    VALUES (?, "Réservation modifiée", "Votre réservation a été modifiée et est en attente de confirmation.", "modification")
');
$stmt->execute([$_SESSION['user_id']]);

echo json_encode(['success' => true, 'message' => 'Réservation modifiée avec succès.']);
