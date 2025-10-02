const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const { ensureUsersTable } = require('./lib/db');

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);

const port = process.env.PORT || 4000;

ensureUsersTable()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });



