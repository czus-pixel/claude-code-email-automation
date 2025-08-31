# 🚀 您的专属配置指南

## 📧 QQ邮箱配置步骤

### 1. 开启QQ邮箱IMAP/SMTP服务
1. 登录QQ邮箱：https://mail.qq.com
2. 点击"设置" → "账户" 
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"IMAP/SMTP服务"
5. 按提示发送短信获取**授权码**（16位）
6. **重要：记住这个授权码，这就是您的邮箱密码！**

### 2. GitHub Repository Secrets 配置

在您的GitHub仓库 Settings → Secrets and variables → Actions 中添加：

```bash
# 🔑 Anthropic API
ANTHROPIC_API_KEY=sj-179e61d62e1a4bdebe2bffdbcaedb8cb

# 📧 QQ邮箱接收配置
GMAIL_USER=czus@qq.com
GMAIL_PASS=您从QQ邮箱获取的16位授权码
IMAP_HOST=imap.qq.com
IMAP_PORT=993

# 📤 QQ邮箱发送配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=czus@qq.com
SMTP_PASS=您从QQ邮箱获取的16位授权码
```

## 🎯 快速测试

### 发送第一个测试任务
**向 czus@qq.com 发送邮件：**

**主题：**
```
TASK: 创建Python计算器
```

**内容：**
```
项目路径: .
任务类型: code
具体要求:
- 创建一个简单的计算器程序
- 支持加减乘除运算
- 添加用户输入验证
- 包含使用说明
```

### 预期结果
1. **5分钟内**系统检测到您的邮件
2. **几分钟后**Claude Code开始执行任务
3. **执行完成后**您会收到详细报告邮件，包含：
   - ✅ 执行状态（成功/失败）
   - 📝 详细执行日志
   - 📎 附件：完整日志文件
   - 🕐 执行时间统计

## 📱 手机使用指南

### 邮件格式模板（复制使用）
```
主题：TASK: [任务描述]

内容：
项目路径: .
任务类型: code
具体要求:
- [要求1]
- [要求2] 
- [要求3]
```

### 常用任务类型
- `code` - 代码开发
- `debug` - 调试修复
- `test` - 测试相关
- `deploy` - 部署构建

## 🔧 故障排除

### 如果没收到报告邮件
1. 检查垃圾邮件文件夹
2. 确认QQ邮箱授权码正确
3. 在GitHub Actions页面查看运行日志

### 常见错误
- **IMAP连接失败** → 检查授权码和IMAP设置
- **API调用失败** → 检查Anthropic API密钥
- **任务执行超时** → 简化任务要求

## 📞 联系方式
如有问题，请发邮件到 czus@qq.com 反馈。