#!/usr/bin/env bash
# ==============================================================================
# CinemAI - Zero-Downtime Native Host Deployment Script (AWS Free Tier)
# Direct Host Architecture: venv + Systemd + Nginx (No Docker)
# ==============================================================================
set -euo pipefail

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/home/ubuntu/cinemai"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
VENV_DIR="${BACKEND_DIR}/venv"
WEB_ROOT="/var/www/cinemai"
CURRENT_USER="${SUDO_USER:-ubuntu}"

echo -e "${CYAN}=================================================================${NC}"
echo -e "${YELLOW}       CinemAI Automated CI/CD Native Host Deployment            ${NC}"
echo -e "${CYAN}=================================================================${NC}"

# Check for root / sudo privileges
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This deployment script must be executed with sudo privileges.${NC}"
   echo "Usage: sudo bash scripts/deploy.sh"
   exit 1
fi

# 1. Pull Latest Source from Repository
echo -e "\n${YELLOW}[1/7] Pulling latest updates from Git origin main...${NC}"
cd "${PROJECT_DIR}"
# Fetch and reset if needed to avoid local merge collisions on server
git fetch --all
git checkout main
git pull origin main

# 2. Activate Python Virtual Environment & Update Dependencies
echo -e "\n${YELLOW}[2/7] Upgrading Python dependencies in virtual environment...${NC}"
if [[ ! -d "${VENV_DIR}" ]]; then
    python3 -m venv "${VENV_DIR}"
fi

"${VENV_DIR}/bin/pip" install --upgrade pip setuptools wheel
"${VENV_DIR}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"

# 3. Ensure NLTK and TextBlob Sentiment Corpora are present
echo -e "\n${YELLOW}[3/7] Verifying NLTK VADER and TextBlob sentiment models...${NC}"
"${VENV_DIR}/bin/python" -c "
import nltk
for pkg in ['vader_lexicon', 'punkt', 'stopwords', 'movie_reviews']:
    try:
        nltk.download(pkg, quiet=True)
    except Exception as e:
        print(f'NLTK error downloading {pkg}: {e}')
" || true

# 4. Build React SPA Production Assets
echo -e "\n${YELLOW}[4/7] Compiling React frontend with Vite & Tailwind CSS...${NC}"
cd "${FRONTEND_DIR}"
npm install --no-audit --prefer-offline
npm run build

# 5. Deploy SPA Bundle to Nginx Web Root
echo -e "\n${YELLOW}[5/7] Deploying build artifacts to ${WEB_ROOT}...${NC}"
mkdir -p "${WEB_ROOT}"
# Clean existing static assets before copying new bundle
rm -rf "${WEB_ROOT:?}"/*
cp -r "${FRONTEND_DIR}/dist"/* "${WEB_ROOT}/"
chown -R "${CURRENT_USER}":www-data "${WEB_ROOT}"
chmod -R 775 "${WEB_ROOT}"

# 6. Restart Backend Service & Reload Nginx
echo -e "\n${YELLOW}[6/7] Reloading systemd service and Nginx reverse proxy...${NC}"
# Copy service file if updated
if [[ -f "${PROJECT_DIR}/scripts/cinemai.service" ]]; then
    cp "${PROJECT_DIR}/scripts/cinemai.service" /etc/systemd/system/cinemai.service
    systemctl daemon-reload
fi

# Test Nginx syntax before reload
nginx -t
systemctl reload nginx
systemctl restart cinemai.service

# 7. Post-Deployment Automated Health Check
echo -e "\n${YELLOW}[7/7] Verifying live service health check endpoint...${NC}"
sleep 2

MAX_RETRIES=5
COUNT=0
HEALTHY=false

while [[ $COUNT -lt $MAX_RETRIES ]]; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/health || true)
    if [[ "$RESPONSE" == "200" ]]; then
        HEALTHY=true
        break
    fi
    echo "Waiting for FastAPI service to respond... ($((COUNT + 1))/$MAX_RETRIES)"
    sleep 2
    COUNT=$((COUNT + 1))
done

if [[ "$HEALTHY" == true ]]; then
    echo -e "${GREEN}=================================================================${NC}"
    echo -e "${GREEN}  ✓ CinemAI Deployment Succeeded! Backend is Healthy (200 OK)    ${NC}"
    echo -e "${GREEN}=================================================================${NC}"
    echo -e "${CYAN}FastAPI Status:${NC} $(systemctl is-active cinemai.service)"
    echo -e "${CYAN}Nginx Status:${NC}   $(systemctl is-active nginx)"
else
    echo -e "${RED}=================================================================${NC}"
    echo -e "${RED}  ✗ Warning: Health check did not return 200 OK                  ${NC}"
    echo -e "${RED}  Check logs using: sudo journalctl -u cinemai.service -n 50     ${NC}"
    echo -e "${RED}=================================================================${NC}"
    exit 1
fi
