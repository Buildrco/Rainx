import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Area, ComposedChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  Bell, Home, Briefcase, MessageCircle, MoreHorizontal, Settings, X, Repeat2,
  TrendingUp, TrendingDown, Minus, Activity, Send, Calendar as CalendarIcon,
  Calculator, Mail, ShieldCheck, LogOut, Mic, Square, FileText, ScrollText, Users2,
  CreditCard as CreditCardIcon, Zap, ArrowRight, ChevronRight, ChevronLeft, Wallet, Landmark, Gift, Trophy,
  Maximize2, User, Lock, Smartphone, Eye, EyeOff, Key, ArrowUpCircle, ArrowDownCircle, Plus, ChevronDown,
  BrainCircuit, Cpu, Palette, Globe, Trash2, UserX, Download, FileCheck, Cookie, Database, Coins, Copy, RefreshCw,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { Capacitor } from "@capacitor/core";
import {
  getNativeLockConfig,
  saveNativePin,
  setNativeAppLock,
  setNativeBiometricEnabled,
} from "./nativeSecurity";
import CommunityTab, { ProfileFeed as CommunityProfileFeed, Composer as CommunityComposer, FollowListModal, Badge as CommunityBadge, formatCount } from "./CommunityTab";
import { registerNativeBackHandler } from "./nativeBackStack";
import { useNativeBottomSheet } from "./nativeBottomSheet";
import FullChartView from "./FullChartView";
import LightweightChart from "./LightweightChart";
import SpaceCoinsIntro from "./SpaceCoinsIntro";
import SpaceCoinsDashboard from "./SpaceCoinsDashboard";
import HomeTab from "./HomeTab";

import rainxLogoTransparent from "./assets/rainx-logo-transparent.png";
import referralEarningsTransparent from "./assets/referral-earnings-transparent.png";
import referralBanner from "./assets/referral-banner.png";
import referralNetworkOptimized from "./assets/referral-network-optimized.png";
import referralActivityBanner from "./assets/referral-activity-banner.png";
import referralAnimation from "./assets/social-media-influencer.json";
import lottie from "lottie-web";
import { resolveMarketLogo, resolveMarketDirection, isMarketNotification, FALLBACK_NEWS_LOGO, FALLBACK_RAINX_LOGO, MARKET_NAMES } from "./MarketLogos";

// ---------- Design tokens ----------
const T = {
  ink: "#0F0E0B",
  card: "#1C1913",
  cardBorder: "#332C1F",
  gold: "#F4D35E",
  goldBright: "#F4D35E",
  goldGradient: "linear-gradient(135deg, #F4D35E 0%, #F4D35E 50%, #F4D35E 100%)",
  goldShine: "linear-gradient(180deg, #F4D35E 0%, #F4D35E 48%, #F4D35E 100%)",
  sage: "#7A9E86",
  rust: "#B0604A",
  paper: "#FFFFFF",
  muted: "#9C947F",
};
// Light and dark token palettes – applied by mutating T in-place inside MainAppContent
// Module-level signal for triggering HeaderAvatar refresh after upload/save
let _avatarRefreshTick = 0;
const _avatarRefreshListeners = new Set();
function notifyAvatarRefresh() { _avatarRefreshTick++; _avatarRefreshListeners.forEach(fn => fn(_avatarRefreshTick)); }

const DARK_TOKENS  = { ink:"#0F0E0B", card:"#1C1913", cardBorder:"#332C1F", gold:"#F4D35E", goldBright:"#F4D35E", goldGradient:"linear-gradient(135deg, #F4D35E 0%, #F4D35E 50%, #F4D35E 100%)", goldShine:"linear-gradient(180deg, #F4D35E 0%, #F4D35E 48%, #F4D35E 100%)", sage:"#7A9E86",  rust:"#B0604A", paper:"#FFFFFF", muted:"#9C947F" };
const LIGHT_TOKENS = { ink:"#FFFFFF",  card: "#FFFFFF", cardBorder:"#EFF3F4", gold:"#F4D35E", goldBright:"#F4D35E", goldGradient:"linear-gradient(135deg, #F4D35E 0%, #F4D35E 50%, #F4D35E 100%)", goldShine:"linear-gradient(180deg, #F4D35E 0%, #F4D35E 48%, #F4D35E 100%)", sage:"#1A7A50",  rust:"#C0392B", paper:"#0F1419", muted:"#536471" };
const FONT_HEAD = "'Montserrat', sans-serif";
const FONT_BODY = "'Montserrat', sans-serif";

// Format a notification timestamp as "DD/MM/YYYY, HH:MM" (date + time).
// Falls back to n.time (time-only) or n.created_at when available.
function notifDateTime(n) {
  const raw = n.created_at;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d)) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy}, ${hh}:${mi}`;
    }
  }
  return n.time || "";
}

/**
 * Relative time for notification lists:
 *   - Same calendar day → show the clock time only (e.g. "11:31")
 *   - 1+ days but < 1 year → "1 day ago", "2 days ago", … "300 days ago"
 *   - 1 year+ → "1 year ago", "2 years ago"
 */
function notifTimeAgo(n) {
  const raw = n.created_at;
  if (!raw) return n.time || "";
  const d = new Date(raw);
  if (isNaN(d)) return n.time || "";
  const now = new Date();
  // Same calendar day → time only.
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mi}`;
  }
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  const years = Math.floor(days / 365);
  if (years >= 1) {
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

// ---------- Market notification avatar (logo + BUY/SELL badge) ----------
// Renders a market logo as the "profile image" for signal / trade / news
// notifications, with a small BUY (sage, up-arrow) or SELL (rust, down-arrow)
// badge at the bottom-right corner — mirroring the community notification style.
function MarketNotifAvatar({ n, size = 44 }) {
  const logo = resolveMarketLogo(n);
  const dir = resolveMarketDirection(n);
  // Pick the fallback: a news icon for news-type, RainX mark otherwise.
  const fallback = (n?.type === "news" || /news|cpi|nfp|fomc|economic/i.test(`${n?.title || ""} ${n?.body || ""}`))
    ? FALLBACK_NEWS_LOGO
    : FALLBACK_RAINX_LOGO;
  const src = logo?.src || fallback;
  const alt = logo ? (MARKET_NAMES[logo.symbol] || logo.symbol) : "RainX";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <img src={src} alt={alt} width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      {dir && (
        <span style={{
          position: "absolute", right: -3, bottom: -3, width: 20, height: 20, borderRadius: "50%",
          background: dir === "buy" ? T.sage : T.rust, border: `2px solid ${T.ink}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {dir === "buy"
            ? <TrendingUp size={12} strokeWidth={3} color="#fff" />
            : <TrendingDown size={12} strokeWidth={3} color="#fff" />}
        </span>
      )}
    </div>
  );
}
const PUSH_STATE_DB_NAME = "rainx-notification-state";
const PUSH_STATE_STORE_NAME = "delivered-pushes";

function readDeliveredPushIds() {
  return new Promise((resolve) => {
    if (!("indexedDB" in window)) {
      resolve([]);
      return;
    }
    const request = indexedDB.open(PUSH_STATE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PUSH_STATE_STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => {
      const db = request.result;
      const getAllRequest = db.transaction(PUSH_STATE_STORE_NAME, "readonly")
        .objectStore(PUSH_STATE_STORE_NAME)
        .getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result.map((item) => String(item.id)));
      getAllRequest.onerror = () => resolve([]);
    };
    request.onerror = () => resolve([]);
  });
}
const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Bulgaria","Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Czech Republic","Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Lebanon","Libya","Malaysia","Mexico","Morocco","Mozambique","Myanmar","Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","Norway","Oman","Pakistan","Panama","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Somalia","South Africa","South Korea","Spain","Sudan","Sweden","Switzerland","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];


const LOCATION_SUGGESTIONS = [
  "Accra, Ghana","Kumasi, Ghana","Tema, Ghana","Takoradi, Ghana",
  "Lagos, Nigeria","Abuja, Nigeria","Kano, Nigeria","Ibadan, Nigeria","Port Harcourt, Nigeria","Benin City, Nigeria",
  "Nairobi, Kenya","Mombasa, Kenya","Kampala, Uganda","Dar es Salaam, Tanzania","Kigali, Rwanda","Lusaka, Zambia",
  "Johannesburg, South Africa","Cape Town, South Africa","Durban, South Africa","Pretoria, South Africa",
  "Harare, Zimbabwe","Gaborone, Botswana","Windhoek, Namibia","Maputo, Mozambique","Lilongwe, Malawi",
  "Cairo, Egypt","Alexandria, Egypt","Addis Ababa, Ethiopia","Casablanca, Morocco","Tunis, Tunisia",
  "Dakar, Senegal","Abidjan, Côte d'Ivoire","Accra Metro, Ghana","Kumasi Metro, Ghana",
  "London, UK","Manchester, UK","Birmingham, UK","Glasgow, UK","Edinburgh, UK","Liverpool, UK","Bristol, UK","Leeds, UK",
  "New York, USA","Los Angeles, USA","Chicago, USA","Houston, USA","Miami, USA","Atlanta, USA",
  "Dallas, USA","San Francisco, USA","Seattle, USA","Boston, USA","Washington DC, USA","Phoenix, USA",
  "Toronto, Canada","Vancouver, Canada","Montreal, Canada","Calgary, Canada","Ottawa, Canada","Edmonton, Canada",
  "Sydney, Australia","Melbourne, Australia","Brisbane, Australia","Perth, Australia","Adelaide, Australia",
  "Dublin, Ireland","Amsterdam, Netherlands","Paris, France","Berlin, Germany","Madrid, Spain","Rome, Italy",
  "Zurich, Switzerland","Vienna, Austria","Stockholm, Sweden","Oslo, Norway","Copenhagen, Denmark",
  "Dubai, UAE","Abu Dhabi, UAE","Riyadh, Saudi Arabia","Doha, Qatar","Kuwait City, Kuwait","Manama, Bahrain",
  "Kuala Lumpur, Malaysia","Singapore","Bangkok, Thailand","Jakarta, Indonesia","Manila, Philippines",
  "Tokyo, Japan","Seoul, South Korea","Hong Kong","Shanghai, China","Beijing, China","Shenzhen, China",
  "Mumbai, India","Delhi, India","Bengaluru, India","Chennai, India","Hyderabad, India","Kolkata, India",
  "Karachi, Pakistan","Lahore, Pakistan","Islamabad, Pakistan","Dhaka, Bangladesh","Colombo, Sri Lanka",
  "São Paulo, Brazil","Rio de Janeiro, Brazil","Buenos Aires, Argentina","Bogotá, Colombia",
  "Lima, Peru","Santiago, Chile","Mexico City, Mexico","Guadalajara, Mexico",
];

function CoverCropModal({ file, onConfirm, onCancel, T, FONT_HEAD }) {
  const DISPLAY_W = 340;
  const CROP_RATIO = 4; // 4:1 banner
  const DISPLAY_H = Math.round(DISPLAY_W / CROP_RATIO);
  const canvasRef = React.useRef(null);
  const [imgSrc, setImgSrc] = React.useState(null);
  const [natW, setNatW] = React.useState(1);
  const [natH, setNatH] = React.useState(1);
  const [offsetY, setOffsetY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef({ startY: 0, startOffset: 0 });

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        setNatW(img.naturalWidth); setNatH(img.naturalHeight);
        const scale = DISPLAY_W / img.naturalWidth;
        const rh = img.naturalHeight * scale;
        setOffsetY(-Math.max(0, (rh - DISPLAY_H) / 2));
      };
      img.src = e.target.result;
      setImgSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  }, [file]);

  const scale = DISPLAY_W / natW;
  const renderedH = natH * scale;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const onPD = e => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); dragRef.current = { startY: e.clientY, startOffset: offsetY }; };
  const onPM = e => { if (!dragging) return; const dy = e.clientY - dragRef.current.startY; setOffsetY(clamp(dragRef.current.startOffset + dy, -(renderedH - DISPLAY_H), 0)); };
  const onPU = () => setDragging(false);

  const confirm = () => {
    const OUT_W = 1200, OUT_H = 300;
    const cvs = canvasRef.current; cvs.width = OUT_W; cvs.height = OUT_H;
    const ctx = cvs.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const srcY = (-offsetY / scale);
      const srcH = natW / CROP_RATIO;
      ctx.drawImage(img, 0, srcY, natW, srcH, 0, 0, OUT_W, OUT_H);
      cvs.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.88);
    };
    img.src = imgSrc;
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.88)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
      onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}>
      <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:15, color:'#fff', marginBottom:14 }}>Drag to position</div>
      <div style={{ width:DISPLAY_W, height:DISPLAY_H, overflow:'hidden', borderRadius:8, border:'2px solid #F4D35E', cursor:dragging?'grabbing':'grab', position:'relative', userSelect:'none', touchAction:'none' }}
        onPointerDown={onPD}>
        {imgSrc && <img src={imgSrc} style={{ width:DISPLAY_W, height:'auto', position:'absolute', top:offsetY, left:0, pointerEvents:'none', userSelect:'none', draggable:false }} alt='' />}
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:10, marginBottom:20 }}>Cover photo · 4:1</div>
      <div style={{ display:'flex', gap:12 }}>
        <button onClick={onCancel} style={{ background:'none', border:'1px solid rgba(255,255,255,0.25)', borderRadius:10, padding:'10px 24px', color:'#fff', fontFamily:FONT_HEAD, fontWeight:600, fontSize:13, cursor:'pointer' }}>Cancel</button>
        <button onClick={confirm} style={{ background:'#F4D35E', border:'none', borderRadius:10, padding:'10px 24px', color:'#0F0E0B', fontFamily:FONT_HEAD, fontWeight:700, fontSize:13, cursor:'pointer' }}>Use photo</button>
      </div>
      <canvas ref={canvasRef} style={{ display:'none' }} />
    </div>
  );
}

function ProfileLocationInput({ value, onChange, T, FONT_HEAD }) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const handleInput = (v) => {
    onChange(v);
    if (v.length >= 2) {
      const q = v.toLowerCase();
      const matches = LOCATION_SUGGESTIONS.filter(l =>
        l.toLowerCase().startsWith(q) || l.toLowerCase().includes(q)
      ).slice(0, 6);
      setSuggestions(matches);
      setOpen(matches.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };
  return (
    <div style={{ position:"relative" }}>
      <input
        type="text"
        value={value}
        onChange={e => handleInput(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="City, Country or region"
        style={{ width:"100%", background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}`, color:T.paper, fontSize:15, padding:"6px 0", fontFamily:FONT_HEAD, outline:"none", boxSizing:"border-box" }}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:10, zIndex:200, boxShadow:"0 6px 20px rgba(0,0,0,0.5)", overflow:"hidden" }}>
          {suggestions.map(s => (
            <button key={s} onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); setSuggestions([]); }}
              style={{ width:"100%", textAlign:"left", padding:"11px 14px", background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}44`, color:T.paper, fontSize:13, cursor:"pointer", fontFamily:FONT_HEAD }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// ---------- Resilient storage (uses Claude's artifact storage when present,
// otherwise falls back to real localStorage - which works fine once this is
// deployed as a normal website outside the Claude preview sandbox) ----------
const memoryStore = {};
function lsGet(key) {
  try { const v = localStorage.getItem(key); return v !== null ? v : undefined; } catch { return memoryStore[key]; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch { memoryStore[key] = value; }
}
function lsDelete(key) {
  try { localStorage.removeItem(key); } catch { delete memoryStore[key]; }
}

// ── URL-hash routing helpers — keeps current page alive across refresh ────────
const _ROUTE_TABS = ["home","markets","community","more","history","scalping","subscribe","space-coins"];
function routeRead() {
  try {
    const h = window.location.hash.slice(1);
    if (!h) return { tab: null, sub: null, flag: null };
    const [a, b, c] = h.split("/");
    return { tab: _ROUTE_TABS.includes(a) ? a : null, sub: b || null, flag: c || null };
  } catch { return { tab: null, sub: null, flag: null }; }
}
function routeWrite(tab, sub, flag) {
  try {
    let h = tab || "home";
    if (sub)  h += "/" + encodeURIComponent(sub);
    if (flag) h += "/" + flag;
    const next = "#" + h;
    if (window.location.hash !== next) history.pushState({ ...(history.state || {}), rainxRoute: true }, "", next);
  } catch {}
}
function routeReplace(tab, sub, flag) {
  try {
    let h = tab || "home";
    if (sub)  h += "/" + encodeURIComponent(sub);
    if (flag) h += "/" + flag;
    const next = "#" + h;
    if (window.location.hash !== next) history.replaceState({ ...(history.state || {}), rainxRoute: true }, "", next);
  } catch {}
}
function buildRainxNotificationUrl(target = {}) {
  const params = new URLSearchParams();
  if (target.kind) params.set("rainxTarget", target.kind);
  Object.entries(target).forEach(([key, value]) => {
    if (key !== "kind" && value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return `/?${params.toString()}`;
}
function readRainxNotificationTarget() {
  try {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("rainxTarget");
    if (!kind) return null;
    const target = { kind };
    params.forEach((value, key) => { if (key !== "rainxTarget") target[key] = value; });
    return target;
  } catch {
    return null;
  }
}
async function storageGet(key, shared) {
  if (typeof window !== "undefined" && window.storage && typeof window.storage.get === "function") {
    try { return await window.storage.get(key, shared); } catch { /* fall through */ }
  }
  const v = lsGet(key);
  return v !== undefined ? { key, value: v, shared } : null;
}
async function storageSet(key, value, shared) {
  lsSet(key, value);
  if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") {
    try { return await window.storage.set(key, value, shared); } catch { /* fall through */ }
  }
  return { key, value, shared };
}
async function storageDelete(key, shared) {
  lsDelete(key);
  if (typeof window !== "undefined" && window.storage && typeof window.storage.delete === "function") {
    try { return await window.storage.delete(key, shared); } catch { /* fall through */ }
  }
  return null;
}

// ---------- Asset catalog --------------------------------------------------------
const ASSET_CATALOG = [
  { id:"crypto",  label:"Crypto",  emoji:"₿",  assets:[
    { symbol:"BTCUSD",  name:"Bitcoin",   base:64000, vol:250,  digits:1, cls:"crypto" },
    { symbol:"ETHUSD",  name:"Ethereum",  base:1850,  vol:15,   digits:2, cls:"crypto" },
    { symbol:"SOLUSD",  name:"Solana",    base:140,   vol:3,    digits:2, cls:"crypto" },
    { symbol:"BNBUSD",  name:"BNB",       base:420,   vol:8,    digits:2, cls:"crypto" },
    { symbol:"XRPUSD",  name:"XRP",       base:0.52,  vol:0.02, digits:4, cls:"crypto" },
    { symbol:"DOGEUSD", name:"Dogecoin",  base:0.12,  vol:0.005,digits:4, cls:"crypto" },
  ]},
  { id:"forex",   label:"Forex",   emoji:"$",  assets:[
    { symbol:"EURUSD",  name:"Euro / Dollar",  base:1.085, vol:0.002,digits:5,cls:"forex" },
    { symbol:"GBPUSD",  name:"Pound / Dollar", base:1.265, vol:0.003,digits:5,cls:"forex" },
    { symbol:"USDJPY",  name:"Dollar / Yen",   base:149,   vol:0.3,  digits:3,cls:"forex" },
    { symbol:"AUDUSD",  name:"Aussie / Dollar",base:0.645, vol:0.002,digits:5,cls:"forex" },
    { symbol:"USDCAD",  name:"Dollar / CAD",   base:1.36,  vol:0.002,digits:5,cls:"forex" },
    { symbol:"USDCHF",  name:"Dollar / Swiss", base:0.895, vol:0.002,digits:5,cls:"forex" },
    { symbol:"NZDUSD",  name:"Kiwi / Dollar",  base:0.595, vol:0.002,digits:5,cls:"forex" },
  ]},
  { id:"metals",  label:"Metals",  emoji:"Au", assets:[
    { symbol:"XAUUSD",  name:"Gold",   base:4020, vol:8,   digits:2,cls:"metal" },
    { symbol:"XAGUSD",  name:"Silver", base:28,   vol:0.3, digits:3,cls:"metal" },
  ]},
  { id:"energy",  label:"Energy",  emoji:"⚡", assets:[
    { symbol:"USOIL",   name:"US Oil (WTI)",  base:82, vol:0.8,digits:2,cls:"energy" },
    { symbol:"UKOIL",   name:"UK Oil (Brent)",base:86, vol:0.8,digits:2,cls:"energy" },
  ]},
  { id:"indices", label:"Indices", emoji:"#",  assets:[
    { symbol:"NAS100",  name:"NASDAQ 100", base:17000, vol:80,  digits:1,cls:"index" },
    { symbol:"SPX500",  name:"S&P 500",    base:5200,  vol:25,  digits:1,cls:"index" },
    { symbol:"US30",    name:"Dow Jones",  base:38500, vol:120, digits:1,cls:"index" },
    { symbol:"GER40",   name:"DAX 40",     base:18200, vol:100, digits:1,cls:"index" },
  ]},
];
const ALL_ASSETS = ASSET_CATALOG.flatMap(c => c.assets.map(a => ({ ...a, category:c.id })));
// Keep INSTRUMENTS as the 3 default chart-data assets (price engine seeded for these)
const INSTRUMENTS = ALL_ASSETS;
// Trading unit label for an instrument — "pips" for forex/metals, "points" for crypto/indices/energy.
// (inst.unit was never defined, which caused "undefined" in profit notifications.)
const unitFor = (inst) => (inst && (inst.cls === "forex" || inst.cls === "metal")) ? "pips" : "points";

// ---------- Analysis durations -----------------------------------------------
const ANALYSIS_DURATIONS = [
  { key:"15m", label:"15 MIN",  sublabel:"Fast market analysis",    secs:15*60 },
  { key:"30m", label:"30 MIN",  sublabel:"Short-term setup",        secs:30*60 },
  { key:"1h",  label:"1 HOUR",  sublabel:"Intraday analysis",       secs:60*60 },
  { key:"2h",  label:"2 HOURS", sublabel:"Extended intraday",       secs:2*60*60 },
  { key:"4h",  label:"4 HOURS", sublabel:"Session analysis",        secs:4*60*60 },
  { key:"1d",  label:"1 DAY",   sublabel:"Daily market analysis",   secs:24*60*60 },
];

const STEP_DEFS = [
  { id:"structure", label:"Market Structure", done:"Identified" },
  { id:"sr",        label:"Support & Resistance", done:"Mapped" },
  { id:"trend",     label:"Trend Direction", done:"Bullish" },
  { id:"entry",     label:"Entry Zone", done:"Watching" },
  { id:"confirm",   label:"Confirmation", done:"Pending" },
];

function isMarketOpen(cls) {
  if (cls === "crypto") return true;
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false;
  if (day === 0 && hour < 21) return false;
  if (day === 5 && hour >= 21) return false;
  return true;
}
function nextOpenLabel(cls) {
  if (cls === "crypto") return null;
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 6 || (day === 0 && now.getUTCHours() < 21)) return "Opens Sunday 21:00 UTC";
  if (day === 5 && now.getUTCHours() >= 21) return "Opens Sunday 21:00 UTC";
  return null;
}

// ---------- Price engine ----------
function seedSeries(inst) {
  let price = inst.base + (Math.random() - 0.5) * inst.vol * 8;
  const arr = [];
  const now = Date.now();
  for (let i = 200; i >= 0; i--) {
    const drift = Math.sin(i / 14) * inst.vol * 0.3;
    const noise = (Math.random() - 0.5) * inst.vol;
    price = Math.max(inst.base * 0.7, price + drift + noise);
    arr.push({ t: now - i * 60000, price: Number(price.toFixed(inst.digits)) });
  }
  return arr;
}

function ticksToCandles(ticks, count = 70) {
  if (!ticks || ticks.length < 2) return [];
  const size = Math.max(1, Math.floor(ticks.length / count));
  const out = [];
  for (let i = 0; i + size <= ticks.length; i += size) {
    const chunk = ticks.slice(i, i + size);
    const prices = chunk.map(p => p.price);
    const open = prices[0], close = prices[prices.length - 1];
    const rawHi = Math.max(...prices), rawLo = Math.min(...prices);
    const spread = Math.max(rawHi - rawLo, 0.0001);
    out.push({
      t: chunk[0].t,
      open, close,
      high: rawHi + spread * (0.1 + Math.random() * 0.15),
      low:  rawLo - spread * (0.1 + Math.random() * 0.15),
    });
  }
  return out.slice(-count);
}

function seedSeriesFromPrice(inst, price) {
  const base = seedSeries(inst);
  const shift = price - base[base.length - 1].price;
  return base.map((p) => ({ t: p.t, price: Number((p.price + shift).toFixed(inst.digits)) }));
}

// Module-level ref so the price hook can read the active symbol
// without needing it as a prop (avoids hook-ordering issues).
const _activeSymbolRef = { current: "XAUUSD" };

async function fetchLivePrice(symbol) {
  try {
    const res = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.price ? Number(data.price) : null;
  } catch { return null; }
}

function useMultiPriceSeries() {
  const [seriesMap, setSeriesMap] = useState(() => {
    const m = {};
    INSTRUMENTS.forEach((inst) => (m[inst.symbol] = seedSeries(inst)));
    return m;
  });

  // ── Seed all instruments once on mount ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all(INSTRUMENTS.map(async (inst) => {
        if (cancelled || !isMarketOpen(inst.cls)) return;
        const price = await fetchLivePrice(inst.symbol);
        if (price && !cancelled) {
          setSeriesMap(prev => ({ ...prev, [inst.symbol]: seedSeriesFromPrice(inst, price) }));
        }
      }));
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Background slow rotation for non-active instruments (30 s) ─────────
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const id = setInterval(async () => {
      // Skip the active symbol — it has its own fast poller
      const sym = INSTRUMENTS[i % INSTRUMENTS.length].symbol;
      i++;
      if (sym === _activeSymbolRef.current) return;
      const inst = INSTRUMENTS.find(x => x.symbol === sym);
      if (!inst || !isMarketOpen(inst.cls)) return;
      const price = await fetchLivePrice(sym);
      if (price && !cancelled) {
        setSeriesMap(prev => {
          const arr = prev[sym] || [];
          const newTick = { t: Date.now(), price: Number(price.toFixed(inst.digits)) };
          return { ...prev, [sym]: [...arr.slice(-200), newTick] };
        });
      }
    }, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ── Fast poller: real price every 2 s for the active symbol ────────────
  useEffect(() => {
    let cancelled = false;
    let lastRealPrice = null;

    const poll = async () => {
      const sym = _activeSymbolRef.current;
      const inst = ALL_ASSETS.find(a => a.symbol === sym);
      if (!inst || !isMarketOpen(inst.cls)) return;
      const price = await fetchLivePrice(sym);
      if (price && !cancelled) {
        lastRealPrice = price;
        setSeriesMap(prev => {
          const arr = prev[sym] || [];
          const newTick = { t: Date.now(), price: Number(price.toFixed(inst.digits)) };
          return { ...prev, [sym]: [...arr.slice(-200), newTick] };
        });
      }
    };

    poll();
    const fastId = setInterval(poll, 2000);

    // ── Micro-tick: smooth 500 ms jitter between real API calls ──────────
    const microId = setInterval(() => {
      const sym = _activeSymbolRef.current;
      const inst = ALL_ASSETS.find(a => a.symbol === sym);
      if (!inst || !isMarketOpen(inst.cls)) return;
      setSeriesMap(prev => {
        const arr = prev[sym];
        if (!arr || arr.length < 2) return prev;
        const last = arr[arr.length - 1].price;
        // Tiny random walk: ±4 % of the instrument's per-minute volatility
        const jitter = (Math.random() - 0.5) * inst.vol * 0.04;
        const newPrice = Number(Math.max(inst.base * 0.5, last + jitter).toFixed(inst.digits));
        const newTick  = { t: Date.now(), price: newPrice };
        return { ...prev, [sym]: [...arr.slice(-200), newTick] };
      });
    }, 500);

    return () => { cancelled = true; clearInterval(fastId); clearInterval(microId); };
  }, []); // runs once; reads _activeSymbolRef.current dynamically

  return seriesMap;
}
function sma(values, period) {
  if (values.length < period) return null;
  return values.slice(-period).reduce((a, b) => a + b, 0) / period;
}
function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  const slice = values.slice(-(period + 1));
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i] - slice[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return 100 - 100 / (1 + rs);
}

// ---------- Raina AI ----------
// Signal generation is now handled by the Raina-AI bot (Python FastAPI).
// checkCandle calls /api/signals/long-term/{symbol}?timeframe={tf} directly.
// askRaina now calls the Raina-AI bot directly — no Anthropic/Claude needed.
async function askRaina(history, context) {
  // Extract the symbol from the context string ("EURUSD current price…")
  const symbolMatch = context.match(/\(([A-Z0-9]+)\)/);
  const symbol = symbolMatch ? symbolMatch[1] : "EURUSD";
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, messages: history, context }),
  });
  if (!res.ok) return "Sorry, I couldn't reach the signal engine right now.";
  const data = await res.json();
  return data.reply || "Sorry, I couldn't process that.";
}

// ---------- Small UI ----------
function BiasChip({ bias }) {
  const map = {
    buy: { color: T.sage, label: "BUY", dot: "🟢" },
    sell: { color: T.rust, label: "SELL", dot: "🔴" },
    hold: { color: T.muted, label: "HOLD", dot: "⚪" },
  };
  const m = map[bias] || map.hold;
  return <div style={{ display: "flex", alignItems: "center", gap: 6, color: m.color, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15 }}><span>{m.dot}</span> {m.label}</div>;
}
function playNotifSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  } catch {}
}
function Toast({ toast, items = [], onDone, onDismissOne, onOpen }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [dragX, setDragX] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    if (!toast) return;
    setDragX(0);
    setExpanded(false);
    playNotifSound();
    if (expanded) return; // don't auto-hide while the user is looking at the expanded list
    const id = setTimeout(() => onDoneRef.current(), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  const colorMap = { signal: T.gold, update: T.sage, warning: T.rust, news: T.gold, community: T.gold };
  const count = items.length > 1 ? items.length : (toast.count || 1);

  const onTouchStart = (e) => { if (expanded) return; dragging.current = true; startX.current = e.touches[0].clientX; };
  const onTouchMove = (e) => { if (dragging.current) setDragX(e.touches[0].clientX - startX.current); };
  const onTouchEnd = () => {
    dragging.current = false;
    if (Math.abs(dragX) > 80) onDoneRef.current(); else setDragX(0);
  };

  return (
      <div
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={() => { if (!expanded) { onOpen?.(toast); onDoneRef.current(); } }}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", top: 10, left: 10, right: 10, maxWidth: 460, margin: "0 auto", zIndex: 1000,
        background: T.ink, border: `1px solid ${T.cardBorder}`, borderRadius: 16,
        padding: "12px 14px", boxShadow: "0 10px 32px rgba(0,0,0,0.28)", cursor: expanded ? "default" : "pointer",
        transform: `translateX(${dragX}px)`, opacity: Math.max(0, 1 - Math.abs(dragX) / 200),
        transition: dragging.current ? "none" : "transform 0.2s, opacity 0.2s",
        animation: dragX === 0 ? "slideDown 0.25s ease-out" : "none",
        maxHeight: expanded ? "70vh" : "none", overflowY: expanded ? "auto" : "visible",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {(() => {
          const logo = resolveMarketLogo(toast);
          const dir = resolveMarketDirection(toast);
          if (logo || isMarketNotification(toast)) {
            const src = logo?.src || ((toast?.type === "news" || /news|cpi|nfp|fomc|economic/i.test(`${toast?.title || ""} ${toast?.body || ""}`)) ? FALLBACK_NEWS_LOGO : FALLBACK_RAINX_LOGO);
            return (
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img src={src} alt="" style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0 }} />
                {dir && (
                  <span style={{ position: "absolute", right: -2, bottom: -2, width: 14, height: 14, borderRadius: "50%", background: dir === "buy" ? T.sage : T.rust, border: `1.5px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {dir === "buy" ? <TrendingUp size={8} strokeWidth={3} color="#fff" /> : <TrendingDown size={8} strokeWidth={3} color="#fff" />}
                  </span>
                )}
              </div>
            );
          }
          return (
            <img
              src={`${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}icons/icon-192.png`}
              alt=""
              style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }}
            />
          );
        })()}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontWeight: 800, color: T.paper, flexShrink: 0 }}>RainX</div>
              <div style={{ fontSize: 10.5, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {count > 1 ? `${count} messages` : "Just now"}
              </div>
            </div>
            {count > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                style={{ background: T.card, border: `1px solid ${T.cardBorder}`, color: T.paper, fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 7px", flexShrink: 0, cursor: "pointer", gap: 3 }}
              >
                {count}
                <ChevronDown size={11} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>
            )}
          </div>

          {!expanded && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 13.5, fontWeight: 800, color: T.paper, marginTop: 3 }}>{toast.title}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: T.paper, marginTop: 3, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast.body}</div>
            </>
          )}
        </div>
        {!expanded && (
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={(event) => { event.stopPropagation(); onDoneRef.current(); }}
            style={{ background: "none", border: "none", color: T.muted, padding: 2, display: "flex", flexShrink: 0, cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Expanded list — each queued item shown individually, WhatsApp-style */}
      {expanded && (
        <div style={{ marginTop: 8 }}>
          {items.map((item, i) => (
            <div
              key={item.id ?? i}
              onClick={(e) => { e.stopPropagation(); onOpen?.(item); onDismissOne?.(item); }}
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: i > 0 ? `1px solid ${T.cardBorder}` : "none", cursor: "pointer" }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontWeight: 700, color: colorMap[item.type] || T.paper }}>{item.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.paper, marginTop: 2 }}>{item.body}</div>
              </div>
              <button
                aria-label="Dismiss"
                onClick={(e) => { e.stopPropagation(); onDismissOne?.(item); }}
                style={{ background: "none", border: "none", color: T.muted, padding: 2, flexShrink: 0, cursor: "pointer" }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); onDoneRef.current(); }}
            style={{ width: "100%", marginTop: 6, background: "none", border: "none", color: T.gold, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, padding: "8px 0", cursor: "pointer" }}
          >
            Dismiss all
          </button>
        </div>
      )}
    </div>
  );
}
const getInputStyle = () => ({ flex: 1, background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.paper, padding: 10, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500 });

