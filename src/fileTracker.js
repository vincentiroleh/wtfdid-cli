const fs = require('fs').promises;
const path = require('path');

class FileTracker {
  constructor() {
    this.ignoredDirs = [
      'node_modules',
      '.git',
      '.vscode',
      'dist',
      'build',
      '.next',
      'coverage',
      '.nyc_output',
      'logs'
    ];
    
    this.ignoredFiles = [
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '*.tmp',
      '*.temp'
    ];
  }

  async getTodaysFiles(targetDate = new Date()) {
    try {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const modifiedFiles = await this.scanDirectory(process.cwd(), startOfDay, endOfDay);
      
      return modifiedFiles.map(file => ({
        path: path.relative(process.cwd(), file.path),
        modified: file.modified,
        size: file.size,
        extension: path.extname(file.path)
      }));

    } catch (error) {
      console.warn('File tracking failed:', error.message);
      return [];
    }
  }

  async scanDirectory(dirPath, startTime, endTime, depth = 0) {
    if (depth > 3) return []; // Limit recursion depth
    
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.shouldIgnoreDir(entry.name)) {
            const subFiles = await this.scanDirectory(fullPath, startTime, endTime, depth + 1);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          if (!this.shouldIgnoreFile(entry.name)) {
            const stats = await fs.stat(fullPath);
            const modifiedTime = new Date(stats.mtime);
            
            if (modifiedTime >= startTime && modifiedTime <= endTime) {
              files.push({
                path: fullPath,
                modified: modifiedTime,
                size: stats.size
              });
            }
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return files;
  }

  shouldIgnoreDir(dirName) {
    return this.ignoredDirs.includes(dirName) || dirName.startsWith('.');
  }

  shouldIgnoreFile(fileName) {
    return this.ignoredFiles.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern;
    }) || fileName.startsWith('.');
  }

  getFileTypeStats(files) {
    const stats = {};
    files.forEach(file => {
      const ext = file.extension || 'no extension';
      stats[ext] = (stats[ext] || 0) + 1;
    });
    return stats;
  }
}

module.exports = new FileTracker();