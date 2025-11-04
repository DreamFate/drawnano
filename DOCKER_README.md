# Docker 部署指南

## 📦 文件说明

- `Dockerfile` - Docker 镜像构建文件(多阶段构建,优化镜像体积)
- `.dockerignore` - 忽略不需要打包的文件
- `docker-compose.yml` - Docker Compose 配置文件
- `next.config.ts` - 已添加 `output: 'standalone'` 配置

## 🚀 快速开始

### 方法 1: 使用 Docker Compose (推荐)

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方法 2: 使用 Docker 命令

```bash
# 构建镜像
docker build -t drawnano:latest .

# 运行容器
docker run -d -p 3000:3000 --name drawnano drawnano:latest

# 查看日志
docker logs -f drawnano

# 停止容器
docker stop drawnano

# 删除容器
docker rm drawnano
```

## 🌐 访问应用

构建完成后,访问: http://localhost:3000

## 📝 环境变量

如果需要配置环境变量:

1. 创建 `.env.production` 文件
2. 在 `docker-compose.yml` 中取消注释 `env_file` 部分
3. 或在 `docker run` 时使用 `-e` 参数:

```bash
docker run -d -p 3000:3000 \
  -e API_KEY=your_api_key \
  --name drawnano drawnano:latest
```

## 🔧 镜像优化特性

- ✅ 多阶段构建,减小最终镜像体积
- ✅ 使用 Alpine Linux 基础镜像
- ✅ 使用 pnpm 包管理器
- ✅ Next.js standalone 输出模式
- ✅ 非 root 用户运行,提高安全性
- ✅ 生产环境优化配置

## 📊 镜像体积

预计最终镜像大小: ~150-200MB (取决于依赖)

## 🐛 故障排查

### 构建失败

```bash
# 清理缓存重新构建
docker build --no-cache -t drawnano:latest .
```

### 查看容器内部

```bash
# 进入容器
docker exec -it drawnano sh

# 查看文件
ls -la /app
```

### 端口被占用

修改 `docker-compose.yml` 中的端口映射:
```yaml
ports:
  - "8080:3000"  # 将本地端口改为 8080
```

## 🚢 部署到生产环境

### 推送到 Docker Hub

```bash
# 登录
docker login

# 打标签
docker tag drawnano:latest yourusername/drawnano:latest

# 推送
docker push yourusername/drawnano:latest
```

### 推送到私有仓库

```bash
# 打标签
docker tag drawnano:latest registry.example.com/drawnano:latest

# 推送
docker push registry.example.com/drawnano:latest
```

## 📌 注意事项

1. 确保 `pnpm-lock.yaml` 文件存在
2. 如果使用环境变量,不要提交 `.env` 文件到 Git
3. 生产环境建议使用具体版本号标签,而不是 `latest`
