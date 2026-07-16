/* ============================================
   CREWCCANTE — Main App Logic
   ============================================ */

let currentUser = null;
let selectedKnownPart = null;

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const saved = DB.get('currentUser');
  if (saved) {
    currentUser = saved;
    enterApp();
  }

  // Login
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Nav triggers inside content
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-page]');
    if (trigger && !trigger.classList.contains('nav-link')) {
      e.preventDefault();
      navigateTo(trigger.dataset.page);
    }
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Collection
  document.getElementById('btn-add-part').addEventListener('click', openModal);
  document.getElementById('btn-add-part-2').addEventListener('click', openModal);
  document.getElementById('search-parts').addEventListener('input', renderCollection);
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCollection();
    });
  });

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
  document.getElementById('btn-save-part').addEventListener('click', savePart);
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => switchModalTab(tab.dataset.tab));
  });
  setupPhotoUpload('photo-drop', 'player-photo', 'photo-preview', 'photo-placeholder', 'bg-removal-area');
  setupPhotoUpload('part-photo-drop', 'part-photo', 'part-photo-preview', 'part-photo-placeholder');
  document.getElementById('search-list').addEventListener('input', renderKnownPartsList);

  // Tournament
  document.getElementById('btn-generate-card').addEventListener('click', updateCardPreview);
  document.getElementById('btn-save-tournament').addEventListener('click', saveTournament);
  document.getElementById('btn-download-card').addEventListener('click', downloadCard);
  document.getElementById('btn-remove-bg').addEventListener('click', handleBgRemoval);
  ['t-player-name', 't-rank', 'deck-1', 'deck-2', 'deck-3', 't-tournament-name'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateCardPreview);
  });
});

// ── AUTH ─────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const match = USERS.find(u =>
    u.username.toLowerCase() === user.toLowerCase() && u.password === pass
  );
  if (!match) {
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }
  document.getElementById('login-error').classList.add('hidden');
  currentUser = match;
  DB.set('currentUser', currentUser);
  enterApp();
}

function enterApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-app').classList.remove('hidden');
  document.getElementById('page-app').classList.add('active');
  document.getElementById('nav-user-name').textContent = currentUser.displayName;
  document.getElementById('nav-user-initial').textContent = currentUser.displayName[0].toUpperCase();
  navigateTo('dashboard');
}

function logout() {
  currentUser = null;
  DB.set('currentUser', null);
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-app').classList.add('hidden');
  document.getElementById('page-login').classList.remove('hidden');
  document.getElementById('page-login').classList.add('active');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

// ── NAVIGATION ───────────────────────────────
function navigateTo(pageName) {
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === pageName);
  });
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  const view = document.getElementById(`view-${pageName}`);
  if (view) {
    view.classList.remove('hidden');
    view.classList.add('active');
  }
  if (pageName === 'dashboard') renderDashboard();
  if (pageName === 'collection') renderCollection();
  if (pageName === 'database') renderDatabase();
  if (pageName === 'tournament') renderTournaments();
}

// ── DASHBOARD ────────────────────────────────
function renderDashboard() {
  if (!currentUser) return;
  const myParts = getCollection(currentUser.id);
  const tournaments = getTournaments();

  document.getElementById('stat-total-parts').textContent = myParts.length;
  document.getElementById('stat-members').textContent = USERS.length;
  document.getElementById('stat-tournaments').textContent = tournaments.length;

  const preview = document.getElementById('dash-my-parts');
  if (myParts.length === 0) {
    preview.innerHTML = '<p class="empty-msg">Nessun pezzo aggiunto ancora. <a href="#" data-page="collection" class="nav-trigger">Aggiungi pezzi →</a></p>';
  } else {
    preview.innerHTML = myParts.slice(0, 12).map(p =>
      `<span class="part-mini-tag">${getTypeIcon(p.type)} ${p.name}</span>`
    ).join('') + (myParts.length > 12 ? `<span class="part-mini-tag">+${myParts.length - 12} altri</span>` : '');
  }

  const tDiv = document.getElementById('dash-tournaments');
  if (tournaments.length === 0) {
    tDiv.innerHTML = '<p class="empty-msg">Nessun torneo registrato. <a href="#" data-page="tournament" class="nav-trigger">Crea carta torneo →</a></p>';
  } else {
    tDiv.innerHTML = tournaments.slice(-3).reverse().map(t =>
      `<div class="tournament-item">
        <div class="t-info">
          <div class="t-name">${escHtml(t.playerName)}</div>
          <div class="t-meta">${escHtml(t.tournamentName || '—')} &bull; ${t.date}</div>
        </div>
        <div class="t-rank-badge">#${t.rank}</div>
      </div>`
    ).join('');
  }
}

