const guildName = document.getElementById('guild-name');
const reason = document.getElementById('reason');
const date = document.getElementById('date');
const expires = document.getElementById('expires');
const br = document.getElementById('br');
const form = document.getElementById('form');
const submitBtn = document.getElementById('submit-btn');
const loading = document.getElementById('loading');

form.addEventListener('submit', async e => {
  loading.classList.remove('d-none');
  submitBtn.classList.add('disabled');
  submitBtn.disabled = true;

  e.preventDefault();

  const questions = Array.from(document.getElementsByClassName('question'));
  const body = questions.map(q => (
    { question: q.children[0].textContent.slice(0, -2), response: q.children[1].value }
  ));

  const r = await fetch(`/appeals/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      questions: body,
      guildId: window.location.pathname.split('/')[2]
    })
  });

  const response = await r.text();

  if (!r.ok) {
    console.log(response);
    alert(`An error occoured when trying to submit the ban appeal:\n${response}`);
    loading.classList.add('d-none');
    submitBtn.classList.remove('disabled');
    submitBtn.disabled = false;
    return;
  }

  window.location.replace('/appeals/after');
})

const makeQuestion = (question, i) => {
  const qId = `q${i}`;

  const group = document.createElement('div');
  group.className = 'form-group required mb-4';
  group.classList.add('question');

  const label = document.createElement('label');
  label.for = qId;
  label.innerHTML = question;

  const span = document.createElement('span');
  span.classList.add('text-danger');
  span.innerHTML = ' *';
  label.appendChild(span);
  
  const textarea = document.createElement('textarea');
  textarea.classList.add('form-control');
  textarea.rows = 3;
  textarea.id = qId;
  textarea.required = true;
  textarea.maxLength = 1000;

  group.append(label, textarea);

  form.insertBefore(group, br);
}

const toDate = timestamp => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

async function main() {
  const guildId = window.location.pathname.split('/')[2];
  const r = await fetch(`/api/appeals/${guildId}`);

  const infraction = await r.json();

  if (!r.ok) return console.log(infraction);

  const guildReq = await fetch(`/api/guilds/${guildId}`);
  const guild = await guildReq.json();

  if (!guildReq.ok) return console.log(guild);

  guildName.innerHTML = guild.name;
  reason.innerHTML = infraction.reason;
  date.innerHTML = toDate(+infraction.date);

  if (infraction.expires) {
    expires.innerHTML = toDate(+infraction.expires);
    expires.parentNode.classList.remove('d-none');
  }

  infraction.appealQuestions.forEach((question, i) => { makeQuestion(question, i) });
}

main();