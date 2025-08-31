# 邮件控制 Claude Code 自动化系统

通过邮件远程控制 Claude Code 执行任务，并自动接收完整的执行报告。

## 系统架构

```
手机邮件 → GitHub Webhook → GitHub Actions → Claude Code → 执行报告邮件
```

## 功能特点

- ✅ 手机发邮件即可控制
- ✅ 无需科学上网
- ✅ 自动生成详细执行日志
- ✅ 邮件接收完整报告
- ✅ 支持多种编程任务

## 快速开始

1. Fork 这个仓库到你的 GitHub 账号
2. 配置 Repository Secrets
3. 发送邮件到指定地址
4. 等待执行结果邮件

## 邮件格式

发送邮件到：`your-webhook@yourdomain.com`

**邮件主题：** `TASK: [任务描述]`

**邮件内容：**
```
项目路径: /path/to/your/project
任务类型: code | debug | test | deploy
具体要求:
- 修复登录bug
- 添加用户验证
- 运行单元测试
```

## 目录结构

```
claude-code-email-automation/
├── .github/workflows/
│   ├── email-trigger.yml      # 主工作流
│   └── schedule-check.yml     # 定时检查邮件
├── scripts/
│   ├── email-parser.js        # 邮件解析器
│   ├── claude-runner.js       # Claude Code 执行器
│   └── report-sender.js       # 报告发送器
├── config/
│   ├── email-config.json      # 邮件配置
│   └── claude-config.json     # Claude 配置
├── templates/
│   ├── report-template.html   # 报告模板
│   └── error-template.html    # 错误模板
├── README.md                  # 使用说明
└── package.json               # 依赖配置
```