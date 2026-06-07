<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    /**
     * Security headers untuk meningkatkan skor HTTP Observatory.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Content Security Policy
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://absenulilalbab.com https://libur.absenulilalbab.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);

        $response->headers->set('Content-Security-Policy', $csp);

        // Strict Transport Security - paksa HTTPS selama 1 tahun
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Cegah clickjacking - tidak boleh di-embed dalam iframe
        $response->headers->set('X-Frame-Options', 'DENY');

        // Cegah MIME-type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Referrer Policy - kirim referrer hanya ke same-origin, cross-origin hanya kirim origin
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Cross-Origin Resource Policy
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        return $response;
    }
}
