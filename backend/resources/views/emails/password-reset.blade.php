<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 24px;
        }
        h2 {
            color: #1e293b;
            margin-top: 0;
        }
        p {
            color: #64748b;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #94a3b8;
            font-size: 12px;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 12px;
            margin-top: 20px;
            font-size: 13px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            @if($logoUrl)
                <img src="{{ $logoUrl }}" alt="Logo" style="max-height: 60px; width: auto; margin-bottom: 10px;">
            @else
                <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">{{ $institutionName }}</h1>
            @endif
            <p style="margin: 5px 0; font-size: 14px;">Sistem Absensi RFID</p>
        </div>

        <h2>Reset Password</h2>
        
        <p>Halo <strong>{{ $user->name }}</strong>,</p>
        
        <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
        
        <div style="text-align: center;">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </div>
        
        <div class="warning">
            ⚠️ Link ini akan kadaluarsa dalam <strong>15 menit</strong>. Jika Anda tidak meminta reset password, abaikan email ini.
        </div>
        
        <div class="footer">
            <p>Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.</p>
            <p>&copy; {{ date('Y') }} SMAIT Ulil Albab - Sistem Absensi RFID</p>
        </div>
    </div>
</body>
</html>
