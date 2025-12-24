# PowerShell script to run both backend and frontend

Write-Host "Starting backend and frontend..."

# Start backend
Start-Process -FilePath "cmd" -ArgumentList "/k cd bend && python app.py"

# Start frontend
Start-Process -FilePath "cmd" -ArgumentList "/k cd `"React (3)/React/PMA/frontend`" && npm start"

Write-Host "Both services started. Backend on localhost:5000, Frontend on localhost:3000"