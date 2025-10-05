/* ===================== CONSTANTS / HELPERS ===================== */
const PASSWORD = "uoiyiuh_+=-5216gh;lj??!/345";
let currentFileName = "GameDataFull.json";
let gameData = null;
let hasUnsavedChanges = false;

function getPassword() {
  const customPw = document.getElementById('customPassword').value.trim();
  return customPw || PASSWORD;
}

function toggleCollapsible(elem) {
  const arrow = elem.querySelector('.collapsible-arrow');
  const content = elem.querySelector('.collapsible-content');
  arrow.classList.toggle('open');
  content.classList.toggle('open');
}

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Track changes in editor
document.addEventListener('DOMContentLoaded', () => {
  const editorSection = document.getElementById('editorSection');
  if (editorSection) {
    editorSection.addEventListener('input', () => { hasUnsavedChanges = true; });
    editorSection.addEventListener('change', () => { hasUnsavedChanges = true; });
  }
});

const POWERUP_CATEGORIES = {
  "Skeleton Parts": ["Skeleton_Arm1","Skeleton_Arm2","Skeleton_Leg1","Skeleton_Leg2","Skeleton_Head"],
  "Lucky Cats": ["LuckyCat","LuckyCatFat","LuckyCatSwole"],
  "Money Items": ["Wallet","MoneyBriefCase","GrandmasPurse"],
  "Buttons": ["Button2X","RedCrystal","RingBell","WeirdClock","GoldenHand_MidasTouch","Cross","PossessedPhone","AncientCoin"],
  "Instant Symbols": ["SymbolInstant_Lemon","SymbolInstant_Cherry","SymbolInstant_Clover","SymbolInstant_Bell","SymbolInstant_Diamond","SymbolInstant_Treasure","SymbolInstant_Seven"],
  "Golden Symbols": ["GoldenSymbol_Lemon","GoldenSymbol_Cherry","GoldenSymbol_Clover","GoldenSymbol_Bell","GoldenSymbol_Diamond","GoldenSymbol_Treasure","GoldenSymbol_Seven"],
  "Mystical": ["Ankh","HorseShoe","HorseShoeGold","TarotDeck","CrystalSkull","Pentacle","Baphomet","Necronomicon","HolyBible","BookOfShadows","Rosary"],
  "Special": ["FortuneCookie","YellowStar","Jimbo","Calendar","Hourglass","CloverVoucher","CloverPot","CloverPet","CloversLandPatch"],
  "Peppers": ["HornChilyRed","HornChilyGreen","RottenPepper","BellPepper","GoldenPepper"],
  "Boardgame": ["Boardgame_C_Dealer","Boardgame_M_Capitalist","Boardgame_C_Bricks","Boardgame_C_Wood","Boardgame_C_Sheep","Boardgame_C_Wheat","Boardgame_C_Stone","Boardgame_C_Harbor","Boardgame_C_Thief","Boardgame_M_Carriola","Boardgame_M_Shoe","Boardgame_M_Ditale","Boardgame_M_FerroDaStiro","Boardgame_M_Car","Boardgame_M_Ship","Boardgame_M_Hat"]
};

/* XOR-like crypto from original code */
function cryptoShiftsNumber(password) {
  let num = 8;
  for (let i=0;i<password.length;i++) num += password.charCodeAt(i);
  while (num > 16 || num < 8) {
    if (num > 16) num -= 16;
    if (num < 8) num += 8;
  }
  return num;
}
function encryptCustom(data, password) {
  if (!data || !password) return "";
  const length = data.length;
  const numIterations = cryptoShiftsNumber(password);
  let passwordArray = password.split('');
  let array2 = new Array(passwordArray.length);
  for (let iteration=0; iteration<numIterations; iteration++) {
    for (let j=0; j<passwordArray.length; j++) {
      const num2 = Math.abs(passwordArray[j].charCodeAt(0) % passwordArray.length);
      const num3 = Math.floor((j + num2) % passwordArray.length);
      array2[j] = passwordArray[num3];
      array2[j] = String.fromCharCode(array2[j].charCodeAt(0) ^ passwordArray[j].charCodeAt(0));
    }
  }
  let result = [];
  for (let k=0; k<length; k++) {
    const charValue = data.charCodeAt(k);
    const keyChar = array2[k % array2.length].charCodeAt(0);
    result.push(String.fromCharCode(charValue ^ keyChar));
  }
  return result.join('');
}
function arrayBufferToLatin1(buffer) {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i=0;i<bytes.length;i++) result += String.fromCharCode(bytes[i]);
  return result;
}
function latin1ToArrayBuffer(str) {
  const bytes = new Uint8Array(str.length);
  for (let i=0;i<str.length;i++) bytes[i] = str.charCodeAt(i) & 0xFF;
  return bytes.buffer;
}

function showStatus(message, type='info') {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = 'status ' + (type==='error'?'error':'success');
  setTimeout(()=>{ if(type!=='error') el.style.display='none'; }, 5000);
}
function switchTab(ev, name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  ev.target.classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
}

/* ByteArray helpers */
function getByte(gd, key, def=0) {
  const arr = gd?.[key];
  if (Array.isArray(arr) && arr.length>0 && Number.isFinite(arr[0])) return arr[0];
  return def;
}
function setByte(gd, key, value) {
  const v = Number.isFinite(+value)? +value : 0;
  if (!Array.isArray(gd[key])) gd[key] = [v];
  else gd[key][0] = v;
}

/* CSV helpers */
const toCsv = arr => (arr||[]).join(',');
const fromCsv = (s, trim=true) => (s||'').split(',').map(x=> trim?x.trim():x);

/* ===================== UI POPULATION ===================== */
function populatePowerupGrid() {
  const grid = document.getElementById('powerupGrid');
  grid.innerHTML = '';
  Object.entries(POWERUP_CATEGORIES).forEach(([category,pus])=>{
    const head = document.createElement('div');
    head.className='subsection-title';
    head.textContent = category;
    grid.appendChild(head);
    pus.forEach(id=>{
      const item = document.createElement('div');
      item.className='powerup-item';
      item.innerHTML = `
        <input type="checkbox" id="powerup_${id}" value="${id}">
        <label for="powerup_${id}">${id.replace(/_/g,' ')}</label>
      `;
      grid.appendChild(item);
    });
  });
}

