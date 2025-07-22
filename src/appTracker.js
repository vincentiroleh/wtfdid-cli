const { spawn } = require('child_process');
const os = require('os');

class AppTracker {
  constructor() {
    this.platform = os.platform();
  }

  async getTodaysApps(targetDate = new Date()) {
    try {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      let apps = [];
      
      if (this.platform === 'linux') {
        apps = await this.getLinuxApps();
      } else if (this.platform === 'win32') {
        apps = await this.getWindowsApps();
      } else if (this.platform === 'darwin') {
        apps = await this.getMacApps();
      }

      return this.categorizeApps(apps);

    } catch (error) {
      console.warn('App tracking failed:', error.message);
      return [];
    }
  }

  async getLinuxApps() {
    return new Promise((resolve, reject) => {
      // Get currently running processes with their start times
      const psProcess = spawn('ps', ['aux', '--sort=-pcpu'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      psProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      psProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      psProcess.on('close', (code) => {
        if (code === 0) {
          const apps = this.parseLinuxProcesses(output);
          resolve(apps);
        } else {
          reject(new Error(`ps command failed: ${error}`));
        }
      });

      setTimeout(() => {
        psProcess.kill();
        reject(new Error('App tracking timeout'));
      }, 5000);
    });
  }

  async getWindowsApps() {
    return new Promise((resolve, reject) => {
      // Use PowerShell to get running processes
      const psProcess = spawn('powershell', [
        '-Command', 
        'Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object ProcessName, CPU, WorkingSet, MainWindowTitle | ConvertTo-Json'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      psProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      psProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      psProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const processes = JSON.parse(output);
            const apps = this.parseWindowsProcesses(processes);
            resolve(apps);
          } catch (parseError) {
            resolve([]); // Return empty array if parsing fails
          }
        } else {
          resolve([]); // Return empty array on error
        }
      });

      setTimeout(() => {
        psProcess.kill();
        resolve([]);
      }, 5000);
    });
  }

  async getMacApps() {
    return new Promise((resolve, reject) => {
      // Use osascript to get running applications
      const osascriptProcess = spawn('osascript', [
        '-e', 
        'tell application "System Events" to get name of (processes where background only is false)'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      osascriptProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      osascriptProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      osascriptProcess.on('close', (code) => {
        if (code === 0) {
          const apps = this.parseMacApps(output);
          resolve(apps);
        } else {
          resolve([]); // Return empty array on error
        }
      });

      setTimeout(() => {
        osascriptProcess.kill();
        resolve([]);
      }, 5000);
    });
  }

  parseLinuxProcesses(output) {
    const lines = output.split('\n').slice(1); // Skip header
    const apps = [];
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 11) {
        const command = parts.slice(10).join(' ');
        const cpu = parseFloat(parts[2]) || 0;
        const memory = parseFloat(parts[3]) || 0;
        
        // Filter out system processes and focus on user applications
        if (this.isUserApp(command) && cpu > 0.1) {
          apps.push({
            name: this.extractAppName(command),
            command: command,
            cpu: cpu,
            memory: memory,
            platform: 'linux'
          });
        }
      }
    });

    return apps;
  }

  parseWindowsProcesses(processes) {
    if (!Array.isArray(processes)) {
      processes = [processes];
    }

    return processes.map(proc => ({
      name: proc.ProcessName,
      windowTitle: proc.MainWindowTitle,
      cpu: proc.CPU || 0,
      memory: proc.WorkingSet || 0,
      platform: 'windows'
    })).filter(app => app.name && app.windowTitle);
  }

  parseMacApps(output) {
    const appNames = output.trim().split(', ');
    return appNames.map(name => ({
      name: name.trim(),
      platform: 'mac'
    })).filter(app => app.name && !app.name.includes('Finder'));
  }

  isUserApp(command) {
    const userApps = [
      'code', 'vscode', 'atom', 'sublime',
      'chrome', 'firefox', 'safari', 'edge',
      'terminal', 'gnome-terminal', 'konsole',
      'slack', 'discord', 'teams',
      'docker', 'node', 'npm', 'yarn',
      'git', 'vim', 'emacs', 'nano',
      'postman', 'insomnia',
      'spotify', 'vlc',
      'gimp', 'inkscape', 'figma'
    ];

    return userApps.some(app => 
      command.toLowerCase().includes(app) || 
      command.toLowerCase().includes(`/${app}`) ||
      command.toLowerCase().includes(`\\${app}`)
    );
  }

  extractAppName(command) {
    // Extract meaningful app name from command
    const parts = command.split(/[\s\/\\]/);
    const executable = parts[parts.length - 1] || parts[0];
    
    // Clean up common patterns
    return executable
      .replace(/\.(exe|app|AppImage)$/i, '')
      .replace(/^.*[\/\\]/, '')
      .toLowerCase();
  }

  categorizeApps(apps) {
    const categories = {
      development: [],
      browsers: [],
      communication: [],
      productivity: [],
      media: [],
      other: []
    };

    const categoryMap = {
      development: ['code', 'vscode', 'atom', 'sublime', 'vim', 'emacs', 'nano', 'terminal', 'gnome-terminal', 'konsole', 'docker', 'node', 'npm', 'yarn', 'git', 'postman', 'insomnia'],
      browsers: ['chrome', 'firefox', 'safari', 'edge', 'chromium', 'opera'],
      communication: ['slack', 'discord', 'teams', 'zoom', 'skype', 'telegram'],
      productivity: ['notion', 'obsidian', 'evernote', 'trello', 'asana'],
      media: ['spotify', 'vlc', 'mpv', 'gimp', 'inkscape', 'figma', 'photoshop']
    };

    apps.forEach(app => {
      let categorized = false;
      
      for (const [category, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(keyword => 
          app.name.toLowerCase().includes(keyword) || 
          (app.command && app.command.toLowerCase().includes(keyword)) ||
          (app.windowTitle && app.windowTitle.toLowerCase().includes(keyword))
        )) {
          categories[category].push(app);
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        categories.other.push(app);
      }
    });

    return categories;
  }

  formatAppsForPrompt(appCategories) {
    if (!appCategories || Object.keys(appCategories).length === 0) {
      return 'No app usage data available.';
    }

    let formatted = 'Applications Used Today:\n';
    
    Object.entries(appCategories).forEach(([category, apps]) => {
      if (apps.length > 0) {
        formatted += `\n${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
        apps.slice(0, 5).forEach(app => {
          formatted += `  • ${app.name}`;
          if (app.windowTitle && app.windowTitle !== app.name) {
            formatted += ` (${app.windowTitle})`;
          }
          if (app.cpu && app.cpu > 1) {
            formatted += ` - ${app.cpu.toFixed(1)}% CPU`;
          }
          formatted += '\n';
        });
        
        if (apps.length > 5) {
          formatted += `  • ...and ${apps.length - 5} more ${category} apps\n`;
        }
      }
    });

    return formatted;
  }

  getAppStats(appCategories) {
    const stats = {};
    let totalApps = 0;
    
    Object.entries(appCategories).forEach(([category, apps]) => {
      stats[category] = apps.length;
      totalApps += apps.length;
    });
    
    stats.total = totalApps;
    return stats;
  }

  async testAppTracking() {
    try {
      const apps = await this.getTodaysApps();
      const stats = this.getAppStats(apps);
      
      return {
        success: true,
        platform: this.platform,
        totalApps: stats.total,
        categories: Object.keys(apps).filter(cat => apps[cat].length > 0),
        topApps: Object.values(apps).flat().slice(0, 5).map(app => app.name)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        platform: this.platform
      };
    }
  }
}

module.exports = new AppTracker();