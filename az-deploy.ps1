# PowerShell script to deploy to Azure Web App

Write-Host "Starting deployment script..."

# Set paths
$tempZip = "$env:TEMP\deploy.zip"
$sourcePaths = "React (3)/React/PMA/backend2", "React (3)/React/PMA/frontend"

Write-Host "Collecting files to zip from: $($sourcePaths -join ', ')"

# Get files to include, excluding certain directories
$files = Get-ChildItem -Path $sourcePaths -Recurse | Where-Object {
    $_.FullName -notmatch '\\\.venv|\\node_modules|\\.git|__pycache__'
}

Write-Host "Found $($files.Count) files to include in the zip."

# Create zip
Write-Host "Creating zip archive at $tempZip..."
Compress-Archive -Path $files.FullName -DestinationPath $tempZip -Force

if (Test-Path $tempZip) {
    Write-Host "Zip created successfully."
} else {
    Write-Host "Error: Failed to create zip archive."
    exit 1
}

# Deploy to Azure
Write-Host "Deploying to Azure Web App..."
az webapp deploy --resource-group ashritha --name pma --src-path $tempZip --type zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment completed successfully."
} else {
    Write-Host "Error: Deployment failed."
    exit 1
}