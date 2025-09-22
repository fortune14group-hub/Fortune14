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

const DEFAULT_UNIT = 'units';

const UNIT_METADATA = {
  units: { label: 'Units', symbol: 'U', position: 'suffix', separator: '' },
  kr: { label: 'Kr', symbol: 'kr', position: 'suffix', separator: ' ' },
  eur: { label: 'EUR', symbol: '€', position: 'prefix', separator: '' },
  usd: { label: 'USD', symbol: '$', position: 'prefix', separator: '' },
};

const sanitizeUnit = (unit) => {
  if (typeof unit !== 'string') return DEFAULT_UNIT;
  const key = unit.toLowerCase();
  return UNIT_METADATA[key] ? key : DEFAULT_UNIT;
};

const isMissingProjectUnitColumn = (error) => {
  if (!error) return false;
  if (error.code && `${error.code}` === '42703') {
    return true;
  }
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return message.includes('column') && message.includes('unit');
};

const formatValueWithUnit = (value, unit = DEFAULT_UNIT, decimals = 2, { trimZeros = false } = {}) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '–';
  const meta = UNIT_METADATA[unit] ?? UNIT_METADATA[DEFAULT_UNIT];
  const factor = 10 ** decimals;
  const rounded = Math.round(num * factor) / factor;
  const absText = Math.abs(rounded).toFixed(decimals);
  const text = trimZeros
    ? absText.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
    : absText;
  const sign = rounded < 0 ? '-' : '';
  if (meta.position === 'prefix') {
    return `${sign}${meta.symbol}${meta.separator}${text}`.trim();
  }
  return `${sign}${text}${meta.separator}${meta.symbol}`.trim();
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
  const [supportsProjectUnits, setSupportsProjectUnits] = useState(true);
  const [loadingBets, setLoadingBets] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  const [projectOpen, setProjectOpen] = useState(false);
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
      let allowUnits = supportsProjectUnits;
      const fetchProjects = async (withUnits) => {
        const columns = withUnits ? 'id,name,unit' : 'id,name';
        return supabase
          .from('projects')
          .select(columns)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
      };

      let data = null;
      if (supportsProjectUnits) {
        const response = await fetchProjects(true);
        if (response.error) {
          if (isMissingProjectUnitColumn(response.error)) {
            setSupportsProjectUnits(false);
            allowUnits = false;
            const fallback = await fetchProjects(false);
            if (fallback.error) throw fallback.error;
            data = fallback.data ?? [];
          } else {
            throw response.error;
          }
        } else {
          data = response.data ?? [];
        }
      } else {
        const response = await fetchProjects(false);
        if (response.error) throw response.error;
        data = response.data ?? [];
      }

      const list = (data ?? []).map((project) => ({
        ...project,
        unit: allowUnits ? sanitizeUnit(project.unit) : DEFAULT_UNIT,
      }));
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
  }, [supabase, supportsProjectUnits, user]);

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

  const projectBadge = useMemo(() => {
    if (!currentProject?.name) return '---';
    const compact = currentProject.name.replace(/\s+/g, '');
    if (!compact) return '---';
    return compact.slice(0, 4).toUpperCase();
  }, [currentProject]);

  useEffect(() => {
    if (!loadingProjects && (projects.length === 0 || !currentProjectId)) {
      setProjectOpen(true);
    }
  }, [currentProjectId, loadingProjects, projects]);

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

  const latestBets = useMemo(() => bets.slice(0, 3), [bets]);
  const showLatestPanel = tab !== 'list';
  const workspaceClassName = `workspace${showLatestPanel ? '' : ' full-width'}`;

  const summaryData = useMemo(() => {
    const decided = filteredBets.filter((bet) => bet.result !== 'Pending' && bet.result !== 'Void');
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
  }, [filteredBets]);

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
      const attemptInsert = async (withUnits) => {
        const payload = { name, user_id: user.id };
        if (withUnits) {
          payload.unit = DEFAULT_UNIT;
        }
        const columns = withUnits ? 'id,name,unit' : 'id,name';
        return supabase.from('projects').insert(payload).select(columns).single();
      };

      let allowUnits = supportsProjectUnits;
      let response = await attemptInsert(supportsProjectUnits);
      if (response.error && supportsProjectUnits && isMissingProjectUnitColumn(response.error)) {
        setSupportsProjectUnits(false);
        allowUnits = false;
        response = await attemptInsert(false);
      }
      if (response.error) throw response.error;
      const data = response.data;
      const nextProject = allowUnits
        ? { ...data, unit: sanitizeUnit(data.unit) }
        : { ...data, unit: DEFAULT_UNIT };
      setProjects((prev) => [...prev, nextProject]);
      setCurrentProjectId(nextProject.id);
      loadBets(nextProject.id);
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

  const handleUpdateBetResult = async (betId, result) => {
    if (!supabase) {
      window.alert('Supabase är inte konfigurerat.');
      return;
    }
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

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Kunde inte hämta Supabase-session', error);
        return null;
      }
      return data?.session?.access_token ?? null;
    } catch (err) {
      console.error('Oväntat fel vid hämtning av session', err);
      return null;
    }
  }, [supabase]);

  const handleUpgrade = async () => {
    if (!user?.id) return;
    try {
      await ensureProfileRow(user);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        window.alert('Din session har gått ut. Logga in igen och försök på nytt.');
        return;
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
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
      const accessToken = await getAccessToken();
      if (!accessToken) {
        window.alert('Din session har gått ut. Logga in igen och försök på nytt.');
        return;
      }

      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
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
  const currentUnit = sanitizeUnit(currentProject?.unit);
  const currentUnitMeta = UNIT_METADATA[currentUnit] ?? UNIT_METADATA[DEFAULT_UNIT];
  const formatUnitValue = useCallback(
    (value, decimals = 2, options = {}) => formatValueWithUnit(value, currentUnit, decimals, options),
    [currentUnit]
  );
  const formatMoney = useCallback(
    (value, decimals = 2) => formatUnitValue(value, decimals, { trimZeros: true }),
    [formatUnitValue]
  );
  const formatNumber = (value, decimals = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : '–';
  };
  const formatStake = useCallback(
    (value, decimals = 2) => formatUnitValue(value, decimals, { trimZeros: true }),
    [formatUnitValue]
  );

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

      {PAYWALL_ENABLED && !freeInfo?.premium ? (
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

      <main className={workspaceClassName}>
        <section className="primary">
          <div className={`panel project-panel ${projectOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="project-toggle"
              onClick={() => setProjectOpen((prev) => !prev)}
              aria-expanded={projectOpen}
            >
              <div className="project-avatar">
                <span>{projectBadge}</span>
              </div>
              <div className="project-summary">
                <h2>Projekt</h2>
                <span className="project-name">{currentProject?.name || 'Inget projekt valt'}</span>
                <span className="project-count">
                  Projekt totalt: <strong>{projects.length}</strong>
                </span>
              </div>
              <span className={`chevron ${projectOpen ? 'open' : ''}`} aria-hidden="true" />
            </button>
            {projectOpen ? (
              <div className="project-dropdown">
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
            ) : null}
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
                <span className="label">Spel (avgjorda)</span>
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
                          <div className="result-controls">
                            <span className={`status-badge ${bet.result ? bet.result.toLowerCase() : 'pending'}`}>
                              {bet.result || 'Pending'}
                            </span>
                            <select
                              className="result-select"
                              value={bet.result}
                              onChange={(e) => handleUpdateBetResult(bet.id, e.target.value)}
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

        {showLatestPanel ? (
          <aside className="secondary">
            <section className="panel latest-panel">
              <div className="section-header compact">
                <div>
                  <h2>Senaste spel</h2>
                  <span className="subtle-tag">
                    {currentProjectId
                      ? `Enhet: ${currentUnitMeta.label}`
                      : 'Välj eller skapa ett projekt'}
                  </span>
                </div>
              </div>
              {currentProjectId && latestBets.length > 0 ? (
                <div className="latest-list">
                  {latestBets.map((bet, index) => (
                    <details key={bet.id} className="latest-item" open={index === 0}>
                      <summary>
                        <div className="latest-summary">
                          <span className="latest-match">{bet.match || '–'}</span>
                          <span className={`status-badge ${bet.result ? bet.result.toLowerCase() : 'pending'}`}>
                            {bet.result || 'Pending'}
                          </span>
                        </div>
                        <span className="latest-date">
                          {bet.matchday ? formatDay(bet.matchday.slice(0, 10)) : '–'}
                        </span>
                      </summary>
                      <div className="latest-body">
                        <div className="latest-meta">
                          {bet.market ? (
                            <span>
                              <strong>Marknad:</strong> {bet.market}
                            </span>
                          ) : null}
                          <span>
                            <strong>Odds:</strong> {formatNumber(bet.odds, 2)}
                          </span>
                          <span>
                            <strong>Insats:</strong> {formatStake(bet.stake)}
                          </span>
                          <span>
                            <strong>Utfall:</strong> {formatMoney(computeProfit(bet))}
                          </span>
                          {bet.book ? (
                            <span>
                              <strong>Spelbolag:</strong> {bet.book}
                            </span>
                          ) : null}
                          {bet.note ? (
                            <span>
                              <strong>Notering:</strong> {bet.note}
                            </span>
                          ) : null}
                        </div>
                        <div className="latest-actions">
                          <div className="quick-actions" role="group" aria-label="Snabbresultat">
                            {['Pending', 'Win', 'Loss', 'Void'].map((result) => (
                              <button
                                key={result}
                                type="button"
                                className={`quick-action ${bet.result === result ? 'active' : ''}`}
                                onClick={() => handleUpdateBetResult(bet.id, result)}
                                disabled={bet.result === result}
                              >
                                {result}
                              </button>
                            ))}
                          </div>
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
                    </details>
                  ))}
                </div>
              ) : (
                <div className="latest-empty">
                  {currentProjectId
                    ? 'Inga spel registrerade ännu. Lägg till ditt första spel.'
                    : 'Välj eller skapa ett projekt för att visa senaste spel.'}
                </div>
              )}
            </section>
          </aside>
        ) : null}
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
        .btn-ghost {
          background: rgba(26, 39, 66, 0.65);
          border: 1px solid rgba(78, 106, 150, 0.5);
          color: rgba(226, 232, 255, 0.88);
        }
        .btn-ghost:hover {
          background: rgba(41, 57, 92, 0.85);
          border-color: rgba(129, 140, 248, 0.45);
        }
        .btn-ghost.danger {
          color: #fca5a5;
          border-color: rgba(248, 113, 113, 0.45);
        }
        .btn-ghost.danger:hover {
          background: rgba(127, 29, 29, 0.2);
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
        .workspace.full-width {
          grid-template-columns: minmax(0, 1fr);
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
        .positive {
          color: #4ade80;
        }
        .negative {
          color: #f87171;
        }
        .section-header.compact {
          margin-bottom: 12px;
          align-items: baseline;
        }
        .subtle-tag {
          display: inline-block;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(140, 163, 204, 0.8);
          background: rgba(15, 26, 44, 0.7);
          border: 1px solid rgba(72, 95, 142, 0.4);
          border-radius: 999px;
          padding: 4px 10px;
        }
        .project-panel {
          padding: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .project-toggle {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 18px 20px;
          background: transparent;
          border: none;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease, border 0.2s ease;
        }
        .project-toggle:hover {
          background: rgba(17, 31, 52, 0.85);
        }
        .project-panel.open .project-toggle {
          background: rgba(17, 31, 52, 0.92);
        }
        .project-avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(33, 56, 94, 0.85);
          border: 1px solid rgba(96, 165, 250, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #cfe0ff;
        }
        .project-summary {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .project-summary h2 {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }
        .project-name {
          color: rgba(206, 221, 255, 0.95);
          font-size: 14px;
        }
        .project-count {
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(140, 163, 204, 0.85);
        }
        .project-count strong {
          color: #f1f5ff;
        }
        .chevron {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid rgba(72, 95, 142, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, border 0.2s ease, background 0.2s ease;
        }
        .chevron::before {
          content: '';
          width: 8px;
          height: 8px;
          border-right: 2px solid rgba(148, 179, 232, 0.9);
          border-bottom: 2px solid rgba(148, 179, 232, 0.9);
          transform: rotate(45deg);
          transition: transform 0.2s ease;
        }
        .project-panel.open .chevron {
          background: rgba(24, 41, 66, 0.95);
          border-color: rgba(96, 165, 250, 0.45);
        }
        .project-panel.open .chevron::before {
          transform: rotate(-135deg);
        }
        .project-dropdown {
          border-top: 1px solid rgba(72, 103, 152, 0.32);
          padding: 18px 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(13, 24, 41, 0.9);
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
        .project-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 15px;
          min-height: 46px;
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
          gap: 18px;
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
        .edit-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(129, 140, 248, 0.35);
          margin-bottom: 18px;
        }
        .edit-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .edit-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(199, 210, 254, 0.9);
        }
        .edit-meta {
          font-size: 14px;
          color: rgba(199, 210, 254, 0.85);
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
        .col-5 {
          grid-column: span 5;
        }
        .col-6 {
          grid-column: span 6;
        }
        .col-7 {
          grid-column: span 7;
        }
        .col-8 {
          grid-column: span 8;
        }
        .col-9 {
          grid-column: span 9;
        }
        .col-10 {
          grid-column: span 10;
        }
        .col-11 {
          grid-column: span 11;
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
        .chart-card {
          margin-top: 22px;
          padding: 20px;
          border-radius: 18px;
          background: rgba(16, 28, 47, 0.82);
          border: 1px solid rgba(73, 103, 152, 0.35);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          flex-wrap: wrap;
        }
        .chart-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(140, 163, 204, 0.9);
        }
        .chart-subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          color: rgba(160, 182, 220, 0.9);
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
        .chart-total-value.positive {
          color: #4ade80;
        }
        .chart-total-value.negative {
          color: #f87171;
        }
        .chart-total-label {
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(140, 163, 204, 0.7);
        }
        .chart-body {
          position: relative;
          width: 100%;
          height: 200px;
        }
        .chart-body svg {
          width: 100%;
          height: 100%;
        }
        .chart-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 160px;
          border-radius: 14px;
          border: 1px dashed rgba(96, 165, 250, 0.35);
          color: rgba(140, 163, 204, 0.9);
          font-size: 14px;
          background: rgba(17, 31, 52, 0.6);
        }
        .chart-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: rgba(140, 163, 204, 0.85);
        }
        .chart-footer span:first-child,
        .chart-footer span:last-child {
          color: rgba(140, 163, 204, 0.7);
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
          grid-template-columns: 120px 1.8fr 90px 90px 150px 1.4fr 260px;
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
        .result-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .result-select {
          min-width: 150px;
          flex: 0 0 auto;
        }
        .status-badge {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
          background: rgba(37, 99, 235, 0.18);
          border: 1px solid rgba(129, 140, 248, 0.4);
          color: #c7d2fe;
        }
        .status-badge.win {
          background: rgba(22, 163, 74, 0.2);
          border-color: rgba(74, 222, 128, 0.45);
          color: #bbf7d0;
        }
        .status-badge.loss {
          background: rgba(185, 28, 28, 0.2);
          border-color: rgba(248, 113, 113, 0.45);
          color: #fecaca;
        }
        .status-badge.pending {
          background: rgba(37, 99, 235, 0.18);
        }
        .status-badge.void {
          background: rgba(107, 114, 128, 0.18);
          border-color: rgba(156, 163, 175, 0.35);
          color: #e5e7eb;
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
        .latest-panel {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .latest-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .latest-item {
          border-radius: 16px;
          background: rgba(18, 32, 54, 0.72);
          border: 1px solid rgba(72, 103, 152, 0.35);
          overflow: hidden;
          transition: border 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }
        .latest-item[open] {
          background: rgba(21, 38, 62, 0.82);
          border-color: rgba(96, 165, 250, 0.5);
          transform: translateY(-1px);
        }
        .latest-item summary {
          list-style: none;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          cursor: pointer;
        }
        .latest-item summary::-webkit-details-marker {
          display: none;
        }
        .latest-item summary::after {
          content: '';
          width: 10px;
          height: 10px;
          border-right: 2px solid rgba(148, 179, 232, 0.9);
          border-bottom: 2px solid rgba(148, 179, 232, 0.9);
          transform: rotate(45deg);
          transition: transform 0.2s ease;
        }
        .latest-item[open] summary::after {
          transform: rotate(-135deg);
        }
        .latest-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .latest-summary .status-badge {
          flex-shrink: 0;
        }
        .latest-match {
          font-weight: 600;
          font-size: 16px;
          color: #e2e8f0;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .latest-date {
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(148, 179, 232, 0.9);
        }
        .latest-body {
          padding: 18px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid rgba(72, 103, 152, 0.25);
          background: rgba(11, 21, 36, 0.9);
        }
        .latest-meta {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr;
          color: rgba(226, 232, 240, 0.92);
          font-size: 14px;
          line-height: 1.5;
        }
        .latest-meta strong {
          color: rgba(148, 179, 232, 0.95);
          font-weight: 600;
          margin-right: 6px;
        }
        .latest-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .quick-action {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(15, 27, 46, 0.9);
          border: 1px solid rgba(78, 106, 150, 0.45);
          color: rgba(226, 232, 240, 0.9);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: background 0.2s ease, border 0.2s ease, transform 0.2s ease, color 0.2s ease;
        }
        .quick-action:hover:not(:disabled) {
          background: rgba(30, 58, 138, 0.5);
          border-color: rgba(96, 165, 250, 0.8);
          transform: translateY(-1px);
        }
        .quick-action.active {
          background: rgba(56, 189, 248, 0.18);
          border-color: rgba(56, 189, 248, 0.6);
          color: #bae6fd;
        }
        .quick-action:disabled {
          cursor: default;
          opacity: 0.65;
        }
        .latest-empty {
          padding: 28px 22px;
          text-align: center;
          border-radius: 16px;
          background: rgba(17, 31, 52, 0.75);
          border: 1px dashed rgba(99, 102, 241, 0.35);
          color: rgba(140, 163, 204, 0.9);
          font-size: 15px;
          line-height: 1.6;
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
          .latest-panel {
            position: static;
          }
          .row {
            grid-template-columns: 110px 1.6fr 80px 80px 140px 1.2fr 240px;
          }
          .grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
          .col-1,
          .col-2 {
            grid-column: span 3;
          }
          .col-3,
          .col-4,
          .col-5 {
            grid-column: span 3;
          }
          .col-6,
          .col-7,
          .col-8,
          .col-9,
          .col-10,
          .col-11,
          .col-12 {
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
          .latest-item summary {
            grid-template-columns: 1fr;
          }
          .latest-item summary::after {
            justify-self: end;
          }
          .latest-date {
            justify-self: start;
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
          .edit-indicator {
            flex-direction: column;
            align-items: stretch;
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
