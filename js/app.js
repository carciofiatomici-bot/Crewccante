/* ============================================
   CREWCCANTE — Main App Logic
   ============================================ */

let currentUser = null;
let editingTournamentId = null;

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  migrateLegacyData();

  const saved = DB.get('currentUser');
  if (saved) {
    currentUser = saved;
    enterApp();
  }

  // Login
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Nav links
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

  // Popola select varianti deck
  const variantOptions = VARIANTS.map(v => `<option value="${v.id}">${v.label}</option>`).join('');
  [1, 2, 3].forEach(i => {
    const sel = document.getElementById(`deck-variant-${i}`);
    if (sel) {
      sel.innerHTML = variantOptions;
      sel.addEventListener('change', updateCardPreview);
    }
  });

  // Subtab switching
  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSubtab(btn.dataset.subtab));
  });

  // Card form fields → live preview
  document.getElementById('btn-generate-card').addEventListener('click', updateCardPreview);
  document.getElementById('btn-save-card').addEventListener('click', saveCard);
  document.getElementById('btn-download-card').addEventListener('click', downloadCard);
  document.getElementById('btn-instagram').addEventListener('click', downloadForInstagram);
  document.getElementById('btn-remove-bg').addEventListener('click', handleBgRemoval);

  ['t-player-name', 't-rank', 't-team-name', 'deck-1', 'deck-2', 'deck-3',
   't-tournament-name', 't-bottom-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCardPreview);
  });

  // Toggle Team Sì/No
  document.getElementById('toggle-team').addEventListener('change', function () {
    const label = document.getElementById('toggle-team-label');
    const field = document.getElementById('team-name-field');
    label.textContent = this.checked ? 'Sì' : 'No';
    field.style.display = this.checked ? '' : 'none';
    updateCardPreview();
  });

  // Toggle Primo Svizzera (mutually exclusive with Ultimo Eroe)
  document.getElementById('toggle-swiss').addEventListener('change', function () {
    if (this.checked) document.getElementById('toggle-last').checked = false;
    const rankInput = document.getElementById('t-rank');
    rankInput.disabled = this.checked;
    if (this.checked) rankInput.style.opacity = '0.4';
    else rankInput.style.opacity = '';
    updateCardPreview();
  });

  // Toggle Ultimo Eroe (mutually exclusive with Primo Svizzera)
  document.getElementById('toggle-last').addEventListener('change', function () {
    if (this.checked) document.getElementById('toggle-swiss').checked = false;
    const rankInput = document.getElementById('t-rank');
    rankInput.disabled = this.checked;
    if (this.checked) rankInput.style.opacity = '0.4';
    else rankInput.style.opacity = '';
    updateCardPreview();
  });

  // Logo uploads (left & right) — still allow manual override
  ['left', 'right'].forEach(side => {
    setupLogoUpload(`logo-drop-${side}`, `logo-file-${side}`, `logo-preview-${side}`, updateCardPreview);
  });

  // Tournament modal
  document.getElementById('btn-new-tournament').addEventListener('click', () => openTournamentModal());
  document.getElementById('modal-tournament-close').addEventListener('click', closeTournamentModal);
  document.getElementById('modal-tournament-overlay').addEventListener('click', closeTournamentModal);
  document.getElementById('btn-cancel-tournament-modal').addEventListener('click', closeTournamentModal);
  document.getElementById('btn-save-tournament-modal').addEventListener('click', saveTournamentModal);
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
  if (pageName === 'dashboard')  renderDashboard();
  if (pageName === 'collection') renderCollection();
  if (pageName === 'database')   renderDatabase();
  if (pageName === 'tournament') { /* subtabs handle rendering */ }
  if (pageName === 'tornei')     renderTorneiView();
  if (pageName === 'members')    renderMembersView();
}

// ── SUBTABS ──────────────────────────────────
function switchSubtab(name) {
  document.querySelectorAll('.subtab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.subtab === name)
  );
  document.querySelectorAll('.subtab-content').forEach(c => {
    if (c.id === `subtab-${name}`) {
      c.classList.remove('hidden');
      c.classList.add('active');
    } else {
      c.classList.remove('active');
      c.classList.add('hidden');
    }
  });
  if (name === 'saved-cards') renderSavedCards();
}

