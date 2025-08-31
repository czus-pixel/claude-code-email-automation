# 🎯 立即部署指南 - czus@qq.com 专用

## ⚡ 5分钟快速部署

### 第1步：获取QQ邮箱授权码 (2分钟)
1. 打开 https://mail.qq.com
2. 设置 → 账户 → POP3/IMAP/SMTP服务
3. 开启"IMAP/SMTP服务"
4. 发短信验证，获取**16位授权码**
5. **⚠️ 保存这个授权码！**

### 第2步：GitHub仓库配置 (2分钟)
1. 将项目文件上传到您的GitHub仓库
2. 仓库 Settings → Secrets → New repository secret
3. 添加以下8个secrets：

```
ANTHROPIC_API_KEY = sj-179e61d62e1a4bdebe2bffdbcaedb8cb
GMAIL_USER = czus@qq.com  
GMAIL_PASS = 您的16位QQ邮箱授权码
IMAP_HOST = imap.qq.com
IMAP_PORT = 993
SMTP_HOST = smtp.qq.com  
SMTP_PORT = 587
SMTP_USER = czus@qq.com
SMTP_PASS = 您的16位QQ邮箱授权码
```

### 第3步：测试系统 (1分钟)
发送测试邮件到 **czus@qq.com**：

**主题：**
```
TASK: 测试系统
```

**内容：**  
```
项目路径: .
任务类型: code
具体要求:
- 创建Hello World程序
- 输出当前时间
```

## 🎉 完成！

- ✅ 系统每5分钟自动检查邮件
- ✅ 执行完成后自动发送报告到 czus@qq.com
- ✅ 手机发邮件即可控制，无需开电脑

## 📱 日常使用

直接用手机QQ邮箱发送任务邮件：
- **主题必须包含：** `TASK: 任务描述`
- **收件人：** czus@qq.com (发给自己)
- **系统会自动执行并回复结果**

## 🔧 故障处理

**如果15分钟内没收到回复：**
1. 检查GitHub Actions是否运行
2. 确认QQ邮箱授权码正确
3. 查看垃圾邮件文件夹

**GitHub Actions地址：**
`https://github.com/你的用户名/claude-code-email-automation/actions`