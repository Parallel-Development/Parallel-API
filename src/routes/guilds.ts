import { app } from "../app";
import { getUser } from "./dapi";
import { makeDiscordAuthURI } from "./oauth2";
import { options } from "./simple";

app.get('/guilds', async (req, res) => {
  try {
    await getUser(req, res);
    res.sendFile('guilds.html', options());
  } catch {
    return res.redirect(makeDiscordAuthURI('guilds'));
  }
});