// ── DASHBOARD ────────────────────────────────
function renderDashboard() {
  if (!currentUser) return;
  const myParts    = getCollection(currentUser.id);
  const savedCards = getSavedCards();
  const tournaments = getTournaments();

  document.getElementById('stat-total-parts').textContent  = myParts.length;
  document.getElementById('stat-members').textContent      = USERS.length;
  document.getElementById('stat-tournaments').textContent  = tournaments.length;

  const preview = document.getElementById('dash-my-parts');
  if (myParts.length === 0) {
    preview.innerHTML = '<p class="empty-msg">Nessun pezzo aggiunto ancora. <a href="#" data-page="collection" class="nav-trigger">Aggiungi pezzi →</a></p>';
  } else {
    preview.innerHTML = myParts.slice(0, 12).map(p =>
      `<span class="part-mini-tag">${getTypeIcon(p.type)} ${escHtml(p.name)}</span>`
    ).join('') + (myParts.length > 12 ? `<span class="part-mini-tag">+${myParts.length - 12} altri</span>` : '');
  }

  const tDiv = document.getElementById('dash-tournaments');
  if (tournaments.length === 0) {
    tDiv.innerHTML = '<p class="empty-msg">Nessun torneo registrato. <a href="#" data-page="tornei" class="nav-trigger">Crea torneo →</a></p>';
  } else {
    const cards = savedCards;
    tDiv.innerHTML = tournaments.slice(-3).reverse().map(t => {
      const tCards = (t.cardIds || []).map(id => cards.find(c => c.id === id)).filter(Boolean);
      return `<div class="tournament-item">
        <div class="t-info">
          <div class="t-name">${escHtml(t.name)}</div>
          <div class="t-meta">${t.date || ''} &bull; ${tCards.length} partecipanti</div>
        </div>
      </div>`;
    }).join('');
  }
}

// ── COLLECTION ───────────────────────────────
function renderCollection() {
  if (!currentUser) return;
  const parts  = getCollection(currentUser.id);
  const query  = document.getElementById('search-parts').value.toLowerCase();
  const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

  const filtered = parts.filter(p => {
    const matchType   = filter === 'all' || p.type === filter;
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
  const icon      = getTypeIcon(p.type);
  const badgeClass = getTypeBadgeClass(p.type);
  const photoHtml  = p.photo
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
  const members  = getAllMembers();
  const tabsEl   = document.getElementById('member-tabs');
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

// ── MEMBERS VIEW ─────────────────────────────
function renderMembersView() {
  const list = document.getElementById('members-list');
  list.innerHTML = USERS.map(u => {
    const parts = getCollection(u.id);
    return `<div class="member-card">
      <div class="member-avatar-large ${u.role === 'admin' ? 'admin' : ''}">
        ${u.displayName[0].toUpperCase()}
      </div>
      <div class="member-display-name">${escHtml(u.displayName)}</div>
      <div class="member-username">@${escHtml(u.username)}</div>
      <span class="member-role-badge ${u.role}">${u.role === 'admin' ? 'Admin' : 'Membro'}</span>
      <div class="member-parts-count">${parts.length} pezzi in collezione</div>
    </div>`;
  }).join('');
}

// ── MODAL AGGIUNGI PEZZO ─────────────────────
function openModal() {
  selectedKnownPart = null;
  document.getElementById('part-name').value    = '';
  document.getElementById('part-series').value  = 'Beyblade X';
  document.getElementById('part-notes').value   = '';
  document.getElementById('part-photo-name').value = '';
  document.getElementById('search-list').value  = '';
  document.getElementById('part-photo-preview').classList.add('hidden');
  document.getElementById('part-photo-placeholder').classList.remove('hidden');
  switchModalTab('manual');
  renderKnownPartsList();
  document.getElementById('modal-add-part').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-add-part').classList.add('hidden');
}

let selectedKnownPart = null;

function switchModalTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.modal-tab-content').forEach(c => {
    c.classList.toggle('hidden', !c.id.endsWith(tab));
    c.classList.toggle('active', c.id.endsWith(tab));
  });
}

