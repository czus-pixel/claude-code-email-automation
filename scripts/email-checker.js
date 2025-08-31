const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs-extra');
const path = require('path');

class EmailChecker {
  constructor() {
    this.config = {
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_PASS,
      host: process.env.IMAP_HOST || 'imap.qq.com',
      port: process.env.IMAP_PORT || 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      }
    };
    
    this.processedEmails = new Set();
    this.loadProcessedEmails();
  }

  async loadProcessedEmails() {
    try {
      const processed = await fs.readFile('processed-emails.json', 'utf8');
      this.processedEmails = new Set(JSON.parse(processed));
    } catch (error) {
      console.log('No processed emails file found, starting fresh');
    }
  }

  async saveProcessedEmails() {
    await fs.writeFile(
      'processed-emails.json', 
      JSON.stringify([...this.processedEmails])
    );
  }

  async checkForNewTasks() {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config);
      const newTasks = [];

      imap.once('ready', () => {
        console.log('Connected to email server');
        
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          // 查找未读邮件，主题包含 "TASK:"
          imap.search(['UNSEEN', ['SUBJECT', 'TASK:']], (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (!results || results.length === 0) {
              console.log('No new task emails found');
              imap.end();
              resolve([]);
              return;
            }

            console.log(`Found ${results.length} new task emails`);
            
            const fetch = imap.fetch(results, { 
              bodies: '', 
              markSeen: true,
              struct: true 
            });

            fetch.on('message', (msg, seqno) => {
              let buffer = '';
              
              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
              });

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  const emailId = `${parsed.messageId}-${parsed.date}`;
                  
                  // 避免重复处理
                  if (this.processedEmails.has(emailId)) {
                    console.log(`Email ${emailId} already processed, skipping`);
                    return;
                  }

                  const task = this.parseTaskEmail(parsed);
                  if (task) {
                    newTasks.push(task);
                    this.processedEmails.add(emailId);
                    console.log(`Parsed new task: ${task.description}`);
                  }
                } catch (error) {
                  console.error('Error parsing email:', error);
                }
              });
            });

            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(err);
            });

            fetch.once('end', async () => {
              console.log('Finished processing emails');
              await this.saveProcessedEmails();
              imap.end();
              resolve(newTasks);
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      imap.connect();
    });
  }

  parseTaskEmail(parsed) {
    const subject = parsed.subject || '';
    const text = parsed.text || '';
    
    // 检查主题是否包含 TASK:
    if (!subject.includes('TASK:')) {
      console.log('Email does not contain TASK: in subject, skipping');
      return null;
    }

    const description = subject.replace('TASK:', '').trim();
    const fromEmail = parsed.from?.text || parsed.from?.value[0]?.address;
    
    // 解析邮件内容
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const task = {
      id: `task-${Date.now()}`,
      description,
      userEmail: fromEmail,
      projectPath: '.',
      taskType: 'code',
      requirements: [],
      timestamp: new Date().toISOString()
    };

    // 解析具体要求
    let isRequirements = false;
    for (const line of lines) {
      if (line.startsWith('项目路径:') || line.startsWith('Project Path:')) {
        task.projectPath = line.split(':')[1]?.trim() || '.';
      } else if (line.startsWith('任务类型:') || line.startsWith('Task Type:')) {
        const type = line.split(':')[1]?.trim()?.toLowerCase();
        if (['code', 'debug', 'test', 'deploy'].includes(type)) {
          task.taskType = type;
        }
      } else if (line.startsWith('具体要求:') || line.startsWith('Requirements:')) {
        isRequirements = true;
      } else if (isRequirements && line.startsWith('-')) {
        task.requirements.push(line.substring(1).trim());
      }
    }

    return task;
  }
}

async function main() {
  try {
    const checker = new EmailChecker();
    const tasks = await checker.checkForNewTasks();
    
    console.log(`Found ${tasks.length} new tasks`);
    
    // 设置 GitHub Actions 输出
    const core = require('@actions/core');
    core.setOutput('has_tasks', tasks.length > 0 ? 'true' : 'false');
    core.setOutput('task_data', JSON.stringify(tasks));
    
    // 保存任务数据到文件
    if (tasks.length > 0) {
      await fs.writeFile('tasks.json', JSON.stringify(tasks, null, 2));
      console.log('Tasks saved to tasks.json');
    }
    
  } catch (error) {
    console.error('Error checking emails:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EmailChecker;