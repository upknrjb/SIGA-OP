<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=siga_op', 'postgres', '123');
    echo 'CONNECTED!';
} catch (Exception $e) {
    echo 'ERROR: ' . $e->getMessage();
}
