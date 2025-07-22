# wtfdid-cli 🤯

> **AWS Q Developer Challenge #1 Entry**: A hilarious but genuinely useful CLI that tells devs WTF they did today

Built specifically for the **AWS Q Developer Challenge**, this CLI showcases innovative use of **Q Developer CLI agents** to transform your daily Git commits and file changes into delightful, witty productivity summaries. Never end another workday wondering what you accomplished!

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup Google Calendar integration (optional but recommended)
npx wtfdid --setup-calendar

# Find out WTF you did today (with calendar events!)
npx wtfdid

# Save it to your journal
npx wtfdid --save

# Check what you did yesterday
npx wtfdid --yesterday

# See the raw data before AI magic
npx wtfdid --dry-run

# Test integrations
npx wtfdid --test-q          # Test Q Developer CLI
npx wtfdid --test-calendar   # Test Google Calendar
npx wtfdid --test-apps       # Test app tracking
```

## 🎯 What It Does

- **Git Analysis**: Scans today's commits across all branches
- **File Tracking**: Lists files you modified today (ignores node_modules, .git, etc.)
- **App Usage Tracking**: Monitors applications you used (VS Code, browsers, terminals, etc.)
- **Google Calendar Integration**: Includes your meetings and events in the summary
- **Productivity Streak**: Tracks your daily coding momentum
- **AI Summary**: Uses Q Developer CLI + Claude to create a witty, encouraging summary
- **Standup Ready**: Generate professional summaries perfect for daily standup meetings
- **Journal Integration**: Optionally saves summaries to `~/journals/YYYY-MM-DD.md`
- **Personality**: Talks like your favorite dev buddy who actually gets it

## 🛠 Setup

### Prerequisites
- Node.js 14+
- Git repository (for commit tracking)
- Q Developer CLI installed and configured

### Installation
```bash
git clone <this-repo>
cd wtfdid-cli
npm install
npm link  # Makes 'wtfdid' available globally
```

### Q Developer Setup (Required for AI Summaries)

**This tool is designed to showcase Q Developer CLI integration for the AWS Q Developer Challenge!**

1. **Install Q Developer CLI**: Follow the [official Q Developer setup guide](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/q-cli.html)

2. **Test Q Developer Integration**:
   ```bash
   npx wtfdid --test-q
   ```

3. **Configure Your Agent** (optional):
   The CLI automatically creates a `q-agent-config.json` with optimized settings:
   ```json
   {
     "name": "wtfdid-summarizer",
     "description": "Daily productivity summary agent",
     "instructions": "You are a witty productivity assistant that helps developers understand what they accomplished each day. Be encouraging, slightly sarcastic, and use developer-friendly language.",
     "model": "claude-3-sonnet"
   }
   ```

4. **Verify Setup**:
   ```bash
   q chat "Hello from wtfdid-cli!"
   ```

**Note**: The tool works without Q Developer (using built-in fallback summaries), but Q Developer integration is what makes this a true hackathon showcase!

### Google Calendar Setup (Optional but Awesome!)

Add your calendar events to daily summaries for complete productivity tracking:

#### Quick Setup:
```bash
wtfdid --setup-google
```

#### Manual Setup:

1. **Get Google API Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Calendar API
   - Create API Key credentials
   - Copy your API key and calendar ID (usually your email)

2. **Configure Globally (Recommended)**:
   Create `~/.wtfdid-config.json`:
   ```json
   {
     "googleApiKey": "your-api-key-here",
     "googleCalendarId": "your-email@gmail.com"
   }
   ```

3. **Alternative: Environment Variables**:
   Add to your shell profile (`~/.bashrc`, `~/.zshrc`):
   ```bash
   export GOOGLE_API_KEY="your-api-key-here"
   export GOOGLE_CALENDAR_ID="your-email@gmail.com"
   ```

4. **Test Integration**:
   ```bash
   wtfdid --test-calendar
   ```

## 📋 Commands

```bash
# Main Commands
wtfdid                    # Generate today's summary (with everything!)
wtfdid --standup         # Generate standup-ready summary
wtfdid --save            # Also save to ~/journals/
wtfdid --yesterday       # Yesterday's summary
wtfdid --dry-run         # Show raw data without AI

# Setup & Testing
wtfdid --setup-google    # Setup Google Calendar integration
wtfdid --test-calendar   # Test Google Calendar integration
wtfdid --test-apps       # Test app tracking integration
wtfdid --test-q          # Test Q Developer CLI integration
wtfdid --streak          # Show productivity streak info
```

## 🎨 Sample Output

```
🧠 wtfdid-cli: Let's see what you accomplished, boss...

✅ Found 3 commits. Not bad!
✅ You edited 8 files today. Impressive!
✅ Summary generated. Spoiler: you're amazing.

📋 Your Daily Summary:

🗓️ **Daily Summary for 1/21/2025**

📝 **Git Activity** (3 commits)
  • a1b2c3d: "Fix authentication bug that haunted me for 2 days"
  • e4f5g6h: "Add error handling because production is scary"
  • i7j8k9l: "Update README because documentation matters"

📁 **File Changes** (8 files modified)
  • .js: 4 files
  • .md: 2 files
  • .json: 2 files

**Recent files you touched:**
  • src/auth.js
  • README.md
  • package.json
  • tests/auth.test.js

