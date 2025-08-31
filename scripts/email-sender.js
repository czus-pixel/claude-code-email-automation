const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');

class EmailSender {
  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    if (!this.config.auth.user || !this.config.auth.pass) {
      throw new Error('SMTP credentials are required');
    }
  }

  async sendReport() {
    try {
      const recipientEmail = process.env.RECIPIENT_EMAIL;
      const reportHtml = process.env.REPORT_HTML;
      const reportSubject = process.env.REPORT_SUBJECT || 'Claude Code 执行报告';

      if (!recipientEmail) {
        throw new Error('Recipient email is required');
      }

      if (!reportHtml) {
        throw new Error('Report HTML is required');
      }

      console.log(`Sending email to: ${recipientEmail}`);
      console.log(`Subject: ${reportSubject}`);

      // 创建邮件传输器
      const transporter = nodemailer.createTransporter(this.config);

      // 验证连接配置
      await transporter.verify();
      console.log('SMTP server connection verified');

      // 准备附件
      const attachments = await this.prepareAttachments();

      // 发送邮件
      const mailOptions = {
        from: {
          name: 'Claude Code Automation',
          address: this.config.auth.user
        },
        to: recipientEmail,
        subject: reportSubject,
        html: reportHtml,
        attachments: attachments,
        // 设置邮件优先级
        priority: 'normal',
        // 添加邮件头
        headers: {
          'X-Mailer': 'Claude Code Email Automation v1.0',
          'X-Priority': '3'
        }
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
      console.log('Message ID:', info.messageId);

      // 记录发送日志
      await this.logEmailSent(recipientEmail, reportSubject, info);

      return {
        success: true,
        messageId: info.messageId,
        recipient: recipientEmail
      };

    } catch (error) {
      console.error('Failed to send email:', error);
      
      // 记录错误日志
      await this.logEmailError(error);
      
      throw error;
    }
  }

  async prepareAttachments() {
    const attachments = [];
    
    try {
      // 添加执行日志文件
      const logsDir = path.join(process.cwd(), 'logs');
      if (await fs.pathExists(logsDir)) {
        const logFiles = await fs.readdir(logsDir);
        for (const logFile of logFiles.slice(-3)) { // 只附加最近的3个日志文件
          const logPath = path.join(logsDir, logFile);
          if ((await fs.stat(logPath)).isFile()) {
            attachments.push({
              filename: logFile,
              path: logPath,
              contentType: 'application/json'
            });
          }
        }
      }

      // 添加生成的报告文件
      const reportsDir = path.join(process.cwd(), 'reports');
      if (await fs.pathExists(reportsDir)) {
        const reportFiles = await fs.readdir(reportsDir);
        for (const reportFile of reportFiles.slice(-1)) { // 只附加最新的报告文件
          const reportPath = path.join(reportsDir, reportFile);
          if ((await fs.stat(reportPath)).isFile() && reportFile.endsWith('.html')) {
            attachments.push({
              filename: reportFile,
              path: reportPath,
              contentType: 'text/html'
            });
          }
        }
      }

      console.log(`Prepared ${attachments.length} attachments`);
      
    } catch (error) {
      console.log('Error preparing attachments:', error.message);
      // 不要因为附件问题而失败，继续发送邮件
    }

    return attachments;
  }

  async logEmailSent(recipient, subject, info) {
    const logData = {
      timestamp: new Date().toISOString(),
      recipient,
      subject,
      messageId: info.messageId,
      status: 'sent',
      response: info.response
    };

    const logFile = path.join(process.cwd(), 'logs', 'email-sent.log');
    await fs.ensureDir(path.dirname(logFile));
    
    const logEntry = JSON.stringify(logData) + '\n';
    await fs.appendFile(logFile, logEntry);
  }

  async logEmailError(error) {
    const logData = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      status: 'failed'
    };

    const logFile = path.join(process.cwd(), 'logs', 'email-errors.log');
    await fs.ensureDir(path.dirname(logFile));
    
    const logEntry = JSON.stringify(logData) + '\n';
    await fs.appendFile(logFile, logEntry);
  }

  // 发送测试邮件的方法
  async sendTestEmail(recipientEmail) {
    const testHtml = `
      <h2>🧪 Claude Code Email Automation 测试</h2>
      <p>这是一封测试邮件，用于验证邮件发送功能是否正常工作。</p>
      <p><strong>发送时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
      <p>如果您收到这封邮件，说明邮件系统配置成功！</p>
      <hr>
      <p><small>🤖 Claude Code Email Automation v1.0</small></p>
    `;

    const transporter = nodemailer.createTransporter(this.config);
    
    const info = await transporter.sendMail({
      from: {
        name: 'Claude Code Automation Test',
        address: this.config.auth.user
      },
      to: recipientEmail,
      subject: '🧪 Claude Code Email Automation 测试邮件',
      html: testHtml
    });

    console.log('Test email sent:', info.messageId);
    return info;
  }
}

async function main() {
  try {
    const sender = new EmailSender();
    
    // 如果是测试模式
    if (process.env.TEST_MODE === 'true') {
      const testEmail = process.env.TEST_EMAIL || process.env.RECIPIENT_EMAIL;
      if (!testEmail) {
        throw new Error('Test email address is required');
      }
      await sender.sendTestEmail(testEmail);
      console.log('Test email sent successfully!');
    } else {
      // 正常发送报告
      await sender.sendReport();
      console.log('Report email sent successfully!');
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EmailSender;