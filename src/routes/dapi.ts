import { app } from '../app';
import { User } from '../types';
import { API_ENDPOINT, refreshToken } from './oauth2';

export async function getUser(req: any, res: any): Promise<User> {
  let { access_token, refresh_token } = req.cookies;

  if (!access_token) throw { status: 401 };

  let r = await fetch(`${API_ENDPOINT}/users/@me`, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  if (r.status === 401) {
    try {
      const refresh = await refreshToken(refresh_token);

      res.cookie('access_token', refresh.access_token, { httpOnly: true });
      res.cookie('refresh_token', refresh.refresh_token, { httpOnly: true });

      access_token = refresh.access_token;
      refresh_token = refresh.refresh_token;

      r = await fetch(`${API_ENDPOINT}/users/@me`, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
    } catch {
      throw { status: 401, data: null };
    }
  }

  const user: User = await r.json();

  if (!r.ok) throw { status: r.status, data: user };

  return user;
}

app.get('/api/@me', async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    return res.send(user);
  } catch (e: any) {
    if (e.data) return res.status(e.status).send(e.data);
    else return res.sendStatus(e.status);
  }
});

app.get('/api/guilds/:id', async (req, res) => {
  const r = await fetch(`${API_ENDPOINT}/guilds/${req.params.id}`, {
    headers: {
      Authorization: `Bot ${process.env.TOKEN}`
    }
  });

  const response = await r.json();

  if (!r.ok) return res.status(r.status).send(response);

  const { id, name, icon } = response;
  return res.send({ id, name, icon });
});
