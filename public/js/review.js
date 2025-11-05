// import { api, requireAuthOrRedirect, toast } from './utils.js';

// requireAuthOrRedirect();

// const id = new URLSearchParams(location.search).get('id');
// const details = document.getElementById('details');
// const filesEl = document.getElementById('files');

// async function loadProject() {
//   try {
//     const { project } = await api(`/api/projects/${id}`);

//     // Project details
//     details.innerHTML = `
//       <h3>${project.name || 'Untitled project'}</h3>
//       <div><strong>Status:</strong> <span class="status ${String(project.status||'Pending').replace(/\s+/g,'')}">${project.status}</span></div>
//       <div><strong>Deadline:</strong> ${project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</div>
//       <div><strong>Goal:</strong> ${project.primaryGoal || project.goal || '—'}</div>
//       <div><strong>Features:</strong><br/>${(project.keyFeatures || project.features || '').replace(/\n/g,'<br/>')}</div>
//       <div><strong>Audience:</strong> ${(project.targetAudience || project.audience || []).join(', ') || '—'}</div>
//       <div><strong>Tone:</strong> ${(project.toneOfVoice || project.tones || []).join(', ') || '—'}</div>
//       <div><strong>Usage:</strong> ${(project.usage || []).join(', ') || '—'}</div>
//       <div><strong>Notes:</strong> ${project.notes || '—'}</div>
//     `;

//     // Delivered files
//     renderFiles(project.files || []);
//   } catch (err) {
//     toast('Failed to load project: ' + err.message, 'error');
//   }
// }

// function renderFiles(files) {
//   filesEl.innerHTML = files.length
//     ? files.map(f => {
//         const uploadedAt = f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : '';
//         const uploader = f.uploadedBy === 'staff' ? '👨‍💼 Staff' : '👤 Brand';
//         return `
//           <div class="card fade-in">
//             <div><strong>${f.originalName}</strong></div>
//             <div class="text-muted small">${uploader} • ${uploadedAt}</div>
//             <a class="btn ghost mt-1" download href="${f.url}">⬇️ Download</a>
//           </div>
//         `;
//       }).join('')
//     : '<div class="text-muted">No files yet</div>';
// }

// // Upload demo
// document.getElementById('uploadBtn')?.addEventListener('click', async () => {
//   const input = document.getElementById('uploader');
//   if (!input.files.length) return toast('Choose at least one file', 'warning');

//   const formData = new FormData();
//   [...input.files].forEach(f => formData.append('files', f));

//   try {
//     await api(`/api/projects/${id}/upload`, { method: 'POST', body: formData });
//     toast('Files uploaded successfully', 'success');
//     loadProject();
//   } catch (err) {
//     toast('Upload failed: ' + err.message, 'error');
//   }
// });

// // Approve
// document.getElementById('approveBtn')?.addEventListener('click', async () => {
//   try {
//     await api(`/api/projects/${id}/approve`, { method: 'POST' });
//     toast('Project marked as completed ✅', 'success');
//     loadProject();
//   } catch (err) {
//     toast('Failed to approve: ' + err.message, 'error');
//   }
// });

// // Request changes
// document.getElementById('requestChangesBtn')?.addEventListener('click', async () => {
//   const notes = document.getElementById('reviewNotes').value;
//   try {
//     await api(`/api/projects/${id}/changes`, { 
//       method: 'POST', 
//       body: JSON.stringify({ notes }) 
//     });
//     toast('Requested changes sent ✍️', 'info');
//     loadProject();
//   } catch (err) {
//     toast('Failed to request changes: ' + err.message, 'error');
//   }
// });

// // Initial load
// loadProject();
