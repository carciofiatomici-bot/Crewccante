// Known Beyblade X parts database (skeleton — expand as needed)
const KNOWN_PARTS = [
  // ── BLADES ──────────────────────────────────────────
  { id: 'b001', name: 'Dran Sword',      type: 'blade',   series: 'Beyblade X' },
  { id: 'b002', name: 'Hells Scythe',    type: 'blade',   series: 'Beyblade X' },
  { id: 'b003', name: 'Knight Shield',   type: 'blade',   series: 'Beyblade X' },
  { id: 'b004', name: 'Cobalt Drake',    type: 'blade',   series: 'Beyblade X' },
  { id: 'b005', name: 'Wizard Arrow',    type: 'blade',   series: 'Beyblade X' },
  { id: 'b006', name: 'Leon Claw',       type: 'blade',   series: 'Beyblade X' },
  { id: 'b007', name: 'Shark Edge',      type: 'blade',   series: 'Beyblade X' },
  { id: 'b008', name: 'Viper Tail',      type: 'blade',   series: 'Beyblade X' },
  { id: 'b009', name: 'Rhino Horn',      type: 'blade',   series: 'Beyblade X' },
  { id: 'b010', name: 'Phoenix Wing',    type: 'blade',   series: 'Beyblade X' },
  { id: 'b011', name: 'Dran Dagger',     type: 'blade',   series: 'Beyblade X' },
  { id: 'b012', name: 'Fox Claw',        type: 'blade',   series: 'Beyblade X' },
  { id: 'b013', name: 'Dolphin Spiral',  type: 'blade',   series: 'Beyblade X' },
  { id: 'b014', name: 'Hells Chain',     type: 'blade',   series: 'Beyblade X' },
  { id: 'b015', name: 'Unicorn Sting',   type: 'blade',   series: 'Beyblade X' },
  // ── RATCHET ─────────────────────────────────────────
  { id: 'r001', name: '3-60',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r002', name: '4-60',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r003', name: '5-60',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r004', name: '3-70',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r005', name: '4-70',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r006', name: '5-70',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r007', name: '3-80',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r008', name: '4-80',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r009', name: '5-80',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r010', name: '9-60',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r011', name: '9-70',            type: 'ratchet', series: 'Beyblade X' },
  { id: 'r012', name: '9-80',            type: 'ratchet', series: 'Beyblade X' },
  // ── BIT ─────────────────────────────────────────────
  { id: 't001', name: 'Flat',            type: 'bit',     series: 'Beyblade X' },
  { id: 't002', name: 'Ball',            type: 'bit',     series: 'Beyblade X' },
  { id: 't003', name: 'Spike',           type: 'bit',     series: 'Beyblade X' },
  { id: 't004', name: 'Point',           type: 'bit',     series: 'Beyblade X' },
  { id: 't005', name: 'Needle',          type: 'bit',     series: 'Beyblade X' },
  { id: 't006', name: 'Rush',            type: 'bit',     series: 'Beyblade X' },
  { id: 't007', name: 'Taper',           type: 'bit',     series: 'Beyblade X' },
  { id: 't008', name: 'Orb',             type: 'bit',     series: 'Beyblade X' },
  { id: 't009', name: 'Flat-F',          type: 'bit',     series: 'Beyblade X' },
  { id: 't010', name: 'Gear Flat',       type: 'bit',     series: 'Beyblade X' },
  { id: 't011', name: 'Low Flat',        type: 'bit',     series: 'Beyblade X' },
  { id: 't012', name: 'Kick',            type: 'bit',     series: 'Beyblade X' },
];

// ── AUTH ─────────────────────────────────────────────────
const USERS = [
  { id: 'u1',  username: 'Croccante', password: 'croccante', displayName: 'Croccante', role: 'admin' },
  { id: 'u2',  username: 'unam',      password: 'unam',      displayName: 'Unam',      role: 'member' },
  { id: 'u3',  username: 'bukko',     password: 'bukko',     displayName: 'Bukko',     role: 'member' },
  { id: 'u4',  username: 'asbein',    password: 'asbein',    displayName: 'Asbein',    role: 'member' },
  { id: 'u5',  username: 'ermina',    password: 'ermina',    displayName: 'Ermina',    role: 'member' },
  { id: 'u6',  username: 'daniel',    password: 'daniel',    displayName: 'Daniel',    role: 'member' },
  { id: 'u7',  username: 'dalitrus',  password: 'dalitrus',  displayName: 'Dalitrus',  role: 'member' },
  { id: 'u8',  username: 'nardazza',  password: 'nardazza',  displayName: 'Nardazza',  role: 'member' },
  { id: 'u9',  username: 'beymax',    password: 'beymax',    displayName: 'Beymax',    role: 'member' },
];

// ── STORAGE HELPERS ──────────────────────────────────────
const DB = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

function getCollection(userId) {
  return DB.get(`collection_${userId}`, []);
}
function saveCollection(userId, parts) {
  DB.set(`collection_${userId}`, parts);
}
function getSavedCards() {
  return DB.get('savedCards', []);
}
function saveSavedCards(list) {
  DB.set('savedCards', list);
}
function getTournaments() {
  return DB.get('tournaments', []);
}
function saveTournaments(list) {
  DB.set('tournaments', list);
}
function getAllMembers() {
  return USERS;
}

// Migrates old tournament-card records (v1 format with playerName) to savedCards
function migrateLegacyData() {
  const old = DB.get('tournaments', []);
  if (old.length === 0 || !old[0].playerName) return;
  const existing = getSavedCards();
  const existingIds = new Set(existing.map(c => c.id));
  const migrated = old
    .filter(t => !existingIds.has(t.id))
    .map(t => ({
      id: t.id || ('card_' + Date.now() + Math.random()),
      playerName: t.playerName || '',
      team: t.team || '',
      showTeam: !!t.team,
      rank: t.rank || 1,
      specialRank: null,
      deck: (t.deck || []).map(d => typeof d === 'string' ? { name: d } : d),
      tournamentName: t.tournamentName || '',
      bottomText: t.bottomText || 'COBALT DRAGONA',
      photo: t.photo || null,
      logoLeft: t.logoLeft || null,
      logoRight: t.logoRight || null,
      date: t.date || '',
      createdBy: null
    }));
  if (migrated.length > 0) {
    saveSavedCards([...existing, ...migrated]);
    DB.set('tournaments', []);
  }
}

function getTypeIcon(type) {
  if (type === 'blade')   return '⚔️';
  if (type === 'ratchet') return '⚙️';
  if (type === 'bit')     return '🔩';
  return '◆';
}
function getTypeBadgeClass(type) {
  if (type === 'blade')   return 'badge-blade';
  if (type === 'ratchet') return 'badge-ratchet';
  if (type === 'bit')     return 'badge-bit';
  return '';
}
