import { useState, useMemo } from "react";
import { useAuth } from "./hooks/useAuth";
import { useWorkouts } from "./hooks/useWorkouts";
import AuthModal from "./components/AuthModal";
import OnboardingModal from "./components/OnboardingModal";

const MUSCLE_GROUPS = [
  { id: "chest",     label: "Chest"     },
  { id: "back",      label: "Back"      },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms",      label: "Arms"      },
  { id: "legs",      label: "Legs"      },
  { id: "core",      label: "Core"      },
  { id: "glutes",    label: "Glutes"    },
];

const GROUP_COLORS = {
  chest:     "#84cc16",
  back:      "#22d3ee",
  shoulders: "#f97316",
  arms:      "#a78bfa",
  legs:      "#fbbf24",
  core:      "#f43f5e",
  glutes:    "#34d399",
};

const CARDIO_TYPES = [
  "Running", "Cycling", "Rowing", "Jump Rope",
  "Stairmaster", "Elliptical", "Swimming", "HIIT", "Other",
];

const DIFFICULTY_LEVELS = [
  { id: "light",  label: "Light",      emoji: "😐", value: 1, color: "#22d3ee" },
  { id: "medium", label: "Medium",     emoji: "💪", value: 2, color: "#fbbf24" },
  { id: "hardo",  label: "Hardo Mode", emoji: "💀", value: 3, color: "#f43f5e" },
];

const TARGET = 1_000_000;

function generateSeedData() {
  const now = Date.now();
  const entries = [];
  const groups = ["chest","back","legs","arms","shoulders","core","glutes"];
  for (let i = 0; i < 42; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    const group = groups[Math.floor(Math.random() * groups.length)];
    const sets = Math.floor(Math.random() * 4) + 2;
    const reps = [5,8,10,12,15][Math.floor(Math.random() * 5)];
    const weight = [45,65,95,115,135,155,185,225,275,315][Math.floor(Math.random() * 10)];
    entries.push({
      id: `seed-${i}`, type: "lift",
      timestamp: now - daysAgo * 86400000 - Math.random() * 86400000,
      muscleGroup: group, sets, reps, weight,
      total: sets * reps * weight,
    });
  }
  return entries;
}

function generateCardioSeed() {
  const now = Date.now();
  const sessions = [];
  const types = ["Running","Cycling","Rowing","HIIT","Stairmaster"];
  const diffs = ["light","medium","hardo"];
  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    sessions.push({
      id: `cardio-seed-${i}`, type: "cardio",
      timestamp: now - daysAgo * 86400000 - Math.random() * 86400000,
      cardioType: types[Math.floor(Math.random() * types.length)],
      minutes: [20,30,35,45,60][Math.floor(Math.random() * 5)],
      difficulty: diffs[Math.floor(Math.random() * diffs.length)],
    });
  }
  return sessions;
}

const SEED_LIFTS  = generateSeedData();
const SEED_CARDIO = generateCardioSeed();

