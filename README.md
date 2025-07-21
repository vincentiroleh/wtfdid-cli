# wtfdid-cli 🤯

> A hilarious but genuinely useful CLI that tells devs WTF they did today

Never end another workday wondering what you accomplished. This CLI gathers your Git commits, file changes, and uses AI to generate a delightful daily summary that'll make you feel like the productive code wizard you actually are.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Find out WTF you did today
npx wtfdid

# Save it to your journal
npx wtfdid --save

# Check what you did yesterday
npx wtfdid --yesterday

# See the raw data before AI magic
npx wtfdid --dry-run
```

## 🎯 What It Does

- **Git Analysis**: Scans today's commits across all branches
- **File Tracking**: Lists files you modified today (ignores node_modules, .git, etc.)
- **AI Summary**: Uses Q Developer CLI + Claude to create a witty, encouraging summary
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

### Q Developer Setup
The CLI will create a basic `q-agent-config.json` automatically, but you can customize it:

```json
{
  "name": "wtfdid-summarizer",
  "description": "Daily productivity summary agent",
  "instructions": "You are a witty productivity assistant...",
  "model": "claude-3-sonnet"
}
```

## 📋 Commands

```bash
wtfdid                 # Generate today's summary
wtfdid --save         # Also save to ~/journals/
wtfdid --yesterday    # Yesterday's summary
wtfdid --dry-run      # Show raw data without AI
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

Well played today, boss. Time to celebrate with your favorite beverage! 🍺

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

## 🎪 Features

- **Smart Git Parsing**: Finds commits from today across all branches
- **Intelligent File Filtering**: Ignores noise (node_modules, logs, etc.)
- **Fallback Summaries**: Works even if AI fails
- **Journal Integration**: Builds a markdown journal over time
- **Developer Humor**: Because coding should be fun
- **Cross-Platform**: Works on Windows, Mac, Linux

## 🤝 Contributing

This is built for the AWS Q Developer Challenge - let's make it legendary!

1. Fork it
2. Create your feature branch
3. Add some humor and polish
4. Submit a PR

## 📝 License

MIT - Build cool stuff with it!

---

*Made with ☕ and a healthy dose of imposter syndrome*