<?php
/**
 * POSController Class
 * Handles Point of Sale transactions, smart card checkouts, vendor catalogs,
 * authorized manager PIN refunds, dynamic merchant payment QR generation,
 * and dynamic transaction status completions.
 */

class POSController {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function scan($vars) {
        $db = $this->db->load();
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

    public function checkout($vars, $input) {
        $db = $this->db->load();
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

        $refCode = $this->db->generateRef('TXN');
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

        $this->db->save($db);
        $this->db->audit('VENDOR', $vendor['name'], 'VENDOR', 'POS_SALE_COMPLETED', null, ['student' => $student['name'], 'total' => $total]);

        echo json_encode([
            'success' => true,
            'referenceCode' => $refCode,
            'message' => 'Payment completed successfully.',
            'newBalance' => $db['wallets'][$studentWalletIdx]['balance'],
            'vendorReceived' => $vendorPart
        ]);
    }

    public function getCatalog($vars) {
        $db = $this->db->load();
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

    public function refund($vars, $input) {
        $db = $this->db->load();
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
            'referenceCode' => $this->db->generateRef('REF'),
            'senderWalletId' => $db['wallets'][$receiverWalletIdx]['id'],
            'receiverWalletId' => $db['wallets'][$senderWalletIdx]['id'],
            'amount' => $txn['amount'],
            'fee' => 0,
            'type' => 'REFUND',
            'status' => 'SUCCESS',
            'description' => 'Refunded: Original ref ' . $txn['referenceCode'],
            'createdAt' => date('c')
        ];

        $this->db->save($db);
        $this->db->audit('VENDOR', $vendor['name'], 'VENDOR', 'POS_REFUND_EXECUTED', ['amount' => $txn['amount']], ['ref' => $txn['referenceCode']]);

        echo json_encode(['success' => true, 'message' => 'Transaction fully refunded to Student card ledger.']);
    }

    public function generatePaymentQr($vars, $input) {
        $db = $this->db->load();
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
        $refCode = $this->db->generateRef('QR-PAY');

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

        $this->db->save($db);
        $this->db->audit('VENDOR', $vendor['name'], 'VENDOR', 'DYNAMIC_QR_CODE_GENERATED', ['amount' => $amount], ['refCode' => $refCode]);

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

    public function getPaymentStatus($vars) {
        $db = $this->db->load();
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

    public function completeDynamicPayment($vars, $input) {
        $db = $this->db->load();
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

                $this->db->save($db);
                $this->db->audit('VENDOR', $vendor['name'], 'VENDOR', 'DYNAMIC_QR_PAY_MOMO_COMPLETED', ['amount' => $txn['amount']], ['refCode' => $refCode]);

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

                $this->db->save($db);
                $this->db->audit('STUDENT', $student['name'], 'STUDENT', 'DYNAMIC_QR_PAY_DEBITED', ['amount' => $txn['amount']], ['refCode' => $refCode]);

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

                $this->db->save($db);
                $this->db->audit('PARENT', $parent['name'], 'PARENT', 'DYNAMIC_QR_PAY_PARENT_DEBITED', ['amount' => $txn['amount']], ['refCode' => $refCode]);

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
}