const PLAYLIST_CATEGORIES = [
  {
    category: "HEAVY HITTERS",
    desc: "Max effort days. No mercy.",
    color: "#f43f5e",
    playlists: [
      { name: "Beast Mode",          mood: "Metal · Hip-Hop · Rage",    url: "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP", listeners: "11M saves"  },
      { name: "Power Workout",       mood: "Hard Rock · Electronic",    url: "https://open.spotify.com/playlist/37i9dQZF1DWZq91oLsHZvy", listeners: "1.8M saves" },
      { name: "Death Metal Workout", mood: "Death Metal · Thrash",      url: "https://open.spotify.com/playlist/37i9dQZF1DX9qNs32fujYe", listeners: "780K saves" },
    ]
  },
  {
    category: "RAP & HIP-HOP",
    desc: "Bars that hit as hard as your sets.",
    color: "#fbbf24",
    playlists: [
      { name: "Workout Twerkout",    mood: "Hip-Hop · Trap · Bass",     url: "https://open.spotify.com/playlist/37i9dQZF1DX0HRj9P7NxeE", listeners: "2.1M saves" },
      { name: "Rap Workout",         mood: "Rap · Trap · Drill",        url: "https://open.spotify.com/playlist/37i9dQZF1DWZjqjZMudx9T", listeners: "1.5M saves" },
      { name: "Most Necessary",      mood: "Classic Hip-Hop",           url: "https://open.spotify.com/playlist/37i9dQZF1DX2RxBh64BHjQ", listeners: "4.4M saves" },
    ]
  },
  {
    category: "ELECTRONIC & PUMP",
    desc: "High BPM. High volume. Lock in.",
    color: "#a78bfa",
    playlists: [
      { name: "Motivation Mix",      mood: "EDM · Dubstep · Energy",    url: "https://open.spotify.com/playlist/37i9dQZF1DX1s9knjP51Oa", listeners: "2.7M saves" },
      { name: "Workout Electronica", mood: "Electronic · House",        url: "https://open.spotify.com/playlist/37i9dQZF1DX32NsLKyzScr", listeners: "900K saves" },
      { name: "Hype",                mood: "EDM · Pop · Intense",       url: "https://open.spotify.com/playlist/37i9dQZF1DWWGFQLoP9qlv", listeners: "1.1M saves" },
    ]
  },
  {
    category: "FOCUS MODE",
    desc: "When you need to lock in and grind.",
    color: "#22d3ee",
    playlists: [
      { name: "Dark & Stormy",       mood: "Cinematic · Dark Ambient",  url: "https://open.spotify.com/playlist/37i9dQZF1DX5trt9i14X7j", listeners: "650K saves" },
      { name: "Intense Studying",    mood: "Instrumental · Focus",      url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ", listeners: "1.2M saves" },
      { name: "Metal Workout",       mood: "Heavy Metal · Industrial",  url: "https://open.spotify.com/playlist/37i9dQZF1DX9041BkN3iCa", listeners: "850K saves" },
    ]
  },
];

const SpotifyIcon = ({ size = 18, opacity = 0.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954" style={{ opacity }}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

// Unique visual "cover art" per playlist using CSS gradients + shapes
const COVER_DESIGNS = {
  "Beast Mode":          { bg: "linear-gradient(135deg, #1a0a0a 0%, #3d0b0b 50%, #7f1d1d 100%)", icon: "⚡", iconColor: "#f43f5e" },
  "Power Workout":       { bg: "linear-gradient(135deg, #0a0a1a 0%, #1e1b4b 50%, #312e81 100%)", icon: "🔥", iconColor: "#818cf8" },
  "Death Metal Workout": { bg: "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 50%, #292929 100%)", icon: "💀", iconColor: "#6b7280" },
  "Workout Twerkout":    { bg: "linear-gradient(135deg, #1a0d00 0%, #431407 50%, #7c2d12 100%)", icon: "🎵", iconColor: "#fb923c" },
  "Rap Workout":         { bg: "linear-gradient(135deg, #0d0a00 0%, #3b2f04 50%, #713f12 100%)", icon: "🎤", iconColor: "#fbbf24" },
  "Most Necessary":      { bg: "linear-gradient(135deg, #0a1a0a 0%, #14532d 50%, #166534 100%)", icon: "👑", iconColor: "#4ade80" },
  "Motivation Mix":      { bg: "linear-gradient(135deg, #0f0a1e 0%, #2e1065 50%, #4c1d95 100%)", icon: "🚀", iconColor: "#c084fc" },
  "Workout Electronica": { bg: "linear-gradient(135deg, #030712 0%, #0c1445 50%, #1e3a8a 100%)", icon: "⚡", iconColor: "#60a5fa" },
  "Hype":                { bg: "linear-gradient(135deg, #1a001a 0%, #4a044e 50%, #701a75 100%)", icon: "💥", iconColor: "#e879f9" },
  "Dark & Stormy":       { bg: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)", icon: "🌩️", iconColor: "#38bdf8" },
  "Intense Studying":    { bg: "linear-gradient(135deg, #0a0a0f 0%, #1e1b2e 50%, #2d2b52 100%)", icon: "🧠", iconColor: "#818cf8" },
  "Metal Workout":       { bg: "linear-gradient(135deg, #0f0000 0%, #1f0505 50%, #450a0a 100%)", icon: "🤘", iconColor: "#ef4444" },
};

function PlaylistCard({ p, color }) {
  const design = COVER_DESIGNS[p.name] || { bg: `linear-gradient(135deg, #111 0%, #1a1a1a 100%)`, icon: "🎵", iconColor: color };

  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "flex", flexDirection: "row", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, overflow: "hidden", transition: "all 0.22s", cursor: "pointer", alignItems: "stretch" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + "80"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 20px ${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

      {/* Cover art panel — small square on the left */}
      <div style={{ width: 72, flexShrink: 0, background: design.bg, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Glow blob */}
        <div style={{ position: "absolute", width: 60, height: 60, borderRadius: "50%", background: design.iconColor, opacity: 0.18, filter: "blur(20px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        {/* Icon */}
        <div style={{ position: "relative", zIndex: 1, fontSize: 28, filter: "drop-shadow(0 0 10px " + design.iconColor + "80)" }}>
          {design.icon}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: "#e5e5e5", letterSpacing: 0.5, marginBottom: 3, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{p.mood}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, color, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>{p.listeners}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <SpotifyIcon size={12} opacity={0.4} />
            <div style={{ fontSize: 10, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>OPEN ↗</div>
          </div>
        </div>
      </div>
    </a>
  );
}

function PlaylistsView() {
  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, color: "#fff", letterSpacing: 2, lineHeight: 1 }}>PLAYLISTS</div>
        <SpotifyIcon size={28} opacity={1} />
      </div>
      <div style={{ fontSize: 14, color: "#555", marginBottom: 32 }}>Curated for the weight room. Hit play, then hit the iron.</div>

      {PLAYLIST_CATEGORIES.map(cat => (
        <div key={cat.category} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 3, height: 24, background: cat.color, borderRadius: 2 }} />
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: 2 }}>{cat.category}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>{cat.desc}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {cat.playlists.map(p => <PlaylistCard key={p.url} p={p} color={cat.color} />)}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, padding: "14px 18px", background: "#111", border: "1px solid #1DB95420", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <SpotifyIcon size={14} opacity={0.6} />
        <span style={{ fontSize: 12, color: "#444" }}>Links open Spotify in a new tab. A free or Premium account is required to listen.</span>
      </div>
    </div>
  );
}

export default function App() {
  const authHooks = useAuth();
  const { user, profile, loading: authLoading, signOut, saveProfile } = authHooks;
  const { entries, cardioLog, loadingData, logLift, logCardio } = useWorkouts(user);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [view, setView]               = useState("dashboard");
  const [form, setForm]               = useState({ muscleGroup: "", sets: "", reps: "", weight: "" });
  const [cardioForm, setCardioForm]   = useState({ cardioType: "", minutes: "", difficulty: "" });
  const [submitted, setSubmitted]     = useState(false);
  const [cardioSubmitted, setCardioSubmitted] = useState(false);
  const [flash, setFlash]             = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [shareOpen, setShareOpen]         = useState(false);
  const [shareCopied, setShareCopied]     = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);

  // Show onboarding if user is logged in but has no display name
  const needsOnboarding = user && !authLoading && !profile;

  const now    = Date.now();
  const cutoff = now - 30 * 86400000;

  const recent      = useMemo(() => entries.filter(e => e.timestamp >= cutoff), [entries]);
  const recentCardio = useMemo(() => cardioLog.filter(e => e.timestamp >= cutoff), [cardioLog]);
  const totalLbs    = useMemo(() => recent.reduce((s, e) => s + e.total, 0), [recent]);
  const pct         = Math.min((totalLbs / TARGET) * 100, 100);

  const byGroup = useMemo(() => {
    const map = {};
    recent.forEach(e => { map[e.muscleGroup] = (map[e.muscleGroup] || 0) + e.total; });
    return map;
  }, [recent]);

  const insights = useMemo(() => {
    const total = Object.values(byGroup).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(byGroup)
      .map(([g, v]) => ({ group: g, lbs: v, pct: (v / total) * 100 }))
      .sort((a, b) => b.lbs - a.lbs);
  }, [byGroup]);

  // Cardio summary
  const cardioSummary = useMemo(() => {
    if (!recentCardio.length) return null;
    const totalMins = recentCardio.reduce((s, e) => s + e.minutes, 0);
    const avgDiff   = recentCardio.reduce((s, e) => {
      const d = DIFFICULTY_LEVELS.find(d => d.id === e.difficulty);
      return s + (d ? d.value : 1);
    }, 0) / recentCardio.length;
    return { totalMins, avgDiff, sessions: recentCardio.length };
  }, [recentCardio]);

  const suggestions = useMemo(() => {
    const covered = new Set(insights.map(i => i.group));
    const missing  = MUSCLE_GROUPS.filter(g => !covered.has(g.id)).map(g => g.label);
    const tips     = [];
    if (missing.length)
      tips.push({ type: "warn", msg: `No volume logged for: ${missing.join(", ")}` });
    const top    = insights[0];
    const bottom = insights[insights.length - 1];
    if (top && top.pct > 35)
      tips.push({ type: "warn", msg: `${top.group} is ${top.pct.toFixed(0)}% of total — redistribute some load` });
    if (bottom && bottom.pct < 5)
      tips.push({ type: "boost", msg: `Increase ${bottom.group} focus — only ${bottom.pct.toFixed(1)}% of volume` });
    const remaining   = TARGET - totalLbs;
    const dailyNeeded = remaining > 0 ? Math.ceil(remaining / 30) : 0;
    if (remaining > 0)
      tips.push({ type: "info", msg: `Need ${dailyNeeded.toLocaleString()} lbs/day to reach 1M this month` });
    else
      tips.push({ type: "win", msg: "TARGET CRUSHED — Welcome to the 1M Lb Club" });
    return tips;
  }, [insights, totalLbs]);

  const handleLog = async () => {
    if (!form.muscleGroup || !form.sets || !form.reps || !form.weight) return;
    await logLift(form);
    setForm({ muscleGroup: "", sets: "", reps: "", weight: "" });
    setSubmitted(true); setFlash(true);
    setTimeout(() => setSubmitted(false), 2200);
    setTimeout(() => setFlash(false), 600);
  };

  const handleCardioLog = async () => {
    if (!cardioForm.cardioType || !cardioForm.minutes || !cardioForm.difficulty) return;
    await logCardio(cardioForm);
    setCardioForm({ cardioType: "", minutes: "", difficulty: "" });
    setCardioSubmitted(true);
    setTimeout(() => setCardioSubmitted(false), 2200);
  };

  const shareText = `💪 I've moved ${totalLbs.toLocaleString()} lbs this month — ${pct.toFixed(1)}% of the way to 1,000,000 lbs. Chasing the 1M Lb Club. 🏋️`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      setShareOpen(true);
    }
  };

  const challengeText = `🏆 CHALLENGE: Think you can out-lift me? I've already moved ${totalLbs.toLocaleString()} lbs (${pct.toFixed(1)}% to 1,000,000 lbs). Race me to the 1M Lb Club. First one to 1,000,000 lbs wins. You in? 💀🏋️`;

  const handleChallengeCopy = () => {
    navigator.clipboard.writeText(challengeText).then(() => {
      setChallengeCopied(true);
      setTimeout(() => setChallengeCopied(false), 2000);
    });
  };

  const handleChallengeTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(challengeText)}`, "_blank");
  };

  const handleChallengeWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(challengeText)}`, "_blank");
  };

  const previewTotal = (form.sets && form.reps && form.weight)
    ? parseInt(form.sets||0) * parseInt(form.reps||0) * parseFloat(form.weight||0)
    : null;

  // Difficulty label for avg score
  const avgDiffLabel = (avg) => {
    if (avg < 1.5) return { label: "Light", color: "#22d3ee" };
    if (avg < 2.5) return { label: "Medium", color: "#fbbf24" };
    return { label: "Hardo Mode", color: "#f43f5e" };
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&family=Oswald:wght@700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d0d; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #84cc16; border-radius: 2px; }
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    input::placeholder { color: #333; }
    .nav-btn { transition: color 0.2s, border-color 0.2s; }
    .nav-btn:hover { color: #84cc16 !important; }
    .sel-btn { transition: all 0.18s; cursor: pointer; }
    .sel-btn:hover { opacity: 0.85; }
    .log-btn { transition: all 0.2s; cursor: pointer; }
    .log-btn:not(:disabled):hover { background: #84cc16 !important; color: #000 !important; box-shadow: 0 0 20px #84cc1640 !important; }
    .cardio-log-btn { transition: all 0.2s; cursor: pointer; }
    .cardio-log-btn:not(:disabled):hover { background: #38bdf8 !important; color: #000 !important; box-shadow: 0 0 20px #38bdf840 !important; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .fade-up { animation: fadeUp 0.35s ease forwards; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .flash-green { animation: pulse 0.5s ease; }
    .two-col { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; margin-bottom: 20px; }
    @media (max-width: 640px) { .two-col { grid-template-columns: 1fr; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shineSweep { 0% { right: 100%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { right: -60px; opacity: 0; } }
    .progress-shine { animation: shineSweep 2.5s ease-in-out infinite; }
    .hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; }
    .hamburger span { display: block; width: 22px; height: 2px; background: #888; border-radius: 2px; transition: all 0.2s; }
    .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); background: #84cc16; }
    .hamburger.open span:nth-child(2) { opacity: 0; }
    .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); background: #84cc16; }
    .desktop-nav { display: flex; gap: 2px; }
    .mobile-dropdown { display: none; }
    @media (max-width: 640px) {
      .hamburger { display: flex; }
      .desktop-nav { display: none; }
      .mobile-dropdown { display: block; position: absolute; top: 100%; left: 0; right: 0; background: #111; border-bottom: 1px solid #1e1e1e; z-index: 200; }
      .mobile-dropdown button { display: block; width: 100%; text-align: left; padding: 14px 24px; background: none; border: none; border-bottom: 1px solid #181818; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 2px; cursor: pointer; transition: background 0.15s; }
      .mobile-dropdown button:hover { background: #161616; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Auth & Onboarding Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} authHooks={authHooks} />}
      {needsOnboarding && <OnboardingModal user={user} saveProfile={saveProfile} />}

      <div style={{ fontFamily: "'Barlow', sans-serif", background: "#0d0d0d", color: "#e5e5e5", minHeight: "100vh" }}>

        {/* ── HEADER ── */}
        <header style={{ background: "#111111", borderBottom: "1px solid #1e1e1e", padding: "12px 28px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #a3e635 0%, #84cc16 45%, #4d7c0f 100%)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, boxShadow: "0 0 16px #84cc1650, 0 2px 8px #00000060", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-40%", left: "-40%", width: "60%", height: "180%", background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)", transform: "rotate(15deg)", pointerEvents: "none" }} />
                <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, color: "#000", letterSpacing: -0.5, lineHeight: 1, position: "relative", zIndex: 1 }}>1M</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 19, letterSpacing: 3, lineHeight: 1.1, background: "linear-gradient(90deg, #fff 0%, #d4f07a 60%, #84cc16 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>LB CLUB</div>
                <div style={{ fontSize: 9, color: "#4a7a0e", letterSpacing: 3 }}>STRENGTH TRACKER</div>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="desktop-nav">
              {[["dashboard","DASHBOARD"],["log","LOG SET"],["cardio","LOG CARDIO"],["history","HISTORY"],["playlists","PLAYLISTS"]].map(([v, label]) => {
                const activeColor = v==="cardio" ? "#38bdf8" : v==="playlists" ? "#1DB954" : "#84cc16";
                return (
                  <button key={v} className="nav-btn"
                    onClick={() => setView(v)}
                    style={{ background: "none", border: "none", borderBottom: view===v ? `2px solid ${activeColor}` : "2px solid transparent", color: view===v ? activeColor : "#555", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: "8px 14px", cursor: "pointer" }}>
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Auth button */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: "#84cc16", letterSpacing: 1 }}>
                    {profile?.display_name || user.email?.split("@")[0] || "MEMBER"}
                  </span>
                  <button onClick={signOut}
                    style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 6, color: "#555", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 2, padding: "6px 12px", cursor: "pointer" }}>
                    SIGN OUT
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)}
                  style={{ background: "#84cc1615", border: "1px solid #84cc1640", borderRadius: 6, color: "#84cc16", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 2, padding: "7px 14px", cursor: "pointer" }}>
                  SIGN IN
                </button>
              )}
            </div>

            {/* Hamburger (mobile) */}
            <button className={`hamburger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="mobile-dropdown">
              {[["dashboard","DASHBOARD"],["log","LOG SET"],["cardio","LOG CARDIO"],["history","HISTORY"],["playlists","PLAYLISTS"]].map(([v, label]) => {
                const activeColor = v==="cardio" ? "#38bdf8" : v==="playlists" ? "#1DB954" : "#84cc16";
                return (
                  <button key={v}
                    onClick={() => { setView(v); setMenuOpen(false); }}
                    style={{ color: view===v ? activeColor : "#666" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 28px" }}>

          {/* ══ DASHBOARD ══ */}
          {view === "dashboard" && (
            <div className="fade-up">

              {/* Guest banner */}
              {!user && (
                <div style={{ background: "#84cc1610", border: "1px solid #84cc1630", borderRadius: 10, padding: "13px 20px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ fontSize: 13, color: "#84cc16", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 1 }}>
                    🏋️ YOU'RE IN GUEST MODE — progress won't be saved
                  </div>
                  <button onClick={() => setShowAuthModal(true)}
                    style={{ background: "#84cc16", border: "none", borderRadius: 6, color: "#000", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: 2, padding: "7px 16px", cursor: "pointer" }}>
                    SIGN UP FREE →
                  </button>
                </div>
              )}

              {/* Hero card */}
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: "100%", background: "radial-gradient(ellipse at top right, #84cc1608 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 8 }}>30-DAY PROGRESS</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
                  <span className={flash ? "flash-green" : ""} style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 80, lineHeight: 0.9, color: "#fff", letterSpacing: -2 }}>
                    {totalLbs.toLocaleString()}
                  </span>
                  <div style={{ paddingBottom: 8 }}>
                    <div style={{ fontSize: 15, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: 1 }}>/ 1,000,000 LBS</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 34, lineHeight: 1, letterSpacing: 1, background: "linear-gradient(90deg, #84cc16, #eab308)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{pct.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{ height: 12, background: "#161616", borderRadius: 6, overflow: "hidden", marginBottom: 6, position: "relative", boxShadow: "inset 0 1px 3px #00000080" }}>
                  {/* Track shimmer lines */}
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 48px, #ffffff04 48px, #ffffff04 50px)", pointerEvents: "none", zIndex: 2 }} />
                  {/* Fill */}
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #365314 0%, #4d7c0f 20%, #84cc16 55%, #bef264 75%, #eab308 90%, #fbbf24 100%)", borderRadius: 6, boxShadow: "0 0 18px #84cc1660, 0 0 40px #eab30830", transition: "width 0.7s ease", position: "relative" }}>
                    {/* Animated shine sweep */}
                    <div className="progress-shine" style={{ position: "absolute", top: 0, width: 60, height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)", borderRadius: 6 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#333", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, marginBottom: 24 }}>
                  {["0","250K","500K","750K","1M"].map(l => <span key={l}>{l}</span>)}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                    {[
                      ["REMAINING",    `${Math.max(0, TARGET - totalLbs).toLocaleString()} lbs`],
                      ["SESSIONS",     recent.length],
                      ["AVG / SESSION", recent.length ? `${Math.round(totalLbs / recent.length).toLocaleString()} lbs` : "—"],
                      ["DAILY AVG",    `${Math.round(totalLbs / 30).toLocaleString()} lbs`],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 5 }}>{l}</div>
                        <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 24, color: "#ccc" }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Buttons row */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {/* Share button */}
                    <button onClick={() => { setShareOpen(o => !o); setChallengeOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: shareOpen ? "#84cc1615" : "#161616", border: `1.5px solid ${shareOpen ? "#84cc16" : "#2a2a2a"}`, borderRadius: 8, color: shareOpen ? "#84cc16" : "#666", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: "pointer", transition: "all 0.2s", boxShadow: shareOpen ? "0 0 14px #84cc1630" : "none" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                      SHARE PROGRESS
                    </button>

                    {/* Challenge button */}
                    <button onClick={() => { setChallengeOpen(o => !o); setShareOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: challengeOpen ? "#f9731620" : "#161616", border: `1.5px solid ${challengeOpen ? "#f97316" : "#2a2a2a"}`, borderRadius: 8, color: challengeOpen ? "#f97316" : "#666", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: "pointer", transition: "all 0.2s", boxShadow: challengeOpen ? "0 0 14px #f9731630" : "none" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
                        <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                        <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
                      </svg>
                      SEND A CHALLENGE
                    </button>
                  </div>
                </div>

                {/* Share panel */}
                {shareOpen && (
                  <div style={{ marginTop: 20, padding: "20px 22px", background: "#0d0d0d", border: "1px solid #84cc1625", borderRadius: 10 }}>
                    <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic", borderLeft: "2px solid #84cc1640", paddingLeft: 12 }}>
                      "{shareText}"
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={handleTwitterShare}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: "pointer", transition: "all 0.18s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#ccc"; }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        POST ON X
                      </button>
                      <button onClick={handleWhatsAppShare}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: "pointer", transition: "all 0.18s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#25d366"; e.currentTarget.style.color = "#25d366"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#ccc"; }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WHATSAPP
                      </button>
                      <button onClick={handleCopyLink}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: shareCopied ? "#84cc1615" : "#161616", border: `1px solid ${shareCopied ? "#84cc16" : "#222"}`, borderRadius: 7, color: shareCopied ? "#84cc16" : "#ccc", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: "pointer", transition: "all 0.18s" }}>
                        {shareCopied
                          ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> COPIED!</>
                          : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> COPY TEXT</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Challenge panel */}
                {challengeOpen && (
                  <div style={{ marginTop: 20, padding: "20px 22px", background: "#0d0d0d", border: "1px solid #f9731625", borderRadius: 10 }}>
                    {/* Trash talk header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#f97316", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>⚡ YOUR CHALLENGE MESSAGE</div>
                    </div>
                    <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic", borderLeft: "2px solid #f9731640", paddingLeft: 12 }}>
                      "{challengeText}"
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* Twitter/X */}
                      <button onClick={handleChallengeTwitter}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: "pointer", transition: "all 0.18s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#ccc"; }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        CHALLENGE ON X
                      </button>
                      {/* WhatsApp */}
                      <button onClick={handleChallengeWhatsApp}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#161616", border: "1px solid #222", borderRadius: 7, color: "#ccc", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: "pointer", transition: "all 0.18s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#25d366"; e.currentTarget.style.color = "#25d366"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#ccc"; }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        SEND VIA WHATSAPP
                      </button>
                      {/* Copy */}
                      <button onClick={handleChallengeCopy}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: challengeCopied ? "#f9731618" : "#161616", border: `1px solid ${challengeCopied ? "#f97316" : "#222"}`, borderRadius: 7, color: challengeCopied ? "#f97316" : "#ccc", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: "pointer", transition: "all 0.18s" }}>
                        {challengeCopied
                          ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> COPIED!</>
                          : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> COPY TEXT</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Two-col */}
              <div className="two-col">

                {/* Muscle breakdown */}
                <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "26px 28px" }}>
                  <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 22 }}>VOLUME BY MUSCLE GROUP</div>
                  {MUSCLE_GROUPS.map(g => {
                    const lbs = byGroup[g.id] || 0;
                    const tot = Object.values(byGroup).reduce((s,v)=>s+v,0) || 1;
                    const p   = (lbs / tot) * 100;
                    const c   = GROUP_COLORS[g.id];
                    return (
                      <div key={g.id} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: "#bbb", letterSpacing: 1 }}>{g.label.toUpperCase()}</span>
                          <span style={{ fontSize: 13 }}>
                            {lbs > 0
                              ? <><strong style={{ color: c, fontFamily: "'Oswald', sans-serif", fontSize: 16 }}>{lbs.toLocaleString()}</strong><span style={{ color: "#444", fontSize: 11 }}> lbs · {p.toFixed(1)}%</span></>
                              : <span style={{ color: "#2a2a2a" }}>—</span>}
                          </span>
                        </div>
                        <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${p}%`, background: c, borderRadius: 3, boxShadow: `0 0 6px ${c}70`, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Insights */}
                <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "26px 28px" }}>
                  <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 22 }}>COACH INSIGHTS</div>

                  {suggestions.map((s, i) => {
                    const st = {
                      win:   { border: "#84cc1640", bg: "#84cc1610", icon: "✓", iconC: "#84cc16", textC: "#a3e635" },
                      warn:  { border: "#fbbf2440", bg: "#fbbf2408", icon: "!", iconC: "#fbbf24", textC: "#fde68a" },
                      boost: { border: "#22d3ee30", bg: "#22d3ee08", icon: "↑", iconC: "#22d3ee", textC: "#67e8f9" },
                      info:  { border: "#ffffff12", bg: "#ffffff04", icon: "→", iconC: "#555",    textC: "#888"    },
                    }[s.type];
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "13px 15px", border: `1px solid ${st.border}`, background: st.bg, borderRadius: 8, marginBottom: 10 }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, color: st.iconC, lineHeight: 1.3, flexShrink: 0 }}>{st.icon}</span>
                        <p style={{ fontSize: 13, color: st.textC, lineHeight: 1.55 }}>{s.msg}</p>
                      </div>
                    );
                  })}

                  {/* Cardio summary */}
                  {cardioSummary ? (() => {
                    const dl = avgDiffLabel(cardioSummary.avgDiff);
                    const fillPct = ((cardioSummary.avgDiff - 1) / 2) * 100;
                    return (
                      <div style={{ marginTop: 20, borderTop: "1px solid #1a1a1a", paddingTop: 18 }}>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: "#38bdf880", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 14 }}>CARDIO THIS MONTH</div>
                        <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: 2, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 4 }}>TOTAL MINS</div>
                            <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 28, color: "#38bdf8", lineHeight: 1 }}>{cardioSummary.totalMins}<span style={{ fontSize: 13, color: "#38bdf860", marginLeft: 4 }}>min</span></div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: 2, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 4 }}>SESSIONS</div>
                            <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 28, color: "#38bdf8", lineHeight: 1 }}>{cardioSummary.sessions}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 8 }}>AVG INTENSITY</div>
                        <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden", marginBottom: 6, position: "relative" }}>
                          <div style={{ height: "100%", width: `${fillPct}%`, minWidth: "4%", background: `linear-gradient(90deg, #22d3ee, ${dl.color})`, borderRadius: 4, boxShadow: `0 0 8px ${dl.color}60`, transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                          <span style={{ color: "#22d3ee60", fontFamily: "'Barlow Condensed', sans-serif" }}>LIGHT</span>
                          <span style={{ color: dl.color, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12 }}>{dl.label.toUpperCase()}</span>
                          <span style={{ color: "#f43f5e60", fontFamily: "'Barlow Condensed', sans-serif" }}>HARDO</span>
                        </div>
                      </div>
                    );
                  })() : (
                    <div style={{ marginTop: 20, borderTop: "1px solid #1a1a1a", paddingTop: 18 }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#38bdf840", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 10 }}>CARDIO THIS MONTH</div>
                      <p style={{ fontSize: 13, color: "#333" }}>No cardio logged yet.</p>
                    </div>
                  )}

                  <div style={{ marginTop: 22, borderTop: "1px solid #1a1a1a", paddingTop: 20 }}>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#3a3a3a", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 12 }}>IDEAL MONTHLY SPLIT</div>
                    {[["Legs","25–30%"],["Back","20–25%"],["Chest","15–20%"],["Shoulders","10–15%"],["Arms","10%"],["Core","5–10%"]].map(([g,t]) => (
                      <div key={g} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#444", marginBottom: 6 }}>
                        <span>{g}</span><span style={{ color: "#333" }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent */}
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "26px 28px" }}>
                <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 18 }}>RECENT ACTIVITY</div>
                {[...recent].sort((a,b)=>b.timestamp-a.timestamp).slice(0,6).map((e, i, arr) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length-1 ? "1px solid #181818" : "none", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: GROUP_COLORS[e.muscleGroup] || "#84cc16", boxShadow: `0 0 8px ${GROUP_COLORS[e.muscleGroup]}` }} />
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: "#ccc", letterSpacing: 1 }}>{e.muscleGroup.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#555" }}>{e.sets} sets × {e.reps} reps @ {e.weight} lbs</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 18, color: "#84cc16" }}>{e.total.toLocaleString()} <span style={{ fontSize: 11, color: "#4a7a0e" }}>LBS</span></span>
                    <span style={{ fontSize: 11, color: "#333" }}>{new Date(e.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ LOG SET ══ */}
          {view === "log" && (
            <div className="fade-up" style={{ maxWidth: 560 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, color: "#fff", letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>LOG A SET</div>
              <div style={{ fontSize: 14, color: "#555", marginBottom: 28 }}>Every rep counts toward 1,000,000 lbs.</div>

              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "30px 32px" }}>
                <div style={{ marginBottom: 26 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 12 }}>MUSCLE GROUP</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {MUSCLE_GROUPS.map(g => {
                      const sel = form.muscleGroup === g.id;
                      const c   = GROUP_COLORS[g.id];
                      return (
                        <button key={g.id} className="sel-btn"
                          onClick={() => setForm(f => ({ ...f, muscleGroup: g.id }))}
                          style={{ padding: "13px 16px", background: sel ? c : "#161616", color: sel ? "#000" : "#777", border: `1px solid ${sel ? c : "#222"}`, borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, textAlign: "left", boxShadow: sel ? `0 0 16px ${c}40` : "none" }}>
                          {g.label.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 22 }}>
                  {[["SETS","sets","4"],["REPS","reps","10"],["WEIGHT (LBS)","weight","135"]].map(([label,key,ph]) => (
                    <div key={key}>
                      <div style={{ fontSize: 10, letterSpacing: 2, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 8 }}>{label}</div>
                      <input value={form[key]}
                        onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
                        placeholder={ph} type="number" min="0"
                        style={{ width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 8, color: "#fff", padding: "14px 14px", fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, outline: "none", transition: "border-color 0.2s" }}
                        onFocus={e => e.target.style.borderColor = "#84cc16"}
                        onBlur={e  => e.target.style.borderColor = "#222"}
                      />
                    </div>
                  ))}
                </div>

                {previewTotal !== null && (
                  <div style={{ background: "#84cc1608", border: "1px solid #84cc1625", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#84cc1680", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 3 }}>TOTAL MOVED</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 36, color: "#84cc16", lineHeight: 1 }}>{previewTotal.toLocaleString()} <span style={{ fontSize: 16, color: "#4a7a0e" }}>LBS</span></span>
                  </div>
                )}

                <button className="log-btn" onClick={handleLog}
                  style={{ width: "100%", padding: "17px", background: submitted ? "#84cc16" : "#161616", color: submitted ? "#000" : "#84cc16", border: "1.5px solid #84cc16", borderRadius: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 17, letterSpacing: 5, boxShadow: submitted ? "0 0 24px #84cc1650" : "none", transition: "all 0.2s" }}>
                  {submitted ? "✓  LOGGED" : "LOG SET"}
                </button>
              </div>
            </div>
          )}

          {/* ══ LOG CARDIO ══ */}
          {view === "cardio" && (
            <div className="fade-up" style={{ maxWidth: 560 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, color: "#fff", letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>LOG CARDIO</div>
              <div style={{ fontSize: 14, color: "#555", marginBottom: 28 }}>Track your conditioning work.</div>

              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "30px 32px" }}>

                {/* Cardio type */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 12 }}>TYPE</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {CARDIO_TYPES.map(t => {
                      const sel = cardioForm.cardioType === t;
                      return (
                        <button key={t} className="sel-btn"
                          onClick={() => setCardioForm(f => ({ ...f, cardioType: t }))}
                          style={{ padding: "12px 10px", background: sel ? "#38bdf8" : "#161616", color: sel ? "#000" : "#666", border: `1px solid ${sel ? "#38bdf8" : "#222"}`, borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textAlign: "center", boxShadow: sel ? "0 0 14px #38bdf840" : "none" }}>
                          {t.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minutes */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 8 }}>DURATION (MINUTES)</div>
                  <input value={cardioForm.minutes}
                    onChange={e => setCardioForm(f => ({...f, minutes: e.target.value}))}
                    placeholder="30" type="number" min="1"
                    style={{ width: "100%", background: "#161616", border: "1px solid #222", borderRadius: 8, color: "#fff", padding: "14px 16px", fontSize: 36, fontFamily: "'Oswald', sans-serif", fontWeight: 700, outline: "none", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = "#38bdf8"}
                    onBlur={e  => e.target.style.borderColor = "#222"}
                  />
                </div>

                {/* Difficulty */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 12 }}>DIFFICULTY</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {DIFFICULTY_LEVELS.map(d => {
                      const sel = cardioForm.difficulty === d.id;
                      return (
                        <button key={d.id} className="sel-btn"
                          onClick={() => setCardioForm(f => ({ ...f, difficulty: d.id }))}
                          style={{ padding: "16px 10px", background: sel ? d.color : "#161616", color: sel ? "#000" : d.color, border: `1px solid ${sel ? d.color : d.color + "40"}`, borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textAlign: "center", boxShadow: sel ? `0 0 16px ${d.color}50` : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 22 }}>{d.emoji}</span>
                          <span style={{ letterSpacing: 1 }}>{d.label.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button className="cardio-log-btn" onClick={handleCardioLog}
                  style={{ width: "100%", padding: "17px", background: cardioSubmitted ? "#38bdf8" : "#161616", color: cardioSubmitted ? "#000" : "#38bdf8", border: "1.5px solid #38bdf8", borderRadius: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 17, letterSpacing: 5, boxShadow: cardioSubmitted ? "0 0 24px #38bdf850" : "none", transition: "all 0.2s" }}>
                  {cardioSubmitted ? "✓  LOGGED" : "LOG CARDIO"}
                </button>
              </div>
            </div>
          )}

          {/* ══ HISTORY ══ */}
          {view === "history" && (
            <div className="fade-up">
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, color: "#fff", letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>HISTORY</div>
              <div style={{ fontSize: 14, color: "#555", marginBottom: 24 }}>Last 30 days — {recent.length} sets logged</div>

              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 0.7fr 1fr 1.3fr 1fr", padding: "13px 24px", background: "#141414", borderBottom: "1px solid #1e1e1e" }}>
                  {["GROUP","SETS","REPS","WEIGHT","TOTAL MOVED","DATE"].map(h => (
                    <span key={h} style={{ fontSize: 9, letterSpacing: 3, color: "#444", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>{h}</span>
                  ))}
                </div>
                {[...recent].sort((a,b) => b.timestamp - a.timestamp).map((e, i) => (
                  <div key={e.id} style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 0.7fr 1fr 1.3fr 1fr", padding: "14px 24px", background: i % 2 === 0 ? "#111" : "#0f0f0f", borderBottom: "1px solid #161616", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: GROUP_COLORS[e.muscleGroup] || "#84cc16", flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: "#bbb", letterSpacing: 1 }}>{e.muscleGroup.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: 14, color: "#666" }}>{e.sets}</span>
                    <span style={{ fontSize: 14, color: "#666" }}>{e.reps}</span>
                    <span style={{ fontSize: 14, color: "#666" }}>{e.weight} lbs</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 16, color: "#84cc16" }}>{e.total.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: "#3a3a3a" }}>{new Date(e.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#141414", borderTop: "1px solid #1e1e1e" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 3, color: "#444" }}>30-DAY TOTAL</span>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 22, color: "#84cc16" }}>{totalLbs.toLocaleString()} LBS</span>
                </div>
              </div>

              {/* Cardio history */}
              {recentCardio.length > 0 && (
                <div style={{ marginTop: 20, background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr", padding: "13px 24px", background: "#141414", borderBottom: "1px solid #1e1e1e" }}>
                    {["CARDIO TYPE","MINS","DIFFICULTY","DATE"].map(h => (
                      <span key={h} style={{ fontSize: 9, letterSpacing: 3, color: "#38bdf870", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>{h}</span>
                    ))}
                  </div>
                  {[...recentCardio].sort((a,b) => b.timestamp - a.timestamp).map((e, i) => {
                    const d = DIFFICULTY_LEVELS.find(d => d.id === e.difficulty);
                    return (
                      <div key={e.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr", padding: "14px 24px", background: i % 2 === 0 ? "#111" : "#0f0f0f", borderBottom: "1px solid #161616", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8", flexShrink: 0 }} />
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: "#bbb", letterSpacing: 1 }}>{e.cardioType.toUpperCase()}</span>
                        </div>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 16, color: "#38bdf8" }}>{e.minutes}</span>
                        <span style={{ fontSize: 13, color: d ? d.color : "#666", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>{d ? d.label.toUpperCase() : "—"}</span>
                        <span style={{ fontSize: 12, color: "#3a3a3a" }}>{new Date(e.timestamp).toLocaleDateString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ PLAYLISTS ══ */}
          {view === "playlists" && <PlaylistsView />}

        </main>
      </div>
    </>
  );
}
