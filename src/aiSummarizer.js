const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AISummarizer {
  constructor() {
    this.qConfigPath = path.join(process.cwd(), 'q-agent-config.json');
  }

  async generateSummary(commits, files, targetDate) {
    try {
      // Create Q Developer agent config if it doesn't exist
      await this.ensureQConfig();
      
      const prompt = this.buildPrompt(commits, files, targetDate);
      
      // Use Q Developer CLI to generate summary
      const summary = await this.callQDeveloper(prompt);
      
      return summary || this.generateFallbackSummary(commits, files, targetDate);
      
    } catch (error) {
      console.warn('AI summary failed, using fallback:', error.message);
      return this.generateFallbackSummary(commits, files, targetDate);
    }
  }

  buildPrompt(commits, files, targetDate) {
    const dateStr = targetDate.toLocaleDateString();
    const fileStats = this.getFileStats(files);
    
    return `You're a witty but professional productivity assistant. Given the user's commits, files, and activities, summarize their day in a fun and human way.

Be encouraging and slightly sarcastic if needed. Use relatable developer language. Include bullets and short paragraphs. End with a fun line like "Now go eat. You earned it." or "Well played, Code Wizard."

Date: ${dateStr}

Git Commits (${commits.length} total):
${commits.map(c => `- ${c.hash}: "${c.message}" by ${c.author}`).join('\n')}

Files Modified (${files.length} total):
${fileStats}

Recent Files:
${files.slice(0, 10).map(f => `- ${f.path} (${f.extension})`).join('\n')}

Generate a fun, encouraging daily summary that makes the developer feel good about their work!`;
  }

  async callQDeveloper(prompt) {
    return new Promise((resolve, reject) => {
      const qProcess = spawn('qchat', ['chat', prompt], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      qProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      qProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      qProcess.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim());
        } else {
          reject(new Error(`Q Developer failed: ${error || 'Unknown error'}`));
        }
      });

      // Set timeout
      setTimeout(() => {
        qProcess.kill();
        reject(new Error('Q Developer timeout'));
      }, 30000);
    });
  }

  async ensureQConfig() {
    try {
      await fs.access(this.qConfigPath);
    } catch {
      // Create basic Q agent config
      const config = {
        "name": "wtfdid-summarizer",
        "description": "Daily productivity summary agent",
        "instructions": "You are a witty productivity assistant that helps developers understand what they accomplished each day. Be encouraging, slightly sarcastic, and use developer-friendly language.",
        "model": "claude-3-sonnet"
      };
      
      await fs.writeFile(this.qConfigPath, JSON.stringify(config, null, 2));
    }
  }

  generateFallbackSummary(commits, files, targetDate) {
    const dateStr = targetDate.toLocaleDateString();
    const fileStats = this.getFileStats(files);
    
    let summary = `🗓️ **Daily Summary for ${dateStr}**\n\n`;
    
    if (commits.length > 0) {
      summary += `📝 **Git Activity** (${commits.length} commits)\n`;
      commits.slice(0, 5).forEach(commit => {
        summary += `  • ${commit.hash}: "${commit.message}"\n`;
      });
      if (commits.length > 5) {
        summary += `  • ...and ${commits.length - 5} more commits\n`;
      }
      summary += '\n';
    } else {
      summary += `📝 **Git Activity**: No commits today. Sometimes we just think really hard. 🤔\n\n`;
    }
    
    if (files.length > 0) {
      summary += `📁 **File Changes** (${files.length} files modified)\n`;
      summary += fileStats + '\n\n';
      
      summary += `**Recent files you touched:**\n`;
      files.slice(0, 8).forEach(file => {
        summary += `  • ${file.path}\n`;
      });
      if (files.length > 8) {
        summary += `  • ...and ${files.length - 8} more files\n`;
      }
    } else {
      summary += `📁 **File Changes**: No files modified today. Either you're planning something big or you took a well-deserved break! 🏖️\n`;
    }
    
    // Add encouraging conclusion
    const conclusions = [
      "Now go eat. You earned it, Code Wizard! 🧙‍♂️",
      "Well played today, boss. Time to celebrate with your favorite beverage! 🍺",
      "Another day of making the impossible possible. You're crushing it! 💪",
      "Progress is progress, no matter how small. Keep being awesome! ⭐",
      "You beautiful disaster, you actually got stuff done today! 🎉"
    ];
    
    summary += '\n' + conclusions[Math.floor(Math.random() * conclusions.length)];
    
    return summary;
  }

  getFileStats(files) {
    const stats = {};
    files.forEach(file => {
      const ext = file.extension || 'no extension';
      stats[ext] = (stats[ext] || 0) + 1;
    });
    
    return Object.entries(stats)
      .map(([ext, count]) => `  • ${ext}: ${count} file${count > 1 ? 's' : ''}`)
      .join('\n');
  }
}

module.exports = new AISummarizer();