// ---------- Auth (real Supabase accounts) ----------
async function recordActivity(userId, action, meta) {
  try { await supabase.from("activity_logs").insert({ user_id: userId, action, meta: meta || null }); } catch {}
}

// ---------- Candle-based signal engine ----------
const TIMEFRAMES = [
  { key: "15m", td: "15min", label: "15 Minute" },
  { key: "1h", td: "1h", label: "1 Hour" },
  { key: "4h", td: "4h", label: "4 Hour" },
];

// How long a signal for each timeframe should stay put before we let the
// bot recompute it. This used to be a flat 4 minutes for every timeframe,
// which meant a "1 Hour" signal could get silently replaced after only a
// few minutes. Now each timeframe holds for (roughly) its own candle length.
const TF_STABILITY_MS = {
  "15m": 15 * 60 * 1000,
  "1h":  60 * 60 * 1000,
  "4h":  4 * 60 * 60 * 1000,
  "1d":  24 * 60 * 60 * 1000,
};
const stabilityWindowFor = (tfKey) => TF_STABILITY_MS[tfKey] || 60 * 60 * 1000;

async function saveTradeHistory(account, inst, tf, sig, result, points) {
  if (!account?.id) return;
  try {
    await supabase.from("trade_history").insert({
      user_id: account.id, symbol: inst.symbol, timeframe: tf.label, direction: sig.bias,
      entry: sig.entry, stop_loss: sig.stop_loss, take_profit: sig.take_profit_1,
      result, points, reason: sig.reason,
    });
  } catch { /* history save failing shouldn't block the live trade update */ }
}

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("signup"); // signup | signin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username2, setUsername2] = useState(""); // signup username (separate from profile username)
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [content, setContent] = useState({
    hero_title: "RainX", hero_subtitle: "Powered by Raina AI", hero_tagline: "Your intelligent trading companion.",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("site_content").select("key, value").in("key", ["hero_title", "hero_subtitle", "hero_tagline"]);
        if (data && data.length) {
          const map = {};
          data.forEach((row) => { if (row.value) map[row.key] = row.value; });
          setContent((c) => ({ ...c, ...map }));
        }
      } catch { /* keep defaults if the CMS table isn't reachable */ }
    })();
  }, []);

  const submit = async () => {
    setError(""); setNotice("");
    if (!email.trim() || !password) { setError("Enter your email (or username) and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && !agree) { setError("Please accept the risk disclosure to continue."); return; }
    setBusy(true);

    if (mode === "signup") {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes("@")) { setError("Please enter a valid email address for signup."); setBusy(false); return; }
      if (!firstName.trim() || !lastName.trim()) { setError("Please enter your first and last name."); setBusy(false); return; }
      const { data, error: signErr } = await supabase.auth.signUp({ email: cleanEmail, password });
      if (signErr) {
        const msg = signErr.message || "";
        setError(
          msg.toLowerCase().includes("rate limit")
            ? "Too many signup attempts. Please try again in a few minutes."
            : msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")
            ? "An account with this email already exists. Try signing in instead."
            : msg || "Signup failed. Please try again."
        );
        setBusy(false); return;
      }
      if (data.user) {
        const displayName = username2.trim() || `${firstName.trim()} ${lastName.trim()}`;
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          username: username2.trim() || null,
          display_name: displayName,
          phone: phone.trim() || null,
          country: country.trim() || null,
        }).catch(() => {});
        recordActivity(data.user.id, "signup", { userAgent: navigator.userAgent, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, platform: navigator.platform });
        // Referral attribution — ?ref=CODE in the URL
        try {
          const refCode = new URLSearchParams(window.location.search).get("ref");
          if (refCode) {
            const { data: referrer } = await supabase.from("profiles").select("id").eq("referral_code", refCode).maybeSingle();
            if (referrer?.id) {
              await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", data.user.id).catch(() => {});
            }
          }
        } catch {}
      }
      if (data.user && !data.session) {
        setNotice("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
        setBusy(false);
        return;
      }
      onAuthed(data.session);
    } else {
      // Allow login with username OR email
      let loginEmail = email.trim().toLowerCase();
      if (!loginEmail.includes("@")) {
        // Treat as username — look up associated email via profiles
        const { data: profRow } = await supabase.from("profiles").select("email").ilike("username", loginEmail).maybeSingle();
        if (profRow?.email) {
          loginEmail = profRow.email;
        } else {
          // Try display_name as fallback
          const { data: profRow2 } = await supabase.from("profiles").select("email").ilike("username", loginEmail).maybeSingle();
          if (profRow2?.email) { loginEmail = profRow2.email; }
          else { setError("No account found with that username. Try your email address."); setBusy(false); return; }
        }
      }
      const { data, error: signErr } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signErr) { setError(signErr.message); setBusy(false); return; }
      const { data: profile } = await supabase.from("profiles").select("is_banned, is_suspended").eq("id", data.user.id).single();
      if (profile && (profile.is_banned || profile.is_suspended)) {
        await supabase.auth.signOut();
        setError(profile.is_banned ? "This account has been banned." : "This account is suspended. Contact support.");
        setBusy(false);
        return;
      }
      recordActivity(data.user.id, "login", { userAgent: navigator.userAgent, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, platform: navigator.platform });
      onAuthed(data.session);
    }
    setBusy(false);
  };

  // Local premium palette - scoped to this screen only, doesn't touch the
  // shared T tokens used everywhere else in the app.
  const A = {
    bg: "#0B0B0B", card: "#171513", gold: "#F4D35E",
    goldGrad: "linear-gradient(135deg, #F4D35E 0%, #F4D35E 50%, #F4D35E 100%)",
    border: "rgba(255,255,255,0.08)", gray: "#B4B4B4",
  };
  const [oauthNotice, setOauthNotice] = useState("");

  return (
    <div style={{ minHeight: "100dvh", background: A.bg, color: "#fff", fontFamily: FONT_BODY, display: "flex", flexDirection: "column", padding: "28px 22px", maxWidth: 480, margin: "0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; } body { margin:0; }`}</style>

      <svg width="100%" height="92" viewBox="0 0 320 92" style={{ display: "block", marginBottom: 4 }}>
        <defs>
          <linearGradient id="authRibbon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F4D35E" />
            <stop offset="50%" stopColor="#F4D35E" />
            <stop offset="100%" stopColor="#F4D35E" />
          </linearGradient>
        </defs>
        <path id="authRibbonPath" d="M6 74 C 55 6, 95 6, 140 46 S 250 84, 306 14" stroke="url(#authRibbon)" strokeWidth="22" fill="none" strokeLinecap="round" />
        <text fontSize="8.5" fontWeight="800" letterSpacing="2" fill="#0B0B0B">
          <textPath href="#authRibbonPath" startOffset="6%">PREMIUM SIGNALS FOR TRADERS</textPath>
        </text>
      </svg>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1.25 }}>
          Get <span style={{ color: A.gold }}>high accuracy</span> trading signals and connect with our active community.
        </div>
        <div style={{ fontSize: 11, color: A.gray, fontWeight: 700, letterSpacing: 1.5, marginTop: 10, textTransform: "uppercase" }}>{content.hero_subtitle}</div>
        <div style={{ fontSize: 12.5, color: A.gray, marginTop: 6, fontWeight: 500 }}>{content.hero_tagline}</div>
      </div>

      <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 28, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4 }}>
          {["signup", "signin"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); setNotice(""); }} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12.5, background: mode === m ? A.goldGrad : "transparent", color: mode === m ? "#0B0B0B" : A.gray, transition: "background 0.15s" }}>
              {m === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        {mode === "signup" && (<>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:A.gray, fontWeight:600, letterSpacing:0.3 }}>First Name</label>
              <div style={{ display:"flex", alignItems:"center", marginTop:6, background:A.bg, border:`1px solid ${A.border}`, borderRadius:14, padding:"12px 14px" }}>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:FONT_BODY, fontSize:13 }} />
              </div>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:A.gray, fontWeight:600, letterSpacing:0.3 }}>Last Name</label>
              <div style={{ display:"flex", alignItems:"center", marginTop:6, background:A.bg, border:`1px solid ${A.border}`, borderRadius:14, padding:"12px 14px" }}>
                <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:FONT_BODY, fontSize:13 }} />
              </div>
            </div>
          </div>
          <label style={{ fontSize:11, color:A.gray, fontWeight:600, letterSpacing:0.3 }}>Username</label>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, marginBottom:14, background:A.bg, border:`1px solid ${A.border}`, borderRadius:14, padding:"12px 14px" }}>
            <span style={{ color:A.gray, fontSize:14 }}>@</span>
            <input value={username2} onChange={e=>setUsername2(e.target.value)} placeholder="yourhandle" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:FONT_BODY, fontSize:13.5 }} />
          </div>
        </>)}

        <label style={{ fontSize: 11, color: A.gray, fontWeight: 600, letterSpacing: 0.3 }}>{mode === "signin" ? "Email or Username" : "Email"}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, marginBottom: 16, background: A.bg, border: `1px solid ${A.border}`, borderRadius: 14, padding: "12px 14px" }}>
          <Mail size={16} color={A.gray} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={mode === "signin" ? "Email or @username" : "you@email.com"} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: FONT_BODY, fontSize: 13.5 }} />
        </div>

        {mode === "signup" && (<>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:A.gray, fontWeight:600, letterSpacing:0.3 }}>Phone</label>
              <div style={{ display:"flex", alignItems:"center", marginTop:6, background:A.bg, border:`1px solid ${A.border}`, borderRadius:14, padding:"12px 14px" }}>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 555 000 0000" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:FONT_BODY, fontSize:13 }} />
              </div>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:A.gray, fontWeight:600, letterSpacing:0.3 }}>Country</label>
              <div style={{ display:"flex", alignItems:"center", marginTop:6, background:A.bg, border:`1px solid ${A.border}`, borderRadius:14, padding:"12px 14px" }}>
                <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:FONT_BODY, fontSize:13 }} />
              </div>
            </div>
          </div>
        </>)}

        <label style={{ fontSize: 11, color: A.gray, fontWeight: 600, letterSpacing: 0.3 }}>Password</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, marginBottom: 18, background: A.bg, border: `1px solid ${A.border}`, borderRadius: 14, padding: "12px 14px" }}>
          <ShieldCheck size={16} color={A.gray} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: FONT_BODY, fontSize: 13.5 }} />
        </div>

        {mode === "signup" && (
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: A.gray, marginBottom: 16, lineHeight: 1.6 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2, accentColor: A.gold }} />
            I understand RainX is an analysis tool, not financial advice, and I trade at my own risk.
          </label>
        )}
        {notice && <div style={{ color: "#7A9E86", fontSize: 12, marginBottom: 12 }}>{notice}</div>}
        {error && <div style={{ color: "#E27D6B", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <button onClick={submit} disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: A.goldGrad, color: "#0B0B0B", border: "none", borderRadius: 14, padding: "14px 0", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13.5, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "0 8px 20px rgba(244,211,94,0.25)" }}>
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"} {!busy && <ArrowRight size={15} />}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
          <div style={{ flex: 1, height: 1, background: A.border }} />
          <span style={{ fontSize: 10, color: A.gray }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: A.border }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {["Google", "Apple"].map((provider) => (
            <button key={provider} onClick={() => setOauthNotice(`${provider} sign-in is coming soon.`)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${A.border}`, borderRadius: 12, padding: "11px 0", color: "#fff", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {provider}
            </button>
          ))}
        </div>
        {oauthNotice && <div style={{ fontSize: 10.5, color: A.gray, textAlign: "center", marginTop: 10 }}>{oauthNotice}</div>}
      </div>
    </div>
  );
}

// ---------- Subscription gate ----------
const PLAN_LABELS = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
const PLAN_TIER_RANK = { none: 0, weekly: 1, monthly: 2, yearly: 3 };
const PLAN_FEATURES = {
  weekly: { price: 150, blurb: "Long-term signals (15M/1H), Scalping, trade history, notifications, and Community all included.", scalping: true },
  monthly: { price: 500, blurb: "Everything in Weekly, with extended trade history and priority support.", scalping: true },
  yearly: { price: 6000, blurb: "Everything in Monthly, plus an automatic golden verified badge and priority 24/7 support.", scalping: true },
};

// ---------- Entitlement (what the signed-in user is allowed to see) ----------
function useEntitlement(userId) {
  const [tier, setTier] = useState("loading"); // loading | none | weekly | monthly | biannual
  const [pendingPlan, setPendingPlan] = useState(null);

  const check = useCallback(async () => {
    if (!userId) { setTier("none"); return; }
    const { data: subs } = await supabase
      .from("subscriptions").select("*").eq("user_id", userId).eq("status", "active")
      .order("expires_at", { ascending: false }).limit(1);
    const row = subs && subs[0];
    const active = row && (row.expires_at && new Date(row.expires_at) > new Date());
    if (active) { setTier(row.plan); setPendingPlan(null); return; }

    const { data: pending } = await supabase
      .from("payments").select("plan").eq("user_id", userId).eq("status", "pending")
      .order("submitted_at", { ascending: false }).limit(1);
    setPendingPlan(pending && pending[0] ? pending[0].plan : null);
    setTier("none");
  }, [userId]);

  useEffect(() => { check(); }, [check]);
  return { tier, pendingPlan, refresh: check };
}
function hasAccess(tier, required) {
  return (PLAN_TIER_RANK[tier] || 0) >= (PLAN_TIER_RANK[required] || 0);
}

// ---------- Blur lock overlay (wraps just the gated content, not the page) ----------
function BlurGate({ unlocked, requiredLabel, onSubscribe, children, minHeight = 160 }) {
  if (unlocked) return children;
  return (
    <div style={{ position: "relative", minHeight, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ filter: "blur(7px)", opacity: 0.5, pointerEvents: "none", userSelect: "none" }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15,14,11,0.35)", padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: T.paper, marginBottom: 4 }}>{requiredLabel} subscription required</div>
        <button onClick={onSubscribe} style={{ background: T.gold, color: T.ink, border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, cursor: "pointer", marginTop: 6 }}>
          Subscribe to unlock
        </button>
      </div>
    </div>
  );
}

// ---------- Subscribe screen ----------
// ── Subscribe screen plan definitions ──────────────────────────────────────
const SUB_PLANS = [
  {
    key: "weekly",
    label: "Weekly",
    tag: "Best for short term",
    price: "¢150.00",
    period: "/ week",
    billing: "Billed every week",
    features: [
      { text: "Free Daily Trade Signals",        sub: "60–90% accuracy signals to help you trade smarter" },
      { text: "Blue Verification Badge",         sub: "Stand out with a verified premium profile" },
      { text: "Access to Post Gift Rewards",     sub: "Receive and send exclusive gift rewards" },
      { text: "Advanced Market Insights",        sub: "Get deeper analysis and market trends" },
      { text: "Priority Support",                sub: "Faster response, anytime you need help" },
      { text: "Cancel Anytime",                  sub: "No long-term commitment. Cancel anytime." },
    ],
  },
  {
    key: "monthly",
    label: "Monthly",
    tag: "Most popular",
    price: "¢500.00",
    period: "/ month",
    billing: "Billed every month",
    features: [
      { text: "Everything in Weekly" },
      { text: "Golden Verification Badge",       sub: "Exclusive premium tier recognition" },
      { text: "Scalping Setups",                 sub: "Advanced short-term trade setups" },
      { text: "Priority Signal Alerts",          sub: "In-app push notifications" },
      { text: "Exclusive Market Reports",        sub: "Weekly professional analysis reports" },
      { text: "Cancel Anytime",                  sub: "No long-term commitment. Cancel anytime." },
    ],
  },
  {
    key: "yearly",
    label: "Yearly",
    tag: "Best value",
    price: "¢6000.00",
    period: "/ year",
    billing: "Billed every year",
    features: [
      { text: "Everything in Monthly" },
      { text: "Yearly Premium Badge",            sub: "Highest verification tier on RainX" },
      { text: "VIP Community Access",            sub: "Exclusive trader lounge & signals group" },
      { text: "Personal AI Analysis Sessions",   sub: "Extended Raina AI session time" },
      { text: "Highest Rewards Multiplier",      sub: "2× points on all activity" },
      { text: "Cancel Anytime",                  sub: "No long-term commitment. Cancel anytime." },
    ],
  },
];

function SubscribeScreen({ account, entitlement, onBack }) {
  const [methods, setMethods] = useState(null);
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [planPrices, setPlanPrices] = useState({});

  useEffect(() => {
    supabase.from("payment_methods").select("*").eq("enabled", true).order("sort_order").then(({ data }) => setMethods(data || []));
    supabase.from("plan_prices").select("plan, price").then(({ data }) => {
      if (data) {
        const m = {};
        data.forEach((r) => { m[r.plan] = r.price; });
        setPlanPrices(m);
      }
    }).catch(() => {});
  }, []);

  // Merge static plan definitions with live prices from DB
  const plans = SUB_PLANS.map((p) => ({
    ...p,
    price: planPrices[p.key] != null ? `¢${Number(planPrices[p.key]).toFixed(2)}` : p.price,
  }));
  const plan = plans[activePlanIdx];

  const submitPayment = async () => {
    setBusy(true);
    await supabase.from("payments").insert({ user_id: account.id, plan: plan.key, reference_note: note || null });
    recordActivity(account.id, "payment_submitted", { plan: plan.key });
    setBusy(false);
    setSubmitted(true);
    entitlement.refresh();
  };

  // Pending / submitted state
  if (entitlement.pendingPlan || submitted) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `rgba(244,211,94,0.12)`, border: `2px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <ShieldCheck size={30} color={T.gold} />
        </div>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 17, color: T.paper, marginBottom: 8 }}>Payment Submitted!</div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 20 }}>
          Your {PLAN_LABELS[entitlement.pendingPlan || plan.key]} plan request is awaiting confirmation. Access unlocks automatically once an admin approves your payment.
        </div>
        <button onClick={onBack} style={{ background: T.gold, color: T.ink, border: "none", borderRadius: 12, padding: "12px 32px", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Back to More
        </button>
      </div>
    );
  }

  // Payment method detail
  if (selectedMethod) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={() => setSelectedMethod(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: FONT_HEAD, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 800, color: T.goldBright, marginBottom: 12 }}>{selectedMethod.name}</div>
        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: 18, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: T.paper, lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-wrap" }}>{selectedMethod.instructions}</div>
          {selectedMethod.image_url && (
            <img src={selectedMethod.image_url} alt="Payment details" style={{ width: "100%", borderRadius: 10, marginBottom: 14 }} />
          )}
        </div>
        <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Payment reference (optional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. transaction ID" style={{ ...getInputStyle(), width: "100%", marginBottom: 14 }} />
        <button onClick={submitPayment} disabled={busy} style={{ width: "100%", background: T.goldGradient, color: T.ink, border: "none", borderRadius: 13, padding: "14px 0", fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          {busy ? "Submitting…" : "I've Paid — Confirm →"}
        </button>
      </div>
    );
  }

  // Choose payment method
  if (false) { /* handled below inline */ }

  // Main plan picker
  return (
    <div style={{ background: T.ink, minHeight: "100%", paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "24px 20px 16px" }}>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 20, color: T.goldBright, marginBottom: 4 }}>Upgrade Plan</div>
        <div style={{ fontSize: 12.5, color: T.muted }}>Choose the plan that works best for you</div>
      </div>

      {/* Gold badge icon */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldBright}, ${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 28px ${T.gold}55` }}>
          <ShieldCheck size={38} color="#fff" strokeWidth={1.8} />
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 24, padding: "0 20px" }}>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 19, color: T.paper, marginBottom: 5 }}>Unlock More. Earn More.</div>
        <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>Get premium tools, rewards, and insights{"\n"}to stay ahead in the market.</div>
      </div>

      {/* Plan tabs */}
      <div style={{ margin: "0 16px 16px", background: T.card, borderRadius: 14, padding: 4, display: "flex", gap: 2 }}>
        {plans.map((p, i) => (
          <button
            key={p.key}
            onClick={() => setActivePlanIdx(i)}
            style={{
              flex: 1, padding: "10px 4px", borderRadius: 11,
              background: activePlanIdx === i ? T.gold : "transparent",
              border: "none", cursor: "pointer",
              fontFamily: FONT_HEAD, fontWeight: 700,
              color: activePlanIdx === i ? T.ink : T.muted,
              fontSize: 11.5, lineHeight: 1.3, textAlign: "center",
            }}
          >
            <div>{p.label}</div>
            <div style={{ fontSize: 9.5, fontWeight: 600, marginTop: 1, opacity: 0.85 }}>{p.tag}</div>
          </button>
        ))}
      </div>

      {/* Plan card */}
      <div style={{ margin: "0 16px 16px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 18, padding: 20, position: "relative", overflow: "hidden" }}>
        {/* Price + gold bars */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: T.goldBright, marginBottom: 6 }}>{plan.label} Plan</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 30, color: T.paper }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: T.muted, fontFamily: FONT_HEAD }}>{plan.period}</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{plan.billing}</div>
          </div>
          <GoldBarsIcon />
        </div>

        {/* Feature list */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {plan.features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: `rgba(244,211,94,0.15)`, border: `1px solid ${T.gold}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 11, color: T.gold, fontWeight: 800 }}>✓</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: T.paper }}>{f.text}</div>
                {f.sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 1, lineHeight: 1.5 }}>{f.sub}</div>}
              </div>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 10, color: T.ink, fontWeight: 800 }}>✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods secure strip */}
      <div style={{ margin: "0 16px 16px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <ShieldCheck size={18} color={T.goldBright} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: T.goldBright }}>Secure &amp; Trusted Payments</div>
          <div style={{ fontSize: 10.5, color: T.muted, marginTop: 1 }}>Your payment information is fully encrypted</div>
        </div>
        {/* Payment logos */}
        <div style={{ display: "flex", gap: 6 }}>
          {["VISA", "MC", "MTN"].map(m => (
            <div key={m} style={{ background: m === "VISA" ? "#1434CB" : m === "MC" ? "#EB001B" : "#FFCC00", borderRadius: 4, padding: "3px 6px", fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 9, color: m === "MTN" ? "#000" : "#fff" }}>{m}</div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {methods === null ? (
        <div style={{ margin: "0 16px", background: T.gold, borderRadius: 14, padding: "15px 0", textAlign: "center", fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 15, color: T.ink, cursor: "pointer" }}>
          Loading…
        </div>
      ) : methods.length === 0 ? (
        <div style={{ margin: "0 16px 8px", background: T.goldGradient, borderRadius: 14, padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          onClick={() => alert("No payment methods configured. Please contact support.")}>
          <span style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 15, color: T.ink }}>Subscribe Now</span>
          <span style={{ fontSize: 20, color: T.ink }}>→</span>
        </div>
      ) : methods.length === 1 ? (
        <button onClick={() => setSelectedMethod(methods[0])} style={{ margin: "0 16px 8px", width: "calc(100% - 32px)", background: T.goldGradient, color: T.ink, border: "none", borderRadius: 14, padding: "15px 20px", fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Subscribe Now</span><span style={{ fontSize: 20 }}>→</span>
        </button>
      ) : (
        <div style={{ margin: "0 16px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          {methods.map(m => (
            <button key={m.id} onClick={() => setSelectedMethod(m)} style={{ width: "100%", background: T.goldGradient, color: T.ink, border: "none", borderRadius: 14, padding: "13px 20px", fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Subscribe via {m.name}</span><span style={{ fontSize: 18 }}>→</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
        <ShieldCheck size={12} color={T.muted} />
        <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT_HEAD }}>14-Day Money Back Guarantee</span>
      </div>
    </div>
  );
}

// ---------- Main App ----------
function MainApp({ account, onLogout }) {
  return <MainAppContent account={account} onLogout={onLogout} />;
}

class HomeTabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error("HomeTab crash:", error, info);
    // Keep the rest of the app usable if an old persisted home value is malformed.
    // Recovery is handled by the Retry action so React does not reload in a loop.
  }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight: "60vh", padding: "48px 20px", background: "#F8F9FA", color: "#0F1419", textAlign: "center", fontFamily: FONT_BODY }}>
        <div style={{ fontSize: 30, marginBottom: 12 }}>RainX</div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>The home screen could not be refreshed.</div>
        <div style={{ fontSize: 12, color: "#536471", marginBottom: 18 }}>Your account and other screens are safe.</div>
        <button onClick={() => {
          try {
            ["rainx-active-symbol", "rainx-active-markets", "rainx-sessions", "rainx-home-recovery-attempted"].forEach((key) => localStorage.removeItem(key));
            sessionStorage.removeItem("rainx-home-recovery-attempted");
          } catch {}
          window.location.reload();
        }} style={{ border: 0, borderRadius: 10, padding: "11px 18px", background: "#F4D35E", color: "#0F1419", fontWeight: 700 }}>Retry</button>
      </div>
    );
    return this.props.children;
  }
}

class MoreTabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: String(e) }; }
  componentDidCatch(e, info) { console.error("MoreTab crash:", e, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 24, color: "#C0392B", background: "#fff8f8", fontSize: 13, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", border: "2px solid #C0392B", margin: 16, borderRadius: 8 }}>
        <strong>MoreTab crashed — screenshot this:</strong>{" "}{this.state.error}
      </div>
    );
    return this.props.children;
  }
}

class FullChartErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: String(e && e.message || e) }; }
  componentDidCatch(e, info) { console.error("FullChartView crash:", e, info); }
  render() {
    if (this.state.error) return (
      <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff8f8", padding: 24 }}>
        <div style={{ color: "#C0392B", fontSize: 13, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", border: "2px solid #C0392B", padding: 16, borderRadius: 8, maxWidth: 320, textAlign: "center" }}>
          <strong>Full Chart crashed — screenshot this:</strong>{"\n"}{this.state.error}
        </div>
        <button onClick={this.props.onClose} style={{ marginTop: 16, background: "#C0392B", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Close</button>
      </div>
    );
    return this.props.children;
  }
}

function NavAssetIcon({ kind, active }) {
  const fill = active ? "#F4D35E" : "currentColor";
  const paths = {
    home: {
      outline: "M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z",
      filled: "M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z"
    },
    wallet: {
      outline: "M216,64H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,56V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,128H56a8,8,0,0,1-8-8V78.63A23.84,23.84,0,0,0,56,80H216Zm-48-60a12,12,0,1,1,12,12A12,12,0,0,1,168,132Z",
      filled: "M216,64H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,56V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm-36,80a12,12,0,1,1,12-12A12,12,0,0,1,180,144Z"
    },
    community: {
      outline: "M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z",
      filled: "M64.12,147.8a4,4,0,0,1-4,4.2H16a8,8,0,0,1-7.8-6.17,8.35,8.35,0,0,1,1.62-6.93A67.79,67.79,0,0,1,37,117.51a40,40,0,1,1,66.46-35.8,3.94,3.94,0,0,1-2.27,4.18A64.08,64.08,0,0,0,64,144C64,145.28,64,146.54,64.12,147.8Zm182-8.91A67.76,67.76,0,0,0,219,117.51a40,40,0,1,0-66.46-35.8,3.94,3.94,0,0,0,2.27,4.18A64.08,64.08,0,0,1,192,144c0,1.28,0,2.54-.12,3.8a4,4,0,0,0,4,4.2H240a8,8,0,0,0,7.8-6.17,8.33,8.33,0,0,0-0.63-6.93A67.76,67.76,0,0,0,219,117.51Zm-89,43.18a48,48,0,1,0-58.37,0A72.13,72.13,0,0,0,65.07,212,8,8,0,0,0,72,224H184a8,8,0,0,0,6.93-12A72.15,72.15,0,0,0,157.19,182.07Z"
    }
  };
  const selected = paths[kind] || paths.home;
  return <svg width="26" height="26" viewBox="0 0 256 256" aria-hidden="true"><path d={active ? selected.filled : selected.outline} fill={fill} /></svg>;
}

function CenterNavLogo({ active, onActivate }) {
  const [energized, setEnergized] = useState(false);
  const pulseTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
  }, []);

  const handleActivate = () => {
    setEnergized(true);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => setEnergized(false), 920);
    onActivate();
  };

  return (
    <button
      type="button"
      aria-label="Open RainX centerpiece"
      onClick={handleActivate}
      className={`rx-center-nav-control${active ? " is-active" : ""}${energized ? " is-energized" : ""}`}
    >
      <span
        className="rx-center-nav-stage"
        aria-hidden="true"
        style={{ width: 84, height: 84, background: "transparent", transform: "translateY(5px)" }}
      >
        <span
          className="rx-center-nav-aura"
          style={{ opacity: 0.28, filter: "blur(9px)", boxShadow: "none" }}
        />
        <span
          className="rx-center-nav-core"
          style={{
            inset: 12,
            borderColor: "rgba(255,255,255,0.98)",
            boxShadow: "0 0 0 4px rgba(255,255,255,0.98), 0 0 12px 5px rgba(244,211,94,0.28), inset 0 1px 3px rgba(255,255,255,0.38), inset 0 0 10px rgba(180,130,30,0.12)",
          }}
        >
          <img src={rainxLogoTransparent} alt="" />
        </span>
        <span className="rx-center-nav-ripple rx-center-nav-ripple-one" />
        <span className="rx-center-nav-ripple rx-center-nav-ripple-two" />
      </span>
    </button>
  );
}

function formatNotificationCount(count) {
  if (!count) return null;
  return count > 99 ? "99+" : String(count);
}

function classifyNotification(notification) {
  const section = String(notification?.section || "").toLowerCase();
  const type = String(notification?.type || "").toLowerCase();
  const text = `${notification?.title || ""} ${notification?.body || ""}`.toLowerCase();
  const markets = ["signal", "market", "trade", "update", "warning", "news", "stop loss", "take profit", "entry", "cpi", "nfp", "fomc", "forex", "crypto", "gold", "trading alert"];
  const community = ["like", "likes", "comment", "comments", "reply", "replies", "mention", "mentions", "follow", "follows", "repost", "reposts", "community", "social"];
  const more = ["reward", "wallet", "monetiz", "subscription", "referral", "verif", "creator", "connection", "payout"];
  // Explicit community metadata always wins over keyword matching. A community
  // comment can legitimately mention trading/markets in its text, but it must
  // never be routed into the trading notification section.
  if (["home", "markets", "market", "community", "more"].includes(section)) return section === "market" ? "markets" : section;
  if (["community", "social", "like", "comment", "reply", "mention", "follow", "repost"].includes(type) || community.some((word) => text.includes(word))) return "community";
  if (["signal", "market", "trade", "update", "warning", "news"].includes(type) || markets.some((word) => text.includes(word))) return "markets";
  if (["reward", "wallet", "monetization", "subscription", "referral", "verification", "creator", "connection", "payout", "risk"].includes(type) || more.some((word) => text.includes(word))) return "more";
  return "home";
}

function PullToRefresh({ children }) {
  // Pull-to-refresh is intentionally disabled globally. Refreshes are internal.
  return children;
}

// Referral screens use their own portal, so the refresh affordance must live
// inside the portal as well. This keeps the indicator visible without changing
// the app-wide refresh behavior.
function WalletTab({ account }) {
  return (
    <div style={{ minHeight:"100%", background:T.ink, paddingBottom:20 }}>
      <div style={{ padding:"18px 16px 8px" }}>
        <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:24, color:T.paper }}>Wallet</div>
        <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>Your trader wallet, balance and transactions</div>
      </div>
      <CreatorWalletScreen account={account} />
    </div>
  );
}

