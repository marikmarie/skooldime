<?php
/**
 * LoansController Class
 * Manages school micro-loan products, borrower credit ratings, outstanding loan balances,
 * credit applications, instant disbursements, and repayment ledger updates.
 */

class LoansController {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function getProducts() {
        $db = $this->db->load();
        echo json_encode($db['loanProducts'] ?? []);
    }

    public function getMyLoans($vars) {
        $db = $this->db->load();
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

    public function getCreditScore($vars) {
        $db = $this->db->load();
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
            $this->db->save($db);
        }

        echo json_encode($scoreObj);
    }

    public function apply($vars, $input) {
        $db = $this->db->load();
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
            'referenceCode' => $this->db->generateRef('LON-DIS'),
            'senderWalletId' => 'PLAT_CREDIT_POOL',
            'receiverWalletId' => $db['wallets'][$walletIdx]['id'],
            'amount' => $amount,
            'fee' => 0,
            'type' => 'LOAN_DISBURSE',
            'status' => 'SUCCESS',
            'description' => 'Disbursement of ' . ($product['name'] ?? 'Micro Loan'),
            'createdAt' => date('c')
        ];

        $this->db->save($db);
        $this->db->audit($borrowerId, 'Borrower: ' . $borrowerType, $borrowerType, 'LOAN_DISBURSED', null, ['amount' => $amount, 'totalRepayable' => $totalRepayable]);

        echo json_encode([
            'success' => true,
            'message' => 'Congratulations! Your loan of ' . number_format($amount) . ' UGX has been approved and disbursed instantly to your wallet.',
            'loan' => $loan
        ]);
    }

    public function repay($vars, $input) {
        $db = $this->db->load();
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
            'referenceCode' => $this->db->generateRef('LON-REP'),
            'senderWalletId' => $db['wallets'][$walletIdx]['id'],
            'receiverWalletId' => 'PLAT_CREDIT_POOL',
            'amount' => $finalPay,
            'fee' => 0,
            'type' => 'LOAN_REPAY',
            'status' => 'SUCCESS',
            'description' => 'Repayment for loan ID ' . $loan['id'],
            'createdAt' => date('c')
        ];

        $this->db->save($db);
        $this->db->audit($loan['borrowerId'], 'Borrower', $loan['borrowerType'] ?? 'PARENT', 'LOAN_REPAYMENT_SUBMITTED', null, ['amountRepaid' => $finalPay]);

        echo json_encode([
            'success' => true,
            'message' => 'Repayment of ' . number_format($finalPay) . ' UGX completed successfully.',
            'remaining' => $db['loans'][$loanIdx]['totalRepayable'] - $db['loans'][$loanIdx]['amountPaid']
        ]);
    }
}
