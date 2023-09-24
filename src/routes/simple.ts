// FILE CONTAINING ALL SIMPLE ROUTES

import { app } from '../app';
import sql from '../db';
import crypto from 'crypto';

app.get('/', async (req, res) => {
  const options = {
    root: 'public',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };

  return res.sendFile('home.html', options);
});

app.get('/style', async (req, res) => {
  const options = {
    root: 'public',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };

  return res.sendFile('home.css', options);
})

app.get('/chatlog/:id', async (req, res) => {
  const hash = crypto.createHash('sha256');
  hash.update(req.params.id, 'hex');
  const keyHash = hash.digest();

  const query = await sql`SELECT * FROM "Chatlog" WHERE "keyHash" = ${keyHash}`;
  if (query.length === 0) return res.status(404).send('No chat log with that ID exists. It may have been automatically deleted.');

  const chatlog = query[0];

  try {
    const decipher = crypto.createDecipheriv('aes-128-gcm', Buffer.from(req.params.id, 'hex'), chatlog.iv);
    decipher.setAuthTag(chatlog.authTag);
    const decipherBytes = Buffer.concat([decipher.update(chatlog.html), decipher.final()]);
    const html = decipherBytes.toString('utf8');

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Internal Server Error.');
  }
});

app.get('/invite', async (req, res) => {
  return res.redirect('https://discord.com/api/oauth2/authorize?client_id=745401642664460319&permissions=3154439422&scope=bot%20applications.commands');
});

app.get('/discord', async (req, res) => {
  return res.redirect('https://discord.gg/v2AV3XtnBM')
})

app.get('*', async (req, res) => {
  return res.status(404).send('Page does not exist.');
});