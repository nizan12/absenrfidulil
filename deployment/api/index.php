<?php

/**
 * Entry point untuk Laravel backend di shared hosting
 * File ini ditempatkan di: public_html/api/index.php
 * 
 * Sesuaikan path '../../backend' jika folder backend Anda berbeda
 */

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Cek maintenance mode
if (file_exists($maintenance = __DIR__.'/../../backend/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Load autoloader
require __DIR__.'/../../backend/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__.'/../../backend/bootstrap/app.php';

// Override public path agar Laravel tahu public_html/api/ adalah "public" folder
$app->bind('path.public', function() {
    return __DIR__;
});

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
