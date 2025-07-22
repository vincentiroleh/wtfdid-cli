#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const gitSummary = require('../src/gitSummary');
const fileTracker = require('../src/fileTracker');
const calendarFetcher = require('../src/calendarFetcher');
const streakTracker = require('../src/streakTracker');
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
  .option('-t, --test-q', 'Test Q Developer CLI integration')
  .option('--test-calendar', 'Test Google Calendar integration')
  .option('--streak', 'Show productivity streak information')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n🧠 wtfdid-cli: Let\'s see what you accomplished, boss...\n'));
    
    // Handle special commands
    if (options.testQ) {
      await testQDeveloperIntegration();
      return;
    }
    

    
    if (options.testCalendar) {
      await testCalendarIntegration();
      return;
    }
    
    if (options.streak) {
      await showStreakInfo();
      return;
    }
    
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
      
      // Fetch calendar events
      const spinner3 = ora('📅 Checking your calendar... Meeting survivor status loading...').start();
      const events = await calendarFetcher.getTodaysEvents(targetDate);
      if (events.length > 0) {
        spinner3.succeed(`🗓️ Found ${events.length} calendar events. You've been busy!`);
      } else {
        spinner3.succeed('📅 No calendar events found (or not connected to Google Calendar)');
      }
      
      // Update productivity streak
      const spinner4 = ora('🔥 Updating productivity streak...').start();
      const streakData = await streakTracker.updateStreak(commits, files, events, targetDate);
      const streakEmoji = streakTracker.getStreakEmoji(streakData.currentStreak);
      spinner4.succeed(`${streakEmoji} Streak updated! Current: ${streakData.currentStreak} days`);
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 DRY RUN - Here\'s what we found:\n'));
        console.log(chalk.blue('Commits:'), commits);
        console.log(chalk.blue('Files:'), files);
        console.log(chalk.blue('Calendar Events:'), events);
        console.log(chalk.blue('Streak Data:'), streakData);
        return;
      }
      
      // Generate AI summary
      const spinner5 = ora('🤖 Asking Claude what you actually accomplished...').start();
      const summary = await aiSummarizer.generateSummary(commits, files, events, streakData, targetDate);
      spinner5.succeed('🎉 Summary generated. Spoiler: you\'re amazing.');
      
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

async function testQDeveloperIntegration() {
  console.log(chalk.yellow.bold('🧪 Testing Q Developer CLI Integration...\n'));
  
  const testPrompt = "Say 'Q Developer is working!' in a witty, encouraging way for a developer productivity tool.";
  
  try {
    const spinner = ora('🤖 Testing Q Developer CLI commands...').start();
    const result = await aiSummarizer.testQDeveloper(testPrompt);
    
    if (result.success) {
      spinner.succeed('✅ Q Developer CLI is working perfectly!');
      console.log(chalk.green.bold('\n🎉 Q Developer Response:\n'));
      console.log(chalk.white(result.output));
      console.log(chalk.cyan('\n💡 Your wtfdid summaries will be powered by Q Developer AI!'));
    } else {
      spinner.fail('❌ Q Developer CLI not available');
      console.log(chalk.yellow('\n⚠️  Q Developer CLI Issues:\n'));
      console.log(chalk.red(result.error));
      console.log(chalk.cyan('\n💡 Don\'t worry! wtfdid will use built-in fallback summaries.'));
      console.log(chalk.cyan('   Install Q Developer CLI for AI-powered summaries.'));
    }
  } catch (error) {
    console.error(chalk.red('💥 Test failed:'), error.message);
  }
  
  console.log(chalk.magenta.bold('\n🚀 Ready to use wtfdid? Try: npx wtfdid\n'));
}



async function testCalendarIntegration() {
  console.log(chalk.yellow.bold('🧪 Testing Google Calendar Integration...\n'));
  
  try {
    const spinner = ora('📅 Testing calendar connection...').start();
    const result = await calendarFetcher.testConnection();
    
    if (result.success) {
      spinner.succeed('✅ Google Calendar is connected!');
      console.log(chalk.green.bold(`\n🎉 Found access to ${result.calendars} calendar(s)`));
      console.log(chalk.cyan('\n💡 Your wtfdid summaries will include calendar events!'));
      
      // Test fetching today's events
      const spinner2 = ora('📋 Fetching today\'s events...').start();
      const events = await calendarFetcher.getTodaysEvents();
      spinner2.succeed(`📅 Found ${events.length} events for today`);
      
      if (events.length > 0) {
        console.log(chalk.blue('\n📋 Today\'s Events:'));
        events.slice(0, 3).forEach(event => {
          const time = event.isAllDay ? 'All day' : 
            new Date(event.start).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
          console.log(chalk.white(`  • ${time}: ${event.title} (${event.duration})`));
        });
        if (events.length > 3) {
          console.log(chalk.gray(`  • ...and ${events.length - 3} more events`));
        }
      }
      
    } else {
      spinner.fail('❌ Google Calendar not connected');
      console.log(chalk.yellow('\n⚠️  Calendar Issues:\n'));
      console.log(chalk.red(result.error));
      console.log(chalk.cyan('\n💡 Run: npx wtfdid --setup-calendar to authenticate'));
    }
  } catch (error) {
    console.error(chalk.red('💥 Test failed:'), error.message);
  }
  
  console.log(chalk.magenta.bold('\n🚀 Ready to use wtfdid? Try: npx wtfdid\n'));
}

async function showStreakInfo() {
  console.log(chalk.yellow.bold('🔥 Productivity Streak Information\n'));
  
  try {
    const streakData = await streakTracker.getStreakInfo();
    const streakEmoji = streakTracker.getStreakEmoji(streakData.currentStreak);
    
    console.log(chalk.green.bold(`${streakEmoji} Current Streak: ${streakData.currentStreak} day${streakData.currentStreak !== 1 ? 's' : ''}`));
    console.log(chalk.blue(`🏆 Longest Streak: ${streakData.longestStreak} day${streakData.longestStreak !== 1 ? 's' : ''}`));
    console.log(chalk.cyan(`⭐ Total Active Days: ${streakData.totalActiveDays}`));
    
    if (streakData.currentStreak >= 7) {
      console.log(chalk.red.bold('\n🔥 You\'re absolutely crushing it! Keep the fire burning!'));
    } else if (streakData.currentStreak >= 3) {
      console.log(chalk.yellow.bold('\n⭐ Great momentum! You\'re building solid habits!'));
    } else if (streakData.currentStreak >= 1) {
      console.log(chalk.green.bold('\n💪 Nice work! Every day counts!'));
    } else {
      console.log(chalk.gray('\n💤 No current streak. Time to start fresh!'));
    }
    
    if (streakData.lastActiveDate) {
      console.log(chalk.gray(`\nLast active: ${streakData.lastActiveDate}`));
    }
    
  } catch (error) {
    console.error(chalk.red('💥 Failed to get streak info:'), error.message);
  }
  
  console.log(chalk.magenta.bold('\n🚀 Ready to build your streak? Try: npx wtfdid\n'));
}

function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

program.parse();