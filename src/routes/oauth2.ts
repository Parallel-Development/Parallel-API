import { app } from '../app';

export const API_ENDPOINT = 'https://discord.com/api/v10';
export const d30 = 2592000000;

app.get('/oauth2/callback', async (req, res) => {
  if (req.query.error) return res.redirect('/');

  const { code, redirect_uri } = req.query as { code: string; redirect_uri: string | undefined };
  if (!code) return res.sendStatus(400);

  const r = await fetch(`${API_ENDPOINT}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: makeRedirectURI(redirect_uri)
    }).toString()
  });

  const response = await r.json();

  if (!r.ok) return res.status(r.status).type('text/plain').send(response);

  const { access_token, refresh_token, scope } = response;

  if (!scope.includes('identify')) return res.status(400).type('text/plain').send('Invalid scope.');

  res.cookie('access_token', access_token, { httpOnly: true, maxAge: d30 });
  res.cookie('refresh_token', refresh_token, { httpOnly: true, maxAge: d30 });

  return res.redirect(redirect_uri ? `${process.env.ORIGIN}/${redirect_uri}` : '/');
});

app.get('/login', async (req, res) => {
  // redirect_uri is not a full uri. Just the relative page.
  // Example: /appeals
  const { redirect_uri } = req.query as { redirect_uri: string | undefined };
  return res.redirect(makeDiscordAuthURI(redirect_uri));
});

app.get('/logout', async (_, res) => {
  res.clearCookie('access_token', { httpOnly: true });
  res.clearCookie('refresh_token', { httpOnly: true });

  return res.redirect('/');
});

export async function refreshToken(token: string) {
  const r = await fetch(`${API_ENDPOINT}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: token
    }).toString()
  });

  const response = await r.json();

  if (!r.ok) throw response;

  return response;
}

function makeRedirectURI(redirect?: string) {
  return `${process.env.ORIGIN}/oauth2/callback${redirect ? `?redirect_uri=${redirect}` : ''}`;
}

export function makeDiscordAuthURI(redirect?: string) {
  const redirectURI = encodeURIComponent(makeRedirectURI(redirect));
  return `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${redirectURI}&scope=identify+guilds`;
}
