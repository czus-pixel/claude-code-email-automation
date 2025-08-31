# 🚀 Claude Code Email Automation 部署指南

## 📋 配置步骤

### 1. 创建 GitHub 仓库
1. 将所有文件上传到您的 GitHub 仓库
2. 确保 `.github/workflows/` 目录下的 workflow 文件已正确上传

### 2. 配置 Repository Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下 secrets：

#### 🔐 必需的 Secrets

```bash
# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 邮件接收配置 (IMAP)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# 邮件发送配置 (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 📧 Gmail 配置指南

1. **开启两步验证**：在 Google 账户设置中开启
2. **生成应用专用密码**：
   - 访问 [Google App Passwords](https://myaccount.google.com/apppasswords)
   - 选择 "Mail" 和设备类型
   - 复制生成的16位密码作为 `GMAIL_PASS` 和 `SMTP_PASS`

### 3. 测试配置

#### 手动测试工作流
1. 在 GitHub 仓库中，点击 "Actions" 标签
2. 选择 "Email Triggered Claude Code Automation"
3. 点击 "Run workflow"
4. 填写测试参数并运行

#### 发送测试邮件
```bash
# 在 Actions 中设置 TEST_MODE=true 运行工作流
# 或者通过邮件发送测试任务
```

## 📮 使用方法

### 发送任务邮件

**发送到您配置的邮箱地址**

**邮件主题格式：**
```
TASK: 修复用户登录bug
```

**邮件内容格式：**
```
项目路径: https://github.com/username/project.git
任务类型: debug
具体要求:
- 检查登录验证逻辑
- 修复密码加密问题
- 添加错误处理
- 运行相关测试
```

### 邮件格式说明

| 字段 | 必需 | 说明 | 示例 |
|------|------|------|------|
| 主题 | ✅ | 必须包含 "TASK:" | `TASK: 优化数据库查询性能` |
| 项目路径 | ⭕ | Git 仓库 URL 或 "." | `https://github.com/user/repo.git` |
| 任务类型 | ⭕ | code/debug/test/deploy | `debug` |
| 具体要求 | ⭕ | 以 "-" 开头的列表 | `- 优化 SQL 查询` |

## 🔧 高级配置

### 自定义邮件模板

在 `templates/` 目录下创建：
- `success-report.html` - 成功报告模板
- `error-report.html` - 错误报告模板

### 修改检查频率

编辑 `.github/workflows/email-trigger.yml`：
```yaml
schedule:
  - cron: '*/10 * * * *'  # 改为每10分钟检查一次
```

### 添加自定义任务类型

在 `scripts/claude-runner.js` 中的 `buildClaudeCommand` 方法添加新的任务类型处理。

## 📊 监控和日志

### 查看执行日志
1. GitHub Actions 页面查看工作流运行历史
2. 下载 Artifacts 获取详细日志文件
3. 检查邮件中的附件日志

### 常见问题排查

#### 邮件无法接收
```bash
# 检查 IMAP 配置
# 确认 Gmail 应用专用密码正确
# 验证两步验证已开启
```

#### Claude Code 执行失败
```bash
# 检查 ANTHROPIC_API_KEY 是否正确
# 确认 API 配额未超限
# 查看详细错误日志
```

#### 邮件发送失败
```bash
# 检查 SMTP 配置
# 验证应用专用密码
# 确认网络连接正常
```

## 🚀 快速开始示例

### 1. 发送第一个任务
```
主题：TASK: 创建Hello World程序
内容：
项目路径: .
任务类型: code
具体要求:
- 创建一个简单的Hello World程序
- 使用Python语言
- 添加基本的文档注释
```

### 2. 等待执行结果
- 系统会在5分钟内检测到邮件
- Claude Code 执行任务（可能需要几分钟）
- 您将收到详细的执行报告邮件

### 3. 查看完整日志
- 邮件中包含基本结果
- 下载附件获取完整执行日志
- GitHub Actions 页面查看详细流程

## 📋 支持的任务类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `code` | 代码开发 | 新功能开发、代码编写 |
| `debug` | 调试修复 | Bug 修复、问题排查 |
| `test` | 测试相关 | 单元测试、集成测试 |
| `deploy` | 部署相关 | 构建、部署、发布 |

## 🔄 系统架构

```
手机邮件 → Gmail IMAP → GitHub Actions → Claude Code → 执行结果 → SMTP → 用户邮箱
```

整个流程完全自动化，无需人工干预！