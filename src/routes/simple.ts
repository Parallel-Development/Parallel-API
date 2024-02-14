// FILE CONTAINING ALL SIMPLE ROUTES

import { app } from '../app';

export const options = () => ({
  root: 'public',
  headers: {
    'x-timestamp': Date.now(),
    'x-sent': true
  }
});

app.get('/', async (_, res) => res.sendFile('home.html', options()));
app.get('/privacy', async (_, res) => res.sendFile('privacy.html', options()));
app.get('/terms', async (_, res) => res.sendFile('terms.html', options()));

app.get('/invite', async (_, res) =>
  res.redirect(
    'https://discord.com/api/oauth2/authorize?client_id=745401642664460319&permissions=3154439422&scope=bot%20applications.commands'
  )
);
app.get('/discord', async (_, res) => res.redirect('https://discord.gg/v2AV3XtnBM'));
//app.get('*', async (_, res) => res.status(404).type('text/plain').send('The requested page does not exist.'));
