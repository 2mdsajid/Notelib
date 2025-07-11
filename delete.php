<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get the JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['imageUrl']) || empty($input['imageUrl'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Image URL is required']);
    exit();
}

$imageUrl = $input['imageUrl'];

// Extract filename from URL
// Expecting URL format: https://notelibraryapp.com/uploads/community/filename.ext
$urlParts = parse_url($imageUrl);
if (!$urlParts || !isset($urlParts['path'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid image URL']);
    exit();
}

$path = $urlParts['path'];
$filename = basename($path);

// Security check: only allow deletion of files in the community uploads directory
if (!preg_match('/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i', $filename)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid filename format']);
    exit();
}

// Define the upload directory
$uploadDir = 'uploads/community/';
$filePath = $uploadDir . $filename;

// Check if file exists
if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'File not found']);
    exit();
}

// Additional security check: ensure the file is actually in the uploads/community directory
$realPath = realpath($filePath);
$realUploadDir = realpath($uploadDir);

if (!$realPath || !$realUploadDir || strpos($realPath, $realUploadDir) !== 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid file path']);
    exit();
}

// Attempt to delete the file
if (unlink($filePath)) {
    echo json_encode([
        'success' => true,
        'message' => 'Image deleted successfully',
        'filename' => $filename
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to delete file'
    ]);
}
?>
