<?php
/**
 * EduTechMoney Modular PHP API - Main Front Controller
 * Coordinates and dispatches incoming requests to modular OOP controllers.
 */

// ----------------------------------------------------
// CORS & HEADERS CONFIGURATION
// ----------------------------------------------------
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ----------------------------------------------------
// CONTROLLER AUTOLOAD / REQUIRE
// ----------------------------------------------------
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/AuthController.php';
require_once __DIR__ . '/StudentController.php';
require_once __DIR__ . '/POSController.php';
require_once __DIR__ . '/CollectoController.php';
require_once __DIR__ . '/LoansController.php';

// Instantiate core dependencies
$database = new Database();
$authController = new AuthController($database);
$studentController = new StudentController($database);
$posController = new POSController($database);
$collectoController = new CollectoController($database);
$loansController = new LoansController($database);

// ----------------------------------------------------
// ROBUST PATH RESOLUTION
// ----------------------------------------------------
$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($request_uri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// If running in PHP built-in server, return false to serve static assets directly
if (php_sapi_name() === 'cli-server' && file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
    return false;
}

// 1. Fallback to GET query parameter if specified (e.g. index.php?route=/api/parents)
if (isset($_GET['route'])) {
    $path = $_GET['route'];
}
// 2. Fallback to PATH_INFO (e.g. index.php/api/parents)
elseif (isset($_SERVER['PATH_INFO'])) {
    $path = $_SERVER['PATH_INFO'];
}

// Standardize path to ensure it starts with /api
if (strpos($path, '/api/') === false && $path !== '/api') {
    if (strpos($path, 'api') !== false) {
        $path = '/' . substr($path, strpos($path, 'api'));
    } else {
        // If requested like /skooldimeapi/parents, map it to /api/parents
        $parts = array_filter(explode('/', trim($path, '/')));
        if (count($parts) > 0) {
            // Strip index.php or skooldimeapi from prefix
            if ($parts[0] === 'skooldimeapi' || $parts[0] === 'index.php') {
                array_shift($parts);
            }
            if (count($parts) > 0 && $parts[0] === 'api') {
                array_shift($parts);
            }
            $path = '/api/' . implode('/', $parts);
        }
    }
} else {
    $path = substr($path, strpos($path, '/api'));
}

// ----------------------------------------------------
// ROUTING MAP
// ----------------------------------------------------
$routes = [
    'GET' => [
        '#^/api/health$#' => [$authController, 'health'],
        '#^/api/audit-logs$#' => [$authController, 'getAuditLogs'],
        '#^/api/schools$#' => [$studentController, 'getSchools'],
        '#^/api/vendors$#' => [$studentController, 'getVendors'],
        '#^/api/parents$#' => [$studentController, 'getParents'],
        '#^/api/students$#' => [$studentController, 'getStudents'],
        '#^/api/pos/scan/(?P<qrHash>[^/]+)$#' => [$posController, 'scan'],
        '#^/api/pos/catalog/(?P<vendorId>[^/]+)$#' => [$posController, 'getCatalog'],
        '#^/api/collecto/status/(?P<transactionId>[^/]+)$#' => [$collectoController, 'checkDepositStatus'],
        '#^/api/loans/products$#' => [$loansController, 'getProducts'],
        '#^/api/loans/my-loans/(?P<borrowerId>[^/]+)$#' => [$loansController, 'getMyLoans'],
        '#^/api/loans/score/(?P<borrowerId>[^/]+)/(?P<role>[^/]+)$#' => [$loansController, 'getCreditScore'],
        '#^/api/pos/payment-status/(?P<refCode>[^/]+)$#' => [$posController, 'getPaymentStatus'],
    ],
    'POST' => [
        '#^/api/auth/login$#' => [$authController, 'login'],
        '#^/api/setup/reset$#' => [$authController, 'resetDb'],
        '#^/api/students/bulk-upload$#' => [$studentController, 'bulkUpload'],
        '#^/api/students/reset-pin$#' => [$studentController, 'resetPin'],
        '#^/api/students/limit$#' => [$studentController, 'setLimit'],
        '#^/api/parents/allocate$#' => [$studentController, 'allocatePocketMoney'],
        '#^/api/pos/checkout$#' => [$posController, 'checkout'],
        '#^/api/pos/refund$#' => [$posController, 'refund'],
        '#^/api/collecto/deposit$#' => [$collectoController, 'deposit'],
        '#^/api/collecto/withdraw$#' => [$collectoController, 'withdraw'],
        '#^/api/loans/apply$#' => [$loansController, 'apply'],
        '#^/api/loans/repay$#' => [$loansController, 'repay'],
        '#^/api/pos/generate-payment-qr$#' => [$posController, 'generatePaymentQr'],
        '#^/api/pos/complete-dynamic-payment$#' => [$posController, 'completeDynamicPayment'],
    ]
];

$matched = false;
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if (isset($routes[$method])) {
    foreach ($routes[$method] as $pattern => $callable) {
        if (preg_match($pattern, $path, $matches)) {
            $matched = true;
            // Filter out numeric indices from capture group matches
            $vars = array_filter($matches, function($key) {
                return !is_numeric($key);
            }, ARRAY_FILTER_USE_KEY);
            
            try {
                // Call the controller method with $vars and $input
                call_user_func($callable, $vars, $input);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;
        }
    }
}

if (!$matched) {
    http_response_code(404);
    echo json_encode([
        'success' => false, 
        'error' => 'API Route not matched or unsupported method: ' . $method . ' ' . $path,
        'info' => 'If you are hosting in a subfolder and get 404, check your URL rewriting configuration or use index.php/api/parents'
    ]);
}
