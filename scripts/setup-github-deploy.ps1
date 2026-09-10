# Sets Notion secrets on the GitHub repo and enables Pages (GitHub Actions).
# Prerequisites: gh auth login  (once)
# Usage:  powershell -File scripts/setup-github-deploy.ps1

$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
if (-not (Test-Path $gh)) { $gh = 'gh' }

$repo = 'abkaaar/abkaaar.github.io'
$root = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $root '.env'
if (-not (Test-Path $envPath)) {
  throw ".env not found at $envPath"
}

$vars = @{}
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $i = $_.IndexOf('=')
  $vars[$_.Substring(0, $i).Trim()] = $_.Substring($i + 1).Trim()
}

$required = @('NOTION_TOKEN', 'NOTION_PROJECTS_DB_ID', 'NOTION_BLOGS_DB_ID', 'NOTION_BOOKS_DB_ID')
foreach ($key in $required) {
  if (-not $vars[$key]) { throw "Missing $key in .env" }
  $vars[$key] | & $gh secret set $key --repo $repo
  Write-Host "Set secret: $key"
}

# Pages must use Source = GitHub Actions (not "Deploy from a branch" / Jekyll).
$tmp = New-TemporaryFile
try {
  Set-Content -Path $tmp -Value '{"build_type":"workflow"}' -NoNewline
  & $gh api -X PUT "repos/$repo/pages" -H 'Accept: application/vnd.github+json' --input $tmp
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Pages Source set to GitHub Actions."
  } else {
    & $gh api -X POST "repos/$repo/pages" -H 'Accept: application/vnd.github+json' --input $tmp
    Write-Host "Attempted to create Pages with Actions build type."
  }
} catch {
  Write-Host "Could not set Pages via API. Manually: Settings -> Pages -> Source: GitHub Actions"
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

Write-Host "Triggering Deploy to GitHub Pages workflow..."
& $gh workflow run 'Deploy to GitHub Pages' --repo $repo
Write-Host "Done. Site: https://abkaaar.github.io/"
Write-Host "Ignore failures from the old 'pages build and deployment' (Jekyll) workflow."
