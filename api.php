<?php
/**
 * EduTechMoney - Plain PHP API (No Frameworks, Standard Zero-Dependency Vanilla PHP)
 * Designed for offline & local server deployment with simple json file storage.
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

define('DB_FILE', __DIR__ . '/db.json');

// Initialize template backup for easy reset
if (!file_exists(__DIR__ . '/db.template.json') && file_exists(DB_FILE)) {
    copy(DB_FILE, __DIR__ . '/db.template.json');
}

// ----------------------------------------------------
// UTILITY & DATABASE HELPERS
// ----------------------------------------------------
function load_db() {
    if (!file_exists(DB_FILE)) {
        if (file_exists(__DIR__ . '/db.template.json')) {
            copy(__DIR__ . '/db.template.json', DB_FILE);
        } else {
            return [];
        }
    }
    $content = file_get_contents(DB_FILE);
    return json_decode($content, true) ?? [];
}

function save_db($data) {
    file_put_contents(DB_FILE, json_encode($data, JSON_PRETTY_PRINT));
}

function generate_ref($prefix) {
    return $prefix . '-' . strtoupper(substr(md5(uniqid()), 0, 8));
}

function audit($userId, $userName, $role, $action, $oldVal = null, $newVal = null) {
    $db = load_db();
    $newLog = [
        'id' => 'a_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid()), 0, 4),
        'userId' => $userId,
        'userName' => $userName,
        'role' => $role,
        'action' => $action,
        'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
        'oldValues' => $oldVal ? json_encode($oldVal) : null,
        'newValues' => $newVal ? json_encode($newVal) : null,
        'createdAt' => date('c')
    ];
    if (!isset($db['auditLogs'])) {
        $db['auditLogs'] = [];
    }
    array_unshift($db['auditLogs'], $newLog);
    if (count($db['auditLogs']) > 300) {
        array_pop($db['auditLogs']);
    }
    save_db($db);
}

// ----------------------------------------------------
// ROUTING ENGINE
// ----------------------------------------------------
$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($request_uri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// If running in PHP built-in server, return false to serve static assets directly
if (php_sapi_name() === 'cli-server' && file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
    return false;
}

// If sub-directory hosting, extract /api path prefix
if (strpos($path, '/api') !== false) {
    $path = substr($path, strpos($path, '/api'));
}

$routes = [
    'GET' => [
        '#^/api/health$#' => 'handle_health',
        '#^/api/audit-logs$#' => 'handle_get_audit_logs',
        '#^/api/schools$#' => 'handle_get_schools',
        '#^/api/vendors$#' => 'handle_get_vendors',
        '#^/api/parents$#' => 'handle_get_parents',
        '#^/api/students$#' => 'handle_get_students',
        '#^/api/pos/scan/(?P<qrHash>[^/]+)$#' => 'handle_pos_scan',
        '#^/api/pos/catalog/(?P<vendorId>[^/]+)$#' => 'handle_pos_catalog',
        '#^/api/collecto/status/(?P<transactionId>[^/]+)$#' => 'handle_collect_status',
        '#^/api/loans/products$#' => 'handle_loan_products',
        '#^/api/loans/my-loans/(?P<borrowerId>[^/]+)$#' => 'handle_my_loans',
        '#^/api/loans/score/(?P<borrowerId>[^/]+)/(?P<role>[^/]+)$#' => 'handle_loan_score',
        '#^/api/pos/payment-status/(?P<refCode>[^/]+)$#' => 'handle_pos_payment_status',
    ],
    'POST' => [
        '#^/api/auth/login$#' => 'handle_login',
        '#^/api/setup/reset$#' => 'handle_reset_db',
        '#^/api/students/bulk-upload$#' => 'handle_students_bulk_upload',
        '#^/api/students/reset-pin$#' => 'handle_students_reset_pin',
        '#^/api/students/limit$#' => 'handle_students_limit',
        '#^/api/parents/allocate$#' => 'handle_parents_allocate',
        '#^/api/pos/checkout$#' => 'handle_pos_checkout',
        '#^/api/pos/refund$#' => 'handle_pos_refund',
        '#^/api/collecto/deposit$#' => 'handle_collect_deposit',
        '#^/api/collecto/withdraw$#' => 'handle_collect_withdraw',
        '#^/api/loans/apply$#' => 'handle_loan_apply',
        '#^/api/loans/repay$#' => 'handle_loan_repay',
        '#^/api/pos/generate-payment-qr$#' => 'handle_pos_generate_payment_qr',
        '#^/api/pos/complete-dynamic-payment$#' => 'handle_pos_complete_dynamic_payment',
    ]
];

$matched = false;
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if (isset($routes[$method])) {
    foreach ($routes[$method] as $pattern => $handler) {
        if (preg_match($pattern, $path, $matches)) {
            $matched = true;
            // Filter numerical indices out of matches
            $vars = array_filter($matches, function($key) {
                return !is_numeric($key);
            }, ARRAY_FILTER_USE_KEY);
            
            try {
                $handler($vars, $input);
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
    echo json_encode(['success' => false, 'error' => 'API Route not matched or unsupported method: ' . $method . ' ' . $path]);
}

// ----------------------------------------------------
// CONTROLLERS IMPLEMENTATION
// ----------------------------------------------------

function handle_health() {
    echo json_encode([
        'status' => 'healthy',
        'platform' => 'EduTechMoney',
        'timestamp' => date('c')
    ]);
}

function handle_login($vars, $input) {
    $db = load_db();
    $username = $input['username'] ?? '';
    $found = null;
    if (isset($db['users']) && is_array($db['users'])) {
        foreach ($db['users'] as $u) {
            if (($u['username'] ?? '') === $username) {
                $found = $u;
                break;
            }
        }
    }
    if ($found) {
        echo json_encode(['success' => true, 'user' => $found]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid username or password.']);
    }
}

function handle_get_audit_logs() {
    $db = load_db();
    echo json_encode($db['auditLogs'] ?? []);
}

function handle_reset_db() {
    if (file_exists(__DIR__ . '/db.template.json')) {
        copy(__DIR__ . '/db.template.json', DB_FILE);
        audit('SYSTEM', 'System Daemon', 'SUPER_ADMIN', 'DATABASE_HARD_RESET');
        echo json_encode(['success' => true, 'message' => 'Database reset to default template state.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database template backup not found.']);
    }
}

function handle_get_schools() {
    $db = load_db();
    echo json_encode($db['schools'] ?? []);
}

function handle_get_vendors() {
    $db = load_db();
    echo json_encode($db['vendors'] ?? []);
}

function handle_get_parents() {
    $db = load_db();
    echo json_encode($db['parents'] ?? []);
}

function handle_get_students() {
    $db = load_db();
    echo json_encode($db['students'] ?? []);
}

function handle_students_bulk_upload($vars, $input) {
    $db = load_db();
    $rows = $input['rows'] ?? null;
    $agentId = $input['agentId'] ?? 'AGENT';
    $agentName = $input['agentName'] ?? 'Field Agent';

    if (!is_array($rows)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid CSV list payload.']);
        return;
    }

    $addedStudents = [];
    $updatedCount = 0;
    $addedCount = 0;

    if (!isset($db['parents'])) $db['parents'] = [];
    if (!isset($db['wallets'])) $db['wallets'] = [];
    if (!isset($db['students'])) $db['students'] = [];

    foreach ($rows as $row) {
        $schoolId = $row['schoolId'] ?? '';
        $admissionNo = $row['admissionNo'] ?? '';
        $name = $row['name'] ?? '';
        $className = $row['class'] ?? 'Unassigned';
        $parentName = $row['parentName'] ?? 'Unknown Guardian';
        $parentPhone = $row['parentPhone'] ?? '';
        $parentNin = $row['parentNin'] ?? '';

        if (empty($schoolId) || empty($admissionNo) || empty($name) || empty($parentPhone)) {
            continue;
        }

        $parentIdx = -1;
        foreach ($db['parents'] as $idx => $p) {
            if ($p['phone'] === $parentPhone) {
                $parentIdx = $idx;
                break;
            }
        }

        if ($parentIdx === -1) {
            $parentId = 'P_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid()), 0, 3);
            $newParent = [
                'id' => $parentId,
                'name' => $parentName,
                'phone' => $parentPhone,
                'nin' => $parentNin,
                'kycTier' => $parentNin ? 2 : 1,
                'walletBalance' => 0
            ];
            $db['parents'][] = $newParent;
            
            $db['wallets'][] = [
                'id' => 'W_' . $parentId,
                'ownerId' => $parentId,
                'ownerType' => 'PARENT',
                'balance' => 0,
                'status' => 'ACTIVE',
                'lastTransactionDate' => date('c')
            ];
            $addedCount++;
        } else {
            if (!empty($parentNin) && $parentNin !== $db['parents'][$parentIdx]['nin']) {
                $db['parents'][$parentIdx]['nin'] = $parentNin;
                $db['parents'][$parentIdx]['kycTier'] = 2;
                $updatedCount++;
            }
        }

        $studentIdx = -1;
        foreach ($db['students'] as $idx => $s) {
            if ($s['schoolId'] === $schoolId && $s['admissionNo'] === $admissionNo) {
                $studentIdx = $idx;
                break;
            }
        }

        if ($studentIdx === -1) {
            $studentId = 'ST_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid()), 0, 4);
            $newStudent = [
                'id' => $studentId,
                'schoolId' => $schoolId,
                'name' => $name,
                'admissionNo' => $admissionNo,
                'class' => $className,
                'qrHash' => 'ST_QR_' . strtoupper(substr(md5(uniqid()), 0, 6)),
                'pin' => '0000',
                'parentPhone' => $parentPhone,
                'isLinked' => true,
                'avatarUrl' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
                'noPinLimit' => 2000
            ];
            $db['students'][] = $newStudent;

            $db['wallets'][] = [
                'id' => 'W_' . $studentId,
                'ownerId' => $studentId,
                'ownerType' => 'STUDENT',
                'balance' => 0,
                'status' => 'ACTIVE',
                'lastTransactionDate' => date('c')
            ];
            $addedStudents[] = $newStudent;
        } else {
            $db['students'][$studentIdx]['name'] = $name;
            $db['students'][$studentIdx]['class'] = $className;
            $db['students'][$studentIdx]['parentPhone'] = $parentPhone;
        }
    }

    save_db($db);
    audit($agentId, $agentName, 'AGENT', 'BULK_CSV_STUDENT_IMPORT', null, ['addedStudentsCount' => count($addedStudents)]);

    echo json_encode([
        'success' => true,
        'message' => 'Bulk sync complete. Loaded parent structures. Processed ' . count($addedStudents) . ' new student entries.',
        'addedCount' => $addedCount,
        'updatedCount' => $updatedCount
    ]);
}

function handle_students_reset_pin($vars, $input) {
    $db = load_db();
    $studentId = $input['studentId'] ?? '';
    $newPin = $input['newPin'] ?? '';

    if (empty($studentId) || empty($newPin) || strlen($newPin) !== 4) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'PIN must be exactly 4 digits.']);
        return;
    }

    $foundIdx = -1;
    foreach ($db['students'] as $idx => $s) {
        if ($s['id'] === $studentId) {
            $foundIdx = $idx;
            break;
        }
    }

    if ($foundIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Student not found.']);
        return;
    }

    $studentName = $db['students'][$foundIdx]['name'];
    $db['students'][$foundIdx]['pin'] = $newPin;
    save_db($db);

    audit('PARENT', 'Parent linked to ' . $studentName, 'PARENT', 'RESET_STUDENT_PIN', ['student' => $studentName, 'oldPin' => '****'], ['newPin' => '****']);
    echo json_encode(['success' => true, 'message' => 'PIN reset successfully. SMS notifications sent to ' . $db['students'][$foundIdx]['parentPhone'] . '.']);
}

function handle_students_limit($vars, $input) {
    $db = load_db();
    $studentId = $input['studentId'] ?? '';
    $limit = $input['limit'] ?? 0;

    $foundIdx = -1;
    foreach ($db['students'] as $idx => $s) {
        if ($s['id'] === $studentId) {
            $foundIdx = $idx;
            break;
        }
    }

    if ($foundIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Student not found.']);
        return;
    }

    $oldLimit = $db['students'][$foundIdx]['noPinLimit'];
    $db['students'][$foundIdx]['noPinLimit'] = (int)$limit;
    save_db($db);

    audit('PARENT', 'Parent', 'PARENT', 'SET_STUDENT_SPEND_LIMIT', ['name' => $db['students'][$foundIdx]['name'], 'oldLimit' => $oldLimit], ['newLimit' => $limit]);
    echo json_encode(['success' => true, 'message' => 'Pocket money transaction limit updated to ' . number_format($limit) . ' UGX.']);
}

function handle_parents_allocate($vars, $input) {
    $db = load_db();
    $parentPhone = $input['parentPhone'] ?? '';
    $studentId = $input['studentId'] ?? '';
    $amount = (int)($input['amount'] ?? 0);

    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Allocation amount must be greater than zero.']);
        return;
    }

    $parent = null;
    foreach ($db['parents'] as $p) {
        if ($p['phone'] === $parentPhone) {
            $parent = $p;
            break;
        }
    }

    $student = null;
    foreach ($db['students'] as $s) {
        if ($s['id'] === $studentId) {
            $student = $s;
            break;
        }
    }

    if (!$parent || !$student) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Parent or Student index not found.']);
        return;
    }

    $parentWalletIdx = -1;
    $studentWalletIdx = -1;
    foreach ($db['wallets'] as $idx => $w) {
        if ($w['ownerId'] === $parent['id'] && $w['ownerType'] === 'PARENT') {
            $parentWalletIdx = $idx;
        }
        if ($w['ownerId'] === $student['id'] && $w['ownerType'] === 'STUDENT') {
            $studentWalletIdx = $idx;
        }
    }

    if ($parentWalletIdx === -1 || $studentWalletIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Ledger wallets missing.']);
        return;
    }

    if ($db['wallets'][$parentWalletIdx]['balance'] < $amount) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Insufficient Parent wallet balance. Please Top Up.']);
        return;
    }

    $db['wallets'][$parentWalletIdx]['balance'] -= $amount;
    $db['wallets'][$studentWalletIdx]['balance'] += $amount;
    $db['wallets'][$parentWalletIdx]['lastTransactionDate'] = date('c');
    $db['wallets'][$studentWalletIdx]['lastTransactionDate'] = date('c');

    $refCode = generate_ref('TXN');
    $db['transactions'][] = [
        'id' => 'tx_' . round(microtime(true) * 1000),
        'referenceCode' => $refCode,
        'senderWalletId' => $db['wallets'][$parentWalletIdx]['id'],
        'receiverWalletId' => $db['wallets'][$studentWalletIdx]['id'],
        'amount' => $amount,
        'fee' => 0,
        'type' => 'DEPOSIT',
        'status' => 'SUCCESS',
        'description' => 'Pocket Money Allocated to ' . $student['name'],
        'createdAt' => date('c')
    ];

    save_db($db);
    audit('PARENT', $parent['name'], 'PARENT', 'ALLOCATE_POCKET_MONEY', null, ['student' => $student['name'], 'amount' => $amount]);

    echo json_encode(['success' => true, 'message' => 'Transferred ' . number_format($amount) . ' UGX safely to ' . $student['name'] . '.']);
}

function handle_pos_scan($vars) {
    $db = load_db();
    $qrHash = $vars['qrHash'] ?? '';
    $student = null;
    foreach ($db['students'] as $s) {
        if ($s['qrHash'] === $qrHash) {
            $student = $s;
            break;
        }
    }

    if (!$student) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Unknown QR card. Student registry match failed.']);
        return;
    }

    $balance = 0;
    foreach ($db['wallets'] as $w) {
        if ($w['ownerId'] === $student['id'] && $w['ownerType'] === 'STUDENT') {
            $balance = $w['balance'];
            break;
        }
    }

    echo json_encode([
        'success' => true,
        'student' => [
            'id' => $student['id'],
            'name' => $student['name'],
            'class' => $student['class'],
            'avatarUrl' => $student['avatarUrl'],
            'noPinLimit' => $student['noPinLimit'],
            'balance' => $balance
        ]
    ]);
}

function handle_pos_checkout($vars, $input) {
    $db = load_db();
    $studentId = $input['studentId'] ?? '';
    $vendorId = $input['vendorId'] ?? '';
    $items = $input['items'] ?? [];
    $total = (int)($input['total'] ?? 0);
    $pin = $input['pin'] ?? '';

    $student = null;
    foreach ($db['students'] as $s) {
        if ($s['id'] === $studentId) {
            $student = $s;
            break;
        }
    }

    $vendor = null;
    foreach ($db['vendors'] as $v) {
        if ($v['id'] === $vendorId) {
            $vendor = $v;
            break;
        }
    }

    if (!$student || !$vendor) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Required merchant or student nodes not found.']);
        return;
    }

    $studentWalletIdx = -1;
    $vendorWalletIdx = -1;
    $platformWalletIdx = -1;

    foreach ($db['wallets'] as $idx => $w) {
        if ($w['ownerId'] === $student['id'] && $w['ownerType'] === 'STUDENT') {
            $studentWalletIdx = $idx;
        }
        if ($w['ownerId'] === $vendor['id'] && $w['ownerType'] === 'VENDOR') {
            $vendorWalletIdx = $idx;
        }
        if ($w['ownerType'] === 'PLATFORM') {
            $platformWalletIdx = $idx;
        }
    }

    $school = null;
    foreach ($db['schools'] as $s) {
        if ($s['id'] === $vendor['schoolId']) {
            $school = $s;
            break;
        }
    }

    $schoolWalletIdx = -1;
    if ($school) {
        foreach ($db['wallets'] as $idx => $w) {
            if ($w['ownerId'] === $school['id'] && $w['ownerType'] === 'SCHOOL') {
                $schoolWalletIdx = $idx;
                break;
            }
        }
    }

    if ($studentWalletIdx === -1 || $vendorWalletIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Transactional wallets missing.']);
        return;
    }

    if ($db['wallets'][$studentWalletIdx]['status'] !== 'ACTIVE') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Student wallet is inactive or suspended.']);
        return;
    }

    if ($db['wallets'][$studentWalletIdx]['balance'] < $total) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Insufficient pocket money balance. Card holds ' . number_format($db['wallets'][$studentWalletIdx]['balance']) . ' UGX.']);
        return;
    }

    // Pin Check
    if ($total > $student['noPinLimit']) {
        if (empty($pin)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'pinRequired' => true, 'error' => 'Transaction exceeds standard daily PIN-less limit. PIN required.']);
            return;
        }
        if ($student['pin'] !== $pin) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid Student PIN code. Transaction unauthorized.']);
            return;
        }
    }

    $schoolCommRate = $school ? $school['commissionRate'] : 1;
    $platformCommRate = 0.5;

    $schoolPart = (int)floor(($total * $schoolCommRate) / 100);
    $platformPart = (int)floor(($total * $platformCommRate) / 100);
    $vendorPart = $total - $schoolPart - $platformPart;

    $db['wallets'][$studentWalletIdx]['balance'] -= $total;
    $db['wallets'][$vendorWalletIdx]['balance'] += $vendorPart;

    if ($schoolWalletIdx !== -1 && $schoolPart > 0) {
        $db['wallets'][$schoolWalletIdx]['balance'] += $schoolPart;
        $db['wallets'][$schoolWalletIdx]['lastTransactionDate'] = date('c');
    }
    if ($platformWalletIdx !== -1 && $platformPart > 0) {
        $db['wallets'][$platformWalletIdx]['balance'] += $platformPart;
        $db['wallets'][$platformWalletIdx]['lastTransactionDate'] = date('c');
    }

    $db['wallets'][$studentWalletIdx]['lastTransactionDate'] = date('c');
    $db['wallets'][$vendorWalletIdx]['lastTransactionDate'] = date('c');

    // Manage catalog counters
    if (!isset($db['catalogItems'])) $db['catalogItems'] = [];
    foreach ($items as $it) {
        $catalogIdx = -1;
        foreach ($db['catalogItems'] as $idx => $c) {
            if ($c['vendorId'] === $vendorId && strtolower($c['name']) === strtolower($it['name'])) {
                $catalogIdx = $idx;
                break;
            }
        }

        if ($catalogIdx !== -1) {
            $db['catalogItems'][$catalogIdx]['usageCount'] += (int)($it['quantity'] ?? 1);
        } else {
            $db['catalogItems'][] = [
                'id' => 'c_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid()), 0, 3),
                'vendorId' => $vendorId,
                'name' => $it['name'],
                'price' => (int)$it['price'],
                'usageCount' => (int)($it['quantity'] ?? 1),
                'category' => 'FOOD'
            ];
        }
    }

    $refCode = generate_ref('TXN');
    if (!isset($db['transactions'])) $db['transactions'] = [];
    $db['transactions'][] = [
        'id' => 'tx_' . round(microtime(true) * 1000),
        'referenceCode' => $refCode,
        'senderWalletId' => $db['wallets'][$studentWalletIdx]['id'],
        'receiverWalletId' => $db['wallets'][$vendorWalletIdx]['id'],
        'amount' => $total,
        'fee' => $schoolPart + $platformPart,
        'type' => 'SPEND',
        'status' => 'SUCCESS',
        'description' => 'POS purchase at ' . $vendor['name'],
        'createdAt' => date('c')
    ];

    if ($platformPart > 0) {
        $db['transactions'][] = [
            'id' => 'tx_plat_' . round(microtime(true) * 1000),
            'referenceCode' => $refCode,
            'senderWalletId' => $db['wallets'][$studentWalletIdx]['id'],
            'receiverWalletId' => 'W_PLAT',
            'amount' => $platformPart,
            'fee' => 0,
            'type' => 'COMMISSION_SPLIT',
            'status' => 'SUCCESS',
            'description' => 'Platform 0.5% Commission share',
            'createdAt' => date('c')
        ];
    }

    if ($schoolWalletIdx !== -1 && $schoolPart > 0) {
        $db['transactions'][] = [
            'id' => 'tx_sch_' . round(microtime(true) * 1000),
            'referenceCode' => $refCode,
            'senderWalletId' => $db['wallets'][$studentWalletIdx]['id'],
            'receiverWalletId' => $db['wallets'][$schoolWalletIdx]['id'],
            'amount' => $schoolPart,
            'fee' => 0,
            'type' => 'COMMISSION_SPLIT',
            'status' => 'SUCCESS',
            'description' => 'School ' . $schoolCommRate . '% Commission share',
            'createdAt' => date('c')
        ];
    }

    save_db($db);
    audit('VENDOR', $vendor['name'], 'VENDOR', 'POS_SALE_COMPLETED', null, ['student' => $student['name'], 'total' => $total]);

    echo json_encode([
        'success' => true,
        'referenceCode' => $refCode,
        'message' => 'Payment completed successfully.',
        'newBalance' => $db['wallets'][$studentWalletIdx]['balance'],
        'vendorReceived' => $vendorPart
    ]);
}

function handle_pos_catalog($vars) {
    $db = load_db();
    $vendorId = $vars['vendorId'] ?? '';
    $items = [];
    if (isset($db['catalogItems']) && is_array($db['catalogItems'])) {
        foreach ($db['catalogItems'] as $c) {
            if (($c['vendorId'] ?? '') === $vendorId) {
                $items[] = $c;
            }
        }
    }
    usort($items, function($a, $b) {
        return ($b['usageCount'] ?? 0) - ($a['usageCount'] ?? 0);
    });
    echo json_encode($items);
}

function handle_pos_refund($vars, $input) {
    $db = load_db();
    $transactionId = $input['transactionId'] ?? '';
    $vendorPin = $input['vendorPin'] ?? '';
    $vendorId = $input['vendorId'] ?? '';

    $txnIdx = -1;
    if (isset($db['transactions']) && is_array($db['transactions'])) {
        foreach ($db['transactions'] as $idx => $t) {
            if (($t['id'] ?? '') === $transactionId || ($t['referenceCode'] ?? '') === $transactionId) {
                $txnIdx = $idx;
                break;
            }
        }
    }

    if ($txnIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Transaction record not found.']);
        return;
    }

    $txn = $db['transactions'][$txnIdx];
    $vendor = null;
    foreach ($db['vendors'] as $v) {
        if ($v['id'] === $vendorId) {
            $vendor = $v;
            break;
        }
    }

    if (!$vendor) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Merchant registry missing.']);
        return;
    }

    $created = strtotime($txn['createdAt'] ?? '');
    if ((time() - $created) > 86400) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Refund window exceeded. Transaction occurred > 24 hours ago.']);
        return;
    }

    if ($vendorPin !== '1234') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid Manager PIN code. Refund unauthorized.']);
        return;
    }

    $senderWalletIdx = -1;
    $receiverWalletIdx = -1;
    foreach ($db['wallets'] as $idx => $w) {
        if ($w['id'] === $txn['senderWalletId']) {
            $senderWalletIdx = $idx;
        }
        if ($w['id'] === $txn['receiverWalletId']) {
            $receiverWalletIdx = $idx;
        }
    }

    if ($senderWalletIdx === -1 || $receiverWalletIdx === -1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unable to locate ledger wallets associated with this refund.']);
        return;
    }

    $db['wallets'][$senderWalletIdx]['balance'] += $txn['amount'];
    $db['wallets'][$receiverWalletIdx]['balance'] -= ($txn['amount'] - ($txn['fee'] ?? 0));

    $db['transactions'][$txnIdx]['status'] = 'FAILED';

    $db['transactions'][] = [
        'id' => 'tx_ref_' . round(microtime(true) * 1000),
        'referenceCode' => generate_ref('REF'),
        'senderWalletId' => $db['wallets'][$receiverWalletIdx]['id'],
        'receiverWalletId' => $db['wallets'][$senderWalletIdx]['id'],
        'amount' => $txn['amount'],
        'fee' => 0,
        'type' => 'REFUND',
        'status' => 'SUCCESS',
        'description' => 'Refunded: Original ref ' . $txn['referenceCode'],
        'createdAt' => date('c')
    ];

    save_db($db);
    audit('VENDOR', $vendor['name'], 'VENDOR', 'POS_REFUND_EXECUTED', ['amount' => $txn['amount']], ['ref' => $txn['referenceCode']]);

    echo json_encode(['success' => true, 'message' => 'Transaction fully refunded to Student card ledger.']);
}

function handle_collect_deposit($vars, $input) {
    $db = load_db();
    $parentPhone = $input['parentPhone'] ?? '';
    $amount = (int)($input['amount'] ?? 0);

    $parent = null;
    foreach ($db['parents'] as $p) {
        if ($p['phone'] === $parentPhone) {
            $parent = $p;
            break;
        }
    }

    if (!$parent) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Parent wallet account not found.']);
        return;
    }

    $walletIdx = -1;
    foreach ($db['wallets'] as $idx => $w) {
        if ($w['ownerId'] === $parent['id'] && $w['ownerType'] === 'PARENT') {
            $walletIdx = $idx;
            break;
        }
    }

    if ($walletIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Wallet missing.']);
        return;
    }

    $txId = 'tx_col_' . round(microtime(true) * 1000);
    $refCode = generate_ref('COL-DEP');

    if (!isset($db['transactions'])) $db['transactions'] = [];
    $db['transactions'][] = [
        'id' => $txId,
        'referenceCode' => $refCode,
        'senderWalletId' => 'COLLECTO_GATEWAY',
        'receiverWalletId' => $db['wallets'][$walletIdx]['id'],
        'amount' => $amount,
        'fee' => 1000,
        'type' => 'DEPOSIT',
        'status' => 'PENDING',
        'description' => 'Pending Collecto MTN/Airtel STK Push',
        'createdAt' => date('c')
    ];

    save_db($db);
    audit('PARENT', $parent['name'], 'PARENT', 'COLLECTO_STK_PUSH_INITIATED', null, ['refCode' => $refCode, 'amount' => $amount]);

    echo json_encode([
        'success' => true,
        'transactionId' => $txId,
        'referenceCode' => $refCode,
        'message' => 'STK push sent to your mobile phone. Enter MTN/Airtel PIN to authorize.'
    ]);
}

function handle_collect_status($vars) {
    $db = load_db();
    $transactionId = $vars['transactionId'] ?? '';

    $txnIdx = -1;
    if (isset($db['transactions']) && is_array($db['transactions'])) {
        foreach ($db['transactions'] as $idx => $t) {
            if (($t['id'] ?? '') === $transactionId || ($t['referenceCode'] ?? '') === $transactionId) {
                $txnIdx = $idx;
                break;
            }
        }
    }

    if ($txnIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Transaction not found.']);
        return;
    }

    $txn = $db['transactions'][$txnIdx];

    if (($txn['status'] ?? '') === 'SUCCESS') {
        echo json_encode(['success' => true, 'status' => 'SUCCESS', 'transaction' => $txn]);
        return;
    }

    $created = strtotime($txn['createdAt'] ?? '');
    $elapsed = time() - $created;

    if ($elapsed > 3) {
        if (($txn['status'] ?? '') === 'PENDING') {
            $walletIdx = -1;
            foreach ($db['wallets'] as $idx => $w) {
                if ($w['id'] === $txn['receiverWalletId']) {
                    $walletIdx = $idx;
                    break;
                }
            }

            if ($walletIdx !== -1) {
                $db['wallets'][$walletIdx]['balance'] += $txn['amount'];
                $db['wallets'][$walletIdx]['lastTransactionDate'] = date('c');

                if ($db['wallets'][$walletIdx]['ownerType'] === 'PARENT') {
                    foreach ($db['parents'] as $idx => $p) {
                        if ($p['id'] === $db['wallets'][$walletIdx]['ownerId']) {
                            $db['parents'][$idx]['walletBalance'] = $db['wallets'][$walletIdx]['balance'];
                            break;
                        }
                    }
                }
            }

            $db['transactions'][$txnIdx]['status'] = 'SUCCESS';
            $db['transactions'][$txnIdx]['description'] = 'Collecto Mobile Money Deposit Approved';
            save_db($db);
            $txn = $db['transactions'][$txnIdx];
        }
        echo json_encode(['success' => true, 'status' => 'SUCCESS', 'transaction' => $txn]);
        return;
    }

    echo json_encode(['success' => true, 'status' => 'PENDING']);
}

function handle_collect_withdraw($vars, $input) {
    $db = load_db();
    $vendorId = $input['vendorId'] ?? '';
    $amount = (int)($input['amount'] ?? 0);
    $phone = $input['phone'] ?? '';

    $vendor = null;
    foreach ($db['vendors'] as $v) {
        if ($v['id'] === $vendorId) {
            $vendor = $v;
            break;
        }
    }

    if (!$vendor) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Vendor not registered.']);
        return;
    }

    $walletIdx = -1;
    foreach ($db['wallets'] as $idx => $w) {
        if ($w['ownerId'] === $vendorId && $w['ownerType'] === 'VENDOR') {
            $walletIdx = $idx;
            break;
        }
    }

    if ($walletIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Merchant wallet index missing.']);
        return;
    }

    if ($db['wallets'][$walletIdx]['balance'] < $amount) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Insufficient balance to withdraw requested funds.']);
        return;
    }

    $db['wallets'][$walletIdx]['balance'] -= $amount;
    $db['wallets'][$walletIdx]['lastTransactionDate'] = date('c');

    $txId = 'tx_col_w_' . round(microtime(true) * 1000);
    $refCode = generate_ref('COL-WIT');

    if (!isset($db['transactions'])) $db['transactions'] = [];
    $db['transactions'][] = [
        'id' => $txId,
        'referenceCode' => $refCode,
        'senderWalletId' => $db['wallets'][$walletIdx]['id'],
        'receiverWalletId' => 'COLLECTO_PAYOUT_GATEWAY',
        'amount' => $amount,
        'fee' => 1500,
        'type' => 'WITHDRAWAL',
        'status' => 'PENDING',
        'description' => 'Mobile Money Payout to ' . $phone,
        'createdAt' => date('c')
    ];

    save_db($db);
    audit('VENDOR', $vendor['name'], 'VENDOR', 'COLLECTO_WITHDRAW_INITIATED', null, ['refCode' => $refCode, 'amount' => $amount]);

    echo json_encode([
        'success' => true,
        'transactionId' => $txId,
        'referenceCode' => $refCode,
        'message' => 'Payout request processed. Pre-deduction of ' . number_format($amount) . ' UGX applied. Polling active.'
    ]);
}

function handle_loan_products() {
    $db = load_db();
    echo json_encode($db['loanProducts'] ?? []);
}

function handle_my_loans($vars) {
    $db = load_db();
    $borrowerId = $vars['borrowerId'] ?? '';
    $loans = [];
    if (isset($db['loans']) && is_array($db['loans'])) {
        foreach ($db['loans'] as $l) {
            if (($l['borrowerId'] ?? '') === $borrowerId) {
                $loans[] = $l;
            }
        }
    }
    echo json_encode($loans);
}

function handle_loan_score($vars) {
    $db = load_db();
    $borrowerId = $vars['borrowerId'] ?? '';
    $role = $vars['role'] ?? '';

    $scoreObj = null;
    if (isset($db['creditScores']) && is_array($db['creditScores'])) {
        foreach ($db['creditScores'] as $cs) {
            if (($cs['ownerId'] ?? '') === $borrowerId) {
                $scoreObj = $cs;
                break;
            }
        }
    }

    if (!$scoreObj) {
        $basicScore = ($role === 'VENDOR') ? 78 : (($role === 'STAFF') ? 85 : 62);
        $scoreObj = [
            'id' => 'cs_' . round(microtime(true) * 1000),
            'ownerId' => $borrowerId,
            'score' => $basicScore,
            'factors' => [
                'txCount30Days' => ($role === 'VENDOR') ? 120 : 0,
                'depositFrequency' => ($role === 'PARENT') ? 5 : 0,
                'repaymentHistory' => 'Standard automatic system profile assessment'
            ]
        ];
        if (!isset($db['creditScores'])) $db['creditScores'] = [];
        $db['creditScores'][] = $scoreObj;
        save_db($db);
    }

    echo json_encode($scoreObj);
}

function handle_loan_apply($vars, $input) {
    $db = load_db();
    $productId = $input['productId'] ?? '';
    $borrowerId = $input['borrowerId'] ?? '';
    $borrowerType = $input['borrowerType'] ?? '';
    $amount = (int)($input['amount'] ?? 0);

    $product = null;
    if (isset($db['loanProducts']) && is_array($db['loanProducts'])) {
        foreach ($db['loanProducts'] as $p) {
            if (($p['id'] ?? '') === $productId) {
                $product = $p;
                break;
            }
        }
    }

    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Selected loan product not recognized.']);
        return;
    }

    if ($amount < ($product['minAmount'] ?? 0) || $amount > ($product['maxAmount'] ?? 0)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid amount. Must range between ' . number_format($product['minAmount']) . ' - ' . number_format($product['maxAmount']) . ' UGX.']);
        return;
    }

    $hasActive = false;
    if (isset($db['loans']) && is_array($db['loans'])) {
        foreach ($db['loans'] as $l) {
            if (($l['borrowerId'] ?? '') === $borrowerId && ($l['status'] ?? '') === 'ACTIVE') {
                $hasActive = true;
                break;
            }
        }
    }

    if ($hasActive) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'You already have an outstanding active loan. Repay to clear.']);
        return;
    }

    $score = 65;
    if (isset($db['creditScores']) && is_array($db['creditScores'])) {
        foreach ($db['creditScores'] as $cs) {
            if (($cs['ownerId'] ?? '') === $borrowerId) {
                $score = $cs['score'] ?? 65;
                break;
            }
        }
    }

    if ($score < 50) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Credit rating score (' . $score . ') insufficient. Minimal requirements is 50.']);
        return;
    }

    $walletIdx = -1;
    if (isset($db['wallets']) && is_array($db['wallets'])) {
        foreach ($db['wallets'] as $idx => $w) {
            if (($w['ownerId'] ?? '') === $borrowerId) {
                $walletIdx = $idx;
                break;
            }
        }
    }

    if ($walletIdx === -1) {
        if (!isset($db['wallets'])) $db['wallets'] = [];
        $walletIdx = count($db['wallets']);
        $db['wallets'][] = [
            'id' => 'W_' . $borrowerId,
            'ownerId' => $borrowerId,
            'ownerType' => $borrowerType,
            'balance' => 0,
            'status' => 'ACTIVE',
            'lastTransactionDate' => date('c')
        ];
    }

    $interest = (int)floor(($amount * ($product['interestRate'] ?? 0)) / 100);
    $totalRepayable = $amount + $interest;
    $dueDate = date('c', strtotime('+' . ($product['durationDays'] ?? 1) . ' days'));

    $loan = [
        'id' => 'loan_' . round(microtime(true) * 1000),
        'productId' => $productId,
        'borrowerId' => $borrowerId,
        'borrowerType' => $borrowerType,
        'amount' => $amount,
        'interest' => $interest,
        'totalRepayable' => $totalRepayable,
        'amountPaid' => 0,
        'status' => 'ACTIVE',
        'dueDate' => $dueDate,
        'createdAt' => date('c')
    ];

    if (!isset($db['loans'])) $db['loans'] = [];
    $db['loans'][] = $loan;
    $db['wallets'][$walletIdx]['balance'] += $amount;
    $db['wallets'][$walletIdx]['lastTransactionDate'] = date('c');

    if (!isset($db['transactions'])) $db['transactions'] = [];
    $db['transactions'][] = [
        'id' => 'tx_loan_dis_' . round(microtime(true) * 1000),
        'referenceCode' => generate_ref('LON-DIS'),
        'senderWalletId' => 'PLAT_CREDIT_POOL',
        'receiverWalletId' => $db['wallets'][$walletIdx]['id'],
        'amount' => $amount,
        'fee' => 0,
        'type' => 'LOAN_DISBURSE',
        'status' => 'SUCCESS',
        'description' => 'Disbursement of ' . ($product['name'] ?? 'Micro Loan'),
        'createdAt' => date('c')
    ];

    save_db($db);
    audit($borrowerId, 'Borrower: ' . $borrowerType, $borrowerType, 'LOAN_DISBURSED', null, ['amount' => $amount, 'totalRepayable' => $totalRepayable]);

    echo json_encode([
        'success' => true,
        'message' => 'Congratulations! Your loan of ' . number_format($amount) . ' UGX has been approved and disbursed instantly to your wallet.',
        'loan' => $loan
    ]);
}

function handle_loan_repay($vars, $input) {
    $db = load_db();
    $loanId = $input['loanId'] ?? '';
    $amount = (int)($input['amount'] ?? 0);

    $loanIdx = -1;
    if (isset($db['loans']) && is_array($db['loans'])) {
        foreach ($db['loans'] as $idx => $l) {
            if (($l['id'] ?? '') === $loanId) {
                $loanIdx = $idx;
                break;
            }
        }
    }

    if ($loanIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Loan index missing.']);
        return;
    }

    $loan = $db['loans'][$loanIdx];

    $walletIdx = -1;
    if (isset($db['wallets']) && is_array($db['wallets'])) {
        foreach ($db['wallets'] as $idx => $w) {
            if (($w['ownerId'] ?? '') === $loan['borrowerId']) {
                $walletIdx = $idx;
                break;
            }
        }
    }

    if ($walletIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Borrower wallet not located.']);
        return;
    }

    $remaining = ($loan['totalRepayable'] ?? 0) - ($loan['amountPaid'] ?? 0);
    if ($db['wallets'][$walletIdx]['balance'] < $amount) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Insufficient wallet balance to process this loan repayment.']);
        return;
    }

    $finalPay = min($amount, $remaining);

    $db['wallets'][$walletIdx]['balance'] -= $finalPay;
    $db['loans'][$loanIdx]['amountPaid'] += $finalPay;
    $db['wallets'][$walletIdx]['lastTransactionDate'] = date('c');

    if ($db['loans'][$loanIdx]['amountPaid'] >= $db['loans'][$loanIdx]['totalRepayable']) {
        $db['loans'][$loanIdx]['status'] = 'PAID';
    }

    if (!isset($db['transactions'])) $db['transactions'] = [];
    $db['transactions'][] = [
        'id' => 'tx_loan_rep_' . round(microtime(true) * 1000),
        'referenceCode' => generate_ref('LON-REP'),
        'senderWalletId' => $db['wallets'][$walletIdx]['id'],
        'receiverWalletId' => 'PLAT_CREDIT_POOL',
        'amount' => $finalPay,
        'fee' => 0,
        'type' => 'LOAN_REPAY',
        'status' => 'SUCCESS',
        'description' => 'Repayment for loan ID ' . $loan['id'],
        'createdAt' => date('c')
    ];

    save_db($db);
    audit($loan['borrowerId'], 'Borrower', $loan['borrowerType'] ?? 'PARENT', 'LOAN_REPAYMENT_SUBMITTED', null, ['amountRepaid' => $finalPay]);

    echo json_encode([
        'success' => true,
        'message' => 'Repayment of ' . number_format($finalPay) . ' UGX completed successfully.',
        'remaining' => $db['loans'][$loanIdx]['totalRepayable'] - $db['loans'][$loanIdx]['amountPaid']
    ]);
}

// ----------------------------------------------------
// DYNAMIC QR CODE PAYMENTS & POLLING ENDPOINTS (PHP)
// ----------------------------------------------------

function handle_pos_generate_payment_qr($vars, $input) {
    $db = load_db();
    $vendorId = $input['vendorId'] ?? '';
    $amount = (int)($input['amount'] ?? 0);
    $items = $input['items'] ?? [];

    if (empty($vendorId) || $amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid merchant or checkout amount.']);
        return;
    }

    $vendor = null;
    if (isset($db['vendors']) && is_array($db['vendors'])) {
        foreach ($db['vendors'] as $v) {
            if ($v['id'] === $vendorId) {
                $vendor = $v;
                break;
            }
        }
    }

    if (!$vendor) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Merchant vendor not found.']);
        return;
    }

    $txId = 'tx_qr_' . round(microtime(true) * 1000);
    $refCode = generate_ref('QR-PAY');

    $descItems = 'POS Purchase';
    if (is_array($items) && count($items) > 0) {
        $descArr = [];
        foreach ($items as $item) {
            $descArr[] = ($item['name'] ?? 'Item') . ' x' . ($item['quantity'] ?? 1);
        }
        $descItems = implode(', ', $descArr);
    }

    if (!isset($db['transactions'])) {
        $db['transactions'] = [];
    }

    $db['transactions'][] = [
        'id' => $txId,
        'referenceCode' => $refCode,
        'senderWalletId' => 'PENDING_SCAN_PAY',
        'receiverWalletId' => 'W_' . $vendorId,
        'amount' => $amount,
        'fee' => (int)floor($amount * 0.015),
        'type' => 'SPEND',
        'status' => 'PENDING',
        'description' => 'POS QR Pay: ' . $descItems,
        'createdAt' => date('c')
    ];

    save_db($db);
    audit('VENDOR', $vendor['name'], 'VENDOR', 'DYNAMIC_QR_CODE_GENERATED', ['amount' => $amount], ['refCode' => $refCode]);

    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $paymentUrl = $proto . '://' . $host . '/pay?ref=' . $refCode;

    echo json_encode([
        'success' => true,
        'transactionId' => $txId,
        'referenceCode' => $refCode,
        'paymentUrl' => $paymentUrl,
        'amount' => $amount
    ]);
}

function handle_pos_payment_status($vars) {
    $db = load_db();
    $refCode = $vars['refCode'] ?? '';
    
    $txn = null;
    if (isset($db['transactions']) && is_array($db['transactions'])) {
        foreach ($db['transactions'] as $t) {
            if (($t['referenceCode'] ?? '') === $refCode || ($t['id'] ?? '') === $refCode) {
                $txn = $t;
                break;
            }
        }
    }

    if (!$txn) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Dynamic payment request not found.']);
        return;
    }

    echo json_encode([
        'success' => true,
        'id' => $txn['id'],
        'referenceCode' => $txn['referenceCode'],
        'amount' => $txn['amount'],
        'status' => $txn['status'],
        'senderWalletId' => $txn['senderWalletId'] ?? '',
        'receiverWalletId' => $txn['receiverWalletId'] ?? '',
        'description' => $txn['description'] ?? '',
        'createdAt' => $txn['createdAt'] ?? ''
    ]);
}

function handle_pos_complete_dynamic_payment($vars, $input) {
    $db = load_db();
    $refCode = $input['refCode'] ?? '';
    $fundingSource = $input['fundingSource'] ?? '';
    $studentId = $input['studentId'] ?? '';
    $parentId = $input['parentId'] ?? '';
    $pin = $input['pin'] ?? '';

    $txnIdx = -1;
    if (isset($db['transactions']) && is_array($db['transactions'])) {
        foreach ($db['transactions'] as $idx => $t) {
            if (($t['referenceCode'] ?? '') === $refCode) {
                $txnIdx = $idx;
                break;
            }
        }
    }

    if ($txnIdx === -1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Dynamic transaction request not found.']);
        return;
    }

    $txn = $db['transactions'][$txnIdx];

    if ($txn['status'] === 'SUCCESS') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Payment has already been completed.']);
        return;
    }

    if ($txn['status'] !== 'PENDING') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Transaction is not in pending state.']);
        return;
    }

    $receiverWalletIdx = -1;
    if (isset($db['wallets']) && is_array($db['wallets'])) {
        foreach ($db['wallets'] as $idx => $w) {
            if ($w['id'] === $txn['receiverWalletId']) {
                $receiverWalletIdx = $idx;
                break;
            }
        }
    }

    $vendor = null;
    if (isset($db['vendors']) && is_array($db['vendors'])) {
        foreach ($db['vendors'] as $v) {
            if ('W_' . $v['id'] === $txn['receiverWalletId']) {
                $vendor = $v;
                break;
            }
        }
    }

    if ($receiverWalletIdx === -1 || !$vendor) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Receiver merchant wallet is unavailable.']);
        return;
    }

    $school = null;
    if (isset($db['schools']) && is_array($db['schools'])) {
        foreach ($db['schools'] as $s) {
            if ($s['id'] === $vendor['schoolId']) {
                $school = $s;
                break;
            }
        }
    }

    $schoolWalletIdx = -1;
    if ($school && isset($db['wallets']) && is_array($db['wallets'])) {
        foreach ($db['wallets'] as $idx => $w) {
            if ($w['ownerId'] === $school['id'] && $w['ownerType'] === 'SCHOOL') {
                $schoolWalletIdx = $idx;
                break;
            }
        }
    }

    $platformWalletIdx = -1;
    if (isset($db['wallets']) && is_array($db['wallets'])) {
        foreach ($db['wallets'] as $idx => $w) {
            if ($w['ownerType'] === 'PLATFORM') {
                $platformWalletIdx = $idx;
                break;
            }
        }
    }

    $schoolCommRate = $school ? $school['commissionRate'] : 1;
    $platformCommRate = 0.5;

    $schoolPart = (int)floor(($txn['amount'] * $schoolCommRate) / 100);
    $platformPart = (int)floor(($txn['amount'] * $platformCommRate) / 100);
    $vendorPart = $txn['amount'] - $schoolPart - $platformPart;

    try {
        if ($fundingSource === 'MOMO') {
            $db['wallets'][$receiverWalletIdx]['balance'] += $vendorPart;
            $db['wallets'][$receiverWalletIdx]['lastTransactionDate'] = date('c');

            if ($schoolWalletIdx !== -1 && $schoolPart > 0) {
                $db['wallets'][$schoolWalletIdx]['balance'] += $schoolPart;
                $db['wallets'][$schoolWalletIdx]['lastTransactionDate'] = date('c');
            }

            if ($platformWalletIdx !== -1 && $platformPart > 0) {
                $db['wallets'][$platformWalletIdx]['balance'] += $platformPart;
                $db['wallets'][$platformWalletIdx]['lastTransactionDate'] = date('c');
            }

            $db['transactions'][$txnIdx]['senderWalletId'] = 'MOMO-PAY-INTEGRATION';
            $db['transactions'][$txnIdx]['status'] = 'SUCCESS';
            $db['transactions'][$txnIdx]['description'] = 'Dynamic QR Pay (MoMo Cash Out): ' . $txn['description'];

            save_db($db);
            audit('VENDOR', $vendor['name'], 'VENDOR', 'DYNAMIC_QR_PAY_MOMO_COMPLETED', ['amount' => $txn['amount']], ['refCode' => $refCode]);

            echo json_encode([
                'success' => true,
                'message' => 'Payment of ' . number_format($txn['amount']) . ' UGX completed successfully via Mobile Money!'
            ]);
            return;

        } else if ($fundingSource === 'STUDENT') {
            $student = null;
            if (isset($db['students']) && is_array($db['students'])) {
                foreach ($db['students'] as $s) {
                    if ($s['id'] === $studentId) {
                        $student = $s;
                        break;
                    }
                }
            }

            if (!$student) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Student card account not found.']);
                return;
            }

            if ($student['pin'] !== $pin) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid 4-digit Student PIN code.']);
                return;
            }

            $studentWalletIdx = -1;
            if (isset($db['wallets']) && is_array($db['wallets'])) {
                foreach ($db['wallets'] as $idx => $w) {
                    if ($w['ownerId'] === $student['id'] && $w['ownerType'] === 'STUDENT') {
                        $studentWalletIdx = $idx;
                        break;
                    }
                }
            }

            if ($studentWalletIdx === -1) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Student wallet ledger not found.']);
                return;
            }

            if ($db['wallets'][$studentWalletIdx]['balance'] < $txn['amount']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Insufficient pocket money balance. Card holds ' . number_format($db['wallets'][$studentWalletIdx]['balance']) . ' UGX.'
                ]);
                return;
            }

            $db['wallets'][$studentWalletIdx]['balance'] -= $txn['amount'];
            $db['wallets'][$studentWalletIdx]['lastTransactionDate'] = date('c');

            $db['wallets'][$receiverWalletIdx]['balance'] += $vendorPart;
            $db['wallets'][$receiverWalletIdx]['lastTransactionDate'] = date('c');

            if ($schoolWalletIdx !== -1 && $schoolPart > 0) {
                $db['wallets'][$schoolWalletIdx]['balance'] += $schoolPart;
                $db['wallets'][$schoolWalletIdx]['lastTransactionDate'] = date('c');
            }

            if ($platformWalletIdx !== -1 && $platformPart > 0) {
                $db['wallets'][$platformWalletIdx]['balance'] += $platformPart;
                $db['wallets'][$platformWalletIdx]['lastTransactionDate'] = date('c');
            }

            $db['transactions'][$txnIdx]['senderWalletId'] = $db['wallets'][$studentWalletIdx]['id'];
            $db['transactions'][$txnIdx]['status'] = 'SUCCESS';
            $db['transactions'][$txnIdx]['description'] = 'Dynamic QR Pay (Student Debit): ' . $txn['description'];

            save_db($db);
            audit('STUDENT', $student['name'], 'STUDENT', 'DYNAMIC_QR_PAY_DEBITED', ['amount' => $txn['amount']], ['refCode' => $refCode]);

            echo json_encode([
                'success' => true,
                'message' => 'Payment of ' . number_format($txn['amount']) . ' UGX successfully authorized! debited from ' . $student['name'] . '\'s card.'
            ]);
            return;

        } else if ($fundingSource === 'PARENT') {
            $parent = null;
            if (isset($db['parents']) && is_array($db['parents'])) {
                foreach ($db['parents'] as $p) {
                    if ($p['id'] === $parentId) {
                        $parent = $p;
                        break;
                    }
                }
            }

            if (!$parent) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Parent wallet account not found.']);
                return;
            }

            if ($pin !== '1234') {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid 4-digit Parent PIN code.']);
                return;
            }

            $parentWalletIdx = -1;
            if (isset($db['wallets']) && is_array($db['wallets'])) {
                foreach ($db['wallets'] as $idx => $w) {
                    if ($w['ownerId'] === $parent['id'] && $w['ownerType'] === 'PARENT') {
                        $parentWalletIdx = $idx;
                        break;
                    }
                }
            }

            if ($parentWalletIdx === -1) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Parent wallet ledger not found.']);
                return;
            }

            if ($db['wallets'][$parentWalletIdx]['balance'] < $txn['amount']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Insufficient parent wallet balance. Available: ' . number_format($db['wallets'][$parentWalletIdx]['balance']) . ' UGX.'
                ]);
                return;
            }

            $db['wallets'][$parentWalletIdx]['balance'] -= $txn['amount'];
            $db['wallets'][$parentWalletIdx]['lastTransactionDate'] = date('c');

            $db['wallets'][$receiverWalletIdx]['balance'] += $vendorPart;
            $db['wallets'][$receiverWalletIdx]['lastTransactionDate'] = date('c');

            if ($schoolWalletIdx !== -1 && $schoolPart > 0) {
                $db['wallets'][$schoolWalletIdx]['balance'] += $schoolPart;
                $db['wallets'][$schoolWalletIdx]['lastTransactionDate'] = date('c');
            }

            if ($platformWalletIdx !== -1 && $platformPart > 0) {
                $db['wallets'][$platformWalletIdx]['balance'] += $platformPart;
                $db['wallets'][$platformWalletIdx]['lastTransactionDate'] = date('c');
            }

            $db['transactions'][$txnIdx]['senderWalletId'] = $db['wallets'][$parentWalletIdx]['id'];
            $db['transactions'][$txnIdx]['status'] = 'SUCCESS';
            $db['transactions'][$txnIdx]['description'] = 'Dynamic QR Pay (Parent Debit): ' . $txn['description'];

            save_db($db);
            audit('PARENT', $parent['name'], 'PARENT', 'DYNAMIC_QR_PAY_PARENT_DEBITED', ['amount' => $txn['amount']], ['refCode' => $refCode]);

            echo json_encode([
                'success' => true,
                'message' => 'Payment of ' . number_format($txn['amount']) . ' UGX completed successfully! debited from ' . $parent['name'] . '\'s parent wallet.'
            ]);
            return;

        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Unknown funding source method.']);
            return;
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Dynamic payment crash: ' . $e->getMessage()]);
    }
}
