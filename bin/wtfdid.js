#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const gitSummary = require('../src/gitSummary');
const fileTracker = require('../src/fileTracker');
const calendarFetcher = require('../src/calendarFetcher');
const streakTracker = require('../src/streakTracker');
const appTracker = require('../src/appTracker');
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
  .option('--test-apps', 'Test app tracking integration')
  .option('--setup-google', 'Setup Google Calendar integration')
  .option('--config', 'Show current configuration status')
  .option('--standup', 'Generate standup-ready summary')
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
    
    if (options.testApps) {
      await testAppTracking();
      return;
    }
    
    if (options.setupGoogle) {
      await setupGoogleCalendar();
      return;
    }
    
    if (options.config) {
      await showConfiguration();
      return;
    }
    
    const targetDate = options.yesterday ? getYesterday() : new Date();
    
    if (options.standup) {
      await generateStandupSummary(targetDate, options.save);
      return;
    }
    
    if (options.streak) {
      await showStreakInfo();
      return;
    }
    
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
      
      // Track app usage
      const spinner3b = ora('💻 Scanning your app usage... What have you been up to?').start();
      const appCategories = await appTracker.getTodaysApps(targetDate);
      const appStats = appTracker.getAppStats(appCategories);
      if (appStats.total > 0) {
        spinner3b.succeed(`💻 Found ${appStats.total} active apps across ${Object.keys(appCategories).filter(cat => appCategories[cat].length > 0).length} categories!`);
      } else {
        spinner3b.succeed('💻 No app usage data available (or tracking not supported on this system)');
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
        console.log(chalk.blue('App Categories:'), appCategories);
        console.log(chalk.blue('Streak Data:'), streakData);
        return;
      }
      
      // Generate AI summary
      const spinner5 = ora('🤖 Asking Claude what you actually accomplished...').start();
      const summary = await aiSummarizer.generateSummary(commits, files, events, appCategories, streakData, targetDate);
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
    // Show configuration status
    const configStatus = calendarFetcher.getConfigStatus();
    console.log(chalk.cyan('📋 Configuration Status:'));
    console.log(chalk.white(`  Global config: ${configStatus.globalConfig ? '✅' : '❌'} ${configStatus.configPath}`));
    console.log(chalk.white(`  Environment vars: ${configStatus.envVars ? '✅' : '❌'}`));
    console.log(chalk.white(`  Overall configured: ${configStatus.configured ? '✅' : '❌'}\n`));
    
    if (!configStatus.configured) {
      console.log(chalk.red('❌ Google Calendar not configured'));
      console.log(chalk.yellow('💡 Run: wtfdid --setup-google'));
      return;
    }
    
    const spinner = ora('📅 Testing calendar connection...').start();
    const result = await calendarFetcher.testConnection();
    
    if (result.success) {
      spinner.succeed('✅ Google Calendar is connected!');
      console.log(chalk.green.bold(`\n🎉 Connected to calendar: ${result.calendarId}`));
      console.log(chalk.cyan('💡 Your wtfdid summaries will include calendar events!'));
      
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
      } else {
        console.log(chalk.gray('\n📅 No events found for today'));
      }
      
    } else {
      spinner.fail('❌ Google Calendar connection failed');
      console.log(chalk.yellow('\n⚠️  Error Details:\n'));
      console.log(chalk.red(result.error));
      console.log(chalk.cyan('\n💡 Try: wtfdid --setup-google to reconfigure'));
    }
  } catch (error) {
    console.error(chalk.red('💥 Test failed:'), error.message);
  }
  
  console.log(chalk.magenta.bold('\n🚀 Ready to use wtfdid? Try: wtfdid\n'));
}

