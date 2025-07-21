const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class JournalWriter {
  constructor() {
    this.journalDir = path.join(os.homedir(), 'journals');
  }

  async saveToJournal(summary, targetDate) {
    try {
      // Ensure journals directory exists
      await this.ensureJournalDir();
      
      const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const journalPath = path.join(this.journalDir, `${dateStr}.md`);
      
      // Check if journal entry already exists
      let existingContent = '';
      try {
        existingContent = await fs.readFile(journalPath, 'utf8');
      } catch {
        // File doesn't exist, that's fine
      }
      
      const timestamp = new Date().toLocaleTimeString();
      const entry = this.formatJournalEntry(summary, timestamp, existingContent);
      
      await fs.writeFile(journalPath, entry, 'utf8');
      
      return journalPath;
      
    } catch (error) {
      throw new Error(`Failed to save journal: ${error.message}`);
    }
  }

  async ensureJournalDir() {
    try {
      await fs.access(this.journalDir);
    } catch {
      await fs.mkdir(this.journalDir, { recursive: true });
    }
  }

  formatJournalEntry(summary, timestamp, existingContent) {
    const header = `# Daily Journal - ${new Date().toLocaleDateString()}\n\n`;
    const timestampedSummary = `## wtfdid Summary (Generated at ${timestamp})\n\n${summary}\n\n---\n\n`;
    
    if (existingContent) {
      // If file exists, append to it
      if (existingContent.includes('## wtfdid Summary')) {
        // Replace existing wtfdid summary
        const regex = /## wtfdid Summary.*?(?=##|$)/s;
        return existingContent.replace(regex, timestampedSummary);
      } else {
        // Add wtfdid summary to existing content
        return existingContent + '\n' + timestampedSummary;
      }
    } else {
      // New file
      return header + timestampedSummary + this.getJournalTemplate();
    }
  }

  getJournalTemplate() {
    return `## Personal Notes
*Add your own thoughts, goals, or reflections here...*

## Tomorrow's Goals
- [ ] 
- [ ] 
- [ ] 

## Wins & Learnings
- 
- 
- 

## Random Thoughts
*Brain dump space...*
`;
  }

  async listJournals(days = 7) {
    try {
      const files = await fs.readdir(this.journalDir);
      const journalFiles = files
        .filter(file => file.endsWith('.md') && file.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort()
        .reverse()
        .slice(0, days);
      
      return journalFiles.map(file => ({
        date: file.replace('.md', ''),
        path: path.join(this.journalDir, file)
      }));
    } catch {
      return [];
    }
  }
}

module.exports = new JournalWriter();