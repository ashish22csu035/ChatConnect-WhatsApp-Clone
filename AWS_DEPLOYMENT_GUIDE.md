# AWS EC2 Deployment Guide

## Prerequisites
- AWS Account
- Docker Hub Account
- Domain (optional)

## Steps

### 1. Create EC2 Instance
- Launch Ubuntu 22.04 t2.micro
- Configure security groups (ports 22, 80, 443, 5000)
- Download key pair (.pem file)

### 2. Connect via SSH
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 3. Install Docker
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu
```

### 4. Deploy App
```bash
mkdir chatconnect && cd chatconnect
nano .env  # Add your environment variables
nano docker-compose.yml  # Add production config
docker-compose up -d
```

### 5. Setup GitHub Actions
Add secrets in GitHub:
- DOCKER_USERNAME
- DOCKER_PASSWORD
- EC2_HOST
- EC2_SSH_KEY

Done! Your app is live at http://YOUR_EC2_IP
