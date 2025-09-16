// Section: Bibliotek
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

// Section: Konfiguration
const SUPABASE_URL = "https://updpywjfxeahtjpelbku.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZHB5d2pmeGVhaHRqcGVsYmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjQzOTcsImV4cCI6MjA3MjUwMDM5N30.i1ztG8dkcHFLq8WEn_uVrgCBk0_Wf5gZb_OQQuaSGgo";

const SB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Section: Tillstånd
let currentUser = null;
let currentProject = null; // {id, name}
let projects = []; // [{id,name}]
let bets = [];     // alla bets för valt projekt
let editingBetId = null;

// Section: UI-hjälpare
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtMoney = v => (Math.round(v * 100)/100).toFixed(2);
const svMonth = (y,m) => new Date(y, m-1, 1).toLocaleDateString("sv-SE",{month:"long",year:"numeric"});

function setTab(name){
  $$(".tab").forEach(t => {
    const active = t.dataset.tab === name;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  });
  const reg = $("#tab-reg");
  const summary = $("#tab-summary");
  const list = $("#tab-list");
  if(reg){ reg.classList.toggle("hide", name!=="reg"); reg.setAttribute("aria-hidden", name!=="reg"); }
  if(summary){ summary.classList.toggle("hide", name!=="summary"); summary.setAttribute("aria-hidden", name!=="summary"); }
  if(list){ list.classList.toggle("hide", name!=="list"); list.setAttribute("aria-hidden", name!=="list"); }
}

$$(".tab").forEach(t => t.addEventListener("click",()=>setTab(t.dataset.tab)));

