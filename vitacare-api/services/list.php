<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

$pdo = getDB();

// on joint la table users pour récupérer le nom de l'intervenant
$stmt = $pdo->query('
    SELECT s.*, u.nom AS intervenant_nom, u.prenom AS intervenant_prenom
    FROM services s
    LEFT JOIN users u ON s.intervenant_id = u.id
    WHERE s.actif = 1
    ORDER BY s.titre ASC
');

$services = $stmt->fetchAll();

echo json_encode(['success' => true, 'services' => $services]);
