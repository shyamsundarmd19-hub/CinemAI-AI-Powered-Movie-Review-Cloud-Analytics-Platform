#!/usr/bin/env bash
# ==============================================================================
# CinemAI - Cloud-Native AI-Powered Movie Review & Sentiment Network
# Automated EC2 Ubuntu Setup Script (AWS Free Tier - No Docker)
# ==============================================================================
set -euo pipefail

# Color palette for terminal logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=================================================================${NC}"
echo -e "${YELLOW}  Starting CinemAI EC2 Automated Deployment (AWS Free Tier)      ${NC}"
echo -e "${CYAN}=================================================================${NC}"

# Check for root / sudo privileges
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This setup script must be run with sudo privileges.${NC}"
   echo "Usage: sudo bash scripts/setup_ec2.sh"
   exit 1
fi

PROJECT_DIR="/home/ubuntu/cinemai"
BACKEND_DIR="${PROJECT_DIR}/backend"
VENV_DIR="${BACKEND_DIR}/venv"
WEB_ROOT="/var/www/cinemai"
CURRENT_USER="${SUDO_USER:-ubuntu}"

# 1. Update system packages
echo -e "\n${YELLOW}[1/8] Updating package index and installing dependencies...${NC}"
apt-get update -y
apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libpq-dev \
    nginx \
    git \
    curl \
    ufw

# 2. Install Node.js 20 LTS (for building React frontend directly on EC2 if needed)
echo -e "\n${YELLOW}[2/8] Checking / Installing Node.js LTS (v20)...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo -e "${GREEN}Node.js version: $(node -v) | npm version: $(npm -v)${NC}"

# 3. Create Webroot Directory for React SPA
echo -e "\n${YELLOW}[3/8] Configuring web root directory at ${WEB_ROOT}...${NC}"
mkdir -p "${WEB_ROOT}"
chown -R "${CURRENT_USER}":www-data "${WEB_ROOT}"
chmod -R 775 "${WEB_ROOT}"

# Create a temporary landing page if React build is not yet deployed
if [[ ! -f "${WEB_ROOT}/index.html" ]]; then
    cat <<EOF > "${WEB_ROOT}/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CinemAI - Movie Review & Sentiment Analytics</title>
  <style>
    body {
      background-color: #FEFCE8;
      color: #881337;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background-color: #FFFBEB;
      border: 1px solid #FECDD3;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.1);
      text-align: center;
      max-width: 520px;
    }
    h1 { margin-top: 0; color: #E11D48; }
    .badge {
      display: inline-block;
      background: #E11D48;
      color: #FFF;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    a { color: #E11D48; font-weight: bold; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">AWS Free Tier Host Active</div>
    <h1>CinemAI Network</h1>
    <p>FastAPI Backend is running and Nginx is configured.</p>
    <p>Deploy your React production build to <code>${WEB_ROOT}</code>.</p>
    <p><a href="/api/docs" target="_blank">View Interactive API Docs &rarr;</a></p>
  </div>
</body>
</html>
EOF
fi

# 4. Set up Python Virtual Environment (venv)
echo -e "\n${YELLOW}[4/8] Initializing Python virtual environment in ${VENV_DIR}...${NC}"
mkdir -p "${BACKEND_DIR}"
if [[ ! -d "${VENV_DIR}" ]]; then
    python3 -m venv "${VENV_DIR}"
fi

# 5. Upgrade pip & Install Backend Requirements
echo -e "\n${YELLOW}[5/8] Installing Python dependencies from requirements.txt...${NC}"
"${VENV_DIR}/bin/pip" install --upgrade pip setuptools wheel

if [[ -f "${BACKEND_DIR}/requirements.txt" ]]; then
    "${VENV_DIR}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"
else
    echo -e "${RED}[WARNING] requirements.txt not found in ${BACKEND_DIR}. Skipping pip install.${NC}"
fi

# 6. Download NLTK and TextBlob sentiment corpora
echo -e "\n${YELLOW}[6/8] Downloading NLTK and TextBlob sentiment analysis corpora...${NC}"
"${VENV_DIR}/bin/python" -c "
import nltk
packages = ['vader_lexicon', 'punkt', 'stopwords', 'movie_reviews']
for pkg in packages:
    try:
        nltk.download(pkg, quiet=True)
        print(f'Downloaded NLTK: {pkg}')
    except Exception as e:
        print(f'Error downloading {pkg}: {e}')
" || true

"${VENV_DIR}/bin/python" -m textblob.download_corpora lite || true

# 7. Configure and Enable Systemd Service for FastAPI
echo -e "\n${YELLOW}[7/8] Configuring systemd service for FastAPI (cinemai.service)...${NC}"
SERVICE_FILE="/etc/systemd/system/cinemai.service"

if [[ -f "${PROJECT_DIR}/scripts/cinemai.service" ]]; then
    cp "${PROJECT_DIR}/scripts/cinemai.service" "${SERVICE_FILE}"
else
    echo -e "${RED}[ERROR] ${PROJECT_DIR}/scripts/cinemai.service not found!${NC}"
    exit 1
fi

systemctl daemon-reload
systemctl enable cinemai.service
systemctl restart cinemai.service

# 8. Configure and Test Nginx Reverse Proxy
echo -e "\n${YELLOW}[8/8] Configuring Nginx reverse proxy...${NC}"
NGINX_AVAILABLE="/etc/nginx/sites-available/cinemai"
NGINX_ENABLED="/etc/nginx/sites-enabled/cinemai"

if [[ -f "${PROJECT_DIR}/scripts/nginx.conf" ]]; then
    cp "${PROJECT_DIR}/scripts/nginx.conf" "${NGINX_AVAILABLE}"
    
    # Remove default site if present
    if [[ -f /etc/nginx/sites-enabled/default ]]; then
        rm -f /etc/nginx/sites-enabled/default
    fi
    
    # Enable CinemAI site
    ln -sf "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
    
    # Test configuration
    nginx -t
    systemctl restart nginx
else
    echo -e "${RED}[ERROR] ${PROJECT_DIR}/scripts/nginx.conf not found!${NC}"
    exit 1
fi

# Ensure correct file permissions across project directory
chown -R "${CURRENT_USER}":"${CURRENT_USER}" "${PROJECT_DIR}"

echo -e "\n${GREEN}=================================================================${NC}"
echo -e "${GREEN}  CinemAI EC2 Setup Complete Successfully!                      ${NC}"
echo -e "${GREEN}=================================================================${NC}"
echo -e "${CYAN}FastAPI Service Status:${NC}"
systemctl is-active cinemai.service || true
echo -e "${CYAN}Nginx Service Status:${NC}"
systemctl is-active nginx || true
echo -e "${YELLOW}API Docs Available at: http://<EC2-PUBLIC-IP>/api/docs${NC}"
echo -e "${YELLOW}Web App Available at:  http://<EC2-PUBLIC-IP>/${NC}"
