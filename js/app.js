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
  setupPhotoUpload('photo-drop', 'player-photo', 'photo-preview', 'photo-placeholder', 'bg-removal-area', true);
  setupPhotoUpload('part-photo-drop', 'part-photo', 'part-photo-preview', 'part-photo-placeholder');
  document.getElementById('search-list').addEventListener('input', renderKnownPartsList);

  // Tournament
  document.getElementById('btn-generate-card').addEventListener('click', updateCardPreview);
  document.getElementById('btn-save-tournament').addEventListener('click', saveTournament);
  document.getElementById('btn-download-card').addEventListener('click', downloadCard);
  document.getElementById('btn-instagram').addEventListener('click', downloadForInstagram);
  document.getElementById('btn-remove-bg').addEventListener('click', handleBgRemoval);
  ['t-player-name', 't-rank', 't-team-name', 'deck-1', 'deck-2', 'deck-3',
   't-tournament-name', 't-bottom-text'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateCardPreview);
  });
  // Deck photo uploads
  [1, 2, 3].forEach(i => {
    setupSimplePhotoUpload(`deck-drop-${i}`, `deck-file-${i}`, `deck-preview-${i}`, updateCardPreview);
  });
  // Logo uploads
  ['left', 'right'].forEach(side => {
    setupSimplePhotoUpload(`logo-drop-${side}`, `logo-file-${side}`, `logo-preview-${side}`, updateCardPreview);
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
function setupPhotoUpload(dropId, inputId, previewId, placeholderId, revealId = null, autoBgRemoval = false) {
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
    if (file && file.type.startsWith('image/')) loadPhotoFile(file, preview, placeholder, revealEl, autoBgRemoval);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) loadPhotoFile(input.files[0], preview, placeholder, revealEl, autoBgRemoval);
  });
}

function loadPhotoFile(file, preview, placeholder, revealEl = null, autoBgRemoval = false) {
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
    if (revealEl) revealEl.classList.remove('hidden');
    const statusEl = document.getElementById('bg-status');
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'bg-status hidden'; }
    if (autoBgRemoval) {
      updateCardPreview();
      handleBgRemoval();
    }
  };
  reader.readAsDataURL(file);
}

function setupSimplePhotoUpload(dropId, inputId, previewId, onChange) {
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!drop || !input || !preview) return;
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--accent-blue)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadSimplePhoto(file, drop, preview, onChange);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) loadSimplePhoto(input.files[0], drop, preview, onChange);
  });
}

function loadSimplePhoto(file, drop, preview, onChange) {
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    drop.querySelectorAll('.deck-photo-icon, .logo-mini-ph').forEach(el => el.style.display = 'none');
    if (onChange) onChange();
  };
  reader.readAsDataURL(file);
}

// ── TOURNAMENT ───────────────────────────────
function updateCardPreview() {
  const name       = document.getElementById('t-player-name').value.trim() || 'NOME GIOCATORE';
  const rank       = document.getElementById('t-rank').value || '1';
  const team       = document.getElementById('t-team-name').value.trim() || 'TEAM';
  const tname      = document.getElementById('t-tournament-name').value.trim() || 'TORNEO';
  const bottomText = document.getElementById('t-bottom-text').value.trim() || 'COBALT DRAGONA';

  document.getElementById('card-name-display').textContent = name.toUpperCase();
  document.getElementById('card-rank-display').textContent = `#${rank}`;
  document.getElementById('card-team-display').textContent = team.toUpperCase();
  document.getElementById('card-tournament-display').textContent = tname.toUpperCase();
  document.getElementById('card-bottom-text').textContent = bottomText.toUpperCase();

  // Deck: nomi e immagini
  [1, 2, 3].forEach(i => {
    const nameVal = document.getElementById(`deck-${i}`).value.trim() || '—';
    document.getElementById(`card-deck-name-${i}`).textContent = nameVal;

    const formPreview = document.getElementById(`deck-preview-${i}`);
    const cardImg = document.getElementById(`card-deck-img-${i}`);
    const ph = cardImg.nextElementSibling;
    if (formPreview && !formPreview.classList.contains('hidden') && formPreview.src) {
      cardImg.src = formPreview.src;
      cardImg.classList.remove('hidden');
      if (ph) ph.style.display = 'none';
    } else {
      cardImg.classList.add('hidden');
      if (ph) ph.style.display = '';
    }
  });

  // Foto giocatore
  const photoPreview = document.getElementById('photo-preview');
  const cardPhoto = document.getElementById('card-photo');
  const cardPhotoPh = document.getElementById('card-photo-placeholder');
  if (!photoPreview.classList.contains('hidden') && photoPreview.src) {
    cardPhoto.src = photoPreview.src;
    cardPhoto.classList.remove('hidden');
    if (cardPhotoPh) cardPhotoPh.style.display = 'none';
  } else {
    cardPhoto.classList.add('hidden');
    if (cardPhotoPh) cardPhotoPh.style.display = '';
  }

  // Loghi barra inferiore
  ['left', 'right'].forEach(side => {
    const fp = document.getElementById(`logo-preview-${side}`);
    const ci = document.getElementById(`card-logo-${side}`);
    const cp = document.getElementById(`card-logo-${side}-ph`);
    if (fp && !fp.classList.contains('hidden') && fp.src) {
      ci.src = fp.src;
      ci.classList.remove('hidden');
      if (cp) cp.style.display = 'none';
    } else {
      ci.classList.add('hidden');
      if (cp) cp.style.display = '';
    }
  });
}

