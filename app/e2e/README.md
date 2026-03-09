# 白牌 AI 平台 E2E

这个目录存放网页级真实回归脚本。当前 smoke 已切换到**最终交付形态**：

1. 启动构建后的单个服务端进程
2. 等待 `/health` 与 `/ready`
3. 直接访问服务端托管的前台静态站点
4. 页面录入真实 API Key，完成一个真实应用闭环
5. 补充后台登录页 smoke
6. 生成截图与 `summary.json`

## 使用方式

```bash
cd app
RUNNINGHUB_E2E_API_KEY=你的key \
DATABASE_URL=postgresql://... \
ADMIN_DEFAULT_USERNAME=admin \
ADMIN_DEFAULT_PASSWORD=... \
SESSION_SECRET=... \
npm run test:e2e
```

## 必填环境变量

- `RUNNINGHUB_E2E_API_KEY`：真实上游 API Key
- `DATABASE_URL`：服务端数据库连接串
- `ADMIN_DEFAULT_USERNAME`：默认后台管理员用户名
- `ADMIN_DEFAULT_PASSWORD`：默认后台管理员密码
- `SESSION_SECRET`：后台会话密钥

## 可选环境变量

- `RUNNINGHUB_E2E_SERVER_PORT`：本次 smoke 启动端口，默认 `8787`
- `RUNNINGHUB_E2E_FILE_APP1`：应用一输入图
- `RUNNINGHUB_E2E_FILE_APP2`：应用二输入图
- `RUNNINGHUB_E2E_PROMPT_APP2`：应用二提示词
- `RUNNINGHUB_E2E_BROWSER_PATH`：Chrome / Chromium 路径
- `RUNNINGHUB_E2E_ARTIFACT_DIR`：截图与 `summary.json` 输出目录
- `RUNNINGHUB_E2E_DEBUG=1`：输出浏览器请求调试日志

## 默认素材

- `../skills/runninghub-api-dev/assets/test-inputs/livingroom-green-sofa-pexels.jpg`
- `../skills/runninghub-api-dev/assets/test-inputs/livingroom-gray-sofa-pexels.jpg`

## 产物

运行完成后会在 `app/e2e/artifacts/latest/` 下生成：

- 两个真实应用截图
- `admin-login.png`
- `summary.json`