/* RNG UI */
const RNG_KEYS = [
  "rngRunMod","rngSymbolsMod","rngPowerupsMod","rngSymbolsChance","rngCards","rngPowerupsAll",
  "rngAbilities","rngDrawers","rngStore","rngStoreChains","rngPhone","rngSlotMachineLuck",
  "rng666","rngGarbage"
];
function renderRngEditors() {
  const host = document.getElementById('rngContainer');
  host.innerHTML = '';
  const gd = gameData?.gameplayData;
  if (!gd) return;
  const wrap = document.createElement('div');
  RNG_KEYS.forEach(k=>{
    const o = gd[k];
    const box = document.createElement('div');
    box.className = 'form-group';
    box.innerHTML = `
      <div class="subsection-title">${k}</div>
      <div class="form-row">
        <div class="form-field"><label>seed</label><input type="number" id="${k}_seed" /></div>
        <div class="form-field"><label>stateIndex</label><input type="number" id="${k}_stateIndex" /></div>
        <div class="form-field"><label>randomNumber</label><input type="number" id="${k}_randomNumber" /></div>
      </div>
      <div class="help-text">Change carefully. Inconsistent RNG states can cause events to jump.</div>
    `;
    wrap.appendChild(box);
    setTimeout(()=>{
      document.getElementById(`${k}_seed`).value = o?.seed ?? 0;
      document.getElementById(`${k}_stateIndex`).value = o?.stateIndex ?? 0;
      document.getElementById(`${k}_randomNumber`).value = o?.randomNumber ?? 0;
    },0);
  });
  host.appendChild(wrap);
}

/* Symbols & Patterns */
function renderSymbolsEditor() {
  const gd = gameData?.gameplayData;
  const host = document.getElementById('symbolsEditor');
  const pattHost = document.getElementById('patternsEditor');
  host.innerHTML = ''; pattHost.innerHTML = '';

  if (!gd) return;

  // Symbols full editor
  if (Array.isArray(gd.symbolsData)) {
    const table = document.createElement('div');
    table.className = 'list';
    const headers = `
      <table>
      <thead><tr>
        <th>Symbol</th><th>extraValue (byte)</th><th>spawnChance</th>
        <th>InstantReward</th><th>CloverTicket</th><th>Golden</th>
        <th>Repetition</th><th>Battery</th><th>Chain</th>
      </tr></thead>
      <tbody id="symbolsRows"></tbody></table>`;
    table.innerHTML = headers;
    host.appendChild(table);

    const body = table.querySelector('#symbolsRows');
    gd.symbolsData.forEach((s, idx)=>{
      const rid = `sym_${idx}`;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="chip">${s.symbolKindAsString}</span></td>
        <td><input class="small" type="number" id="${rid}_extra" style="width:90px" /></td>
        <td><input class="small" type="number" step="0.01" id="${rid}_spawn" style="width:90px" /></td>
        <td><input class="small" type="number" step="0.01" id="${rid}_m_instant" style="width:90px" /></td>
        <td><input class="small" type="number" step="0.01" id="${rid}_m_ticket" style="width:90px" /></td>
        <td><input class="small" type="number" step="0.01" id="${rid}_m_golden" style="width:90px" /></td>
        <td><input class="small" type="number" step="0.01" id="${rid}_m_rep" style="width:90px" /></td>
        <td><input class="small" type="number" step="0.01" id="${rid}_m_batt" style="width:90px" /></td>
        <td><input class="small" type="number" step="0.01" id="${rid}_m_chain" style="width:90px" /></td>
      `;
      body.appendChild(row);
      setTimeout(()=>{
        document.getElementById(`${rid}_extra`).value = getByte(s,'extraValue_ByteArray',0);
        document.getElementById(`${rid}_spawn`).value = s.spawnChance ?? 0;
        document.getElementById(`${rid}_m_instant`).value = s.modifierChance01_InstantReward ?? 0;
        document.getElementById(`${rid}_m_ticket`).value = s.modifierChance01_CloverTicket ?? 0;
        document.getElementById(`${rid}_m_golden`).value = s.modifierChance01_Golden ?? 0;
        document.getElementById(`${rid}_m_rep`).value = s.modifierChance01_Repetition ?? 0;
        document.getElementById(`${rid}_m_batt`).value = s.modifierChance01_Battery ?? 0;
        document.getElementById(`${rid}_m_chain`).value = s.modifierChance01_Chain ?? 0;
      },0);
    });
    const hint = document.createElement('div');
    hint.className='help-text';
    hint.textContent = 'extraValue is symbol dependent, for example base coin value. Modifier chances are 0..1.';
    host.appendChild(hint);
  }

  // Available symbols section removed

  // Patterns
  if (Array.isArray(gd.patternsData)) {
    const table = document.createElement('div');
    table.className='list';
    table.innerHTML = `
      <table>
        <thead><tr><th>Pattern</th><th>available</th><th>extraValue</th></tr></thead>
        <tbody id="patternsRows"></tbody>
      </table>`;
    pattHost.appendChild(table);
    const body = table.querySelector('#patternsRows');

    const avail = new Set(gd.patternsAvailable_AsString||[]);
    gd.patternsData.forEach((p, idx)=>{
      const id = `pat_${idx}`;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="chip">${p.patternKindAsString}</span></td>
        <td style="width:120px;"><input type="checkbox" id="${id}_avail" ${avail.has(p.patternKindAsString)?'checked':''}/></td>
        <td><input class="small" type="number" id="${id}_extra" style="width:120px"/></td>
      `;
      body.appendChild(row);
      setTimeout(()=>{ document.getElementById(`${id}_extra`).value = p.extraValue ?? 0; },0);
    });
  }
}

/* Store current items editor */
function renderStoreEditable() {
  const host = document.getElementById('storeItemsEditable');
  host.innerHTML = '';
  const gd = gameData?.gameplayData;
  if (!gd) return;
  if (!Array.isArray(gd.storePowerups)) gd.storePowerups = [];
  gd.storePowerups.forEach((item, i)=>{
    const box = document.createElement('div');
    box.className='form-row';
    box.innerHTML = `
      <div class="form-field" style="min-width:300px;">
        <label>Slot ${i+1}</label>
        <input type="text" id="storeItem_${i}" value="${item}" />
        <span class="help-text">Powerup identifier string</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-secondary" onclick="removeStoreItem(${i})">Remove</button>
      </div>
    `;
    host.appendChild(box);
  });
}

