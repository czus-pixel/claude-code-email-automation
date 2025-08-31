const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');

class ClaudeRunner {
  constructor() {
    this.workspaceDir = process.env.GITHUB_WORKSPACE || process.cwd();
    this.logsDir = path.join(this.workspaceDir, 'logs');
    this.reportsDir = path.join(this.workspaceDir, 'reports');
    
    // 确保日志目录存在
    fs.ensureDirSync(this.logsDir);
    fs.ensureDirSync(this.reportsDir);
  }

  async executeTask() {
    const taskId = process.env.TASK_ID || `task-${Date.now()}`;
    const description = process.env.TASK_DESCRIPTION || '';
    const projectPath = process.env.PROJECT_PATH || '.';
    const taskType = process.env.TASK_TYPE || 'code';
    const userEmail = process.env.USER_EMAIL || '';

    console.log(`Starting Claude Code execution for task: ${taskId}`);
    console.log(`Description: ${description}`);
    console.log(`Project Path: ${projectPath}`);
    console.log(`Task Type: ${taskType}`);

    const logFile = path.join(this.logsDir, `${taskId}.log`);
    const errorFile = path.join(this.logsDir, `${taskId}_error.log`);
    
    try {
      // 准备工作目录
      const targetDir = path.join(this.workspaceDir, 'workspace', taskId);
      await fs.ensureDir(targetDir);
      
      // 如果有项目路径，尝试克隆或准备项目
      if (projectPath !== '.' && (projectPath.startsWith('https://') || projectPath.startsWith('git@'))) {
        console.log(`Cloning repository: ${projectPath}`);
        execSync(`git clone ${projectPath} ${targetDir}`, { 
          stdio: 'pipe',
          encoding: 'utf8' 
        });
      } else {
        // 创建基本项目结构
        await this.createBasicProject(targetDir);
      }

      // 构建 Claude Code 命令
      const claudeCommand = this.buildClaudeCommand(description, taskType, targetDir);
      
      console.log(`Executing Claude Code: ${claudeCommand}`);
      
      // 执行 Claude Code
      const result = await this.runClaudeCode(claudeCommand, targetDir, logFile, errorFile);
      
      // 生成执行报告
      const report = await this.generateReport(result, taskId, description, userEmail);
      
      // 设置 GitHub Actions 输出
      const core = require('@actions/core');
      core.setOutput('result', JSON.stringify(result));
      core.setOutput('task_id', taskId);
      core.setOutput('log_file', logFile);
      core.setOutput('report', JSON.stringify(report));

      console.log('Claude Code execution completed successfully');
      return result;

    } catch (error) {
      console.error('Error executing Claude Code:', error);
      
      // 记录错误
      await fs.writeFile(errorFile, error.toString());
      
      const core = require('@actions/core');
      core.setOutput('error', error.toString());
      core.setFailed(error.message);
      
      throw error;
    }
  }

  buildClaudeCommand(description, taskType, projectDir) {
    let command = 'claude-code';
    
    // 根据任务类型添加特定参数
    switch (taskType) {
      case 'debug':
        command += ' --mode debug';
        break;
      case 'test':
        command += ' --mode test';
        break;
      case 'deploy':
        command += ' --mode deploy';
        break;
      default:
        command += ' --mode code';
    }

    // 添加项目目录
    command += ` --project-dir "${projectDir}"`;
    
    // 添加任务描述
    command += ` --task "${description}"`;
    
    // 添加输出格式
    command += ' --output json';
    
    return command;
  }

  async runClaudeCode(command, workDir, logFile, errorFile) {
    return new Promise((resolve, reject) => {
      console.log(`Running command in ${workDir}: ${command}`);
      
      const process = spawn('bash', ['-c', command], {
        cwd: workDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
        }
      });

      let stdout = '';
      let stderr = '';
      const startTime = Date.now();

      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        console.log('STDOUT:', chunk);
      });

      process.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        console.error('STDERR:', chunk);
      });

      process.on('close', async (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Process exited with code ${code}`);
        console.log(`Execution time: ${duration}ms`);

        // 保存日志
        const logData = {
          command,
          workDir,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration,
          exitCode: code,
          stdout,
          stderr
        };

        await fs.writeFile(logFile, JSON.stringify(logData, null, 2));

        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            error: stderr,
            duration,
            logFile
          });
        } else {
          await fs.writeFile(errorFile, stderr);
          reject(new Error(`Claude Code execution failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', async (error) => {
        console.error('Process error:', error);
        await fs.writeFile(errorFile, error.toString());
        reject(error);
      });

      // 30分钟超时
      setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error('Claude Code execution timed out after 30 minutes'));
      }, 30 * 60 * 1000);
    });
  }

  async createBasicProject(projectDir) {
    console.log(`Creating basic project structure in ${projectDir}`);
    
    // 创建基本文件结构
    await fs.writeFile(path.join(projectDir, 'README.md'), '# Claude Code Automation Project\n\nThis project was created for automated task execution.\n');
    
    await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({
      name: 'claude-automation-project',
      version: '1.0.0',
      description: 'Project for Claude Code automation',
      main: 'index.js',
      scripts: {
        test: 'echo "No tests specified"'
      }
    }, null, 2));

    await fs.writeFile(path.join(projectDir, 'index.js'), '// Claude Code automation project\nconsole.log("Hello from Claude Code automation!");\n');
  }

  async generateReport(result, taskId, description, userEmail) {
    const reportData = {
      taskId,
      description,
      userEmail,
      timestamp: new Date().toISOString(),
      success: result.success,
      duration: result.duration,
      output: result.output,
      error: result.error,
      logFile: result.logFile
    };

    const reportFile = path.join(this.reportsDir, `${taskId}_report.json`);
    await fs.writeFile(reportFile, JSON.stringify(reportData, null, 2));

    console.log(`Report generated: ${reportFile}`);
    return reportData;
  }
}

async function main() {
  try {
    const runner = new ClaudeRunner();
    await runner.executeTask();
  } catch (error) {
    console.error('Claude Code execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ClaudeRunner;