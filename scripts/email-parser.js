const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class EmailParser {
  static parseTask() {
    try {
      const taskData = JSON.parse(process.env.TASK_DATA || '{}');
      
      console.log('Parsing task data:', taskData);
      
      const parsed = {
        id: taskData.id || `task-${Date.now()}`,
        description: taskData.description || process.env.TASK_DESCRIPTION || '',
        projectPath: taskData.projectPath || process.env.PROJECT_PATH || '.',
        taskType: taskData.taskType || process.env.TASK_TYPE || 'code',
        userEmail: taskData.userEmail || process.env.USER_EMAIL || '',
        requirements: taskData.requirements || [],
        timestamp: taskData.timestamp || new Date().toISOString()
      };

      console.log('Parsed task:', parsed);

      // 设置 GitHub Actions 输出
      const core = require('@actions/core');
      core.setOutput('description', parsed.description);
      core.setOutput('project_path', parsed.projectPath);
      core.setOutput('task_type', parsed.taskType);
      core.setOutput('user_email', parsed.userEmail);
      core.setOutput('task_id', parsed.id);

      // 保存解析后的任务数据
      fs.writeFileSync('current-task.json', JSON.stringify(parsed, null, 2));
      
      return parsed;
    } catch (error) {
      console.error('Error parsing task:', error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  EmailParser.parseTask();
}

module.exports = EmailParser;