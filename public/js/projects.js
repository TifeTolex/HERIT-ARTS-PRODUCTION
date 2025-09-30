// projects.js
import { api, requireAuthOrRedirect, toast } from './utils.js';
requireAuthOrRedirect();

const form = document.getElementById('projectForm');
if (form) {
  const audSelect = document.getElementById('audienceSelect');
  const newAudDiv = document.getElementById('newAudience');

  // Add new audience option
  document.getElementById('addAudienceBtn')?.addEventListener('click', () => newAudDiv.hidden = false);
  document.getElementById('saveAudienceBtn')?.addEventListener('click', () => {
    const name = document.getElementById('audName').value.trim();
    if (!name) return;
    const opt = document.createElement('option');
    opt.value = name;
    opt.text = name;
    opt.selected = true;
    audSelect.add(opt);
    newAudDiv.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usage = Array.from(form.querySelectorAll('input[name="usage"]:checked')).map(cb => cb.value);
    const tones = Array.from(document.getElementById('tonesSelect')?.selectedOptions || []).map(o => o.value);
    const audience = Array.from(audSelect?.selectedOptions || []).map(o => o.value);

    const data = {
      title: document.getElementById('name').value.trim(),
      contentType: document.getElementById('contentType').value,
      deadline: document.getElementById('deadline').value,
      goal: document.getElementById('goal').value,
      features: document.getElementById('features').value,
      audience,
      tones,
      usage,
      notes: document.getElementById('notes').value,
      assets: {
        colors: (document.getElementById('brandColors')?.value || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        typography: document.getElementById('typography')?.value || null
      }
    };

    try {
      // 🔹 First, check subscription status before creating project
      const { subscription } = await api('/api/subscription');
      if (!subscription || subscription.status !== 'active') {
        toast('You need an active subscription or trial to create projects.', 'error');
        return;
      }

      const { project } = await api('/api/projects', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      });
      toast('Project created successfully!', 'success');
      window.location.href = '/review.html?id=' + project.id;
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}