/* Powerups table */
function renderPowerupsTable() {
  const host = document.getElementById('powerupsTable');
  host.innerHTML = '';
  const gd = gameData?.gameplayData;
  if (!gd || !Array.isArray(gd.powerupsData)) return;

  const q = (document.getElementById('powerupSearch').value||'').toLowerCase();
  const rows = gd.powerupsData.filter(p => (p.powerupIdentifierAsString||'').toLowerCase().includes(q));

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Identifier</th><th>boughtTimes</th><th>modifier</th>
          <th>charges</th><th>chargesMax</th><th>burnOut</th><th>resellBonus</th><th>charm RNG</th>
        </tr>
      </thead>
      <tbody id="pwr_rows"></tbody>
    </table>`;
  host.appendChild(wrap);

  const body = wrap.querySelector('#pwr_rows');
  rows.forEach((p, idx)=>{
    const id = `pwr_${idx}`;
    const rn = p.charmSpecificRng || {seed:0,stateIndex:0,randomNumber:0};
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="chip">${p.powerupIdentifierAsString}</span></td>
      <td><input class="small" type="number" id="${id}_b" value="${p.boughtTimes??0}" style="width:80px"/></td>
      <td><input class="small" type="number" id="${id}_m" value="${p.modifier??0}" style="width:80px"/></td>
      <td><input class="small" type="number" id="${id}_c" value="${p.buttonChargesCounter??0}" style="width:80px"/></td>
      <td><input class="small" type="number" id="${id}_cm" value="${p.buttonChargesMax??0}" style="width:80px"/></td>
      <td><input class="small" type="number" id="${id}_bo" value="${p.buttonBurnOutCounter??0}" style="width:90px"/></td>
      <td><input class="small" type="number" id="${id}_rs" value="${p.resellBonus??0}" style="width:90px"/></td>
      <td>
        <details>
          <summary class="small">seed: ${rn.seed} idx: ${rn.stateIndex}</summary>
          <div style="display:grid; grid-template-columns:repeat(3, minmax(90px,1fr)); gap:6px; margin-top:6px;">
            <input class="small" type="number" id="${id}_rng_seed" value="${rn.seed??0}" placeholder="seed"/>
            <input class="small" type="number" id="${id}_rng_idx" value="${rn.stateIndex??0}" placeholder="stateIndex"/>
            <input class="small" type="number" id="${id}_rng_rn" value="${rn.randomNumber??0}" placeholder="randomNumber"/>
          </div>
        </details>
      </td>
    `;
    body.appendChild(row);
  });

  const hint = document.createElement('div');
  hint.className='help-text';
  hint.textContent='boughtTimes greater than 0 usually means you own it. Charges are for active or instant items.';
  host.appendChild(hint);
}

/* Unlock steps */
function renderUnlocks() {
  const host = document.getElementById('unlocksList');
  host.innerHTML = '';
  const q = (document.getElementById('unlockFilter').value||'').toLowerCase();

  const keys = Object.keys(gameData||{}).filter(k=>k.startsWith('unlockSteps_'));
  const rows = keys.filter(k => k.toLowerCase().includes(q)).map(k => [k, gameData[k]]);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Key</th><th>Value</th></tr></thead>
      <tbody id="unlock_rows"></tbody>
    </table>`;
  host.appendChild(wrap);

  const body = wrap.querySelector('#unlock_rows');
  rows.forEach(([k,v],i)=>{
    const id = `unlock_${i}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="chip">${k}</span></td>
      <td><input type="number" id="${id}_val" value="${v??0}" style="width:120px"/></td>
    `;
    body.appendChild(tr);
  });
}

/* Run Modifiers table */
function renderRunMods() {
  const host = document.getElementById('runModsTable');
  host.innerHTML = '';
  const list = gameData?._runModSavingList || [];
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Identifier</th><th>owned</th><th>unlockedTimes</th><th>played</th><th>won</th><th>foilLevel</th></tr></thead>
      <tbody id="rm_rows"></tbody>
    </table>`;
  host.appendChild(wrap);
  const body = wrap.querySelector('#rm_rows');
  list.forEach((m,i)=>{
    const id = `rm_${i}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="chip">${m.runModifierIdentifierAsString}</span></td>
      <td><input class="small" type="number" id="${id}_owned" value="${m.ownedCount??0}" style="width:90px"/></td>
      <td><input class="small" type="number" id="${id}_unlock" value="${m.unlockedTimes??0}" style="width:120px"/></td>
      <td><input class="small" type="number" id="${id}_played" value="${m.playedTimes??0}" style="width:90px"/></td>
      <td><input class="small" type="number" id="${id}_won" value="${m.wonTimes??0}" style="width:90px"/></td>
      <td><input class="small" type="number" id="${id}_foil" value="${m.foilLevel??0}" style="width:90px"/></td>
    `;
    body.appendChild(tr);
  });
}