function renderKnownPartsList() {
  const query  = document.getElementById('search-list').value.toLowerCase();
  const list   = document.getElementById('known-parts-list');
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
      id: 'p_' + Date.now(), name,
      type:   document.getElementById('part-type').value,
      series: document.getElementById('part-series').value.trim() || 'Beyblade X',
      notes:  document.getElementById('part-notes').value.trim(),
      photo:  null
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
    const photo   = preview.classList.contains('hidden') ? null : preview.src;
    newPart = {
      id: 'p_' + Date.now(), name,
      type:   document.getElementById('part-photo-type').value,
      series: 'Beyblade X', notes: '', photo
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
  const drop       = document.getElementById(dropId);
  const input      = document.getElementById(inputId);
  const preview    = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const revealEl   = revealId ? document.getElementById(revealId) : null;

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--accent-blue)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.style.borderColor = '';
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

function setupLogoUpload(dropId, inputId, previewId, onChange) {
  const drop   = document.getElementById(dropId);
  const input  = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!drop || !input || !preview) return;
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--accent-blue)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadLogoFile(file, drop, preview, onChange);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) loadLogoFile(input.files[0], drop, preview, onChange);
  });
}

function loadLogoFile(file, drop, preview, onChange) {
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    drop.querySelectorAll('.logo-mini-ph').forEach(el => el.style.display = 'none');
    if (onChange) onChange();
  };
  reader.readAsDataURL(file);
}

// ── TOURNAMENT CARD PREVIEW ───────────────────
function updateCardPreview() {
  const name       = document.getElementById('t-player-name').value.trim() || 'NOME GIOCATORE';
  const rank       = document.getElementById('t-rank').value || '1';
  const tname      = document.getElementById('t-tournament-name').value.trim() || 'TORNEO';
  const bottomText = document.getElementById('t-bottom-text').value.trim() || 'COBALT DRAGONA';
  const showTeam   = document.getElementById('toggle-team').checked;
  const team       = document.getElementById('t-team-name').value.trim() || 'TEAM';
  const swissOn    = document.getElementById('toggle-swiss')?.checked || false;
  const lastOn     = document.getElementById('toggle-last')?.checked || false;

  // Rank display
  const rankEl = document.getElementById('card-rank-display');
  if (swissOn) {
    rankEl.innerHTML = '1°<br>SWISS';
    rankEl.className = 'card-rank swiss';
  } else if (lastOn) {
    rankEl.innerHTML = 'ULTIMO<br>EROE';
    rankEl.className = 'card-rank last-hero';
  } else {
    rankEl.textContent = `#${rank}`;
    rankEl.className = 'card-rank';
  }

  document.getElementById('card-name-display').textContent      = name.toUpperCase();
  document.getElementById('card-tournament-display').textContent = tname.toUpperCase();
  document.getElementById('card-bottom-text').textContent        = bottomText.toUpperCase();

  // Team badge
  const teamBadge = document.getElementById('card-team-display');
  if (showTeam) {
    teamBadge.textContent = team.toUpperCase();
    teamBadge.classList.remove('hidden');
  } else {
    teamBadge.classList.add('hidden');
  }

  // Deck: auto-load stock images from images/parts/ (con variante colore)
  [1, 2, 3].forEach(i => {
    const nameVal   = document.getElementById(`deck-${i}`).value.trim() || '—';
    const variantEl = document.getElementById(`deck-variant-${i}`);
    const variant   = variantEl ? variantEl.value : '';

    // Nome da mostrare sulla card: "DRAN SWORD BLACK"
    const variantLabel = variant
      ? (VARIANTS.find(v => v.id === variant)?.label || variant)
      : '';
    const displayName = nameVal === '—'
      ? '—'
      : (variantLabel ? `${nameVal} ${variantLabel}` : nameVal);
    document.getElementById(`card-deck-name-${i}`).textContent = displayName;

    const formPrev = document.getElementById(`deck-preview-${i}`);
    const formPh   = document.getElementById(`deck-ph-${i}`);
    const cardImg  = document.getElementById(`card-deck-img-${i}`);
    const cardPh   = cardImg ? cardImg.nextElementSibling : null;

    if (nameVal && nameVal !== '—') {
      const part      = KNOWN_PARTS.find(p => p.name.toLowerCase() === nameVal.toLowerCase());
      const baseId    = part ? part.id : nameVal.toLowerCase().replace(/\s+/g, '-');
      const imgPath   = variant
        ? `images/parts/${baseId}-${variant}.png`
        : `images/parts/${baseId}.png`;

      const setImg = (el, isCard) => {
        el.src = imgPath;
        if (isCard) el.classList.remove('hidden');
        else el.style.display = '';
        el.onerror = () => {
          if (isCard) el.classList.add('hidden');
          else el.style.display = 'none';
          const ph = isCard ? cardPh : formPh;
          if (ph) ph.style.display = '';
        };
        el.onload = () => {
          const ph = isCard ? cardPh : formPh;
          if (ph) ph.style.display = 'none';
        };
      };

      if (formPrev) setImg(formPrev, false);
      if (cardImg)  setImg(cardImg, true);
    } else {
      if (formPrev) { formPrev.src = ''; formPrev.style.display = 'none'; }
      if (formPh)   formPh.style.display = '';
      if (cardImg)  { cardImg.src = ''; cardImg.classList.add('hidden'); }
      if (cardPh)   cardPh.style.display = '';
    }
  });

  // Foto giocatore
  const photoPreview = document.getElementById('photo-preview');
  const cardPhoto    = document.getElementById('card-photo');
  const cardPhotoPh  = document.querySelector('.card-photo-placeholder');
  if (!photoPreview.classList.contains('hidden') && photoPreview.src) {
    cardPhoto.src = photoPreview.src;
    cardPhoto.classList.remove('hidden');
    if (cardPhotoPh) cardPhotoPh.style.display = 'none';
  } else {
    cardPhoto.classList.add('hidden');
    if (cardPhotoPh) cardPhotoPh.style.display = '';
  }

  // Loghi: default da file, override se upload manuale
  ['left', 'right'].forEach(side => {
    const defaultSrc = side === 'left'
      ? 'images/logos/logo-cobalt-dragona.png'
      : 'images/logos/logo-bnc.png';
    const fp = document.getElementById(`logo-preview-${side}`);
    const ci = document.getElementById(`card-logo-${side}`);
    if (fp && !fp.classList.contains('hidden') && fp.src && fp.src.startsWith('data:')) {
      ci.src = fp.src;
    } else {
      ci.src = defaultSrc;
    }
    ci.classList.remove('hidden');
  });
}