async function testAppTracking() {
  console.log(chalk.yellow.bold('🧪 Testing App Tracking Integration...\n'));
  
  try {
    const spinner = ora('💻 Testing app tracking...').start();
    const result = await appTracker.testAppTracking();
    
    if (result.success) {
      spinner.succeed('✅ App tracking is working!');
      console.log(chalk.green.bold(`\n🎉 Found ${result.totalApps} active applications`));
      console.log(chalk.cyan(`📱 Platform: ${result.platform}`));
      console.log(chalk.cyan(`📊 Categories: ${result.categories.join(', ')}`));
      
      if (result.topApps.length > 0) {
        console.log(chalk.blue('\n💻 Top Apps Currently Running:'));
        result.topApps.forEach(app => {
          console.log(chalk.white(`  • ${app}`));
        });
      }
      
      console.log(chalk.cyan('\n💡 Your wtfdid summaries will include app usage data!'));
      
    } else {
      spinner.fail('❌ App tracking not available');
      console.log(chalk.yellow('\n⚠️  App Tracking Issues:\n'));
      console.log(chalk.red(result.error));
      console.log(chalk.cyan(`\n💡 Platform: ${result.platform} - Some features may be limited`));
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

async function setupGoogleCalendar() {
  const readline = require('readline');
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  console.log(chalk.yellow.bold('🔧 Setting up Google Calendar Integration...\n'));
  
  console.log(chalk.cyan('📋 First, get your Google API credentials:'));
  console.log(chalk.white('1. Go to: https://console.cloud.google.com/'));
  console.log(chalk.white('2. Create/select a project'));
  console.log(chalk.white('3. Enable Google Calendar API'));
  console.log(chalk.white('4. Create API Key credentials'));
  console.log(chalk.white('5. Make sure your calendar is public or shared\n'));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
  
  try {
    console.log(chalk.green.bold('🔑 Let\'s configure your credentials:\n'));
    
    const apiKey = await question(chalk.cyan('Enter your Google API Key: '));
    if (!apiKey.trim()) {
      console.log(chalk.red('❌ API Key is required!'));
      rl.close();
      return;
    }
    
    const calendarId = await question(chalk.cyan('Enter your Calendar ID (usually your email): '));
    if (!calendarId.trim()) {
      console.log(chalk.red('❌ Calendar ID is required!'));
      rl.close();
      return;
    }
    
    // Create global config
    const configPath = path.join(os.homedir(), '.wtfdid-config.json');
    const config = {
      googleApiKey: apiKey.trim(),
      googleCalendarId: calendarId.trim(),
      setupDate: new Date().toISOString()
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green.bold('\n✅ Configuration saved successfully!'));
    console.log(chalk.gray(`Config file: ${configPath}`));
    
    // Test the configuration
    console.log(chalk.yellow('\n🧪 Testing your configuration...'));
    const calendarFetcher = require('../src/calendarFetcher');
    const testResult = await calendarFetcher.testConnection();
    
    if (testResult.success) {
      console.log(chalk.green.bold('🎉 Google Calendar integration is working!'));
      console.log(chalk.cyan(`Found access to calendar: ${calendarId}`));
      
      // Try to fetch today's events
      const events = await calendarFetcher.getTodaysEvents();
      console.log(chalk.blue(`📅 Found ${events.length} events for today`));
      
      if (events.length > 0) {
        console.log(chalk.white('\nSample events:'));
        events.slice(0, 3).forEach(event => {
          const time = event.isAllDay ? 'All day' : 
            new Date(event.start).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
          console.log(chalk.gray(`  • ${time}: ${event.title}`));
        });
      }
    } else {
      console.log(chalk.red.bold('❌ Configuration test failed:'));
      console.log(chalk.red(testResult.error));
      console.log(chalk.yellow('\n💡 Common issues:'));
      console.log(chalk.white('- Make sure your calendar is public or properly shared'));
      console.log(chalk.white('- Verify your API key has Calendar API access'));
      console.log(chalk.white('- Check that the Calendar ID is correct'));
    }
    
  } catch (error) {
    console.log(chalk.red.bold('❌ Setup failed:'), error.message);
  } finally {
    rl.close();
  }
  
  console.log(chalk.magenta.bold('\n🚀 Setup complete! Try: wtfdid\n'));
}

async function generateStandupSummary(targetDate) {
  console.log(chalk.cyan.bold('📋 Generating Standup Summary...\n'));
  
  try {
    // Gather all data
    const spinner1 = ora('🔍 Gathering your accomplishments...').start();
    const commits = await gitSummary.getTodaysCommits(targetDate);
    const files = await fileTracker.getTodaysFiles(targetDate);
    const events = await calendarFetcher.getTodaysEvents(targetDate);
    const appCategories = await appTracker.getTodaysApps(targetDate);
    const streakData = await streakTracker.getStreakInfo();
    spinner1.succeed('✅ Data collected');
    
    // Generate standup-specific summary
    const spinner2 = ora('📝 Creating standup summary...').start();
    const standupSummary = await aiSummarizer.generateStandupSummary(commits, files, events, appCategories, streakData, targetDate);
    spinner2.succeed('✅ Standup summary ready');
    
    // Display the standup summary
    console.log(chalk.green.bold('\n🎯 STANDUP SUMMARY\n'));
    console.log(standupSummary);
    
    // Offer to copy to clipboard
    console.log(chalk.yellow('\n💡 Tip: Copy this summary for your standup meeting!'));
    console.log(chalk.gray('You can also save it with: wtfdid --standup --save\n'));
    
  } catch (error) {
    console.error(chalk.red('💥 Failed to generate standup summary:'), error.message);
  }
}

async function generateStandupContent(commits, files, events, appCategories, streakData, targetDate) {
  const dateStr = targetDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let summary = `📅 **${dateStr} - Daily Standup**\n\n`;
  
  // WHAT I DID YESTERDAY/TODAY
  summary += `## 🎯 What I Accomplished:\n\n`;
  
  if (commits.length > 0) {
    summary += `**Code Changes (${commits.length} commit${commits.length > 1 ? 's' : ''}):**\n`;
    commits.slice(0, 5).forEach(commit => {
      // Clean up commit messages for standup
      const cleanMessage = commit.message
        .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
        .replace(/^\w+\s*[-:]\s*/, '')
        .replace(/^(add|update|fix|remove|implement|create)\s*/i, '')
        .trim();
      summary += `  • ${cleanMessage}\n`;
    });
    if (commits.length > 5) {
      summary += `  • ...and ${commits.length - 5} more commits\n`;
    }
    summary += '\n';
  }
  
  if (files.length > 0) {
    const fileStats = getFileTypeStats(files);
    summary += `**Files Modified:** ${files.length} files (`;
    summary += Object.entries(fileStats).map(([ext, count]) => `${count} ${ext}`).join(', ');
    summary += ')\n\n';
  }
  
  // MEETINGS & COLLABORATION
  if (events && events.length > 0) {
    summary += `**Meetings & Collaboration:**\n`;
    events.forEach(event => {
      const time = event.isAllDay ? 'All day' : 
        new Date(event.start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      summary += `  • ${time}: ${event.title}`;
      if (event.attendees > 0) {
        summary += ` (${event.attendees} attendees)`;
      }
      summary += '\n';
    });
    summary += '\n';
  }
  
  // TOOLS & FOCUS AREAS
  if (appCategories && Object.keys(appCategories).length > 0) {
    const totalApps = Object.values(appCategories).flat().length;
    if (totalApps > 0) {
      summary += `**Tools & Focus Areas:**\n`;
      Object.entries(appCategories).forEach(([category, apps]) => {
        if (apps.length > 0 && category !== 'other') {
          const topApps = apps.slice(0, 3).map(app => app.name).join(', ');
          summary += `  • ${category.charAt(0).toUpperCase() + category.slice(1)}: ${topApps}`;
          if (apps.length > 3) {
            summary += ` (+${apps.length - 3} more)`;
          }
          summary += '\n';
        }
      });
      summary += '\n';
    }
  }
  
  // BLOCKERS & CHALLENGES
  summary += `## 🚧 Blockers/Challenges:\n`;
  summary += `  • None at the moment\n`;
  summary += `  • (Update this section as needed)\n\n`;
  
  // WHAT'S NEXT
  summary += `## 🎯 Today's Plan:\n`;
  summary += `  • Continue working on current features\n`;
  summary += `  • Address any code review feedback\n`;
  summary += `  • (Add your specific goals here)\n\n`;
  
  // PRODUCTIVITY STREAK (if impressive)
  if (streakData && streakData.currentStreak >= 3) {
    const streakEmoji = streakData.currentStreak >= 7 ? '🔥' : '⭐';
    summary += `## ${streakEmoji} Productivity Streak: ${streakData.currentStreak} days!\n\n`;
  }
  
  summary += `---\n`;
  summary += `*Generated by wtfdid CLI - Track your daily wins!*`;
  
  return summary;
}

function getFileTypeStats(files) {
  const stats = {};
  files.forEach(file => {
    const ext = file.extension || 'no extension';
    stats[ext] = (stats[ext] || 0) + 1;
  });
  return stats;
}

async function generateStandupSummary(targetDate, saveToJournal = false) {
  console.log(chalk.blue.bold('📋 Generating Standup Summary...\n'));
  
  try {
    // Gather all data
    const spinner1 = ora('Collecting data...').start();
    const [commits, files, events, appCategories] = await Promise.all([
      gitSummary.getTodaysCommits(targetDate),
      fileTracker.getTodaysFiles(targetDate),
      calendarFetcher.getTodaysEvents(targetDate),
      appTracker.getTodaysApps(targetDate)
    ]);
    
    const streakData = await streakTracker.updateStreak(commits, files, events, targetDate);
    spinner1.succeed('Data collected');
    
    // Generate standup-specific summary
    const standupSummary = await generateStandupContent(commits, files, events, appCategories, streakData, targetDate);
    
    console.log(chalk.green.bold('\n📊 STANDUP SUMMARY\n'));
    console.log(standupSummary);
    
    // Save to journal if requested
    if (saveToJournal) {
      const spinner2 = ora('💾 Saving standup summary to journal...').start();
      await journalWriter.saveToJournal(`# Standup Summary\n\n${standupSummary}`, targetDate);
      spinner2.succeed('📖 Standup summary saved to journal');
    }
    
    // Offer to copy to clipboard
    console.log(chalk.gray('\n💡 Tip: Copy this summary for your standup meeting!'));
    if (!saveToJournal) {
      console.log(chalk.yellow('    You can also save it with: wtfdid --standup --save'));
    }
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('💥 Failed to generate standup summary:'), error.message);
  }
}

async function generateStandupContent(commits, files, events, appCategories, streakData, targetDate) {
  const dateStr = targetDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let summary = `🗓️ **Daily Standup - ${dateStr}**\n\n`;
  
  // WHAT I DID YESTERDAY/TODAY
  summary += `## ✅ What I Accomplished:\n\n`;
  
  if (commits.length > 0) {
    summary += `**Code Changes (${commits.length} commit${commits.length > 1 ? 's' : ''}):**\n`;
    commits.slice(0, 5).forEach(commit => {
      // Clean up commit message for standup
      const cleanMessage = commit.message
        .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
        .replace(/🚀|✨|🔧|📝|🐛|💡|🎉|🔥|⚡|🎯/g, '')
        .trim();
      summary += `  • ${cleanMessage}\n`;
    });
    if (commits.length > 5) {
      summary += `  • ...and ${commits.length - 5} more commits\n`;
    }
    summary += '\n';
  }
  
  if (events && events.length > 0) {
    summary += `**Meetings & Events (${events.length}):**\n`;
    events.forEach(event => {
      const time = event.isAllDay ? 'All day' : 
        new Date(event.start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      summary += `  • ${time}: ${event.title}\n`;
    });
    summary += '\n';
  }
  
  if (files.length > 0) {
    const fileStats = {};
    files.forEach(file => {
      const ext = file.extension || 'config';
      fileStats[ext] = (fileStats[ext] || 0) + 1;
    });
    
    summary += `**Files Modified:** ${files.length} files (`;
    summary += Object.entries(fileStats)
      .map(([ext, count]) => `${count} ${ext}`)
      .join(', ');
    summary += ')\n\n';
  }
  
  // WHAT I'M WORKING ON TODAY
  summary += `## 🎯 Today's Focus:\n`;
  if (commits.length > 0) {
    const recentWork = commits[0].message
      .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
      .replace(/🚀|✨|🔧|📝|🐛|💡|🎉|🔥|⚡|🎯/g, '')
      .trim();
    summary += `  • Continue work on: ${recentWork}\n`;
  }
  
  if (events && events.length > 0) {
    const upcomingEvents = events.filter(event => new Date(event.start) > new Date());
    if (upcomingEvents.length > 0) {
      summary += `  • Upcoming meetings: ${upcomingEvents.length} scheduled\n`;
    }
  }
  
  summary += `  • Code reviews and testing\n`;
  summary += `  • Documentation updates\n\n`;
  
  // BLOCKERS
  summary += `## 🚧 Blockers:\n`;
  summary += `  • None at the moment\n\n`;
  
  // PRODUCTIVITY METRICS
  if (streakData && streakData.currentStreak > 0) {
    summary += `## 📈 Productivity:\n`;
    summary += `  • ${streakData.currentStreak} day productivity streak 🔥\n`;
    if (streakData.currentStreak >= 7) {
      summary += `  • Maintaining excellent momentum!\n`;
    }
    summary += '\n';
  }
  
  // QUICK STATS
  summary += `---\n`;
  summary += `**Quick Stats:** ${commits.length} commits • ${files.length} files • ${events?.length || 0} meetings`;
  if (streakData?.currentStreak > 0) {
    summary += ` • ${streakData.currentStreak} day streak`;
  }
  
  return summary;
}

function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

program.parse();