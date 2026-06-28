<?php
/**
 * StudentController Class
 * Handles student, parent, and school registries, bulk CSV student upload synchronizations,
 * PIN resets, daily budget spend limits, and parental pocket money ledger allocations.
 */

class StudentController {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function getSchools() {
        $data = $this->db->load();
        echo json_encode($data['schools'] ?? []);
    }

    public function getVendors() {
        $data = $this->db->load();
        echo json_encode($data['vendors'] ?? []);
    }

    public function getParents() {
        $data = $this->db->load();
        echo json_encode($data['parents'] ?? []);
    }

    public function getStudents() {
        $data = $this->db->load();
        echo json_encode($data['students'] ?? []);
    }

    public function bulkUpload($vars, $input) {
        $db = $this->db->load();
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
                    'avatarUrl' => 'https://0286df2?w=120',
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

        $this->db->save($db);
        $this->db->audit($agentId, $agentName, 'AGENT', 'BULK_CSV_STUDENT_IMPORT', null, ['addedStudentsCount' => count($addedStudents)]);

        echo json_encode([
            'success' => true,
            'message' => 'Bulk sync complete. Loaded parent structures. Processed ' . count($addedStudents) . ' new student entries.',
            'addedCount' => $addedCount,
            'updatedCount' => $updatedCount
        ]);
    }

    public function resetPin($vars, $input) {
        $db = $this->db->load();
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
        $this->db->save($db);

        $this->db->audit('PARENT', 'Parent linked to ' . $studentName, 'PARENT', 'RESET_STUDENT_PIN', ['student' => $studentName, 'oldPin' => '****'], ['newPin' => '****']);
        echo json_encode(['success' => true, 'message' => 'PIN reset successfully. SMS notifications sent to ' . $db['students'][$foundIdx]['parentPhone'] . '.']);
    }

    public function setLimit($vars, $input) {
        $db = $this->db->load();
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
        $this->db->save($db);

        $this->db->audit('PARENT', 'Parent', 'PARENT', 'SET_STUDENT_SPEND_LIMIT', ['name' => $db['students'][$foundIdx]['name'], 'oldLimit' => $oldLimit], ['newLimit' => $limit]);
        echo json_encode(['success' => true, 'message' => 'Pocket money transaction limit updated to ' . number_format($limit) . ' UGX.']);
    }

    public function allocatePocketMoney($vars, $input) {
        $db = $this->db->load();
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

        $refCode = $this->db->generateRef('TXN');
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
            'createdAt' => date('c' ?? '')
        ];

        $this->db->save($db);
        $this->db->audit('PARENT', $parent['name'], 'PARENT', 'ALLOCATE_POCKET_MONEY', null, ['student' => $student['name'], 'amount' => $amount]);

        echo json_encode(['success' => true, 'message' => 'Transferred ' . number_format($amount) . ' UGX safely to ' . $student['name'] . '.']);
    }
}
