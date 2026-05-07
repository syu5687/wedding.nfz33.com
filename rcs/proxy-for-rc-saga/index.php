<?php
/**
 * Memolead Wedding LP - リバースプロキシ
 * 
 * rc-saga.jp/rcs/lp/lp1/ → Cloud Run /rcs/lp/lp1/ へリクエストをパススルー転送
 * 
 * 設置場所例: rc-saga.jp/rcs/lp/lp1/index.php (.htaccess と一緒に)
 *
 * 動作モード:
 *   PROXY_PATH と Cloud Run側のパスを「同じ」にすればパススルー転送
 *   違うパスにマップしたい場合は CLOUD_RUN_PATH_PREFIX を変更
 */

// =================================================
// 設定
// =================================================
const CLOUD_RUN_URL = 'https://wedding-nfz33-com-665477084949.asia-northeast1.run.app';

// rc-saga.jp 上のこのプロキシのパス (この値を含むURIをCloud Runへ転送)
const PROXY_PATH = '/rcs/lp/lp1';

// Cloud Run側のパスプレフィックス (基本はPROXY_PATHと同じでOK)
const CLOUD_RUN_PATH_PREFIX = '/rcs/lp/lp1';

const TIMEOUT = 30;

// =================================================
// リクエストパスの解析
// =================================================
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);
$query = parse_url($requestUri, PHP_URL_QUERY);

// /rcs/lp/lp1/xxx → CLOUD_RUN_PATH_PREFIX/xxx に変換
if (strpos($path, PROXY_PATH) === 0) {
    $relPath = substr($path, strlen(PROXY_PATH));
    $path = CLOUD_RUN_PATH_PREFIX . $relPath;
}
if ($path === '' || $path === false) {
    $path = '/';
}

$targetUrl = CLOUD_RUN_URL . $path;
if ($query) {
    $targetUrl .= '?' . $query;
}

// =================================================
// cURLでリクエスト転送
// =================================================
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT => TIMEOUT,
    CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD'] ?? 'GET',
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => $_SERVER['HTTP_USER_AGENT'] ?? 'rc-saga-proxy',
]);

// リクエストヘッダー転送
$forwardHeaders = [];
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $headerName = str_replace('_', '-', substr($key, 5));
        if (in_array(strtoupper($headerName), ['HOST', 'CONNECTION', 'CONTENT-LENGTH'])) {
            continue;
        }
        $forwardHeaders[] = $headerName . ': ' . $value;
    }
}
$forwardHeaders[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '');
$forwardHeaders[] = 'X-Forwarded-Proto: ' . (!empty($_SERVER['HTTPS']) ? 'https' : 'http');
$forwardHeaders[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? '');

curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $postData = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    echo 'Bad Gateway: ' . curl_error($ch);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

curl_close($ch);

// =================================================
// レスポンスヘッダー転送
// =================================================
http_response_code($httpCode);

foreach (explode("\r\n", $rawHeaders) as $headerLine) {
    if (empty($headerLine) || strpos($headerLine, 'HTTP/') === 0) continue;
    if (preg_match('/^(Transfer-Encoding|Connection|Content-Encoding|Content-Length):/i', $headerLine)) continue;
    header($headerLine, false);
}

echo $body;
