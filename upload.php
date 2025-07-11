<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Check if image was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'No image uploaded or upload error']);
    exit;
}

$file = $_FILES['image'];
$fileName = $file['name'];
$fileSize = $file['size'];
$fileTmpName = $file['tmp_name'];
$fileType = $file['type'];

// Validate file size (5MB max)
$maxSize = 5 * 1024 * 1024; // 5MB in bytes
if ($fileSize > $maxSize) {
    echo json_encode(['success' => false, 'error' => 'File size too large. Maximum 5MB allowed.']);
    exit;
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.']);
    exit;
}

// Get file extension
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Generate unique filename
$uniqueName = uniqid() . '_' . time() . '.' . $fileExtension;

// Define upload directory
$uploadDir = 'uploads/community/';

// Create directory if it doesn't exist
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode(['success' => false, 'error' => 'Failed to create upload directory']);
        exit;
    }
}

// Define full upload path
$uploadPath = $uploadDir . $uniqueName;

// Move uploaded file
if (move_uploaded_file($fileTmpName, $uploadPath)) {
    // Return success response with full URL
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    $fullUrl = $baseUrl . '/' . $uploadPath;
    
    echo json_encode([
        'success' => true,
        'url' => $fullUrl,
        'filename' => $uniqueName
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file']);
}
?>
