import { app } from '../app';
import crypto from 'crypto';
import sql from '../db';
import { Chatlog } from '../types';

app.get('/chatlog/:id', async (req, res) => {
  if (req.params.id.length % 2 !== 0) return res.status(400).type('text/plain').send('Invalid chatlog ID.');

  const hash = crypto.createHash('sha256');
  hash.update(req.params.id, 'hex');
  const keyHash = hash.digest();

  const query = await sql`SELECT * FROM "Chatlog" WHERE "keyHash" = ${keyHash}`;
  if (query.length === 0)
    return res
      .status(404)
      .type('text/plain')
      .send('No chat log with that ID exists. It may have been automatically deleted.');

  const chatlog = query[0] as Chatlog;

  try {
    const decipher = crypto.createDecipheriv('aes-128-gcm', Buffer.from(req.params.id, 'hex'), chatlog.iv);
    decipher.setAuthTag(chatlog.authTag);
    const decipherBytes = Buffer.concat([decipher.update(chatlog.html), decipher.final()]);
    const html = decipherBytes.toString('utf8');

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});
