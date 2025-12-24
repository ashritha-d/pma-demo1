#!/bin/bash

# Azure Deployment Script for Property Management App

# Variables
RESOURCE_GROUP="pma-resource-group"
APP_NAME="pma-backend"
LOCATION="eastus"
FRONTEND_DIR="React (3)/React/PMA/frontend"
BACKEND_DIR="bend"

# Login to Azure (uncomment if needed)
# az login

# Create resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan
echo "Creating App Service Plan..."
az appservice plan create --name pma-plan --resource-group $RESOURCE_GROUP --sku FREE

# Create Web App for backend
echo "Creating Web App..."
az webapp create --resource-group $RESOURCE_GROUP --plan pma-plan --name $APP_NAME --runtime "PYTHON:3.9"

# Build frontend
echo "Building frontend..."
cd "$FRONTEND_DIR"
npm install
npm run build

# Copy built frontend to backend static folder
echo "Copying frontend build to backend..."
cp -r build/* ../backend2/build/

# Deploy backend
echo "Deploying backend..."
cd "../../$BACKEND_DIR"
az webapp up --name $APP_NAME --resource-group $RESOURCE_GROUP --src-path .

echo "Deployment complete. App available at: https://$APP_NAME.azurewebsites.net"