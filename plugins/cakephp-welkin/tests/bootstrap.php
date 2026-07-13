<?php
declare(strict_types=1);

// Minimal framework configuration for standalone plugin tests — just
// enough for View/Helper construction outside a full application.
require dirname(__DIR__) . '/vendor/autoload.php';

use Cake\Cache\Cache;
use Cake\Core\Configure;

Cache::setConfig([
    '_cake_core_' => ['engine' => 'Array'],
    '_cake_translations_' => ['engine' => 'Array'],
]);

Configure::write('App', [
    'namespace' => 'Welkin\Test',
    'encoding' => 'UTF-8',
    'defaultLocale' => 'en_US',
    'base' => false,
    'baseUrl' => false,
    'dir' => 'src',
    'webroot' => 'webroot',
    'wwwRoot' => sys_get_temp_dir(),
    'fullBaseUrl' => 'http://localhost',
    'imageBaseUrl' => 'img/',
    'jsBaseUrl' => 'js/',
    'cssBaseUrl' => 'css/',
    'paths' => [
        'plugins' => [],
        'templates' => [sys_get_temp_dir()],
        'locales' => [],
    ],
]);
Configure::write('debug', true);
