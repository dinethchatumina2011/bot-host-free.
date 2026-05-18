const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// Replit එකේ /home/runner/appname/ path එක
const BOT_DIR = __dirname + '/bot';

const runCmd = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) reject(stderr || error.message);
    else resolve(stdout);
  });
});

app.post('/deploy', async (req, res) => {
  const { repo } = req.body;
  
  try {
    if (!repo || !repo.includes('github.com')) {
      return res.json({ success: false, error: 'GitHub link එක වැරදියි' });
    }

    // 1. Clean old bot
    await runCmd('rm -rf bot');
    await runCmd('mkdir bot');
    
    // 2. Clone new bot
    await runCmd(`git clone ${repo} bot`);
    
    // 3. Install packages
    if (fs.existsSync('./bot/package.json')) {
      await runCmd('cd bot && npm install');
    }
    
    // 4. Start bot background එකේ
    const startFile = fs.existsSync('./bot/index.js') ? 'index.js' : 'app.js';
    exec(`cd bot && node ${startFile}`, (err, stdout, stderr) => {
      console.log('Bot Log:', stdout, stderr);
    });
    
    // 5. Pair code එක හොයන්න ටිකක් ඉන්නවා
    setTimeout(async () => {
      try {
        const logs = await runCmd('ps aux | grep node');
        res.json({
          success: true,
          url: req.get('host'),
          pairCode: 'Bot Started! Replit Console එකේ QR/Pair Code බලන්න',
          message: 'Replit free එක නිසා tab එක close කරොත් bot නවතිනවා. UptimeRobot දාන්න'
        });
      } catch (e) {
        res.json({ success: true, pairCode: 'Check Replit Console for logs' });
      }
    }, 8000);
    
  } catch (err) {
    res.json({ success: false, error: err.toString() });
  }
});

app.get('/', (req, res) => res.send('Bot Host API Running on Replit'));
app.listen(3000, () => console.log('Server running'));
