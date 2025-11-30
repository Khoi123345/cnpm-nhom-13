# 🚀 GitHub Actions Auto Deployment Setup

## 📋 Yêu cầu cấu hình GitHub Secrets

Để enable auto deployment lên EC2, bạn cần thêm các secrets sau vào GitHub repository:

### 1. Truy cập GitHub Secrets
1. Vào repository: https://github.com/Khoi123345/cnpm-nhom-13
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 2. Thêm các secrets sau:

#### **EC2_SSH_PRIVATE_KEY**
- **Name**: `EC2_SSH_PRIVATE_KEY`
- **Value**: Nội dung file `aws.pem` (private key)
```bash
# Trên Windows PowerShell:
Get-Content C:\Users\Hoquo\Downloads\aws.pem | clip
# Paste vào GitHub Secret
```

#### **EC2_HOST**
- **Name**: `EC2_HOST`
- **Value**: `ec2-52-195-195-198.ap-northeast-1.compute.amazonaws.com`
hoặc
- **Value**: `52.195.195.198`

#### **EC2_USER**
- **Name**: `EC2_USER`
- **Value**: `ubuntu`

---

## 🔧 Cách thêm Secret trên GitHub

### Bước 1: Copy private key
```powershell
# Mở PowerShell và chạy:
Get-Content C:\Users\Hoquo\Downloads\aws.pem
```

Copy toàn bộ nội dung từ `-----BEGIN RSA PRIVATE KEY-----` đến `-----END RSA PRIVATE KEY-----`

### Bước 2: Thêm vào GitHub
1. Vào: https://github.com/Khoi123345/cnpm-nhom-13/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `EC2_SSH_PRIVATE_KEY`
4. Value: Paste private key content
5. Click **"Add secret"**

### Bước 3: Thêm EC2_HOST
1. Click **"New repository secret"**
2. Name: `EC2_HOST`
3. Value: `ec2-52-195-195-198.ap-northeast-1.compute.amazonaws.com`
4. Click **"Add secret"**

### Bước 4: Thêm EC2_USER
1. Click **"New repository secret"**
2. Name: `EC2_USER`
3. Value: `ubuntu`
4. Click **"Add secret"**

---

## ✅ Kiểm tra sau khi setup

1. Commit và push code lên main branch:
```bash
git add .
git commit -m "feat: add auto deployment to EC2"
git push origin main
```

2. Vào **Actions** tab trên GitHub để xem CI/CD pipeline chạy:
   - https://github.com/Khoi123345/cnpm-nhom-13/actions

3. Pipeline sẽ:
   - ✅ Build frontend
   - ✅ Build các microservices
   - ✅ Build Docker images
   - ✅ Auto deploy lên EC2
   - ✅ Verify deployment

---

## 🔍 Troubleshooting

### Lỗi: "Permission denied (publickey)"
- Kiểm tra lại `EC2_SSH_PRIVATE_KEY` có đúng format không
- Đảm bảo có đầy đủ header/footer: `-----BEGIN RSA PRIVATE KEY-----`

### Lỗi: "Host key verification failed"
- GitHub Actions sẽ tự động add host key, không cần lo

### Lỗi: "docker compose command not found"
- Kiểm tra Docker đã được cài trên EC2
- SSH vào EC2 và chạy: `docker compose version`

### Deployment failed
- Pipeline sẽ tự động rollback về commit trước
- Kiểm tra logs trong GitHub Actions

---

## 📊 Quy trình Deployment

```mermaid
graph LR
    A[Push to main] --> B[Run CI/CD]
    B --> C[Build Services]
    C --> D[Build Docker Images]
    D --> E[SSH to EC2]
    E --> F[Pull Latest Code]
    F --> G[Docker Compose Down]
    G --> H[Rebuild Images]
    H --> I[Start Services]
    I --> J[Verify Deployment]
    J --> K{Success?}
    K -->|Yes| L[✅ Deployed]
    K -->|No| M[❌ Rollback]
```

---

## 🎯 Các tính năng

- ✅ **Auto Pull**: Tự động pull code mới từ GitHub
- ✅ **Zero Downtime**: Stop → Rebuild → Start
- ✅ **Health Check**: Verify services sau khi deploy
- ✅ **Auto Rollback**: Tự động rollback nếu deploy fail
- ✅ **Deployment Summary**: Hiển thị chi tiết deployment

---

## 🔐 Security Notes

- Private key được mã hóa trong GitHub Secrets
- Không bao giờ commit private key vào repository
- SSH connection được secure với known_hosts
- Rollback tự động bảo vệ production environment
