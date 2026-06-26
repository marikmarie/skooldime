<?php
/**
 * AuthController Class
 * Handles user authentication, system health, and database resets.
 */

class AuthController {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function health() {
        echo json_encode([
            'status' => 'healthy',
            'platform' => 'EduTechMoney',
            'timestamp' => date('c')
        ]);
    }

    public function login($vars, $input) {
        $dbData = $this->db->load();
        $username = $input['username'] ?? '';
        $found = null;
        if (isset($dbData['users']) && is_array($dbData['users'])) {
            foreach ($dbData['users'] as $u) {
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

    public function getAuditLogs() {
        $dbData = $this->db->load();
        echo json_encode($dbData['auditLogs'] ?? []);
    }

    public function resetDb() {
        $template = __DIR__ . '/db.template.json';
        if (!file_exists($template) && file_exists(dirname(__DIR__) . '/db.template.json')) {
            $template = dirname(__DIR__) . '/db.template.json';
        }
        
        if (file_exists($template)) {
            copy($template, $this->db->getDbFilePath());
            $this->db->audit('SYSTEM', 'System Daemon', 'SUPER_ADMIN', 'DATABASE_HARD_RESET');
            echo json_encode(['success' => true, 'message' => 'Database reset to default template state.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database template backup not found.']);
        }
    }
}