/* Explorer (recursive, no hidden keys, single view) */
function renderExplorer() {
  const host = document.getElementById('explorerHost');
  host.innerHTML = '';
  if (!gameData) return;

  const tableWrap = document.createElement('div');
  tableWrap.className = 'list';
  tableWrap.innerHTML = `
    <table>
      <thead><tr><th>Path</th><th>Type</th><th>Value</th></tr></thead>
      <tbody id="expl_rows"></tbody>
    </table>`;
  host.appendChild(tableWrap);
  const body = tableWrap.querySelector('#expl_rows');

  const filter = (document.getElementById('explorerSearch').value || '').toLowerCase();

  const rows = [];
  function walk(node, path) {
    const t = Array.isArray(node) ? 'array' : (node===null ? 'null' : typeof node);
    if (t === 'object' || t === 'array') {
      if (t === 'array') {
        node.forEach((v, i) => walk(v, `${path}[${i}]`));
      } else {
        Object.keys(node).forEach(k => walk(node[k], path ? `${path}.${k}` : k));
      }
    } else {
      rows.push({ path, type: t, value: node });
    }
  }
  walk(gameData, '');

  rows
    .filter(r => r.path.toLowerCase().includes(filter))
    .forEach((r, i) => {
      const id = `expl_${i}`;
      let editor = '';
      if (r.type === 'number') editor = `<input type="number" id="${id}_num" value="${r.value}" />`;
      else if (r.type === 'boolean') editor = `<select id="${id}_bool"><option ${r.value?'selected':''}>true</option><option ${!r.value?'selected':''}>false</option></select>`;
      else if (r.type === 'string') editor = `<input type="text" id="${id}_str" value="${String(r.value).replace(/"/g,'&quot;')}" />`;
      else editor = `<textarea id="${id}_json" class="small">${JSON.stringify(r.value,null,2)}</textarea>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="chip">${r.path || '(root)'}</span></td>
        <td>${r.type}</td>
        <td>${editor}</td>
      `;
      tr.dataset.path = r.path;
      body.appendChild(tr);
    });

  // Apply button for explorer edits
  const applyBar = document.createElement('div');
  applyBar.style.padding = '10px';
  applyBar.innerHTML = `<button class="btn btn-secondary" onclick="applyExplorerEdits()">Apply Explorer Edits</button>`;
  host.appendChild(applyBar);
}