function saveTournament() {
  const playerName = document.getElementById('t-player-name').value.trim();
  if (!playerName) { alert('Inserisci il nome del giocatore'); return; }

  const rank = parseInt(document.getElementById('t-rank').value) || 1;
  const team = document.getElementById('t-team-name').value.trim();
  const tournamentName = document.getElementById('t-tournament-name').value.trim();
  const bottomText = document.getElementById('t-bottom-text').value.trim();

  const deck = [1, 2, 3].map(i => {
    const fp = document.getElementById(`deck-preview-${i}`);
    return {
      name: document.getElementById(`deck-${i}`).value.trim() || '',
      photo: (fp && !fp.classList.contains('hidden') && fp.src) ? fp.src : null
    };
  });

  const photoPreview = document.getElementById('photo-preview');
  const photo = photoPreview.classList.contains('hidden') ? null : photoPreview.src;

  const logoLeft  = (() => { const e = document.getElementById('logo-preview-left');  return (e && !e.classList.contains('hidden') && e.src) ? e.src : null; })();
  const logoRight = (() => { const e = document.getElementById('logo-preview-right'); return (e && !e.classList.contains('hidden') && e.src) ? e.src : null; })();

  const list = getTournaments();
  list.push({
    id: 't_' + Date.now(),
    playerName, team, rank, deck, tournamentName, bottomText,
    photo, logoLeft, logoRight,
    date: new Date().toLocaleDateString('it-IT')
  });
  saveTournaments(list);
  renderTournaments();
  renderDashboard();
  alert(`Carta salvata per ${playerName}!`);
}

function renderTournaments() {
  const list = getTournaments();
  const el = document.getElementById('tournaments-list');
  if (list.length === 0) {
    el.innerHTML = '<p class="empty-msg">Nessun carta salvata.</p>';
    return;
  }
  el.innerHTML = list.slice().reverse().map(t => {
    const deckNames = (t.deck || []).map(d => (typeof d === 'string' ? d : d.name)).filter(Boolean).join(' · ');
    const teamLabel = t.team ? `<span style="color:var(--accent-purple);margin-left:0.4rem;font-size:0.78rem">${escHtml(t.team)}</span>` : '';
    return `<div class="tournament-item">
      <div class="t-info">
        <div class="t-name">${escHtml(t.playerName)}${teamLabel}</div>
        <div class="t-meta">${escHtml(t.tournamentName || '—')} &bull; ${t.date}</div>
        ${deckNames ? `<div class="t-meta" style="margin-top:2px">${escHtml(deckNames)}</div>` : ''}
      </div>
      <div class="t-rank-badge">#${t.rank}</div>
    </div>`;
  }).join('');
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
  const cardLoading = document.getElementById('card-loading');

  if (preview.classList.contains('hidden') || !preview.src) return;

  // Attendi che il modulo ES sia pronto (max 20s)
  if (!window._removeBg) {
    statusEl.innerHTML = '<span class="spinner"></span> Caricamento modello AI…';
    statusEl.className = 'bg-status loading';
    statusEl.classList.remove('hidden');
    await new Promise(resolve => {
      if (window._removeBg) { resolve(); return; }
      const handler = () => { document.removeEventListener('removeBgReady', handler); resolve(); };
      document.addEventListener('removeBgReady', handler);
      setTimeout(resolve, 20000);
    });
    if (!window._removeBg) {
      statusEl.textContent = '✗ Modulo non disponibile — verifica la connessione.';
      statusEl.className = 'bg-status error';
      return;
    }
  }

  btn.disabled = true;
  cardLoading.classList.remove('hidden');
  statusEl.innerHTML = '<span class="spinner"></span> Rimozione sfondo in corso…';
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
    setTimeout(() => { statusEl.className = 'bg-status hidden'; }, 3000);
    updateCardPreview();
  } catch (err) {
    console.error('BG removal error:', err);
    statusEl.textContent = '✗ Errore: ' + (err.message || 'sconosciuto');
    statusEl.className = 'bg-status error';
  } finally {
    btn.disabled = false;
    cardLoading.classList.add('hidden');
  }
}