// ── SAVE CARD ────────────────────────────────
function saveCard() {
  const playerName = document.getElementById('t-player-name').value.trim();
  if (!playerName) { alert('Inserisci il nome del giocatore'); return; }

  const swissOn    = document.getElementById('toggle-swiss').checked;
  const lastOn     = document.getElementById('toggle-last').checked;
  const specialRank = swissOn ? 'swiss' : lastOn ? 'last' : null;
  const rank        = specialRank ? null : (parseInt(document.getElementById('t-rank').value) || 1);

  const showTeam = document.getElementById('toggle-team').checked;
  const team     = document.getElementById('t-team-name').value.trim();

  const deck = [1, 2, 3].map(i => {
    const variantEl = document.getElementById(`deck-variant-${i}`);
    const variant   = variantEl ? variantEl.value : '';
    return {
      name:    document.getElementById(`deck-${i}`).value.trim() || '',
      variant
    };
  });

  const photoPreview = document.getElementById('photo-preview');
  const photo        = photoPreview.classList.contains('hidden') ? null : photoPreview.src;

  const logoLeft  = getLogoSrc('left');
  const logoRight = getLogoSrc('right');

  const cards = getSavedCards();
  cards.push({
    id:             'card_' + Date.now(),
    playerName, team, showTeam, rank, specialRank,
    deck,
    tournamentName: document.getElementById('t-tournament-name').value.trim(),
    bottomText:     document.getElementById('t-bottom-text').value.trim() || 'COBALT DRAGONA',
    photo, logoLeft, logoRight,
    date:      new Date().toLocaleDateString('it-IT'),
    createdBy: currentUser.id
  });
  saveSavedCards(cards);
  renderDashboard();

  // Switch to saved-cards subtab
  switchSubtab('saved-cards');
  alert(`Carta di ${playerName} salvata!`);
}