/* Apply edits from Explorer into gameData */
function applyExplorerEdits() {
  if (!gameData) return;
  const rows = Array.from(document.querySelectorAll('#explorerHost tbody tr'));
  rows.forEach(tr => {
    const path = tr.dataset.path;
    if (!path) return;
    const input = tr.querySelector('input, select, textarea');
    if (!input) return;

    // Resolve path
    const parts = [];
    path.split('.').forEach(seg => {
      const re = /([^\[]+)|\[(\d+)\]/g;
      let m;
      while ((m = re.exec(seg)) !== null) {
        if (m[1]) parts.push(m[1]);
        if (m[2]) parts.push(Number(m[2]));
      }
    });

    // Get parent and key
    let parent = gameData, key = null;
    for (let i=0;i<parts.length;i++) {
      if (i === parts.length - 1) { key = parts[i]; break; }
      parent = parent[parts[i]];
    }
    if (parent == null || key == null) return;

    // Coerce types
    if (input.id.endsWith('_num')) parent[key] = +input.value;
    else if (input.id.endsWith('_bool')) parent[key] = (input.value === 'true');
    else if (input.id.endsWith('_str')) parent[key] = input.value;
    else if (input.id.endsWith('_json')) {
      try { parent[key] = JSON.parse(input.value); } catch(_) {}
    }
  });

  // Sync to UI and textarea
  populateFields();
  document.getElementById('jsonEditor').value = JSON.stringify(gameData, null, 2);
  showStatus('Applied Explorer edits', 'success');
}

/* ===================== LOAD / SAVE ===================== */
function populateFields() {
  if (!gameData || !gameData.gameplayData) { showStatus('No game data loaded','error'); return; }
  const gd = gameData.gameplayData;

  // Economy
  document.getElementById('coins').value = getByte(gd,'coins_ByteArray',0);
  document.getElementById('depositedCoins').value = getByte(gd,'depositedCoins_ByteArray',0);
  document.getElementById('interestRate').value = gd.interestRate ?? 0;
  document.getElementById('cloverTickets').value = gd.cloverTickets ?? 0;
  document.getElementById('cloverTickets_BonusFor_LittleBet').value = gd.cloverTickets_BonusFor_LittleBet ?? 0;
  document.getElementById('cloverTickets_BonusFor_BigBet').value = gd.cloverTickets_BonusFor_BigBet ?? 0;
  document.getElementById('cloverTickets_BonusFor_RoundsLeft').value = gd.cloverTickets_BonusFor_RoundsLeft ?? 0;
  document.getElementById('interestEarned').value = getByte(gd,'interestEarned_ByteArray',0);

  document.getElementById('roundOfDeadline').value = gd.roundOfDeadline ?? 1;
  document.getElementById('debtIndex').value = getByte(gd,'debtIndex_ByteArray',0);
  document.getElementById('debtOutOfRangeMult').value = getByte(gd,'debtOutOfRangeMult_ByteArray',0);
  document.getElementById('roundsReallyPlayed').value = gd.roundsReallyPlayed ?? 0;
  document.getElementById('roundDeadlineTrail').value = gd.roundDeadlineTrail ?? 0;
  document.getElementById('roundDeadlineTrail_AtDeadlineBegin').value = gd.roundDeadlineTrail_AtDeadlineBegin ?? 0;
  document.getElementById('atmRewardShown').value = (gd.atmDeadline_RewardPickupMemo_MessageShown? 'true':'false');
  document.getElementById('victoryDeathConditionMet').value = (gd.victoryDeathConditionMet? 'true':'false');

  // Spins
  document.getElementById('spinsLeft').value = gd.spinsLeft ?? 0;
  document.getElementById('maxSpins').value = gd.maxSpins ?? 7;
  document.getElementById('extraSpins').value = gd.extraSpins ?? 0;
  document.getElementById('spinsDoneInARun').value = gd.spinsDoneInARun ?? 0;
  document.getElementById('powerupLuck').value = gd.powerupLuck ?? 1;
  document.getElementById('activationLuck').value = gd.activationLuck ?? 1;
  document.getElementById('storeLuck').value = gd.storeLuck ?? 1;
  document.getElementById('extraLuckEntries').value = JSON.stringify(gd.extraLuckEntries || [], null, 2);
  document.getElementById('_smallBetsPickedCounter').value = gd._smallBetsPickedCounter ?? 0;
  document.getElementById('_bigBetsPickedCounter').value = gd._bigBetsPickedCounter ?? 0;
  document.getElementById('spinsWithoutReward').value = gd.spinsWithoutReward ?? 0;
  document.getElementById('spinsWithout5PlusPatterns').value = gd.spinsWithout5PlusPatterns ?? 0;
  document.getElementById('_jackpotsScoredCounter').value = gd._jackpotsScoredCounter ?? 0;
  document.getElementById('_spinsWithAtleast1Jackpot').value = gd._spinsWithAtleast1Jackpot ?? 0;
  document.getElementById('lastBetIsSmall').value = gd.lastBetIsSmall? 'true':'false';

  // RNG
  renderRngEditors();

  // Phone & 666
  document.getElementById('_phoneAbilitiesNumber').value = gd._phoneAbilitiesNumber ?? 3;
  document.getElementById('_phoneRerollCost').value = gd._phoneRerollCost ?? 1;
  document.getElementById('_phoneRerollCostIncrease').value = gd._phoneRerollCostIncrease ?? 1;
  document.getElementById('_phonePickMultiplier').value = gd._phonePickMultiplier ?? 1;
  document.getElementById('_phone_abilityAlreadyPickedUp').value = gd._phone_abilityAlreadyPickedUp? 'true':'false';
  document.getElementById('_phone_pickedUpOnceLastDeadline').value = gd._phone_pickedUpOnceLastDeadline? 'true':'false';
  document.getElementById('_phoneAlreadyTransformed').value = gd._phoneAlreadyTransformed? 'true':'false';
  document.getElementById('_phone_lastAbilityCategory').value = gd._phone_lastAbilityCategory ?? -1;
  document.getElementById('_phone_AbilitiesToPick_String').value = gd._phone_AbilitiesToPick_String || '';
  document.getElementById('_phone_PickupWithAbilities_OverallCounter').value = gd._phone_PickupWithAbilities_OverallCounter ?? 0;
  document.getElementById('_phone_bookSpecialCall').value = gd._phone_bookSpecialCall? 'true':'false';
  document.getElementById('_phoneRerollsPerformed').value = gd._phoneRerollsPerformed ?? 0;

  document.getElementById('_666Chance').value = gd._666Chance ?? 0;
  document.getElementById('_666ChanceMaxAbsolute').value = gd._666ChanceMaxAbsolute ?? 0.3;
  document.getElementById('_666BookedSpin').value = gd._666BookedSpin ?? -1;
  document.getElementById('_666SuppressedSpinsLeft').value = gd._666SuppressedSpinsLeft ?? 0;
  document.getElementById('_lastRoundHadA666').value = gd._lastRoundHadA666? 'true':'false';
  document.getElementById('nineNineNine_TotalRewardEarned').value = getByte(gd,'nineNineNine_TotalRewardEarned_ByteArray',0);
  document.getElementById('sixSixSixSeen').value = gd.sixSixSixSeen ?? 0;
  document.getElementById('persistentStat_666SeenTimes').value = gameData.persistentStat_666SeenTimes ?? 0;

  // Store
  document.getElementById('temporaryDiscount').value = gd.temporaryDiscount ?? 0;
  document.getElementById('storeFreeRestocks').value = gd._storeFreeRestocks ?? 0;
  document.getElementById('storeLastRandomIndex').value = gd.storeLastRandomIndex ?? 0;
  document.getElementById('storeChainIndex_Array').value = gd.storeChainIndex_Array ?? 0;
  document.getElementById('storeChainIndex_PowerupIdentifier').value = gd.storeChainIndex_PowerupIdentifier ?? 0;
  document.getElementById('_storeRestockExtraCost').value = getByte(gd,'_storeRestockExtraCost_ByteArray',0);
  document.getElementById('temporaryDiscountPerSlot').value = (gd.temporaryDiscountPerSlot||[0,0,0,0]).join(',');
  renderStoreEditable();

  // Symbols and Patterns
  document.getElementById('allSymbolsMultiplier').value = getByte(gd,'allSymbolsMultiplier_ByteArray',1);
  document.getElementById('allPatternsMultiplier').value = getByte(gd,'allPatternsMultiplier_ByteArray',1);
  renderSymbolsEditor();

  // Powerups — equipped CSVs
  const eq = (gd.equippedPowerups||[]).slice();
  document.getElementById('equippedPowerupsCsv').value = toCsv(eq);
  const eqS = (gd.equippedPowerups_Skeleton||[]).slice();
  document.getElementById('equippedPowerupsSkeletonCsv').value = toCsv(eqS);
  const dr = (gd.drawerPowerups||[]).slice();
  document.getElementById('drawerPowerupsCsv').value = toCsv(dr);
  document.getElementById('maxEquippablePowerups').value = gd.maxEquippablePowerups ?? 7;

  document.querySelectorAll('.powerup-item input[type="checkbox"]').forEach(cb => cb.checked = false);
  eq.forEach(p=>{ if(p && p!=='undefined'){ const c=document.getElementById('powerup_'+p); if(c) c.checked = true; } });

  renderPowerupsTable();

  // Progression
  document.getElementById('runsDone').value = gameData.runsDone ?? 0;
  document.getElementById('deathsDone').value = gameData.deathsDone ?? 0;
  document.getElementById('stats_DeadlinesCompleted').value = gd.stats_DeadlinesCompleted ?? 0;
  document.getElementById('stats_PlayTime_Seconds').value = gd.stats_PlayTime_Seconds ?? 0;
  document.getElementById('stats_CoinsEarned').value = getByte(gd,'stats_CoinsEarned_ByteArray',0);
  document.getElementById('stats_TicketsEarned').value = gd.stats_TicketsEarned ?? 0;
  document.getElementById('modSymbolTriggersCounter_Sevens').value = gameData.modSymbolTriggersCounter_Sevens ?? 0;
  document.getElementById('creditsSeenOnce').value = gameData.creditsSeenOnce? 'true':'false';

  // Drawers and global toggles
  for (let i=0;i<4;i++) document.getElementById('drawersUnlocked'+i).checked = !!(gameData.drawersUnlocked?.[i]);
  document.getElementById('tutorialQuestionEnabled').value = gameData.tutorialQuestionEnabled? 'true':'false';
  ['doorOpenedCounter','badEndingCounter','goodEndingCounter'].forEach(id=>{
    document.getElementById(id).value = gameData[id] ?? 0;
  });
  document.getElementById('_unlockedPowerupsString').value = gameData._unlockedPowerupsString || '';
  document.getElementById('hasEverUnlockedAPowerup').value = gameData.hasEverUnlockedAPowerup? 'true':'false';
  document.getElementById('_allCardsUnlocked').value = gameData._allCardsUnlocked? 'true':'false';
  document.getElementById('_allCardsHolographic').value = gameData._allCardsHolographic? 'true':'false';

  renderUnlocks();
  renderRunMods();
  renderExplorer();

  document.getElementById('jsonEditor').value = JSON.stringify(gameData, null, 2);

  showStatus('Data loaded', 'success');
}

/* collect UI -> gameData */
function saveToJSON() {
  if (!gameData) return;
  const gd = gameData.gameplayData;

  // Economy
  setByte(gd,'coins_ByteArray', +document.getElementById('coins').value || 0);
  setByte(gd,'depositedCoins_ByteArray', +document.getElementById('depositedCoins').value || 0);
  gd.interestRate = +document.getElementById('interestRate').value || 0;
  gd.cloverTickets = +document.getElementById('cloverTickets').value || 0;
  gd.cloverTickets_BonusFor_LittleBet = +document.getElementById('cloverTickets_BonusFor_LittleBet').value || 0;
  gd.cloverTickets_BonusFor_BigBet = +document.getElementById('cloverTickets_BonusFor_BigBet').value || 0;
  gd.cloverTickets_BonusFor_RoundsLeft = +document.getElementById('cloverTickets_BonusFor_RoundsLeft').value || 0;
  setByte(gd,'interestEarned_ByteArray', +document.getElementById('interestEarned').value || 0);

  gd.roundOfDeadline = +document.getElementById('roundOfDeadline').value || 1;
  setByte(gd,'debtIndex_ByteArray', +document.getElementById('debtIndex').value || 0);
  setByte(gd,'debtOutOfRangeMult_ByteArray', +document.getElementById('debtOutOfRangeMult').value || 0);
  gd.roundsReallyPlayed = +document.getElementById('roundsReallyPlayed').value || 0;
  gd.roundDeadlineTrail = +document.getElementById('roundDeadlineTrail').value || 0;
  gd.roundDeadlineTrail_AtDeadlineBegin = +document.getElementById('roundDeadlineTrail_AtDeadlineBegin').value || 0;
  gd.atmDeadline_RewardPickupMemo_MessageShown = document.getElementById('atmRewardShown').value === 'true';
  gd.victoryDeathConditionMet = document.getElementById('victoryDeathConditionMet').value === 'true';

  // Spins
  gd.spinsLeft = +document.getElementById('spinsLeft').value || 0;
  gd.maxSpins = +document.getElementById('maxSpins').value || 7;
  gd.extraSpins = +document.getElementById('extraSpins').value || 0;
  gd.spinsDoneInARun = +document.getElementById('spinsDoneInARun').value || 0;
  gd.powerupLuck = +document.getElementById('powerupLuck').value || 1;
  gd.activationLuck = +document.getElementById('activationLuck').value || 1;
  gd.storeLuck = +document.getElementById('storeLuck').value || 1;
  try { gd.extraLuckEntries = JSON.parse(document.getElementById('extraLuckEntries').value || '[]'); } catch(e){}

  gd._smallBetsPickedCounter = +document.getElementById('_smallBetsPickedCounter').value || 0;
  gd._bigBetsPickedCounter = +document.getElementById('_bigBetsPickedCounter').value || 0;
  gd.spinsWithoutReward = +document.getElementById('spinsWithoutReward').value || 0;
  gd.spinsWithout5PlusPatterns = +document.getElementById('spinsWithout5PlusPatterns').value || 0;
  gd._jackpotsScoredCounter = +document.getElementById('_jackpotsScoredCounter').value || 0;
  gd._spinsWithAtleast1Jackpot = +document.getElementById('_spinsWithAtleast1Jackpot').value || 0;
  gd.lastBetIsSmall = document.getElementById('lastBetIsSmall').value === 'true';

  // RNG
  RNG_KEYS.forEach(k=>{
    gd[k] = gd[k] || {seed:0,stateIndex:0,randomNumber:0};
    gd[k].seed = +document.getElementById(`${k}_seed`).value || 0;
    gd[k].stateIndex = +document.getElementById(`${k}_stateIndex`).value || 0;
    gd[k].randomNumber = +document.getElementById(`${k}_randomNumber`).value || 0;
  });

  // Phone & 666
  gd._phoneAbilitiesNumber = +document.getElementById('_phoneAbilitiesNumber').value || 3;
  gd._phoneRerollCost = +document.getElementById('_phoneRerollCost').value || 1;
  gd._phoneRerollCostIncrease = +document.getElementById('_phoneRerollCostIncrease').value || 1;
  gd._phonePickMultiplier = +document.getElementById('_phonePickMultiplier').value || 1;
  gd._phone_abilityAlreadyPickedUp = document.getElementById('_phone_abilityAlreadyPickedUp').value === 'true';
  gd._phone_pickedUpOnceLastDeadline = document.getElementById('_phone_pickedUpOnceLastDeadline').value === 'true';
  gd._phoneAlreadyTransformed = document.getElementById('_phoneAlreadyTransformed').value === 'true';
  gd._phone_lastAbilityCategory = +document.getElementById('_phone_lastAbilityCategory').value || -1;
  gd._phone_AbilitiesToPick_String = document.getElementById('_phone_AbilitiesToPick_String').value || '';
  gd._phone_PickupWithAbilities_OverallCounter = +document.getElementById('_phone_PickupWithAbilities_OverallCounter').value || 0;
  gd._phone_bookSpecialCall = document.getElementById('_phone_bookSpecialCall').value === 'true';
  gd._phoneRerollsPerformed = +document.getElementById('_phoneRerollsPerformed').value || 0;

  gd._666Chance = +document.getElementById('_666Chance').value || 0;
  gd._666ChanceMaxAbsolute = +document.getElementById('_666ChanceMaxAbsolute').value || 0;
  gd._666BookedSpin = +document.getElementById('_666BookedSpin').value || -1;
  gd._666SuppressedSpinsLeft = +document.getElementById('_666SuppressedSpinsLeft').value || 0;
  gd._lastRoundHadA666 = document.getElementById('_lastRoundHadA666').value === 'true';
  setByte(gd,'nineNineNine_TotalRewardEarned_ByteArray', +document.getElementById('nineNineNine_TotalRewardEarned').value || 0);
  gd.sixSixSixSeen = +document.getElementById('sixSixSixSeen').value || 0;
  gameData.persistentStat_666SeenTimes = +document.getElementById('persistentStat_666SeenTimes').value || 0;

  // Store
  gd.temporaryDiscount = +document.getElementById('temporaryDiscount').value || 0;
  gd._storeFreeRestocks = +document.getElementById('storeFreeRestocks').value || 0;
  gd.storeLastRandomIndex = +document.getElementById('storeLastRandomIndex').value || 0;
  gd.storeChainIndex_Array = +document.getElementById('storeChainIndex_Array').value || 0;
  gd.storeChainIndex_PowerupIdentifier = +document.getElementById('storeChainIndex_PowerupIdentifier').value || 0;
  setByte(gd,'_storeRestockExtraCost_ByteArray', +document.getElementById('_storeRestockExtraCost').value || 0);
  gd.temporaryDiscountPerSlot = fromCsv(document.getElementById('temporaryDiscountPerSlot').value).map(x=>+x||0);

  // Store items from UI
  const newStore = [];
  const inputs = document.querySelectorAll('[id^="storeItem_"]');
  inputs.forEach(inp => newStore.push(inp.value||'undefined'));
  gd.storePowerups = newStore;

  // Symbols
  setByte(gd,'allSymbolsMultiplier_ByteArray', +document.getElementById('allSymbolsMultiplier').value || 1);
  setByte(gd,'allPatternsMultiplier_ByteArray', +document.getElementById('allPatternsMultiplier').value || 1);

  if (Array.isArray(gd.symbolsData)) {
    gd.symbolsData.forEach((s, idx)=>{
      const rid = `sym_${idx}`;
      setByte(s,'extraValue_ByteArray', +document.getElementById(`${rid}_extra`).value || 0);
      s.spawnChance = +document.getElementById(`${rid}_spawn`).value || 0;
      s.modifierChance01_InstantReward = +document.getElementById(`${rid}_m_instant`).value || 0;
      s.modifierChance01_CloverTicket = +document.getElementById(`${rid}_m_ticket`).value || 0;
      s.modifierChance01_Golden = +document.getElementById(`${rid}_m_golden`).value || 0;
      s.modifierChance01_Repetition = +document.getElementById(`${rid}_m_rep`).value || 0;
      s.modifierChance01_Battery = +document.getElementById(`${rid}_m_batt`).value || 0;
      s.modifierChance01_Chain = +document.getElementById(`${rid}_m_chain`).value || 0;
    });

    // available toggles removed
  }

  // Patterns edits
  if (Array.isArray(gd.patternsData)) {
    const newAvail = [];
    gd.patternsData.forEach((p, idx)=>{
      const id = `pat_${idx}`;
      p.extraValue = +document.getElementById(`${id}_extra`).value || 0;
      const a = document.getElementById(`${id}_avail`).checked;
      if (a) newAvail.push(p.patternKindAsString);
    });
    gd.patternsAvailable_AsString = newAvail;
  }

  // Equipped CSVs
  gd.equippedPowerups = fromCsv(document.getElementById('equippedPowerupsCsv').value);
  gd.equippedPowerups_Skeleton = fromCsv(document.getElementById('equippedPowerupsSkeletonCsv').value);
  gd.drawerPowerups = fromCsv(document.getElementById('drawerPowerupsCsv').value);
  gd.maxEquippablePowerups = +document.getElementById('maxEquippablePowerups').value || 7;

  // Quick checkboxes to first empty slots
  const quickSelected = [];
  document.querySelectorAll('.powerup-item input:checked').forEach(cb => quickSelected.push(cb.value));
  let ptr=0;
  for (let i=0;i<gd.equippedPowerups.length;i++) {
    if (!gd.equippedPowerups[i] || gd.equippedPowerups[i]==='undefined') {
      if (ptr<quickSelected.length) gd.equippedPowerups[i] = quickSelected[ptr++];
    }
  }

  // Powerups detail table
  const q = (document.getElementById('powerupSearch').value||'').toLowerCase();
  const rows = (gd.powerupsData||[]).filter(p => (p.powerupIdentifierAsString||'').toLowerCase().includes(q));
  rows.forEach((p, idx)=>{
    const id = `pwr_${idx}`;
    p.boughtTimes = +document.getElementById(`${id}_b`).value || 0;
    p.modifier = +document.getElementById(`${id}_m`).value || 0;
    p.buttonChargesCounter = +document.getElementById(`${id}_c`).value || 0;
    p.buttonChargesMax = +document.getElementById(`${id}_cm`).value || 0;
    p.buttonBurnOutCounter = +document.getElementById(`${id}_bo`).value || 0;
    p.resellBonus = +document.getElementById(`${id}_rs`).value || 0;
    p.charmSpecificRng = p.charmSpecificRng||{};
    p.charmSpecificRng.seed = +document.getElementById(`${id}_rng_seed`).value || 0;
    p.charmSpecificRng.stateIndex = +document.getElementById(`${id}_rng_idx`).value || 0;
    p.charmSpecificRng.randomNumber = +document.getElementById(`${id}_rng_rn`).value || 0;
  });

  // Progression
  gameData.runsDone = +document.getElementById('runsDone').value || 0;
  gameData.deathsDone = +document.getElementById('deathsDone').value || 0;
  gd.stats_DeadlinesCompleted = +document.getElementById('stats_DeadlinesCompleted').value || 0;
  gd.stats_PlayTime_Seconds = +document.getElementById('stats_PlayTime_Seconds').value || 0;
  setByte(gd,'stats_CoinsEarned_ByteArray', +document.getElementById('stats_CoinsEarned').value || 0);
  gd.stats_TicketsEarned = +document.getElementById('stats_TicketsEarned').value || 0;
  gameData.modSymbolTriggersCounter_Sevens = +document.getElementById('modSymbolTriggersCounter_Sevens').value || 0;
  gameData.creditsSeenOnce = document.getElementById('creditsSeenOnce').value === 'true';

  for (let i=0;i<4;i++) gameData.drawersUnlocked[i] = document.getElementById('drawersUnlocked'+i).checked;
  gameData.tutorialQuestionEnabled = document.getElementById('tutorialQuestionEnabled').value === 'true';
  ['doorOpenedCounter','badEndingCounter','goodEndingCounter'].forEach(id=>{
    gameData[id] = +document.getElementById(id).value || 0;
  });
  gameData._unlockedPowerupsString = document.getElementById('_unlockedPowerupsString').value || '';
  gameData.hasEverUnlockedAPowerup = document.getElementById('hasEverUnlockedAPowerup').value === 'true';
  gameData._allCardsUnlocked = document.getElementById('_allCardsUnlocked').value === 'true';
  gameData._allCardsHolographic = document.getElementById('_allCardsHolographic').value === 'true';

  // Unlock steps collect
  document.querySelectorAll('#unlocksList [id^="unlock_"][id$="_val"]').forEach(inp=>{
    const keyCell = inp.parentElement.previousElementSibling.innerText.trim();
    if (keyCell) gameData[keyCell] = +inp.value || 0;
  });

  // RunModifiers collect
  const list = gameData._runModSavingList || [];
  list.forEach((m,i)=>{
    const id = `rm_${i}`;
    m.ownedCount = +document.getElementById(`${id}_owned`).value || 0;
    m.unlockedTimes = +document.getElementById(`${id}_unlock`).value || 0;
    m.playedTimes = +document.getElementById(`${id}_played`).value || 0;
    m.wonTimes = +document.getElementById(`${id}_won`).value || 0;
    m.foilLevel = +document.getElementById(`${id}_foil`).value || 0;
  });

  document.getElementById('jsonEditor').value = JSON.stringify(gameData, null, 2);
  showStatus('UI to JSON applied', 'success');
}

/* File handling: accept encrypted only. If plain JSON is detected, refuse. */
function handleFile(file) {
  currentFileName = file.name;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const bytes = new Uint8Array(e.target.result);

      // Try to detect plain JSON first
      let looksLikeText = false;
      try {
        const txt = new TextDecoder('utf-8',{fatal:false}).decode(bytes.slice(0, 512));
        looksLikeText = txt.trim().startsWith('{') || txt.trim().startsWith('[');
      } catch(_) { looksLikeText = false; }

      if (looksLikeText) {
        // Refuse decrypted files for KISS
        showStatus('This appears to be a decrypted JSON. Please upload the encrypted GameDataFull.json.', 'error');
        return;
      }

      // Treat as encrypted latin1, decrypt, parse
      const encryptedStr = arrayBufferToLatin1(e.target.result);
      const decryptedStr = encryptCustom(encryptedStr, getPassword());
      gameData = JSON.parse(decryptedStr);

      document.getElementById('jsonEditor').value = JSON.stringify(gameData, null, 2);
      document.getElementById('editorSection').classList.add('active');
      document.getElementById('initialSections').classList.add('hidden');
      hasUnsavedChanges = false;

      populateFields();
      showStatus('Encrypted save loaded successfully', 'success');
      document.getElementById('editorSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showStatus('Failed to open file. Make sure it is the encrypted GameDataFull.json.', 'error');
      console.error('Open error:', error);
    }
  };
  reader.readAsArrayBuffer(file);
}

