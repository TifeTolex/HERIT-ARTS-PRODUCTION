// staff.js
import { api, requireAuthOrRedirect, logout, toast } from './utils.js';

requireAuthOrRedirect();
window.logout = logout;

const page = document.body.dataset.page;

// =====================
// STAFF DASHBOARD
// =====================
async function loadProjects() {
  try {
    const { projects } = await api('/api/projects/admin/all');
    renderProjects(projects);
  } catch (err) {
    console.error(err);
    toast('Failed to load projects.', 'error');
  }
}

function renderProjects(list) {
  const elNew = document.getElementById('col-new');
  const elProg = document.getElementById('col-progress');
  const elDel = document.getElementById('col-delivered');

  const tpl = p => `
    <article class="card">
      <h4>${p.title || p.name || 'Untitled Project'}</h4>
      <div class="text-muted">${p.brandName || p.brandEmail || 'Client project'}</div>
      <div>Deadline: ${p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</div>
      <div>Status: <span class="status ${String(p.status).replace(/\s+/g,'')}">${p.status}</span></div>
      <div class="form-row inline mt-1">
        <input class="assignee" data-id="${p.id}" placeholder="email@team.com" value="${p.assignee||''}" />
        <button class="btn assignBtn" data-id="${p.id}">Assign</button>
      </div>
      <a class="btn mt-1" href="staff-project.html?id=${encodeURIComponent(p.id)}">Open</a>
    </article>`;

  elNew.innerHTML = list.filter(p=>p.status==='Pending').map(tpl).join('') || '<div class="text-muted">No new</div>';
  elProg.innerHTML = list.filter(p=>p.status==='In Progress').map(tpl).join('') || '<div class="text-muted">No in progress</div>';
  elDel.innerHTML = list.filter(p=>['Delivered','Completed'].includes(p.status)).map(tpl).join('') || '<div class="text-muted">No delivered</div>';

  document.querySelectorAll('.assignBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const email = document.querySelector(`.assignee[data-id="${id}"]`).value;
      try {
        await api(`/api/projects/admin/${id}/assign`, {
          method:'POST',
          body: JSON.stringify({ email })
        });
        toast('Assigned successfully', 'success');
        loadProjects();
      } catch (err) {
        toast('Failed to assign: ' + err.message, 'error');
      }
    });
  });
}

// =====================
// STAFF PROJECT DETAIL
// =====================
async function loadProjectDetail() {
  const id = new URLSearchParams(location.search).get('id');
  try {
    const p = await api(`/api/projects/admin/${id}`);

    // Brief tab
  document.getElementById('tab-brief').innerHTML = `
  <div class="brief-grid">
    <div class="left-column">
      <h3>${p.title || p.name}</h3>
      <div><strong>Status:</strong> <span class="status ${String(p.status||'Pending').replace(/\s+/g,'')}">${p.status}</span></div>
      <div><strong>Deadline:</strong> ${p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</div>
      <div><strong>Goal:</strong> ${p.primaryGoal || p.goal || '—'}</div>
      <div><strong>Notes:</strong> ${p.notes || '—'}</div>
    </div>
    <div class="right-column">
      <div><strong>Brand:</strong> ${p.brandEmail || p.brand?.name || '—'}</div>
      <div><strong>Audience:</strong> ${(p.targetAudience || p.audience || []).join(', ') || '—'}</div>
      <div><strong>Tone:</strong> ${(p.toneOfVoice || p.tones || []).join(', ') || '—'}</div>
      <div><strong>Usage:</strong> ${(p.usage || []).join(', ') || '—'}</div>
      <div><strong>Features:</strong> ${(p.keyFeatures || p.features || '').replace(/\n/g,'<br/>') || '—'}</div>
    </div>
  </div>
`;


    // Assets tab
    document.getElementById('tab-assets').innerHTML = `
      <div><strong>Logo:</strong> ${p.assets?.logo ? `<a class="btn ghost" download href="${p.assets.logo}">Download</a>` : '—'}</div>
      <div><strong>Brand colors:</strong> ${(p.assets?.colors||[]).join(', ') || '—'}</div>
      <div><strong>Typography:</strong> ${p.assets?.typography || '—'}</div>
      <div><strong>Products:</strong> ${(p.assets?.products||[]).map(u=>`<a class="btn ghost" download href="${u}">File</a>`).join(' ') || '—'}</div>
    `;

    // Notes tab
    document.getElementById('tab-notes').innerHTML = p.notes || '<div class="text-muted">No notes</div>';

    // Files tab
    document.getElementById('tab-files').innerHTML = (p.files && p.files.length)
      ? p.files.map(f => `
          <div class="row mt-1">
            <div>${f.originalName}</div>
            <div class="text-muted">${new Date(f.uploadedAt).toLocaleString()}</div>
            <a class="btn ghost" download href="${f.url}">Download</a>
          </div>
        `).join('')
      : '<div class="text-muted">No files uploaded</div>';

    // Deliver section
    const deliverBtn = document.getElementById('deliverBtn');
    if (deliverBtn) {
      deliverBtn.insertAdjacentHTML('beforebegin', `
        <div class="form-row mt-2">
          <label for="deliverFiles">Upload final files</label>
          <input type="file" id="deliverFiles" multiple />
        </div>
      `);

      deliverBtn.addEventListener('click', async () => {
        try {
          const filesInput = document.getElementById('deliverFiles');
          const formData = new FormData();
          if (filesInput?.files.length) {
            [...filesInput.files].forEach(f => formData.append('files', f));
          }

          await api(`/api/projects/admin/${id}/deliver`, {
            method:'POST',
            body: formData
          });

          toast('Delivered to brand ✅', 'success');
          loadProjectDetail();
        } catch (err) {
          toast('Delivery failed: ' + err.message, 'error');
        }
      });
    }
  } catch (err) {
    toast('Failed to load project: ' + err.message, 'error');
  }
}

