// team.js
import { api, requireAuthOrRedirect } from './utils.js';
requireAuthOrRedirect();

const membersUl = document.getElementById('members');

async function refresh(){
  const { brand } = await api('/api/brands/me');
  const members = brand?.members || [];
  membersUl.innerHTML = members.length ? members.map(m => `<li>${m.email || m} — ${m.role||'Viewer'}</li>`).join('') : '<li class="text-muted">No members yet</li>';
}
await refresh();

document.getElementById('inviteBtn').addEventListener('click', async () => {
  const email = document.getElementById('inviteEmail').value.trim();
  if (!email) { alert('Enter an email'); return; }
  const res = await api('/api/brands/me');
  const brand = res.brand;
  if (!brand){ alert('Complete onboarding first.'); return; }
  const members = brand.members || [];
  members.push({ email, role:'Viewer' });
  await api('/api/brands/onboard', { method:'POST', body: JSON.stringify({ ...brand, members }) });
  document.getElementById('inviteEmail').value='';
  await refresh();
});

// Set role
document.getElementById('setRoleBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('memberEmail').value.trim();
  const role = document.getElementById('memberRole').value;
  const { brand } = await api('/api/brands/me');
  const members = (brand.members||[]).map(m => m.email === email || m === email ? { email, role } : m);
  await api('/api/brands/onboard', { method:'POST', body: JSON.stringify({ ...brand, members }) });
  await refresh();
});

// Remove member
document.getElementById('removeBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('memberEmail').value.trim();
  const { brand } = await api('/api/brands/me');
  const members = (brand.members||[]).filter(m => (m.email||m) !== email);
  await api('/api/brands/onboard', { method:'POST', body: JSON.stringify({ ...brand, members }) });
  await refresh();
});
