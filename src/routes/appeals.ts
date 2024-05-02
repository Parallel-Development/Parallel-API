import { app } from '../app';
import sql from '../db';
import { AppealEligibility, AppealSubmitQuestion, Infraction, User } from '../types';
import { getUser } from './dapi';
import { API_ENDPOINT, makeDiscordAuthURI } from './oauth2';
import { options } from './simple';

app.get('/appeals', async (req, res) => {
  try {
    await getUser(req, res);
    res.sendFile('appeals.html', options());
  } catch {
    return res.redirect(makeDiscordAuthURI('appeals'));
  }
});

app.get('/appeals/after', async (_, res) => {
  res.sendFile('appeal-after.html', options());
});

app.post('/appeals/submit', async (req, res) => {
  const questions: AppealSubmitQuestion[] = req.body.questions;
  const guildId: string = req.body.guildId;

  if (!questions || !guildId) return res.status(400).type('text/plain').send('Invalid form body.');

  let user: User;
  try {
    user = await getUser(req, res);
  } catch {
    return res.redirect(makeDiscordAuthURI('appeals'));
  }

  const infractions: (AppealEligibility & {
    id: true;
    appealQuestions: string[];
    appealAlertWebhookURL: string | null;
  })[] = await sql`SELECT I.id, G."appealAllowed", G."appealQuestions", G."appealAlertWebhookURL",
    COALESCE(I."userId" = ANY(G."appealBlacklist"), false) as "blacklisted", 
    EXISTS(SELECT FROM "Appeal" A WHERE A.id = I.id) as "appealExists"
      FROM "Infraction" I
      INNER JOIN "Guild" G ON G.id = I."guildId"
      WHERE I."guildId" = ${guildId} AND I."userId" = ${user.id} AND I."type" = 'Ban'
      ORDER BY I.id DESC LIMIT 1`;

  if (infractions.length === 0)
    return res.status(404).type('text/plain').send('There is no ban you can appeal in this guild.');

  const infraction = infractions[0];
  if (!infraction.appealAllowed) return res.status(403).type('text/plain').send('This guild is not accepting appeals.');

  if (infraction.blacklisted)
    return res.status(403).type('text/plain').send('You are blacklisted from creating appeals in this guild.');

  if (infraction.appealExists)
    return res.status(409).type('text/plain').send('You have already submitted an appeal for this guild.');

  const checkedQuestions: string[] = [];
  for (const q of questions) {
    if (checkedQuestions.includes(q.question) || !infraction.appealQuestions.includes(q.question))
      return res.status(400).type('text/plain').send('Invalid form body.');

    checkedQuestions.push(q.question);

    if (Object.keys(questions).length > 2 || !('question' in q && 'response' in q))
      return res.status(400).type('text/plain').send('Invalid form body.');

    if (q.response.length > 1000)
      return res
        .status(400)
        .type('text/plain')
        .send(`Response for question "${q.question}" exceeds the 1000 character limit.`);
  }

  //create the appeal
  await sql`INSERT INTO "Appeal" (id, "userId", "guildId", "response", "date")
  VALUES (${infraction.id}, ${user.id}, ${guildId}, ${questions as any}, ${Date.now()})`;

  // send to Discord
  if (infraction.appealAlertWebhookURL) {
    const embed = {
      author: {
        name: `Infraction appeal from ${user.username} (${user.id})`,
        icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
      },
      description: `**Infraction ID:** ${infraction.id}\n**Infraction Type:** Ban\n\n${questions
        .map(q => `** — ${q.question} —**\n${q.response}`)
        .join('\n\n')}`,
      timestamp: new Date().toISOString(),
      color: 0x5865f2
    };

    const buttons = [
      {
        type: 2,
        style: 3,
        label: 'Accept',
        custom_id: `appeal-manager:accept?${infraction.id}`
      },
      {
        type: 2,
        style: 4,
        label: 'Deny',
        custom_id: `appeal-manager:deny?${infraction.id}`
      },
      {
        type: 2,
        style: 2,
        label: 'Disregard',
        custom_id: `appeal-manager:disregard?${infraction.id}`
      },
      {
        type: 2,
        style: 1,
        label: 'Context',
        custom_id: `appeal-manager:context?${infraction.id}`
      }
    ];

    const row = {
      type: 1,
      components: buttons
    };

    await fetch(infraction.appealAlertWebhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed],
        components: [row]
      })
    }).catch(() => {});
  }

  return res.sendStatus(201);
});

app.get('/appeals/:guildId', async (req, res) => {
  let user: User;
  try {
    user = await getUser(req, res);
  } catch {
    return res.redirect(makeDiscordAuthURI('appeals'));
  }

  const infractions: AppealEligibility[] = await sql`SELECT G."appealAllowed", 
    COALESCE(I."userId" = ANY(G."appealBlacklist"), false) as "blacklisted", 
    EXISTS(SELECT FROM "Appeal" A WHERE A.id = I.id) as "appealExists"
      FROM "Infraction" I
      INNER JOIN "Guild" G ON G.id = I."guildId"
      WHERE I."guildId" = ${req.params.guildId} AND I."userId" = ${user.id} AND I."type" = 'Ban'
      ORDER BY I.id DESC LIMIT 1`;

  if (infractions.length === 0)
    return res.status(404).type('text/plain').send('There is no ban you can appeal in this guild.');

  const infraction = infractions[0];
  if (!infraction.appealAllowed) return res.status(403).type('text/plain').send('This guild is not accepting appeals.');

  if (infraction.blacklisted)
    return res.status(403).type('text/plain').send('You are blacklisted from creating appeals in this guild.');

  if (infraction.appealExists)
    return res.status(409).type('text/plain').send('You have already submitted an appeal for this guild.');

  res.sendFile('appeal-guild.html', options());
});

app.get('/api/appeals', async (req, res) => {
  const user = await getUser(req, res).catch(e => {
    if (e.data) res.status(e.status).send(e.data);
    else res.sendStatus(e.status);
  });

  if (!user) return;

  const guilds = await sql`SELECT infractions."guildId" FROM (
    SELECT G.id as "guildId", I.id as "infractionId"
	  FROM "Guild" G
    INNER JOIN "Infraction" I ON G.id = I."guildId"
	  WHERE I."userId" = ${user.id} AND G."appealAllowed" = true AND I."type" = 'Ban'
    AND (G."appealBlacklist" IS NULL OR I."userId" != ALL(G."appealBlacklist"))
	  ORDER BY I.id DESC
	  LIMIT 1
  ) as infractions WHERE NOT EXISTS(SELECT FROM "Appeal" A WHERE A.id = infractions."infractionId")`;

  return res.send(guilds.map(g => g.guildId));
});

app.get('/api/appeals/:guildId', async (req, res) => {
  let user: User;
  try {
    user = await getUser(req, res);
  } catch {
    return res.redirect(makeDiscordAuthURI('appeals'));
  }

  const infractions: Infraction[] = await sql`SELECT I.*, G."appealQuestions"
  FROM "Infraction" I
  INNER JOIN "Guild" G ON G.id = I."guildId"
  WHERE I."guildId" = ${req.params.guildId} AND I."userId" = ${user.id} AND I."type" = 'Ban'
  ORDER BY I.id DESC LIMIT 1`;

  if (infractions.length === 0) return res.sendStatus(404);

  const infraction = infractions[0];

  // hide moderator ID.
  delete infraction.moderatorId;

  return res.send(infraction);
});
