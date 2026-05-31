<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

// on récupère le JSON envoyé par React
$data = json_decode(file_get_contents('php://input'), true);

$nom        = trim($data['nom'] ?? '');
$prenom     = trim($data['prenom'] ?? '');
$email      = trim($data['email'] ?? '');
$mot_de_passe = $data['mot_de_passe'] ?? '';
$telephone  = trim($data['telephone'] ?? '');

// --- validations ---
if (!$nom || !$prenom || !$email || !$mot_de_passe) {
    echo json_encode(['success' => false, 'message' => 'Tous les champs obligatoires doivent être remplis.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Adresse email invalide.']);
    exit;
}

if (strlen($mot_de_passe) < 6) {
    echo json_encode(['success' => false, 'message' => 'Le mot de passe doit faire au moins 6 caractères.']);
    exit;
}

$pdo = getDB();

// vérifier si l'email est déjà utilisé
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
    exit;
}

// hasher le mot de passe
$hash = password_hash($mot_de_passe, PASSWORD_BCRYPT);

// insérer l'utilisateur
$stmt = $pdo->prepare('
    INSERT INTO users (nom, prenom, email, mot_de_passe, telephone)
    VALUES (?, ?, ?, ?, ?)
');
$stmt->execute([$nom, $prenom, $email, $hash, $telephone]);

echo json_encode(['success' => true, 'message' => 'Compte créé avec succès.']);
