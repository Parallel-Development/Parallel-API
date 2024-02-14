const account = document.getElementById('account');
const pfp = document.getElementById('account-pfp');
const username = document.getElementById('account-username');
const noServers = document.getElementById('no-servers');
const servers = document.getElementById('servers-container');

const makeCard = (id, title, img) => {
  const baseCard = document.createElement('div');
  baseCard.classList.add('card');
  
  const baseCardImg = document.createElement('img');
  baseCardImg.classList.add('card-img-top');
  if (img) img = `https://cdn.discordapp.com/icons/${id}/${img}`;

  baseCardImg.src = img ?? 'https://cdn.discordapp.com/icons/747624284008218787/0b8ca594d70931cb65ef947de263ccf1.webp';
  
  const baseCardBody = document.createElement('div');
  baseCardBody.classList.add('body');
  
  const baseCardTitle = document.createElement('h5');
  baseCardTitle.className = 'card-title text-center';
  baseCardTitle.innerHTML = title;
  
  baseCardBody.appendChild(baseCardTitle);
  baseCard.append(baseCardImg, baseCardBody);

  baseCard.setAttribute('guild-id', id);

  return baseCard;
}

async function main() {
  const r = await fetch('/api/@me');

  const user = await r.json();

  if (!r.ok) return console.log(user);

  account.classList.remove('d-none');

  pfp.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`;
  username.innerHTML = user.username;

  const appealsRequest = await fetch('/api/appeals');
  const guildIds = await appealsRequest.json();

  if (!appealsRequest.ok) return console.log(guildIds);

  if (guildIds.length === 0) {
    noServers.classList.remove('d-none');
    servers.style.justifyContent = 'center';
    return;
  }

  for (const guildId of guildIds) {
    const r = await fetch(`/api/guilds/${guildId}`);
    const guild = await r.json();

    if (!r.ok) return console.log(guild);

    const card = makeCard(guild.id, guild.name, guild.icon);
    card.addEventListener('click', () => onCardClick(guild.id));

    servers.append(card);
  }
}

function onCardClick(guildId) {
  window.location.href = `/appeals/${guildId}`;
}

main();