# HEPHA-RNA Design Challenge

线下 iGEM 推广活动用的 RNA 设计竞赛 Web App。第一版**不自动运行 Boltz**：用户提交序列，管理员在外部计算后录入分数，排行榜自动更新。

## 本地开发

需要 Python 3.11+ 和 Node 20+。

```bash
cp .env.example .env
# 把 JWT_SECRET 换成随机字符串：
# python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

后端（端口 **8001**）：

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
chmod +x scripts/*.sh
./scripts/dev-backend.sh
```

创建管理员（不要使用 `admin/admin`）：

```bash
cd backend
../.venv/bin/python -m app.create_admin --username YOUR_ADMIN --password 'YOUR_PASSWORD'
```

前端（端口 **3000**）：

```bash
./scripts/dev-frontend.sh
```

开发时前端会把 `/api` 代理到 `http://127.0.0.1:8001`。浏览器打开：

```text
http://localhost:3000
```

运行测试：

```bash
.venv/bin/pytest backend/tests -q
```

## 活动配置

全部在 `.env`，不要写进代码：

| 变量 | 作用 |
| --- | --- |
| `JWT_SECRET` | JWT 签名密钥，生产环境必须更换 |
| `DATABASE_URL` | SQLite 路径 |
| `MIN_RNA_LENGTH` / `MAX_RNA_LENGTH` | RNA 长度限制 |
| `MAX_SUBMISSIONS_PER_USER` | 每人提交上限 |
| `CHALLENGE_START_TIME` / `CHALLENGE_END_TIME` | 活动窗口，ISO 8601。结束后禁止新提交，仍可查看排行榜和补录分数 |
| `FRONTEND_URL` | CORS 来源 |
| `MINECRAFT_SERVER_ADDRESS` / `MINECRAFT_INFO` | Minecraft Bio Lab 说明页 |

活动结束后的投屏排行榜：

```text
http://SERVER_IP:3000/leaderboard?kiosk=1
```

## 部署到 Digital Ocean（目录：`/hepharna`，端口：3000）

不要改现有 Nginx 的 80/443，也不要停掉已经在跑的程序。生产环境由一个 uvicorn 同时提供页面和 API，只听 **3000**。项目装在服务器根目录下的 **`/hepharna`**。

SSH 进 droplet 后按下面做。

### 1. 建目录

```bash
sudo mkdir -p /hepharna
sudo chown "$USER:$USER" /hepharna
```

### 2. 把代码放到 `/hepharna`

本机 rsync 经常因为权限/路径失败，直接在服务器上取代码更稳。任选一种：

**有 Git 仓库：**

```bash
git clone YOUR_REPO_URL /hepharna
```

如果目录已经存在且是空的：

```bash
cd /hepharna
git clone YOUR_REPO_URL .
```

**没有 Git：** 在本机打包，再用 scp 传一个 tar（比 rsync 简单）：

```bash
# 本机项目根目录
tar czf /tmp/hepharna.tar.gz \
  --exclude .venv --exclude node_modules --exclude frontend/node_modules \
  --exclude frontend/dist --exclude backend/data --exclude backups --exclude .env \
  .

scp /tmp/hepharna.tar.gz ubuntu@YOUR_DROPLET_IP:/tmp/
ssh ubuntu@YOUR_DROPLET_IP 'tar xzf /tmp/hepharna.tar.gz -C /hepharna'
```

### 3. 在服务器上安装并构建

```bash
cd /hepharna
sudo apt-get update
sudo apt-get install -y python3-venv python3-pip
chmod +x scripts/*.sh
./scripts/setup-server.sh
```

Ubuntu 自带 Node 可能偏旧。`npm run build` 失败的话，先装 Node 20+ 再重新跑 `./scripts/setup-server.sh`。

### 4. 改 `.env`

```bash
nano /hepharna/.env
```

把这一行改成你的公网 IP：

```text
FRONTEND_URL=http://YOUR_DROPLET_IP:3000
```

脚本已经生成过 `JWT_SECRET`，不要再改成空的。

### 5. systemd 常驻 3000

如果 SSH 用户不是 `ubuntu`，先改 `deploy/hepha-rna.service` 里的 `User=`。

```bash
sudo cp /hepharna/deploy/hepha-rna.service /etc/systemd/system/hepha-rna.service
sudo systemctl daemon-reload
sudo systemctl enable --now hepha-rna
sudo systemctl status hepha-rna
sudo ufw allow 3000/tcp
```

Digital Ocean Cloud Firewall 如果开着，也加一条入站 TCP 3000。

### 6. 创建管理员

```bash
cd /hepharna/backend
../.venv/bin/python -m app.create_admin --username YOUR_ADMIN --password 'YOUR_PASSWORD'
```

打开：

```text
http://YOUR_DROPLET_IP:3000
http://YOUR_DROPLET_IP:3000/leaderboard?kiosk=1
```

### 更新

代码更新后在服务器：

```bash
cd /hepharna
git pull          # 如果是 git 部署
./scripts/setup-server.sh
sudo systemctl restart hepha-rna
```

备份 cron：

```cron
0 * * * * /hepharna/scripts/backup.sh
```

不需要 Nginx。`nginx/hepha-rna.conf` 只是备用，不要覆盖现有站点。

## 备份

SQLite 文件在 `backend/data/hepha_rna.sqlite`。活动期间建议每小时备份：

```bash
./scripts/backup.sh
```

会写到 `backups/backup_HHMM.sqlite`。可用 cron：

```cron
0 * * * * /hepharna/scripts/backup.sh
```

## 管理员现场流程

1. 打开 `/admin/submissions`，筛选 Pending
2. 进入设计，复制 RNA sequence
3. 外部运行 Boltz
4. 录入 Overall Score，先 Save 再 Publish
5. 排行榜约 5 秒内刷新

用户提交接口**不接受 score**。分数只能走 Admin API。
