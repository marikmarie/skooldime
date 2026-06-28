<?php
/**
 * Database Manager Class
 * Handles loading, saving, auditing, and reference code generation.
 */

class Database {
    private $dbFile;

    public function __construct() {
        $this->dbFile = __DIR__ . '/db.json';
        $this->initializeTemplate();
    }

    private function initializeTemplate() {
        if (!file_exists($this->dbFile)) {
            // Look for template backup in current or parent folder
            $template = __DIR__ . '/db.template.json';
            if (!file_exists($template) && file_exists(dirname(__DIR__) . '/db.template.json')) {
                $template = dirname(__DIR__) . '/db.template.json';
            }
            if (!file_exists($template) && file_exists(dirname(__DIR__) . '/db.json')) {
                $template = dirname(__DIR__) . '/db.json';
            }
            
            if (file_exists($template)) {
                copy($template, $this->dbFile);
            } else {
                // Fallback default structure
                $defaultData = [
                    'users' => [],
                    'students' => [],
                    'parents' => [],
                    'vendors' => [],
                    'wallets' => [],
                    'transactions' => [],
                    'auditLogs' => [],
                    'loanProducts' => [],
                    'loans' => [],
                    'creditScores' => [],
                    'catalogItems' => [],
                    'schools' => []
                ];
                file_put_contents($this->dbFile, json_encode($defaultData, JSON_PRETTY_PRINT));
            }
        }
        
        // Also keep a copy as a template for reset capability
        $templateFile = __DIR__ . '/db.template.json';
        if (!file_exists($templateFile) && file_exists($this->dbFile)) {
            copy($this->dbFile, $templateFile);
        }
    }

    public function getDbFilePath() {
        return $this->dbFile;
    }

    public function getEnv($key, $default = null) {
        // Try native getenv
        $val = getenv($key);
        if ($val !== false) return $val;
        
        // Try $_ENV
        if (isset($_ENV[$key])) return $_ENV[$key];

        // Parse .env manually from potential locations
        $envPaths = [
            __DIR__ . '/.env',
            dirname(__DIR__) . '/.env',
            dirname(dirname(__DIR__)) . '/.env'
        ];

        foreach ($envPaths as $path) {
            if (file_exists($path)) {
                $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if (empty($trimmed) || strpos($trimmed, '#') === 0) continue;
                    $parts = explode('=', $trimmed, 2);
                    if (count($parts) === 2) {
                        $envKey = trim($parts[0]);
                        $envVal = trim($parts[1]);
                        // remove trailing comments and quotes
                        if (strpos($envVal, '#') !== false) {
                            $valParts = explode('#', $envVal, 2);
                            $envVal = trim($valParts[0]);
                        }
                        $envVal = trim($envVal, '"\'');
                        if ($envKey === $key) {
                            return $envVal;
                        }
                    }
                }
            }
        }
        return $default;
    }

    public function load() {
        if (!file_exists($this->dbFile)) {
            return [];
        }
        $content = file_get_contents($this->dbFile);
        return json_decode($content, true) ?? [];
    }

    public function save($data) {
        file_put_contents($this->dbFile, json_encode($data, JSON_PRETTY_PRINT));
    }

    public function generateRef($prefix) {
        return $prefix . '-' . strtoupper(substr(md5(uniqid()), 0, 8));
    }

    public function audit($userId, $userName, $role, $action, $oldVal = null, $newVal = null) {
        $db = $this->load();
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
        $this->save($db);
    }
}
