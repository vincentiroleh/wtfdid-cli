const simpleGit = require('simple-git');
const path = require('path');

class GitSummary {
  constructor() {
    this.git = simpleGit();
  }

  async getTodaysCommits(targetDate = new Date()) {
    try {
      // Check if we're in a git repo
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        return [];
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get commits from today
      const log = await this.git.log({
        '--since': startOfDay.toISOString(),
        '--until': endOfDay.toISOString(),
        '--all': null
      });

      return log.all.map(commit => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        refs: commit.refs,
        files: commit.diff?.files || []
      }));

    } catch (error) {
      console.warn('Git summary failed:', error.message);
      return [];
    }
  }

  async getCurrentBranch() {
    try {
      const status = await this.git.status();
      return status.current;
    } catch (error) {
      return 'unknown';
    }
  }

  async getRepoInfo() {
    try {
      const remotes = await this.git.getRemotes(true);
      const currentBranch = await this.getCurrentBranch();
      
      return {
        branch: currentBranch,
        remotes: remotes.map(r => ({ name: r.name, url: r.refs.fetch }))
      };
    } catch (error) {
      return { branch: 'unknown', remotes: [] };
    }
  }
}

module.exports = new GitSummary();