function getLogoSrc(side) {
  const fp = document.getElementById(`logo-preview-${side}`);
  if (fp && !fp.classList.contains('hidden') && fp.src && fp.src.startsWith('data:')) return fp.src;
  return side === 'left' ? 'images/logos/logo-cobalt-dragona.png' : 'images/logos/logo-bnc.png';
}

// ── SAVED CARDS ──────────────────────────────
function renderSavedCards() {
  const cards = getSavedCards();
  const grid  = document.getElementById('saved-cards-grid');
  const count = document.getElementById('saved-cards-count');
  count.textContent = `${cards.length} ${cards.length === 1 ? 'carta salvata' : 'carte salvate'}`;

  if (cards.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🃏</div>
      <p>Nessuna carta salvata ancora</p>
      <button class="btn-primary" onclick="switchSubtab('create-card')">Crea la prima carta</button>
    </div>`;
    return;
  }

  grid.innerHTML = cards.map(c => {
    const rankLabel = rankDisplay(c);
    const photoHtml = c.photo ? `<img src="${escHtml(c.photo)}" alt="" />` : '👤';
    return `<div class="saved-card-thumb" data-id="${c.id}">
      <div class="saved-card-thumb-photo">${photoHtml}</div>
      <div class="saved-card-thumb-info">
        <div class="saved-card-thumb-name">${escHtml(c.playerName)}</div>
        <div class="saved-card-thumb-rank">${rankLabel}</div>
        <div class="saved-card-thumb-meta">${escHtml(c.tournamentName || '—')}</div>
      </div>
      <button class="saved-card-thumb-delete" data-id="${c.id}" title="Elimina">✕</button>
    </div>`;
  }).join('');

  grid.querySelectorAll('.saved-card-thumb-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Eliminare questa carta?')) {
        const updated = getSavedCards().filter(c => c.id !== btn.dataset.id);
        saveSavedCards(updated);
        renderSavedCards();
        renderDashboard();
      }
    });
  });
}

// ── TORNEI VIEW ──────────────────────────────
function renderTorneiView() {
  const tournaments = getTournaments();
  const countEl     = document.getElementById('tournaments-count');
  countEl.textContent = `${tournaments.length} ${tournaments.length === 1 ? 'torneo' : 'tornei'}`;

  const list     = document.getElementById('tournaments-management-list');
  const savedCards = getSavedCards();

  if (tournaments.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🏆</div>
      <p>Nessun torneo ancora. Creane uno!</p>
    </div>`;
    return;
  }

  list.innerHTML = tournaments.map(t => {
    const tCards = (t.cardIds || []).map(id => savedCards.find(c => c.id === id)).filter(Boolean);
    return `<div class="tournament-entry">
      <div class="tournament-entry-header" data-tid="${t.id}">
        <div class="tournament-entry-left">
          <div class="tournament-entry-name">${escHtml(t.name)}</div>
          <div class="tournament-entry-meta">${t.date || ''}</div>
        </div>
        <div class="tournament-entry-right">
          <span class="tournament-card-count">${tCards.length} carte</span>
          <div class="tournament-entry-actions">
            <button class="btn-icon danger" data-delete-tid="${t.id}" title="Elimina torneo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="tournament-entry-cards closed" id="t-cards-${t.id}">
        ${tCards.length === 0
          ? '<span style="color:var(--text-secondary);font-size:0.82rem">Nessuna carta in questo torneo</span>'
          : tCards.map(c => `<div class="tournament-mini-card">
              <div class="tournament-mini-card-photo">${c.photo ? `<img src="${escHtml(c.photo)}" alt="" />` : '👤'}</div>
              <div class="tournament-mini-card-info">
                <div class="tournament-mini-card-name">${escHtml(c.playerName)}</div>
                <div class="tournament-mini-card-rank">${rankDisplay(c)}</div>
              </div>
            </div>`).join('')}
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.tournament-entry-header').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('[data-delete-tid]')) return;
      const tid    = header.dataset.tid;
      const cardsEl = document.getElementById(`t-cards-${tid}`);
      cardsEl.classList.toggle('open');
      cardsEl.classList.toggle('closed');
    });
  });

  list.querySelectorAll('[data-delete-tid]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Eliminare questo torneo?')) {
        const updated = getTournaments().filter(t => t.id !== btn.dataset.deleteTid);
        saveTournaments(updated);
        renderTorneiView();
        renderDashboard();
      }
    });
  });
}

// ── TOURNAMENT MODAL ─────────────────────────
function openTournamentModal(tid = null) {
  editingTournamentId = tid;
  document.getElementById('modal-tournament-title').textContent = tid ? 'Modifica Torneo' : 'Nuovo Torneo';

  if (tid) {
    const t = getTournaments().find(t => t.id === tid);
    document.getElementById('t-tournament-modal-name').value = t?.name || '';
    document.getElementById('t-tournament-modal-date').value = t?.date || '';
  } else {
    document.getElementById('t-tournament-modal-name').value = '';
    document.getElementById('t-tournament-modal-date').value = '';
  }

  const savedCards  = getSavedCards();
  const sel         = document.getElementById('modal-cards-selection');
  const selectedIds = tid ? (getTournaments().find(t => t.id === tid)?.cardIds || []) : [];

  if (savedCards.length === 0) {
    sel.innerHTML = '<p class="empty-msg" style="padding:1rem">Nessuna carta salvata. Vai su "Carte Torneo" e crea prima una carta.</p>';
  } else {
    sel.innerHTML = savedCards.map(c => {
      const isSelected = selectedIds.includes(c.id);
      return `<label class="modal-card-option ${isSelected ? 'selected' : ''}">
        <input type="checkbox" name="modal-card" value="${c.id}" ${isSelected ? 'checked' : ''} />
        <div class="modal-card-option-photo">${c.photo ? `<img src="${escHtml(c.photo)}" alt="" />` : '👤'}</div>
        <div class="modal-card-option-info">
          <div class="modal-card-option-name">${escHtml(c.playerName)}</div>
          <div class="modal-card-option-meta">${escHtml(c.tournamentName || '—')} · ${c.date || ''}</div>
        </div>
        <span class="modal-card-option-rank">${rankDisplay(c)}</span>
      </label>`;
    }).join('');

    sel.querySelectorAll('.modal-card-option').forEach(opt => {
      const cb = opt.querySelector('input[type=checkbox]');
      opt.addEventListener('click', e => {
        if (e.target === cb) return;
        cb.checked = !cb.checked;
        opt.classList.toggle('selected', cb.checked);
      });
      cb.addEventListener('change', () => opt.classList.toggle('selected', cb.checked));
    });
  }

  document.getElementById('modal-tournament').classList.remove('hidden');
}

function closeTournamentModal() {
  document.getElementById('modal-tournament').classList.add('hidden');
  editingTournamentId = null;
}

function saveTournamentModal() {
  const name = document.getElementById('t-tournament-modal-name').value.trim();
  if (!name) { alert('Inserisci il nome del torneo'); return; }
  const date    = document.getElementById('t-tournament-modal-date').value;
  const cardIds = [...document.querySelectorAll('#modal-cards-selection input[type=checkbox]:checked')]
    .map(cb => cb.value);

  const list = getTournaments();
  if (editingTournamentId) {
    const idx = list.findIndex(t => t.id === editingTournamentId);
    if (idx !== -1) list[idx] = { ...list[idx], name, date, cardIds };
  } else {
    list.push({
      id:        'tourn_' + Date.now(),
      name, date, cardIds,
      createdAt: new Date().toLocaleDateString('it-IT')
    });
  }
  saveTournaments(list);
  closeTournamentModal();
  renderTorneiView();
  renderDashboard();
}

// ── DOWNLOAD / EXPORT ────────────────────────
async function downloadCard() {
  if (typeof html2canvas === 'undefined') {
    alert('html2canvas non caricato. Verifica la connessione Internet e ricarica la pagina.');
    return;
  }
  const card = document.getElementById('card-template');
  const btn  = document.getElementById('btn-download-card');
  btn.textContent = '⟳ Generazione...';
  btn.disabled = true;
  try {
    const canvas = await html2canvas(card, {
      backgroundColor: '#0d1022', scale: 3,
      useCORS: true, allowTaint: true, logging: false
    });
    const name = document.getElementById('t-player-name').value.trim() || 'giocatore';
    const a = document.createElement('a');
    a.href     = canvas.toDataURL('image/png');
    a.download = `carta-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  } catch (err) {
    console.error(err);
    alert('Errore nel download: ' + err.message);
  } finally {
    btn.textContent = 'Scarica PNG';
    btn.disabled = false;
  }
}

async function handleBgRemoval() {
  const preview    = document.getElementById('photo-preview');
  const btn        = document.getElementById('btn-remove-bg');
  const statusEl   = document.getElementById('bg-status');
  const cardLoading = document.getElementById('card-loading');

  if (preview.classList.contains('hidden') || !preview.src) return;

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
      statusEl.className   = 'bg-status error';
      return;
    }
  }

  btn.disabled = true;
  cardLoading.classList.remove('hidden');
  statusEl.innerHTML = '<span class="spinner"></span> Rimozione sfondo in corso…';
  statusEl.className = 'bg-status loading';
  statusEl.classList.remove('hidden');

  try {
    const blob       = dataURLtoBlob(preview.src);
    const resultBlob = await window._removeBg(blob, {
      model: 'small', output: { format: 'image/png', quality: 0.9 }
    });
    const url = URL.createObjectURL(resultBlob);
    preview.src = url;
    statusEl.textContent = '✓ Sfondo rimosso!';
    statusEl.className   = 'bg-status success';
    setTimeout(() => { statusEl.className = 'bg-status hidden'; }, 3000);
    updateCardPreview();
  } catch (err) {
    console.error('BG removal error:', err);
    statusEl.textContent = '✗ Errore: ' + (err.message || 'sconosciuto');
    statusEl.className   = 'bg-status error';
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
  const card     = document.getElementById('card-template');
  const btn      = document.getElementById('btn-instagram');
  const origText = btn.innerHTML;
  btn.innerHTML  = '<span class="spinner" style="width:14px;height:14px;border-width:2px"></span> Elaborazione…';
  btn.disabled   = true;

  try {
    const cardCanvas = await html2canvas(card, {
      backgroundColor: '#0d1022', scale: 4,
      useCORS: true, allowTaint: true, logging: false
    });

    const IG_W = 1080, IG_H = 1350;
    const ig   = document.createElement('canvas');
    ig.width   = IG_W; ig.height = IG_H;
    const ctx  = ig.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, IG_W, IG_H);
    bgGrad.addColorStop(0, '#0a0b10'); bgGrad.addColorStop(0.5, '#0d0e1a'); bgGrad.addColorStop(1, '#13102a');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, IG_W, IG_H);

    const glow = ctx.createRadialGradient(IG_W/2, IG_H/2, 0, IG_W/2, IG_H/2, IG_W*0.65);
    glow.addColorStop(0, 'rgba(139,92,246,0.18)'); glow.addColorStop(0.5, 'rgba(59,130,246,0.06)'); glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, IG_W, IG_H);

    [[300, 0.06], [480, 0.04], [640, 0.025]].forEach(([r, alpha]) => {
      ctx.beginPath(); ctx.arc(IG_W/2, IG_H/2, r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(139,92,246,${alpha})`; ctx.lineWidth = 1; ctx.stroke();
    });

    const padding = 90;
    const maxH = IG_H - padding*2, maxW = IG_W - padding*2;
    const ratio = Math.min(maxW/cardCanvas.width, maxH/cardCanvas.height);
    const drawW = Math.round(cardCanvas.width*ratio), drawH = Math.round(cardCanvas.height*ratio);
    const x = Math.round((IG_W-drawW)/2), y = Math.round((IG_H-drawH)/2);

    ctx.shadowColor = 'rgba(139,92,246,0.35)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 12;
    ctx.drawImage(cardCanvas, x, y, drawW, drawH);
    ctx.shadowColor = 'transparent';

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

// ── UTILS ────────────────────────────────────
function rankDisplay(c) {
  if (c.specialRank === 'swiss') return '1° SWISS';
  if (c.specialRank === 'last')  return 'ULTIMO EROE';
  return `#${c.rank}`;
}

function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime   = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr    = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
