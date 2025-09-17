'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const initialForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  match: '',
  market: '',
  odds: '',
  stake: '1',
  book: '',
  result: 'Pending',
  note: '',
});

const monthFormatter = new Intl.DateTimeFormat('sv-SE', {
  month: 'long',
  year: 'numeric',
});

const formatMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return (Math.round(num * 100) / 100).toFixed(2);
};

const formatMonth = (key) => {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return monthFormatter.format(new Date(year, month - 1, 1));
};

const computeProfit = (bet) => {
  const stakeNum = Number(bet.stake);
  if (!Number.isFinite(stakeNum)) return 0;
  if (bet.result === 'Win') {
    const oddsNum = Number(bet.odds);
    if (!Number.isFinite(oddsNum)) return 0;
    return (oddsNum - 1) * stakeNum;
  }
  if (bet.result === 'Loss') {
    return -stakeNum;
  }
  return 0;
};

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('');
  const [bets, setBets] = useState([]);
  const [tab, setTab] = useState('reg');
  const [form, setForm] = useState(initialForm);
  const [monthFilter, setMonthFilter] = useState('all');
  const [freeInfo, setFreeInfo] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBets, setLoadingBets] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const nextSession = data.session ?? null;
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        router.replace('/login');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        router.replace('/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const ensureProfileRow = useCallback(
    async (targetUser) => {
      const u = targetUser ?? user;
      if (!u?.id) return;
      try {
        const payload = { id: u.id };
        if (u.email) payload.email = u.email;
        const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
        if (error) {
          console.error('Kunde inte skapa/uppdatera användarrad', error);
        }
      } catch (err) {
        console.error('ensureProfileRow fel', err);
      }
    },
    [user]
  );

  const updateFreeUsage = useCallback(async () => {
    if (!user?.id) {
      setFreeInfo(null);
      return;
    }
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', user.id)
        .maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile) {
        await ensureProfileRow(user);
      }

      const isPremium = !!profile?.is_premium;
      if (isPremium) {
        setFreeInfo({ premium: true, used: 0, left: Infinity });
        return;
      }

      const { count, error: countErr } = await supabase
        .from('bets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (countErr) throw countErr;

      const used = count ?? 0;
      const left = Math.max(0, 20 - used);
      setFreeInfo({ premium: false, used, left });
    } catch (err) {
      console.error('updateFreeUsage fel', err);
      setFreeInfo({ premium: false, used: 0, left: 20 });
    }
  }, [ensureProfileRow, user]);

  const loadProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([]);
      setCurrentProjectId('');
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id,name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const list = data ?? [];
      setProjects(list);
      setCurrentProjectId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev;
        return list[0]?.id ?? '';
      });
    } catch (err) {
      console.error('Kunde inte ladda projekt', err);
      setProjects([]);
      setCurrentProjectId('');
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  const loadBets = useCallback(
    async (projectId) => {
      if (!user?.id || !projectId) {
        setBets([]);
        await updateFreeUsage();
        return;
      }
      setLoadingBets(true);
      try {
        const { data, error } = await supabase
          .from('bets')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .order('matchday', { ascending: false })
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBets(data ?? []);
      } catch (err) {
        console.error('Kunde inte ladda spel', err);
        setBets([]);
      } finally {
        setLoadingBets(false);
        await updateFreeUsage();
      }
    },
    [updateFreeUsage, user]
  );

  useEffect(() => {
    if (user?.id) {
      ensureProfileRow(user);
      loadProjects();
    }
  }, [ensureProfileRow, loadProjects, user]);

  useEffect(() => {
    if (!currentProjectId) {
      setBets([]);
      updateFreeUsage();
      return;
    }
    loadBets(currentProjectId);
  }, [currentProjectId, loadBets, updateFreeUsage]);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  const monthGroups = useMemo(() => {
    const groups = new Map();
    for (const bet of bets) {
      if (!bet.matchday) continue;
      const key = bet.matchday.slice(0, 7);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(bet);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [bets]);

  useEffect(() => {
    setMonthFilter((prev) => {
      if (prev === 'all') return 'all';
      return monthGroups.some(([key]) => key === prev) ? prev : 'all';
    });
  }, [monthGroups]);

  const summaryData = useMemo(() => {
    const filtered =
      monthFilter === 'all'
        ? bets
        : bets.filter((bet) => bet.matchday?.startsWith(monthFilter));
    const decided = filtered.filter((bet) => bet.result !== 'Pending' && bet.result !== 'Void');
    const wins = decided.filter((bet) => bet.result === 'Win');
    const stakeSum = decided.reduce((sum, bet) => {
      const stakeNum = Number(bet.stake);
      return Number.isFinite(stakeNum) ? sum + stakeNum : sum;
    }, 0);
    const profit = decided.reduce((sum, bet) => sum + computeProfit(bet), 0);
    const roi = stakeSum > 0 ? (profit / stakeSum) * 100 : 0;
    return {
      games: decided.length,
      wins: wins.length,
      profit,
      roi,
    };
  }, [bets, monthFilter]);

  const quickStats = useMemo(() => {
    const total = bets.length;
    const pending = bets.filter((bet) => bet.result === 'Pending').length;
    const decided = bets.filter((bet) => bet.result !== 'Pending' && bet.result !== 'Void');
    const wins = decided.filter((bet) => bet.result === 'Win').length;
    const winRate = decided.length ? (wins / decided.length) * 100 : null;
    const profit = bets.reduce((sum, bet) => sum + computeProfit(bet), 0);
    return {
      total,
      pending,
      winRate,
      profit,
    };
  }, [bets]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleNewProject = async () => {
    if (!user?.id) return;
    const name = window.prompt('Namn på nytt projekt:', 'Nytt projekt');
    if (!name) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, user_id: user.id })
        .select('id,name')
        .single();
      if (error) throw error;
      setProjects((prev) => [...prev, data]);
      setCurrentProjectId(data.id);
      loadBets(data.id);
    } catch (err) {
      console.error('Kunde inte skapa projekt', err);
      window.alert('Kunde inte skapa projekt');
    }
  };

  const handleRenameProject = async () => {
    if (!user?.id || !currentProject) return;
    const name = window.prompt('Nytt namn:', currentProject.name);
    if (!name) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name })
        .eq('id', currentProject.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? { ...p, name } : p)));
    } catch (err) {
      console.error('Kunde inte byta namn', err);
      window.alert('Kunde inte byta namn');
    }
  };

  const handleDeleteProject = async () => {
    if (!user?.id || !currentProject) return;
    if (!window.confirm('Radera projektet och alla spel?')) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', currentProject.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== currentProject.id));
      setCurrentProjectId('');
    } catch (err) {
      console.error('Kunde inte radera projekt', err);
      window.alert('Kunde inte radera projekt');
    }
  };

  const handleResetProject = async () => {
    if (!user?.id || !currentProject) return;
    if (!window.confirm('Ta bort alla spel i projektet?')) return;
    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('project_id', currentProject.id)
        .eq('user_id', user.id);
      if (error) throw error;
      loadBets(currentProject.id);
    } catch (err) {
      console.error('Kunde inte nollställa projekt', err);
      window.alert('Kunde inte nollställa projekt');
    }
  };

  const handleAddBet = async () => {
    if (!user?.id || !currentProjectId) {
      window.alert('Välj eller skapa projekt först.');
      return;
    }
    const matchday = form.date;
    const match = form.match.trim();
    const market = form.market.trim();
    const odds = parseFloat(form.odds);
    const stake = parseFloat(form.stake);
    const book = form.book.trim();
    const result = form.result;
    const note = form.note.trim();

    if (!matchday || !match || !market || !Number.isFinite(odds) || !Number.isFinite(stake)) {
      window.alert('Fyll i alla fält.');
      return;
    }

    if (freeInfo && !freeInfo.premium && freeInfo.left <= 0) {
      window.alert('Du har använt alla 20 gratis spel. Uppgradera för fler.');
      return;
    }

    try {
      const { error } = await supabase.from('bets').insert({
        project_id: currentProjectId,
        user_id: user.id,
        matchday,
        match,
        market,
        odds,
        stake,
        book,
        result,
        note,
      });
      if (error) throw error;
      setForm((prev) => ({ ...prev, note: '' }));
      setTab('list');
      loadBets(currentProjectId);
    } catch (err) {
      console.error('Kunde inte spara spel', err);
      window.alert('Kunde inte spara spel');
    }
  };

  const handleUpdateBetResult = async (betId, result) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('bets')
        .update({ result })
        .eq('id', betId)
        .eq('user_id', user.id);
      if (error) throw error;
      loadBets(currentProjectId);
    } catch (err) {
      console.error('Kunde inte uppdatera resultat', err);
      window.alert('Kunde inte uppdatera resultat');
    }
  };

  const handleDeleteBet = async (betId) => {
    if (!user?.id) return;
    if (!window.confirm('Ta bort spelet?')) return;
    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', betId)
        .eq('user_id', user.id);
      if (error) throw error;
      loadBets(currentProjectId);
    } catch (err) {
      console.error('Kunde inte ta bort spel', err);
      window.alert('Kunde inte ta bort spel');
    }
  };

  const handleUpgrade = async () => {
    if (!user?.id) return;
    try {
      await ensureProfileRow(user);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        window.alert(data?.error || 'Kunde inte starta Stripe Checkout');
      }
    } catch (err) {
      console.error('Stripe checkout fel', err);
      window.alert('Nätverksfel mot Stripe');
    }
  };

  const handleManageBilling = async () => {
    if (!user?.id) return;
    try {
      await ensureProfileRow(user);
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        window.alert(data?.error || 'Ingen portal hittades');
      }
    } catch (err) {
      console.error('Stripe portal fel', err);
      window.alert('Nätverksfel mot Stripe');
    }
  };

  const isAddDisabled = !currentProjectId || (freeInfo && !freeInfo.premium && freeInfo.left <= 0);

  const formatNumber = (value, decimals = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : '–';
  };

  const formatStake = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '–';
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const summaryMonthName = monthFilter === 'all' ? 'Alla månader' : formatMonth(monthFilter);

  return (
    <div className="container">
      <header className="top-bar">
        <div className="brand-block">
          <div className="brand">BetSpread</div>
          <p className="tagline">Planera, följ upp och förbättra dina spel.</p>
        </div>
        <div className="right-actions">
          <span className="badge">{user?.email || 'Ingen e-post'}</span>
          {freeInfo?.premium ? (
            <button type="button" id="manageBillingBtn" onClick={handleManageBilling}>
              Hantera
            </button>
          ) : null}
          {!freeInfo?.premium ? (
            <button type="button" id="upgradeBtn" className="btn-green" onClick={handleUpgrade}>
              Uppgradera
            </button>
          ) : null}
          <button type="button" className="btn-red" onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </header>

      {!freeInfo?.premium ? (
        <div className="banner">
          <div>
            <h2>Gratisläge</h2>
            <p>
              Du har använt <strong>{freeInfo?.used ?? 0}</strong> av 20 spel.
              <br />Återstår: <strong>{freeInfo ? Math.max(0, freeInfo.left) : 20}</strong> spel.
            </p>
          </div>
          <span className="hint">Uppgradera för obegränsade registreringar.</span>
        </div>
      ) : null}

      <main className="workspace">
        <section className="primary">
          <div className="panel project-panel">
            <div className="section-header">
              <div>
                <h2>Projekt</h2>
                <p className="hint">{currentProject?.name || 'Inget projekt valt'}</p>
              </div>
              <div className="project-meta">Projekt totalt: <strong>{projects.length}</strong></div>
            </div>
            <div className="project-controls">
              <label htmlFor="projectSelect">Välj projekt</label>
              <div className="control-row">
                <select
                  id="projectSelect"
                  value={currentProjectId}
                  onChange={(e) => setCurrentProjectId(e.target.value)}
                  disabled={loadingProjects}
                >
                  {projects.length === 0 ? (
                    <option value="">Inga projekt</option>
                  ) : null}
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <div className="button-cluster">
                  <button type="button" onClick={handleNewProject}>
                    Nytt projekt
                  </button>
                  <button type="button" onClick={handleRenameProject} disabled={!currentProject}>
                    Byt namn
                  </button>
                  <button
                    type="button"
                    className="btn-red"
                    onClick={handleDeleteProject}
                    disabled={!currentProject}
                  >
                    Radera
                  </button>
                </div>
              </div>
            </div>
          </div>

          <nav className="tabs" role="tablist">
            <button
              type="button"
              className={`tab ${tab === 'reg' ? 'active' : ''}`}
              data-tab="reg"
              role="tab"
              aria-selected={tab === 'reg'}
              onClick={() => setTab('reg')}
            >
              Registrera spel
            </button>
            <button
              type="button"
              className={`tab ${tab === 'summary' ? 'active' : ''}`}
              data-tab="summary"
              role="tab"
              aria-selected={tab === 'summary'}
              onClick={() => setTab('summary')}
            >
              Månadssummering
            </button>
            <button
              type="button"
              className={`tab ${tab === 'list' ? 'active' : ''}`}
              data-tab="list"
              role="tab"
              aria-selected={tab === 'list'}
              onClick={() => setTab('list')}
            >
              Spel
            </button>
          </nav>

          <section
            id="tab-reg"
            className={`panel form-panel ${tab === 'reg' ? '' : 'hide'}`}
            role="tabpanel"
            aria-hidden={tab !== 'reg'}
          >
            <div className="section-header">
              <div>
                <h2>Registrera spel</h2>
                <p className="hint">Fyll i matchinformationen och klicka på "Lägg till spel" för att spara.</p>
              </div>
              <span className="subtle">Alla fält är obligatoriska</span>
            </div>
            <div className="grid">
              <div className="col-2 field">
                <label htmlFor="iDate">Matchdag</label>
                <input
                  id="iDate"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="col-3 field">
                <label htmlFor="iMatch">Match</label>
                <input
                  id="iMatch"
                  type="text"
                  placeholder="Arsenal — Chelsea"
                  value={form.match}
                  onChange={(e) => setForm((prev) => ({ ...prev, match: e.target.value }))}
                />
              </div>
              <div className="col-3 field">
                <label htmlFor="iMarket">Marknad</label>
                <input
                  id="iMarket"
                  type="text"
                  placeholder="Över 8.5 frisparkar"
                  value={form.market}
                  onChange={(e) => setForm((prev) => ({ ...prev, market: e.target.value }))}
                />
              </div>
              <div className="col-2 field">
                <label htmlFor="iOdds">Oddset</label>
                <input
                  id="iOdds"
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.85"
                  value={form.odds}
                  onChange={(e) => setForm((prev) => ({ ...prev, odds: e.target.value }))}
                />
              </div>
              <div className="col-1 field">
                <label htmlFor="iStake">Insats</label>
                <input
                  id="iStake"
                  type="number"
                  step="1"
                  min="1"
                  value={form.stake}
                  onChange={(e) => setForm((prev) => ({ ...prev, stake: e.target.value }))}
                />
              </div>
              <div className="col-1 field">
                <label htmlFor="iBook">Spelbolag</label>
                <input
                  id="iBook"
                  type="text"
                  placeholder="Bet365"
                  value={form.book}
                  onChange={(e) => setForm((prev) => ({ ...prev, book: e.target.value }))}
                />
              </div>
              <div className="col-2 field">
                <label htmlFor="iResult">Resultat</label>
                <select
                  id="iResult"
                  value={form.result}
                  onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}
                >
                  <option>Pending</option>
                  <option>Win</option>
                  <option>Loss</option>
                  <option>Void</option>
                </select>
              </div>
              <div className="col-6 field">
                <label htmlFor="iNote">Notering</label>
                <input
                  id="iNote"
                  type="text"
                  placeholder="Ex. sent mål, cashout, etc."
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>
              <div className="col-4 field action-field">
                <span className="sr-only">Åtgärder</span>
                <div className="actions">
                  <button type="button" className="btn-green" onClick={handleAddBet} disabled={isAddDisabled}>
                    Lägg till spel
                  </button>
                  <button
                    type="button"
                    className="btn-red"
                    onClick={handleResetProject}
                    disabled={!currentProject}
                  >
                    Nollställ projekt
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            id="tab-summary"
            className={`panel summary-panel ${tab === 'summary' ? '' : 'hide'}`}
            role="tabpanel"
            aria-hidden={tab !== 'summary'}
          >
            <div className="section-header">
              <div>
                <h2>Månadssummering</h2>
                <p className="hint">Analysera avgjorda spel och följ ROI per månad.</p>
              </div>
              <div className="filter">
                <label htmlFor="monthFilter">Månad (matchdag)</label>
                <select
                  id="monthFilter"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <option value="all">Alla månader</option>
                  {monthGroups.map(([key]) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-card">
                <span className="label">Spel (avgjorda)</span>
                <span className="value">{summaryData.games}</span>
              </div>
              <div className="stat-card">
                <span className="label">Vinster</span>
                <span className="value">{summaryData.wins}</span>
              </div>
              <div className="stat-card">
                <span className="label">Profit</span>
                <span className="value">{formatMoney(summaryData.profit)}</span>
              </div>
              <div className="stat-card">
                <span className="label">ROI</span>
                <span className="value">{`${formatMoney(summaryData.roi)}%`}</span>
              </div>
            </div>
            <div className="trend-card">
              <span className="label">Visar</span>
              <span className="value">{summaryMonthName}</span>
            </div>
          </section>

          <section
            id="tab-list"
            className={`panel list-panel ${tab === 'list' ? '' : 'hide'}`}
            role="tabpanel"
            aria-hidden={tab !== 'list'}
          >
            <div className="section-header">
              <div>
                <h2>Spelöversikt</h2>
                <p className="hint">Hantera registrerade spel och uppdatera resultaten.</p>
              </div>
            </div>
            {loadingBets ? (
              <div className="empty-state">Laddar spel…</div>
            ) : bets.length === 0 ? (
              <div className="empty-state">
                {currentProjectId
                  ? 'Inga spel registrerade ännu. Lägg till ditt första spel via formuläret till vänster.'
                  : 'Välj eller skapa ett projekt för att börja registrera spel.'}
              </div>
            ) : (
              <div id="playsContainer">
                {monthGroups.map(([key, list]) => (
                  <details key={key} className="month">
                    <summary>
                      {formatMonth(key)}
                      <span className="month-count">{list.length} spel</span>
                    </summary>
                    <div className="row row-head">
                      <div>Datum</div>
                      <div>Match &amp; Marknad</div>
                      <div>Odds</div>
                      <div>Insats</div>
                      <div>Spelbolag</div>
                      <div>Notering</div>
                      <div>Resultat</div>
                    </div>
                    {list.map((bet) => (
                      <div key={bet.id} className="row">
                        <div data-label="Datum">{bet.matchday || '–'}</div>
                        <div data-label="Match &amp; Marknad" className="cell-match">
                          <span className="match">{bet.match || '–'}</span>
                          {bet.market ? <span className="market">{bet.market}</span> : null}
                        </div>
                        <div data-label="Odds">{formatNumber(bet.odds, 2)}</div>
                        <div data-label="Insats">{formatStake(bet.stake)}</div>
                        <div data-label="Spelbolag">{bet.book || '–'}</div>
                        <div data-label="Notering" className="note-cell">
                          {bet.note || '–'}
                        </div>
                        <div data-label="Resultat">
                          <div className="actions">
                            <span className="pill win" onClick={() => handleUpdateBetResult(bet.id, 'Win')}>
                              Win
                            </span>
                            <span className="pill loss" onClick={() => handleUpdateBetResult(bet.id, 'Loss')}>
                              Loss
                            </span>
                            <span
                              className="pill pending"
                              onClick={() => handleUpdateBetResult(bet.id, 'Pending')}
                            >
                              Pending
                            </span>
                            <span className="pill void" onClick={() => handleUpdateBetResult(bet.id, 'Void')}>
                              Void
                            </span>
                            <span className="pill" data-del="1" onClick={() => handleDeleteBet(bet.id)}>
                              Ta bort
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </details>
                ))}
              </div>
            )}
          </section>
        </section>

        <aside className="secondary">
          <section className="panel highlight-panel">
            <h2>Snabböversikt</h2>
            <p className="hint">Få koll på projektets status utan att lämna formuläret.</p>
            <div className="overview-grid">
              <div className="overview-card">
                <span className="label">Spel totalt</span>
                <span className="value">{quickStats.total}</span>
              </div>
              <div className="overview-card">
                <span className="label">Pågående</span>
                <span className="value">{quickStats.pending}</span>
              </div>
              <div className="overview-card">
                <span className="label">Vinstrate</span>
                <span className="value">
                  {quickStats.winRate == null ? '–' : `${(Math.round(quickStats.winRate * 10) / 10).toFixed(1)}%`}
                </span>
              </div>
              <div className="overview-card">
                <span className="label">Profit</span>
                <span className="value">{formatMoney(quickStats.profit)}</span>
              </div>
            </div>
          </section>
          <section className="panel tip-panel">
            <h2>Tips</h2>
            <ul className="tips-list">
              <li>
                <strong>Byt projekt</strong> i listan för att se andra spel.
              </li>
              <li>
                <strong>Använd flikarna</strong> för att registrera spel eller analysera resultat.
              </li>
              <li>
                <strong>Uppdatera resultat</strong> i spel-listan så hålls statistiken aktuell.
              </li>
            </ul>
          </section>
        </aside>
      </main>

      <style jsx global>{`
        body {
          background: linear-gradient(180deg, #040914, #0d1729);
        }
        .container {
          width: 100%;
          max-width: 1220px;
          margin: 0 auto;
          padding: 36px 22px 64px;
        }
        header.top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
          padding: 22px 26px;
          border-radius: 18px;
          background: rgba(17, 31, 52, 0.95);
          border: 1px solid rgba(74, 96, 138, 0.38);
          box-shadow: 0 28px 65px -35px rgba(7, 11, 24, 0.9);
          backdrop-filter: blur(12px);
        }
        .brand-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .brand {
          font-weight: 800;
          font-size: 28px;
          letter-spacing: 0.02em;
          background: linear-gradient(135deg, #a855f7, #38bdf8);
          -webkit-background-clip: text;
          color: transparent;
        }
        .tagline {
          margin: 0;
          font-size: 14px;
          color: rgba(140, 163, 204, 0.9);
        }
        .right-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        button,
        .btn {
          background: rgba(42, 60, 100, 0.9);
          border: 1px solid rgba(96, 119, 173, 0.45);
          color: #f1f5ff;
          border-radius: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        button:hover,
        .btn:hover {
          background: rgba(58, 82, 134, 0.95);
          transform: translateY(-1px);
        }
        button:focus-visible,
        .btn:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 3px;
        }
        .btn-green {
          background: linear-gradient(135deg, #34d399, #10b981);
          border: none;
          box-shadow: 0 12px 32px -20px rgba(16, 185, 129, 0.7);
        }
        .btn-red {
          background: linear-gradient(135deg, #f87171, #ef4444);
          border: none;
          box-shadow: 0 12px 32px -20px rgba(239, 68, 68, 0.65);
        }
        .btn-red:disabled,
        .btn-green:disabled,
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(96, 165, 250, 0.35);
          color: #60a5fa;
          font-weight: 600;
          font-size: 14px;
        }
        .banner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 22px;
          margin-bottom: 24px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(248, 113, 113, 0.08));
          border: 1px solid rgba(248, 113, 113, 0.45);
          color: #ffe1e1;
          box-shadow: 0 18px 45px -30px rgba(248, 113, 113, 0.45);
        }
        .banner h2 {
          margin: 0 0 4px;
          font-size: 18px;
          color: #ffe1e1;
        }
        .banner p {
          margin: 0;
          font-size: 15px;
          color: #ffd9d9;
          line-height: 1.45;
        }
        .workspace {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 24px;
          align-items: flex-start;
        }
        .panel {
          background: rgba(12, 22, 39, 0.92);
          border: 1px solid rgba(74, 96, 138, 0.38);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 28px 65px -35px rgba(7, 11, 24, 0.9);
          backdrop-filter: blur(12px);
        }
        .panel h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .hint {
          color: rgba(140, 163, 204, 0.9);
          font-size: 14px;
        }
        .subtle {
          color: rgba(140, 163, 204, 0.9);
          font-size: 13px;
        }
        .section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }
        .project-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(140, 163, 204, 0.9);
          font-size: 13px;
        }
        .project-meta strong {
          color: #f1f5ff;
          font-size: 16px;
        }
        .project-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .project-controls label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(140, 163, 204, 0.9);
        }
        .control-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        select,
        input,
        textarea {
          background: rgba(10, 20, 35, 0.85);
          border: 1px solid rgba(78, 106, 150, 0.4);
          color: #f1f5ff;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 15px;
          transition: border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        select:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
          border-color: rgba(96, 165, 250, 0.8);
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
          outline: none;
        }
        .button-cluster {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .tabs {
          display: flex;
          gap: 12px;
          padding: 6px;
          background: rgba(15, 26, 44, 0.7);
          border: 1px solid rgba(72, 95, 142, 0.35);
          border-radius: 18px;
          box-shadow: 0 28px 65px -35px rgba(7, 11, 24, 0.9);
        }
        .tab {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(140, 163, 204, 0.9);
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, border 0.2s ease, transform 0.2s ease;
        }
        .tab:hover {
          color: #f1f5ff;
          transform: translateY(-1px);
        }
        .tab.active {
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.28), rgba(56, 189, 248, 0.16));
          border-color: rgba(96, 165, 250, 0.5);
          color: #f1f5ff;
          box-shadow: 0 12px 28px -20px rgba(96, 165, 250, 0.7);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 16px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(140, 163, 204, 0.9);
        }
        .col-1 {
          grid-column: span 1;
        }
        .col-2 {
          grid-column: span 2;
        }
        .col-3 {
          grid-column: span 3;
        }
        .col-4 {
          grid-column: span 4;
        }
        .col-6 {
          grid-column: span 6;
        }
        .col-12 {
          grid-column: span 12;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        .action-field {
          align-self: end;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .summary-panel .filter {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 190px;
        }
        .summary-panel select {
          min-width: 190px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }
        .stat-card {
          padding: 18px;
          border-radius: 14px;
          background: rgba(18, 32, 54, 0.8);
          border: 1px solid rgba(73, 103, 152, 0.4);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-card .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(140, 163, 204, 0.9);
        }
        .stat-card .value {
          font-size: 26px;
          font-weight: 700;
        }
        .trend-card {
          margin-top: 20px;
          padding: 18px;
          border-radius: 14px;
          background: rgba(22, 36, 58, 0.8);
          border: 1px solid rgba(72, 103, 152, 0.35);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .trend-card .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(140, 163, 204, 0.9);
        }
        .trend-card .value {
          font-size: 18px;
          font-weight: 600;
        }
        #playsContainer {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        details.month {
          border-radius: 18px;
          border: 1px solid rgba(72, 103, 152, 0.35);
          background: rgba(17, 29, 49, 0.75);
          overflow: hidden;
          box-shadow: 0 28px 65px -35px rgba(7, 11, 24, 0.9);
        }
        details.month summary {
          list-style: none;
          padding: 18px 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(56, 189, 248, 0.08));
        }
        details.month summary::-webkit-details-marker {
          display: none;
        }
        details.month[open] summary {
          border-bottom: 1px solid rgba(72, 103, 152, 0.35);
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(56, 189, 248, 0.05));
        }
        .month-count {
          font-size: 14px;
          color: rgba(140, 163, 204, 0.9);
        }
        .row {
          display: grid;
          grid-template-columns: 120px 1.8fr 90px 90px 150px 1.4fr 220px;
          gap: 16px;
          padding: 16px 22px;
          align-items: flex-start;
        }
        .row-head {
          background: rgba(255, 255, 255, 0.02);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(140, 163, 204, 0.9);
          font-weight: 600;
          padding-top: 14px;
          padding-bottom: 14px;
        }
        .row:not(.row-head):nth-child(odd) {
          background: rgba(10, 18, 32, 0.3);
        }
        .row > div {
          min-width: 0;
        }
        .cell-match .match {
          font-weight: 600;
          display: block;
        }
        .cell-match .market {
          display: block;
          font-size: 13px;
          color: rgba(140, 163, 204, 0.9);
          margin-top: 2px;
        }
        .note-cell {
          font-size: 14px;
          line-height: 1.4;
          opacity: 0.92;
        }
        .pill {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(27, 43, 73, 0.9);
          border: 1px solid rgba(71, 103, 152, 0.4);
          font-size: 13px;
          font-weight: 600;
          color: #f1f5ff;
          transition: transform 0.15s ease, background 0.2s ease, border 0.2s ease;
          cursor: pointer;
        }
        .pill:hover {
          transform: translateY(-1px);
          background: rgba(46, 69, 104, 0.95);
        }
        .pill.win {
          background: rgba(22, 101, 52, 0.28);
          border-color: rgba(134, 239, 172, 0.45);
          color: #86efac;
        }
        .pill.loss {
          background: rgba(153, 27, 27, 0.28);
          border-color: rgba(248, 113, 113, 0.5);
          color: #fca5a5;
        }
        .pill.pending {
          background: rgba(30, 64, 175, 0.25);
          border-color: rgba(129, 140, 248, 0.45);
          color: #c7d2fe;
        }
        .pill.void {
          background: rgba(107, 114, 128, 0.25);
          border-color: rgba(156, 163, 175, 0.45);
          color: #e5e7eb;
        }
        .pill[data-del] {
          background: rgba(120, 31, 46, 0.25);
          border-color: rgba(239, 68, 68, 0.45);
          color: #fca5a5;
        }
        .empty-state {
          padding: 32px 24px;
          text-align: center;
          background: rgba(17, 31, 52, 0.75);
          border: 1px dashed rgba(99, 102, 241, 0.35);
          color: rgba(140, 163, 204, 0.9);
          font-size: 15px;
          line-height: 1.6;
          border-radius: 18px;
        }
        .highlight-panel {
          position: sticky;
          top: 24px;
        }
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-top: 18px;
        }
        .overview-card {
          padding: 16px;
          border-radius: 14px;
          background: rgba(18, 32, 54, 0.72);
          border: 1px solid rgba(72, 103, 152, 0.35);
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 0.2s ease, border 0.2s ease, background 0.2s ease;
        }
        .overview-card:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.5);
          background: rgba(21, 38, 62, 0.8);
        }
        .overview-card .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(140, 163, 204, 0.9);
        }
        .overview-card .value {
          font-size: 24px;
          font-weight: 700;
        }
        .tip-panel ul {
          margin: 12px 0 0;
          padding-left: 20px;
          color: rgba(140, 163, 204, 0.9);
          line-height: 1.6;
        }
        .tip-panel li strong {
          color: #f1f5ff;
        }
        .hide {
          display: none !important;
        }
        @media (max-width: 1100px) {
          .workspace {
            grid-template-columns: 1fr;
          }
          .secondary {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .highlight-panel {
            position: static;
          }
          .row {
            grid-template-columns: 110px 1.6fr 80px 80px 140px 1.2fr 200px;
          }
          .grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
          .col-1,
          .col-2 {
            grid-column: span 3;
          }
          .col-3 {
            grid-column: span 3;
          }
          .col-4,
          .col-6 {
            grid-column: span 6;
          }
        }
        @media (max-width: 900px) {
          .row-head {
            display: none;
          }
          .row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 14px 18px;
            border-bottom: 1px solid rgba(72, 103, 152, 0.25);
          }
          .row:not(.row-head) > div {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .row:not(.row-head) > div::before {
            content: attr(data-label);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(140, 163, 204, 0.9);
            font-weight: 600;
          }
          .actions {
            justify-content: flex-start;
          }
        }
        @media (max-width: 760px) {
          .secondary {
            flex-direction: column;
          }
        }
        @media (max-width: 720px) {
          .grid {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
          .col-1,
          .col-2,
          .col-3,
          .col-4,
          .col-6,
          .col-12 {
            grid-column: span 1;
          }
          .action-field {
            align-self: auto;
          }
          .actions {
            flex-direction: column;
            align-items: stretch;
          }
          .tabs {
            flex-direction: column;
          }
        }
        @media (max-width: 640px) {
          header.top-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          .right-actions {
            justify-content: flex-start;
            width: 100%;
          }
        }
        @media (max-width: 480px) {
          .right-actions {
            gap: 10px;
          }
          .right-actions button {
            width: 100%;
          }
          .badge {
            width: 100%;
            justify-content: center;
          }
          .banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