function formatJSON() {
  try {
    const obj = JSON.parse(document.getElementById('jsonEditor').value);
    document.getElementById('jsonEditor').value = JSON.stringify(obj, null, 2);
    showStatus('JSON formatted','success');
  } catch(e){ showStatus('Invalid JSON syntax','error'); }
}

function applyFromTextarea() {
  try {
    gameData = JSON.parse(document.getElementById('jsonEditor').value);
    populateFields();
    showStatus('Applied JSON to UI','success');
  } catch(e) { showStatus('Invalid JSON','error'); }
}

function downloadEncrypted() {
  try {
    if (gameData) saveToJSON();
    const jsonData = JSON.parse(document.getElementById('jsonEditor').value);
    const jsonStr = JSON.stringify(jsonData, null, 0);
    const encryptedStr = encryptCustom(jsonStr, getPassword());
    const encryptedBuffer = latin1ToArrayBuffer(encryptedStr);

    const blob = new Blob([encryptedBuffer], { type:'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=currentFileName.replace(/_decrypted\.json$/,'');
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    hasUnsavedChanges = false;
    showStatus('Encrypted save downloaded', 'success');
  } catch (error) {
    showStatus('Failed to encrypt. Check your JSON syntax.', 'error');
    console.error('Encryption error:', error);
  }
}
function downloadUnencrypted() {
  try {
    const jsonData = JSON.parse(document.getElementById('jsonEditor').value);
    const jsonStr = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonStr], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=currentFileName.replace(/(\.json)?$/,'_decrypted.json');
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showStatus('Decrypted JSON downloaded', 'success');
  } catch(error){ showStatus('Failed to download', 'error'); }
}

/* Store ops */
function addStoreItem(){ 
  const gd = gameData?.gameplayData; if(!gd) return;
  gd.storePowerups = gd.storePowerups || [];
  gd.storePowerups.push('undefined');
  renderStoreEditable();
}
function removeStoreItem(i){
  const gd = gameData?.gameplayData; if(!gd) return;
  gd.storePowerups.splice(i,1);
  renderStoreEditable();
}
function trimStoreItems(){
  const gd = gameData?.gameplayData; if(!gd) return;
  gd.storePowerups = (gd.storePowerups||[]).slice(0,4);
  renderStoreEditable();
}

/* Events */
document.getElementById('fileInput').addEventListener('change', e=>{
  if (e.target.files.length>0) handleFile(e.target.files[0]);
});
const uploadSection = document.getElementById('uploadSection');
uploadSection.addEventListener('dragover', e=>{ e.preventDefault(); e.stopPropagation(); uploadSection.classList.add('dragover'); });
uploadSection.addEventListener('dragleave', e=>{ e.preventDefault(); e.stopPropagation(); uploadSection.classList.remove('dragover'); });
uploadSection.addEventListener('drop', e=>{
  e.preventDefault(); e.stopPropagation(); uploadSection.classList.remove('dragover');
  if (e.dataTransfer.files.length>0) handleFile(e.dataTransfer.files[0]);
});

/* Init */
populatePowerupGrid();
