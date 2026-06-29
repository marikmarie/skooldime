<?php
/**
 * CollectoController Class
 * Simulates mobile money payment gateway features: MTN/Airtel deposit STK pushes,
 * transaction status polling approvals, and secure payouts.
 */

class CollectoController {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function deposit($vars, $input) {
        $db = $this->db->load();
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
        $refCode = $this->db->generateRef('COL-DEP');

        $username = $this->db->getEnv('COLLECTO_USERNAME');
        $apiKey = $this->db->getEnv('COLLECTO_API_KEY');

        if (!empty($username) && !empty($apiKey)) {
            // Real Collecto Integration
            $url = "https://collecto.cissytech.com/api/" . urlencode($username) . "/requestToPay";
            $headers = [
                "Content-Type: application/json",
                "x-api-key: " . $apiKey
            ];
            $payload = [
                "paymentOption" => "mobilemoney",
                "phone" => ltrim($parentPhone, '+'),
                "amount" => $amount,
                "reference" => $refCode
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            $response = curl_exec($ch);
            $err = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($err) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Collecto connection error: ' . $err]);
                return;
            }

            $resData = json_decode($response, true);
            if ($httpCode >= 200 && $httpCode < 300 && (isset($resData['status']) || isset($resData['transactionId']))) {
                $collectoId = $resData['transactionId'] ?? $refCode;
                
                if (!isset($db['transactions'])) $db['transactions'] = [];
                $db['transactions'][] = [
                    'id' => $txId,
                    'referenceCode' => $refCode,
                    'collectoTxId' => $collectoId,
                    'senderWalletId' => 'COLLECTO_GATEWAY',
                    'receiverWalletId' => $db['wallets'][$walletIdx]['id'],
                    'amount' => $amount,
                    'fee' => 1000,
                    'type' => 'DEPOSIT',
                    'status' => 'PENDING',
                    'description' => 'Pending Collecto MTN/Airtel Push',
                    'createdAt' => date('c'),
                    'realIntegration' => true
                ];
                $this->db->save($db);
                $this->db->audit('PARENT', $parent['name'], 'PARENT', 'COLLECTO_REAL_PUSH_INITIATED', null, ['refCode' => $refCode, 'amount' => $amount, 'collectoTxId' => $collectoId]);

                echo json_encode([
                    'success' => true,
                    'transactionId' => $txId,
                    'referenceCode' => $refCode,
                    'collectoTxId' => $collectoId,
                    'realIntegration' => true,
                    'message' => 'Collecto push successfully initiated. Please enter your mobile money PIN to authorize.'
                ]);
                return;
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $resData['message'] ?? 'Collecto gateway error: ' . ($response ?: 'HTTP code ' . $httpCode),
                    'details' => $resData
                ]);
                return;
            }
        }

        // Mock / Simulation Fallback
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
            'description' => 'Pending Collecto MTN/Airtel Push',
            'createdAt' => date('c')
        ];

        $this->db->save($db);
        $this->db->audit('PARENT', $parent['name'], 'PARENT', 'COLLECTO_PUSH_INITIATED', null, ['refCode' => $refCode, 'amount' => $amount]);

        echo json_encode([
            'success' => true,
            'transactionId' => $txId,
            'referenceCode' => $refCode,
            'message' => 'Collecto push sent to your mobile phone. Enter MTN/Airtel PIN to authorize.'
        ]);
    }

    public function checkDepositStatus($vars) {
        $db = $this->db->load();
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

        if (($txn['status'] ?? '') === 'FAILED') {
            echo json_encode(['success' => true, 'status' => 'FAILED', 'transaction' => $txn]);
            return;
        }

        $username = $this->db->getEnv('COLLECTO_USERNAME');
        $apiKey = $this->db->getEnv('COLLECTO_API_KEY');
        $isReal = !empty($txn['realIntegration']) && !empty($txn['collectoTxId']);

        if ($isReal && !empty($username) && !empty($apiKey)) {
            // Real Collecto status poll
            $collectoId = $txn['collectoTxId'];
            $url = "https://collecto.cissytech.com/api/" . urlencode($username) . "/requestToPayStatus";
            $headers = [
                "Content-Type: application/json",
                "x-api-key: " . $apiKey
            ];
            $payload = [
                "transactionId" => $collectoId
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            $response = curl_exec($ch);
            $err = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($err) {
                echo json_encode(['success' => true, 'status' => 'PENDING', 'error' => 'Collecto status connection query error: ' . $err]);
                return;
            }

            $resData = json_decode($response, true);
            $statusStr = strtolower($resData['status'] ?? 'pending');

            if ($statusStr === 'successful' || $statusStr === 'success') {
                if ($db['transactions'][$txnIdx]['status'] === 'PENDING') {
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
                    $db['transactions'][$txnIdx]['description'] = 'Approved via real Collecto Gateway';
                    $this->db->save($db);
                    $txn = $db['transactions'][$txnIdx];
                }
                echo json_encode(['success' => true, 'status' => 'SUCCESS', 'transaction' => $txn, 'realIntegration' => true]);
                return;
            } else if ($statusStr === 'failed' || $statusStr === 'failed_payment' || $statusStr === 'rejected') {
                if ($db['transactions'][$txnIdx]['status'] === 'PENDING') {
                    $db['transactions'][$txnIdx]['status'] = 'FAILED';
                    $db['transactions'][$txnIdx]['description'] = 'Declined/failed on Collecto gateway: ' . ($resData['message'] ?? 'Transaction rejected');
                    $this->db->save($db);
                    $txn = $db['transactions'][$txnIdx];
                }
                echo json_encode(['success' => true, 'status' => 'FAILED', 'transaction' => $txn, 'realIntegration' => true]);
                return;
            } else {
                echo json_encode(['success' => true, 'status' => 'PENDING', 'realIntegration' => true]);
                return;
            }
        }

        // Mock Simulation Polling
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
                $this->db->save($db);
                $txn = $db['transactions'][$txnIdx];
            }
            echo json_encode(['success' => true, 'status' => 'SUCCESS', 'transaction' => $txn]);
            return;
        }

        echo json_encode(['success' => true, 'status' => 'PENDING']);
    }

    public function withdraw($vars, $input) {
        $db = $this->db->load();
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
        $refCode = $this->db->generateRef('COL-WIT');

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

        $this->db->save($db);
        $this->db->audit('VENDOR', $vendor['name'], 'VENDOR', 'COLLECTO_WITHDRAW_INITIATED', null, ['refCode' => $refCode, 'amount' => $amount]);

        echo json_encode([
            'success' => true,
            'transactionId' => $txId,
            'referenceCode' => $refCode,
            'message' => 'Payout request processed. Pre-deduction of ' . number_format($amount) . ' UGX applied. Polling active.'
        ]);
    }
}