function MainAppContent({ account, onLogout }) {
  const seriesMap = useMultiPriceSeries();
  const seriesMapRef = useRef(seriesMap);
  seriesMapRef.current = seriesMap;
  const entitlement = useEntitlement(account.id);
  // ── Route state: URL hash is the source of truth; localStorage is fallback ─
  const [morePage, setMorePage] = useState(() => {
    const { tab: rt, sub, flag } = routeRead();
    // More sub-pages belong to More only. Keep the header profile overlay
    // separate so a stale profile route cannot replace the More landing view.
    if (rt === "more" && sub) return sub;
    if (flag === "h" && sub === "profile-menu") return sub;
    return null;
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutClosing, setLogoutClosing] = useState(false);
  const closeLogoutConfirm = () => {
    setLogoutClosing(true);
    window.setTimeout(() => { setShowLogoutConfirm(false); setLogoutClosing(false); }, 300);
  };

  const appRootRef = useRef(null);
  const navSlideRef = useRef(0);
  const [navSlide, setNavSlide] = useState(0);
  const [tab, setTab] = useState(() => {
    const { tab: urlTab } = routeRead();
    if (urlTab && urlTab !== "space-coins") return urlTab === "markets" ? "wallet" : urlTab;
    const t = lsGet("rainx-tab");
    return t === "markets" ? "wallet" : (_ROUTE_TABS.includes(t) ? t : "home");
  });
  const [profileFromHeader, setProfileFromHeader] = useState(() => routeRead().flag === "h");
  const [communityProfileOpen, setCommunityProfileOpen] = useState(false);
  // Keep Community mounted behind the active tab so its shell and first feed
  // query are ready before Android receives the tab tap.
  const [communityMounted, setCommunityMounted] = useState(true);
  const [spaceCoinsScreen, setSpaceCoinsScreen] = useState(() => {
    const { tab: urlTab, sub } = routeRead();
    return urlTab === "space-coins" && (sub === "intro" || sub === "dashboard") ? sub : null;
  });
  const [scalpingMounted,  setScalpingMounted]  = useState(false);
  useEffect(() => {
    if (tab === "community" && !communityMounted) setCommunityMounted(true);
    if (tab === "scalping"  && !scalpingMounted)  setScalpingMounted(true);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const node = appRootRef.current;
    if (!node) return;
    let previousTop = node.scrollTop;
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const currentTop = node.scrollTop;
        const delta = currentTop - previousTop;
        const next = currentTop <= 0 ? 0 : Math.max(0, Math.min(92, navSlideRef.current + delta));
        navSlideRef.current = next;
        setNavSlide(next);
        previousTop = currentTop;
      });
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => { node.removeEventListener("scroll", handleScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  // ── Telegram-style animated navigation ───────────────────────────────────
  const prevTabRef = useRef("home");
  const tabDirRef  = useRef(1);    // 1 = slide from right, −1 = from left

  const goTab = (key, forcedDir) => {
    if (key === "community") setCommunityMounted(true);
    const ORDER = { home: 0, wallet: 1, community: 2, more: 3, history: 3, scalping: 3, subscribe: 3 };
    tabDirRef.current  = forcedDir ?? ((ORDER[key] ?? 0) >= (ORDER[prevTabRef.current] ?? 0) ? 1 : -1);
    prevTabRef.current = key;
    setTab(key);
    routeWrite(key, null, null);
  };
  const [activeSymbol, setActiveSymbol] = useState(() => {
    const saved = lsGet("rainx-active-symbol");
    if (saved) { _activeSymbolRef.current = saved; return saved; }
    try {
      const markets = JSON.parse(lsGet("rainx-active-markets") || "[]");
      const s = markets[0] || "XAUUSD";
      _activeSymbolRef.current = s;
      return s;
    } catch { _activeSymbolRef.current = "XAUUSD"; return "XAUUSD"; }
  });
  // ─── Per-market sessions map (persisted to localStorage) ────────────────────
  // sessions = { [symbol]: { symbol, name, startTime, stepIndex, steps, activities, overlays, setup, state } }
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = JSON.parse(lsGet("rainx-sessions") || "{}");
      // Scrub stale signal overlays for any TF that has a stored HOLD setup.
      // These were written by the pre-fix code which kept old entry/SL/TP overlays
      // in overlaysByTf even when the signal turned to HOLD.
      Object.values(saved).forEach(sess => {
        if (!sess || typeof sess !== "object") return;
        if (sess.overlaysByTf && sess.setupByTf) {
          Object.entries(sess.setupByTf).forEach(([tfKey, setup]) => {
            if (setup?.bias === "HOLD") {
              sess.overlaysByTf[tfKey] = [];
              // Also remove _tf-tagged overlays for this TF from session.overlays
              if (Array.isArray(sess.overlays)) {
                sess.overlays = sess.overlays.filter(o => o._tf !== tfKey);
              }
            }
          });
        }
      });
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch { return {}; }
  });
  // Derive the active session (for display) from the currently viewed symbol.
  // Older builds could persist null or another non-map value here.
  const session = sessions && typeof sessions === "object" ? (sessions[activeSymbol] || null) : null;
  const activeInst = ALL_ASSETS.find(i => i.symbol === (session?.symbol || activeSymbol)) || ALL_ASSETS.find(i => i.symbol === "XAUUSD");
  const inst = activeInst;
  const marketOpen = isMarketOpen(inst.cls);

  const series = seriesMap[activeSymbol] || seriesMap["XAUUSD"] || [];
  const prices = series.map((p) => p.price);
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2] || last;
  const changePct = ((last - prev) / prev) * 100;
  const sma20 = sma(prices, 20);
  const sma50 = sma(prices, 50);
  const rsiVal = rsi(prices, 14);

  const [signalsMap, setSignalsMap] = useState({}); // { [symbol]: { "15m": signal, "1h": signal } }
  const [loadingKey, setLoadingKey] = useState(null); // `${symbol}_${tfKey}` currently being analyzed
  const [selectedTf, setSelectedTf] = useState("15m");
  const [notifications, setNotifications] = useState([]);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [toastQueue, setToastQueue] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  const [activeToastItems, setActiveToastItems] = useState([]);
  const notificationSeenStorageKey = `rainx-seen-notif-ids:${account?.id || "anonymous"}`;
  const notificationsHydratedRef = useRef(false);
  const pendingNotificationEntriesRef = useRef([]);
  const seenNotificationIdsRef = useRef((() => {
    try {
      const stored = JSON.parse(localStorage.getItem(notificationSeenStorageKey) || "[]");
      return new Set(stored);
    } catch { return new Set(); }
  })());
  const persistSeenNotificationIds = () => {
    try {
      localStorage.setItem(
        notificationSeenStorageKey,
        JSON.stringify([...seenNotificationIdsRef.current].slice(-300)),
      );
    } catch {}
  };
  const [autoScan, setAutoScan] = useState(true);
  const lastCandleTimeRef = useRef({}); // `${symbol}_${tfKey}` -> datetime string of the last candle we saw
  const notifiedKeysRef = useRef(new Set()); // tracks which symbol+timeframe combos have had their first real check this session — separate from lastCandleTimeRef, which gets pre-populated from the DB on load and was wrongly reused for this, causing old signals to instantly notify on every app open/refresh

  
  // ─── Active markets (max 3 the user explicitly monitors) ────────────────────
  const [activeMarkets, setActiveMarkets] = useState(() => {
    try { const saved = JSON.parse(lsGet("rainx-active-markets") || "[]"); return Array.isArray(saved) ? saved.filter((symbol) => typeof symbol === "string") : []; } catch { return []; }
  });
  const [lastMarketReset, setLastMarketReset] = useState(() => lsGet("rxMarketResetDate") || "");
  const MAX_ACTIVE_MARKETS = 3;
  const addActiveMarket = useCallback((symbol) => {
    setActiveMarkets(prev => {
      if (prev.includes(symbol)) return prev;
      if (prev.length >= MAX_ACTIVE_MARKETS) return prev; // Replace flow handled in AddMarketSheet
      const next = [...prev, symbol];
      lsSet("rainx-active-markets", JSON.stringify(next));
      void supabase.from("user_active_markets").upsert(
        { user_id: account.id, symbol },
        { onConflict: "user_id,symbol" },
      ).then(({ error }) => {
        if (error) console.error("[RainX] active market sync failed", error);
      });
      return next;
    });
  }, [account?.id]);
  const replaceActiveMarket = useCallback((oldSymbol, newSymbol) => {
    setActiveMarkets(prev => { const index = prev.indexOf(oldSymbol); if (index < 0 || prev.includes(newSymbol)) return prev; const next = [...prev]; next[index] = newSymbol; lsSet("rainx-active-markets", JSON.stringify(next)); return next; });
    setSessions(prev => { const next = { ...prev }; delete next[oldSymbol]; return next; });
  }, []);
  const reorderActiveMarkets = useCallback((symbols) => {
    const next = symbols.filter((symbol, index, list) => list.indexOf(symbol) === index).slice(0, MAX_ACTIVE_MARKETS);
    setActiveMarkets(next); lsSet("rainx-active-markets", JSON.stringify(next));
  }, []);
  const removeActiveMarket = useCallback((symbol) => {
    setActiveMarkets(prev => {
      const next = prev.filter(s => s !== symbol);
      lsSet("rainx-active-markets", JSON.stringify(next));
      return next;
    });
    void supabase.from("user_active_markets").delete()
      .eq("user_id", account.id)
      .eq("symbol", symbol)
      .then(({ error }) => {
        if (error) console.error("[RainX] active market removal sync failed", error);
      });
    // Also drop the session for this market so analysis doesn't run in background
    setSessions(prev => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  }, [account?.id]);
  const resetMarkets = useCallback(() => {
    const today = new Date().toDateString();
    if (lastMarketReset !== today) {
       if (window.confirm("This will reset your selections. You can only do this once today.")) {
         setActiveMarkets([]);
         lsSet("rainx-active-markets", JSON.stringify([]));
         setLastMarketReset(today);
         lsSet("rxMarketResetDate", today);
         void supabase.from("user_active_markets").delete()
           .eq("user_id", account.id)
           .then(({ error }) => {
             if (error) console.error("[RainX] active market reset sync failed", error);
           });
       }
    } else {
       alert("You have already reset your market selections today. Try again tomorrow.");
    }
  }, [lastMarketReset, account?.id]);

  // Auto-restore removed: on page refresh, no market is auto-selected or auto-analyzed.
  // The user must manually select a market to begin analysis.

  // ─── Analysis session step progression engine (runs for ALL analyzing markets)
  // Key encodes symbol+stepIndex for every analyzing session so the effect re-fires
  // each time any session advances a step.
  const _analyzingKey = Object.entries(sessions)
    .filter(([, s]) => s.state === "analyzing" && s.stepIndex < STEP_DEFS.length)
    .map(([sym, s]) => `${sym}:${s.stepIndex}`)
    .join(",");
  useEffect(() => {
    if (!_analyzingKey) return;
    const timers = _analyzingKey.split(",").map(entry => {
      const [symbol, stepIdxStr] = entry.split(":");
      const stepIdx = Number(stepIdxStr);
      const delay = 2800 + Math.random() * 3200;
      return setTimeout(() => {
        setSessions(prev => {
          const sess = prev[symbol];
          if (!sess || sess.state !== "analyzing" || sess.stepIndex !== stepIdx) return prev;
          const ni = sess.stepIndex + 1;
          const steps = STEP_DEFS.map((s, i) => ({ ...s, status: i < ni ? "done" : i === ni ? "active" : "pending" }));
          const base = sess.overlays.filter(o => o._step !== sess.stepIndex);
          const inst2 = ALL_ASSETS.find(a => a.symbol === symbol) || ALL_ASSETS[0];
          const price = (seriesMapRef.current[symbol] || []).slice(-1)[0]?.price || inst2.base;
          const vol = inst2.vol;
          let newOverlays = [...base];
          if (stepIdx === 0) {
            newOverlays.push({ _step:0, type:"trendline",        price1: price - vol*6, price2: price - vol*1, label:"Uptrend Line" });
            newOverlays.push({ _step:0, type:"swing_high",       price: price + vol*4, idx: 8  });
            newOverlays.push({ _step:0, type:"swing_high",       price: price + vol*2.5, idx: 18 });
            newOverlays.push({ _step:0, type:"swing_low",        price: price - vol*5, idx: 12 });
            newOverlays.push({ _step:0, type:"swing_low",        price: price - vol*3, idx: 22 });
            newOverlays.push({ _step:0, type:"market_structure", price: price + vol*4, idx: 8,  label:"HH" });
            newOverlays.push({ _step:0, type:"market_structure", price: price - vol*5, idx: 12, label:"HL" });
          } else if (stepIdx === 1) {
            newOverlays.push({ _step:1, type:"resistance",    price: price + vol*2.5, label:"Resistance Zone" });
            newOverlays.push({ _step:1, type:"support_zone",  priceLow: price - vol*2.5, priceHigh: price - vol*1 });
            newOverlays.push({ _step:1, type:"liquidity",     priceLow: price + vol*2.2, priceHigh: price + vol*3.0 });
            newOverlays.push({ _step:1, type:"liquidity",     priceLow: price - vol*3.0, priceHigh: price - vol*2.2 });
          } else if (stepIdx === 2) {
            newOverlays.push({ _step:2, type:"channel",
              price1: price - vol*6, price2: price - vol*1,
              price3: price - vol*5, price4: price + vol*0.5,
            });
          } else if (stepIdx === 3) {
            newOverlays.push({ _step:3, type:"entry_zone", priceLow: price - vol*0.5, priceHigh: price + vol*0.5 });
            newOverlays.push({ _step:3, type:"breakout",   priceLow: price + vol*0.4, priceHigh: price + vol*1.2 });
          }
          // Step 4: no placeholder overlays — real signal comes from checkCandle
          newOverlays = newOverlays.filter(o => o.type !== "current_price");
          newOverlays.push({ type:"current_price", price });
          const actMsg = [
            "Market structure mapped — bullish higher highs forming.",
            `Support zone identified near ${(price - vol*1.5).toFixed(inst2.digits)}.`,
            "Trend direction confirmed — bullish bias maintained.",
            `Entry zone identified ${(price - vol*0.5).toFixed(inst2.digits)} – ${(price + vol*0.5).toFixed(inst2.digits)}. Monitoring price action.`,
            "Confirmation pending — watching for momentum shift.",
          ][stepIdx] || "Analysis progressing.";
          const activities = [{ time: new Date().toLocaleTimeString(), text: actMsg }, ...sess.activities].slice(0, 20);
          const state = ni >= STEP_DEFS.length ? "watching" : "analyzing";
          return { ...prev, [symbol]: { ...sess, stepIndex: ni, steps, overlays: newOverlays, activities, setup: sess.setup || null, state } };
        });
      }, delay);
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_analyzingKey]);

  // Persist active symbol so it survives refresh
  useEffect(() => { lsSet("rainx-active-symbol", activeSymbol); _activeSymbolRef.current = activeSymbol; }, [activeSymbol]);

  // Persist all sessions to localStorage whenever they change
  useEffect(() => { lsSet("rainx-sessions", JSON.stringify(sessions)); }, [sessions]);

  // On mount: auto-start sessions for any active market that doesn't have one yet
  // (handles fresh installs or cleared localStorage while activeMarkets was already saved)
  useEffect(() => {
    setActiveMarkets(prev => {
      prev.forEach(symbol => {
        setSessions(s => {
          if (s[symbol]) return s; // session already exists — keep it
          const asset = ALL_ASSETS.find(a => a.symbol === symbol);
          if (!asset) return s;
          const now = Date.now();
          return {
            ...s,
            [symbol]: {
              symbol: asset.symbol, name: asset.name, startTime: now, stepIndex: 0,
              steps: STEP_DEFS.map((st, i) => ({ ...st, status: i === 0 ? "active" : "pending" })),
              activities: [{ time: new Date().toLocaleTimeString(), text: `Raina AI resuming analysis on ${asset.symbol}.` }],
              overlays: [], setup: null, state: "analyzing",
            },
          };
        });
      });
      return prev; // don't change activeMarkets — side-effect only
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Activity heartbeat during watching phase (runs for ALL watching markets)
  const _watchingKey = Object.keys(sessions).filter(sym => sessions[sym]?.state === "watching").join(",");
  useEffect(() => {
    if (!_watchingKey) return;
    const msgs = [
      "Price action remains constructive above support.",
      "Monitoring momentum indicators for confirmation.",
      "No significant structure changes detected.",
      "Resistance zone holding. Watching for breakout.",
      "Bullish structure intact. Setup still developing.",
      "Price consolidating near entry zone.",
    ];
    const id = setInterval(() => {
      setSessions(prev => {
        const next = { ...prev };
        let changed = false;
        _watchingKey.split(",").forEach(symbol => {
          const s = prev[symbol];
          if (!s || s.state !== "watching") return;
          const text = msgs[Math.floor(Math.random() * msgs.length)];
          next[symbol] = { ...s, activities: [{ time: new Date().toLocaleTimeString(), text }, ...s.activities].slice(0, 20) };
          changed = true;
        });
        return changed ? next : prev;
      });
    }, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_watchingKey]);

  // Session countdown
  const [sessionSecsLeft] = useState(0); // Session runs continuously — no countdown

  const startAnalysisSession = useCallback((asset) => {
    const now = Date.now();
    setSessions(prev => ({
      ...prev,
      [asset.symbol]: {
        symbol: asset.symbol,
        name: asset.name,
        startTime: now,
        stepIndex: 0,
        steps: STEP_DEFS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })),
        activities: [{ time: new Date().toLocaleTimeString(), text: `Raina AI starting analysis on ${asset.symbol}. Studying market structure…` }],
        overlays: [],
        setup: null,
        state: "analyzing",
      }
    }));
  }, []);

  // ─── Theme ─────────────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState(() => lsGet("rainx-theme") || "light");
  const [showSidebar, setShowSidebar] = useState(false);
  const isDark = themeMode === "dark" || (themeMode === "system" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  // Mutate T in-place BEFORE children render — all 200+ T.xxx refs in child components pick up new values automatically
  Object.assign(T, isDark ? DARK_TOKENS : LIGHT_TOKENS);
  useEffect(() => { document.body.style.background = T.ink; }, [isDark]);
  useEffect(() => { lsSet("rainx-tab", tab); }, [tab]);
  useEffect(() => { if (morePage !== null) lsSet("rainx-morepage", morePage); else lsDelete("rainx-morepage"); }, [morePage]);
  // Keep URL hash in sync with current route state (replaceState — no new history entry)
  useEffect(() => {
    if (spaceCoinsScreen) {
      routeReplace("space-coins", spaceCoinsScreen, null);
    } else {
      routeReplace(tab, morePage, profileFromHeader ? "h" : null);
    }
  }, [tab, morePage, profileFromHeader, spaceCoinsScreen]);
  const pushReferralPage = (page) => {
    const state = { ...(window.history.state || {}), rainxReferralPage: page };
    routeWrite("more", page, profileFromHeader ? "h" : null);
    window.history.replaceState(state, "", window.location.href);
    setMorePage(page);
  };
  const backReferralPage = () => {
    if (window.history.state?.rainxReferralPage) { window.history.back(); return; }
    setMorePage(null);
    routeReplace("more", null, profileFromHeader ? "h" : null);
  };

  // Handle native shell back events without ever falling outside the app.
  const handleNativeBack = useCallback(() => {
    if (showSidebar) { setShowSidebar(false); return true; }
    if (showLogoutConfirm) { closeLogoutConfirm(); return true; }
    if (spaceCoinsScreen === "dashboard") { setSpaceCoinsScreen("intro"); return true; }
    if (spaceCoinsScreen === "intro") { setSpaceCoinsScreen(null); goTab("home", -1); return true; }
    if (profileFromHeader && morePage) {
      if (morePage !== "profile-menu") { setMorePage("profile-menu"); return true; }
      setMorePage(null); setProfileFromHeader(false); return true;
    }
    if (tab === "more" && morePage) { setMorePage(null); return true; }
    if (tab !== "home") {
      if (window.history.state?.rainxRoute) window.history.back();
      else { setTab("home"); setMorePage(null); setSpaceCoinsScreen(null); routeReplace("home", null, null); }
      return true;
    }
    return false;
  }, [showSidebar, showLogoutConfirm, spaceCoinsScreen, profileFromHeader, morePage, tab]);

  useEffect(() => registerNativeBackHandler(handleNativeBack, "app-route"), [handleNativeBack]);

  // Sync browser Back/Forward to React state
  useEffect(() => {
    const onPop = () => {
      const { tab: t, sub: mp, flag } = routeRead();
      if (t === "space-coins") {
        setSpaceCoinsScreen(mp === "dashboard" ? "dashboard" : "intro");
        return;
      }
      setSpaceCoinsScreen(null);
      if (t) { const ORDER={home:0,wallet:1,community:2,more:3,history:3,scalping:3,subscribe:3}; tabDirRef.current=(ORDER[t]??0)>=(ORDER[prevTabRef.current]??0)?1:-1; prevTabRef.current=t; setTab(t); }
      setMorePage(mp ?? null);
      setProfileFromHeader(flag === "h");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const unreadSections = notifications.reduce((counts, notification) => {
    if (!notification.read) counts[classifyNotification(notification)] += 1;
    return counts;
  }, { home: 0, markets: 0, community: 0, more: 0 });
  const navBadges = {
    home: formatNotificationCount(unreadSections.home),
    markets: formatNotificationCount(unreadSections.markets),
    community: formatNotificationCount(unreadSections.community + communityUnreadCount),
    more: formatNotificationCount(unreadSections.more),
  };
  const unreadCount = notifications.filter((n) => !n.read).length;

  const announceRainxPresence = useCallback((activeChatUserId = null) => {
    const presence = {
      type: "RAINX_PRESENCE",
      accountId: account?.id || null,
      visible: document.visibilityState === "visible",
      activeChatUserId,
      updatedAt: Date.now(),
    };
    try { localStorage.setItem("rainx_presence", JSON.stringify(presence)); } catch {}
    try {
      if ("serviceWorker" in navigator) {
        if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage(presence);
        else navigator.serviceWorker.ready.then(reg => reg.active?.postMessage(presence)).catch(() => {});
      }
    } catch {}
  }, [account?.id]);

  // Announce that RainX is open. DMScreen overrides activeChatUserId while a
  // conversation is open.
  useEffect(() => {
    announceRainxPresence();
    const onVisibilityChange = () => announceRainxPresence();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onVisibilityChange);
    };
  }, [announceRainxPresence]);

  const enqueueInAppNotification = useCallback((entry) => {
    // Realtime can deliver the same row before the initial notification history
    // has finished loading. Hold it until hydration has claimed all persisted IDs
    // so an off-app push is not replayed as an in-app banner after launch.
    if (!notificationsHydratedRef.current) {
      pendingNotificationEntriesRef.current.push(entry);
      return false;
    }
    const key = entry?.id == null
      ? `${entry?.type || "notification"}:${entry?.title || ""}:${entry?.body || ""}`
      : String(entry.id);
    if (seenNotificationIdsRef.current.has(key)) return false;
    seenNotificationIdsRef.current.add(key);
    persistSeenNotificationIds();
    if (seenNotificationIdsRef.current.size > 300) {
      const oldest = seenNotificationIdsRef.current.values().next().value;
      if (oldest) seenNotificationIdsRef.current.delete(oldest);
    }
    setNotifications((list) => [entry, ...list.filter((n) => String(n.id) !== key)].slice(0, 50));
    // The service worker owns OS notifications when the app is not visible.
    // When RainX is open, this queue owns the single in-app banner instead.
    setToastQueue((queue) => [...queue, entry]);
    return true;
  }, [notificationSeenStorageKey]);

  const openNotificationTarget = useCallback((entry) => {
    const data = entry?.data || {};
    const target = data.targetKind ? data : entry;
    if (!target?.targetKind) return;
    const url = buildRainxNotificationUrl({
      kind: target.targetKind,
      userId: target.userId || target.senderId,
      conversationId: target.conversationId,
      postId: target.postId,
      symbol: target.symbol,
      timeframe: target.timeframe,
      notificationAction: "open",
    });
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    if (target.targetKind === "signal") {
      const nextSymbol = target.symbol;
      if (nextSymbol) {
        lsSet("rainx-active-symbol", nextSymbol);
        _activeSymbolRef.current = nextSymbol;
        setActiveSymbol(nextSymbol);
      }
      setTab("home");
      return;
    }
    setTab(target.targetKind === "chat" || target.targetKind === "post" ? "community" : "home");
    lsSet("rainx-pending-notification", JSON.stringify({
      ...target,
      expiresAt: Date.now() + 60_000,
    }));
  }, []);

  const pushNotification = useCallback(async (n) => {
    // Subscribers do NOT receive trading signal / economic news push notifications
    // (signals are shown in-app on the chart; push notifications are sent for confirmed signals)
    const tradingKw = ["buy","sell","take profit","stop loss"," tp "," sl ","entry","cpi","nfp","fomc","reversal","signal"];
    const isTradingNotif = ["signal","update","warning","news"].includes(n.type) ||
      tradingKw.some(kw => (n.title||"").toLowerCase().includes(kw) || (n.body||"").toLowerCase().includes(kw));
    if (isTradingNotif && !hasAccess(entitlement?.tier, "weekly")) return; // only send trading notifs to subscribers
    let id = Date.now() + Math.random();
    if (account?.id) {
      const targetKind = n.targetKind || (n.type === "signal" || n.type === "update" || n.type === "warning" ? "signal" : undefined);
      const target = {
        targetKind,
        symbol: n.symbol,
        timeframe: n.timeframe,
        postId: n.postId,
        conversationId: n.conversationId,
        senderId: n.senderId,
      };
      // Persist with type/section/data so notifications survive reload and
      // market logos / buy-sell badges still resolve after closing the app.
      // Try the full insert first; fall back to title+body only if the extra
      // columns don't exist yet on the user_notifications table.
      let rowId = null;
      try {
        const fullInsert = {
          user_id: account.id,
          title: n.title,
          body: n.body,
          type: n.type || null,
          section: n.section || null,
          data: target,
        };
        const r = await supabase.from("user_notifications").insert(fullInsert).select("id").single();
        if (r?.data?.id) rowId = r.data.id;
        else if (r?.error) throw r.error;
      } catch (_) {
        // Fallback: the table may not have type/section/data columns yet.
        try {
          const r2 = await supabase.from("user_notifications").insert({ user_id: account.id, title: n.title, body: n.body }).select("id").single();
          if (r2?.data?.id) rowId = r2.data.id;
        } catch (__) {}
      }
      if (rowId) id = rowId;
    }
    const targetKind2 = n.targetKind || (n.type === "signal" || n.type === "update" || n.type === "warning" ? "signal" : undefined);
    const target = {
      targetKind: targetKind2,
      symbol: n.symbol,
      timeframe: n.timeframe,
      postId: n.postId,
      conversationId: n.conversationId,
      senderId: n.senderId,
    };
    const entry = { id, read: false, time: new Date().toLocaleTimeString(), created_at: new Date().toISOString(), ...n, data: target };
    enqueueInAppNotification(entry);
    // Relative URLs fail in the Capacitor WebView (local origin) — must be absolute.
    const apiBase = "https://rainxapp.vercel.app";
    fetch(`${apiBase}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: account.id,
        title: n.title,
        body: n.body,
        data: {
          ...target,
          kind: n.type === "signal" || n.type === "update" || n.type === "warning" ? "signal" : (n.type || "default"),
          category: n.type === "warning" ? "sl" : (n.type === "update" ? "tp" : (n.type || "default")),
          notificationId: String(id),
          tag: n.type === "signal" || n.type === "update" || n.type === "warning"
            ? "rainx-signal"
            : `rainx-${n.type || "notification"}`,
          group: n.type === "signal" || n.type === "update" || n.type === "warning"
            ? "rainx-signals"
            : "rainx",
          url: targetKind ? buildRainxNotificationUrl(target) : "/",
        },
      }),
    }).catch(() => {});
  }, [account, entitlement?.tier, enqueueInAppNotification]);

  // Native Capacitor/FCM foreground delivery uses the same routing rules as
  // service-worker delivery. Android shows the system notification while the
  // app is backgrounded; when the app is open we surface it in-app here.
  useEffect(() => {
    if (!account?.id) return undefined;
    const handleNativePush = (event) => {
      const notification = event?.detail || {};
      const data = notification?.data || {};
      const kind = String(data.kind || data.category || "").toLowerCase();
      const category = String(data.category || "").toLowerCase();
      const isCommunity = kind === "community" || ["like", "comment", "comment_reply", "reply", "comment_like", "follow", "repost", "mention", "chat"].includes(kind) || category === "community" || category === "chat";
      if (isCommunity) {
        window.dispatchEvent(new CustomEvent("rainx:community-notification-received"));
        return;
      }
      if (document.visibilityState === "visible") {
        enqueueInAppNotification({
          id: data.notificationId || data.messageId || `${notification.title || "RainX"}::${notification.body || ""}`,
          title: notification.title || "RainX",
          body: notification.body || "",
          type: data.kind || data.category || "update",
          read: false,
          time: new Date().toLocaleTimeString(),
          created_at: new Date().toISOString(),
          data,
        });
      }
    };
    window.addEventListener("rainx:native-push-received", handleNativePush);
    return () => window.removeEventListener("rainx:native-push-received", handleNativePush);
  }, [account?.id, enqueueInAppNotification]);

  // ─── One account-scoped notification bridge for every RainX surface ────────
  useEffect(() => {
    if (!account?.id) return undefined;
    const handleMsg = (event) => {
      if (event.data?.type === "RAINX_PUSH_RECEIVED") {
        const payload = event.data.payload || {};
        const data = payload.data || {};
        const kind = String(data.kind || "").toLowerCase();
        const category = String(data.category || "").toLowerCase();
        // Community notifications have their own persistent source of truth
        // (`community_notifications`). Do not copy a community push into the
        // generic trading/home notification list: doing so made it appear in
        // the wrong area and then disappear after refresh because that list is
        // rehydrated from `user_notifications`.
        const COMMUNITY_KINDS = new Set(["chat", "like", "comment", "comment_reply", "reply", "comment_like", "follow", "repost", "mention"]);
        if (COMMUNITY_KINDS.has(kind) || category === "community") {
          window.dispatchEvent(new CustomEvent("rainx:community-notification-received"));
          return;
        }
        if (document.visibilityState === "visible") enqueueInAppNotification({
          id: data.notificationId || data.messageId || `${payload.title || ""}::${payload.body || ""}`,
          title: payload.title || "RainX",
          body: payload.body || "",
          type: kind === "chat" ? "community" : (data.kind || "update"),
          read: false,
          time: new Date().toLocaleTimeString(),
          data,
        });
        return;
      }
      if (event.data?.type === "RAINX_NOTIFICATION_ACTION") {
        const data = event.data.payload || {};
        if (data.url) window.location.assign(data.url);
        return;
      }
      if (event.data?.type !== "PLAY_SOUND" || !event.data.soundSrc) return;
      try {
        const audio = new Audio(event.data.soundSrc);
        audio.volume = 0.8;
        audio.play().catch(() => {}); // silently ignore autoplay policy rejections
      } catch {}
    };
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", handleMsg);
    return () => {
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", handleMsg);
    };
  }, [account?.id, enqueueInAppNotification]);

  // Push is the background delivery path. These realtime channels are the
  // foreground fallback and deliberately do not suppress an open chat.
  useEffect(() => {
    if (!account?.id) return undefined;
    const channel = supabase.channel("rainx-in-app-notifications-" + account.id)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "community_notifications",
        filter: `user_id=eq.${account.id}`,
      }, ({ new: row }) => {
        // Community notifications are owned by CommunityTab and
        // `community_notifications`. Keep the shell badge in sync, but do not
        // inject the row into the generic notification history.
        setCommunityUnreadCount((count) => count + 1);
        try { window.dispatchEvent(new CustomEvent("rainx:community-notification-received")); } catch {}
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "direct_messages",
        filter: `receiver_id=eq.${account.id}`,
      }, ({ new: message }) => {
        if (document.visibilityState === "visible") enqueueInAppNotification({
          id: message.id,
          title: "New Message",
          body: message.content || "",
          type: "community",
          read: false,
          time: new Date().toLocaleTimeString(),
          data: {
            targetKind: "chat",
            userId: message.sender_id,
            senderId: message.sender_id,
            conversationId: [account.id, message.sender_id].sort().join("_"),
          },
        });
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "user_notifications",
        filter: `user_id=eq.${account.id}`,
      }, ({ new: row }) => {
        if (document.visibilityState === "visible") enqueueInAppNotification({
          id: row.id,
          title: row.title || "RainX",
          body: row.body || "",
          type: row.type || "update",
          read: !!row.read,
          time: new Date().toLocaleTimeString(),
          data: row.data || {},
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [account?.id, enqueueInAppNotification]);

  // Native Capacitor/FCM is the only notification transport in the mobile app.

  useEffect(() => {
    if (!activeToast && toastQueue.length > 0) {
      setActiveToast({ ...toastQueue[0], count: toastQueue.length });
      setActiveToastItems(toastQueue);
      setToastQueue([]);
    }
  }, [toastQueue, activeToast]);

  // Load this account's past notifications (survives logout, new device, etc.)
  useEffect(() => {
    if (!account?.id) return;
    (async () => {
      try {
        const deliveredPushIds = await readDeliveredPushIds();
        deliveredPushIds.forEach((id) => seenNotificationIdsRef.current.add(id));
        const { data } = await supabase.from("user_notifications").select("*").eq("user_id", account.id).order("created_at", { ascending: false }).limit(50);
        const loaded = (data || []).map((row) => ({
            id: row.id, title: row.title, body: row.body,
            type: row.type || null, section: row.section || null,
            read: row.read, time: new Date(row.created_at).toLocaleTimeString(), created_at: row.created_at,
            // Reconstruct the data object (symbol etc.) so market logos resolve
            // after the app is closed and reopened.
            data: row.data || {},
            symbol: row.data?.symbol || row.symbol || null,
        }));
        loaded.forEach((row) => seenNotificationIdsRef.current.add(String(row.id)));
        persistSeenNotificationIds();
        setNotifications((current) => {
          const loadedIds = new Set(loaded.map((n) => String(n.id)));
          const localOnly = current.filter((n) => !loadedIds.has(String(n.id)));
          return [...localOnly, ...loaded].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 50);
        });
      } catch { /* keep starting empty if this fails */ }
      finally {
        notificationsHydratedRef.current = true;
        const pending = pendingNotificationEntriesRef.current;
        pendingNotificationEntriesRef.current = [];
        pending.forEach((entry) => enqueueInAppNotification(entry));
      }
    })();
  }, [account?.id, enqueueInAppNotification, notificationSeenStorageKey]);

  useEffect(() => {
    if (!account?.id) return;
    let cancelled = false;
    (async () => {
      const [{ data, error }, { data: authUser }] = await Promise.all([
        supabase.from("account_settings").select("settings,security_prefs").eq("user_id", account.id).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      setAccountPhone(authUser?.user?.phone || "");
      const lockConfig = await getNativeLockConfig(account.id).catch(() => null);
      if (cancelled) return;
      if (!error && data?.settings && typeof data.settings === "object") {
        setSettingsPrefs(prev => {
          const next = { ...prev, ...data.settings };
          if (next.postVisibility) setPostVisibility(next.postVisibility);
          if (next.theme && ["light", "dark", "system"].includes(next.theme)) setThemeMode(next.theme);
          return next;
        });
      }
      const serverSecurity = data?.security_prefs && typeof data.security_prefs === "object" ? { ...data.security_prefs } : {};
      delete serverSecurity.pinHash;
      delete serverSecurity.biometricCredentialId;
      if (lockConfig) {
        serverSecurity.pinEnabled = lockConfig.pinEnabled;
        serverSecurity.appLock = lockConfig.appLock;
        serverSecurity.biometricEnabled = lockConfig.biometricEnabled;
        serverSecurity.pinLength = lockConfig.pinLength;
      }
      setSecurityPrefs(serverSecurity);
      setAccountSettingsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [account?.id]);

  const loadSecuritySessions = useCallback(async () => {
    if (!account?.id) return;
    setSecuritySessionsLoading(true);
    try {
      const [{ data: sessionData }, { data: activityData }] = await Promise.all([
        supabase.rpc("get_my_auth_sessions"),
        supabase.from("activity_logs").select("id,action,meta,created_at").eq("user_id", account.id).in("action", ["login","signup"]).order("created_at", { ascending:false }).limit(30),
      ]);
      setSecuritySessions(sessionData || []);
      setLoginHistoryRows(activityData || []);
    } finally { setSecuritySessionsLoading(false); }
  }, [account?.id]);

  const refreshTwoFactor = useCallback(async () => {
    if (!account?.id || !supabase.auth.mfa?.listFactors) return;
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return;
    const verified = (data?.totp || []).find(factor => factor.status === "verified");
    setTwoFactorFactor(verified || null);
    if (verified) persistSecurity({ twoFactorEnabled: true, twoFactorFactorId: verified.id });
    else persistSecurity({ twoFactorEnabled: false, twoFactorFactorId: undefined });
  }, [account?.id]);

  useEffect(() => { refreshTwoFactor(); }, [refreshTwoFactor]);

  const beginTwoFactorEnrollment = async () => {
    setTwoFactorLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "RainX Authenticator",
      });
      if (error) throw error;
      setTwoFactorEnrollment(data);
      setTwoFactorCode("");
    } catch (error) {
      alert(error?.message || "Unable to start authenticator setup.");
    } finally { setTwoFactorLoading(false); }
  };

  const verifyTwoFactorEnrollment = async () => {
    if (!twoFactorEnrollment?.id || !/^\d{6}$/.test(twoFactorCode)) {
      alert("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setTwoFactorLoading(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: twoFactorEnrollment.id });
      if (challengeError) throw challengeError;
      const { error } = await supabase.auth.mfa.verify({
        factorId: twoFactorEnrollment.id,
        challengeId: challenge.id,
        code: twoFactorCode,
      });
      if (error) throw error;
      setTwoFactorFactor({ id: twoFactorEnrollment.id, status: "verified", factor_type: "totp" });
      setTwoFactorEnrollment(null);
      setTwoFactorCode("");
      persistSecurity({ twoFactorEnabled: true, twoFactorFactorId: twoFactorEnrollment.id });
      alert("Two-step authentication is enabled.");
    } catch (error) {
      alert(error?.message || "That authenticator code could not be verified.");
    } finally { setTwoFactorLoading(false); }
  };

  const disableTwoFactor = async () => {
    if (!twoFactorFactor?.id) return;
    setTwoFactorLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: twoFactorFactor.id });
      if (error) throw error;
      setTwoFactorFactor(null);
      persistSecurity({ twoFactorEnabled: false, twoFactorFactorId: undefined });
      alert("Two-step authentication disabled.");
    } catch (error) {
      alert(error?.message || "Unable to disable two-step authentication.");
    } finally { setTwoFactorLoading(false); }
  };

  useEffect(() => {
    if (settingsSheet !== "sessions" && settingsSheet !== "loginHistory") return;
    setLoginHistoryLoading(true);
    loadSecuritySessions().finally(() => setLoginHistoryLoading(false));
  }, [settingsSheet, loadSecuritySessions]);

  const setupPin = async () => {
    setPinError("");
    if (!/^\d{4,6}$/.test(pinValue)) { setPinError("Enter a 4–6 digit PIN."); return; }
    if (pinValue !== pinConfirm) { setPinError("PINs do not match."); return; }
    try {
      await saveNativePin(pinValue, account?.id);
      persistSecurity({ pinEnabled: true, appLock: true, pinLength: pinValue.length });
      if (enableBiometricAfterPin) {
        try {
          await setNativeBiometricEnabled(true, account?.id);
          persistSecurity({ biometricEnabled: true, appLock: true });
        } catch (biometricError) {
          alert(biometricError?.message || "PIN saved. Biometric setup can be completed later.");
        }
        setEnableBiometricAfterPin(false);
      }
      setPinValue(""); setPinConfirm(""); setSecuritySheet(null);
    } catch (error) {
      setPinError(error?.message || "Unable to save PIN securely.");
    }
  };
  const setupPasskey = async () => {
    try {
      const deviceConfig = await getNativeLockConfig(account?.id).catch(() => null);
      if (!deviceConfig?.pinEnabled) {
        setEnableBiometricAfterPin(true);
        setPinValue(""); setPinConfirm(""); setPinError("");
        setSecuritySheet("pin");
        return;
      }
      if (Capacitor.isNativePlatform()) {
        await setNativeBiometricEnabled(true, account?.id);
        persistSecurity({ biometricEnabled: true, appLock: true });
        return;
      }
      if (!("PublicKeyCredential" in window) || !navigator.credentials?.create) {
        alert("Face ID / device passkeys are not supported on this device or browser.");
        return;
      }
      const platformReady = typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
        ? await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false)
        : true;
      if (platformReady === false) {
        alert("A device biometric authenticator is not available. You can use a PIN instead.");
        return;
      }
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const credential = await navigator.credentials.create({ publicKey: {
        challenge,
        rp: { name: "RainX" },
        user: { id: userId, name: account?.email || "rainx-user", displayName: fullName || username || "RainX User" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
        timeout: 60000,
        attestation: "none",
      }});
      if (credential?.rawId) {
        const id = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        persistSecurity({ biometricEnabled: true, biometricCredentialId: id, appLock: true });
      }
    } catch (e) {
      if (e?.name !== "NotAllowedError") alert(e?.message || "Face ID / passkey setup could not be completed.");
    }
  };
  const disableBiometric = async () => {
    try {
      if (Capacitor.isNativePlatform()) await setNativeBiometricEnabled(false, account?.id);
      persistSecurity({ biometricEnabled: false, appLock: securityPrefs.pinEnabled ? securityPrefs.appLock : false });
    } catch (error) {
      alert(error?.message || "Unable to disable biometric unlock.");
    }
  };
  const toggleAppLock = async () => {
    const enabled = !(securityPrefs.appLock ?? false);
    const deviceConfig = enabled ? await getNativeLockConfig(account?.id).catch(() => null) : null;
    if (enabled && !deviceConfig?.pinEnabled) {
      setSecuritySheet("appLockSetup");
      return;
    }
    try {
      if (Capacitor.isNativePlatform()) await setNativeAppLock(enabled, account?.id);
      persistSecurity({ appLock: enabled });
    } catch (error) {
      alert(error?.message || "Unable to update App Lock.");
    }
  };
  const requestDataDeletion = async () => {
    if (!account?.id) return;
    const { data: pending } = await supabase.from("account_data_deletion_requests")
      .select("id").eq("user_id", account.id).eq("status", "pending").maybeSingle();
    if (pending) {
      alert("A data deletion request is already pending.");
      return;
    }
    const { error } = await supabase.from("account_data_deletion_requests").insert({
      user_id: account.id,
      status: "pending",
      requested_at: new Date().toISOString(),
    });
    alert(error ? "Unable to submit the data deletion request." : "Data deletion request submitted.");
  };
  const requestAccountDeletion = async () => {
    if (!account?.id) return;
    const { data: pending } = await supabase.from("account_deletion_requests")
      .select("id").eq("user_id", account.id).eq("status", "pending").maybeSingle();
    if (pending) {
      alert("An account deletion request is already pending.");
      setSecuritySheet(null);
      return;
    }
    const { error } = await supabase.from("account_deletion_requests").insert({
      user_id: account.id,
      status: "pending",
      requested_at: new Date().toISOString(),
      notes: "Requested from RainX Security settings",
    });
    setSecuritySheet(null);
    alert(error ? "Unable to submit the account deletion request." : "Account deletion request submitted for review.");
  };
  const reportSecurityIssue = async (reportType) => {
    if (!account?.id) return;
    const { error } = await supabase.from("security_reports").insert({
      user_id: account.id,
      report_type: reportType,
      details: "Submitted from RainX Security settings",
      status: "open",
    });
    setSecuritySheet(null);
    alert(error ? "Unable to submit the security report." : "Security report submitted.");
  };
  const generateRecoveryCodes = async () => {
    if (!account?.id) return;
    const codes = Array.from({ length: 8 }, () =>
      `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    );
    const rows = await Promise.all(codes.map(async (code) => ({
      user_id: account.id,
      code_hash: await hashPin(code),
    })));
    await supabase.from("account_recovery_codes").delete().eq("user_id", account.id).is("used_at", null);
    const { error } = await supabase.from("account_recovery_codes").insert(rows);
    if (error) {
      alert("Unable to generate recovery codes.");
      return;
    }
    setRecoveryCodes(codes);
  };
  useEffect(() => {
    if (morePage !== "profile-menu") setAppearanceOpen(false);
  }, [morePage]);
  // PWA install — deferred prompt + installed flag
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  useEffect(() => {
    if (appInstalled) return;
    const _bip = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const _ai  = () => { setAppInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', _bip);
    window.addEventListener('appinstalled', _ai);
    return () => { window.removeEventListener('beforeinstallprompt', _bip); window.removeEventListener('appinstalled', _ai); };
  }, [appInstalled]);
  // Trader Rewards progress counters — declared here (Rules of Hooks: no hooks after early returns)
  const [followerCount, setFollowerCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [impressionCount, setImpressionCount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  useEffect(() => {
    if (!account?.id) return;
    supabase.from("follows").select("*",{count:"exact",head:true}).eq("followed_id",account.id)
      .then(({count})=>setFollowerCount(count||0)).catch(()=>{});
    supabase.from("referrals").select("*").eq("referrer_id",account.id).eq("status","qualified")
      .then(({data})=>{ const rows=data||[]; setReferralCount(rows.length); setReferralEarnings(rows.reduce((sum,row)=>sum+Number(row.reward_amount ?? row.earnings ?? row.amount ?? row.commission ?? 0),0)); }).catch(()=>{});
    supabase.from("community_posts").select("views").eq("user_id",account.id)
      .then(({data})=>setImpressionCount((data||[]).reduce((s,p)=>s+(p.views||0),0))).catch(()=>{});
  }, [account?.id]);

  // Map subscription tier → verification badge (single source of truth)
  const tierToVerif = (t) => {
    if (t === "yearly") return "golden";
    if (t === "monthly" || t === "weekly") return "blue";
    return null;
  };

  useEffect(() => {
    if (!account?.id) return;
    supabase.from("profiles").select("username, full_name, bio, avatar_url, referral_code").eq("id", account.id).single().then(({ data }) => {
      if (data) {
        setUsername(data.username || "");
        setFullName(data.full_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || null);
        setReferralCode(data.referral_code || "");
      }
      setProfileLoaded(true);
    }).catch(() => { setProfileLoaded(true); });
    supabase.from("site_content").select("value").eq("key", "more_benefits").single().then(({ data }) => {
      if (data?.value) { try { setBenefits(JSON.parse(data.value)); } catch { /* use defaults */ } }
    });
  }, [account?.id]);

  // Derive verification from live entitlement and keep DB in sync
  useEffect(() => {
    if (!account?.id || entitlement.tier === "loading") return;
    supabase.from("profiles").select("is_official").eq("id", account.id).single().then(({ data: prof }) => {
      if (prof?.is_official) {
        // Official accounts (RainX, Raina AI, etc.) always stay official-badged — never derived from subscription status
        setVerification("official");
        supabase.from("profiles").update({ badge: "official" }).eq("id", account.id).then(() => {});
        return;
      }
      const expected = tierToVerif(entitlement.tier);
      setVerification(expected);
      supabase.from("profiles").update({ badge: expected || "none" }).eq("id", account.id).then(() => {});
    });
  }, [account?.id, entitlement.tier]);

  const compressImage = (file, maxDim = 400, quality = 0.82) => new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxDim || h > maxDim) {
        if (w >= h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else        { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(src);
      // Prefer WebP; fall back to JPEG if browser returns null blob
      canvas.toBlob((blob) => {
        if (blob) { resolve(blob); return; }
        canvas.toBlob((jpegBlob) => resolve(jpegBlob || file), "image/jpeg", quality);
      }, "image/webp", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error("Image load failed")); };
    img.src = src;
  });

  // Helper: detect the actual MIME type from a Blob (WebP or JPEG)
  const blobMime = (blob) => blob?.type || "image/jpeg";

  const uploadAvatar = async (file) => {
    setUploadingAvatar(true);
    try {
      const blob = await compressImage(file, 400, 0.82);
      if (!blob) throw new Error("Image compression returned empty result");
      const mime = blobMime(blob);
      const ext = mime === "image/webp" ? "webp" : "jpg";
      const path = `${account.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: mime });
      if (upErr) throw new Error("Storage upload failed: " + upErr.message);
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      if (!urlData?.publicUrl) throw new Error("Could not get public URL after upload");
      const versionedUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: versionedUrl }).eq("id", account.id);
      if (dbErr) throw new Error("Failed to save photo: " + dbErr.message);
      setAvatarUrl(versionedUrl);
      notifyAvatarRefresh();
      setProfileMsg("Photo updated. ✓");
    } catch (err) { setProfileMsg("Photo upload failed: " + (err?.message || "unknown")); }
    setUploadingAvatar(false);
  };

  const uploadCover = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const blob = await compressImage(file, 1280, 0.82);
      if (!blob) throw new Error("Image compression returned empty result");
      const mime = blobMime(blob);
      const ext = mime === "image/webp" ? "webp" : "jpg";
      const path = `${account.id}/cover.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: mime });
      if (upErr) throw new Error("Storage upload failed: " + upErr.message);
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      if (!urlData?.publicUrl) throw new Error("Could not get public URL after upload");
      const versionedUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      const { error: dbErr } = await supabase.from("profiles").update({ cover_url: versionedUrl }).eq("id", account.id);
      if (dbErr) throw new Error("Cover save failed: " + dbErr.message);
      // Re-read to confirm persistence
      const { data: confirmed } = await supabase.from("profiles").select("cover_url").eq("id", account.id).single();
      setCoverUrl(confirmed?.cover_url || versionedUrl);
    } catch (err) { setProfileMsg("Cover upload failed: " + (err?.message || "unknown")); }
    setUploadingCover(false);
  };


  const uploadCoverBlob = async (blob) => {
    if (!blob) return;
    setUploadingCover(true);
    try {
      const path = `${account.id}/cover.jpg`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr && upErr.statusCode !== '200' && upErr.statusCode !== '409') throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const versionedUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      const { error: dbErr } = await supabase.from('profiles').update({ cover_url: versionedUrl }).eq('id', account.id);
      if (dbErr) throw new Error('Cover save failed: ' + dbErr.message);
      // Re-read to confirm persistence
      const { data: confirmed } = await supabase.from('profiles').select('cover_url').eq('id', account.id).single();
      setCoverUrl(confirmed?.cover_url || versionedUrl);
    } catch (err) { setProfileMsg('Cover upload failed: ' + (err?.message || 'unknown')); }
    setUploadingCover(false);
  };
  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg("");
    const clean = username.trim() ? username.trim().replace(/[\x00-\x1F\x7F]/g, "").slice(0, 30) : null;
    const { error } = await supabase.from("profiles").update({ username: clean, bio: bio.trim() }).eq("id", account.id);
    setSavingProfile(false);
    setProfileMsg(error ? (error.code === "23505" ? "That username is taken." : "Something went wrong.") : "Saved.");
  };

  const rewardsPlan = entitlement.tier === "none" ? "Not enrolled" :
    entitlement.tier === "weekly"   ? "Weekly Rewards"    :
    entitlement.tier === "monthly"  ? "Monthly Rewards"   :
    entitlement.tier === "yearly"   ? "Yearly Rewards"    : "Loading…";

  const verificationLabel =
    verification === "golden" ? "Golden Verified" :
    verification === "blue"   ? "Blue Verified"   :
    verification === "verified" || verification === "basic" ? "Verified" :
    "Not Verified";

  const BLUE = "#5B9CF6";
  const verificationColor =
    verification === "golden" ? T.goldBright :
    verification === "blue"   ? BLUE         : T.muted;

  // Don't expose email as initial before profile loads — show neutral "?" until username resolves
  const profileInitial = (username || (profileLoaded ? account?.email : null) || "?")[0]?.toUpperCase();

  // ---- Sub-screens ----
  // Extended profile state (load on open)
  const [location, setLocation] = useState("");
  const [dob, setDob] = useState("");
  const [profileFollowers, setProfileFollowers] = useState(0);
  const [profileFollowing, setProfileFollowing] = useState(0);
  const [showFollowListOwn, setShowFollowListOwn] = useState(null); // "followers" | "following" | null
  const [dobPrivacy, setDobPrivacy] = useState(() => lsGet("rainx-dob-privacy") || "daymonth");
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [coverUrl, setCoverUrl] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profileTab, setProfileTab] = useState("posts");
  const [profilePostsLoading, setProfilePostsLoading] = useState(false);
  const [profileComposerText, setProfileComposerText] = useState("");
  const [profileComposerPosting, setProfileComposerPosting] = useState(false);
  const [showProfileFabModal, setShowProfileFabModal] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  useEffect(() => {
    if (!account?.id || morePage !== "profile") return;
    supabase.from("profiles").select("full_name,location,date_of_birth,cover_url").eq("id",account.id).single().then(({data})=>{
      if(data){ setFullName(data.full_name||""); setLocation(data.location||""); setDob(data.date_of_birth||""); if(data.cover_url) setCoverUrl(data.cover_url); }
    }).catch(()=>{});
    setProfilePostsLoading(true);
    (async () => {
      try {
        const { data } = await supabase.from("community_posts").select("*").eq("user_id",account.id).order("created_at",{ascending:false});
        const rows = data || [];
        setProfilePosts(rows);
        setProfilePostsLoading(false);
      } catch { setProfilePostsLoading(false); }
    })();

    supabase.from("follows").select("*",{count:"exact",head:true}).eq("followed_id",account.id).then(({count})=>setProfileFollowers(count||0), ()=>{});
    supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",account.id).then(({count})=>setProfileFollowing(count||0), ()=>{});

    // Mutual followers: people who follow me AND whom I follow
    supabase.from("follows").select("follower_id").eq("followed_id", account.id).then(({ data: theyFollowMe }) => {
      const theirIds = (theyFollowMe || []).map(r => r.follower_id);
      if (!theirIds.length) { setMutualFollowers([]); return; }
      supabase.from("follows").select("followed_id").eq("follower_id", account.id).then(({ data: iFollow }) => {
        const iFollowIds = new Set((iFollow || []).map(r => r.followed_id));
        const mutualIds = theirIds.filter(id => iFollowIds.has(id));
        if (!mutualIds.length) { setMutualFollowers([]); return; }
        supabase.from("profiles").select("id,username,avatar_url,email").in("id", mutualIds.slice(0, 5))
          .then(({ data }) => setMutualFollowers(data || [])).catch(() => {});
      }).catch(() => {});
    }).catch(() => {});
  },[account?.id, morePage]);


  // ── last_seen heartbeat ──────────────────────────────────────────────────
  useEffect(() => {
    if (!account?.id) return;
    const bump = async () => { try { await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", account.id); } catch(e) {} };
    bump(); // immediate on mount
    const iv = setInterval(bump, 60_000);
    return () => clearInterval(iv);
  }, [account?.id]);
  const saveProfileExtended = async () => {
    setSavingProfile(true); setProfileMsg("");
    const clean = username.trim().replace(/[^a-zA-Z0-9_.@-]/g,"").slice(0,30)||null;

    // Single consolidated update — all fields at once to avoid partial saves
    const payload = {
      username: clean,
      bio: bio.trim(),
      display_name: clean || fullName.trim() || null,
    };
    payload.full_name     = fullName.trim() || null;
    payload.location      = location.trim() || null;
    payload.date_of_birth = dob || null;

    const { error: saveErr } = await supabase.from("profiles").update(payload).eq("id", account.id);

    if (saveErr) {
      setSavingProfile(false);
      setProfileMsg(saveErr.code === "23505" ? "That username is taken." : "Save failed: " + saveErr.message);
      return;
    }

    // Re-read ALL fields from DB to confirm the save and refresh UI
    const { data: fresh, error: reReadErr } = await supabase.from("profiles")
      .select("username, bio, avatar_url, full_name, location, date_of_birth, cover_url")
      .eq("id", account.id).single();
    if (fresh && !reReadErr) {
      if (fresh.username   !== undefined) setUsername(fresh.username || "");
      if (fresh.bio        !== undefined) setBio(fresh.bio || "");
      if (fresh.avatar_url)               setAvatarUrl(fresh.avatar_url);
      if (fresh.full_name  !== undefined) setFullName(fresh.full_name || "");
      if (fresh.location      !== undefined) setLocation(fresh.location || "");
      if (fresh.date_of_birth !== undefined) setDob(fresh.date_of_birth || "");
      if (fresh.cover_url)               setCoverUrl(fresh.cover_url);
      setSavingProfile(false);
      setProfileMsg("Saved. ✓");
      notifyAvatarRefresh();
    } else {
      setSavingProfile(false);
      setProfileMsg(reReadErr ? "Saved but couldn't confirm — please refresh." : "Saved. ✓");
      notifyAvatarRefresh();
    }
  };

  // Keep the More landing mounted beneath referral portals so the previous route cannot flash through during close animations.

  if (cropFile) return <CoverCropModal file={cropFile} onConfirm={blob => { setCropFile(null); uploadCoverBlob(blob); }} onCancel={() => { setCropFile(null); }} T={T} FONT_HEAD={FONT_HEAD} />;

  if (morePage === "profile-menu") return (
    <div style={{ minHeight:"100%", background:"#F1F3F3", animation:"slideInRight 0.2s ease" }}>
      <style>{"@keyframes slideInRight { from { transform: translateX(24px); opacity:0; } to { transform: translateX(0); opacity:1; } }"}</style>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 8px" }}>
        <button onClick={() => { setMorePage(null); if (setProfileFromHeader) setProfileFromHeader(false); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#657076", padding:4 }}>
          <X size={22} />
        </button>
      </div>
      {/* Menu cards */}
      <div style={{ padding:"8px 16px 0", display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12 }}>
        {/* Profile header — intentionally not a menu card */}
        <button onClick={() => setMorePage("profile")} style={{ width:"100%", gridColumn:"1 / -1", background:"transparent", border:0, padding:"8px 4px 14px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:12, position:"relative" }}>
          <div style={{ width:52, height:52, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:T.goldGradient, border:`2px solid ${T.gold}`, display:"grid", placeItems:"center" }}>
            {avatarUrl ? <img src={avatarUrl} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:21, color:T.ink }}>{(fullName || "P").trim()[0].toUpperCase()}</span>}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, color:"#657076", marginBottom:3, letterSpacing:"0.01em" }}>Your profile</div>
            <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:18, lineHeight:1.2, color:"#17191B", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"240px" }}>{fullName || "Complete your profile"}</div>
          </div>
          <ChevronRight size={18} color="#657076" style={{ position:"absolute", top:23, right:4 }} />
        </button>
        {/* Security row */}
        {[
          { label:"Security", icon:ShieldCheck, page:"security" },
        ].map(item => (
          <button key={item.label} onClick={() => setMorePage(item.page)}
            style={{ width:"100%", minHeight:item.wide ? 88 : 98, gridColumn:item.wide ? "1 / -1" : "auto", background:"#FFFFFF", border:"1px solid #E5E9EA", borderRadius:18, padding:item.wide ? "13px" : "13px 12px", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", gap:5, position:"relative", boxShadow:"0 1px 2px rgba(25,35,40,0.02)" }}>
            <ChevronRight size={13} color="#657076" style={{ position:"absolute", top:14, right:14 }} />
            <div style={{ width:36, height:36, borderRadius:"50%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <item.icon size={17} color={T.ink} />
            </div>
            <div style={{ width:26, height:3, borderRadius:2, background:T.gold, marginTop:4 }} />
            <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:14, color:"#17191B", lineHeight:1.25 }}>{item.label}</div>
          </button>
        ))}

        {/* Appearance — standalone, before Settings */}
        <button onClick={() => setAppearanceOpen(true)}
          style={{ width:"100%", minHeight:98, background:"#FFFFFF", border:"1px solid #E5E9EA", borderRadius:18, padding:"13px 12px", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:5, position:"relative", boxShadow:"0 1px 2px rgba(25,35,40,0.02)" }}>
          <ChevronRight size={13} color="#657076" style={{ position:"absolute", top:14, right:14 }} />
          <div style={{ width:36, height:36, borderRadius:"50%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Palette size={17} color={T.ink} />
          </div>
          <div style={{ width:26, height:3, borderRadius:2, background:T.gold, marginTop:4 }} />
          <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:14, color:"#17191B" }}>Appearance</div>
        </button>

        {/* Settings */}
        <button onClick={() => setMorePage("settings")}
          style={{ width:"100%", minHeight:98, background:"#FFFFFF", border:"1px solid #E5E9EA", borderRadius:18, padding:"13px 12px", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:5, position:"relative", boxShadow:"0 1px 2px rgba(25,35,40,0.02)" }}>
          <ChevronRight size={13} color="#657076" style={{ position:"absolute", top:14, right:14 }} />
          <div style={{ width:36, height:36, borderRadius:"50%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Settings size={17} color={T.ink} />
          </div>
          <div style={{ width:26, height:3, borderRadius:2, background:T.gold, marginTop:4 }} />
          <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:14, color:"#17191B" }}>Settings</div>
        </button>

        {/* Account activity & history */}
        <button onClick={() => setMorePage("history")}
          style={{ width:"100%", minHeight:98, background:"#FFFFFF", border:"1px solid #E5E9EA", borderRadius:18, padding:"13px 12px", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:5, position:"relative", boxShadow:"0 1px 2px rgba(25,35,40,0.02)" }}>
          <ChevronRight size={13} color="#657076" style={{ position:"absolute", top:14, right:14 }} />
          <div style={{ width:36, height:36, borderRadius:"50%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Activity size={17} color={T.ink} />
          </div>
          <div style={{ width:26, height:3, borderRadius:2, background:T.gold, marginTop:4 }} />
          <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:14, color:"#17191B" }}>Activity & History</div>
        </button>

        {/* Privacy & data center */}
        <button onClick={() => setMorePage("privacy-center")}
          style={{ width:"100%", minHeight:98, background:"#FFFFFF", border:"1px solid #E5E9EA", borderRadius:18, padding:"13px 12px", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:5, position:"relative", boxShadow:"0 1px 2px rgba(25,35,40,0.02)" }}>
          <ChevronRight size={13} color="#657076" style={{ position:"absolute", top:14, right:14 }} />
          <div style={{ width:36, height:36, borderRadius:"50%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Eye size={17} color={T.ink} />
          </div>
          <div style={{ width:26, height:3, borderRadius:2, background:T.gold, marginTop:4 }} />
          <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:14, color:"#17191B" }}>Privacy & Data</div>
        </button>

        {/* Creator & token safety */}
        <button onClick={() => setMorePage("creator-safety")}
          style={{ width:"100%", minHeight:98, background:"#FFFFFF", border:"1px solid #E5E9EA", borderRadius:18, padding:"13px 12px", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:5, position:"relative", boxShadow:"0 1px 2px rgba(25,35,40,0.02)" }}>
          <ChevronRight size={13} color="#657076" style={{ position:"absolute", top:14, right:14 }} />
          <div style={{ width:36, height:36, borderRadius:"50%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <ShieldCheck size={17} color={T.ink} />
          </div>
          <div style={{ width:26, height:3, borderRadius:2, background:T.gold, marginTop:4 }} />
          <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:14, color:"#17191B", lineHeight:1.25 }}>Creator & Token Safety</div>
        </button>

        {/* Logout */}
        <button onClick={() => onLogoutConfirm && onLogoutConfirm()}
          style={{ width:"calc(100% - 28px)", justifySelf:"center", minHeight:52, gridColumn:"1 / -1", background:"#E53935", border:"none", borderRadius:28, padding:"7px 18px", textAlign:"center", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, position:"relative", boxShadow:"0 6px 14px rgba(229,57,53,.24)" }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(15,14,11,.10)", display:"grid", placeItems:"center", flexShrink:0 }}>
            <LogOut size={17} color={T.ink} />
          </div>
          <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:14, color:T.ink, textAlign:"center" }}>Logout</div>
        </button>
      </div>
      <div style={{ padding:"24px 20px 0", textAlign:"center" }}>
        <div style={{ fontSize:10.5, color:"#657076", lineHeight:1.7 }}>RainX is an analysis tool, not a broker.<br/>AI analysis is not financial advice.</div>
      </div>

      {appearanceOpen && (
        <div onClick={() => setAppearanceOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.16)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
          <style>{"@keyframes rxSheetUp { from { transform:translateY(100%) } to { transform:translateY(0) } }"}</style>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"#ffffff", borderRadius:24, padding:"14px 14px 28px", animation:"rxSheetUp 0.28s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ width:42, height:5, borderRadius:3, background:"#e2e2e2", margin:"0 auto 18px" }} />
            <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:20, color:"#2d2d2d", textAlign:"center", marginBottom:22 }}>Choose appearance</div>
            <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
              {[["light","Always light"],["dark","Always dark"],["system","Device settings"]].map(([val,label]) => {
                const selected = themeMode === val;
                const mode = val === "system" ? "split" : val;
                return (
                 <button key={val} onClick={() => { lsSet("rainx-theme", val); setThemeMode(val); persistSettings({ theme: val }); }} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                    {renderAppearancePhone(mode)}
                    <div style={{ width:22, height:22, borderRadius:"50%", border: "2px solid " + (selected ? "#4a6d7c" : "#cfcfcf"), display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {selected && <div style={{ width:12, height:12, borderRadius:"50%", background:"#4a6d7c" }} />}
                    </div>
                    <div style={{ fontFamily:FONT_HEAD, fontWeight:600, fontSize:12, color:"#2d2d2d" }}>{label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (morePage === "profile") {
    const joinedRaw = account?.joinedAt || account?.created_at;
    const joinedLabel = joinedRaw ? (() => {
      const d = new Date(joinedRaw);
      if (isNaN(d)) return null;
      return `Joined ${d.toLocaleString("default", { month: "long" })}, ${d.getFullYear()}`;
    })() : null;
    const dobDisplay = (() => {
      if (!dob) return null;
      const d = new Date(dob);
      if (isNaN(d)) return null;
      const month = d.toLocaleString("default", { month: "long" });
      const day = d.getDate();
      const year = d.getFullYear();
      if (dobPrivacy === "everyone") return `${month} ${day}, ${year}`;
      if (dobPrivacy === "daymonth" || dobPrivacy === "friends") return `${month} ${day}`;
      return null;
    })();
    const CamIcon = () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
      </svg>
    );
    return (
      <div style={{ minHeight:"100%", background:T.ink }}>
        <style>{"@keyframes slideInRight { from { transform:translateX(24px); opacity:0 } to { transform:translateX(0); opacity:1 } } @keyframes sheetUp { from { transform:translateY(100%) } to { transform:translateY(0) } }"}</style>

        {/* ── Bug 2 fix: Followers/Following modal for own profile ── */}
        {showFollowListOwn && (
          <FollowListModal
            userId={account.id}
            type={showFollowListOwn}
            viewerId={account.id}
            onClose={() => setShowFollowListOwn(null)}
            onOpenProfile={(uid) => { setShowFollowListOwn(null); setTab("community"); }}
          />
        )}

        {/* ── Share bottom sheet ── */}
        {showShareSheet && (
          <div onClick={() => setShowShareSheet(false)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.55)" }}>
            <div onClick={e => e.stopPropagation()}
              style={{ position:"absolute", bottom:0, left:0, right:0, background:T.card, borderRadius:"20px 20px 0 0", padding:"16px 20px 40px", animation:"sheetUp 0.28s ease" }}>
              <div style={{ width:40, height:4, borderRadius:2, background:T.cardBorder, margin:"0 auto 18px" }} />
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22, padding:"0 4px" }}>
                {avatarUrl
                  ? <img src={avatarUrl} style={{ width:46, height:46, borderRadius:"50%", objectFit:"cover", border:`2px solid ${T.gold}` }} alt="" />
                  : <div style={{ width:46, height:46, borderRadius:"50%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_HEAD, fontWeight:800, fontSize:16, color:T.ink, flexShrink:0 }}>{profileInitial}</div>
                }
                <div>
                  <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:15, color:T.paper }}>{fullName || username || account?.email?.split("@")[0]}</div>
                  {username && <div style={{ fontSize:12, color:T.muted }}>@{username}</div>}
                </div>
              </div>
              {[
                { emoji:"🔗", label:"Copy profile link", action: () => { try { navigator.clipboard?.writeText(window.location.href); } catch(e) {} setShowShareSheet(false); } },
                { emoji:"📤", label:"Share via…",        action: () => { try { navigator.share?.({ title: username || "My RainX Profile", url: window.location.href }); } catch(e) {} setShowShareSheet(false); } },
              ].map(({ emoji, label, action }) => (
                <button key={label} onClick={action}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 8px", background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}`, cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>{emoji}</span>
                  <span style={{ fontFamily:FONT_HEAD, fontWeight:600, fontSize:14, color:T.paper }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Sticky minimal header ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", position:"sticky", top:0, zIndex:10, background:"rgba(15,14,11,0.94)", backdropFilter:"blur(8px)", borderBottom:`1px solid ${T.cardBorder}` }}>
          <button onClick={() => setMorePage("profile-menu")} style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.07)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <ChevronLeft size={20} color={T.paper} />
          </button>
          <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:15, color:T.paper }}>Profile</div>
          <div style={{ width:36 }} />
        </div>

        {/* ── Banner (tappable to change cover) + Avatar + action buttons ── */}
        <div style={{ position:"relative", animation:"slideInRight 0.2s ease" }}>
          {/* Banner — click to upload cover */}
          <label style={{ display:"block", cursor:"pointer", position:"relative" }}>
            <input type="file" accept="image/*" onChange={e => e.target.files[0] && setCropFile(e.target.files[0])} style={{ display:"none" }} disabled={uploadingCover} />
            {coverUrl
              ? <img src={coverUrl} style={{ width:"100%", height:110, objectFit:"cover", display:"block" }} alt="" />
              : <div style={{ width:"100%", height:110, background:`linear-gradient(135deg,#1a160d 0%,#231d10 55%,${T.gold}28 100%)` }} />
            }
            {/* Camera badge — small corner icon, does not cover the photo */}
            <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.55)", borderRadius:"50%", padding:7, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
              <CamIcon />
            </div>
          </label>

          {/* Avatar overlapping banner — tappable for avatar upload */}
          <label style={{ position:"absolute", bottom:-48, left:14, cursor:"pointer" }}>
            <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadAvatar(e.target.files[0])} style={{ display:"none" }} disabled={uploadingAvatar} />
            <div style={{ width:92, height:92, borderRadius:"50%", border:`3px solid ${T.gold}`, boxShadow:`0 0 0 3px ${T.ink}`, overflow:"hidden", position:"relative" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", color:T.ink, fontWeight:800, fontFamily:FONT_HEAD, fontSize:32 }}>{profileInitial}</div>
              }
              {/* Camera badge on avatar — bottom-right corner only */}
              <div style={{ position:"absolute", bottom:2, right:2, background:"rgba(0,0,0,0.6)", borderRadius:"50%", padding:5, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <CamIcon />
              </div>
            </div>
          </label>

          {/* Share + Edit profile buttons — right side, below banner */}
          <div style={{ position:"absolute", bottom:-44, right:14, display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={() => setShowShareSheet(true)}
              style={{ background:"none", border:`1.5px solid ${T.cardBorder}`, borderRadius:22, padding:"9px 16px", fontFamily:FONT_HEAD, fontWeight:700, fontSize:13, color:T.paper, cursor:"pointer", lineHeight:1, flexShrink:0, whiteSpace:"nowrap" }}>
              Share
            </button>
            <button onClick={() => setMorePage("profile-edit")}
              style={{ background:T.goldGradient, border:"none", borderRadius:22, padding:"9px 16px", fontFamily:FONT_HEAD, fontWeight:700, fontSize:13, color:T.ink, cursor:"pointer", lineHeight:1, flexShrink:0, whiteSpace:"nowrap" }}>
              Edit profile
            </button>
          </div>
        </div>

        {/* Spacer for overlap */}
        <div style={{ height:60 }} />

        {/* ── Profile info ── */}
        <div style={{ padding:"0 16px 8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
            <span style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:20, color:T.paper, lineHeight:1.2 }}>{fullName || username || (profileLoaded ? account?.email : "")}</span>
            <CommunityBadge isAdmin={false} badge={verification || "none"} isPro={false} />
          </div>
          {username && <div style={{ fontSize:13.5, color:T.muted, marginBottom:7 }}>@{username}</div>}
          {bio && <div style={{ fontSize:13.5, color:T.paper, marginBottom:9, lineHeight:1.65 }}>{bio}</div>}
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"4px 14px", marginBottom:9 }}>
            {location && <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12.5, color:T.muted }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {location}
            </span>}
            {joinedLabel && <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12.5, color:T.muted }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {joinedLabel}
            </span>}
            {dobDisplay && <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12.5, color:T.muted }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {dobDisplay}
            </span>}
          </div>
          <div style={{ display:"flex", gap:20, marginBottom:10 }}>
            <button onClick={() => setShowFollowListOwn("following")} style={{ background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
              <strong style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:15, color:T.paper }}>{formatCount(profileFollowing)}</strong><span style={{ fontSize:14, color:T.muted }}> Following</span>
            </button>
            <button onClick={() => setShowFollowListOwn("followers")} style={{ background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
              <strong style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:15, color:T.paper }}>{formatCount(profileFollowers)}</strong><span style={{ fontSize:14, color:T.muted }}> Followers</span>
            </button>
          </div>
          {mutualFollowers.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, fontSize:12.5, color:T.muted }}>
              <div style={{ display:"flex", alignItems:"center" }}>
                {mutualFollowers.slice(0, 3).map((f, i) => (
                  <div key={f.id} style={{ width:22, height:22, borderRadius:"50%", marginLeft:i > 0 ? -7 : 0, border:`1.5px solid ${T.ink}`, overflow:"hidden", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_HEAD, fontWeight:700, fontSize:8, color:T.ink, flexShrink:0 }}>
                    {f.avatar_url ? <img src={f.avatar_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" /> : (f.username || f.email || "?")[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
              <span>Followed by {mutualFollowers.slice(0, 2).map(f => f.username || f.email?.split("@")[0]).join(", ")}{mutualFollowers.length > 2 ? ` and ${mutualFollowers.length - 2} others` : ""}</span>
            </div>
          )}
        </div>

        {/* ── Posts / Reposts — same interaction model as Community profiles ── */}
        <div style={{ borderTop:`1px solid ${T.cardBorder}`, display:"grid", gridTemplateColumns:"1fr 1fr" }}>
          {[
            { key:"posts", label:"Posts", icon:null },
            { key:"reposts", label:"Reposts", icon:Repeat2 },
          ].map(({ key, label, icon:Icon }) => (
            <button key={key} onClick={() => setProfileTab(key)}
              style={{ background:"none", border:"none", color:profileTab === key ? T.paper : T.muted, fontFamily:FONT_HEAD, fontWeight:700, fontSize:13.5, padding:"13px 8px 11px", cursor:"pointer", borderBottom:profileTab === key ? `2px solid ${T.gold}` : "2px solid transparent", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {Icon && <Icon size={16} strokeWidth={2.2} />}
              {label}
            </button>
          ))}
        </div>

        {/* ── Profile Composer FAB ── */}
        <button
          onClick={() => setShowProfileFabModal(true)}
          style={{ position:"fixed", bottom:90, right:20, width:52, height:52, borderRadius:"50%", background:T.gold, border:"none", color:T.ink, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 16px rgba(0,0,0,0.4)", cursor:"pointer", zIndex:40, transition:"transform 0.15s" }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.9)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        {showProfileFabModal && (
          <CommunityComposer
            account={account}
            themeTokens={T}
            onClose={() => setShowProfileFabModal(false)}
            onPosted={() => {
              setShowProfileFabModal(false);
              supabase.from("community_posts").select("*").eq("user_id",account.id).order("created_at",{ascending:false}).then(({data})=>setProfilePosts(data||[]));
            }}
          />
        )}

        {/* ── Profile posts feed ── */}
        {profilePostsLoading ? (
          <div style={{ fontSize:13, color:T.muted, padding:"28px 0", textAlign:"center" }}>Loading…</div>
        ) : (() => {
          const tabPosts = profileTab === "reposts" ? profilePosts.filter(p => !!p.repost_of_post_id) : profilePosts.filter(p => !p.repost_of_post_id);
          if (!tabPosts.length) return <div style={{ fontSize:13, color:T.muted, padding:"32px 0", textAlign:"center" }}>{profileTab === "reposts" ? "No reposts yet." : "No posts yet."}</div>;
          return (
            <CommunityProfileFeed
              posts={tabPosts}
              account={account}
            themeTokens={T}
            profileEntry={{
              id: account.id,
              display_name: username || account?.email?.split("@")[0] || "user",
              full_name: fullName,
              username: username,
              avatar_url: avatarUrl,
              badge: verification || "none",
              is_official: verification === "official",
              is_admin: false,
            }}
            onOpenProfile={() => {}}
            onDmUser={() => {}}
            onDelete={async (id) => {
              await supabase.from("community_posts").delete().eq("id", id);
              setProfilePosts(posts => posts.filter(p => p.id !== id));
            }}
              onRefresh={() => {
                supabase.from("community_posts").select("*").eq("user_id",account.id).order("created_at",{ascending:false}).then(({data})=>setProfilePosts(data||[]));
              }}
            />
          );
        })()}
      </div>
    );
  }

  if (morePage === "profile-edit") {
    const CamIcon = () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
      </svg>
    );
    return (
      <div style={{ minHeight:"100%", background:T.ink, animation:"slideInRight 0.2s ease" }}>
        <style>{"@keyframes slideInRight { from { transform:translateX(24px); opacity:0 } to { transform:translateX(0); opacity:1 } }"}</style>

        {/* ── Edit profile header ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", position:"sticky", top:0, zIndex:10, background:T.ink, borderBottom:`1px solid ${T.cardBorder}` }}>
          <button onClick={() => setMorePage("profile")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:T.paper }}>
            <ChevronLeft size={22} color={T.paper} />
            <span style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:16, color:T.paper }}>Edit profile</span>
          </button>
          <button onClick={saveProfileExtended} disabled={savingProfile}
            style={{ background:"none", border:"none", cursor:"pointer", fontFamily:FONT_HEAD, fontWeight:700, fontSize:15, color:T.gold, padding:"4px 2px" }}>
            {savingProfile ? "Saving…" : "Save"}
          </button>
        </div>

        {/* ── Banner + Avatar (both tappable) ── */}
        <div style={{ position:"relative", marginBottom:50 }}>
          {/* Banner */}
          <label style={{ display:"block", cursor:"pointer", position:"relative" }}>
            <input type="file" accept="image/*" onChange={e => e.target.files[0] && setCropFile(e.target.files[0])} style={{ display:"none" }} disabled={uploadingCover} />
            {coverUrl
              ? <img src={coverUrl} style={{ width:"100%", height:110, objectFit:"cover", display:"block" }} alt="" />
              : <div style={{ width:"100%", height:110, background:`linear-gradient(135deg,#1a160d 0%,#231d10 55%,${T.gold}28 100%)` }} />
            }
            {/* Camera badge — small corner icon, does not cover the photo */}
            <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.55)", borderRadius:"50%", padding:7, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
              <CamIcon />
            </div>
          </label>
          {/* Avatar */}
          <label style={{ position:"absolute", bottom:-46, left:14, cursor:"pointer" }}>
            <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadAvatar(e.target.files[0])} style={{ display:"none" }} disabled={uploadingAvatar} />
            <div style={{ width:88, height:88, borderRadius:"50%", border:`3px solid ${T.gold}`, boxShadow:`0 0 0 3px ${T.ink}`, overflow:"hidden", position:"relative" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", background:T.goldGradient, display:"flex", alignItems:"center", justifyContent:"center", color:T.ink, fontWeight:800, fontFamily:FONT_HEAD, fontSize:30 }}>{profileInitial}</div>
              }
              {/* Camera badge — bottom-right corner only */}
              <div style={{ position:"absolute", bottom:2, right:2, background:"rgba(0,0,0,0.6)", borderRadius:"50%", padding:5, display:"flex", alignItems:"center", justifyContent:"center" }}><CamIcon /></div>
            </div>
          </label>
        </div>

        {/* ── Edit fields ── */}
        <div style={{ padding:"0 16px 24px" }}>
          {profileMsg && <div style={{ fontSize:12, color:profileMsg.startsWith("Saved") ? T.sage : T.rust, marginBottom:12, padding:"8px 12px", background:`${profileMsg.startsWith("Saved") ? T.sage : T.rust}18`, borderRadius:8 }}>{profileMsg}</div>}

          {/* Year picker bottom sheet */}
          {showYearPicker && (
            <div onClick={() => setShowYearPicker(false)} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.55)" }}>
              <div onClick={e => e.stopPropagation()} style={{ position:"absolute", bottom:0, left:0, right:0, background:T.card, borderRadius:"20px 20px 0 0", padding:"16px 0 40px", animation:"sheetUp 0.28s ease", maxHeight:"70vh", display:"flex", flexDirection:"column" }}>
                <div style={{ width:40, height:4, borderRadius:2, background:T.cardBorder, margin:"0 auto 16px", flexShrink:0 }} />
                <div style={{ textAlign:"center", fontFamily:FONT_HEAD, fontWeight:700, fontSize:15, color:T.paper, marginBottom:8, flexShrink:0 }}>Select Year</div>
                <div style={{ overflowY:"auto", flex:1 }}>
                  {Array.from({ length: 80 }, (_, i) => 2010 - i).map(y => {
                    const curYear = dob ? dob.split("-")[0] : "";
                    return (
                      <button key={y} onClick={() => {
                        const parts = dob ? dob.split("-") : ["","01","01"];
                        const mm = (parts[1] || "01").padStart(2,"0");
                        const dd = (parts[2] || "01").padStart(2,"0");
                        setDob(`${y}-${mm}-${dd}`);
                        setShowYearPicker(false);
                      }}
                        style={{ width:"100%", padding:"14px 0", background: curYear === String(y) ? `${T.gold}22` : "none", border:"none", borderBottom:`1px solid ${T.cardBorder}33`, color: curYear === String(y) ? T.goldBright : T.paper, fontFamily:FONT_HEAD, fontWeight: curYear === String(y) ? 800 : 400, fontSize:16, cursor:"pointer" }}>
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Generic text/multiline fields */}
          {[
            { label:"Name",     val:fullName, set:setFullName, ph:"Your display name" },
            { label:"Bio",      val:bio,      set:setBio,      ph:"Say something about yourself", multiline:true },
            { label:"Username", val:username, set:setUsername, ph:"@handle" },
          ].map(({ label, val, set, ph, multiline }) => (
            <div key={label} style={{ marginBottom:0, paddingBottom:0 }}>
              <label style={{ fontSize:12, color:T.paper, fontWeight:600, display:"block", marginBottom:4, marginTop:18 }}>{label}</label>
              {multiline
                ? <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={3}
                    style={{ width:"100%", background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}`, color:T.paper, fontSize:15, padding:"6px 0", fontFamily:FONT_HEAD, outline:"none", resize:"none", boxSizing:"border-box" }} />
                : <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    style={{ width:"100%", background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}`, color:T.paper, fontSize:15, padding:"6px 0", fontFamily:FONT_HEAD, outline:"none", boxSizing:"border-box" }} />
              }
            </div>
          ))}

          {/* Location with search suggestions */}
          <div style={{ marginBottom:0, paddingBottom:0, position:"relative" }}>
            <label style={{ fontSize:12, color:T.paper, fontWeight:600, display:"block", marginBottom:4, marginTop:18 }}>Location</label>
            <ProfileLocationInput value={location} onChange={setLocation} T={T} FONT_HEAD={FONT_HEAD} />
          </div>

          {/* Date of birth — month + day inline, year opens bottom sheet */}
          <div style={{ marginBottom:0, paddingBottom:0 }}>
            <label style={{ fontSize:12, color:T.paper, fontWeight:600, display:"block", marginBottom:4, marginTop:18 }}>Date of birth</label>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <select
                value={dob ? dob.split("-")[1] || "" : ""}
                onChange={e => {
                  const parts = dob ? dob.split("-") : ["2000","","01"];
                  const y = parts[0] || "2000"; const d = (parts[2] || "01").padStart(2,"0");
                  setDob(`${y}-${e.target.value.padStart(2,"0")}-${d}`);
                }}
                style={{ flex:2, background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}`, color:T.paper, fontSize:14, padding:"6px 0", fontFamily:FONT_HEAD, outline:"none" }}>
                <option value="">Month</option>
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) =>
                  <option key={i+1} value={String(i+1).padStart(2,"0")}>{m}</option>
                )}
              </select>
              <input
                type="number" min="1" max="31"
                value={dob ? (dob.split("-")[2] || "") : ""}
                onChange={e => {
                  const parts = dob ? dob.split("-") : ["2000","01",""];
                  const y = parts[0] || "2000"; const m = (parts[1] || "01").padStart(2,"0");
                  setDob(`${y}-${m}-${e.target.value.padStart(2,"0")}`);
                }}
                placeholder="Day"
                style={{ flex:1, background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}`, color:T.paper, fontSize:14, padding:"6px 0", fontFamily:FONT_HEAD, outline:"none", textAlign:"center", width:0 }} />
              <button
                onClick={() => setShowYearPicker(true)}
                style={{ flex:1.2, background:"none", border:"none", borderBottom:`1px solid ${T.cardBorder}`, color: dob && dob.split("-")[0] ? T.paper : T.muted, fontSize:14, padding:"6px 0", fontFamily:FONT_HEAD, textAlign:"center", cursor:"pointer" }}>
                {dob && dob.split("-")[0] ? dob.split("-")[0] : "Year ▾"}
              </button>
            </div>
          </div>

          {/* DOB privacy selector */}
          {dob && (
            <div style={{ marginTop:18 }}>
              <label style={{ fontSize:12, color:T.paper, fontWeight:600, display:"block", marginBottom:8 }}>DOB visibility</label>
              <div style={{ display:"flex", gap:8 }}>
                {[["daymonth","Day & Month"],["everyone","Full Date"],["friends","Friends"]].map(([v, lbl]) => (
                  <button key={v} onClick={() => { setDobPrivacy(v); lsSet("rainx-dob-privacy", v); }}
                    style={{ flex:1, fontSize:11, padding:"6px 4px", borderRadius:10, border:`1px solid ${dobPrivacy===v ? T.gold : T.cardBorder}`, background:dobPrivacy===v ? `${T.gold}22` : "none", color:dobPrivacy===v ? T.goldBright : T.muted, cursor:"pointer", fontFamily:FONT_HEAD, fontWeight:600 }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => onLogoutConfirm && onLogoutConfirm()}
            style={{ width:"100%", marginTop:32, background:"none", border:`1px solid rgba(176,96,74,0.4)`, borderRadius:12, padding:"13px 0", fontFamily:FONT_HEAD, fontWeight:700, fontSize:13, color:T.rust, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </div>
    );
  }

  if (morePage === "verification") {
    const isGolden = verification === "golden";
    const isBlue   = verification === "blue";
    const isVerif  = isGolden || isBlue;
    const badgeBg  = isGolden ? "rgba(244,211,94,0.12)" : isBlue ? "rgba(91,156,246,0.12)" : "rgba(100,100,100,0.10)";
    const badgeBorder = isGolden ? T.gold : isBlue ? "#5B9CF6" : T.cardBorder;
    const iconBg   = isGolden ? "rgba(244,211,94,0.15)" : isBlue ? "rgba(91,156,246,0.15)" : "rgba(100,100,100,0.08)";
    const iconBorder = isGolden ? `2px solid ${T.gold}` : isBlue ? "2px solid #5B9CF6" : `1px solid ${T.cardBorder}`;

    const tiers = [
      { key: "weekly",   label: "Weekly",    verif: "Blue Verified",   icon: "blue",   desc: "Subscribers on the Weekly plan receive a Blue Verified badge." },
      { key: "monthly",  label: "Monthly",   verif: "Blue Verified",   icon: "blue",   desc: "Subscribers on the Monthly plan receive a Blue Verified badge." },
      { key: "yearly", label: "Yearly", verif: "Golden Verified", icon: "golden", desc: "Premium Yearly subscribers receive the exclusive Golden Verified badge." },
    ];

    return (
      <MoreSubScreen onBack={() => setMorePage(null)} title="Verification" subtitle="Your identity & trust level">
        <div style={{ padding: 16 }}>
          {/* Status card */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 18, padding: 24, marginBottom: 14, textAlign: "center" }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: iconBg, border: iconBorder, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              {isGolden ? (
                <svg width="38" height="38" viewBox="1.604 1.604 18.792 18.792" style={{ flexShrink: 0 }}>
                  <path d="m20.396 11a3.487 3.487 0 0 0 -2.008-3.062 3.474 3.474 0 0 0 -.742-3.584 3.474 3.474 0 0 0 -3.584-.742 3.468 3.468 0 0 0 -3.062-2.008 3.463 3.463 0 0 0 -3.053 2.008 3.472 3.472 0 0 0 -1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0 -.734 3.584 3.49 3.49 0 0 0 -2.017 3.062 3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742 3.487 3.487 0 0 0 3.062 2.008 3.476 3.476 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327 3.487 3.487 0 0 0 2.008-3.062zm-10.734 3.85-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#F4D35E" />
                </svg>
              ) : isBlue ? (
                <svg width="38" height="38" viewBox="1.604 1.604 18.792 18.792" style={{ flexShrink: 0 }}>
                  <path d="m20.396 11a3.487 3.487 0 0 0 -2.008-3.062 3.474 3.474 0 0 0 -.742-3.584 3.474 3.474 0 0 0 -3.584-.742 3.468 3.468 0 0 0 -3.062-2.008 3.463 3.463 0 0 0 -3.053 2.008 3.472 3.472 0 0 0 -1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0 -.734 3.584 3.49 3.49 0 0 0 -2.017 3.062 3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742 3.487 3.487 0 0 0 3.062 2.008 3.476 3.476 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327 3.487 3.487 0 0 0 2.008-3.062zm-10.734 3.85-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1d9bf0" />
                </svg>
              ) : (
                <ShieldCheck size={34} color={T.muted} />
              )}
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 17, color: T.paper, marginBottom: 10 }}>
              {isVerif ? verificationLabel : "Not Verified"}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: badgeBg, border: `1px solid ${badgeBorder}`, borderRadius: 20, padding: "7px 18px" }}>
              <CommunityBadge isAdmin={false} badge={verification || "none"} isPro={false} />
              <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12.5, color: verificationColor }}>{verificationLabel}</span>
            </div>
            {isVerif && (
              <div style={{ marginTop: 12, fontSize: 11.5, color: T.muted, lineHeight: 1.6 }}>
                {isGolden ? "Premium Yearly subscriber · highest trust level" : "Active subscriber · community trusted"}
              </div>
            )}
          </div>

          {/* Tier breakdown */}
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: "6px 0", marginBottom: 14 }}>
            <div style={{ padding: "12px 16px 8px", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: T.muted, letterSpacing: 0.5 }}>HOW IT WORKS</div>
            {tiers.map((t, i) => {
              const active = entitlement.tier === t.key;
              const tBlue = t.icon === "blue";
              return (
                <div key={t.key} style={{ padding: "12px 16px", borderTop: i > 0 ? `1px solid ${T.cardBorder}` : "none", display: "flex", alignItems: "center", gap: 12, background: active ? (tBlue ? "rgba(91,156,246,0.06)" : "rgba(244,211,94,0.06)") : "transparent" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tBlue ? "rgba(91,156,246,0.12)" : "rgba(244,211,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {tBlue ? (
                      <svg width="16" height="16" viewBox="1.604 1.604 18.792 18.792" style={{ flexShrink: 0 }}>
                        <path d="m20.396 11a3.487 3.487 0 0 0 -2.008-3.062 3.474 3.474 0 0 0 -.742-3.584 3.474 3.474 0 0 0 -3.584-.742 3.468 3.468 0 0 0 -3.062-2.008 3.463 3.463 0 0 0 -3.053 2.008 3.472 3.472 0 0 0 -1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0 -.734 3.584 3.49 3.49 0 0 0 -2.017 3.062 3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742 3.487 3.487 0 0 0 3.062 2.008 3.476 3.476 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327 3.487 3.487 0 0 0 2.008-3.062zm-10.734 3.85-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1d9bf0" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="1.604 1.604 18.792 18.792" style={{ flexShrink: 0 }}>
                        <path d="m20.396 11a3.487 3.487 0 0 0 -2.008-3.062 3.474 3.474 0 0 0 -.742-3.584 3.474 3.474 0 0 0 -3.584-.742 3.468 3.468 0 0 0 -3.062-2.008 3.463 3.463 0 0 0 -3.053 2.008 3.472 3.472 0 0 0 -1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0 -.734 3.584 3.49 3.49 0 0 0 -2.017 3.062 3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742 3.487 3.487 0 0 0 3.062 2.008 3.476 3.476 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327 3.487 3.487 0 0 0 2.008-3.062zm-10.734 3.85-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#F4D35E" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: T.paper }}>{t.label} Plan</span>
                      {active && <span style={{ fontSize: 10, fontWeight: 700, color: tBlue ? "#5B9CF6" : T.goldBright, background: tBlue ? "rgba(91,156,246,0.15)" : "rgba(244,211,94,0.15)", borderRadius: 8, padding: "2px 7px" }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: 11, color: tBlue ? "#5B9CF6" : T.goldBright, marginTop: 2, fontWeight: 600 }}>{t.verif}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          {!isVerif && (
            <button onClick={() => setMorePage("rewards")} style={{ width: "100%", background: T.goldGradient, color: T.ink, border: "none", borderRadius: 13, padding: "14px 0", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              Get Verified — View Plans
            </button>
          )}
          {isVerif && (
            <button onClick={() => setMorePage("rewards")} style={{ width: "100%", background: "none", border: `1px solid ${verificationColor}`, borderRadius: 13, padding: "13px 0", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, cursor: "pointer", color: verificationColor }}>
              View Rewards & Balance
            </button>
          )}
        </div>
      </MoreSubScreen>
    );
  }

  if (morePage === "rewards") return entitlement.tier !== "none" ? (
    <MoreSubScreen onBack={() => setMorePage(null)} title="Rewards & Balance" subtitle="Track your earnings and rewards" rightElement={<Bell size={20} color={T.muted} style={{ cursor: "pointer" }} />}>
      <RewardsScreen account={account} entitlement={entitlement} />
    </MoreSubScreen>
  ) : (
    <MoreSubScreen onBack={() => setMorePage(null)} title="Trader Rewards Program" subtitle="Choose a plan to get started">
      <SubscribeScreen account={account} entitlement={entitlement} onBack={() => setMorePage(null)} />
    </MoreSubScreen>
  );

  if (morePage === "wallet") return (
    <MoreSubScreen onBack={() => setMorePage("profile-menu")} title="Trader Wallet" subtitle="Your personal trading wallet">
      <CreatorWalletScreen account={account} />
    </MoreSubScreen>
  );

  if (morePage === "history") return (
    <MoreSubScreen onBack={() => setMorePage(null)}>
      <HistoryTab account={account} entitlement={entitlement} onSubscribe={() => setMorePage("rewards")} />
    </MoreSubScreen>
  );

  if (morePage === "scalping") return (
    <MoreSubScreen onBack={() => setMorePage(null)}>
      <ScalpingTab account={account} entitlement={entitlement} onSubscribe={() => setMorePage("rewards")} />
    </MoreSubScreen>
  );

  // Community profile = redirect to main profile (same data)
  if (morePage === "community-profile") {
    setMorePage("profile");
    return null;
  }

  function renderAppearancePhone(mode) {
    const isLight = mode === "light";
    const splitGrad = function(l, d) { return "linear-gradient(to right, " + l + " 50%, " + d + " 50%)"; };
    const bg = mode === "split" ? splitGrad("#f5f5f5", "#1c1c1c") : (isLight ? "#f5f5f5" : "#1c1c1c");
    const bar = mode === "split" ? splitGrad("#eaeaea", "#2a2a2a") : (isLight ? "#eaeaea" : "#2a2a2a");
    const block1 = mode === "split" ? splitGrad("#ffffff", "#333333") : (isLight ? "#ffffff" : "#333333");
    const block2 = mode === "split" ? splitGrad("#ececec", "#2e2e2e") : (isLight ? "#ececec" : "#2e2e2e");
    const nav = mode === "split" ? splitGrad("#eaeaea", "#2a2a2a") : (isLight ? "#eaeaea" : "#2a2a2a");
    const notch = mode === "split" ? splitGrad("#cfcfcf", "#444444") : (isLight ? "#cfcfcf" : "#444444");
    return (
      <div style={{ width:60, height:112, borderRadius:15, background:bg, border:"1px solid #e3e3e3", boxShadow:"0 3px 10px rgba(0,0,0,0.10)", padding:7, display:"flex", flexDirection:"column", gap:6, position:"relative", overflow:"hidden" }}> 
        <div style={{ position:"absolute", top:6, left:"50%", transform:"translateX(-50%)", width:18, height:4, borderRadius:2, background:notch }} />
        <div style={{ height:14, borderRadius:5, background:bar, marginTop:9 }} />
        <div style={{ height:22, borderRadius:6, background:block1 }} />
        <div style={{ height:13, borderRadius:5, background:block2, width:"72%" }} />
        <div style={{ flex:1 }} />
        <div style={{ height:12, borderRadius:6, background:nav }} />
      </div>
    );
  }

  // ── Settings / Security visual system ─────────────────────────────────────
  // These screens intentionally use a light ash page, white grouped cards,
  // dark icons and the existing RainX yellow accent without changing the rest
  // of the application theme.
  const PREF_BG = "#F2F3F5";
  const PREF_CARD = "#FFFFFF";
  const PREF_BORDER = "#E7E9EC";
  const PREF_ICON = "#18202A";
  const PREF_TEXT = "#111418";
  const PREF_MUTED = "#737B85";
  const PREF_YELLOW = T.gold;

  const LightToggle = ({ on, onChange, disabled=false, danger=false }) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={e=>{ e.stopPropagation(); onChange(); }}
      disabled={disabled}
      style={{ width:44, height:25, padding:0, border:0, borderRadius:13, background:on ? (danger ? "#C0392B" : PREF_YELLOW) : "#D7DBE0", position:"relative", cursor:disabled?"not-allowed":"pointer", transition:"background .18s", flexShrink:0, opacity:disabled?.55:1 }}
    >
      <span style={{ position:"absolute", top:3, left:on?22:3, width:19, height:19, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,.18)", transition:"left .18s" }} />
    </button>
  );

  const LightSection = ({ title, children }) => (
    <section style={{ marginBottom:22 }}>
      <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:12.5, letterSpacing:.15, color:PREF_MUTED, margin:"0 0 8px 4px", textTransform:"uppercase" }}>{title}</div>
      <div style={{ background:PREF_CARD, border:`1px solid ${PREF_BORDER}`, borderRadius:17, overflow:"hidden", boxShadow:"0 1px 2px rgba(15,20,25,.03)" }}>{children}</div>
    </section>
  );

  const LightDivider = () => <div style={{ height:1, background:PREF_BORDER, marginLeft:66 }} />;

  const LightIcon = ({ Icon }) => (
    <div style={{ width:38, height:38, borderRadius:11, background:"#F1F3F5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon size={19} color={PREF_ICON} strokeWidth={2.1} />
    </div>
  );

  const LightRow = ({ icon:Icon, title, subtitle, onPress, right, disabled=false }) => (
    <div role={onPress?"button":undefined} tabIndex={onPress?0:undefined} onClick={onPress} onKeyDown={e=>{if(onPress&&(e.key==="Enter"||e.key===" ")){e.preventDefault();onPress();}}} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"transparent", border:0, textAlign:"left", cursor:disabled?"not-allowed":onPress?"pointer":"default", opacity:disabled?.55:1, boxSizing:"border-box" }}>
      {Icon && <LightIcon Icon={Icon} />}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:13.5, color:PREF_TEXT }}>{title}</div>
        {subtitle && <div style={{ fontFamily:FONT_BODY, fontSize:11.2, color:PREF_MUTED, marginTop:3, lineHeight:1.4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );

  const LightToggleRow = ({ icon:Icon, title, subtitle, prefKey, defaultValue=true }) => {
    const on = settingsPrefs[prefKey] ?? defaultValue;
    return <LightRow icon={Icon} title={title} subtitle={subtitle} onPress={()=>persistSettings({[prefKey]:!on})} right={<LightToggle on={on} onChange={()=>persistSettings({[prefKey]:!on})} />} />;
  };

  const LightSecurityToggleRow = ({ title, subtitle, prefKey, defaultValue=true }) => {
    const on = securityPrefs[prefKey] ?? defaultValue;
    return <LightRow icon={ShieldCheck} title={title} subtitle={subtitle} onPress={()=>persistSecurity({[prefKey]:!on})} right={<LightToggle on={on} onChange={()=>persistSecurity({[prefKey]:!on})} />} />;
  };

  const LightSheet = StableLightSheet;

  const LightSheetTitle = ({ title, desc }) => <>
    <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:18, color:PREF_TEXT, marginBottom:5 }}>{title}</div>
    {desc && <div style={{ fontSize:11.5, color:PREF_MUTED, lineHeight:1.55, marginBottom:16 }}>{desc}</div>}
  </>;
  const LegalSheet = ({ onClose }) => (
    <LightSheet onClose={onClose}>
      <LightSheetTitle title="RainX terms & privacy" desc="Important information about using RainX." />
      <div style={{ fontSize:11.5, color:PREF_TEXT, lineHeight:1.65 }}>
        <p><strong>Not financial advice.</strong> RainX provides market analysis and educational commentary only. It does not recommend, execute or guarantee trades.</p>
        <p><strong>Your responsibility.</strong> Trading carries risk. You are responsible for your decisions, position sizing and risk management.</p>
        <p><strong>Data.</strong> RainX stores account preferences and security requests to provide these controls. You can request deletion from Privacy & Data.</p>
      </div>
    </LightSheet>
  );

  const LightChoice = ({ value, current, title, desc, onSelect }) => (
    <button type="button" onClick={()=>onSelect(value)} style={{ width:"100%", background:"transparent", border:0, padding:"13px 0", display:"flex", alignItems:"center", gap:12, textAlign:"left", cursor:"pointer" }}>
      <div style={{ flex:1 }}><div style={{fontFamily:FONT_HEAD,fontWeight:700,fontSize:13,color:PREF_TEXT}}>{title}</div>{desc&&<div style={{fontSize:11,color:PREF_MUTED,marginTop:2}}>{desc}</div>}</div>
      <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${current===value?PREF_YELLOW:"#C9CED4"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>{current===value&&<div style={{width:10,height:10,borderRadius:"50%",background:PREF_YELLOW}}/>}</div>
    </button>
  );

  if (morePage === "privacy-center") return (
    <MoreSubScreen onBack={() => setMorePage("profile-menu")} title="Privacy & Data" subtitle="Control how RainX uses, stores and exposes your information">
      <div style={{ background:PREF_BG, minHeight:"100%", padding:"16px 16px 28px" }}>
        <LightSection title="Privacy controls">
          <LightToggleRow icon={Eye} title="Profile discoverable" subtitle="Allow your profile to appear in search and suggestions" prefKey="profileDiscoverable" />
          <LightDivider />
          <LightToggleRow icon={EyeOff} title="Activity status" subtitle="Hide your active status from other users" prefKey="activityStatus" defaultValue={false} />
          <LightDivider />
          <LightToggleRow icon={MessageCircle} title="Read receipts" subtitle="Control whether message read status is shared" prefKey="readReceipts" />
          <LightDivider />
          <LightRow icon={Users2} title="Blocked & muted users" subtitle="Manage accounts you no longer want to interact with" onPress={()=>setSettingsSheet("blockedUsers")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={Lock} title="Messaging privacy" subtitle="Choose who can message you and send requests" onPress={()=>setSettingsSheet("messageWho")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
        </LightSection>
        <LightSection title="Data & personalization">
          <LightToggleRow icon={Users2} title="Personalized recommendations" subtitle="Use activity to improve people, market and creator suggestions" prefKey="personalizedSuggestions" />
          <LightDivider />
          <LightToggleRow icon={Activity} title="Analytics" subtitle="Allow optional product analytics" prefKey="analyticsCookies" defaultValue={false} />
          <LightDivider />
          <LightToggleRow icon={Bell} title="Marketing updates" subtitle="Allow optional promotional and creator updates" prefKey="marketingNotifications" defaultValue={false} />
          <LightDivider />
           <LightRow icon={Download} title="Download your data" subtitle="Export available local preferences now; full account export needs backend support" onPress={()=>setSettingsSheet("downloadData")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
        </LightSection>
        <LightSection title="Data lifecycle">
           <LightRow icon={Database} title="Data deletion request" subtitle="Request deletion of eligible account data" onPress={requestDataDeletion} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={Trash2} title="Clear local RainX data" subtitle="Remove locally stored preferences on this device" onPress={()=>{try{Object.keys(localStorage).filter(k=>k.startsWith("rainx-")).forEach(k=>localStorage.removeItem(k));}catch{} setSettingsPrefs({}); setSecurityPrefs({}); alert("Local RainX data cleared.");}} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
        </LightSection>
        <LightSection title="Legal & preferences">
           <LightRow icon={FileCheck} title="Privacy Policy" subtitle="Review how personal information is handled" onPress={()=>setSettingsSheet("legal")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
           <LightRow icon={FileCheck} title="Terms of Service" subtitle="Review the rules governing RainX use" onPress={()=>setSettingsSheet("legal")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={Cookie} title="Cookie & data preferences" subtitle="Manage optional analytics, personalization and marketing" onPress={()=>setSettingsSheet("cookies")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
        </LightSection>
         {settingsSheet === "legal" && <LegalSheet onClose={()=>setSettingsSheet(null)} />}
      </div>
    </MoreSubScreen>
  );

  if (morePage === "creator-safety") return (
    <MoreSubScreen onBack={() => setMorePage("profile-menu")} title="Creator & Token Safety" subtitle="Security, reporting, moderation and creator controls">
      <div style={{ background:PREF_BG, minHeight:"100%", padding:"16px 16px 28px" }}>
        <LightSection title="Creator protection">
          <LightSecurityToggleRow title="Creator security alerts" subtitle="Permission, payout and creator-account security events" prefKey="creatorSecurityAlerts" />
          <LightDivider />
          <LightSecurityToggleRow title="Payout change confirmations" subtitle="Require an extra confirmation before changing payout destinations" prefKey="creatorPayoutConfirmations" />
          <LightDivider />
          <LightSecurityToggleRow title="Moderation notifications" subtitle="Notify me about reports, takedowns and review outcomes" prefKey="moderationNotifications" />
        </LightSection>
        <LightSection title="Token safety">
          <LightSecurityToggleRow title="Show token reporting controls" subtitle="Keep report, mute and moderation actions visible on token surfaces" prefKey="tokenReporting" />
          <LightDivider />
          <LightSecurityToggleRow title="Risk acknowledgement" subtitle="Require acknowledgement before high-risk creator-token actions" prefKey="tokenRiskAcknowledgement" />
          <LightDivider />
          <LightRow icon={ShieldCheck} title="Internal-token risk & disclosure" subtitle="Review the risk language used around creator tokens" onPress={()=>setSecuritySheet("tokenRisk")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={FileCheck} title="Report a token" subtitle="Flag suspected scams, impersonation, manipulation or policy violations" onPress={()=>alert("Backend required: token-report submission and moderation queue.")} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED,border:`1px solid ${PREF_BORDER}`,borderRadius:20,padding:"4px 8px"}}>BACKEND</span>} />
        </LightSection>
        <LightSection title="Premium creator controls">
          <LightRow icon={Lock} title="Creator permissions" subtitle="Role-based publishing, moderation and payout permissions" onPress={()=>alert("Backend required: creator role/permission API.")} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED}}>BACKEND</span>} />
          <LightDivider />
          <LightRow icon={Activity} title="Creator activity log" subtitle="Audit creator actions and security events" onPress={()=>alert("Backend required: creator audit-log endpoint.")} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED}}>BACKEND</span>} />
        </LightSection>
      </div>
    </MoreSubScreen>
  );

  if (morePage === "settings") return (
    <MoreSubScreen onBack={() => setMorePage("profile-menu")} title="Settings" subtitle="Privacy & account controls">
      <div style={{ background:PREF_BG, minHeight:"100%", padding:"16px 16px 28px" }}>
        <LightSection title="Privacy & discovery">
          <LightToggleRow icon={Eye} title="Profile discoverable" subtitle="Allow your profile to appear in search and suggestions" prefKey="profileDiscoverable" />
          <LightDivider />
          <LightToggleRow icon={Eye} title="Activity status" subtitle="Let people you follow see when you are active" prefKey="activityStatus" />
          <LightDivider />
          <LightToggleRow icon={MessageCircle} title="Read receipts" subtitle="Show when direct messages have been read" prefKey="readReceipts" />
          <LightDivider />
          <LightToggleRow icon={Users2} title="Personalized suggestions" subtitle="Use your activity to improve people and market suggestions" prefKey="personalizedSuggestions" />
        </LightSection>

        <LightSection title="Your posts">
          {[["public","Public — everyone","Anyone can view your posts"],["followers","Followers only","Only your followers can view your posts"],["premium","Subscribers only","Only eligible subscribers can view your posts"]].map(([value,title,desc],i)=>{
            return <React.Fragment key={value}>{i>0&&<LightDivider/>}<LightRow icon={FileText} title={title} subtitle={desc} onPress={()=>{setPostVisibility(value);persistSettings({ postVisibility: value });lsSet("rainx-post-visibility",value)}} right={<div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${postVisibility===value?PREF_YELLOW:"#C9CED4"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{postVisibility===value&&<div style={{width:10,height:10,borderRadius:"50%",background:PREF_YELLOW}}/>}</div>} /></React.Fragment>;
          })}
        </LightSection>

        <LightSection title="Trading & signals">
          <LightToggleRow icon={Bell} title="Trading signal alerts" subtitle="Receive new BUY / SELL signal notifications" prefKey="signalAlerts" />
          <LightDivider />
          <LightToggleRow icon={ShieldCheck} title="Risk & trade alerts" subtitle="Get TP, SL and important risk notifications" prefKey="riskAlerts" />
          <LightDivider />
          <LightToggleRow icon={Bell} title="Signal sounds" subtitle="Play alert sounds for important trading events" prefKey="signalSounds" />
          <LightDivider />
          <LightToggleRow icon={Activity} title="Live market refresh" subtitle="Keep market and signal data refreshed automatically" prefKey="autoRefresh" />
          <LightDivider />
          <LightRow icon={ChevronDown} title="Signal delivery" subtitle={settingsPrefs.signalDelivery || "All signals"} onPress={()=>setSettingsSheet("signalDelivery")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
        </LightSection>

        <LightSection title="Community & messaging">
          <LightToggleRow icon={Bell} title="Community notifications" subtitle="Likes, replies, follows and mentions" prefKey="communityNotifications" />
          <LightDivider />
          <LightToggleRow icon={MessageCircle} title="Message requests" subtitle="Allow new people to send you a message request" prefKey="messageRequests" />
          <LightDivider />
          <LightToggleRow icon={Users2} title="Creator updates" subtitle="Updates from creators and Space Coins you follow" prefKey="creatorUpdates" />
          <LightDivider />
          <LightToggleRow icon={TrendingUp} title="Space Coin launch alerts" subtitle="Notify me when followed creators launch a new mini token" prefKey="launchAlerts" />
          <LightDivider />
          <LightRow icon={Lock} title="Who can message you" subtitle={settingsPrefs.messageWho || "Followers and people you follow"} onPress={()=>setSettingsSheet("messageWho")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
        </LightSection>

        <LightSection title="Data & account">
          <LightToggleRow icon={EyeOff} title="Hide balances" subtitle="Hide wallet and account balances until tapped" prefKey="hideBalances" defaultValue={false} />
          <LightDivider />
          <LightRow icon={ScrollText} title="Data & storage" subtitle="Cache, downloads and local data" onPress={()=>setSettingsSheet("dataStorage")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
          <LightDivider />
          <LightRow icon={Globe} title="Language & region" subtitle={settingsPrefs.language ? `${settingsPrefs.language} · ${settingsPrefs.region || "Ghana"}` : "English · Ghana"} onPress={()=>setSettingsSheet("region")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
        </LightSection>

        <LightSection title="Legal, privacy & data">
           <LightRow icon={FileCheck} title="Privacy policy" subtitle="Review how RainX handles personal information" onPress={()=>setSettingsSheet("legal")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
          <LightDivider />
           <LightRow icon={FileCheck} title="Terms of service" subtitle="Review the rules that apply to your account" onPress={()=>setSettingsSheet("legal")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
          <LightDivider />
          <LightRow icon={Cookie} title="Cookie & tracking preferences" subtitle="Control optional analytics and personalization" onPress={()=>setSettingsSheet("cookies")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
          <LightDivider />
          <LightRow icon={Download} title="Download your data" subtitle="Request a copy of information associated with your account" onPress={()=>setSettingsSheet("downloadData")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
        </LightSection>

        <LightSection title="Notifications">
          <LightRow icon={Bell} title="Notification preferences" subtitle="Manage in-app and push alerts by category" onPress={()=>setMorePage("notifications")} right={<ChevronRight size={18} color={PREF_MUTED} />} />
        </LightSection>

        {settingsSheet && settingsSheet !== "legal" && <LightSheet onClose={()=>setSettingsSheet(null)}>
          {settingsSheet === "signalDelivery" && <>
            <LightSheetTitle title="Signal delivery" desc="Choose which trading signals reach you." />
            <LightChoice value="all" current={settingsPrefs.signalDelivery||"all"} title="All signals" desc="BUY, SELL and watchlist updates" onSelect={v=>{persistSettings({signalDelivery:v});setSettingsSheet(null)}} />
            <LightChoice value="high" current={settingsPrefs.signalDelivery||"all"} title="High confidence only" desc="Only stronger-confidence setups" onSelect={v=>{persistSettings({signalDelivery:v});setSettingsSheet(null)}} />
            <LightChoice value="followed" current={settingsPrefs.signalDelivery||"all"} title="Followed markets only" desc="Only markets in your watchlist" onSelect={v=>{persistSettings({signalDelivery:v});setSettingsSheet(null)}} />
          </>}
          {settingsSheet === "messageWho" && <>
            <LightSheetTitle title="Who can message you" desc="Choose who can start a conversation." />
            {[['followers','Followers and people you follow'],['everyone','Anyone on RainX'],['nobody','Nobody']].map(([v,t])=><LightChoice key={v} value={v} current={settingsPrefs.messageWhoKey||'followers'} title={t} onSelect={x=>{persistSettings({messageWho:t,messageWhoKey:x});setSettingsSheet(null)}} />)}
          </>}
          {settingsSheet === "blockedUsers" && <>
            <LightSheetTitle title="Blocked & muted users" desc="These lists are connected directly to your RainX account controls." />
            {blockedLoading ? <div style={{padding:"18px 0",fontSize:12,color:PREF_MUTED,textAlign:"center"}}>Loading account controls…</div> : <>
              <div style={{fontFamily:FONT_HEAD,fontWeight:800,fontSize:12.5,color:PREF_MUTED,margin:"4px 0 8px"}}>BLOCKED ({blockedUsers.length})</div>
              {blockedUsers.length === 0 ? <div style={{padding:"10px 0 14px",fontSize:12,color:PREF_MUTED}}>No blocked accounts.</div> : blockedUsers.map(({id,profile}) => {
                const name = profile?.display_name || profile?.full_name || profile?.username || `Account ${id.slice(0,6)}`;
                return <LightRow key={id} icon={UserX} title={name} subtitle={profile?.username ? `@${profile.username}` : "Blocked account"} onPress={async()=>{ const {error}=await supabase.from("user_blocks").delete().eq("blocker_id",account.id).eq("blocked_id",id); if(!error) setBlockedUsers(v=>v.filter(x=>x.id!==id)); }} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED,border:`1px solid ${PREF_BORDER}`,borderRadius:20,padding:"4px 8px"}}>UNBLOCK</span>} />;
              })}
              <LightDivider />
              <div style={{fontFamily:FONT_HEAD,fontWeight:800,fontSize:12.5,color:PREF_MUTED,margin:"14px 0 8px"}}>MUTED ({mutedUsers.length})</div>
              {mutedUsers.length === 0 ? <div style={{padding:"10px 0",fontSize:12,color:PREF_MUTED}}>No muted accounts.</div> : mutedUsers.map(({id,profile}) => {
                const name = profile?.display_name || profile?.full_name || profile?.username || `Account ${id.slice(0,6)}`;
                return <LightRow key={id} icon={Bell} title={name} subtitle={profile?.username ? `@${profile.username}` : "Muted account"} onPress={async()=>{ const {error}=await supabase.from("user_mutes").delete().eq("muter_id",account.id).eq("muted_id",id); if(!error) setMutedUsers(v=>v.filter(x=>x.id!==id)); }} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED,border:`1px solid ${PREF_BORDER}`,borderRadius:20,padding:"4px 8px"}}>UNMUTE</span>} />;
              })}
            </>}
          </>}
          {settingsSheet === "dataStorage" && <>
            <LightSheetTitle title="Data & storage" desc="Manage local app data without changing your account." />
            <LightRow icon={ScrollText} title="Clear local preferences" subtitle="Remove locally saved RainX preferences on this device" onPress={()=>{try{Object.keys(localStorage).filter(k=>k.startsWith('rainx-')).forEach(k=>localStorage.removeItem(k));}catch{} setSettingsPrefs({}); setSettingsSheet(null); alert('Local RainX preferences were cleared.');}} right={<ChevronRight size={18} color={PREF_MUTED} />} />
          </>}
          {settingsSheet === "region" && <>
            <LightSheetTitle title="Language & region" desc="Choose your preferred app language and region." />
            <div style={{maxHeight:"52vh",overflowY:"auto",paddingRight:4}}>
              {["English","French","Spanish","Portuguese","Arabic","German","Italian","Dutch","Chinese (Simplified)","Chinese (Traditional)","Japanese","Korean","Hindi","Bengali","Urdu","Indonesian","Malay","Thai","Vietnamese","Turkish","Swahili","Hausa","Yoruba","Amharic","Hebrew","Russian","Ukrainian","Polish","Romanian","Greek","Czech","Hungarian","Swedish","Norwegian","Danish","Finnish"].map(v=><LightChoice key={v} value={v} current={settingsPrefs.language||"English"} title={v} onSelect={x=>{persistSettings({language:x,region:x==="English"?"Ghana":x});setSettingsSheet(null)}} />)}
            </div>
          </>}
          {settingsSheet === "cookies" && <>
            <LightSheetTitle title="Cookie & tracking preferences" desc="Optional controls. Essential security and session storage remain enabled." />
            <LightToggleRow icon={Activity} title="Analytics" subtitle="Help RainX understand how features are used" prefKey="analyticsCookies" />
            <LightToggleRow icon={Users2} title="Personalized recommendations" subtitle="Use activity to improve content and market suggestions" prefKey="personalizationCookies" />
            <LightToggleRow icon={Bell} title="Marketing notifications" subtitle="Allow promotional product and creator updates" prefKey="marketingNotifications" defaultValue={false} />
          </>}
          {settingsSheet === "downloadData" && <>
            <LightSheetTitle title="Download your data" desc="Create a local copy of the preferences currently stored on this device." />
            <LightRow icon={Download} title="Export local preferences" subtitle="Save your RainX settings as a JSON file" onPress={()=>{try{const payload={exportedAt:new Date().toISOString(),settings:settingsPrefs,security:{...securityPrefs,pinHash:undefined,biometricCredentialId:undefined}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="rainx-settings.json";a.click();URL.revokeObjectURL(url);setSettingsSheet(null)}catch{alert("Unable to export local preferences on this device.")}}} right={<ChevronRight size={18} color={PREF_MUTED} />} />
          </>}
        </LightSheet>}
        {settingsSheet === "legal" && <LegalSheet onClose={()=>setSettingsSheet(null)} />}
      </div>
    </MoreSubScreen>
  );

  if (morePage === "notifications") return (
    <MoreSubScreen onBack={() => setMorePage("profile-menu")} title="Notifications" subtitle="Alert preferences & push settings">
      <div style={{ background:PREF_BG, minHeight:"100%" }}><NotificationSettingsScreen account={account} activeMarkets={activeMarkets} /></div>
    </MoreSubScreen>
  );

  if (morePage === "security") return (
    <MoreSubScreen onBack={() => setMorePage("profile-menu")} title="Security" subtitle="Protect your account & device">
      <div style={{ background:PREF_BG, minHeight:"100%", padding:"16px 16px 28px" }}>
        {(() => {
          const checks = [
            securityPrefs.pinEnabled,
            securityPrefs.biometricEnabled,
            securityPrefs.loginAlerts !== false,
            securityPrefs.tradeConfirmations !== false,
            securityPrefs.withdrawConfirmations !== false,
            securityPrefs.securityEmails !== false,
          ];
          const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
          const scoreLabel = score >= 85 ? "Strong" : score >= 60 ? "Good" : "Needs attention";
          return (
            <div style={{ background:"#FFFFFF", border:`1px solid ${PREF_BORDER}`, borderRadius:16, padding:"15px 16px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                <div>
                  <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:14, color:PREF_TEXT }}>Security Center</div>
                  <div style={{ fontSize:11, color:PREF_MUTED, marginTop:3 }}>Account protection score · {scoreLabel}</div>
                </div>
                <div style={{ fontFamily:FONT_HEAD, fontWeight:900, fontSize:20, color:score >= 85 ? "#1A7A50" : score >= 60 ? "#A87500" : "#C0392B" }}>{score}%</div>
              </div>
              <div style={{ height:7, borderRadius:8, background:"#EEF1F3", overflow:"hidden", marginTop:12 }}>
                <div style={{ height:"100%", width:`${score}%`, background:PREF_YELLOW, borderRadius:8 }} />
              </div>
              <button onClick={()=>setSecuritySheet("checkup")} style={{ marginTop:12, width:"100%", border:`1px solid ${PREF_BORDER}`, background:"#FFFFFF", borderRadius:10, padding:"9px 12px", fontFamily:FONT_HEAD, fontWeight:800, fontSize:11.5, color:PREF_TEXT, cursor:"pointer" }}>Run security checkup</button>
            </div>
          );
        })()}
        <LightSection title="Sign-in security">
          <LightRow icon={Key} title="Change Password" subtitle="Update your account password" onPress={async()=>{const {error}=await supabase.auth.resetPasswordForEmail(account?.email||""); if(!error) alert("Password reset link sent to your email."); else alert("Could not send reset email. Try again.");}} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={ShieldCheck} title="Two-Step Authentication (2FA)" subtitle={twoFactorFactor ? "Authenticator app is protecting this account" : "Add an authenticator app or verified factor"} onPress={()=>setSecuritySheet("twoFactor")} right={<span style={{fontSize:10.5,fontWeight:800,color:twoFactorFactor?"#1A7A50":PREF_MUTED,border:`1px solid ${twoFactorFactor?"#B9DCCB":PREF_BORDER}`,borderRadius:20,padding:"4px 8px"}}>{twoFactorFactor?"ENABLED":"SET UP"}</span>} />
          <LightDivider />
          <LightRow icon={Smartphone} title="Phone & recovery methods" subtitle="Manage verified phone numbers and recovery factors" onPress={()=>setSecuritySheet("recovery")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={Activity} title="Login history" subtitle="Review sign-ins, devices, locations and security events" onPress={()=>setSecuritySheet("loginHistory")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
        </LightSection>

        <LightSection title="Device security">
           <LightRow icon={Lock} title="App Lock" subtitle="Require device authentication before opening RainX" onPress={toggleAppLock} right={<LightToggle on={securityPrefs.appLock ?? false} onChange={toggleAppLock} />} />
          <LightDivider />
          <LightRow icon={Key} title="PIN Lock" subtitle={securityPrefs.pinEnabled ? "A RainX device PIN is set" : "Create a 4–6 digit RainX device PIN"} onPress={()=>{setPinValue("");setPinConfirm("");setPinError("");setSecuritySheet("pin")}} right={<span style={{fontSize:10.5,fontWeight:800,color:securityPrefs.pinEnabled?PREF_YELLOW:PREF_MUTED,border:`1px solid ${securityPrefs.pinEnabled?PREF_YELLOW:PREF_BORDER}`,borderRadius:20,padding:"4px 9px"}}>{securityPrefs.pinEnabled?"ENABLED":"SET UP"}</span>} />
          <LightDivider />
           <LightRow icon={Smartphone} title="Face ID / Device Passkey" subtitle={securityPrefs.biometricEnabled?"Biometric unlock is enabled on this device":"Use Face ID, fingerprint or device biometrics"} onPress={securityPrefs.biometricEnabled ? disableBiometric : setupPasskey} right={<span style={{fontSize:10.5,fontWeight:800,color:securityPrefs.biometricEnabled?PREF_YELLOW:PREF_MUTED,border:`1px solid ${securityPrefs.biometricEnabled?PREF_YELLOW:PREF_BORDER}`,borderRadius:20,padding:"4px 9px"}}>{securityPrefs.biometricEnabled?"DISABLE":"SET UP"}</span>} />
        </LightSection>

        <LightSection title="Account protection">
          <LightSecurityToggleRow title="New login alerts" subtitle="Notify me when a new device signs in" prefKey="loginAlerts" />
          <LightDivider />
          <LightSecurityToggleRow title="Trade confirmations" subtitle="Confirm sensitive trading actions before they are submitted" prefKey="tradeConfirmations" />
          <LightDivider />
          <LightSecurityToggleRow title="Withdrawal confirmations" subtitle="Require an extra confirmation before wallet withdrawals" prefKey="withdrawConfirmations" />
          <LightDivider />
          <LightSecurityToggleRow title="Security emails" subtitle="Receive important security and account notices" prefKey="securityEmails" />
        </LightSection>

        <LightSection title="Sessions & recovery">
          <LightRow icon={Smartphone} title="Active Sessions" subtitle="View and manage devices signed in to RainX" onPress={()=>setSecuritySheet("sessions")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={Mail} title="Recovery email" subtitle={account?.email?"Your account email is set":"Add a recovery email"} onPress={()=>alert(account?.email?"Your RainX account email is the current recovery email.":"Add a recovery email from your account profile.")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={ShieldCheck} title="Security checkup" subtitle="Review your account protection settings" onPress={()=>setSecuritySheet("checkup")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
        </LightSection>

        <LightSection title="Suspicious activity & protection">
          <LightSecurityToggleRow title="Suspicious activity alerts" subtitle="Warn me about unusual sign-ins and high-risk account activity" prefKey="suspiciousActivityAlerts" />
          <LightDivider />
          <LightSecurityToggleRow title="Require confirmation for sensitive actions" subtitle="Add an extra confirmation before security or wallet changes" prefKey="sensitiveActionConfirmations" />
          <LightDivider />
          <LightRow icon={ShieldCheck} title="Report a security issue" subtitle="Open the security-report flow for a suspected compromise" onPress={()=>setSecuritySheet("reportSecurity")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
        </LightSection>

        <LightSection title="Creator Space security">
          <LightSecurityToggleRow title="Creator security alerts" subtitle="Notify me about creator-space permission and payout changes" prefKey="creatorSecurityAlerts" />
          <LightDivider />
          <LightSecurityToggleRow title="Token reporting reminders" subtitle="Show reporting and moderation actions on token pages" prefKey="tokenReporting" />
          <LightDivider />
          <LightRow icon={ShieldCheck} title="Token risk & disclosure" subtitle="Review internal-token risk warnings before creator actions" onPress={()=>setSecuritySheet("tokenRisk")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={Lock} title="Premium creator controls" subtitle="Creator permissions, payout protection and moderation access" onPress={()=>setSecuritySheet("creatorControls")} right={<span style={{fontSize:10.5,fontWeight:800,color:PREF_MUTED,border:`1px solid ${PREF_BORDER}`,borderRadius:20,padding:"4px 8px"}}>BACKEND</span>} />
        </LightSection>

        <LightSection title="Account status & control">
          <LightRow icon={UserX} title="Deactivate account" subtitle="Temporarily hide your account and sign you out" right={<LightToggle danger on={!!securityPrefs.deactivated} onChange={()=>{if(securityPrefs.deactivated){persistSecurity({deactivated:false});return;}if(window.confirm("Deactivate your RainX account on this device? You can reactivate later.")){persistSecurity({deactivated:true});onLogout?.();}}} />} />
          <LightDivider />
          <LightRow icon={Database} title="Account data" subtitle="Review your account data and privacy controls" onPress={()=>setSecuritySheet("accountData")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          <LightDivider />
          <LightRow icon={Trash2} title="Delete account" subtitle="Permanently request account deletion" right={<LightToggle danger on={!!securityPrefs.deleteArmed} onChange={()=>{if(securityPrefs.deleteArmed){persistSecurity({deleteArmed:false});return;}if(window.confirm("Arm permanent account deletion? You will still need to confirm on the next screen.")){persistSecurity({deleteArmed:true});setSecuritySheet("deleteAccount");}}} />} />
        </LightSection>

        {securitySheet && <LightSheet onClose={()=>setSecuritySheet(null)}>
          {securitySheet === "twoFactor" && <>
             <LightSheetTitle title="Two-Step Authentication" desc={twoFactorFactor ? "Your authenticator app is verified for this account." : "Use an authenticator app to protect new sign-ins."} />
             {twoFactorFactor ? <>
               <div style={{background:"#EEF9F2",border:"1px solid #B9DCCB",borderRadius:12,padding:"12px 13px",fontSize:11,color:"#1A7A50",lineHeight:1.5,marginBottom:12}}>Two-step authentication is active. You will need a current 6-digit authenticator code when RainX requests an MFA challenge.</div>
               <LightRow icon={ShieldCheck} title="Authenticator app" subtitle="Verified and protecting your account" right={<span style={{fontSize:10,fontWeight:800,color:"#1A7A50"}}>ENABLED</span>} />
               <LightDivider />
               <LightRow icon={Trash2} title="Disable two-step authentication" subtitle="Remove the verified authenticator factor" onPress={disableTwoFactor} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
             </> : !twoFactorEnrollment ? <>
               <div style={{background:"#FFF8E5",border:"1px solid #EAD28A",borderRadius:12,padding:"12px 13px",fontSize:11,color:"#765B00",lineHeight:1.5,marginBottom:12}}>RainX will connect this account to Supabase Auth MFA. No secret is stored in the app; your authenticator app keeps the factor.</div>
               <LightRow icon={ShieldCheck} title="Authenticator app" subtitle="Scan a QR code and verify a 6-digit code" onPress={beginTwoFactorEnrollment} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
             </> : <>
               <div style={{fontSize:12,color:PREF_TEXT,lineHeight:1.55,marginBottom:10}}>Scan this QR code with Google Authenticator, Authy or another TOTP app, then enter the current 6-digit code.</div>
               {twoFactorEnrollment?.totp?.qr_code && <img src={twoFactorEnrollment.totp.qr_code} alt="RainX authenticator QR code" style={{display:"block",width:170,height:170,margin:"6px auto 12px",borderRadius:10,border:`1px solid ${PREF_BORDER}`,background:"#FFFFFF",padding:8}} />}
               {twoFactorEnrollment?.totp?.secret && <div style={{background:PREF_BG,border:`1px solid ${PREF_BORDER}`,borderRadius:10,padding:"9px 10px",fontSize:10.5,color:PREF_MUTED,wordBreak:"break-all",marginBottom:12}}>Manual setup key: <strong style={{color:PREF_TEXT}}>{twoFactorEnrollment.totp.secret}</strong></div>}
               <input value={twoFactorCode} onChange={event=>setTwoFactorCode(event.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" aria-label="Authenticator code" style={{width:"100%",boxSizing:"border-box",border:`1px solid ${PREF_BORDER}`,borderRadius:11,padding:"12px 13px",fontSize:16,letterSpacing:4,textAlign:"center",outline:"none",marginBottom:10}} />
               <button disabled={twoFactorLoading || twoFactorCode.length !== 6} onClick={verifyTwoFactorEnrollment} style={{width:"100%",background:PREF_YELLOW,color:"#17191B",border:0,borderRadius:11,padding:"12px 0",fontFamily:FONT_HEAD,fontWeight:800,fontSize:13,cursor:"pointer",opacity:(twoFactorLoading || twoFactorCode.length !== 6) ? .55 : 1}}>{twoFactorLoading?"VERIFYING…":"VERIFY & ENABLE"}</button>
             </>}
          </>}
          {securitySheet === "recovery" && <>
            <LightSheetTitle title="Recovery methods" desc="Keep at least two trusted ways to regain access." />
            <LightRow icon={Mail} title="Account email" subtitle={account?.email || "Not available"} right={<span style={{fontSize:10,fontWeight:800,color:"#1A7A50"}}>VERIFIED</span>} />
            <LightDivider />
            <LightRow icon={Smartphone} title="Verified phone" subtitle="Add and verify a recovery phone number" onPress={()=>alert("Backend required: phone verification and recovery-factor storage.")} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED}}>BACKEND</span>} />
            <LightDivider />
             <LightRow icon={Key} title="Recovery codes" subtitle="Generate new one-time codes for account recovery" onPress={generateRecoveryCodes} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
             {recoveryCodes.length > 0 && <div style={{background:PREF_BG,border:`1px solid ${PREF_BORDER}`,borderRadius:12,padding:"11px 12px",fontFamily:"monospace",fontSize:12,lineHeight:1.8,color:PREF_TEXT}}>Save these codes now. They are shown only once:<br />{recoveryCodes.map(code=><div key={code}>{code}</div>)}</div>}
          </>}
          {securitySheet === "loginHistory" && <>
            <LightSheetTitle title="Login history" desc="Recent RainX sign-ins and the devices currently holding sessions." />
            {loginHistoryLoading ? <div style={{padding:"18px 0",fontSize:12,color:PREF_MUTED,textAlign:"center"}}>Loading secure sign-in history…</div> : <>
              {loginHistoryRows.length === 0 && securitySessions.length === 0 && <div style={{padding:"12px 0",fontSize:12,color:PREF_MUTED}}>No recorded sign-in events yet.</div>}
              {loginHistoryRows.map((row) => {
                const meta = row.meta || {};
                return <div key={row.id} style={{background:PREF_BG,border:`1px solid ${PREF_BORDER}`,borderRadius:14,padding:"12px 13px",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><LightIcon Icon={Activity}/><div style={{flex:1}}><div style={{fontFamily:FONT_HEAD,fontWeight:700,fontSize:12.5,color:PREF_TEXT}}>{row.action === "signup" ? "Account created" : "Successful sign-in"}</div><div style={{fontSize:10.5,color:PREF_MUTED,marginTop:2}}>{new Date(row.created_at).toLocaleString()}</div></div><span style={{fontSize:9.5,fontWeight:800,color:"#1A7A50"}}>RECORDED</span></div>
                  <div style={{fontSize:10.5,color:PREF_MUTED,marginTop:8,lineHeight:1.45}}>{meta.platform || "Device"} · {meta.timezone || "Timezone unavailable"}</div>
                </div>;
              })}
              {securitySessions.length > 0 && <div style={{fontFamily:FONT_HEAD,fontWeight:800,fontSize:12,color:PREF_MUTED,margin:"14px 0 8px"}}>ACTIVE AUTH SESSIONS</div>}
              {securitySessions.map((s) => <div key={s.session_id} style={{background:PREF_BG,border:`1px solid ${PREF_BORDER}`,borderRadius:14,padding:"12px 13px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:10}}><LightIcon Icon={Smartphone}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FONT_HEAD,fontWeight:700,fontSize:12.5,color:PREF_TEXT}}>{s.user_agent ? s.user_agent.slice(0,72) : "RainX session"}</div><div style={{fontSize:10.5,color:PREF_MUTED,marginTop:2}}>{s.created_at ? new Date(s.created_at).toLocaleString() : ""} · {s.ip_address || "IP unavailable"}</div></div><span style={{fontSize:9.5,color:"#1A7A50",fontWeight:800}}>ACTIVE</span></div></div>)}
            </>}
          </>}
          {securitySheet === "reportSecurity" && <>
            <LightSheetTitle title="Report a security issue" desc="Use the authenticated security-report endpoint when this flow is wired to the backend." />
             <LightRow icon={ShieldCheck} title="Account may be compromised" subtitle="Start an urgent account-security review" onPress={()=>reportSecurityIssue("account_compromised")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
            <LightDivider />
             <LightRow icon={Mail} title="Contact security support" subtitle="Send a protected security report with account context" onPress={()=>reportSecurityIssue("security_support")} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          </>}
          {securitySheet === "tokenRisk" && <>
            <LightSheetTitle title="Internal-token risk & disclosure" desc="Creator tokens can carry market, liquidity, smart-contract and loss risks." />
            <div style={{background:"#FFF4F4",border:"1px solid #F2B8B8",borderRadius:13,padding:"12px 13px",fontSize:11,color:"#8E2A2A",lineHeight:1.55,marginBottom:12}}>Treat every creator token as high risk until verified. Do not present internal-token balances or creator projections as guaranteed value. Final risk disclosures and acknowledgement records must be enforced server-side.</div>
            <LightSecurityToggleRow title="Require risk acknowledgement" subtitle="Require a user acknowledgement before sensitive creator-token actions" prefKey="tokenRiskAcknowledgement" />
          </>}
          {securitySheet === "creatorControls" && <>
            <LightSheetTitle title="Premium creator controls" desc="Permissions that should be backed by server-side role and entitlement checks." />
            <LightRow icon={Lock} title="Creator permissions" subtitle="Manage who can publish, moderate and change creator settings" onPress={()=>alert("Backend required: role/permission management.")} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED}}>BACKEND</span>} />
            <LightDivider />
            <LightRow icon={Wallet} title="Payout protection" subtitle="Require verification before payout destination changes" onPress={()=>alert("Backend required: payout-change verification.")} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED}}>BACKEND</span>} />
            <LightDivider />
            <LightRow icon={FileCheck} title="Moderation & reports" subtitle="Review token reports, takedowns and creator disputes" onPress={()=>alert("Backend required: moderation/report queue.")} right={<span style={{fontSize:10,fontWeight:800,color:PREF_MUTED}}>BACKEND</span>} />
          </>}
          {securitySheet === "pin" && <>
             <LightSheetTitle title={securityPrefs.pinEnabled?"Change RainX PIN":"Set up RainX PIN"} desc={enableBiometricAfterPin ? "A device PIN is required before Face ID or fingerprint can be enabled." : "Your PIN is hashed before it is stored on this device."} />
            <input value={pinValue} onChange={e=>setPinValue(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" type="password" placeholder="New PIN" style={{width:"100%",boxSizing:"border-box",background:"#fff",border:`1px solid ${PREF_BORDER}`,borderRadius:12,padding:"12px 13px",color:PREF_TEXT,fontFamily:FONT_HEAD,fontSize:15,outline:"none",marginBottom:10}} />
            <input value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" type="password" placeholder="Confirm PIN" style={{width:"100%",boxSizing:"border-box",background:"#fff",border:`1px solid ${PREF_BORDER}`,borderRadius:12,padding:"12px 13px",color:PREF_TEXT,fontFamily:FONT_HEAD,fontSize:15,outline:"none",marginBottom:6}} />
            {pinError&&<div style={{fontSize:11,color:T.rust,margin:"5px 0 10px"}}>{pinError}</div>}
             <button onClick={setupPin} style={{width:"100%",background:PREF_YELLOW,color:T.ink,border:0,borderRadius:12,padding:"12px 0",fontFamily:FONT_HEAD,fontWeight:800,fontSize:13,cursor:"pointer",marginTop:8}}>{enableBiometricAfterPin ? "Save PIN & enable biometrics" : "Save PIN"}</button>
          </>}
          {securitySheet === "sessions" && <>
            <LightSheetTitle title="Active Sessions" desc="Review devices currently signed in to RainX." />
            {securitySessionsLoading ? <div style={{padding:"18px 0",fontSize:12,color:PREF_MUTED,textAlign:"center"}}>Loading sessions…</div> : securitySessions.length === 0 ? <div style={{padding:"10px 0",fontSize:12,color:PREF_MUTED}}>No active session details are available.</div> : securitySessions.map((s) => <div key={s.session_id} style={{background:PREF_BG,border:`1px solid ${PREF_BORDER}`,borderRadius:14,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}><LightIcon Icon={Smartphone}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FONT_HEAD,fontWeight:700,fontSize:12.5,color:PREF_TEXT}}>{s.user_agent ? s.user_agent.slice(0,72) : "RainX device"}</div><div style={{fontSize:10.5,color:PREF_MUTED,marginTop:2}}>{s.ip_address || "IP unavailable"} · {s.updated_at ? new Date(s.updated_at).toLocaleString() : ""}</div></div><span style={{fontSize:9.5,color:"#1A7A50",fontWeight:800}}>ACTIVE</span></div>)}
          </>}
          {securitySheet === "appLockSetup" && <>
            <LightSheetTitle title="Set up App Lock" desc="RainX needs a PIN or device biometric before App Lock can be enabled." />
            <LightRow icon={Key} title="Set up PIN" subtitle="Create a 4–6 digit RainX PIN" onPress={()=>{setPinValue("");setPinConfirm("");setPinError("");setSecuritySheet("pin")}} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
            <LightDivider />
            <LightRow icon={Smartphone} title="Set up Face ID / device passkey" subtitle="Use your device biometric when supported" onPress={setupPasskey} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          </>}
          {securitySheet === "accountData" && <>
            <LightSheetTitle title="Account data" desc="Manage the privacy and account-data actions available from this device." />
            <LightRow icon={Download} title="Export local settings" subtitle="Download your RainX preferences as JSON" onPress={()=>{setSecuritySheet(null);setMorePage("settings");setSettingsSheet("downloadData")}} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
            <LightDivider />
            <LightRow icon={FileCheck} title="Privacy controls" subtitle="Review discovery, messaging and personalization settings" onPress={()=>{setSecuritySheet(null);setMorePage("settings")}} right={<ChevronRight size={18} color={PREF_MUTED}/>} />
          </>}
          {securitySheet === "deleteAccount" && <>
            <LightSheetTitle title="Delete account" desc="Account deletion is permanent. Real deletion should require re-authentication and a trusted server-side deletion flow." />
             <div style={{background:"#FFF4F4",border:"1px solid #F2B8B8",borderRadius:13,padding:"12px 13px",fontSize:11,color:"#8E2A2A",lineHeight:1.5,marginBottom:12}}>This submits a protected deletion request for backend review. Your account is not deleted immediately.</div>
             <button onClick={requestAccountDeletion} style={{width:"100%",background:"#C0392B",color:"#FFFFFF",border:0,borderRadius:12,padding:"12px 0",fontFamily:FONT_HEAD,fontWeight:800,fontSize:13,cursor:"pointer"}}>Submit deletion request</button>
          </>}
          {securitySheet === "checkup" && <>
            <LightSheetTitle title="Security checkup" desc="A quick view of your current protection." />
            {[['Password','Managed by RainX account authentication',true],['PIN lock',securityPrefs.pinEnabled?'Enabled on this device':'Not set',!!securityPrefs.pinEnabled],['Face ID / Passkey',securityPrefs.biometricEnabled?'Enabled on this device':'Not set',!!securityPrefs.biometricEnabled],['Login alerts',securityPrefs.loginAlerts!==false?'Enabled':'Disabled',securityPrefs.loginAlerts!==false],['Withdrawal confirmations',securityPrefs.withdrawConfirmations!==false?'Enabled':'Disabled',securityPrefs.withdrawConfirmations!==false]].map(([t,d,on])=><div key={t} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",borderBottom:`1px solid ${PREF_BORDER}`}}><div style={{flex:1}}><div style={{fontFamily:FONT_HEAD,fontWeight:700,fontSize:12.5,color:PREF_TEXT}}>{t}</div><div style={{fontSize:10.5,color:PREF_MUTED,marginTop:2}}>{d}</div></div><span style={{fontSize:10,fontWeight:800,color:on?"#1A7A50":PREF_MUTED}}>{on?"ON":"OFF"}</span></div>)}
          </>}
        </LightSheet>}
      </div>
    </MoreSubScreen>
  );

  const rewardEligible = followerCount >= 1000 && referralCount >= 500 && impressionCount >= 100000;

  // ---- Main More Page ----
  return (
    <div style={{ padding: "8px 16px 28px" }}>
      {/* User account header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0 16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 16, color: T.paper, lineHeight: 1.2 }}>{fullName || (profileLoaded ? "User" : "…")}</div>{username ? <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>@{username}</div> : null}</div>
        <button onClick={() => pushReferralPage("referrals")} aria-label="Open referral rewards" style={{ width:42, height:42, borderRadius:"50%", border:"none", background:"#17191B", display:"grid", placeItems:"center", cursor:"pointer" }}><Coins size={21} color={T.gold}/></button>
      </div>

      {/* Analytics preview card */}
      <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:16, padding:16, marginBottom:22 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:13, color:T.paper }}>Analytics</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Your creator performance</div>
          </div>
          <button onClick={() => setMorePage("analytics")} style={{ background:"none", border:"none", color:T.muted, fontSize:11.5, fontFamily:FONT_HEAD, fontWeight:700, cursor:"pointer" }}>View all →</button>
        </div>
        {/* Mini bar chart sparkline */}
        <div style={{ height:52, display:"flex", alignItems:"flex-end", gap:3, marginBottom:12 }}>
          {[35,50,28,65,42,78,55,90,68,88].map((h,i) => (
            <div key={i} style={{ flex:1, height:`${h}%`, background:i===9?T.muted:`${T.muted}55`, borderRadius:2, minHeight:4 }} />
          ))}
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:18, color:T.paper }}>{impressionCount.toLocaleString()}</div>
            <div style={{ fontSize:10.5, color:T.muted, marginTop:1 }}>Total impressions</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:FONT_HEAD, fontWeight:800, fontSize:18, color:T.paper }}>{followerCount.toLocaleString()}</div>
            <div style={{ fontSize:10.5, color:T.muted, marginTop:1 }}>Followers</div>
          </div>
          <button onClick={() => setMorePage("analytics")} style={{ background:`rgba(140,140,140,0.15)`, border:`1px solid ${T.muted}44`, borderRadius:10, padding:"8px 14px", fontFamily:FONT_HEAD, fontWeight:700, fontSize:11.5, color:T.muted, cursor:"pointer", flexShrink:0 }}>Open</button>
        </div>
      </div>

      <MoreSection title="TRADER REWARDS PROGRAM">
        {/* Get Verified row with dual badges */}
        <button onClick={() => setMorePage("verification")} style={{ width:"100%", display:"flex", alignItems:"center", padding:"14px 16px", background:"none", border:"none", cursor:"pointer", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(140,140,140,0.14)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, position:"relative" }}>
            {/* Overlapping blue + gold badges */}
            <svg width="16" height="16" viewBox="1.604 1.604 18.792 18.792" style={{ position:"absolute", left:6, top:10 }}>
              <path d="m20.396 11a3.487 3.487 0 0 0 -2.008-3.062 3.474 3.474 0 0 0 -.742-3.584 3.474 3.474 0 0 0 -3.584-.742 3.468 3.468 0 0 0 -3.062-2.008 3.463 3.463 0 0 0 -3.053 2.008 3.472 3.472 0 0 0 -1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0 -.734 3.584 3.49 3.49 0 0 0 -2.017 3.062 3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742 3.487 3.487 0 0 0 3.062 2.008 3.476 3.476 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327 3.487 3.487 0 0 0 2.008-3.062zm-10.734 3.85-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1d9bf0" />
            </svg>
            <svg width="16" height="16" viewBox="1.604 1.604 18.792 18.792" style={{ position:"absolute", right:6, top:10 }}>
              <path d="m20.396 11a3.487 3.487 0 0 0 -2.008-3.062 3.474 3.474 0 0 0 -.742-3.584 3.474 3.474 0 0 0 -3.584-.742 3.468 3.468 0 0 0 -3.062-2.008 3.463 3.463 0 0 0 -3.053 2.008 3.472 3.472 0 0 0 -1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0 -.734 3.584 3.49 3.49 0 0 0 -2.017 3.062 3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742 3.487 3.487 0 0 0 3.062 2.008 3.476 3.476 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327 3.487 3.487 0 0 0 2.008-3.062zm-10.734 3.85-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#F4D35E" />
            </svg>
          </div>
          <div style={{ flex:1, textAlign:"left" }}>
            <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:13.5, color:T.paper }}>Get Verified</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Earn your badge &amp; unlock rewards</div>
          </div>
          <ChevronRight size={15} color={T.muted} />
        </button>
        <MoreRowDivider />
        <div style={{ padding:"14px 16px" }}>
          {/* Progress bars */}
          {[
            { label:"Followers", val:followerCount, target:1000 },
            { label:"Referrals", val:referralCount, target:500 },
            { label:"Impressions", val:impressionCount, target:100000 },
          ].map(({ label, val, target }) => {
            const done = val >= target;
            return (
              <div key={label} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:12, color:T.paper }}>{target.toLocaleString()} {label}</span>
                  <span style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:12, color:done?T.sage:T.paper }}>{val.toLocaleString()}/{target.toLocaleString()}</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:T.cardBorder, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.min(1,val/target)*100}%`, borderRadius:3, background:done?T.sage:T.muted, transition:"width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize:11, color:T.muted, lineHeight:1.6, marginBottom:14 }}>A qualified referral is a user who signs up through your link and activates a subscription.</div>
          {/* Referral link + wallet balance */}
          <div style={{ background:T.ink, border:`1px solid ${T.cardBorder}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
            <div style={{ fontFamily:FONT_HEAD, fontWeight:700, fontSize:12, color:T.paper, marginBottom:8 }}>YOUR REFERRAL LINK</div>
            <div style={{ fontSize:11, color:T.muted, lineHeight:1.6, marginBottom:10 }}>Earn 20% cash reward — sent to your wallet — every time someone signs up with your link and activates a subscription.</div>
            {referralCode ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
                <span style={{ flex:1, fontSize:11, color:T.paper, fontFamily:FONT_BODY, wordBreak:"break-all" }}>https://rainx.app/?ref={referralCode}</span>
                <button
                  onClick={() => { try { navigator.clipboard.writeText(`https://rainx.app/?ref=${referralCode}`).then(() => alert("Link copied!")).catch(() => {}); } catch {} }}
                  style={{ background:T.gold, border:"none", borderRadius:8, padding:"6px 12px", fontFamily:FONT_HEAD, fontWeight:700, fontSize:11, color:T.ink, cursor:"pointer", flexShrink:0 }}>
                  Copy
                </button>
              </div>
            ) : (
              <div style={{ fontSize:11.5, color:T.muted, fontStyle:"italic", marginBottom:12 }}>Referral code not assigned — contact support to get yours.</div>
            )}
          </div>
          <button
            disabled={!rewardEligible}
            onClick={rewardEligible ? () => setMorePage("rewards") : undefined}
            style={{ width:"100%", background:rewardEligible?T.goldGradient:"rgba(100,100,100,0.18)", color:rewardEligible?T.ink:"rgba(150,150,150,0.6)", border:"none", borderRadius:12, padding:"13px 0", fontFamily:FONT_HEAD, fontWeight:800, fontSize:14, cursor:rewardEligible?"pointer":"not-allowed", transition:"background 0.3s" }}>
            Apply Now
          </button>
        </div>
      </MoreSection>

      <MoreSection title="More">
        <MoreRow
          icon={Zap}
          title="Scalping"
          badge={hasAccess(entitlement.tier, "weekly") ? "Unlocked" : "Locked"}
          badgeColor={hasAccess(entitlement.tier, "weekly") ? T.sage : T.muted}
          onPress={() => setMorePage("scalping")}
        />
        <MoreRowDivider />
        {appInstalled
          ? <MoreRow icon={Smartphone} title="App Installed" subtitle="RainX is on your home screen" />
          : <MoreRow icon={ArrowUpCircle} title="Install App" subtitle="Add RainX to your home screen" onPress={async () => { if (installPrompt) { installPrompt.prompt(); const { outcome } = await installPrompt.userChoice; if (outcome === 'accepted') { setInstallPrompt(null); setAppInstalled(true); } } else { setShowInstallHelp(true); } }} />}
      </MoreSection>

      <div style={{ textAlign: "center", marginTop: 4 }}>
        <button onClick={() => setShowLegal(true)} style={{ background: "none", border: "none", color: T.muted, fontSize: 10.5, cursor: "pointer", textDecoration: "underline", fontFamily: FONT_BODY }}>Terms & Risk Disclosure</button>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4, lineHeight: 1.6 }}>RainX is an analysis tool, not a broker.</div>
      </div>

      {showInstallHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: T.card, width: '100%', maxWidth: 480, margin: '0 auto', borderRadius: '16px 16px 0 0', padding: '22px 20px 36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 17, color: T.paper, fontWeight: 800 }}>Install RainX</div>
              <button onClick={() => setShowInstallHelp(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.8, marginBottom: 20 }}>
              <div style={{ color: T.paper, fontWeight: 700, marginBottom: 6 }}>📱 On iPhone / Safari:</div>
              <div>1. Tap the <strong style={{ color: T.paper }}>Share</strong> button at the bottom of your screen</div>
              <div>2. Scroll and tap <strong style={{ color: T.paper }}>Add to Home Screen</strong></div>
              <div>3. Tap <strong style={{ color: T.paper }}>Add</strong></div>
              <div style={{ color: T.paper, fontWeight: 700, margin: '14px 0 6px' }}>🤖 On Android / Chrome:</div>
              <div>1. Tap the <strong style={{ color: T.paper }}>⋮ menu</strong> at the top right</div>
              <div>2. Tap <strong style={{ color: T.paper }}>Add to Home Screen</strong> or <strong style={{ color: T.paper }}>Install App</strong></div>
            </div>
            <button onClick={() => setShowInstallHelp(false)} style={{ width: '100%', background: T.goldGradient, color: T.ink, border: 'none', borderRadius: 12, padding: '13px 0', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
      )}
      {(morePage === "referrals" || morePage === "referral-activity" || morePage === "referral-performance") && <ReferralRewardsScreen count={referralCount} earnings={referralEarnings} referralCode={referralCode} account={account} onBack={backReferralPage} onActivity={() => pushReferralPage("referral-activity")} />}
      {(morePage === "referral-activity" || morePage === "referral-performance") && <MyReferralsScreen count={referralCount} earnings={referralEarnings} referralCode={referralCode} account={account} onBack={backReferralPage} onActivity={(target) => pushReferralPage(target === "performance" ? "referral-performance" : "referral-activity")} />}
      {morePage === "referral-performance" && <ReferralPerformanceScreen onBack={backReferralPage} />}

      {showLegal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "16px 16px 0 0", padding: 22, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 17, color: T.paper, fontWeight: 800 }}>Terms & Risk Disclosure</div>
              <button onClick={() => setShowLegal(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ fontSize: 12, color: T.paper, lineHeight: 1.7, fontWeight: 500 }}>
              <p><strong>Not financial advice.</strong> RainX and Raina AI provide market analysis and educational commentary only. Nothing in this app is a recommendation to buy, sell, or hold any financial instrument.</p>
              <p><strong>No guaranteed outcomes.</strong> Trading forex, metals, indices, and crypto carries a high level of risk and may not be suitable for all investors. Past performance and AI-generated confidence scores do not guarantee future results.</p>
              <p><strong>Your responsibility.</strong> You are solely responsible for your own trading decisions, position sizing, and risk management. RainX does not execute trades and is not a broker.</p>
              <p><strong>Data.</strong> Market data and analysis in this app may be simulated or delayed pending a live data connection. Always verify prices with your broker before acting.</p>
              <p style={{ color: T.muted, fontSize: 10.5 }}>This is placeholder legal text and not a substitute for review by a qualified lawyer before public launch.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function Section({ title, icon: Icon, children }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_HEAD, fontSize: 14, color: T.goldBright, fontWeight: 700, marginBottom: 8 }}><Icon size={15} /> {title}</div>
      {children}
    </div>
  );
}

// ---------- New Features Slide-up Prompt ----------
const FEATURES_VERSION = "v2026-07";
function NewFeaturesPrompt() {
  const [show, setShow] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('rainx-features-seen') !== FEATURES_VERSION) {
      const t = setTimeout(() => { setShow(true); requestAnimationFrame(() => setSlideIn(true)); }, 1800);
      return () => clearTimeout(t);
    }
  }, []);
  const dismiss = () => { setSlideIn(false); setTimeout(() => setShow(false), 320); localStorage.setItem('rainx-features-seen', FEATURES_VERSION); };
  const forceRestart = () => { localStorage.setItem('rainx-features-seen', FEATURES_VERSION); window.location.reload(); };
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, background: T.card, borderTop: `2px solid ${T.gold}`, borderRadius: '16px 16px 0 0', padding: '20px 20px 36px', boxShadow: '0 -8px 40px rgba(0,0,0,0.55)', transform: slideIn ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 16, color: T.goldBright }}>✨ New Update</div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 13.5, color: T.paper, lineHeight: 1.7, marginBottom: 20 }}>
          RainX has been updated. <strong style={{ color: T.gold }}>Force restart</strong> or <strong style={{ color: T.gold }}>close and reopen</strong> the app to see the latest features.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={forceRestart} style={{ flex: 1, background: T.goldGradient, color: T.ink, border: 'none', borderRadius: 12, padding: '13px 0', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Restart Now</button>
          <button onClick={dismiss} style={{ flex: 1, background: 'none', border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: '13px 0', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: T.muted, cursor: 'pointer' }}>Got it</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Install banner ----------
// Uses the real browser "beforeinstallprompt" event. This only fires once RainX
// is actually deployed as a standalone site with manifest.json linked in the HTML
// head - it won't trigger inside the Claude artifact preview itself.
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    // Do not show banner if already running as an installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Do not show if the user previously dismissed it
    if (localStorage.getItem('rainx-install-dismissed') === '1') return;
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  const dismiss = () => { setVisible(false); localStorage.setItem('rainx-install-dismissed', '1'); };
  const onTouchStart = (e) => { dragging.current = true; startX.current = e.touches[0].clientX; };
  const onTouchMove = (e) => { if (dragging.current) setDragX(e.touches[0].clientX - startX.current); };
  const onTouchEnd = () => { dragging.current = false; if (Math.abs(dragX) > 80) dismiss(); else setDragX(0); };

  return (
    <div
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{ position: "fixed", top: 10, left: 10, right: 10, maxWidth: 460, margin: "0 auto", zIndex: 110, background: T.card, border: `1px solid ${T.gold}`, borderRadius: 12, padding: "10px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 10, fontFamily: FONT_BODY, transform: `translateX(${dragX}px)`, opacity: Math.max(0, 1 - Math.abs(dragX) / 200), transition: dragging.current ? "none" : "transform 0.2s, opacity 0.2s" }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12.5, color: T.paper }}>Install RainX</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Add to your home screen for quick access</div>
      </div>
      <button
        onClick={async () => { setVisible(false); deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') localStorage.setItem('rainx-install-dismissed', '1'); setDeferredPrompt(null); }}
        style={{ background: T.gold, color: T.ink, border: "none", borderRadius: 8, padding: "7px 12px", fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}
      >
        Install
      </button>
      <button onClick={dismiss} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}><X size={15} /></button>
    </div>
  );
}

// ---------- Root ----------
function sessionToAccount(session) {
  if (!session || !session.user) return null;
  return { id: session.user.id, email: session.user.email, joinedAt: session.user.created_at };
}

function RainXBootScreen() {
  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", color: "#0F1419", display: "grid", placeItems: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
        <div style={{ width: 54, height: 54, borderRadius: 18, background: "#F4D35E", color: "#0F1419", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 20, boxShadow: "0 8px 24px rgba(244,211,94,.28)" }}>RX</div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: "#536471" }}>RAINX</div>
      </div>
    </div>
  );
}

export default function RainX() {
  const [account, setAccount] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAccount(sessionToAccount(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(sessionToAccount(session));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (account) recordActivity(account.id, "logout");
    await supabase.auth.signOut();
    setAccount(null);
  };

  if (account === undefined) return <RainXBootScreen />;
  if (!account) return <><InstallBanner /><NewFeaturesPrompt /><AuthScreen onAuthed={(session) => setAccount(sessionToAccount(session))} /></>;
  return <><InstallBanner /><NewFeaturesPrompt /><MainApp account={account} onLogout={handleLogout} /></>;
}