🗓️ **Calendar Events** (2 events)
  • 9:00 AM: "Daily Standup" (30m)
  • 2:00 PM: "Code Review Session" (1h)

💻 **Applications Used** (5 apps across categories)
  • Development: code, terminal, node
  • Browsers: chrome, firefox

🔥 **Productivity Streak**: 9 days!

Well played today, boss. You're building something amazing! 🚀

✨ Now go eat. You earned it, Code Wizard! ✨
```

## 🏗 Architecture

```
wtfdid-cli/
├── bin/wtfdid.js           # CLI entry point
├── src/
│   ├── gitSummary.js       # Git commit analysis
│   ├── fileTracker.js      # File modification tracking
│   ├── aiSummarizer.js     # Q Developer integration
│   └── journalWriter.js    # Journal file management
└── package.json
```

## 🏆 Q Developer Challenge Innovation

This project showcases **innovative Q Developer CLI usage** in several key ways:

### 🤖 **Q Developer CLI Agent Integration**
- **Custom Agent Configuration**: Creates a specialized `wtfdid-summarizer` agent with personality-driven instructions
- **Dynamic Agent Invocation**: Automatically tries multiple Q Developer CLI command patterns for maximum compatibility
- **Intelligent Fallback**: Gracefully handles Q Developer unavailability while maintaining functionality

### 🔄 **Smart Q Developer Workflow**
```bash
# The CLI tries these Q Developer commands in order:
q chat --agent-id wtfdid-summarizer [prompt]  # Custom agent
q chat [prompt]                               # Standard chat
q agents chat --agent wtfdid-summarizer       # Agent-specific chat
aws q chat [prompt]                           # AWS CLI integration
```

### 📊 **Data-Driven AI Prompts**
- **Structured Input**: Feeds Q Developer rich, structured data about Git commits and file changes
- **Context-Aware Prompting**: Builds intelligent prompts that help Q Developer understand developer workflow
- **Personality Injection**: Uses Q Developer to maintain consistent, witty personality across all summaries

### 🛠 **Real-World Productivity Solution**
This isn't just a demo - it's a **genuine productivity tool** that developers can use daily to:
- Reflect on their accomplishments
- Build a searchable journal of their work
- Get encouraging feedback about their progress
- Track productivity patterns over time

## 🎪 Features

- **Smart Git Parsing**: Finds commits from today across all branches
- **Intelligent File Filtering**: Ignores noise (node_modules, logs, etc.)
- **Cross-Platform App Tracking**: Monitors VS Code, browsers, terminals, and more
- **Google Calendar Integration**: Includes meetings and events in your summary
- **Productivity Streak Tracking**: Gamifies your daily coding habits
- **Q Developer AI Summaries**: Witty, encouraging summaries powered by Q Developer CLI
- **Standup Summaries**: Professional, concise summaries perfect for team meetings
- **Fallback Summaries**: Works even if Q Developer is unavailable
- **Journal Integration**: Builds a markdown journal over time
- **Developer Humor**: Because coding should be fun
- **Cross-Platform**: Works on Windows, Mac, Linux

## 📋 Perfect for Daily Standups

Never struggle with "What did I do yesterday?" again! The `--standup` flag generates professional summaries perfect for team meetings:

```bash
wtfdid --standup
```

**Sample Standup Output:**
```markdown
## 📅 Daily Standup - Tuesday, July 22, 2025

### 🎯 What I Accomplished:
• Fixed authentication bug in user login flow
• Implemented new dashboard components
• Updated API documentation
• Attended sprint planning meeting (2h)

### 🎯 What I'm Working On Next:
• Complete user profile feature
• Address code review feedback
• Prepare for client demo

### 🚧 Blockers/Challenges:
• Waiting for API endpoint from backend team
```

## 🤝 Contributing

This is built for the AWS Q Developer Challenge - let's make it legendary!

1. **Fork the repository**
2. **Create your feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### 💡 Ideas for Contributions:
- Additional calendar integrations (Outlook, Apple Calendar)
- More app tracking platforms and categories
- Enhanced AI prompt engineering
- Better streak visualization
- Export formats (PDF, HTML)
- Team/organization features

## 🐛 Issues & Support

Found a bug or have a feature request? 

1. **Check existing issues** first
2. **Create a new issue** with:
   - Clear description of the problem/feature
   - Steps to reproduce (for bugs)
   - Your environment (OS, Node version)
   - Sample output (if applicable)

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

This means you can:
- ✅ Use it commercially
- ✅ Modify it however you want
- ✅ Distribute it
- ✅ Use it privately
- ✅ Sublicense it

Just keep the copyright notice and license text in any copies.

## 🙏 Acknowledgments

- **AWS Q Developer** for the amazing AI capabilities
- **Google Calendar API** for calendar integration
- **All the developers** who will use this to track their daily wins
- **The open source community** for inspiration and tools

## ⭐ Show Your Support

If this tool helps you track your daily productivity wins, please:
- ⭐ **Star this repository**
- 🐦 **Share it on social media**
- 💬 **Tell your developer friends**
- 🍕 **Buy me a coffee** (just kidding, star it instead!)

---

**Built with ☕ and a healthy dose of "WTF did I actually accomplish today?" energy**

---

*Made with ☕ and a healthy dose of imposter syndrome*