// ── COLLECTION ───────────────────────────────
function renderCollection() {
  if (!currentUser) return;
  const parts = getCollection(currentUser.id);
  const query = document.getElementById('search-parts').value.toLowerCase();
  const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

  const filtered = parts.filter(p => {
    const matchType = filter === 'all' || p.type === filter;
    const matchSearch = !query || p.name.toLowerCase().includes(query);
    return matchType && matchSearch;
  });

  const grid = document.getElementById('parts-grid');
  if (filtered.length === 0) {
    if (parts.length === 0) {
      grid.innerHTML = `<div class="empty-state">
        <div class="empty-icon">⚙</div>
        <p>Nessun pezzo nella collezione</p>
        <button class="btn-primary" onclick="openModal()">Aggiungi il primo pezzo</button>
      </div>`;
    } else {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Nessun risultato per "${escHtml(query)}"</p></div>`;
    }
    return;
  }

  grid.innerHTML = filtered.map(p => buildPartCard(p)).join('');
  grid.querySelectorAll('.part-delete').forEach(btn => {
    btn.addEventListener('click', () => deletePart(btn.dataset.id));
  });
}

function buildPartCard(p) {
  const icon = getTypeIcon(p.type);
  const badgeClass = getTypeBadgeClass(p.type);
  const photoHtml = p.photo
    ? `<img class="part-photo" src="${p.photo}" alt="${escHtml(p.name)}" />`
    : `<div class="part-icon">${icon}</div>`;
  return `<div class="part-card">
    <button class="part-delete" data-id="${p.id}" title="Rimuovi">✕</button>
    ${photoHtml}
    <div class="part-name">${escHtml(p.name)}</div>
    <span class="part-type-badge ${badgeClass}">${p.type}</span>
    ${p.notes ? `<small style="color:var(--text-secondary);font-size:0.75rem">${escHtml(p.notes)}</small>` : ''}
  </div>`;
}

function deletePart(id) {
  const parts = getCollection(currentUser.id).filter(p => p.id !== id);
  saveCollection(currentUser.id, parts);
  renderCollection();
  renderDashboard();
}

// ── DATABASE ─────────────────────────────────
function renderDatabase() {
  const members = getAllMembers();
  const tabsEl = document.getElementById('member-tabs');
  const dbContent = document.getElementById('db-content');

  tabsEl.innerHTML = members.map((m, i) => `
    <button class="member-tab ${i === 0 ? 'active' : ''}" data-uid="${m.id}">
      <div class="user-avatar" style="width:24px;height:24px;font-size:0.65rem">${m.displayName[0]}</div>
      ${escHtml(m.displayName)}
    </button>`).join('');

  function showMember(uid) {
    tabsEl.querySelectorAll('.member-tab').forEach(t => t.classList.toggle('active', t.dataset.uid === uid));
    const parts = getCollection(uid);
    if (parts.length === 0) {
      dbContent.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>Nessun pezzo registrato per questo membro</p></div>';
      return;
    }
    dbContent.innerHTML = parts.map(p => buildPartCard(p)).join('');
  }

  showMember(members[0].id);

  tabsEl.querySelectorAll('.member-tab').forEach(btn => {
    btn.addEventListener('click', () => showMember(btn.dataset.uid));
  });
}

// ── MODAL ────────────────────────────────────
function openModal() {
  selectedKnownPart = null;
  document.getElementById('part-name').value = '';
  document.getElementById('part-series').value = 'Beyblade X';
  document.getElementById('part-notes').value = '';
  document.getElementById('part-photo-name').value = '';
  document.getElementById('search-list').value = '';
  document.getElementById('part-photo-preview').classList.add('hidden');
  document.getElementById('part-photo-placeholder').classList.remove('hidden');
  switchModalTab('manual');
  renderKnownPartsList();
  document.getElementById('modal-add-part').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-add-part').classList.add('hidden');
}

function switchModalTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.modal-tab-content').forEach(c => {
    c.classList.toggle('hidden', !c.id.endsWith(tab));
    c.classList.toggle('active', c.id.endsWith(tab));
  });
}

function renderKnownPartsList() {
  const query = document.getElementById('search-list').value.toLowerCase();
  const list = document.getElementById('known-parts-list');
  const myParts = getCollection(currentUser.id).map(p => p.sourceId).filter(Boolean);
  const filtered = KNOWN_PARTS.filter(p =>
    (!query || p.name.toLowerCase().includes(query) || p.type.includes(query))
  );
  if (filtered.length === 0) {
    list.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;text-align:center">Nessun risultato</p>';
    return;
  }
  list.innerHTML = filtered.map(p => {
    const owned = myParts.includes(p.id);
    return `<div class="known-part-item ${owned ? 'selected' : ''}" data-id="${p.id}">
      <span class="known-part-name">${getTypeIcon(p.type)} ${escHtml(p.name)}</span>
      <span class="part-type-badge ${getTypeBadgeClass(p.type)}">${p.type}</span>
    </div>`;
  }).join('');
  list.querySelectorAll('.known-part-item').forEach(item => {
    item.addEventListener('click', () => {
      list.querySelectorAll('.known-part-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selectedKnownPart = KNOWN_PARTS.find(p => p.id === item.dataset.id);
    });
  });
}

function savePart() {
  const activeTab = document.querySelector('.modal-tab.active')?.dataset.tab;
  let newPart = null;

  if (activeTab === 'manual') {
    const name = document.getElementById('part-name').value.trim();
    if (!name) { alert('Inserisci il nome del pezzo'); return; }
    newPart = {
      id: 'p_' + Date.now(),
      name,
      type: document.getElementById('part-type').value,
      series: document.getElementById('part-series').value.trim() || 'Beyblade X',
      notes: document.getElementById('part-notes').value.trim(),
      photo: null
    };
  } else if (activeTab === 'list') {
    if (!selectedKnownPart) { alert('Seleziona un pezzo dalla lista'); return; }
    const existing = getCollection(currentUser.id).find(p => p.sourceId === selectedKnownPart.id);
    if (existing) { alert('Hai già questo pezzo nella tua collezione'); return; }
    newPart = { ...selectedKnownPart, id: 'p_' + Date.now(), sourceId: selectedKnownPart.id, notes: '', photo: null };
  } else if (activeTab === 'photo') {
    const name = document.getElementById('part-photo-name').value.trim();
    if (!name) { alert('Inserisci il nome del pezzo'); return; }
    const preview = document.getElementById('part-photo-preview');
    const photo = preview.classList.contains('hidden') ? null : preview.src;
    newPart = {
      id: 'p_' + Date.now(),
      name,
      type: document.getElementById('part-photo-type').value,
      series: 'Beyblade X',
      notes: '',
      photo
    };
  }

  if (!newPart) return;
  const parts = getCollection(currentUser.id);
  parts.push(newPart);
  saveCollection(currentUser.id, parts);
  closeModal();
  renderCollection();
  renderDashboard();
}

// ── PHOTO UPLOAD ─────────────────────────────
function setupPhotoUpload(dropId, inputId, previewId, placeholderId, revealId = null) {
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const revealEl = revealId ? document.getElementById(revealId) : null;

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--accent-blue)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadPhotoFile(file, preview, placeholder, revealEl);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) loadPhotoFile(input.files[0], preview, placeholder, revealEl);
  });
}

function loadPhotoFile(file, preview, placeholder, revealEl = null) {
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
    if (revealEl) revealEl.classList.remove('hidden');
    // reset bg-status if present
    const statusEl = document.getElementById('bg-status');
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'bg-status hidden'; }
  };
  reader.readAsDataURL(file);
}

// ── TOURNAMENT ───────────────────────────────
function updateCardPreview() {
  const name = document.getElementById('t-player-name').value.trim() || 'NOME GIOCATORE';
  const rank = document.getElementById('t-rank').value || '1';
  const d1   = document.getElementById('deck-1').value.trim() || '—';
  const d2   = document.getElementById('deck-2').value.trim() || '—';
  const d3   = document.getElementById('deck-3').value.trim() || '—';
  const tname = document.getElementById('t-tournament-name').value.trim() || 'TORNEO';
  const photoPreview = document.getElementById('photo-preview');

  document.getElementById('card-name-display').textContent = name.toUpperCase();
  document.getElementById('card-rank-display').textContent = `#${rank}`;
  document.getElementById('card-tournament-display').textContent = tname.toUpperCase();
  const deckEl = document.getElementById('card-deck-display');
  const tags = deckEl.querySelectorAll('.bey-tag');
  tags[0].textContent = d1;
  tags[1].textContent = d2;
  tags[2].textContent = d3;

  const cardPhoto = document.getElementById('card-photo');
  if (!photoPreview.classList.contains('hidden') && photoPreview.src) {
    cardPhoto.src = photoPreview.src;
    cardPhoto.classList.remove('hidden');
    cardPhoto.nextElementSibling.style.display = 'none';
  } else {
    cardPhoto.classList.add('hidden');
    cardPhoto.nextElementSibling.style.display = '';
  }
}

function saveTournament() {
  const playerName = document.getElementById('t-player-name').value.trim();
  if (!playerName) { alert('Inserisci il nome del giocatore'); return; }
  const rank = parseInt(document.getElementById('t-rank').value) || 1;
  const deck = [
    document.getElementById('deck-1').value.trim(),
    document.getElementById('deck-2').value.trim(),
    document.getElementById('deck-3').value.trim(),
  ].filter(Boolean);
  const tournamentName = document.getElementById('t-tournament-name').value.trim();
  const photoPreview = document.getElementById('photo-preview');
  const photo = photoPreview.classList.contains('hidden') ? null : photoPreview.src;

  const list = getTournaments();
  list.push({
    id: 't_' + Date.now(),
    playerName,
    rank,
    deck,
    tournamentName,
    photo,
    date: new Date().toLocaleDateString('it-IT')
  });
  saveTournaments(list);
  renderTournaments();
  renderDashboard();
  alert(`Torneo salvato per ${playerName}!`);
}

function renderTournaments() {
  const list = getTournaments();
  const el = document.getElementById('tournaments-list');
  if (list.length === 0) {
    el.innerHTML = '<p class="empty-msg">Nessun torneo salvato.</p>';
    return;
  }
  el.innerHTML = list.slice().reverse().map(t => `
    <div class="tournament-item">
      <div class="t-info">
        <div class="t-name">${escHtml(t.playerName)}</div>
        <div class="t-meta">${escHtml(t.tournamentName || '—')} &bull; ${t.date}</div>
        <div class="t-meta" style="margin-top:2px">${t.deck.map(d => escHtml(d)).join(' · ')}</div>
      </div>
      <div class="t-rank-badge">#${t.rank}</div>
    </div>`).join('');
}

async function downloadCard() {
  if (typeof html2canvas === 'undefined') {
    alert('html2canvas non caricato. Verifica la connessione Internet e ricarica la pagina.');
    return;
  }
  const card = document.getElementById('card-template');
  const btn = document.getElementById('btn-download-card');
  btn.textContent = '⟳ Generazione...';
  btn.disabled = true;
  try {
    const canvas = await html2canvas(card, {
      backgroundColor: '#0d1022',
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    const name = document.getElementById('t-player-name').value.trim() || 'giocatore';
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `carta-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  } catch (err) {
    console.error(err);
    alert('Errore nel download: ' + err.message);
  } finally {
    btn.textContent = 'Scarica Carta (PNG)';
    btn.disabled = false;
  }
}

async function handleBgRemoval() {
  const preview = document.getElementById('photo-preview');
  const btn = document.getElementById('btn-remove-bg');
  const statusEl = document.getElementById('bg-status');

  if (preview.classList.contains('hidden') || !preview.src) {
    alert('Carica prima una foto del giocatore');
    return;
  }

  if (!window._removeBg) {
    statusEl.innerHTML = '<span class="spinner"></span> Caricamento modello AI…';
    statusEl.className = 'bg-status loading';
    statusEl.classList.remove('hidden');
    // Aspetta fino a 15 secondi che il modulo ES venga caricato
    await new Promise((resolve, reject) => {
      if (window._removeBg) { resolve(); return; }
      const handler = () => { document.removeEventListener('removeBgReady', handler); resolve(); };
      document.addEventListener('removeBgReady', handler);
      setTimeout(() => { document.removeEventListener('removeBgReady', handler); reject(new Error('timeout')); }, 15000);
    }).catch(() => {});
    if (!window._removeBg) {
      statusEl.textContent = '✗ Modulo non disponibile. Verifica la connessione Internet.';
      statusEl.className = 'bg-status error';
      return;
    }
  }

  btn.disabled = true;
  statusEl.innerHTML = '<span class="spinner"></span> Elaborazione… (prima volta ~30-60s, scarica modello AI)';
  statusEl.className = 'bg-status loading';
  statusEl.classList.remove('hidden');

  try {
    const blob = dataURLtoBlob(preview.src);
    const resultBlob = await window._removeBg(blob, {
      publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/browser/',
      model: 'small',
      output: { format: 'image/png', quality: 0.9 }
    });
    const url = URL.createObjectURL(resultBlob);
    preview.src = url;
    statusEl.textContent = '✓ Sfondo rimosso!';
    statusEl.className = 'bg-status success';
    setTimeout(() => { statusEl.className = 'bg-status hidden'; }, 4000);
    updateCardPreview();
  } catch (err) {
    console.error('BG removal error:', err);
    statusEl.textContent = '✗ Errore: ' + (err.message || 'sconosciuto');
    statusEl.className = 'bg-status error';
  } finally {
    btn.disabled = false;
  }
}

function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── UTILS ────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
