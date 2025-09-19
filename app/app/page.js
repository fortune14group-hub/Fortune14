'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

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

const RESULT_OPTIONS = ['Win', 'Loss', 'Pending', 'Void'];

const monthFormatter = new Intl.DateTimeFormat('sv-SE', {
  month: 'long',
  year: 'numeric',
});

const dayFormatter = new Intl.DateTimeFormat('sv-SE', {
  day: '2-digit',
  month: 'short',
});

const formatDay = (isoDate) => {
  if (!isoDate) return '–';
  const safeDate = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(safeDate.getTime())) return isoDate;
  return dayFormatter.format(safeDate);
};

const formatMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return (Math.round(num * 100) / 100).toFixed(2);
};

const formatPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.0%';
  return `${(Math.round(num * 10) / 10).toFixed(1)}%`;
};

const PAYWALL_ENABLED = false;

const unlimitedFreeInfo = () => ({
  premium: true,
  used: 0,
  left: Infinity,
});

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
  const [freeInfo, setFreeInfo] = useState(() => (PAYWALL_ENABLED ? null : unlimitedFreeInfo()));
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBets, setLoadingBets] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  const [openMonths, setOpenMonths] = useState(() => new Set());
  const [supabaseState] = useState(() => {
    try {
      return { client: getSupabaseBrowserClient(), error: null };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Okänt fel vid initiering av Supabase-klienten.';
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Supabase-konfiguration saknas:', err);
      }
      return { client: null, error: message };
    }
  });
  const supabase = supabaseState.client;
  const supabaseError = supabaseState.error;

  const paywallLimitReached =
    PAYWALL_ENABLED && freeInfo && !freeInfo.premium && freeInfo.left <= 0;

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isMounted = true;
    let authSubscription = null;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const nextSession = data.session ?? null;
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        router.replace('/login');
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        router.replace('/login');
      }
    });
    authSubscription = data?.subscription ?? null;

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [router, supabase]);

  const ensureProfileRow = useCallback(
    async (targetUser) => {
      if (!supabase) return;
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
    [supabase, user]
  );

  const updateFreeUsage = useCallback(async () => {
    if (!PAYWALL_ENABLED) {
      setFreeInfo(unlimitedFreeInfo());
      return;
    }
    if (!supabase) {
      setFreeInfo(null);
      return;
    }
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
        setFreeInfo(unlimitedFreeInfo());
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
      if (PAYWALL_ENABLED) {
        setFreeInfo({ premium: false, used: 0, left: 20 });
      } else {
        setFreeInfo(unlimitedFreeInfo());
      }
    }
  }, [ensureProfileRow, supabase, user]);

  const loadProjects = useCallback(async () => {
    if (!supabase) {
      setProjects([]);
      setCurrentProjectId('');
      setLoadingProjects(false);
      return;
    }
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
  }, [supabase, user]);

  const loadBets = useCallback(
    async (projectId) => {
      if (!supabase) {
        setBets([]);
        setLoadingBets(false);
        return;
      }
      if (!user?.id || !projectId) {
        setBets([]);
        setLoadingBets(false);
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
    [supabase, updateFreeUsage, user]
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

  useEffect(() => {
    setEditingBet(null);
    setForm(initialForm());
  }, [currentProjectId]);

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

  const filteredBets = useMemo(
    () => (monthFilter === 'all' ? bets : bets.filter((bet) => bet.matchday?.startsWith(monthFilter))),
    [bets, monthFilter]
  );

  const summaryData = useMemo(() => {
    const decided = filteredBets.filter((bet) => bet.result !== 'Pending' && bet.result !== 'Void');
    const wins = decided.filter((bet) => bet.result === 'Win');
    const stakeSum = decided.reduce((sum, bet) => {
      const stakeNum = Number(bet.stake);
      return Number.isFinite(stakeNum) ? sum + stakeNum : sum;
    }, 0);
    const oddsSum = decided.reduce((sum, bet) => {
      const oddsNum = Number(bet.odds);
      return Number.isFinite(oddsNum) ? sum + oddsNum : sum;
    }, 0);
    const profit = decided.reduce((sum, bet) => sum + computeProfit(bet), 0);
    const roi = stakeSum > 0 ? (profit / stakeSum) * 100 : 0;
    const averageOdds = decided.length > 0 ? oddsSum / decided.length : 0;
    const averageStake = decided.length > 0 ? stakeSum / decided.length : 0;
    const hitRate = decided.length > 0 ? (wins.length / decided.length) * 100 : 0;
    const profitPerBet = decided.length > 0 ? profit / decided.length : 0;
    return {
      games: decided.length,
      wins: wins.length,
      profit,
      roi,
      stake: stakeSum,
      averageOdds,
      averageStake,
      hitRate,
      profitPerBet,
    };
  }, [filteredBets]);

  const ensureMonthOpen = useCallback((monthKey) => {
    if (!monthKey) return;
    setOpenMonths((prev) => {
      if (prev.has(monthKey)) return prev;
      const next = new Set(prev);
      next.add(monthKey);
      return next;
    });
  }, []);

  useEffect(() => {
    setOpenMonths((prev) => {
      const next = new Set();
      monthGroups.forEach(([key]) => {
        if (prev.has(key)) {
          next.add(key);
        }
      });
      if (next.size === prev.size && [...next].every((key) => prev.has(key))) {
        return prev;
      }
      return next;
    });
  }, [monthGroups]);

  const recentBets = useMemo(() => bets.slice(0, 3), [bets]);

  const performanceSeries = useMemo(() => {
    const decided = filteredBets
      .filter((bet) => bet.result !== 'Pending' && bet.result !== 'Void')
      .filter((bet) => !!bet.matchday);
    if (decided.length === 0) {
      return { points: [], min: 0, max: 0, start: null, end: null };
    }
    const sorted = [...decided].sort((a, b) => {
      const dateA = a.matchday ?? '';
      const dateB = b.matchday ?? '';
      if (dateA === dateB) {
        const createdA = a.created_at ?? '';
        const createdB = b.created_at ?? '';
        return createdA.localeCompare(createdB);
      }
      return dateA.localeCompare(dateB);
    });
    let running = 0;
    const points = sorted.map((bet) => {
      running += computeProfit(bet);
      return {
        date: bet.matchday.slice(0, 10),
        value: Math.round(running * 100) / 100,
      };
    });
    const values = points.map((p) => p.value);
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    return {
      points,
      min,
      max,
      start: points[0].date,
      end: points[points.length - 1].date,
    };
  }, [filteredBets]);

  const performanceChart = useMemo(() => {
    const { points, min, max } = performanceSeries;
    if (points.length === 0) {
      return { coords: [], linePoints: '', areaPoints: '', min: 0, max: 0 };
    }
    const range = max - min || 1;
    const coords = points.map((point, index) => {
      const x = points.length > 1 ? (index / (points.length - 1)) * 100 : 50;
      const y = 100 - ((point.value - min) / range) * 100;
      return { ...point, x, y };
    });
    const linePoints = coords.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const areaPoints = [
      ...coords.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`),
      `${coords[coords.length - 1].x.toFixed(2)},100.00`,
      `${coords[0].x.toFixed(2)},100.00`,
    ].join(' ');
    return { coords, linePoints, areaPoints, min, max };
  }, [performanceSeries]);

  const handleLogout = async () => {
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleNewProject = async () => {
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
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
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
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
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
    if (!user?.id || !currentProject) return;
    if (!window.confirm('Radera projektet och alla spel?')) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', currentProject.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setEditingBet(null);
      setForm(initialForm());
      setTab('reg');
      setProjects((prev) => prev.filter((p) => p.id !== currentProject.id));
      setCurrentProjectId('');
    } catch (err) {
      console.error('Kunde inte radera projekt', err);
      window.alert('Kunde inte radera projekt');
    }
  };

  const handleResetProject = async () => {
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
    if (!user?.id || !currentProject) return;
    if (!window.confirm('Ta bort alla spel i projektet?')) return;
    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('project_id', currentProject.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setEditingBet(null);
      setForm(initialForm());
      setTab('reg');
      loadBets(currentProject.id);
    } catch (err) {
      console.error('Kunde inte nollställa projekt', err);
      window.alert('Kunde inte nollställa projekt');
    }
  };

  const handleSaveBet = async () => {
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
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

    if (!editingBet && paywallLimitReached) {
      window.alert('Du har använt alla 20 gratis spel. Uppgradera för fler.');
      return;
    }

    try {
      if (editingBet?.id) {
        const { error } = await supabase
          .from('bets')
          .update({ matchday, match, market, odds, stake, book, result, note })
          .eq('id', editingBet.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
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
      }
      setForm(initialForm());
      setEditingBet(null);
      setTab('list');
      loadBets(currentProjectId);
    } catch (err) {
      console.error('Kunde inte spara spel', err);
      window.alert('Kunde inte spara spel');
    }
  };

  const handleStartEditBet = (bet) => {
    setEditingBet(bet);
    setTab('reg');
    setForm({
      date: bet.matchday ? bet.matchday.slice(0, 10) : new Date().toISOString().slice(0, 10),
      match: bet.match ?? '',
      market: bet.market ?? '',
      odds: bet.odds != null ? String(bet.odds) : '',
      stake: bet.stake != null ? String(bet.stake) : '',
      book: bet.book ?? '',
      result: bet.result ?? 'Pending',
      note: bet.note ?? '',
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingBet(null);
    setForm(initialForm());
  };

  const handleUpdateBetResult = async (bet, result) => {
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
    if (!user?.id) return;
    const betId = bet?.id;
    if (!betId) return;
    const monthKey = bet?.matchday ? bet.matchday.slice(0, 7) : null;
    try {
      const { error } = await supabase
        .from('bets')
        .update({ result })
        .eq('id', betId)
        .eq('user_id', user.id);
      if (error) throw error;
      if (monthKey) {
        ensureMonthOpen(monthKey);
      }
      loadBets(currentProjectId);
    } catch (err) {
      console.error('Kunde inte uppdatera resultat', err);
      window.alert('Kunde inte uppdatera resultat');
    }
  };

  const handleDeleteBet = async (betId) => {
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
    if (!user?.id) return;
    if (!window.confirm('Ta bort spelet?')) return;
    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', betId)
        .eq('user_id', user.id);
      if (error) throw error;
      if (editingBet?.id === betId) {
        handleCancelEdit();
      }
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

  const isEditing = !!editingBet;
  const isSubmitDisabled = !currentProjectId || (!isEditing && paywallLimitReached);

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
  const chartLatestValue =
    performanceSeries.points.length > 0
      ? performanceSeries.points[performanceSeries.points.length - 1].value
      : 0;
  const chartLatestFormatted = formatMoney(chartLatestValue);
  const chartTrendClass = chartLatestValue >= 0 ? 'positive' : 'negative';
  const chartStartLabel = performanceSeries.start ? formatDay(performanceSeries.start) : '–';
  const chartEndLabel = performanceSeries.end ? formatDay(performanceSeries.end) : '–';
  const editingDateLabel = editingBet?.matchday
    ? formatDay(editingBet.matchday.slice(0, 10))
    : null;
  const chartHasData = performanceChart.coords.length > 0;
  const lastChartPoint = chartHasData
    ? performanceChart.coords[performanceChart.coords.length - 1]
    : null;
  const chartMaxValue = formatMoney(performanceChart.max ?? 0);
  const chartMinValue = formatMoney(performanceChart.min ?? 0);
  const chartZeroValue = formatMoney(0);
  const projectInitials = useMemo(() => {
    const name = currentProject?.name ?? '';
    const trimmed = name.trim();
    if (!trimmed) return 'BS';
    const compact = trimmed.replace(/\s+/g, '');
    if (!compact) return 'BS';
    if (compact.length <= 4) {
      return compact.toUpperCase();
    }
    return compact.slice(0, 4).toUpperCase();
  }, [currentProject]);
  const showRecentPanel = tab !== 'list';

  if (supabaseError) {
    return (
      <main
        style={{
          maxWidth: '640px',
          margin: '4rem auto',
          padding: '2.5rem',
          borderRadius: '1.5rem',
          background: '#ffffff',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.12)',
          color: '#0f172a',
          lineHeight: 1.6,
        }}
      >
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Konfigurationsfel</h1>
        <p style={{ marginBottom: '1rem' }}>
          BetSpread kan inte koppla upp sig mot din Supabase-databas eftersom nödvändiga
          miljövariabler saknas. Lägg till <code>NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code>SUPABASE_URL</code> och{' '}
          <code>SUPABASE_SERVICE_ROLE</code> i din miljö och deploya på nytt.
        </p>
        <p style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{supabaseError}</p>
        <p style={{ fontSize: '0.95rem', color: '#475569' }}>
          När variablerna är satta kommer denna sida att ladda om och ansluta automatiskt.
        </p>
      </main>
    );
  }

  return (
    <div className="container">
      <header className="top-bar">
        <div className="brand-block">
          <div className="brand">BetSpread</div>
          <p className="tagline">Planera, följ upp och förbättra dina spel.</p>
        </div>
        <div className="right-actions">
          <span className="badge">{user?.email || 'Ingen e-post'}</span>
          {PAYWALL_ENABLED && freeInfo?.premium ? (
            <button type="button" id="manageBillingBtn" onClick={handleManageBilling}>
              Hantera
            </button>
          ) : null}
          {PAYWALL_ENABLED && !freeInfo?.premium ? (
            <button type="button" id="upgradeBtn" className="btn-green" onClick={handleUpgrade}>
              Uppgradera
            </button>
          ) : null}
          <button type="button" className="btn-red" onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className={`workspace${showRecentPanel ? '' : ' no-sidebar'}`}>
        <section className="primary">
          <div className="panel project-panel">
            <div className="project-shell">
              <div className="project-identity">
                <span className="project-symbol" aria-hidden="true">
                  {projectInitials}
                </span>
                <div>
                  <h2>Projekt</h2>
                  <p className="hint">{currentProject?.name || 'Inget projekt valt'}</p>
                </div>
              </div>
              <div className="project-meta-chip">
                <span>Projekt totalt</span>
                <strong>{projects.length}</strong>
              </div>
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
            </div>
            {isEditing ? (
              <div className="edit-indicator">
                <div className="edit-copy">
                  <span className="edit-title">Redigerar spel</span>
                  <span className="edit-meta">
                    {editingBet?.match ? editingBet.match : 'Uppdatera detaljer nedan.'}
                    {editingDateLabel ? ` • ${editingDateLabel}` : ''}
                  </span>
                </div>
                <button type="button" className="btn-ghost" onClick={handleCancelEdit}>
                  Avbryt
                </button>
              </div>
            ) : null}
            <div className="grid">
              <div className="col-3 field">
                <label htmlFor="iDate">Matchdag</label>
                <input
                  id="iDate"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="col-5 field">
                <label htmlFor="iMatch">Match</label>
                <input
                  id="iMatch"
                  type="text"
                  placeholder="Arsenal — Chelsea"
                  value={form.match}
                  onChange={(e) => setForm((prev) => ({ ...prev, match: e.target.value }))}
                />
              </div>
              <div className="col-4 field">
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
                <label htmlFor="iOdds">Odds</label>
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
              <div className="col-2 field">
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
              <div className="col-3 field">
                <label htmlFor="iBook">Spelbolag</label>
                <input
                  id="iBook"
                  type="text"
                  placeholder="Bet365"
                  value={form.book}
                  onChange={(e) => setForm((prev) => ({ ...prev, book: e.target.value }))}
                />
              </div>
              <div className="col-3 field">
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
              <div className="col-12 field">
                <label htmlFor="iNote">Notering</label>
                <input
                  id="iNote"
                  type="text"
                  placeholder="Ex. sent mål, cashout, etc."
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>
              <div className="col-12 field action-field">
                <span className="sr-only">Åtgärder</span>
                <div className="actions">
                  <button type="button" className="btn-green" onClick={handleSaveBet} disabled={isSubmitDisabled}>
                    {isEditing ? 'Spara ändringar' : 'Lägg till spel'}
                  </button>
                  {isEditing ? (
                    <button type="button" className="btn-ghost" onClick={handleCancelEdit}>
                      Avbryt redigering
                    </button>
                  ) : null}
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
                      {formatMonth(key)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-card">
                <span className="label">Avgjorda spel</span>
                <span className="value">{summaryData.games}</span>
              </div>
              <div className="stat-card">
                <span className="label">Vinster</span>
                <span className="value">{summaryData.wins}</span>
              </div>
              <div className="stat-card">
                <span className="label">Nettoresultat</span>
                <span className={`value ${summaryData.profit >= 0 ? 'positive' : 'negative'}`}>
                  {formatMoney(summaryData.profit)}
                </span>
              </div>
              <div className="stat-card">
                <span className="label">ROI</span>
                <span className={`value ${summaryData.roi >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(summaryData.roi)}
                </span>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <span className="chart-title">Utveckling</span>
                  <p className="chart-subtitle">Kumulativt nettoresultat – {summaryMonthName}</p>
                </div>
                <div className="chart-total">
                  <span className={`chart-total-value ${chartTrendClass}`}>{chartLatestFormatted}</span>
                  <span className="chart-total-label">Senaste värde</span>
                </div>
              </div>
              <div className="chart-body">
                {chartHasData ? (
                  <div className="chart-visual">
                    <div className="y-scale" aria-hidden="true">
                      <span>{chartMaxValue}</span>
                      <span>{chartZeroValue}</span>
                      <span>{chartMinValue}</span>
                    </div>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Linje som visar projektets utveckling">
                      <defs>
                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                          <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                        </linearGradient>
                        <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <polygon points={performanceChart.areaPoints} fill="url(#trendFill)" />
                      <polyline
                        points={performanceChart.linePoints}
                        fill="none"
                        stroke="url(#trendStroke)"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {lastChartPoint ? (
                        <circle cx={lastChartPoint.x} cy={lastChartPoint.y} r="2.4" fill="#38bdf8" />
                      ) : null}
                    </svg>
                  </div>
                ) : (
                  <div className="chart-empty">Ingen avgjord historik för perioden ännu.</div>
                )}
              </div>
              <div className="chart-footer">
                <span>{chartStartLabel}</span>
                <span>{summaryMonthName}</span>
                <span>{chartEndLabel}</span>
              </div>
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
                  <details
                    key={key}
                    className="month"
                    open={openMonths.has(key)}
                    onToggle={(event) => {
                      const isOpen = event.currentTarget.open;
                      setOpenMonths((prev) => {
                        const next = new Set(prev);
                        if (isOpen) {
                          next.add(key);
                        } else {
                          next.delete(key);
                        }
                        return next;
                      });
                    }}
                  >
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
                          <div className="result-controls">
                            <span className={`status-badge ${bet.result ? bet.result.toLowerCase() : 'pending'}`}>
                              {bet.result || 'Pending'}
                            </span>
                            <select
                              className="result-select"
                              value={bet.result}
                              onChange={(e) => handleUpdateBetResult(bet, e.target.value)}
                              aria-label="Uppdatera resultat"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Win">Win</option>
                              <option value="Loss">Loss</option>
                              <option value="Void">Void</option>
                            </select>
                            <button type="button" className="btn-ghost" onClick={() => handleStartEditBet(bet)}>
                              Redigera
                            </button>
                            <button
                              type="button"
                              className="btn-ghost danger"
                              onClick={() => handleDeleteBet(bet.id)}
                            >
                              Ta bort
                            </button>
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

        {showRecentPanel ? (
          <aside className="secondary">
            <section className="panel recent-panel">
              <div className="section-header compact">
                <div>
                  <h2>Senaste spel</h2>
                  <p className="hint">Snabbhantera de tre senaste spelen direkt här.</p>
                </div>
              </div>
              {recentBets.length === 0 ? (
                <div className="empty-state small">Ingen historik ännu.</div>
              ) : (
                <ul className="recent-list">
                  {recentBets.map((bet) => {
                    const result = bet.result ?? 'Pending';
                    const statusClass = (result || 'Pending').toLowerCase();
                    const matchdayLabel = bet.matchday
                      ? formatDay(bet.matchday.slice(0, 10))
                      : '–';
                    const selectId = `recentResult-${bet.id}`;
                    return (
                      <li key={bet.id}>
                        <div className="recent-summary">
                          <span className="recent-icon" data-status={statusClass} aria-hidden="true" />
                          <div className="recent-copy">
                            <span className="recent-match">{bet.match || 'Okänd match'}</span>
                            <span className="recent-market">{bet.market || 'Ingen marknad angiven'}</span>
                            <div className="recent-meta">
                              <span>{matchdayLabel}</span>
                              <span>Odds {formatNumber(bet.odds, 2)}</span>
                              <span>Insats {formatStake(bet.stake)}</span>
                            </div>
                          </div>
                          <span className={`recent-status ${statusClass}`}>{result}</span>
                        </div>
                        <div className="recent-actions">
                          <div className="recent-control-row" role="group" aria-label="Snabbuppdatera resultat">
                            <div className="quick-status-group">
                              {RESULT_OPTIONS.map((option) => {
                                const optionKey = option.toLowerCase();
                                const isActive = option === result;
                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    className={`quick-status-btn ${optionKey} ${isActive ? 'active' : ''}`}
                                    onClick={() => handleUpdateBetResult(bet, option)}
                                    disabled={isActive}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="quick-select">
                              <label className="sr-only" htmlFor={selectId}>
                                Ändra resultat
                              </label>
                              <select
                                id={selectId}
                                value={result}
                                onChange={(e) => handleUpdateBetResult(bet, e.target.value)}
                              >
                                {RESULT_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="quick-manage">
                            <button type="button" className="btn-ghost" onClick={() => handleStartEditBet(bet)}>
                              Redigera
                            </button>
                            <button
                              type="button"
                              className="btn-ghost danger"
                              onClick={() => handleDeleteBet(bet.id)}
                            >
                              Ta bort
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </aside>
        ) : null}
      </main>

      <style jsx global>{`
        body {
          background: radial-gradient(120% 120% at 20% -10%, #1e293b 0%, #0b1120 50%, #020617 100%);
          color: #e2e8f0;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
        }
        .container {
          width: min(1240px, 100%);
          margin: 0 auto;
          padding: 48px 24px 72px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        header.top-bar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 24px;
          padding: 28px 32px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(59, 130, 246, 0.22));
          border: 1px solid rgba(59, 130, 246, 0.28);
          box-shadow: 0 32px 60px -38px rgba(15, 23, 42, 0.88), 0 20px 48px -34px rgba(30, 64, 175, 0.6);
          backdrop-filter: blur(16px);
        }
        .brand-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .brand {
          font-size: clamp(28px, 4vw, 34px);
          font-weight: 800;
          letter-spacing: 0.015em;
          background: linear-gradient(135deg, #38bdf8 0%, #a855f7 45%, #f472b6 100%);
          -webkit-background-clip: text;
          color: transparent;
        }
        .tagline {
          margin: 0;
          color: rgba(226, 232, 240, 0.76);
          font-size: 15px;
        }
        .right-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
        }
        .badge {
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(148, 163, 184, 0.35);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .container button {
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 12px;
          padding: 12px 18px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: #f8fafc;
          background: rgba(30, 41, 59, 0.72);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border 0.2s ease;
        }
        .container button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px -18px rgba(59, 130, 246, 0.55);
          background: rgba(30, 64, 175, 0.62);
          border-color: rgba(59, 130, 246, 0.45);
        }
        .container button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .btn-green {
          background: linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%);
          border: 1px solid rgba(14, 165, 233, 0.65);
          box-shadow: 0 18px 34px -20px rgba(14, 165, 233, 0.65);
        }
        .btn-green:hover:not(:disabled) {
          background: linear-gradient(135deg, #0ea5e9, #2563eb);
        }
        .btn-red {
          background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
          border: 1px solid rgba(239, 68, 68, 0.55);
          box-shadow: 0 18px 34px -20px rgba(248, 113, 113, 0.6);
        }
        .btn-red:hover:not(:disabled) {
          background: linear-gradient(135deg, #ef4444, #b91c1c);
        }
        .btn-ghost {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: rgba(226, 232, 240, 0.85);
        }
        .btn-ghost:hover:not(:disabled) {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(148, 163, 184, 0.45);
        }
        .btn-ghost.danger {
          color: #fca5a5;
          border-color: rgba(248, 113, 113, 0.35);
        }
        .btn-ghost.danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.55);
        }
        .hint {
          color: rgba(148, 163, 184, 0.9);
          font-size: 14px;
          margin: 6px 0 0;
        }
        .workspace {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 28px;
          align-items: start;
        }
        .workspace.no-sidebar {
          grid-template-columns: minmax(0, 1fr);
        }
        .primary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .panel {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(11, 22, 43, 0.88));
          border-radius: 24px;
          border: 1px solid rgba(51, 65, 85, 0.55);
          box-shadow: 0 26px 60px -34px rgba(2, 6, 23, 0.85);
          padding: 28px 30px;
        }
        .panel.hide {
          display: none;
        }
        .project-panel {
          position: relative;
          overflow: hidden;
          padding: 26px 28px;
          background: linear-gradient(160deg, rgba(8, 16, 32, 0.92), rgba(30, 64, 175, 0.14));
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .project-panel::after {
          content: '';
          position: absolute;
          inset: -140px -160px auto auto;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.25), transparent 70%);
          opacity: 0.55;
          pointer-events: none;
        }
        .project-panel > * {
          position: relative;
          z-index: 1;
        }
        .project-shell {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 22px;
        }
        .project-identity {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .project-symbol {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 52px;
          height: 52px;
          padding: 0 18px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(56, 189, 248, 0));
          border: 1px solid rgba(148, 163, 184, 0.35);
          font-weight: 700;
          letter-spacing: 0.08em;
          font-size: 16px;
          color: rgba(226, 232, 240, 0.92);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .project-identity h2 {
          margin: 0;
          font-size: 22px;
          letter-spacing: 0.015em;
        }
        .project-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.35);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.85);
        }
        .project-meta-chip strong {
          font-size: 15px;
          color: #f8fafc;
          letter-spacing: 0.08em;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .section-header h2 {
          margin: 0;
          font-size: 22px;
          letter-spacing: 0.015em;
        }
        .section-header.compact {
          margin-bottom: 20px;
        }
        .project-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .project-controls label {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.95);
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
          font: inherit;
        }
        .project-controls select,
        .form-panel select,
        .form-panel input,
        .form-panel textarea,
        .summary-panel select {
          background: rgba(8, 16, 32, 0.92);
          border: 1px solid rgba(71, 85, 105, 0.55);
          border-radius: 14px;
          color: #e2e8f0;
          padding: 12px 16px;
          min-height: 48px;
          transition: border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .project-controls select:focus-visible,
        .form-panel select:focus-visible,
        .form-panel input:focus-visible,
        .form-panel textarea:focus-visible,
        .summary-panel select:focus-visible {
          outline: none;
          border-color: rgba(96, 165, 250, 0.65);
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25);
          background: rgba(15, 23, 42, 0.95);
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
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(71, 85, 105, 0.45);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .tab {
          flex: 1;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(203, 213, 225, 0.75);
          padding: 12px 16px;
          font-weight: 600;
          letter-spacing: 0.015em;
          cursor: pointer;
          transition: background 0.2s ease, border 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .tab:hover {
          color: #f8fafc;
          transform: translateY(-1px);
        }
        .tab.active {
          color: #f8fafc;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.26), rgba(168, 85, 247, 0.22));
          border-color: rgba(96, 165, 250, 0.55);
          box-shadow: 0 14px 30px -18px rgba(56, 189, 248, 0.6);
        }
        .form-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 18px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .field label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(148, 163, 184, 0.85);
        }
        textarea {
          min-height: 96px;
          resize: vertical;
        }
        .edit-indicator {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 18px;
          border-radius: 16px;
          background: rgba(30, 64, 175, 0.22);
          border: 1px solid rgba(96, 165, 250, 0.35);
        }
        .edit-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .edit-title {
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(191, 219, 254, 0.9);
        }
        .edit-meta {
          font-size: 14px;
          color: rgba(191, 219, 254, 0.8);
        }
        .action-field .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        .summary-panel .filter {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 220px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 16px 18px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(71, 85, 105, 0.45);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .stat-card .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(148, 163, 184, 0.75);
        }
        .stat-card .value {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.015em;
        }
        .positive {
          color: #34d399;
        }
        .negative {
          color: #f87171;
        }
        .chart-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px 26px 28px;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(56, 189, 248, 0.18);
          box-shadow: 0 30px 70px -45px rgba(56, 189, 248, 0.5);
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
        }
        .chart-title {
          display: block;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-bottom: 6px;
        }
        .chart-subtitle {
          margin: 0;
          color: rgba(148, 163, 184, 0.8);
          font-size: 14px;
        }
        .chart-total {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .chart-total-value {
          font-size: 28px;
          font-weight: 700;
        }
        .chart-total-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(148, 163, 184, 0.75);
        }
        .chart-body {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 0;
        }
        .chart-footer {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: rgba(148, 163, 184, 0.8);
          letter-spacing: 0.03em;
        }
        .list-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .empty-state {
          padding: 48px 24px;
          text-align: center;
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.45);
          color: rgba(148, 163, 184, 0.85);
          font-size: 15px;
        }
        details.month {
          border: 1px solid rgba(71, 85, 105, 0.4);
          border-radius: 18px;
          overflow: hidden;
          background: rgba(11, 18, 38, 0.85);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        details.month + details.month {
          margin-top: 14px;
        }
        details.month summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          font-weight: 600;
          letter-spacing: 0.015em;
          background: rgba(15, 23, 42, 0.78);
        }
        details.month summary::-webkit-details-marker {
          display: none;
        }
        .month-count {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.8);
          background: rgba(30, 41, 59, 0.6);
          border-radius: 999px;
          padding: 6px 12px;
        }
        .row {
          display: grid;
          grid-template-columns: minmax(80px, 1fr) minmax(180px, 1.8fr) repeat(4, minmax(80px, 1fr));
          gap: 12px;
          padding: 16px 22px;
          align-items: center;
          border-top: 1px solid rgba(71, 85, 105, 0.35);
        }
        .row-head {
          background: rgba(30, 41, 59, 0.5);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(148, 163, 184, 0.7);
        }
        .row div {
          font-size: 14px;
          color: rgba(226, 232, 240, 0.88);
        }
        .row .cell-match {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .row .match {
          font-weight: 600;
        }
        .row .market {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.8);
        }
        .note-cell {
          color: rgba(148, 163, 184, 0.85);
        }
        .result-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
        }
        .result-select {
          background: rgba(8, 16, 32, 0.92);
          border: 1px solid rgba(71, 85, 105, 0.45);
          border-radius: 12px;
          color: #e2e8f0;
          padding: 8px 12px;
        }
        .status-badge {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .status-badge.pending {
          background: rgba(234, 179, 8, 0.18);
          color: #fbbf24;
          border: 1px solid rgba(234, 179, 8, 0.35);
        }
        .status-badge.win {
          background: rgba(34, 197, 94, 0.18);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }
        .status-badge.loss {
          background: rgba(248, 113, 113, 0.18);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.4);
        }
        .status-badge.void {
          background: rgba(148, 163, 184, 0.2);
          color: rgba(148, 163, 184, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.35);
        }
        .secondary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .chart-body {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 0;
          min-height: 240px;
        }
        .chart-visual {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          width: 100%;
          align-items: stretch;
        }
        .chart-visual svg {
          width: 100%;
          height: 220px;
          border-radius: 16px;
          background: radial-gradient(circle at top, rgba(56, 189, 248, 0.08), rgba(15, 23, 42, 0.94));
          border: 1px solid rgba(56, 189, 248, 0.18);
        }
        .y-scale {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 12px;
          color: rgba(148, 163, 184, 0.75);
          padding: 8px 0;
        }
        .chart-empty {
          width: 100%;
          padding: 32px 18px;
          text-align: center;
          border-radius: 16px;
          background: rgba(8, 16, 32, 0.72);
          border: 1px solid rgba(71, 85, 105, 0.45);
          color: rgba(148, 163, 184, 0.78);
        }
        .recent-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: sticky;
          top: 32px;
        }
        .recent-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .recent-list li {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px 18px;
          border-radius: 16px;
          background: rgba(8, 16, 32, 0.72);
          border: 1px solid rgba(51, 65, 85, 0.45);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .recent-summary {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
        }
        .recent-icon {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.5);
          box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.14);
        }
        .recent-icon[data-status='win'] {
          background: #4ade80;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
        }
        .recent-icon[data-status='loss'] {
          background: #f87171;
          box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.2);
        }
        .recent-icon[data-status='pending'] {
          background: #fbbf24;
          box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.2);
        }
        .recent-icon[data-status='void'] {
          background: rgba(148, 163, 184, 0.8);
          box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.2);
        }
        .recent-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .recent-match {
          font-weight: 600;
          color: #e2e8f0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recent-market {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.78);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recent-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 12px;
          color: rgba(148, 163, 184, 0.65);
        }
        .recent-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .recent-control-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .quick-status-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .quick-select select {
          background: rgba(8, 16, 32, 0.92);
          border: 1px solid rgba(71, 85, 105, 0.45);
          border-radius: 12px;
          color: #e2e8f0;
          padding: 8px 12px;
          font-size: 13px;
        }
        .quick-select select:focus {
          outline: none;
          border-color: rgba(56, 189, 248, 0.6);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
        }
        .quick-status-btn {
          border-radius: 999px;
          border: 1px solid rgba(71, 85, 105, 0.4);
          background: rgba(15, 23, 42, 0.55);
          color: rgba(226, 232, 240, 0.85);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 12px;
          transition: background 0.2s ease, border 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .quick-status-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.45);
          background: rgba(30, 64, 175, 0.4);
        }
        .quick-status-btn.pending.active,
        .quick-status-btn.pending:disabled {
          background: rgba(234, 179, 8, 0.18);
          border-color: rgba(234, 179, 8, 0.35);
          color: #fbbf24;
        }
        .quick-status-btn.win.active,
        .quick-status-btn.win:disabled {
          background: rgba(34, 197, 94, 0.18);
          border-color: rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }
        .quick-status-btn.loss.active,
        .quick-status-btn.loss:disabled {
          background: rgba(248, 113, 113, 0.18);
          border-color: rgba(248, 113, 113, 0.4);
          color: #f87171;
        }
        .quick-status-btn.void.active,
        .quick-status-btn.void:disabled {
          background: rgba(148, 163, 184, 0.2);
          border-color: rgba(148, 163, 184, 0.35);
          color: rgba(148, 163, 184, 0.9);
        }
        .quick-status-btn:disabled {
          cursor: default;
          transform: none;
        }
        .quick-manage {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .recent-status {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          justify-self: end;
          align-self: start;
        }
        .recent-status.win {
          color: #4ade80;
        }
        .recent-status.loss {
          color: #f87171;
        }
        .recent-status.pending {
          color: #fbbf24;
        }
        .recent-status.void {
          color: rgba(148, 163, 184, 0.9);
        }
        .empty-state.small {
          font-size: 14px;
          padding: 12px 0;
          text-align: left;
          color: rgba(148, 163, 184, 0.8);
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
        @media (max-width: 1024px) {
          .workspace {
            grid-template-columns: minmax(0, 1fr);
          }
          .recent-panel {
            position: static;
          }
        }
        @media (max-width: 820px) {
          .container {
            padding: 40px 20px 64px;
          }
          header.top-bar {
            grid-template-columns: minmax(0, 1fr);
            justify-items: flex-start;
            padding: 24px;
          }
          .right-actions {
            justify-content: flex-start;
          }
          .tabs {
            flex-direction: column;
          }
        }
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
          .col-7,
          .col-8,
          .col-9,
          .col-10,
          .col-11,
          .col-12 {
            grid-column: span 6;
          }
          .row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
          .row-head {
            display: none;
          }
          .row div {
            display: flex;
            justify-content: space-between;
            width: 100%;
            gap: 12px;
          }
          .row div::before {
            content: attr(data-label);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: rgba(148, 163, 184, 0.7);
          }
          .result-controls {
            justify-content: flex-start;
          }
        }
        @media (max-width: 520px) {
          .container {
            padding: 32px 16px 52px;
          }
          .panel {
            padding: 22px 20px;
          }
          .chart-body {
            min-height: 220px;
          }
          .recent-list li {
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
          }
          .recent-status {
            align-self: flex-start;
          }
        }
        .col-1 { grid-column: span 1; }
        .col-2 { grid-column: span 2; }
        .col-3 { grid-column: span 3; }
        .col-4 { grid-column: span 4; }
        .col-5 { grid-column: span 5; }
        .col-6 { grid-column: span 6; }
        .col-7 { grid-column: span 7; }
        .col-8 { grid-column: span 8; }
        .col-9 { grid-column: span 9; }
        .col-10 { grid-column: span 10; }
        .col-11 { grid-column: span 11; }
        .col-12 { grid-column: span 12; }
      `}</style>

    </div>
  );
}