function closeActionMenus(){
  document.querySelectorAll(".action-dropdown.open").forEach(el => {
    el.classList.remove("open");
    const toggle = el.querySelector(".dropdown-toggle");
    if(toggle){
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  document
    .querySelectorAll('.dropdown-toggle[aria-expanded="true"]')
    .forEach(btn => btn.setAttribute("aria-expanded", "false"));
}

function resetBetForm(){
  const today = new Date();
  today.setHours(0,0,0,0);
  const dateInput = $("#iDate");
  if(dateInput) dateInput.valueAsDate = today;
  const matchInput = $("#iMatch");
  if(matchInput) matchInput.value = "";
  const marketInput = $("#iMarket");
  if(marketInput) marketInput.value = "";
  const oddsInput = $("#iOdds");
  if(oddsInput) oddsInput.value = "";
  const stakeInput = $("#iStake");
  if(stakeInput) stakeInput.value = "1";
  const bookInput = $("#iBook");
  if(bookInput) bookInput.value = "";
  const resultSelect = $("#iResult");
  if(resultSelect) resultSelect.value = "Pending";
  editingBetId = null;
  const addBtn = $("#addBetBtn");
  if(addBtn) addBtn.textContent = "Lägg till spel";
  const cancelBtn = $("#cancelEditBtn");
  if(cancelBtn) cancelBtn.classList.add("hide");
}

function startEdit(bet){
  editingBetId = bet.id;
  const dateInput = $("#iDate");
  if(dateInput) dateInput.value = bet.matchday ? bet.matchday.slice(0,10) : "";
  const matchInput = $("#iMatch");
  if(matchInput) matchInput.value = bet.match || "";
  const marketInput = $("#iMarket");
  if(marketInput) marketInput.value = bet.market || "";
  const oddsInput = $("#iOdds");
  if(oddsInput){
    const oddsNum = parseFloat(bet.odds);
    oddsInput.value = Number.isFinite(oddsNum) ? oddsNum : "";
  }
  const stakeInput = $("#iStake");
  if(stakeInput){
    const stakeNum = parseFloat(bet.stake);
    stakeInput.value = Number.isFinite(stakeNum) ? stakeNum : "1";
  }
  const bookInput = $("#iBook");
  if(bookInput) bookInput.value = bet.book || "";
  const resultSelect = $("#iResult");
  if(resultSelect) resultSelect.value = bet.result || "Pending";
  const addBtn = $("#addBetBtn");
  if(addBtn) addBtn.textContent = "Spara spel";
  const cancelBtn = $("#cancelEditBtn");
  if(cancelBtn) cancelBtn.classList.remove("hide");
  setTab("reg");
  closeActionMenus();
}

document.addEventListener("click", closeActionMenus);
document.addEventListener("keydown", ev => {
  if(ev.key === "Escape"){
    closeActionMenus();
  }
});

// Section: Auth
async function ensureProfileRow(){
  if(!currentUser) return;
  try{
    const payload = { id: currentUser.id };
    if(currentUser.email) payload.email = currentUser.email;
    const { error } = await SB.from("users").upsert(payload, { onConflict: "id" });
    if(error) console.error("Kunde inte skapa/uppdatera användarrad", error);
  }catch(err){
    console.error("ensureProfileRow fel", err);
  }
}

async function ensureAuth(){
  const { data: { session } } = await SB.auth.getSession();
  if(!session){
    location.href = "/login.html";
    throw new Error("NOT_AUTHENTICATED");
  }
  currentUser = session.user;
  $("#userEmail").textContent = currentUser.email || "Ingen e-post";
  await ensureProfileRow();
}

$("#logoutBtn").onclick = async () => { await SB.auth.signOut(); location.href="/"; };

// Section: Stripe-knappar
async function callStripeCheckout(){
  try{
    const { data: { session } } = await SB.auth.getSession();
    const u = session?.user;
    if(!u?.id){
      alert("Sessionen är ogiltig. Logga in igen.");
      return;
    }
    currentUser = u;
    await ensureProfileRow();
    const r = await fetch("/api/create-checkout-session", {
      method:"POST",
      headers:{ "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: u?.id, email: u?.email })
    });
    const d = await r.json();
    if(d?.url) location.href = d.url; else alert(d?.error || "Kunde inte starta Stripe Checkout");
  }catch(e){ alert("Nätverksfel mot Stripe"); }
}
async function callBillingPortal(){
  try{
    const { data: { session } } = await SB.auth.getSession();
    const u = session?.user;
    if(!u?.id){
      alert("Sessionen är ogiltig. Logga in igen.");
      return;
    }
    currentUser = u;
    await ensureProfileRow();
    const r = await fetch("/api/create-portal-session", {
      method:"POST",
      headers:{ "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: u?.id })
    });
    const d = await r.json();
    if(d?.url) location.href = d.url; else alert(d?.error || "Ingen portal hittades");
  }catch(e){ alert("Nätverksfel mot Stripe"); }
}
const upgradeBtnEl = $("#upgradeBtn");
if(upgradeBtnEl){
  upgradeBtnEl.dataset.mode = "upgrade";
  upgradeBtnEl.addEventListener("click", ()=>{
    if(upgradeBtnEl.dataset.mode === "manage"){
      callBillingPortal();
    }else{
      callStripeCheckout();
    }
  });
}
const manageBillingBtnEl = $("#manageBillingBtn");
if(manageBillingBtnEl){
  manageBillingBtnEl.addEventListener("click", callBillingPortal);
}

// Section: Datahämtning
async function loadProjects(){
  const { data, error } = await SB.from("projects")
    .select("id,name")
    .eq("user_id", currentUser.id)
    .order("created_at",{ascending:true});
  if(error){ console.error(error); return; }
  projects = data||[];
  renderProjectSelect();
}

function renderProjectSelect(){
  const sel = $("#projectSelect");
  if(!sel) return;
  sel.innerHTML = "";
  for(const p of projects){
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = p.name;
    sel.appendChild(opt);
  }
  if(projects.length && !currentProject){
    currentProject = projects[0];
    sel.value = currentProject.id;
    loadBets();
  }else if(currentProject){
    sel.value = currentProject.id;
  }
  updateProjectMeta();
}

function updateProjectMeta(){
  const title = $("#projectTitle");
  if(title) title.textContent = currentProject?.name || "Inget projekt valt";
  const count = $("#projectCount");
  if(count) count.textContent = projects.length.toString();
}

$("#projectSelect").onchange = ()=>{
  const id = $("#projectSelect").value;
  currentProject = projects.find(p=>p.id===id) || null;
  loadBets();
};

$("#newProjectBtn").onclick = async ()=>{
  const name = prompt("Namn på nytt projekt:", "Nytt projekt");
  if(!name) return;
  const { data, error } = await SB.from("projects")
    .insert({ name, user_id: currentUser.id })
    .select("id,name")
    .single();
  if(error){ alert("Kunde inte skapa projekt"); return; }
  projects.push(data);
  currentProject = data;
  renderProjectSelect();
  await loadBets();
};

$("#renameProjectBtn").onclick = async ()=>{
  if(!currentProject) return;
  const name = prompt("Nytt namn:", currentProject.name);
  if(!name) return;
  const { error } = await SB.from("projects")
    .update({ name })
    .eq("id", currentProject.id)
    .eq("user_id", currentUser.id);
  if(error){ alert("Kunde inte byta namn"); return; }
  currentProject.name = name;
  renderProjectSelect();
};

$("#deleteProjectBtn").onclick = async ()=>{
  if(!currentProject) return;
  if(!confirm("Radera projektet och alla spel?")) return;
  const { error } = await SB.from("projects")
    .delete()
    .eq("id", currentProject.id)
    .eq("user_id", currentUser.id);
  if(error){ alert("Kunde inte radera"); return; }
  projects = projects.filter(p=>p.id!==currentProject.id);
  currentProject = projects[0] || null;
  renderProjectSelect();
  await loadBets();
};

$("#cancelEditBtn").onclick = ()=> resetBetForm();

$("#resetProjectBtn").onclick = async ()=>{
  if(!currentProject) return;
  if(!confirm("Ta bort alla spel i projektet?")) return;
  const { error } = await SB.from("bets")
    .delete()
    .eq("project_id", currentProject.id)
    .eq("user_id", currentUser.id);
  if(error){ alert("Kunde inte nollställa"); return; }
  await loadBets();
};

async function loadBets(){
  closeActionMenus();
  resetBetForm();
  updateProjectMeta();
  const cont = $("#playsContainer");
  if(!currentProject){
    bets = [];
    if(cont) cont.innerHTML = '<div class="empty-state">Välj eller skapa ett projekt för att börja registrera spel.</div>';
    renderSummary();
    await updateFreeBanner();
    return;
  }
  const { data, error } = await SB.from("bets")
    .select("*")
    .eq("project_id", currentProject.id)
    .eq("user_id", currentUser.id)
    .order("matchday",{ascending:false})
    .order("created_at",{ascending:false});
  if(error){ console.error(error); return; }
  bets = data||[];
  renderBets();
  renderSummary();
  await updateFreeBanner();
}

async function updateFreeBanner(){
  if(!currentUser) return;
  try{
    const addBtn = $("#addBetBtn");
    const { data: profile, error: profileErr } = await SB
      .from("users")
      .select("plan_tier, free_bets_used, is_premium")
      .eq("id", currentUser.id)
      .maybeSingle();
    if(profileErr){ console.error(profileErr); return; }
    const banner = $("#freeBanner");
    if(!banner) return;
    const manageBtn = $("#manageBillingBtn");
    const upgradeBtn = $("#upgradeBtn");
    const isPremium = Boolean(profile?.is_premium);
    const used = Number(profile?.free_bets_used) || 0;
    const left = Math.max(20 - used, 0);
    $("#usedCount").textContent = used.toString();
    $("#leftCount").textContent = left.toString();
    if(isPremium){
      banner.classList.add("hide");
      if(manageBtn) manageBtn.classList.remove("hide");
      if(upgradeBtn){
        upgradeBtn.textContent = "Hantera";
        upgradeBtn.dataset.mode = "manage";
      }
      if(addBtn) addBtn.disabled = false;
    }else{
      banner.classList.remove("hide");
      if(manageBtn) manageBtn.classList.add("hide");
      if(upgradeBtn){
        upgradeBtn.textContent = "Uppgradera";
        upgradeBtn.dataset.mode = "upgrade";
      }
      if(addBtn) addBtn.disabled = used >= 20;
    }
  }catch(err){
    console.error("Kunde inte hämta profil", err);
    const addBtn = $("#addBetBtn");
    if(addBtn) addBtn.disabled = false;
  }
}

// Section: Lägg till spel
$("#addBetBtn").onclick = async ()=>{
  if(!currentProject) return alert("Välj/skapa projekt först.");
  const d = $("#iDate").value;
  const match = $("#iMatch").value.trim();
  const market = $("#iMarket").value.trim();
  const odds = parseFloat($("#iOdds").value);
  const stake = parseFloat($("#iStake").value);
  const book = $("#iBook").value.trim();
  const result = $("#iResult").value;

  if(!d || !match){
    alert("Ange matchdag och match.");
    return;
  }
  if(!Number.isFinite(odds) || odds <= 1){
    alert("Ange ett giltigt odds (större än 1.00).");
    return;
  }
  if(!Number.isFinite(stake) || stake <= 0){
    alert("Ange en giltig insats.");
    return;
  }

  const addBtn = $("#addBetBtn");
  if(!editingBetId && addBtn?.disabled){
    alert("Du har använt alla 20 gratis spel. Uppgradera för fler.");
    return;
  }

  const payload = {
    project_id: currentProject.id,
    user_id: currentUser.id,
    matchday: d,
    match,
    market: market || null,
    odds,
    stake,
    book: book || null,
    result
  };

  if(editingBetId){
    const { error } = await SB.from("bets")
      .update(payload)
      .eq("id", editingBetId)
      .eq("user_id", currentUser.id);
    if(error){ alert("Kunde inte uppdatera spel"); return; }
  }else{
    const { error } = await SB.from("bets").insert(payload);
    if(error){ alert("Kunde inte spara spel"); return; }
  }

  resetBetForm();
  await loadBets();
  setTab("list");
};

// Section: Rendera lista (grupperad per månad)
function renderBets(){
  const byMonth = {};
  for(const b of bets){
    if(!b.matchday) continue;
    const ym = b.matchday.slice(0,7); // YYYY-MM
    (byMonth[ym] ||= []).push(b);
  }
  const cont = $("#playsContainer");
  if(!cont) return;
  cont.innerHTML = "";

  if(!bets.length){
    cont.innerHTML = '<div class="empty-state">Inga spel registrerade ännu. Lägg till ditt första spel via formuläret till vänster.</div>';
    return;
  }

  const formatNumber = (value, decimals = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : "–";
  };
  const formatStake = value => {
    const num = Number(value);
    if(!Number.isFinite(num)) return "–";
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  Object.keys(byMonth).sort().reverse().forEach(ym=>{
    const arr = byMonth[ym];
    const [y,m] = ym.split("-").map(Number);
    const el = document.createElement("details");
    el.className = "month"; el.open = false;
    el.innerHTML = `<summary>${svMonth(y,m)}<span class="month-count">${arr.length} spel</span></summary>`;

    const header = document.createElement("div");
    header.className = "row row-head";
    header.innerHTML = `
      <div>Datum</div><div>Match &amp; Marknad</div><div>Odds</div>
      <div>Insats</div><div>Spelbolag</div><div>Status &amp; åtgärder</div>`;
    el.appendChild(header);

    for(const b of arr){
      const row = document.createElement("div"); row.className="row";
      const matchInfo = `${b.match || "–"}`;
      const marketInfo = b.market ? `<span class="market">${b.market}</span>` : "";
      const book = b.book ? b.book : "–";
      const status = b.result || "Pending";
      const statusClass = status.toLowerCase();
      const statusLabelMap = { Win: "Vinst", Loss: "Förlust", Pending: "Avvaktar", Void: "Void" };
      const statusLabel = statusLabelMap[status] || status;
      const fallbackId = Math.random().toString(36).slice(2, 9);
      const menuId = b.id ? `actions-${b.id}` : `actions-temp-${fallbackId}`;
      const resHtml = `
        <div class="result-cell">
          <span class="status-badge ${statusClass}">${statusLabel}</span>
          <div class="action-dropdown">
            <button type="button" class="dropdown-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="${menuId}">Hantera</button>
            <div class="action-menu" id="${menuId}" role="menu">
              <button type="button" role="menuitem" data-action="status" data-value="Win">Markera som vinst</button>
              <button type="button" role="menuitem" data-action="status" data-value="Loss">Markera som förlust</button>
              <button type="button" role="menuitem" data-action="status" data-value="Pending">Markera som avvaktar</button>
              <button type="button" role="menuitem" data-action="status" data-value="Void">Markera som void</button>
              <button type="button" role="menuitem" data-action="edit">Redigera</button>
              <button type="button" role="menuitem" data-action="delete">Ta bort</button>
            </div>
          </div>
        </div>`;

      row.innerHTML = `
        <div>${b.matchday ? new Date(b.matchday).toLocaleDateString("sv-SE") : "–"}</div>
        <div>${matchInfo}${marketInfo}</div>
        <div>${formatNumber(b.odds)}</div>
        <div>${formatStake(b.stake)}</div>
        <div>${book}</div>
        <div>${resHtml}</div>`;

      const dropdown = row.querySelector(".action-dropdown");
      const toggle = dropdown?.querySelector(".dropdown-toggle");
      const menu = dropdown?.querySelector(".action-menu");
      if(dropdown && toggle && menu){
        toggle.addEventListener("click", ev => {
          ev.stopPropagation();
          closeActionMenus();
          dropdown.classList.add("open");
          toggle.setAttribute("aria-expanded", "true");
          const firstItem = menu.querySelector("button");
          if(firstItem){
            setTimeout(()=>firstItem.focus(), 0);
          }
        });

        menu.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", async ev => {
            ev.stopPropagation();
            const action = btn.dataset.action;
            if(action === "edit"){ startEdit(b); }
            if(action === "status"){
              const value = btn.dataset.value;
              if(value && value !== b.result){
                const { error } = await SB.from("bets")
                  .update({ result: value })
                  .eq("id", b.id)
                  .eq("user_id", currentUser.id);
                if(error){ alert("Kunde inte uppdatera status"); }
                else await loadBets();
              }
            }
            if(action === "delete"){
              if(confirm("Ta bort detta spel?")){
                const { error } = await SB.from("bets")
                  .delete()
                  .eq("id", b.id)
                  .eq("user_id", currentUser.id);
                if(error){ alert("Kunde inte ta bort spel"); }
                else await loadBets();
              }
            }
            closeActionMenus();
          });
        });
      }
      el.appendChild(row);
    }
    cont.appendChild(el);
  });
}

function renderQuickStats(){
  const totalEl = $("#quickTotal");
  if(!totalEl) return;
  const total = bets.length;
  const pending = bets.filter(b => b.result === "Pending").length;
  const decided = bets.filter(b => b.result !== "Pending" && b.result !== "Void");
  const profit = bets.reduce((sum, b) => {
    const stakeNum = Number(b.stake);
    if(!Number.isFinite(stakeNum)) return sum;
    if(b.result === "Win"){
      const oddsNum = Number(b.odds);
      return Number.isFinite(oddsNum) ? sum + (oddsNum - 1) * stakeNum : sum;
    }
    if(b.result === "Loss"){
      return sum - stakeNum;
    }
    return sum;
  }, 0);
  const stakeSum = decided.reduce((sum,b)=>{
    const stakeNum = Number(b.stake);
    return Number.isFinite(stakeNum) ? sum + stakeNum : sum;
  },0);
  const roi = stakeSum > 0 ? (profit / stakeSum) * 100 : null;

  totalEl.textContent = total.toString();
  const pendingEl = $("#quickPending");
  if(pendingEl) pendingEl.textContent = pending.toString();
  const roiEl = $("#quickRoi");
  if(roiEl) roiEl.textContent = roi === null ? "–" : `${fmtMoney(roi)}%`;
  const profitEl = $("#quickProfit");
  if(profitEl) profitEl.textContent = fmtMoney(profit);
}

function recompute(monthFilter="all"){
  let data = bets;
  if(monthFilter!=="all"){
    data = data.filter(b => b.matchday?.startsWith(monthFilter));
  }
  const decided = data.filter(b => b.result!=="Pending" && b.result!=="Void");
  const wins = decided.filter(b => b.result==="Win").length;
  const stakeSum = decided.reduce((s,b)=>{
    const stakeNum = Number(b.stake);
    return Number.isFinite(stakeNum) ? s + stakeNum : s;
  },0);
  const profit = decided.reduce((s,b)=>{
    const stakeNum = Number(b.stake);
    if(!Number.isFinite(stakeNum)) return s;
    if(b.result==="Win"){
      const oddsNum = Number(b.odds);
      return Number.isFinite(oddsNum) ? s + (oddsNum-1)*stakeNum : s;
    }
    if(b.result==="Loss"){
      return s - stakeNum;
    }
    return s;
  }, 0);
  const roi = stakeSum>0 ? (profit/stakeSum)*100 : 0;

  $("#sGames").textContent = decided.length.toString();
  $("#sWins").textContent = wins.toString();
  $("#sProfit").textContent = fmtMoney(profit);
  $("#sRoi").textContent = fmtMoney(roi)+"%";

  if(monthFilter==="all"){ $("#sMonthName").textContent = "Alla månader"; }
  else{
    const [y,m] = monthFilter.split("-").map(Number);
    $("#sMonthName").textContent = svMonth(y,m);
  }
}

function renderSummary(){
  const months = [...new Set(bets.filter(b=>b.matchday).map(b=>b.matchday.slice(0,7)))].sort().reverse();
  const sel = $("#monthFilter");
  if(!sel) return;
  sel.innerHTML = `<option value="all">Alla månader</option>` + months.map(m=>`<option value="${m}">${m}</option>`).join("");
  sel.onchange = ()=>recompute(sel.value);
  recompute(sel.value||"all");
  renderQuickStats();
}

// Section: Initiering
(async function init(){
  try{
    await ensureAuth();
  }catch(err){
    console.warn("Användaren är inte inloggad", err);
    return;
  }

  resetBetForm();

  await loadProjects();
  if(!currentProject) await updateFreeBanner();
})();
