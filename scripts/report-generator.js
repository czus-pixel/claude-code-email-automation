const fs = require('fs-extra');
const path = require('path');
const Mustache = require('mustache');

class ReportGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.reportsDir = path.join(process.cwd(), 'reports');
    fs.ensureDirSync(this.reportsDir);
  }

  async generateReport() {
    try {
      const executionStatus = process.env.EXECUTION_STATUS || 'failure';
      const taskOutput = process.env.TASK_OUTPUT || '';
      const errorMessage = process.env.ERROR_MESSAGE || '';
      const userEmail = process.env.USER_EMAIL || '';
      
      // 读取任务数据
      let taskData = {};
      try {
        taskData = JSON.parse(await fs.readFile('current-task.json', 'utf8'));
      } catch (error) {
        console.log('No task data found, using minimal data');
      }

      const reportData = {
        success: executionStatus === 'success',
        taskId: taskData.id || `task-${Date.now()}`,
        description: taskData.description || 'Unknown task',
        userEmail,
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleString('zh-CN'),
        duration: this.calculateDuration(taskData.timestamp),
        output: this.formatOutput(taskOutput),
        error: errorMessage,
        requirements: taskData.requirements || [],
        projectPath: taskData.projectPath || '.',
        taskType: taskData.taskType || 'code'
      };

      // 生成 HTML 报告
      const htmlReport = await this.generateHTMLReport(reportData);
      
      // 生成邮件主题
      const subject = this.generateSubject(reportData);

      // 保存报告
      const reportFile = path.join(this.reportsDir, `${reportData.taskId}_report.html`);
      await fs.writeFile(reportFile, htmlReport);

      // 设置 GitHub Actions 输出
      const core = require('@actions/core');
      core.setOutput('report_html', htmlReport);
      core.setOutput('subject', subject);
      core.setOutput('report_file', reportFile);

      console.log(`Report generated: ${reportFile}`);
      console.log(`Subject: ${subject}`);

      return { htmlReport, subject, reportFile };

    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async generateHTMLReport(data) {
    const templateFile = data.success ? 'success-report.html' : 'error-report.html';
    const templatePath = path.join(this.templatesDir, templateFile);
    
    let template;
    try {
      template = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      console.log(`Template ${templateFile} not found, using default template`);
      template = this.getDefaultTemplate(data.success);
    }

    return Mustache.render(template, data);
  }

  getDefaultTemplate(success) {
    if (success) {
      return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code 执行报告 - 成功</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .status { background: #d4edda; color: #155724; padding: 15px; margin: 20px; border-radius: 5px; border-left: 4px solid #28a745; }
        .content { padding: 20px; }
        .section { margin-bottom: 30px; }
        .section h3 { color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px; }
        .output-box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; font-family: 'Courier New', monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .requirements { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #dee2e6; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Claude Code 执行成功</h1>
            <p>任务ID: {{taskId}}</p>
        </div>
        
        <div class="status">
            <strong>状态：</strong>任务执行成功完成 | <strong>执行时间：</strong>{{formattedTime}} | <strong>耗时：</strong>{{duration}}
        </div>

        <div class="content">
            <div class="section">
                <h3>📋 任务信息</h3>
                <p><strong>描述：</strong>{{description}}</p>
                <p><strong>类型：</strong>{{taskType}}</p>
                <p><strong>项目路径：</strong>{{projectPath}}</p>
                {{#requirements.length}}
                <div class="requirements">
                    <strong>具体要求：</strong>
                    <ul>
                        {{#requirements}}
                        <li>{{.}}</li>
                        {{/requirements}}
                    </ul>
                </div>
                {{/requirements.length}}
            </div>

            <div class="section">
                <h3>📄 执行输出</h3>
                <div class="output-box">{{output}}</div>
            </div>
        </div>

        <div class="footer">
            <p>🤖 通过 Claude Code Email Automation 自动生成</p>
            <p><small>如有问题，请回复此邮件或联系系统管理员</small></p>
        </div>
    </div>
</body>
</html>`;
    } else {
      return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code 执行报告 - 失败</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .status { background: #f8d7da; color: #721c24; padding: 15px; margin: 20px; border-radius: 5px; border-left: 4px solid #dc3545; }
        .content { padding: 20px; }
        .section { margin-bottom: 30px; }
        .section h3 { color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px; }
        .error-box { background: #f8f9fa; border: 1px solid #dc3545; border-radius: 5px; padding: 15px; font-family: 'Courier New', monospace; white-space: pre-wrap; color: #721c24; }
        .requirements { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #dee2e6; }
        .error-icon { font-size: 48px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="error-icon">❌</div>
            <h1>Claude Code 执行失败</h1>
            <p>任务ID: {{taskId}}</p>
        </div>
        
        <div class="status">
            <strong>状态：</strong>任务执行失败 | <strong>执行时间：</strong>{{formattedTime}} | <strong>耗时：</strong>{{duration}}
        </div>

        <div class="content">
            <div class="section">
                <h3>📋 任务信息</h3>
                <p><strong>描述：</strong>{{description}}</p>
                <p><strong>类型：</strong>{{taskType}}</p>
                <p><strong>项目路径：</strong>{{projectPath}}</p>
                {{#requirements.length}}
                <div class="requirements">
                    <strong>具体要求：</strong>
                    <ul>
                        {{#requirements}}
                        <li>{{.}}</li>
                        {{/requirements}}
                    </ul>
                </div>
                {{/requirements.length}}
            </div>

            <div class="section">
                <h3>❌ 错误信息</h3>
                <div class="error-box">{{error}}</div>
            </div>

            {{#output}}
            <div class="section">
                <h3>📄 部分输出</h3>
                <div class="error-box">{{output}}</div>
            </div>
            {{/output}}
        </div>

        <div class="footer">
            <p>🤖 通过 Claude Code Email Automation 自动生成</p>
            <p><small>请检查错误信息并重新发送任务邮件，或联系系统管理员</small></p>
        </div>
    </div>
</body>
</html>`;
    }
  }

  generateSubject(data) {
    const status = data.success ? '✅ 成功' : '❌ 失败';
    const taskDesc = data.description.substring(0, 30) + (data.description.length > 30 ? '...' : '');
    return `Claude Code 执行报告 ${status} - ${taskDesc}`;
  }

  calculateDuration(startTime) {
    if (!startTime) return '未知';
    
    try {
      const start = new Date(startTime);
      const now = new Date();
      const duration = now - start;
      
      if (duration < 1000) return `${duration}ms`;
      if (duration < 60000) return `${Math.round(duration / 1000)}秒`;
      if (duration < 3600000) return `${Math.round(duration / 60000)}分钟`;
      return `${Math.round(duration / 3600000)}小时`;
    } catch (error) {
      return '未知';
    }
  }

  formatOutput(output) {
    if (!output) return '无输出';
    
    // 限制输出长度，避免邮件过大
    if (output.length > 5000) {
      return output.substring(0, 5000) + '\n\n... (输出已截断，完整日志请查看附件)';
    }
    
    return output;
  }
}

async function main() {
  try {
    const generator = new ReportGenerator();
    await generator.generateReport();
    console.log('Report generated successfully');
  } catch (error) {
    console.error('Failed to generate report:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ReportGenerator;