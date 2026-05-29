# Read the markdown file
$mdPath = "C:\Users\user\.gemini\antigravity\brain\646430e9-47dd-44d7-87ab-934686157195\ANALISIS_KEBUTUHAN_SISTEM_ABSENRFID.md"
$htmlPath = "c:\laragon\www\ABSENRFID\ANALISIS_SISTEM.html"

$mdContent = [System.IO.File]::ReadAllText($mdPath, [System.Text.Encoding]::UTF8)

# Escape for JS string
$mdContent = $mdContent.Replace('\', '\\')
$mdContent = $mdContent.Replace('`', '\`')
$mdContent = $mdContent.Replace('$', '\$')
$mdContent = $mdContent.Replace("`r`n", "\n")
$mdContent = $mdContent.Replace("`n", "\n")

$htmlContent = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$htmlContent = $htmlContent.Replace('MARKDOWN_PLACEHOLDER', $mdContent)

[System.IO.File]::WriteAllText($htmlPath, $htmlContent, [System.Text.Encoding]::UTF8)

Write-Host "Done! File size:" (Get-Item $htmlPath).Length "bytes"
