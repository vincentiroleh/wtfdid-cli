#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const gitSummary = require('../src/gitSummary');
const fileTracker = require('../src/fileTracker');
const aiSummarizer = require('../src/aiSummarizer');
const journalWriter = require('../src/journalWriter');

const program = new Command();

program
  .name('wtfdid')
  .description('Find out WTF you did today, you beautiful disaster')
  .version('1.0.0');

program
  .option('-s, --save', 'Save summary to ~/journals/YYYY-MM-DD.md')
  .option('-d, --dry-run', 'Show input data before sending to AI')
  .option('-y, --yesterday', 'Run summary for yesterday')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n🧠 wtfdid-cli: Let\'s see what you accomplished, boss...\n'));
    
    const targetDate = options.yesterday ? getYesterday() : new Date();
    
    try {
      // Gather Git commits
      const spinner1 = ora('🔍 Gathering commits... You did more than you thought, boss').start();
      const commits = await gitSummary.getTodaysCommits(targetDate);
      spinner1.succeed(`📝 Found ${commits.length} commits. Not bad!`);
      
      // Track file changes
      const spinner2 = ora('📁 Scanning file changes... Hopefully you remembered to save').start();
      const files = await fileTracker.getTodaysFiles(targetDate);
      spinner2.succeed(`📂 You edited ${files.length} files today. Impressive!`);
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 DRY RUN - Here\'s what we found:\n'));
        console.log(chalk.blue('Commits:'), commits);
        console.log(chalk.blue('Files:'), files);
        return;
      }
      
      // Generate AI summary
      const spinner3 = ora('🤖 Asking Claude what you actually accomplished...').start();
      const summary = await aiSummarizer.generateSummary(commits, files, targetDate);
      spinner3.succeed('🎉 Summary generated. Spoiler: you\'re amazing.');
      
      console.log(chalk.green.bold('\n📋 Your Daily Summary:\n'));
      console.log(summary);
      
      // Save to journal if requested
      if (options.save) {
        const spinner4 = ora('💾 Saving to journal...').start();
        await journalWriter.saveToJournal(summary, targetDate);
        spinner4.succeed('📖 Saved to journal. Future you will thank present you.');
      }
      
      console.log(chalk.magenta.bold('\n✨ Now go eat. You earned it, Code Wizard! ✨\n'));
      
    } catch (error) {
      console.error(chalk.red('💥 Something went wrong:'), error.message);
      process.exit(1);
    }
  });

function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

program.parse();