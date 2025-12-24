# PowerShell script to deploy to Azure Web App

Write-Host "Starting deployment script..."

# Set paths
$tempZip = "$env:TEMP\deploy.zip"
$tempDir = "$env:TEMP\deploy"

Write-Host "Creating temp directory at $tempDir..."
New-Item -ItemType Directory -Path $tempDir -Force

Write-Host "Copying backend files..."
Copy-Item "React (3)/React/PMA/backend2\*" $tempDir -Recurse -Force

Write-Host "Copying frontend files..."
Copy-Item "React (3)/React/PMA/frontend\*" "$tempDir\frontend" -Recurse -Force

# Get files to include, excluding certain directories
$files = Get-ChildItem -Path $tempDir -Recurse | Where-Object {
    $_.FullName -notmatch '\\\.venv|\\node_modules|\\.git|__pycache__'
}

Write-Host "Found $($files.Count) files to include in the zip."

# Create zip
Write-Host "Creating zip archive at $tempZip..."
Compress-Archive -Path $files.FullName -DestinationPath $tempZip -Force

# Clean up temp dir
Remove-Item $tempDir -Recurse -Force

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