// =====================
// STAFF BRANDS LIST
// =====================
async function loadBrands(){
  try {
    const { brands } = await api('/api/brands/admin/all');
    renderBrands(brands);
  } catch (err) {
    toast('Failed to load brands.', 'error');
  }
}
function renderBrands(brands){
  const wrap = document.getElementById('blist');
  if (!wrap) return;
  wrap.innerHTML = brands.length ? brands.map(b => `
    <article class="card">
      <h3>${b.businessName || b.name}</h3>
      <div>Plan: ${b.subscription?.plan || '—'}</div>
      <div>Active projects: ${b.activeProjects ?? 0}</div>
      <div>Contact: ${b.contact || b.ownerEmail}</div>
      <a class="btn mt-1" href="staff-brand.html?id=${encodeURIComponent(b.id)}">Open</a>
    </article>
  `).join('') : '<div class="text-muted">No brands found</div>';
}

// =====================
// STAFF ANALYTICS
// =====================
async function loadAnalytics(){
  try {
    const a = await api('/api/projects/admin-analytics/summary');
    document.getElementById('rev').textContent = a?.revenueFormatted ?? '$0';
    document.getElementById('completed').textContent = a?.projectsCompleted ?? 0;
    document.getElementById('activeB').textContent = a?.activeBrands ?? 0;
    document.getElementById('inactiveB').textContent = a?.inactiveBrands ?? 0;

    const top = a?.topBrands || [];
    document.getElementById('top5').innerHTML = top.length
      ? top.map(b=>`<li>${b.name} — ${b.count}</li>`).join('')
      : '<li class="text-muted">No data</li>';

    const pm = a?.perMonth || [];
    document.getElementById('perMonth').innerHTML = pm.length
      ? pm.map(m=>`<div class="row"><div>${m.month}</div><div>${m.count}</div></div>`).join('')
      : '<div class="text-muted">No data</div>';
  } catch (err) {
    toast('Failed to load analytics.', 'error');
  }
}

// =====================
// STAFF BRAND PROFILE
// =====================
async function loadBrandProfile(){
  const id = new URLSearchParams(location.search).get('id');
  try {
    const b = await api(`/api/brands/admin/${id}`);

    document.getElementById('bname').textContent = b.businessName || b.name;
    document.getElementById('profile').innerHTML = `
      <div>Industry: ${b.industry || '—'}</div>
      <div>Contact: ${b.contact || b.ownerEmail}</div>
      <div>Members: ${(b.members||[]).length}</div>
    `;
    const sub = b.subscription || {};
    document.getElementById('payment').innerHTML = `
      <div>Plan: ${sub.plan || '—'}</div>
      <div>Status: ${sub.status || '—'}</div>
      <div>Renewal: ${sub.renewsAt ? new Date(sub.renewsAt).toLocaleDateString() : '—'}</div>
    `;
    const projs = b.projects || [];
    document.getElementById('projects').innerHTML = projs.length ? projs.map(p => `
      <div class="row">
        <div>${p.title || p.name}</div>
        <div class="text-muted">${p.status}</div>
        <a class="btn ghost" href="staff-project.html?id=${encodeURIComponent(p.id)}">Open</a>
      </div>
    `).join('') : '<div class="text-muted">No active projects</div>';

    const hist = b.history || [];
    document.getElementById('history').innerHTML = hist.length ? hist.map(h => `
      <div class="row">
        <div>${h.fileName}</div>
        <a class="btn" download href="${h.url}">Download</a>
      </div>
    `).join('') : '<div class="text-muted">No past deliveries</div>';
  } catch (err) {
    toast('Failed to load brand profile.', 'error');
  }
}

// =====================
// ROUTER
// =====================
if (page==='staff-dashboard'){
  document.getElementById('loadBtn')?.addEventListener('click', loadProjects);
  document.getElementById('search')?.addEventListener('input', async e=>{
    const { projects } = await api('/api/projects/admin/all');
    const q = e.target.value.toLowerCase();
    renderProjects(projects.filter(p=>(p.title||p.name||'').toLowerCase().includes(q)));
  });
  loadProjects();
}

if (page==='staff-project'){
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('[id^="tab-"]').forEach(p=>p.hidden=true);
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).hidden=false;
    });
  });
  loadProjectDetail();
}

if (page==='staff-brands'){
  loadBrands();
  document.getElementById('bsearch')?.addEventListener('input', async e=>{
    const q = e.target.value.toLowerCase();
    const { brands } = await api('/api/brands/admin/all');
    renderBrands(brands.filter(b => (b.businessName || b.name).toLowerCase().includes(q)));
  });
}

if (page==='staff-analytics'){
  loadAnalytics();
}

if (page==='staff-brand'){
  loadBrandProfile();
}