async function downloadForInstagram() {
  if (typeof html2canvas === 'undefined') {
    alert('html2canvas non caricato. Verifica la connessione Internet e ricarica la pagina.');
    return;
  }
  const card = document.getElementById('card-template');
  const btn  = document.getElementById('btn-instagram');
  const origText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px"></span> Elaborazione…';
  btn.disabled = true;

  try {
    // Render la carta ad alta risoluzione
    const cardCanvas = await html2canvas(card, {
      backgroundColor: '#0d1022',
      scale: 4,
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    // Canvas Instagram portrait 4:5 (1080×1350)
    const IG_W = 1080;
    const IG_H = 1350;
    const ig = document.createElement('canvas');
    ig.width  = IG_W;
    ig.height = IG_H;
    const ctx = ig.getContext('2d');

    // ── Sfondo ──────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, IG_W, IG_H);
    bgGrad.addColorStop(0,   '#0a0b10');
    bgGrad.addColorStop(0.5, '#0d0e1a');
    bgGrad.addColorStop(1,   '#13102a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, IG_W, IG_H);

    // Glow centrale
    const glow = ctx.createRadialGradient(IG_W / 2, IG_H / 2, 0, IG_W / 2, IG_H / 2, IG_W * 0.65);
    glow.addColorStop(0,   'rgba(139,92,246,0.18)');
    glow.addColorStop(0.5, 'rgba(59,130,246,0.06)');
    glow.addColorStop(1,   'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, IG_W, IG_H);

    // Anelli decorativi
    [[300, 0.06], [480, 0.04], [640, 0.025]].forEach(([r, alpha]) => {
      ctx.beginPath();
      ctx.arc(IG_W / 2, IG_H / 2, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // ── Carta centrata ───────────────────────
    // Scala la carta per riempire ~85% dell'altezza con margini
    const padding = 90;                                   // px liberi sopra/sotto
    const maxH    = IG_H - padding * 2;
    const maxW    = IG_W - padding * 2;
    const ratio   = Math.min(maxW / cardCanvas.width, maxH / cardCanvas.height);
    const drawW   = Math.round(cardCanvas.width  * ratio);
    const drawH   = Math.round(cardCanvas.height * ratio);
    const x       = Math.round((IG_W - drawW) / 2);
    const y       = Math.round((IG_H - drawH) / 2);

    // Ombra leggera sotto la carta
    ctx.shadowColor   = 'rgba(139,92,246,0.35)';
    ctx.shadowBlur    = 60;
    ctx.shadowOffsetY = 12;
    ctx.drawImage(cardCanvas, x, y, drawW, drawH);
    ctx.shadowColor = 'transparent';

    // ── Download ────────────────────────────
    const name = document.getElementById('t-player-name').value.trim() || 'giocatore';
    const a = document.createElement('a');
    a.href     = ig.toDataURL('image/png');
    a.download = `ig-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  } catch (err) {
    console.error('IG export error:', err);
    alert('Errore esportazione: ' + err.message);
  } finally {
    btn.innerHTML = origText;
    btn.disabled  = false;
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
