const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

const BOT_PATH = '/tmp/bot';
if (!fs.existsSync(BOT_PATH)) fs.mkdirSync(BOT_PATH);

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 120000, cwd: BOT_PATH }, (e, out, err) => {
      if (e) reject(err || e.message);
      else resolve(out);
    });
  });
}

app.post('/deploy', async (req, res) => {
  const { repo } = req.body;
  try {
    if (!repo) throw 'GitHub link එක දෙන්න';
    await run('rm -rf *');
    await run(`git clone ${repo}.`);
    if (fs.existsSync('package.json')) await run('npm install');
    const file = fs.existsSync('index.js')? 'index.js' : 'app.js';
    run(`node ${file}`); // background run

    setTimeout(async () => {
      try {
        const logs = await run('cat nohup.out || echo "Starting..."');
        const code = logs.match(/([A-Z0-9]{4}-[A-Z0-9]{4})|code[:\s]*([A-Z0-9-]{8,})/i);
        res.json({
          success: true,
          url: req.get('host'),
          pairCode: code? (code[1] || code[2]) : 'Bot started. Render logs බලන්න',
          message: 'Free plan නිසා 15min idle උනාම sleep වෙනවා'
        });
      } catch (e) {
        res.json({ success: true, pairCode: 'Check Render logs' });
      }
    }, 8000);
  } catch (err) {
    res.json({ success: false, error: err.toString() });
  }
});

app.get('/', (req, res) => res.send('Bot API OK'));
app.listen(process.env.PORT || 3000);
