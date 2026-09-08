import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { createChart, CrosshairMode, LineStyle } from "lightweight-charts";
import { registerNativeBackHandler } from "./nativeBackStack";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CircleHelp,
  Contact,
  Droplets,
  Home,
  Menu,
  Plus,
  ReceiptText,
  Rocket,
  Settings,
  Share2,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Wallet,
  WalletCards,
  X,
} from "lucide-react";
import {
  SiCoinbase,
  SiWalletconnect,
} from "react-icons/si";

import galaxyDogeImage from "./assets/space-coins-galaxy-doge.jpg";
import moonCatImage from "./assets/space-coins-moon-cat.jpg";
import planetPepeImage from "./assets/space-coins-planet-pepe.jpg";
import rocketArtwork from "./assets/space-coins-rocket.png";
import orbitArtwork from "./assets/space-coins-orbit.png";
import platformArtwork from "./assets/space-coins-platform.png";
import coinArtwork from "./assets/space-coins-coin.png";
import externalBanner from "./assets/space-coins-external-banner.png";
import galaxyDogeToken from "./assets/space-coins-galaxy-doge.svg";
import moonCatToken from "./assets/space-coins-moon-cat.svg";
import planetPepeToken from "./assets/space-coins-planet-pepe.svg";
import metamaskLogo from "./assets/metamask.svg";
import trustWalletLogo from "./assets/trust-wallet.svg";
import phantomLogo from "./assets/phantom.svg";

const REAL_FLAME_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3BHloZy6zhOMmqbVkiEIfVkbiDF/hf_20260821_145856_91a13b8e-c366-4951-be01-e7f1846cbbc6.mp4";
const REAL_CLOUD_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3BHloZy6zhOMmqbVkiDF/hf_20260821_153425_e7dbe97e-35f8-4ada-80e3-d11209f83006.mp4";

const COINS = [];


function stop(e) {
  e.stopPropagation();
}

function Shell({ children }) {
  return (
    <main
      className="rx-space-shell"
      onTouchStart={stop}
      onTouchMove={stop}
      onTouchEnd={stop}
      onTouchCancel={stop}
    >
      {children}
    </main>
  );
}

function Header({ onMenu, onBack, title = "Space Coins" }) {
  return (
    <header className="rx-space-header">
      {onBack ? (
        <button className="rx-icon-btn rx-left" onClick={onBack} aria-label="Back">
          <ArrowLeft size={23} />
        </button>
      ) : (
        <span className="rx-header-spacer" aria-hidden="true" />
      )}
      <h1>{title}</h1>
      {!onBack && (
        <button className="rx-icon-btn rx-right" onClick={onMenu} aria-label="Space Coins menu">
          <Menu size={24} />
        </button>
      )}
    </header>
  );
}

function ModeToggle({ mode, setMode, swipeProgress = null, swiping = false }) {
  const progress = swipeProgress == null ? (mode === "external" ? 1 : 0) : swipeProgress;
  return (
    <div className="rx-mode-toggle" role="tablist" aria-label="Coin type">
      <span className="rx-mode-indicator" style={{ transform: `translateX(${progress * 100}%)`, transition: swiping ? "none" : undefined }} />
      <button
        className={mode === "space" ? "active" : ""}
        onClick={() => setMode("space")}
        role="tab"
        aria-selected={mode === "space"}
      >
        <img src={coinArtwork} alt="" />
        <span>Space Coins</span>
      </button>

      <button
        className={mode === "external" ? "active" : ""}
        onClick={() => setMode("external")}
        role="tab"
        aria-selected={mode === "external"}
      >
        <img src={coinArtwork} alt="" />
        <span>External Coins</span>
      </button>
    </div>
  );
}

function CreateBanner({ onCreate }) {
  return (
    <section className="rx-space-banner">
      <img src={externalBanner} alt="" draggable="false" />
      <div className="rx-space-banner-copy">
        <h2><span className="rx-banner-title-light">Create Your</span><br />Space Coin</h2>
        <p>Launch your own mini meme<br />coin in just a few steps.</p>
        <button onClick={onCreate}>
          Create Coin <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function Shortcuts({ onMyCoins }) {
  const items = [
    [ShieldCheck, "Top Tokens"],
    [TrendingUp, "Trending"],
    [Rocket, "New Launches"],
    [WalletCards, "My Coins"],
  ];

  return (
    <nav className="rx-shortcuts">
      {items.map(([Icon, label]) => (
        <button key={label} onClick={label === "My Coins" ? onMyCoins : undefined}>
          <span className="rx-shortcut-icon">
            <Icon />
          </span>
          <span className="rx-shortcut-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

function CoinList({ coins = COINS, onSelect }) {
  return (
    <section className="rx-space-section">
      <div className="rx-section-head">
        <h2>Top Space Coins</h2>
        <button>View All</button>
      </div>

      <div className="rx-coin-list">
        {coins.length ? coins.map((coin) => (
          <button className="rx-coin-row" key={coin.id || coin.ticker || coin.symbol} onClick={() => onSelect?.(coin)}>
            <img src={coin.image_url || coin.image} alt="" onError={(e) => { e.currentTarget.src = coinArtwork; }} />
            <span className="rx-coin-name">
              <strong>{coin.name}</strong>
              <small>{coin.symbol || coin.ticker || "COIN"}</small>
            </span>
            <span className="rx-coin-value">
              <strong>{coin.price || (Number.isFinite(Number(coin.current_price)) ? "$" + Number(coin.current_price).toFixed(6) : "—")}</strong>
              <small>{coin.change || (Number.isFinite(Number(coin.price_change_24h)) ? (Number(coin.price_change_24h) >= 0 ? "+" : "") + Number(coin.price_change_24h).toFixed(2) + "%" : "—")}</small>
            </span>
          </button>
        )) : <div className="rx-empty-coin-list">No Space Coins yet. Create one to see it here.</div>}
      </div>
    </section>
  );
}

function Trending({ coins = [] }) {
  if (!coins.length) return null;
  return (
    <section className="rx-space-section">
      <div className="rx-section-head">
        <h2>Trending</h2>
        <button>View All</button>
      </div>

      <div className="rx-trending">
        {coins.slice(0, 3).map((coin, index) => (
          <button key={coin.id || coin.symbol || coin.name}>
            <b>#{index + 1}</b>
            {coin.symbol || coin.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function ExternalPanel({ onConnect }) {
  return (
    <section className="rx-external-panel">
      <section className="rx-external-hero">
        <h2>Explore<br />External Coins</h2>
        <p>Trade popular coins from across the universe.</p>
        <img src={coinArtwork} alt="" />
      </section>

      <div className="rx-wallet-card">
        <div className="rx-wallet-art">
          <img src={orbitArtwork} alt="" />
        </div>
        <div>
          <strong>Connect External Wallet</strong>
          <p>Your funds stay in your wallet while you explore external coins.</p>
        </div>
        <button onClick={onConnect}>Connect Wallet</button>
      </div>
    </section>
  );
}

function SwipeArea({ mode, setMode, onMyCoins, onConnect, onProgress, onSwipeStateChange, coins, onSelectCoin }) {
  const viewportRef = useRef(null);
  const start = useRef(null);
  const dragProgressRef = useRef(0);
  const [dragProgress, setDragProgress] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, axis: null };
    dragProgressRef.current = mode === "external" ? 1 : 0;
    setSwiping(true);
    onSwipeStateChange?.(true);
    setDragProgress(dragProgressRef.current);
  };
  const onPointerMove = (e) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (!start.current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      start.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (start.current.axis === "y") return;
    if (e.cancelable) e.preventDefault();
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    const progress = mode === "external"
      ? 1 - dx / width
      : -dx / width;
    const boundedProgress = Math.max(0, Math.min(1, progress));
    dragProgressRef.current = boundedProgress;
    setDragProgress(boundedProgress);
    onProgress?.(boundedProgress);
  };
  const onPointerEnd = (e) => {
    if (!start.current) return;
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    if (start.current.axis === "x") {
      if (mode === "space" && dragProgressRef.current > 0.5) {
        setMode("external");
      } else if (mode === "external" && dragProgressRef.current < 0.5) {
        setMode("space");
      }
    }
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    start.current = null;
    dragProgressRef.current = mode === "external" ? 1 : 0;
    setDragProgress(null);
    setSwiping(false);
    onSwipeStateChange?.(false);
    onProgress?.(null);
  };

  return (
    <div
      ref={viewportRef}
      className="rx-swipe-viewport"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div
        className={`rx-swipe-track ${mode === "external" ? "external" : ""}`}
        style={swiping && dragProgress != null ? {
          transform: `translate3d(${dragProgress * -50}%,0,0)`,
          transition: "none",
        } : undefined}
      >
        <div className="rx-swipe-panel">
          <Shortcuts onMyCoins={onMyCoins} />
          <CoinList coins={coins} onSelect={onSelectCoin} />
          <Trending coins={coins} />
        </div>

        <div className="rx-swipe-panel rx-external-slide">
          <ExternalPanel onConnect={onConnect} />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ mode, setMode, onCreate, onMenu, onMyCoins, onConnect, coins, onSelectCoin }) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swiping, setSwiping] = useState(false);

  return (
    <Shell>
      <style>{styles}</style>

      <div className="rx-space-scroll">
        <div className="rx-space-inner">
          <Header onMenu={onMenu} />
          <CreateBanner onCreate={onCreate} />
          <ModeToggle mode={mode} setMode={setMode} swipeProgress={swipeProgress} swiping={swiping} />

          <SwipeArea
            mode={mode}
            setMode={setMode}
            coins={coins}
            onSelectCoin={onSelectCoin}
            onMyCoins={onMyCoins}
            onConnect={onConnect}
            onProgress={setSwipeProgress}
            onSwipeStateChange={setSwiping}
          />
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="rx-create-field">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function useEdgeBack(onBack) {
  const ref = useRef(null);

  return {
    onTouchStart: (e) => {
      const t = e.touches[0];
      ref.current = t.clientX < 28 ? { x: t.clientX, y: t.clientY } : null;
    },

    onTouchEnd: (e) => {
      if (!ref.current) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - ref.current.x;
      const dy = Math.abs(t.clientY - ref.current.y);

      ref.current = null;

      if (dx > 48 && dy < 90) onBack?.();
    },

    onTouchCancel: () => {
      ref.current = null;
    },
  };
}

function CreateCoin({ onBack, onCreated }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logo, setLogo] = useState(null);
  const logoInputRef = useRef(null);
  const [networkOpen, setNetworkOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    symbol: "",
    description: "",
    supply: "1,000,000,000",
    network: "Solana",
  });

  const logoUrl = useMemo(
    () => (logo ? URL.createObjectURL(logo) : null),
    [logo]
  );

  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, [logoUrl]);

  const valid =
    form.name.trim().length >= 2 &&
    /^[A-Za-z0-9]{2,10}$/.test(form.symbol.trim());

  const edge = useEdgeBack(onBack);

  const set = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  const launchCoin = async () => {
    if (!valid || saving) return;
    setSaving(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Sign in to launch a coin.");
      let image_url = null;
      if (logo) {
        const ext = (logo.name.split(".").pop() || "jpg").toLowerCase();
        const fileId = globalThis.crypto?.randomUUID?.() || Date.now() + "-" + Math.random().toString(36).slice(2);
        const objectPath = user.id + "/" + fileId + "." + ext;
        const upload = await supabase.storage.from("space-coin-logos").upload(objectPath, logo, { contentType: logo.type || "image/jpeg", upsert: false });
        if (upload.error) throw upload.error;
        image_url = supabase.storage.from("space-coin-logos").getPublicUrl(objectPath).data.publicUrl;
      }
      const supply = Number(String(form.supply).replace(/,/g, ""));
      const { data, error: insertError } = await supabase.from("space_coins").insert({ creator_id: user.id, name: form.name.trim(), symbol: form.symbol.trim().toUpperCase(), description: form.description.trim(), network: form.network, total_supply: supply > 0 ? supply : 1000000000, initial_price: 0.000001, current_price: 0.000001, image_url, status: "live" }).select("*").single();
      if (insertError) throw insertError;
      await supabase.from("space_coin_ticks").insert({ coin_id: data.id, price: data.current_price, open: data.current_price, high: data.current_price, low: data.current_price, close: data.current_price });
      onCreated?.(data);
      setStep(5);
    } catch (err) {
      setError(err?.message || "Unable to launch coin.");
    } finally { setSaving(false); }
  };

  return (
    <Shell>
      <style>{styles + createStyles}</style>

      <div className="rx-space-scroll" {...edge}>
        <div className="rx-space-inner">
          <header className="rx-space-header">
            <button
              className="rx-icon-btn rx-left"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft size={23} />
            </button>
            <h1>Create Your Space Coin</h1>
          </header>

          <section className="rx-create-stage" aria-hidden="true">
            <div className="rx-create-glow" />

            <video
              className="rx-cloud-video"
              src={REAL_CLOUD_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />

            <img
              src={platformArtwork}
              className="rx-platform"
              alt=""
              draggable="false"
            />

            <img
              src={coinArtwork}
              className="rx-side-coin rx-side-left"
              alt=""
              draggable="false"
            />

            <img
              src={coinArtwork}
              className="rx-side-coin rx-side-right"
              alt=""
              draggable="false"
            />

            <img
              src={orbitArtwork}
              className="rx-side-art"
              alt=""
              draggable="false"
            />

            <video
              className="rx-flame-video"
              src={REAL_FLAME_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />

            <div className="rx-rocket-crop">
              <img src={rocketArtwork} alt="" draggable="false" />
            </div>
          </section>

          <div className="rx-step">Step {Math.min(step, 4)} of 4</div>

          <div className="rx-progress">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={step >= n ? "on" : ""} />
            ))}
          </div>

          {step === 1 && (
            <>
              <label className="rx-upload" onClick={(event) => {
                if (event.target !== logoInputRef.current) {
                  event.preventDefault();
                  logoInputRef.current?.click();
                }
              }}>
                <input
                  ref={logoInputRef}
                  onClick={(event) => event.stopPropagation()}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setError("Image must be 5MB or smaller.");
                      e.target.value = "";
                      return;
                    }
                    setError("");
                    setLogo(file);
                  }}
                />

                <span className="rx-upload-circle">
                  {logo ? (
                    <img src={logoUrl} alt="" />
                  ) : (
                    <Plus size={30} />
                  )}
                </span>

                <strong>Upload Coin Logo</strong>
                <small>PNG or JPG · Max 5MB</small>
              </label>

              <div className="rx-fields">
                <Field
                  label="Coin Name"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  placeholder="Enter coin name"
                />

                <Field
                  label="Symbol"
                  value={form.symbol}
                  onChange={(v) => set("symbol", v)}
                  placeholder="e.g. RXDOG"
                />

                <Field
                  label="Description"
                  value={form.description}
                  onChange={(v) => set("description", v)}
                  placeholder="Tell the world about your coin"
                />

                <div className="rx-two-fields">
                  <Field
                    label="Total Supply"
                    value={form.supply}
                    onChange={(v) => set("supply", v)}
                    placeholder="1,000,000,000"
                  />

                  <label className="rx-create-field">
                    <span>Network</span>

                    <div className="rx-network-select">
                      <button
                        type="button"
                        className={`rx-network-trigger ${networkOpen ? "open" : ""}`}
                        onClick={() => setNetworkOpen((open) => !open)}
                        aria-expanded={networkOpen}
                      >
                        <span>{form.network}</span>
                        <ChevronDown
                          className={`rx-chevron ${networkOpen ? "rotated" : ""}`}
                          size={18}
                        />
                      </button>
                      <div className={`rx-network-menu ${networkOpen ? "open" : ""}`}>
                        {["Solana", "Ethereum", "Base"].map((network) => (
                          <button
                            type="button"
                            key={network}
                            className={form.network === network ? "selected" : ""}
                            onClick={() => {
                              set("network", network);
                              setNetworkOpen(false);
                            }}
                          >
                            {network}
                          </button>
                        ))}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {step > 1 && (
            <div className="rx-review">
              <div>
                <span>Coin</span>
                <strong>{form.name || "Your Space Coin"}</strong>
              </div>

              <div>
                <span>Symbol</span>
                <strong>{form.symbol || "—"}</strong>
              </div>

              <div>
                <span>Description</span>
                <strong>{form.description || "—"}</strong>
              </div>

              <div>
                <span>Total Supply</span>
                <strong>{form.supply}</strong>
              </div>

              <div>
                <span>Network</span>
                <strong>{form.network}</strong>
              </div>
            </div>
          )}

          <div className="rx-create-actions">
            {step > 1 && (
              <button
                className="secondary"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                className="primary"
                disabled={step === 1 && !valid}
                onClick={() => setStep((s) => s + 1)}
              >
                <ArrowRight className="rx-action-arrow" size={16} />
                <span>Next Step</span>
              </button>
            ) : (
              <button className="primary" disabled={saving} onClick={launchCoin}>
                {saving ? "Launching…" : "Launch Coin"} <Rocket size={16} />
              </button>
            )}
          </div>

          {error && <div style={{ color: "#C0392B", background: "#FFF1F1", border: "1px solid #F3CCCC", borderRadius: 10, padding: "10px 12px", fontSize: 11, marginBottom: 12 }}>{error}</div>}

          {step === 5 && (
            <div className="rx-launched">
              <Check size={30} />
              <h2>Your Space Coin is launched!</h2>
              <p>The launch flow is complete.</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function WalletSheet({ onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef(null);
  const dragYRef = useRef(0);
  const wallets = [
    ["MetaMask", metamaskLogo],
    ["Trust Wallet", trustWalletLogo],
    ["Phantom", phantomLogo],
    ["Coinbase Wallet", SiCoinbase],
    ["WalletConnect", SiWalletconnect],
  ];

  const collapsedOffset = Math.max(0, window.innerHeight - Math.min(window.innerHeight * 0.8, 640));
  const baseOffset = expanded ? 0 : collapsedOffset;

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointerStart.current = e.clientY;
    dragYRef.current = 0;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (pointerStart.current == null) return;
    if (e.cancelable) e.preventDefault();
    const nextDragY = e.clientY - pointerStart.current;
    dragYRef.current = Math.max(-baseOffset, Math.min(window.innerHeight * 0.9, nextDragY));
    setDragging(true);
  };

  const onPointerEnd = (e) => {
    if (pointerStart.current == null) return;
    const dragDistance = dragYRef.current;
    if (dragDistance < -56) setExpanded(true);
    else if (dragDistance > 56) {
      if (expanded) setExpanded(false);
      else onClose();
    }
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    pointerStart.current = null;
    dragYRef.current = 0;
    setDragging(false);
  };

  const dragOffset = dragging
    ? Math.max(-baseOffset, Math.min(window.innerHeight * 0.9, dragYRef.current))
    : 0;

  return (
    <div className="rx-overlay" onClick={onClose}>
      <div
        className={"rx-sheet rx-wallet-sheet " + (entered ? " entered" : "") + (expanded ? " expanded" : "") + (dragging ? " dragging" : "")}
        style={dragging ? { transform: "translate3d(0," + (baseOffset + dragOffset) + "px,0)" } : undefined}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <button
          type="button"
          className="rx-sheet-handle"
          onClick={() => setExpanded((open) => !open)}
          aria-label={expanded ? "Collapse wallet sheet" : "Expand wallet sheet"}
        />

        <div className="rx-sheet-head">
          <h3>Connect Wallet</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {wallets.map(([wallet, Icon]) => (
          <div className="rx-wallet-row" key={wallet}>
            <span>{typeof Icon === "string" ? <img src={Icon} alt="" /> : <Icon />}</span>
            <strong>{wallet}</strong>
            <button onClick={onClose}>Connect</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyCoinsSheet({ onClose, coins = [] }) {
  const rows = coins.map((coin) => [coin.name, coin.symbol, `${Number(coin.current_price || 0).toFixed(6)}`, `${Number(coin.price_change_24h || 0) >= 0 ? "+" : ""}${Number(coin.price_change_24h || 0).toFixed(2)}%`, `${Number(coin.market_cap || 0).toLocaleString()}`, Number(coin.holder_count || 0).toLocaleString()]);

  return (
    <div className="rx-overlay" onClick={onClose}>
      <div
        className="rx-sheet rx-sheet-tall"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rx-sheet-handle" />

        <div className="rx-sheet-head">
          <h3>My Space Coins</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {rows.map((row) => (
          <div className="rx-mycoin" key={row[1]}>
            <img src={coinArtwork} alt="" />

            <div>
              <strong>{row[0]}</strong>
              <small>{row[1]}</small>
              <span>{row[4]} · {row[5]} holders</span>
            </div>

            <div className="rx-mycoin-price">
              <strong>{row[2]}</strong>
              <small className={row[3].startsWith("-") ? "red" : ""}>
                {row[3]}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function useHorizontalSwipe(onLeft, onRight, onProgress) {
  const startX = useRef(null);
  const startY = useRef(null);
  const axis = useRef(null);
  const captured = useRef(false);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX; startY.current = e.clientY; axis.current = null;
    captured.current = false;
  };
  const onPointerMove = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current; const dy = e.clientY - startY.current;
    if (!axis.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (axis.current === "x") {
      if (!captured.current) {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        captured.current = true;
      }
      if (e.cancelable) e.preventDefault();
      onProgress?.(dx);
    }
  };
  const finish = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current; const dy = e.clientY - startY.current;
    if (axis.current === "x" && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.15) { if (dx < 0) onLeft?.(); else onRight?.(); } else onProgress?.(0);
    if (captured.current) e.currentTarget.releasePointerCapture?.(e.pointerId);
    captured.current = false; startX.current = null; startY.current = null; axis.current = null;
  };
  return { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish };
}
function NativeHeader({ title, onBack, right, minimal = false }) {
  return (
    <header className={"rx-native-header" + (minimal ? " rx-native-header-minimal" : "")}>
      <button className="rx-native-back" onClick={onBack} aria-label="Back"><ArrowLeft size={22} /></button>
      {!minimal && <h1>{title}</h1>}
      {!minimal && (right || <span className="rx-native-header-space" />)}
    </header>
  );
}

const menuItems = [
  [Contact, "Contact Support"],
  [Bell, "Notifications"],
  [Settings, "Token Settings"],
  [BarChart3, "Analytics"],
  [CircleDollarSign, "Holdings"],
  [ReceiptText, "Transactions"],
  [Share2, "Share Token"],
];

function MenuScreen({ onBack, onDashboard, onSelect }) {
  const groups = [menuItems.slice(0, 2), menuItems.slice(2, 5), menuItems.slice(5)];
  const swipe = useHorizontalSwipe(undefined, onBack);
  return (
    <div className="rx-native-screen rx-menu-screen" {...swipe}>
      <style>{styles}</style>
      <div className="rx-menu-topbar"><button className="rx-native-back" onClick={onBack} aria-label="Back"><ArrowLeft size={24} /></button></div>
      <div className="rx-menu-content">
        <div className="rx-menu-feature-grid">
          <button className="rx-menu-feature" onClick={onDashboard}><span className="rx-menu-feature-icon"><Home size={25} /></span><strong>Dashboard</strong></button>
          <button className="rx-menu-feature" onClick={onDashboard}><span className="rx-menu-feature-icon"><BriefcaseBusiness size={25} /></span><strong>Funds</strong></button>
        </div>
        <div className="rx-menu-groups">
          {groups.map((group, groupIndex) => <section className="rx-menu-group" key={groupIndex}><h2 className="rx-menu-section-label">{["Support", "Token", "Activity"][groupIndex]}</h2><div className="rx-menu-list">{group.map(([Icon, label]) => <button key={label} onClick={() => onSelect(label)}><span className="rx-menu-list-icon"><Icon size={22} strokeWidth={2.2} /></span><span>{label}</span><ChevronRight size={21} /></button>)}</div></section>)}
        </div>
      </div>
    </div>
  );
}

function NativeTabScreen({ title, onBack, children, right }) {
  const swipe = useHorizontalSwipe(undefined, onBack);
  return <div className="rx-native-screen rx-tab-screen" {...swipe}><style>{styles}</style><NativeHeader title={title} onBack={onBack} right={right} /><div className="rx-native-scroll">{children}</div><NativeTabs active="Space Coins" /></div>;
}

function TokenSettingsScreen({ onBack }) {
  const rows = [["Token Information", "Edit name, symbol, description"], ["Fee Settings", "Manage trading fees and creator fees", "2%"], ["Max Transaction", "Set max buy/sell limit", "No Limit"], ["Max Wallet", "Set max tokens per wallet", "No Limit"], ["Trading Settings", "Enable / Disable trading"], ["Whitelist", "Manage whitelisted addresses", "12"], ["Blacklist", "Manage blacklisted addresses", "0"], ["Token Visibility", "Show or hide your token"], ["Burn Tokens", "Burn a portion of supply"]];
  return <NativeTabScreen title="Token Settings" onBack={onBack}><div className="rx-token-summary"><img src={galaxyDogeToken} alt="" /><div><strong>STAR DOGE</strong><small>SDOGE</small></div><span className="rx-live-pill">Live</span></div><div className="rx-settings-list">{rows.map(([name, detail, value], index) => <div className="rx-settings-row" key={name}><span className="rx-settings-icon">{["ⓘ", "⚙", "◷", "▣", "◉", "ⓘ", "ⓧ", "◉", "♨"][index]}</span><div><strong>{name}</strong><small>{detail}</small></div>{value ? <em>{value}</em> : index === 4 || index === 7 ? <span className="rx-switch on" /> : <ChevronRight size={17} />}</div>)}</div></NativeTabScreen>;
}

function HoldersScreen({ onBack }) {
  const holders = [["7xK...9a3b", "8.45%", "84,500,000"], ["GdL...8kL2", "6.21%", "62,100,000"], ["Fh3...9mN7", "4.32%", "43,200,000"], ["9dA...3jK1", "3.85%", "38,500,000"], ["HkL...2pQ8", "2.98%", "29,800,000"], ["Js9...7aD4", "2.41%", "24,100,000"], ["2kM...8xP6", "1.89%", "18,900,000"], ["9nB...1dQ2", "1.52%", "15,200,000"], ["Kd3...9pZ1", "1.33%", "13,300,000"], ["8sL...6mT5", "1.29%", "12,900,000"]];
  return <NativeTabScreen title="Holders" onBack={onBack} right={<CircleHelp size={18} />}><div className="rx-holders-number"><span className="rx-creator-number">5</span><strong>Holders</strong></div><div className="rx-stat-grid"><span><small>Total Holders</small><b>2,845</b></span><span><small>Top 10 Holders</small><b>32.45%</b></span><span><small>Total Supply</small><b>1B SDOGE</b></span></div><div className="rx-tab-switch"><b>Top Holders</b><span>All Holders</span></div><div className="rx-holder-list">{holders.map(([address, share, amount], i) => <div key={address}><i>{i + 1}</i><strong>{address}</strong><span>{share}</span><b>{amount}</b></div>)}</div></NativeTabScreen>;
}

function AnalyticsScreen({ onBack }) {
  return <NativeTabScreen title="Analytics" onBack={onBack}><div className="rx-holders-number"><span className="rx-creator-number">6</span><strong>Analytics</strong></div><div className="rx-periods"><b>24H</b><span>7D</span><span>30D</span><span>90D</span><span>ALL</span></div><h3 className="rx-tab-heading">Performance</h3><div className="rx-analytics-metrics"><span><small>Price</small><b>$0.00241</b><em>+18.27%</em></span><span><small>Market Cap</small><b>$2.41M</b><em>+18.27%</em></span><span><small>Volume</small><b>$254.8K</b><em>+24.18%</em></span></div><div className="rx-chart-card"><svg viewBox="0 0 360 130" preserveAspectRatio="none"><path d="M0 105 L18 96 L28 108 L45 75 L58 91 L76 68 L93 83 L111 55 L129 70 L145 42 L162 58 L180 49 L198 62 L215 40 L232 47 L250 25 L267 35 L284 15 L301 29 L318 8 L336 22 L360 5" /></svg><div><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div><h3 className="rx-tab-heading">Volume</h3><div className="rx-volume-bars">{Array.from({ length: 34 }, (_, i) => <i key={i} style={{ height: `${22 + ((i * 17) % 58)}px` }} />)}</div></NativeTabScreen>;
}

function TransactionsScreen({ onBack }) {
  const rows = [["Buy", "7xK...9a3b bought 50,000 SDOGE", "+50,000 SDOGE", "$120.50", "2m ago"], ["Sell", "GdL...8kL2", "-20,000 SDOGE", "$48.20", "6m ago"], ["Buy", "Fh3...9mN7", "+100,000 SDOGE", "$241.00", "12m ago"], ["Add Liquidity", "10,000,000 SDOGE", "+10,000,000 SDOGE", "+2,450 USDT", "30m ago"], ["Sell", "9dA...3jK1", "-75,000 SDOGE", "$180.75", "1h ago"], ["Buy", "HkL...2pQ8", "+25,000 SDOGE", "$60.25", "1h ago"]];
  return <NativeTabScreen title="Transactions" onBack={onBack} right={<span className="rx-filter">⌯</span>}><div className="rx-holders-number"><span className="rx-creator-number">7</span><strong>Transactions</strong></div><div className="rx-transaction-tabs"><b>All</b><span>Buys</span><span>Sells</span><span>Liquidity</span></div><div className="rx-transaction-list">{rows.map(([type, detail, amount, total, time]) => <div key={`${type}-${time}`}><i className={type === "Sell" ? "sell" : type === "Add Liquidity" ? "liq" : "buy"}>{type === "Add Liquidity" ? "+" : type === "Sell" ? "↗" : "↙"}</i><div><strong>{type}</strong><small>{detail}</small></div><em className={type === "Sell" ? "red" : ""}>{amount}<small>{total}</small></em><time>{time}</time></div>)}</div></NativeTabScreen>;
}

function NotificationsScreen({ onBack }) {
  const rows = [["New Buy", "7xK...9a3b bought 50,000 SDOGE", "2m ago"], ["Price Alert", "SDOGE is up 15% in the last 24h", "30m ago"], ["New Holder", "Js8...7aD4 is now holding SDOGE", "1h ago"], ["Liquidity Added", "10,000,000 SDOGE added to liquidity", "2h ago"]];
  return <NativeTabScreen title="Notifications" onBack={onBack} right={<span className="rx-more">•••</span>}><div className="rx-notification-list">{rows.map(([title, detail, time], i) => <div key={title}><i className={`notice-${i}`}>{["◉", "♧", "♙", "ⓘ"][i]}</i><div><strong>{title}</strong><small>{detail}</small></div><time>{time}</time></div>)}</div><button className="rx-view-all">View All</button></NativeTabScreen>;
}

function Metric({ label, value }) { return <div className="rx-creator-metric"><small>{label}</small><strong>{value}</strong></div>; }

function NativeTabs({ active }) { return <nav className="rx-native-tabs">{["Home", "Space Coins", "Wallet", "Profile"].map((name) => <span className={active === name ? "active" : ""} key={name}><span className="rx-tab-dot" />{name}</span>)}</nav>; }

function CoinPriceChart({ coin, range, tradeMarkers, onPriceChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const markersRef = useRef([]);

  const RANGE_MS = useMemo(() => ({
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
    "3m": 90 * 24 * 60 * 60 * 1000,
  }), []);

  const load = useCallback(async () => {
    if (!coin?.id || !seriesRef.current) return;
    const since = new Date(Date.now() - RANGE_MS[range]).toISOString();
    const [{ data: ticks }, { data: trades }] = await Promise.all([
      supabase.from("space_coin_ticks").select("price,close,created_at").eq("coin_id", coin.id).gte("created_at", since).order("created_at", { ascending: true }).limit(1000),
      supabase.from("space_coin_trades").select("side,price,created_at").eq("coin_id", coin.id).gte("created_at", since).order("created_at", { ascending: true }).limit(500),
    ]);

    const points = (ticks || [])
      .map((row) => ({ time: Math.floor(new Date(row.created_at).getTime() / 1000), value: Number(row.close ?? row.price) }))
      .filter((row) => row.time > 0 && Number.isFinite(row.value) && row.value > 0);

    const tradePoints = (trades || [])
      .map((row) => ({ time: Math.floor(new Date(row.created_at).getTime() / 1000), value: Number(row.price) }))
      .filter((row) => row.time > 0 && Number.isFinite(row.value) && row.value > 0);

    const all = [...points, ...tradePoints].sort((a, b) => a.time - b.time);
    const deduped = [];
    const seen = new Set();
    all.forEach((point) => {
      if (seen.has(point.time)) {
        deduped[deduped.length - 1] = point;
      } else {
        seen.add(point.time);
        deduped.push(point);
      }
    });

    const fallbackTime = Math.floor(new Date(coin.created_at || Date.now()).getTime() / 1000);
    const data = deduped.length ? deduped : [{ time: fallbackTime, value: Number(coin.current_price || coin.initial_price || 0.000001) }];
    try {
      seriesRef.current.setData(data);
      const localMarkers = tradeMarkers.filter((marker) => marker.time >= Math.floor(new Date(since).getTime() / 1000));
      markersRef.current = localMarkers;
      if (seriesRef.current.setMarkers) seriesRef.current.setMarkers(localMarkers);
      chartRef.current?.timeScale().fitContent();
      onPriceChange?.(data[data.length - 1]?.value || Number(coin.current_price || 0.000001), data);
    } catch (error) {
      console.warn("[SpaceCoins] chart update failed", error);
    }
  }, [coin, range, RANGE_MS, tradeMarkers, onPriceChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const chart = createChart(el, {
      attributionLogo: false,
      width: el.clientWidth || 340,
      height: el.clientHeight || 280,
      layout: {
        background: { color: "#FFFFFF" },
        textColor: "#8B8F94",
        fontFamily: "-apple-system,BlinkMacSystemFont,\"SF Pro Display\",\"SF Pro Text\",Arial,sans-serif",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(17,20,24,.045)", style: LineStyle.Dashed },
        horzLines: { color: "rgba(17,20,24,.045)", style: LineStyle.Dashed },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#D7A21A", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#D7A21A" },
        horzLine: { color: "#D7A21A", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#D7A21A" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      leftPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
        barSpacing: 9,
        minBarSpacing: 3,
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: { time: true, price: false } },
    });
    const area = chart.addAreaSeries({
      lineColor: "#5D80D7",
      topColor: "rgba(117,147,223,.34)",
      bottomColor: "rgba(117,147,223,.06)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    chartRef.current = chart;
    seriesRef.current = area;

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || el.clientWidth || 340;
      const height = entries[0]?.contentRect?.height || 280;
      chart.resize(width, height);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!coin?.id) return undefined;
    const channel = supabase.channel("space-coin-chart-" + coin.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "space_coin_ticks", filter: "coin_id=eq." + coin.id }, (payload) => {
        const value = Number(payload.new?.close ?? payload.new?.price);
        const time = Math.floor(new Date(payload.new?.created_at || Date.now()).getTime() / 1000);
        if (!Number.isFinite(value) || value <= 0 || !time || !seriesRef.current) return;
        const since = Math.floor((Date.now() - RANGE_MS[range]) / 1000);
        if (time < since) return;
        try {
          seriesRef.current.update({ time, value });
          onPriceChange?.(value);
        } catch {}
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coin?.id, range, RANGE_MS, onPriceChange]);

  return <div ref={containerRef} className="rx-real-chart" aria-label="Live Space Coin price chart" />;
}

function CreatorDashboard({ onBack, onManage, coin }) {
  const market = coin || null;
  const [range, setRange] = useState("24h");
  const [activeTab, setActiveTab] = useState("Overview");
  const [livePrice, setLivePrice] = useState(Number(market?.current_price || market?.initial_price || 0.000001));
  const [chartData, setChartData] = useState([]);
  const [tradeMarkers, setTradeMarkers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [account, setAccount] = useState(null);
  const [tradeSheet, setTradeSheet] = useState(null);
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingTrade, setLoadingTrade] = useState(false);

  useEffect(() => {
    if (!market?.id) return;
    let active = true;
    const loadTrades = async () => {
      const { data } = await supabase.from("space_coin_trades").select("id,side,quantity,price,notional,created_at").eq("coin_id", market.id).order("created_at", { ascending: false }).limit(50);
      if (active) {
        setTrades(data || []);
        setTradeMarkers((data || []).map((row) => ({
          time: Math.floor(new Date(row.created_at).getTime() / 1000),
          position: row.side === "buy" ? "belowBar" : "aboveBar",
          color: row.side === "buy" ? "#D7A21A" : "#111418",
          shape: row.side === "buy" ? "arrowUp" : "arrowDown",
          text: row.side === "buy" ? "Buy" : "Sell",
        })).reverse());
      }
    };
    loadTrades();
    return () => { active = false; };
  }, [market?.id]);

  useEffect(() => {
    let active = true;
    const loadAccount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !market?.id || !active) return;
      const accountKey = "demo:" + user.id;
      const { data } = await supabase.from("space_coin_accounts").upsert({ user_id: user.id, account_key: accountKey, mode: "demo" }, { onConflict: "account_key" }).select("*").single();
      if (active && data) setAccount(data);
    };
    loadAccount();
    return () => { active = false; };
  }, [market?.id]);

  const handlePriceChange = useCallback((price, data = null) => {
    setLivePrice(Number(price) || 0.000001);
    if (data) setChartData(data);
  }, []);

  const fmt = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "0";
    return n < 0.001 ? n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "") : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  const pct = Number(market?.price_change_24h || 0);
  const initial = Number(market?.initial_price || market?.current_price || livePrice || 0.000001);
  const computedChange = initial ? ((livePrice - initial) / initial) * 100 : 0;
  const displayChange = Number.isFinite(pct) && pct !== 0 ? pct : computedChange;
  const high = chartData.length ? Math.max(...chartData.map((p) => p.value)) : livePrice;
  const low = chartData.length ? Math.min(...chartData.map((p) => p.value)) : livePrice;

  const executeTrade = async () => {
    const input = Number(amount);
    if (!market?.id || !tradeSheet || !input || input <= 0 || loadingTrade) return setNotice("Enter a valid amount.");
    setLoadingTrade(true); setNotice("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Sign in to trade.");
      const accountKey = "demo:" + user.id;
      const { data: acct, error: accountError } = await supabase.from("space_coin_accounts").upsert({ user_id: user.id, account_key: accountKey, mode: "demo" }, { onConflict: "account_key" }).select("*").single();
      if (accountError) throw accountError;
      const price = Number(livePrice || market.current_price || market.initial_price || 0.000001);
      const quantity = tradeSheet === "buy" ? input / price : input;
      const balances = { ...(acct.token_balances || {}) };
      const held = Number(balances[market.id] || 0);
      const notional = tradeSheet === "buy" ? input : quantity * price;
      const cash = Number(acct.cash_balance || 0);
      if (tradeSheet === "buy" && cash < notional) throw new Error("Insufficient demo account balance.");
      if (tradeSheet === "sell" && held < quantity) throw new Error("Not enough tokens to sell.");
      balances[market.id] = tradeSheet === "buy" ? held + quantity : held - quantity;
      const nextCash = tradeSheet === "buy" ? cash - notional : cash + notional;
      const { error: updateError } = await supabase.from("space_coin_accounts").update({ cash_balance: nextCash, token_balances: balances, updated_at: new Date().toISOString() }).eq("id", acct.id);
      if (updateError) throw updateError;
      const { data: trade, error: tradeError } = await supabase.from("space_coin_trades").insert({ account_id: acct.id, user_id: user.id, coin_id: market.id, mode: "demo", side: tradeSheet, quantity, price, notional }).select("*").single();
      if (tradeError) throw tradeError;
      const movement = tradeSheet === "buy" ? 1.002 : 0.998;
      const nextPrice = Number((price * movement).toPrecision(12));
      const { error: tickError } = await supabase.from("space_coin_ticks").insert({ coin_id: market.id, price: nextPrice, open: price, high: Math.max(price, nextPrice), low: Math.min(price, nextPrice), close: nextPrice });
      if (tickError) throw tickError;
      const change24 = initial ? ((nextPrice - initial) / initial) * 100 : 0;
      await supabase.from("space_coins").update({ current_price: nextPrice, price_change_24h: change24, volume_24h: Number(market.volume_24h || 0) + notional, updated_at: new Date().toISOString() }).eq("id", market.id);
      setAccount({ ...acct, cash_balance: nextCash, token_balances: balances });
      setLivePrice(nextPrice);
      setTrades((old) => [trade, ...old].slice(0, 50));
      setTradeMarkers((old) => [...old, { time: Math.floor(new Date(trade.created_at).getTime() / 1000), position: tradeSheet === "buy" ? "belowBar" : "aboveBar", color: tradeSheet === "buy" ? "#D7A21A" : "#111418", shape: tradeSheet === "buy" ? "arrowUp" : "arrowDown", text: tradeSheet === "buy" ? "Buy" : "Sell" }]);
      setNotice(`${tradeSheet === "buy" ? "Bought" : "Sold"} ${fmt(quantity)} ${market.symbol} at $${fmt(price)}`);
      setAmount(""); setTradeSheet(null);
    } catch (error) {
      setNotice(error?.message || "Trade failed.");
    } finally { setLoadingTrade(false); }
  };

  if (!market) {
    return <main className="rx-native-screen"><style>{styles + createStyles + detailStyles}</style><NativeHeader title="Space Coin" onBack={onBack} /><div className="rx-native-scroll"><div className="rx-empty-coins"><strong>No Space Coins yet</strong><span>Create your first Space Coin and it will appear here.</span></div></div></main>;
  }

  return <main className="rx-native-screen rx-coin-detail-screen" onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop}>
    <style>{styles + createStyles + detailStyles}</style>
    <header className="rx-detail-top">
      <button className="rx-detail-back" onClick={onBack} aria-label="Back"><ArrowLeft size={23} /></button>
      <div className="rx-detail-wallet"><span className="rx-detail-lock">◉</span><strong>${Number(account?.cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
      <div className="rx-detail-status">◉</div>
      <button className="rx-detail-down" aria-label="Account menu"><ChevronDown size={21} /></button>
    </header>

    <div className="rx-detail-scroll">
      <div className="rx-detail-tabs">
        {["Overview", "Statistics", "History data"].map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>

      <section className="rx-detail-hero-card">
        <div className="rx-detail-coin-name">{market.name}</div>
        <div className="rx-detail-price">${fmt(livePrice)}</div>
        <div className={`rx-detail-change ${displayChange >= 0 ? "up" : "down"}`}>{displayChange >= 0 ? "●" : "●"} {displayChange >= 0 ? "+" : ""}{displayChange.toFixed(2)}%</div>
      </section>

      {activeTab === "Overview" && <>
        <section className="rx-detail-chart-wrap">
          <CoinPriceChart coin={market} range={range} tradeMarkers={tradeMarkers} onPriceChange={handlePriceChange} />
        </section>
        <div className="rx-detail-range">
          {[['24h','24 Hours'],['7d','7 Days'],['1m','1 Month'],['3m','3 Months']].map(([key,label]) => <button key={key} className={range === key ? "active" : ""} onClick={() => setRange(key)}>{label}</button>)}
        </div>
        <section className="rx-detail-summary">
          <div><span>Market Cap</span><strong>${Number(market.market_cap || Number(market.total_supply || 0) * livePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
          <div><span>24h Volume</span><strong>${Number(market.volume_24h || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
          <div><span>24h High</span><strong>${fmt(high)}</strong></div>
          <div><span>24h Low</span><strong>${fmt(low)}</strong></div>
        </section>
      </>}

      {activeTab === "Statistics" && <section className="rx-detail-stat-card">
        <div><span>Market Cap</span><strong>${Number(market.market_cap || Number(market.total_supply || 0) * livePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
        <div><span>Liquidity</span><strong>${Number(market.liquidity || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
        <div><span>24h Volume</span><strong>${Number(market.volume_24h || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
        <div><span>Holders</span><strong>{Number(market.holder_count || 0).toLocaleString()}</strong></div>
        <div><span>Total Supply</span><strong>{Number(market.total_supply || 0).toLocaleString()}</strong></div>
        <div><span>Network</span><strong>{market.network || "Solana"}</strong></div>
      </section>}

      {activeTab === "History data" && <section className="rx-detail-history-card">
        {trades.length ? trades.map((trade) => <div key={trade.id} className="rx-detail-history-row"><span className={trade.side === "buy" ? "buy" : "sell"}>{trade.side === "buy" ? "Buy" : "Sell"}</span><div><strong>{fmt(trade.quantity)} {market.symbol}</strong><small>{new Date(trade.created_at).toLocaleString()}</small></div><b>${fmt(trade.price)}</b></div>) : <div className="rx-detail-empty-history">No trades yet. Your real trades will appear here.</div>}
      </section>}

      {notice && <div className="rx-detail-notice">{notice}</div>}
    </div>

    <div className="rx-detail-actions">
      <button className="rx-detail-buy" onClick={() => { setTradeSheet("buy"); setNotice(""); }}><span>Buy</span></button>
      <button className="rx-detail-sell" onClick={() => { setTradeSheet("sell"); setNotice(""); }}><span>Sell</span></button>
      <button className="rx-detail-bell" aria-label="Price alerts"><Bell size={23} /></button>
    </div>

    {tradeSheet && <div className="rx-trade-sheet-backdrop" onClick={() => setTradeSheet(null)}>
      <section className="rx-trade-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="rx-trade-sheet-handle" />
        <h3>{tradeSheet === "buy" ? "Buy" : "Sell"} {market.symbol}</h3>
        <p>Current price ${fmt(livePrice)}</p>
        <label>{tradeSheet === "buy" ? "Amount in USD" : "Token quantity"}<input autoFocus type="number" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
        <button className={tradeSheet === "buy" ? "confirm-buy" : "confirm-sell"} onClick={executeTrade}>{loadingTrade ? "Processing…" : `${tradeSheet === "buy" ? "Buy" : "Sell"} ${market.symbol}`}</button>
        {notice && <div className="rx-detail-notice">{notice}</div>}
      </section>
    </div>}
  </main>;
}

const detailStyles = `
.rx-coin-detail-screen{background:#fff!important;color:#111418}
.rx-detail-top{height:72px;flex:0 0 72px;padding:calc(8px + env(safe-area-inset-top)) 15px 0;display:grid;grid-template-columns:42px 1fr auto 36px;align-items:center;gap:8px}
.rx-detail-back,.rx-detail-down{border:0;background:transparent;color:#111418;display:grid;place-items:center;padding:0;width:40px;height:40px}
.rx-detail-wallet{display:flex;align-items:center;gap:8px;font-size:14px;min-width:0}.rx-detail-wallet strong{font-size:15px}.rx-detail-lock{font-size:13px}.rx-detail-status{width:38px;height:38px;border-radius:50%;background:#eff9df;color:#78b735;display:grid;place-items:center;font-size:16px}
.rx-detail-scroll{flex:1;min-height:0;overflow:auto;padding:8px 16px calc(102px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.rx-detail-tabs{display:grid;grid-template-columns:1fr 1fr 1.18fr;gap:8px;margin:0 0 24px}.rx-detail-tabs button{height:43px;border:0;border-radius:22px;background:#f1f4fb;color:#555b63;font:700 12px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-detail-tabs button.active{background:#111418;color:#fff}
.rx-detail-hero-card{text-align:center;padding:0 0 13px}.rx-detail-coin-name{font-size:17px;font-weight:700;margin-bottom:8px}.rx-detail-price{font-size:37px;line-height:1;font-weight:500;letter-spacing:-1.5px}.rx-detail-change{margin-top:12px;font-size:13px;font-weight:700}.rx-detail-change.up{color:#36b58a}.rx-detail-change.down{color:#d94c4c}
.rx-detail-chart-wrap{height:300px;margin:0 -4px}.rx-real-chart{width:100%;height:100%}.rx-detail-range{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0 18px}.rx-detail-range button{height:39px;border:1px solid #e5e7eb;border-radius:20px;background:#fff;color:#8a8f96;font:700 10px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-detail-range button.active{border-color:#111418;color:#111418;box-shadow:inset 0 0 0 1px #111418}
.rx-detail-summary,.rx-detail-stat-card,.rx-detail-history-card{border-radius:20px;background:#fff;border:1px solid #edf0f2;box-shadow:0 6px 24px rgba(17,20,24,.04)}.rx-detail-summary{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#edf0f2;overflow:hidden}.rx-detail-summary>div{background:#fff;padding:15px}.rx-detail-summary span,.rx-detail-stat-card span{display:block;color:#8b9096;font-size:10px}.rx-detail-summary strong,.rx-detail-stat-card strong{display:block;margin-top:6px;font-size:14px}
.rx-detail-stat-card{display:grid;grid-template-columns:1fr 1fr;gap:0;overflow:hidden}.rx-detail-stat-card>div{padding:18px 15px;border-bottom:1px solid #edf0f2}.rx-detail-stat-card>div:nth-child(odd){border-right:1px solid #edf0f2}
.rx-detail-history-card{overflow:hidden}.rx-detail-history-row{min-height:67px;display:grid;grid-template-columns:45px 1fr auto;gap:10px;align-items:center;padding:10px 13px;border-bottom:1px solid #edf0f2}.rx-detail-history-row:last-child{border-bottom:0}.rx-detail-history-row>span{font-size:10px;font-weight:800}.rx-detail-history-row>span.buy{color:#d7a21a}.rx-detail-history-row>span.sell{color:#111418}.rx-detail-history-row strong,.rx-detail-history-row small{display:block}.rx-detail-history-row strong{font-size:11px}.rx-detail-history-row small{margin-top:4px;color:#8a8f95;font-size:8px}.rx-detail-history-row>b{font-size:10px}.rx-detail-empty-history{padding:25px 16px;color:#8a8f95;font-size:11px;text-align:center}
.rx-detail-actions{position:absolute;z-index:10;left:0;right:0;bottom:0;height:88px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1fr 58px;gap:10px;background:rgba(255,255,255,.96);border-top:1px solid #edf0f2;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.rx-detail-actions button{border:0;border-radius:17px;font:800 15px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-detail-buy{background:#F4D35E;color:#111418}.rx-detail-sell{background:#111418;color:#fff}.rx-detail-bell{background:#eef2fa;color:#111418;display:grid;place-items:center}
.rx-detail-notice{margin:12px 0;padding:11px 12px;border-radius:12px;background:#f6f7f8;color:#4e555c;font-size:10px;line-height:1.45}
.rx-trade-sheet-backdrop{position:absolute;z-index:30;inset:0;background:rgba(17,20,24,.36);display:flex;align-items:flex-end}.rx-trade-sheet{width:100%;padding:10px 18px calc(18px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#fff;box-shadow:0 -15px 45px rgba(17,20,24,.18)}.rx-trade-sheet-handle{width:42px;height:4px;border-radius:9px;background:#d8dadd;margin:0 auto 15px}.rx-trade-sheet h3{margin:0;font-size:19px}.rx-trade-sheet p{margin:5px 0 16px;color:#81868c;font-size:10px}.rx-trade-sheet label{display:block;color:#5e646a;font-size:10px;font-weight:700}.rx-trade-sheet input{width:100%;height:48px;margin-top:7px;border:1px solid #e0e3e6;border-radius:13px;padding:0 13px;outline:0;font:600 15px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-trade-sheet>button{width:100%;height:50px;margin-top:12px;border:0;border-radius:14px;font:800 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-trade-sheet .confirm-buy{background:#F4D35E;color:#111418}.rx-trade-sheet .confirm-sell{background:#111418;color:#fff}
.rx-empty-coins{min-height:55vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;color:#747a80}.rx-empty-coins strong{font-size:17px;color:#111418}.rx-empty-coins span{font-size:11px;max-width:250px;line-height:1.5}
@media(max-width:430px){.rx-detail-chart-wrap{height:275px}.rx-detail-price{font-size:35px}.rx-detail-tabs{margin-bottom:21px}.rx-detail-scroll{padding-left:13px;padding-right:13px}.rx-detail-actions{padding-left:13px;padding-right:13px}}
`;

function LiquidityScreen({ onBack, remove = false }) {
  const [activeRemove, setActiveRemove] = useState(remove);
  const [dragX, setDragX] = useState(0);
  const swipe = useHorizontalSwipe(() => { setActiveRemove(true); setDragX(0); }, () => { setActiveRemove(false); setDragX(0); }, (dx) => setDragX(Math.max(-window.innerWidth, Math.min(window.innerWidth, dx))));
  const trackStyle = { transform: "translate3d(calc(" + (activeRemove ? -50 : 0) + "% + " + dragX + "px),0,0)", transition: dragX === 0 ? "transform .28s cubic-bezier(.2,.8,.2,1)" : "none" };
  return <><style>{styles}</style><div className="rx-native-screen rx-liquidity-screen" {...swipe}><NativeHeader title="Manage Liquidity" onBack={onBack} right={<CircleHelp size={18} />} /><div className="rx-native-scroll"><div className="rx-liquidity-tabs"><button className={!activeRemove ? "active" : ""} onClick={() => { setActiveRemove(false); setDragX(0); }}>Add Liquidity</button><button className={activeRemove ? "active" : ""} onClick={() => { setActiveRemove(true); setDragX(0); }}>Remove Liquidity</button></div><div className="rx-liquidity-swipe"><div className="rx-liquidity-track" style={trackStyle}><div className="rx-liquidity-panel"><AddLiquidity /></div><div className="rx-liquidity-panel"><RemoveLiquidity /></div></div></div></div></div></>;
}
function AddLiquidity() { return <><div className="rx-liquidity-art"><strong>Your Liquidity Pool</strong><small>SDOGE / USDT</small><div className="rx-orbit-art"><Droplets size={58} /></div></div><div className="rx-pool-card"><h3>Pool Balance</h3><div><p><small>SDOGE</small><strong>102.45M</strong></p><p><small>USDT</small><strong>45,678.56</strong></p><p><small>LP Tokens</small><strong>8,945.32</strong></p><p><small>Pool Share</small><strong>24.58%</strong></p></div></div><div className="rx-form-card"><h3>Add Liquidity</h3><label>Amount of SDOGE <span>Balance: 12,460,000</span><input value="10,000,000" readOnly /></label><label>Amount of USDT <span>Balance: 3,210</span><input value="2,450" readOnly /></label><small>1 SDOGE = 0.000245 USDT</small><button className="rx-gold-cta">Add Liquidity</button></div></>; }
function RemoveLiquidity() { return <><div className="rx-warning"><ShieldCheck size={17} /><span>Removing liquidity will reduce your pool share and may affect price stability.</span></div><div className="rx-pool-card"><h3>Your Liquidity</h3><small>SDOGE / USDT</small><div><p><small>Pool Share</small><strong>24.58%</strong></p><p><small>LP Tokens</small><strong>8,945.32</strong></p></div></div><div className="rx-form-card"><h3>You Will Receive</h3><div className="rx-receive"><p><small>SDOGE</small><strong>10,000,000</strong><em>~$2,450.00</em></p><p><small>USDT</small><strong>2,450</strong><em>~$2,450.00</em></p></div><div className="rx-slider"><span /><b>50%</b></div><div className="rx-slider-labels"><span>25%</span><span>50%</span><span>75%</span><span>MAX</span></div><button className="rx-danger-cta">Remove Liquidity</button></div></>; }

const styles = `
.rx-space-shell,.rx-space-shell *{box-sizing:border-box}
.rx-space-shell{
  position:fixed;inset:0;z-index:700;width:100%;height:100dvh;
  overflow:hidden;background:#fff;color:#111418;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;overscroll-behavior:none;isolation:isolate
}
.rx-space-scroll{
  position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;
  -webkit-overflow-scrolling:touch;overscroll-behavior:none;
  touch-action:pan-y;scrollbar-width:none;
  padding:calc(10px + env(safe-area-inset-top)) 16px calc(30px + env(safe-area-inset-bottom))
}
.rx-space-scroll::-webkit-scrollbar{display:none}
.rx-space-inner{width:min(100%,480px);margin:0 auto}

.rx-space-header{
  height:52px;display:flex;align-items:center;justify-content:center;
  position:relative;margin-bottom:8px
}
.rx-space-header h1{margin:0;font-size:18px;font-weight:800;letter-spacing:-.4px}
.rx-header-spacer{width:40px;height:40px}
.rx-icon-btn{
  position:absolute;width:40px;height:40px;border:0;background:transparent;
  color:#111418;display:grid;place-items:center;padding:0
}
.rx-icon-btn.rx-left{left:0}
.rx-icon-btn.rx-right{right:0}

.rx-space-banner{
  position:relative;width:100%;max-width:none;height:auto;
  overflow:visible;border-radius:20px;margin:0 0 14px;background:transparent;aspect-ratio:2000 / 1414;
  transform:none
}
.rx-space-banner>img{
  display:block;width:100%;height:100%;max-width:100%;
  object-fit:contain;object-position:center;background:transparent
}
.rx-space-banner-copy{
  position:absolute;left:7%;right:25%;top:19%;width:auto;color:#111418;
  text-shadow:none
}
.rx-space-banner-copy h2{
  margin:0;font-size:22px;line-height:1.02;font-weight:900;letter-spacing:-.8px
}
.rx-banner-title-light{color:#fff}
.rx-space-banner-copy p{
  margin:10px 0 0;color:#111418;font-size:11px;line-height:1.3;font-weight:600
}
.rx-space-banner-copy button{
  margin-top:11px;height:37px;padding:0 13px;
  border:1px solid rgba(255,255,255,.7);border-radius:12px;
  background:rgba(255,255,255,.8);color:#111418;
  display:inline-flex;align-items:center;gap:8px;
  font:800 10.5px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)
}

.rx-mode-toggle{
  position:relative;height:62px;display:grid;grid-template-columns:1fr 1fr;gap:3px;
  padding:3px;margin-bottom:14px;border:1px solid #E7E8EA;
  border-radius:18px;background:#fff;box-shadow:0 3px 12px rgba(20,24,28,.04)
}
.rx-mode-indicator{position:absolute;z-index:0;left:3px;top:3px;width:calc(50% - 3px);height:calc(100% - 6px);border-radius:15px;background:#F4D35E;box-shadow:0 4px 12px rgba(244,211,94,.2);transition:transform .34s cubic-bezier(.22,.8,.2,1);pointer-events:none}
.rx-mode-toggle button{position:relative;z-index:1;border:0;background:transparent;border-radius:15px;color:#6E747A;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font:800 11.5px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}
.rx-mode-toggle button.active{
  background:transparent;color:#fff;box-shadow:none
}
.rx-mode-toggle img{width:30px;height:30px;object-fit:contain}

.rx-swipe-viewport{
  width:100%;overflow:hidden;touch-action:pan-y;user-select:none;cursor:grab
}
.rx-swipe-track{
  display:flex;width:200%;
  transform:translate3d(0,0,0);
  transition:transform .42s cubic-bezier(.22,.8,.2,1);
  will-change:transform
}
.rx-swipe-track.external{transform:translate3d(-50%,0,0)}
.rx-swipe-panel{width:50%;min-width:50%}

.rx-shortcuts{
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:4px;margin-bottom:20px
}
.rx-shortcuts button{
  height:70px;min-width:0;border:0;
  border-radius:0;background:transparent;
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:7px;color:#555B61;
  font:700 8px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;
  text-align:center
}
.rx-shortcut-icon{
  width:42px;height:42px;border-radius:50%;
  background:#F1F2F3;display:grid;place-items:center;
  box-shadow:0 2px 7px rgba(20,24,28,.07)
}
.rx-shortcut-icon svg{
  width:18px;height:18px;stroke-width:2.2;color:#343A40
}
.rx-shortcuts button:first-child .rx-shortcut-icon svg,
.rx-shortcuts button:nth-child(3) .rx-shortcut-icon svg,
.rx-shortcuts button:nth-child(4) .rx-shortcut-icon svg{
  fill:#111418
}
.rx-shortcuts button:nth-child(2) .rx-shortcut-icon svg{stroke-width:2.5}
.rx-shortcut-label{white-space:nowrap}

.rx-space-section{margin-bottom:22px}
.rx-section-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:9px
}
.rx-section-head h2{
  margin:0;font-size:17px;line-height:1.12;
  font-weight:800;letter-spacing:-.55px
}
.rx-section-head button{
  border:0;background:transparent;color:#C28F18;
  font:700 10.5px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}
.rx-coin-list{
  overflow:hidden;border:1px solid #E8EAEC;
  border-radius:15px;background:#fff
}
.rx-coin-row{
  width:100%;min-height:72px;padding:10px 12px;
  display:flex;align-items:center;gap:11px;
  border:0;border-bottom:1px solid #ECEDEF;
  background:#fff;color:#12151A;text-align:left
}
.rx-coin-row:last-child{border-bottom:0}
.rx-coin-row>img{
  width:44px;height:44px;border-radius:50%;
  object-fit:contain;flex:none;display:block
}
.rx-coin-name{min-width:0;flex:1;overflow:hidden}
.rx-coin-name strong{
  display:block;font-size:12px;line-height:1.18;
  font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}
.rx-coin-name small{
  display:block;margin-top:4px;color:#747A81;
  font-size:10.5px;line-height:1;font-weight:600
}
.rx-coin-value{
  min-width:82px;text-align:right;flex:0 0 auto
}
.rx-coin-value strong{
  display:block;font-size:12px;line-height:1.15;
  font-weight:800;white-space:nowrap
}
.rx-coin-value small{
  display:block;margin-top:5px;color:#43A57C;
  font-size:10.5px;line-height:1;font-weight:800;white-space:nowrap
}

.rx-trending{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.rx-trending button{
  height:46px;border:1px solid #E8EAEC;border-radius:12px;
  background:#fff;color:#14171B;font:800 10px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}
.rx-trending b{color:#C28F18;margin-right:5px}

.rx-external-hero{
  position:relative;min-height:300px;border-radius:20px;
  background:linear-gradient(145deg,#fffdf2,#fff 60%);
  border:1px solid #ECEDEE;padding:28px 22px;overflow:hidden
}
.rx-external-hero h2{
  margin:0;font-size:28px;line-height:1.03;font-weight:800
}
.rx-external-hero p{
  width:58%;margin:12px 0 0;color:#747A80;
  font-size:12px;line-height:1.5
}
.rx-external-hero>img{
  position:absolute;width:205px;height:205px;
  object-fit:contain;right:-12px;bottom:-18px;
  filter:drop-shadow(0 18px 25px rgba(0,0,0,.12))
}
.rx-wallet-card{
  margin-top:14px;padding:16px;border:1px solid #E7E8EA;
  border-radius:16px;display:grid;grid-template-columns:48px 1fr;
  gap:10px;background:#fff
}
.rx-wallet-art{
  width:48px;height:48px;border-radius:14px;
  background:#F8F8F8;display:grid;place-items:center;overflow:hidden
}
.rx-wallet-art img{width:42px;height:42px;object-fit:contain}
.rx-wallet-card strong{font-size:12px}
.rx-wallet-card p{
  margin:5px 0 0;color:#747A80;font-size:10px;line-height:1.4
}
.rx-wallet-card button{
  grid-column:1/-1;height:42px;border:0;border-radius:11px;
  background:#D7A21A;color:#fff;font:800 11px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}

.rx-overlay{
  position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.48);
  display:flex;align-items:flex-end;justify-content:center;
  animation:rx-overlay-fade .2s ease-out both;touch-action:none
}
.rx-sheet{
  width:min(100%,480px);background:#fff;color:#111418;
  border-radius:22px 22px 0 0;
  padding:9px 16px calc(22px + env(safe-area-inset-bottom));
  max-height:80dvh;overflow:auto;
  transform:translate3d(0,0,0);
  animation:rx-sheet-enter .28s cubic-bezier(.22,.8,.2,1) both;
  transition:transform .38s cubic-bezier(.22,.8,.2,1),max-height .38s ease;will-change:transform;
  touch-action:none
}
.rx-wallet-sheet{height:100dvh;max-height:100dvh;transform:translate3d(0,100%,0);transition:transform .62s cubic-bezier(.16,1,.3,1)}.rx-wallet-sheet.entered{transform:translate3d(0,calc(100% - min(80dvh,640px)),0)}
.rx-sheet.expanded{height:100dvh;max-height:100dvh}
.rx-sheet.dragging{transition:none;cursor:grabbing}
.rx-sheet img{display:block}
.rx-sheet-tall{max-height:86dvh}
.rx-sheet-handle{
  width:100%;height:22px;border:0;border-radius:0;background:transparent;
  margin:0 auto 4px;display:grid;place-items:start center;cursor:grab
}
.rx-sheet-handle::after{
  content:"";display:block;width:42px;height:4px;border-radius:9px;
  background:#D8DADC;margin-top:3px
}
.rx-sheet-head{
  height:38px;display:flex;align-items:center;
  justify-content:space-between;margin-bottom:8px
}
.rx-sheet-head h3{margin:0;font-size:16px;font-weight:800}
.rx-sheet-head button{border:0;background:transparent;color:#111418;padding:5px}

.rx-wallet-row{
  min-height:58px;border-bottom:1px solid #ECEDEF;
  display:grid;grid-template-columns:34px 1fr auto;
  align-items:center;gap:10px
}
.rx-wallet-row>span{
  width:34px;height:34px;border-radius:50%;
  background:#F7F7F7;display:grid;place-items:center;font-size:21px
}
.rx-wallet-row strong{font-size:12px}
.rx-wallet-row button{
  border:0;border-radius:9px;background:#F4D35E;color:#fff;
  padding:9px 11px;font:800 10px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}
.rx-wallet-row>span svg,.rx-wallet-row>span img{width:21px;height:21px;object-fit:contain}

.rx-mycoin{
  display:grid;grid-template-columns:40px 1fr auto;
  gap:10px;align-items:center;padding:12px 0;
  border-bottom:1px solid #ECEDEF
}
.rx-mycoin>img{width:40px;height:40px;border-radius:50%}
.rx-mycoin strong,.rx-mycoin small,.rx-mycoin span{display:block}
.rx-mycoin strong{font-size:11px}
.rx-mycoin small{margin-top:3px;color:#747A80;font-size:9px}
.rx-mycoin span{margin-top:5px;color:#747A80;font-size:9px}
.rx-mycoin-price{text-align:right}
.rx-mycoin-price strong{font-size:10px}
.rx-mycoin-price small{color:#43A57C;font-weight:800}
.rx-mycoin-price small.red{color:#D94C4C}

.rx-menu-card{
  width:100%;text-align:left;border:1px solid #E8EAEC;
  background:#fff;border-radius:13px;padding:14px;margin:5px 0;
  display:grid;grid-template-columns:40px 1fr;column-gap:10px
}
.rx-menu-card>span{
  grid-row:span 2;width:40px;height:40px;border-radius:11px;
  background:#FFF7DA;display:grid;place-items:center;color:#C28F18
}
.rx-menu-card strong{font-size:12px;align-self:end}
.rx-menu-card small{font-size:9px;color:#747A80;margin-top:4px}


.rx-native-screen{position:fixed;inset:0;z-index:950;background:#fff;color:#17191c;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden;touch-action:pan-y}.rx-native-header{height:58px;flex:0 0 58px;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;padding:calc(8px + env(safe-area-inset-top)) 16px 0;border-bottom:1px solid #f0f0f0}.rx-native-header h1{margin:0;text-align:center;font-size:16px;font-weight:800}.rx-native-back{border:0;background:none;padding:7px;display:grid;place-items:center;color:#16181b}.rx-native-header-space{width:24px}.rx-menu-screen{background:linear-gradient(180deg,#fffdf7 0%,#fff 45%)}.rx-menu-content{padding:22px 18px 30px;overflow:auto}.rx-menu-intro span{font-size:9px;font-weight:800;letter-spacing:1.4px;color:#bf8e17}.rx-menu-intro h2{margin:7px 0 5px;font-size:27px;letter-spacing:-.7px}.rx-menu-intro p{margin:0 0 22px;color:#73777b;font-size:11px}.rx-menu-feature{width:100%;border:1px solid #eee9d8;background:#fff;border-radius:16px;padding:15px 13px;margin-bottom:10px;display:grid;grid-template-columns:44px 1fr 20px;align-items:center;gap:10px;text-align:left;box-shadow:0 5px 18px rgba(29,24,11,.05);color:#222}.rx-menu-feature-icon{width:40px;height:40px;border-radius:12px;background:#f8e7a5;color:#b17e0b;display:grid;place-items:center}.rx-menu-feature strong,.rx-menu-feature small{display:block}.rx-menu-feature strong{font-size:13px}.rx-menu-feature small{margin-top:4px;color:#838589;font-size:10px}.rx-menu-section-label{margin:24px 3px 8px;color:#7a7d81;font-size:11px;font-weight:700}.rx-menu-list{border-top:1px solid #ededed}.rx-menu-list button{width:100%;height:56px;border:0;border-bottom:1px solid #ededed;background:#fff;display:grid;grid-template-columns:36px 1fr 20px;align-items:center;text-align:left;color:#25272a;font:600 12px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif}.rx-menu-list-icon{color:#b17e0b;display:grid;place-items:center}.rx-native-scroll{flex:1;overflow:auto;padding:14px 16px 86px;overscroll-behavior:contain}.rx-creator-title{display:flex;align-items:center;gap:10px}.rx-creator-number{width:23px;height:23px;border-radius:6px;background:#d79a08;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800}.rx-creator-title strong,.rx-creator-title small{display:block}.rx-creator-title strong{font-size:13px}.rx-creator-title small{margin-top:3px;color:#777;font-size:9px}.rx-live-pill{margin-left:auto;background:#e5f5ed;color:#31966d;padding:5px 9px;border-radius:10px;font-size:9px}.rx-creator-price{display:flex;align-items:baseline;gap:8px;margin-top:21px}.rx-creator-price strong{font-size:21px}.rx-creator-price span{color:#31966d;font-size:10px;font-weight:800}.rx-creator-price small{color:#909398;font-size:9px}.rx-creator-chart{height:118px;margin:7px -2px 0}.rx-creator-chart svg{width:100%;height:100%}.rx-creator-chart path{fill:none;stroke:#c18c13;stroke-width:1.8;vector-effect:non-scaling-stroke}.rx-range{display:flex;justify-content:space-between;align-items:center;color:#73777b;font-size:9px;margin:4px 17px 16px}.rx-range b{border:1px solid #e6d5a0;border-radius:7px;color:#b17e0b;padding:6px 13px}.rx-creator-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.rx-creator-metric{border:1px solid #eee;padding:10px 8px;border-radius:10px}.rx-creator-metric small,.rx-creator-metric strong{display:block}.rx-creator-metric small{color:#85888c;font-size:8px}.rx-creator-metric strong{margin-top:5px;font-size:10px}.rx-overview{margin-top:20px}.rx-overview h3{font-size:12px;margin:0 0 10px}.rx-overview p{display:flex;justify-content:space-between;margin:8px 0;font-size:9px}.rx-overview p span{color:#73777b}.rx-overview p b{font-weight:700}.rx-gold-cta,.rx-danger-cta{width:100%;height:42px;border:0;border-radius:9px;color:#fff;font:800 11px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;display:flex;align-items:center;justify-content:center;gap:7px}.rx-gold-cta{margin-top:20px;background:linear-gradient(180deg,#dda716,#c68d08);box-shadow:0 4px 12px rgba(198,141,8,.22)}.rx-native-tabs{height:62px;flex:0 0 62px;padding:8px 12px calc(8px + env(safe-area-inset-bottom));border-top:1px solid #ececec;background:#fff;display:flex;justify-content:space-around;align-items:center;color:#73777b;font-size:8px}.rx-native-tabs span{display:flex;flex-direction:column;align-items:center;gap:5px}.rx-native-tabs .active{color:#b17e0b;font-weight:800}.rx-tab-dot{width:14px;height:14px;border:1.5px solid currentColor;border-radius:4px}.rx-liquidity-screen .rx-native-scroll{padding-top:10px}.rx-liquidity-tabs{height:42px;display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #ececec;margin-bottom:13px}.rx-liquidity-tabs button{border:0;background:#fff;color:#71757a;font:600 10px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;position:relative}.rx-liquidity-tabs .active{color:#1d1f22}.rx-liquidity-tabs .active:after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:2px;background:#c89112}.rx-liquidity-art,.rx-pool-card,.rx-form-card{border:1px solid #ececec;border-radius:13px;background:#fff;margin-bottom:12px}.rx-liquidity-art{height:138px;padding:16px;position:relative;overflow:hidden}.rx-liquidity-art strong,.rx-liquidity-art small{display:block}.rx-liquidity-art strong{font-size:12px}.rx-liquidity-art small{margin-top:5px;color:#767a7e;font-size:9px}.rx-orbit-art{position:absolute;right:33px;bottom:17px;color:#c89316;opacity:.85;transform:rotate(-12deg)}.rx-pool-card,.rx-form-card{padding:14px}.rx-pool-card h3,.rx-form-card h3{font-size:11px;margin:0 0 12px}.rx-pool-card>small{font-size:9px;color:#777}.rx-pool-card>div{display:grid;grid-template-columns:1fr 1fr;gap:15px 24px;margin-top:15px}.rx-pool-card p{margin:0}.rx-pool-card p small,.rx-pool-card p strong{display:block}.rx-pool-card p small{color:#777;font-size:8px}.rx-pool-card p strong{margin-top:4px;font-size:11px}.rx-form-card label{display:block;margin:13px 0;color:#707478;font-size:8px}.rx-form-card label span{float:right}.rx-form-card input{display:block;width:100%;height:35px;margin-top:5px;border:1px solid #e4e5e6;border-radius:8px;padding:0 10px;color:#282a2c;font:600 10px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif}.rx-form-card>small{color:#999;font-size:8px}.rx-form-card .rx-gold-cta{margin-top:12px}.rx-warning{display:flex;gap:8px;align-items:flex-start;padding:12px;background:#fff0f0;border:1px solid #f4d2d2;border-radius:10px;color:#a54f4f;font-size:9px;line-height:1.5;margin-bottom:13px}.rx-receive{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rx-receive p{margin:0;padding:9px;background:#fbfbfb;border-radius:8px}.rx-receive small,.rx-receive strong,.rx-receive em{display:block}.rx-receive small{font-size:8px;color:#777}.rx-receive strong{margin-top:6px;font-size:11px}.rx-receive em{margin-top:5px;font-style:normal;color:#888;font-size:8px}.rx-slider{height:9px;margin:26px 3px 8px;background:#e4e6e8;border-radius:10px;position:relative}.rx-slider span{display:block;width:50%;height:100%;background:#c38e13;border-radius:10px}.rx-slider b{position:absolute;left:50%;top:-12px;transform:translateX(-50%);background:#26282a;color:#fff;border-radius:12px;padding:6px 9px;font-size:8px}.rx-slider-labels{display:flex;justify-content:space-between;color:#888;font-size:8px}.rx-danger-cta{margin-top:18px;background:#d92828}.rx-space-trade-card{border:1px solid #ececec;border-radius:13px;padding:14px;margin:14px 0;background:#fff}.rx-trade-mode-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px}.rx-trade-mode-row button{height:38px;border:1px solid #e5e5e5;border-radius:9px;background:#fff;color:#555;font:700 11px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-trade-mode-row button.active{background:#111418;color:#fff;border-color:#111418}.rx-trade-mode-row button.active.buy{background:#d7a21a;border-color:#d7a21a}.rx-trade-mode-row button.active.sell{background:#d92828;border-color:#d92828}.rx-trade-input{width:100%;height:44px;border:1px solid #e4e5e6;border-radius:9px;padding:0 10px;font:600 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;margin-bottom:9px}.rx-trade-notice{margin-top:9px;color:#31966d;font-size:11px;line-height:1.4}.rx-native-screen button{cursor:pointer;-webkit-tap-highlight-color:transparent}.rx-native-screen button:active{transform:scale(.99)}
@keyframes rx-native-in{from{transform:translate3d(100%,0,0)}to{transform:translate3d(0,0,0)}}


.rx-menu-screen{background:#fff}.rx-menu-topbar{height:66px;flex:0 0 66px;display:flex;align-items:flex-end;padding:0 14px 13px;border-bottom:0}.rx-menu-topbar .rx-native-back{padding:4px}.rx-menu-content{padding:16px 20px 30px;overflow:auto}.rx-menu-feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:28px}.rx-menu-feature{height:92px;border:0;background:#f4f4f4;border-radius:15px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;box-shadow:none;text-align:center;color:#111}.rx-menu-feature-icon{width:auto;height:auto;border-radius:0;background:transparent;color:#111;display:grid;place-items:center}.rx-menu-feature strong{font-size:15px;font-weight:500}.rx-menu-groups{border-top:1px solid #e6e6e6}.rx-menu-groups .rx-menu-list{border-top:0;border-bottom:1px solid #e6e6e6}.rx-menu-list button{height:64px;grid-template-columns:42px 1fr 24px;color:#171717;font:500 16px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;border-bottom:0}.rx-menu-list-icon{color:#111;justify-content:start}.rx-menu-list button svg:last-child{color:#707070}.rx-creator-screen .rx-native-header{height:55px;flex-basis:55px;padding-left:13px;padding-right:13px}.rx-creator-screen .rx-native-scroll{padding:12px 13px 82px}.rx-creator-screen .rx-creator-price{margin-top:16px}.rx-creator-screen .rx-creator-chart{height:105px}.rx-creator-screen .rx-creator-metrics{gap:6px}.rx-creator-screen .rx-creator-metric{padding:9px 7px}.rx-creator-screen .rx-creator-metric small{font-size:7px}.rx-creator-screen .rx-creator-metric strong{font-size:9px}.rx-creator-screen .rx-overview{margin-top:17px}

.rx-native-screen{position:fixed;inset:0;width:min(100%,480px);height:100dvh;animation:none!important;min-height:100dvh;margin:0 auto;z-index:950;background:#fff;display:flex;flex-direction:column;overflow:hidden;overscroll-behavior:none;isolation:isolate;touch-action:pan-y}
.rx-native-screen .rx-native-scroll{flex:1;min-height:0;width:100%;max-width:480px;margin:0 auto;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:12px 16px calc(24px + env(safe-area-inset-bottom))}
.rx-native-screen .rx-native-header,.rx-native-screen .rx-native-scroll{animation:rx-native-content-in .3s cubic-bezier(.2,.8,.2,1) both}.rx-native-screen .rx-native-tabs{animation:rx-native-content-in .3s cubic-bezier(.2,.8,.2,1) both}.rx-native-header-minimal{height:56px!important;flex-basis:56px!important;border-bottom:0!important;justify-content:flex-start!important;padding:0 16px!important}.rx-native-header-minimal .rx-native-back{position:static!important}.rx-creator-screen .rx-creator-metric small,.rx-creator-screen .rx-overview p span{color:#555b61}.rx-creator-screen .rx-creator-metric strong,.rx-creator-screen .rx-overview p b{color:#111418}.rx-creator-screen .rx-gold-cta,.rx-liquidity-screen .rx-gold-cta{background:#d7a21a!important;box-shadow:0 4px 10px rgba(173,127,8,.18)}.rx-liquidity-screen,.rx-liquidity-screen .rx-native-scroll{color:#111418}.rx-liquidity-screen .rx-pool-card h3,.rx-liquidity-screen .rx-form-card h3,.rx-liquidity-screen .rx-pool-card p strong,.rx-liquidity-screen .rx-form-card label{color:#222}.rx-liquidity-screen .rx-pool-card p small,.rx-liquidity-screen .rx-form-card>small,.rx-liquidity-screen .rx-form-card label span{color:#5e6469}
@keyframes rx-native-content-in{from{opacity:.98;transform:translate3d(16px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}

.rx-native-screen button{touch-action:manipulation;transition:background-color .16s ease,color .16s ease,border-color .16s ease}.rx-native-screen button:active{transform:none}
 .rx-menu-screen{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif}.rx-menu-content{flex:1;min-height:0;width:100%;max-width:480px;margin:0 auto;padding:14px 18px calc(30px + env(safe-area-inset-bottom));overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;-webkit-overflow-scrolling:touch;touch-action:pan-y}.rx-menu-feature-grid{gap:10px;margin-bottom:22px}.rx-menu-feature{height:72px;border-radius:12px;padding:8px}.rx-menu-feature-icon svg{width:22px;height:22px}.rx-menu-feature strong{font-size:13px;font-weight:600;color:#111}.rx-menu-section-label{margin:18px 0 7px;color:#85898d;font-size:13px;font-weight:500;letter-spacing:.01em}.rx-menu-list{border-top:0!important;border-bottom:1px solid #e6e6e6}.rx-menu-list button{height:52px;grid-template-columns:34px 1fr 20px;color:#111;font-size:15px;font-weight:500}.rx-menu-list-icon,.rx-menu-list-icon svg,.rx-menu-list button svg:last-child{color:#85898d}.rx-menu-list-icon svg{stroke-width:2}.rx-creator-screen .rx-creator-title{gap:10px}.rx-creator-screen .rx-creator-number{width:30px;height:30px;font-size:14px}.rx-creator-screen .rx-creator-title strong{font-size:16px}.rx-creator-screen .rx-creator-title small{font-size:11px}.rx-creator-screen .rx-live-pill{font-size:11px;padding:7px 11px}.rx-creator-screen .rx-creator-price{margin-top:20px}.rx-creator-screen .rx-creator-price strong{font-size:25px}.rx-creator-screen .rx-creator-price span{font-size:12px}.rx-creator-screen .rx-creator-price small{font-size:11px}.rx-creator-screen .rx-creator-chart{height:125px;margin:10px 0}.rx-creator-screen .rx-range{font-size:11px;margin:8px 18px 18px}.rx-creator-screen .rx-creator-metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.rx-creator-screen .rx-creator-metric{min-width:0;padding:11px 10px;border-radius:12px}.rx-creator-screen .rx-creator-metric small{font-size:10px}.rx-creator-screen .rx-creator-metric strong{font-size:13px}.rx-creator-screen .rx-overview{margin-top:22px}.rx-creator-screen .rx-overview h3{font-size:16px}.rx-creator-screen .rx-overview p{font-size:12px;margin:11px 0}.rx-creator-screen .rx-overview p b{font-size:12px}.rx-creator-screen .rx-gold-cta{height:48px;font-size:13px;margin-top:24px}.rx-liquidity-swipe{width:100%;overflow:hidden;touch-action:pan-y;overscroll-behavior:contain}.rx-liquidity-track{display:flex;width:200%;align-items:flex-start;will-change:transform}.rx-liquidity-panel{width:50%;min-width:50%;height:max-content;padding:0 5px}.rx-liquidity-screen .rx-liquidity-tabs{margin-left:0;margin-right:0}.rx-liquidity-screen .rx-liquidity-tabs button{font-size:12px}.rx-liquidity-screen .rx-liquidity-art,.rx-liquidity-screen .rx-pool-card,.rx-liquidity-screen .rx-form-card{width:100%;max-width:none}.rx-liquidity-screen .rx-liquidity-art{height:165px;padding:20px}.rx-liquidity-screen .rx-liquidity-art strong{font-size:15px}.rx-liquidity-screen .rx-liquidity-art small{font-size:11px}.rx-liquidity-screen .rx-pool-card,.rx-liquidity-screen .rx-form-card{padding:18px}.rx-liquidity-screen .rx-pool-card h3,.rx-liquidity-screen .rx-form-card h3{font-size:15px}.rx-liquidity-screen .rx-pool-card>div{gap:18px 28px}.rx-liquidity-screen .rx-pool-card p small,.rx-liquidity-screen .rx-form-card label,.rx-liquidity-screen .rx-form-card>small{font-size:11px}.rx-liquidity-screen .rx-pool-card p strong,.rx-liquidity-screen .rx-receive strong{font-size:14px}.rx-liquidity-screen .rx-form-card input{height:44px;font-size:13px}.rx-liquidity-screen .rx-gold-cta,.rx-liquidity-screen .rx-danger-cta{height:46px;font-size:13px}.rx-wallet-sheet.dragging{transition:none}

@media(max-width:430px){
  .rx-space-banner{width:100%;height:auto;aspect-ratio:2000 / 1414}
  .rx-space-banner-copy{left:7%;right:25%;top:17%;width:auto}
  .rx-space-banner-copy h2{font-size:19px}
  .rx-space-banner-copy p{margin-top:9px;font-size:10px}
  .rx-space-banner-copy button{margin-top:9px;height:35px;font-size:9.5px}
  .rx-mode-toggle{height:60px}
  .rx-shortcuts{gap:2px}
  .rx-shortcuts button{height:68px;font-size:7.5px}
  .rx-shortcut-icon{width:40px;height:40px}
  .rx-coin-row{min-height:70px;padding-left:10px;padding-right:10px}
  .rx-coin-row>img{width:42px;height:42px}
  .rx-coin-value{min-width:78px}
}

 .rx-tab-screen .rx-native-scroll{padding:12px 16px calc(78px + env(safe-area-inset-bottom))}
 .rx-tab-screen .rx-native-tabs{position:absolute;left:0;right:0;bottom:0}
 .rx-tab-screen .rx-holders-number{display:none}
 .rx-tab-screen .rx-token-summary>.rx-creator-number{display:none}
 .rx-tab-screen .rx-token-summary{margin:4px 0 22px;padding:0 2px}.rx-tab-screen .rx-token-summary img{width:47px;height:47px}.rx-tab-screen .rx-token-summary strong{font-size:17px}.rx-tab-screen .rx-token-summary small{font-size:11px}
 .rx-tab-screen .rx-settings-row{min-height:70px;padding:10px 13px;gap:13px}.rx-tab-screen .rx-settings-row strong{font-size:14px;font-weight:700}.rx-tab-screen .rx-settings-row small{font-size:10px;margin-top:5px}.rx-tab-screen .rx-settings-row em{font-size:11px}.rx-tab-screen .rx-settings-icon{font-size:19px;width:25px}
 .rx-tab-screen .rx-stat-grid{gap:9px;margin-bottom:20px}.rx-tab-screen .rx-stat-grid span{padding:13px 10px}.rx-tab-screen .rx-stat-grid small{font-size:9px}.rx-tab-screen .rx-stat-grid b{font-size:14px}.rx-tab-screen .rx-tab-switch,.rx-tab-screen .rx-transaction-tabs,.rx-tab-screen .rx-periods{height:47px;font-size:12px}.rx-tab-screen .rx-tab-switch b,.rx-tab-screen .rx-transaction-tabs b{height:47px}
 .rx-tab-screen .rx-holder-list>div{height:49px;grid-template-columns:27px 1fr 58px 100px;padding:0 12px;font-size:11px}.rx-tab-screen .rx-holder-list strong{font-size:12px}.rx-tab-screen .rx-holder-list span,.rx-tab-screen .rx-holder-list b{font-size:11px}
 .rx-tab-screen .rx-tab-heading{font-size:14px;margin:18px 0 10px}.rx-tab-screen .rx-periods span,.rx-tab-screen .rx-periods b{min-width:52px;height:30px}.rx-tab-screen .rx-analytics-metrics{gap:9px}.rx-tab-screen .rx-analytics-metrics span{padding:12px 10px}.rx-tab-screen .rx-analytics-metrics small{font-size:9px}.rx-tab-screen .rx-analytics-metrics b{font-size:12px}.rx-tab-screen .rx-analytics-metrics em{font-size:9px}
 .rx-tab-screen .rx-transaction-list>div{min-height:74px;padding:9px 12px;grid-template-columns:30px 1fr auto 48px;gap:10px}.rx-tab-screen .rx-transaction-list strong{font-size:12px}.rx-tab-screen .rx-transaction-list small{font-size:9px}.rx-tab-screen .rx-transaction-list em{font-size:10px}.rx-tab-screen .rx-transaction-list time{font-size:9px}.rx-tab-screen .rx-notification-list>div{min-height:82px;padding:10px 12px;grid-template-columns:30px 1fr 48px;gap:10px}.rx-tab-screen .rx-notification-list strong{font-size:12px}.rx-tab-screen .rx-notification-list small{font-size:9px}.rx-tab-screen .rx-notification-list time{font-size:9px}
 .rx-tab-screen .rx-token-summary strong{font-size:20px}.rx-tab-screen .rx-token-summary small{font-size:13px}.rx-tab-screen .rx-token-summary img{width:55px;height:55px}
 .rx-tab-screen .rx-settings-row{min-height:87px;padding:13px 15px;gap:15px}.rx-tab-screen .rx-settings-row strong{font-size:17px}.rx-tab-screen .rx-settings-row small{font-size:12px;margin-top:6px}.rx-tab-screen .rx-settings-row em{font-size:13px}.rx-tab-screen .rx-settings-icon{font-size:22px;width:28px}
 .rx-tab-screen .rx-stat-grid small{font-size:10px}.rx-tab-screen .rx-stat-grid b{font-size:16px}.rx-tab-screen .rx-tab-switch,.rx-tab-screen .rx-transaction-tabs,.rx-tab-screen .rx-periods{font-size:14px}.rx-tab-screen .rx-holder-list>div{height:58px;grid-template-columns:30px 1fr 64px 110px;padding:0 14px}.rx-tab-screen .rx-holder-list strong{font-size:14px}.rx-tab-screen .rx-holder-list span,.rx-tab-screen .rx-holder-list b{font-size:13px}
 .rx-tab-screen .rx-tab-heading{font-size:16px}.rx-tab-screen .rx-analytics-metrics small{font-size:10px}.rx-tab-screen .rx-analytics-metrics b{font-size:14px}.rx-tab-screen .rx-analytics-metrics em{font-size:10px}
 .rx-tab-screen .rx-transaction-list>div{min-height:88px;padding:12px 14px;grid-template-columns:32px 1fr auto 52px}.rx-tab-screen .rx-transaction-list strong{font-size:14px}.rx-tab-screen .rx-transaction-list small{font-size:10px}.rx-tab-screen .rx-transaction-list em{font-size:12px}.rx-tab-screen .rx-transaction-list time{font-size:10px}.rx-tab-screen .rx-notification-list>div{min-height:105px;padding:14px 15px;grid-template-columns:32px 1fr 52px}.rx-tab-screen .rx-notification-list strong{font-size:15px}.rx-tab-screen .rx-notification-list small{font-size:11px}.rx-tab-screen .rx-notification-list time{font-size:10px}
 .rx-token-summary,.rx-holders-number{display:flex;align-items:center;gap:10px;margin:2px 0 18px}
 .rx-token-summary img{width:42px;height:42px}.rx-token-summary div{display:flex;flex-direction:column;gap:3px}.rx-token-summary strong,.rx-holders-number strong{font-size:15px}.rx-token-summary small{color:#777;font-size:10px}
 .rx-settings-list,.rx-holder-list,.rx-transaction-list,.rx-notification-list{border:1px solid #ececec;border-radius:12px;overflow:hidden;background:#fff}
 .rx-settings-row{min-height:54px;padding:8px 10px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #ededed}.rx-settings-row:last-child{border-bottom:0}.rx-settings-icon{width:22px;text-align:center;color:#73777b;font-size:17px}.rx-settings-row div{min-width:0;flex:1}.rx-settings-row strong,.rx-settings-row small{display:block}.rx-settings-row strong{font-size:11px}.rx-settings-row small{margin-top:3px;color:#777;font-size:8px}.rx-settings-row em{font-style:normal;color:#777;font-size:9px;white-space:nowrap}.rx-switch{width:29px;height:17px;border-radius:12px;background:#d5d7d9;position:relative}.rx-switch:after{content:"";position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;background:#fff}.rx-switch.on{background:#d49b12}.rx-switch.on:after{left:14px}
 .rx-stat-grid,.rx-analytics-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:16px}.rx-stat-grid span,.rx-analytics-metrics span{padding:11px 8px;border:1px solid #ededed;border-radius:10px}.rx-stat-grid small,.rx-stat-grid b,.rx-analytics-metrics small,.rx-analytics-metrics b,.rx-analytics-metrics em{display:block}.rx-stat-grid small,.rx-analytics-metrics small{font-size:8px;color:#777}.rx-stat-grid b,.rx-analytics-metrics b{margin-top:6px;font-size:11px}.rx-tab-switch,.rx-transaction-tabs,.rx-periods{display:flex;justify-content:space-around;align-items:center;height:40px;border-bottom:1px solid #ececec;margin-bottom:8px;font-size:10px;color:#656a70}.rx-tab-switch b,.rx-transaction-tabs b,.rx-periods b{height:40px;display:grid;place-items:center;color:#222;border-bottom:2px solid #c89316}.rx-holder-list>div{height:39px;display:grid;grid-template-columns:24px 1fr 52px 86px;align-items:center;gap:3px;padding:0 9px;border-bottom:1px solid #f0f0f0;font-size:9px}.rx-holder-list>div:last-child{border-bottom:0}.rx-holder-list i{font-style:normal;color:#555}.rx-holder-list strong{font-size:9px}.rx-holder-list span{text-align:right;color:#666}.rx-holder-list b{text-align:right;font-size:9px}
 .rx-periods span,.rx-periods b{min-width:45px;height:25px;border:1px solid #e9e9e9;border-radius:9px;display:grid;place-items:center}.rx-periods b{background:#d49b12;color:#fff;border-color:#d49b12}.rx-tab-heading{font-size:11px;margin:14px 0 8px}.rx-analytics-metrics em{margin-top:5px;color:#33956d;font-style:normal;font-size:8px}.rx-chart-card{border:1px solid #ededed;border-radius:11px;padding:10px 8px}.rx-chart-card svg{width:100%;height:130px}.rx-chart-card path{fill:none;stroke:#c89316;stroke-width:2}.rx-chart-card div{display:flex;justify-content:space-between;color:#777;font-size:7px}.rx-volume-bars{height:78px;display:flex;align-items:flex-end;justify-content:space-around;border-bottom:1px solid #eee}.rx-volume-bars i{display:block;width:4px;background:#d49b12;border-radius:2px 2px 0 0}
 .rx-transaction-list>div,.rx-notification-list>div{min-height:58px;display:grid;grid-template-columns:28px 1fr auto 42px;align-items:center;gap:8px;padding:7px 9px;border-bottom:1px solid #ededed}.rx-transaction-list>div:last-child,.rx-notification-list>div:last-child{border-bottom:0}.rx-transaction-list i,.rx-notification-list i{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;font-style:normal;background:#e4f5ed;color:#299368;font-size:12px}.rx-transaction-list i.sell{background:#fde9e9;color:#d33c3c}.rx-transaction-list i.liq{background:#fff2ca;color:#c48d12}.rx-transaction-list strong,.rx-transaction-list small,.rx-notification-list strong,.rx-notification-list small{display:block}.rx-transaction-list strong,.rx-notification-list strong{font-size:9px}.rx-transaction-list small,.rx-notification-list small{margin-top:3px;color:#777;font-size:7px}.rx-transaction-list em{color:#299368;font-size:8px;font-style:normal;text-align:right}.rx-transaction-list em.red{color:#d33c3c}.rx-transaction-list em small{color:#555}.rx-transaction-list time,.rx-notification-list time{color:#777;font-size:7px;text-align:right}.rx-notification-list>div{grid-template-columns:28px 1fr 42px;min-height:67px}.rx-notification-list .notice-1{color:#c48d12;background:#fffaf0}.rx-notification-list .notice-2{color:#3e9ec2;background:#eef9fc}.rx-notification-list .notice-3{color:#299368}.rx-view-all{display:block;margin:22px auto 0;border:0;background:none;color:#b17e0b;font-size:11px;font-weight:700}.rx-more,.rx-filter{font-weight:800;letter-spacing:2px;color:#333}

`;

const createStyles = `
.rx-create-stage{
  height:310px;position:relative;overflow:hidden;margin-top:2px
}
.rx-create-glow{
  position:absolute;left:50%;bottom:28px;width:70%;height:42%;
  transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(circle,rgba(244,211,94,.22),transparent 70%);
  filter:blur(17px)
}
.rx-platform{
  position:absolute;z-index:1;left:50%;bottom:-28px;
  width:300px;height:220px;transform:translateX(-50%);
  object-fit:contain;filter:drop-shadow(0 12px 12px rgba(160,110,10,.12))
}
.rx-cloud-video{
  position:absolute;z-index:2;left:50%;bottom:8px;
  width:330px;height:180px;transform:translateX(-50%);
  object-fit:cover;mix-blend-mode:screen;
  filter:brightness(1.08) contrast(.9);opacity:.96;
  pointer-events:none;
  mask-image:radial-gradient(ellipse at center,black 55%,transparent 100%);
  -webkit-mask-image:radial-gradient(ellipse at center,black 55%,transparent 100%)
}
.rx-rocket-crop{
  position:absolute;z-index:5;left:50%;top:48px;width:108px;height:106px;
  transform:translateX(-50%);overflow:visible;pointer-events:none;
  filter:drop-shadow(0 12px 10px rgba(0,0,0,.10));
  animation:rx-float 2.8s ease-in-out infinite
}
.rx-rocket-crop img{
  display:block;width:108px;height:112px;
  object-fit:contain;object-position:top center
}
.rx-flame-video{
  position:absolute;z-index:4;left:50%;top:151px;
  width:58px;height:112px;transform:translateX(-50%);
  object-fit:cover;mix-blend-mode:screen;
  filter:brightness(1.15) saturate(1.08);opacity:.99;
  pointer-events:none;
  mask-image:radial-gradient(ellipse at center,black 42%,transparent 80%);
  -webkit-mask-image:radial-gradient(ellipse at center,black 42%,transparent 80%)
}
.rx-side-coin{
  position:absolute;z-index:7;top:116px;width:30px;height:30px;
  object-fit:contain;filter:drop-shadow(0 7px 7px rgba(198,145,18,.16));
  animation:rx-side-float 3.2s ease-in-out infinite
}
.rx-side-left{left:calc(50% - 112px)}
.rx-side-right{right:calc(50% - 112px);animation-delay:-1.6s}
.rx-side-art{
  position:absolute;z-index:3;right:calc(50% - 112px);top:104px;
  width:86px;height:86px;object-fit:contain;opacity:.98;
  filter:drop-shadow(0 7px 7px rgba(198,145,18,.14))
}
.rx-step{text-align:center;color:#747A80;font-size:10px;font-weight:700}
.rx-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0 18px}
.rx-progress span{height:4px;border-radius:8px;background:#E7E8EA}
.rx-progress span.on{background:#F4D35E}

.rx-upload{
  position:relative;border:1px dashed #D8DADC;border-radius:15px;padding:16px;
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;background:#FAFAFA;cursor:pointer
}
.rx-upload input{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;cursor:pointer;pointer-events:auto;z-index:2}
.rx-upload-circle{
  width:72px;height:72px;border-radius:50%;display:grid;
  place-items:center;background:#FFF7DA;color:#D7A21A;
  overflow:hidden;margin-bottom:8px
}
.rx-upload-circle img{width:100%;height:100%;object-fit:cover}
.rx-upload strong{font-size:12px}
.rx-upload small{margin-top:4px;color:#747A80;font-size:9px}

.rx-fields{display:grid;gap:10px;margin-top:14px}
.rx-create-field{display:grid;gap:5px;color:#535A60;font-size:9px;font-weight:700}
.rx-create-field input,.rx-create-field select{
  width:100%;height:42px;border:1px solid #E4E6E8;border-radius:10px;
  padding:0 11px;background:#fff;outline:none;color:#111418;
  font:600 11px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}
.rx-create-field input::placeholder{color:#B0B4B8}
.rx-two-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.rx-select-wrap{position:relative}
.rx-select-wrap select{appearance:none;padding-right:35px}
.rx-network-select{position:relative}
.rx-network-trigger{
  width:100%;height:42px;border:1px solid #E4E6E8;border-radius:10px;
  padding:0 11px;background:#fff;color:#111418;
  display:flex;align-items:center;justify-content:space-between;
  font:600 11px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}
.rx-network-trigger.open{border-color:#D7A21A}
.rx-network-trigger .rx-chevron{position:static;transform:none;pointer-events:none;transition:transform .22s ease}
.rx-network-trigger .rx-chevron.rotated{transform:rotate(180deg)}
.rx-network-menu{
  position:absolute;z-index:30;left:0;right:0;bottom:calc(100% + 8px);
  padding:5px;border:1px solid #E4E6E8;border-radius:12px;
  background:#fff;box-shadow:0 12px 30px rgba(20,24,28,.12);
  opacity:0;visibility:hidden;transform:translateY(8px) scale(.985);
  transform-origin:bottom center;
  transition:opacity .22s ease,transform .22s ease,visibility .22s ease;
  pointer-events:none
}
.rx-network-menu.open{
  opacity:1;visibility:visible;transform:translateY(0) scale(1);
  pointer-events:auto
}
.rx-network-menu button{
  width:100%;height:38px;border:0;border-radius:8px;
  background:transparent;text-align:left;padding:0 10px;
  color:#111418;font:600 10.5px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif
}
.rx-network-menu button.selected,.rx-network-menu button:active{background:#FFF7DA}

.rx-create-actions{display:flex;gap:9px;margin:16px 0}
.rx-create-actions button{height:44px;border-radius:11px;font:800 11px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif}
.rx-create-actions .primary{flex:1;border:0;background:#D7A21A;color:#fff}
.rx-create-actions .primary{
  position:relative;display:flex;align-items:center;justify-content:center;gap:8px
}
.rx-create-actions .primary:disabled{opacity:.45}
.rx-action-arrow{position:absolute;left:12px}
.rx-create-actions .secondary{
  width:90px;border:1px solid #E1E3E5;background:#fff;color:#111418
}

.rx-review{border:1px solid #E7E8EA;border-radius:15px;overflow:hidden}
.rx-review div{
  display:flex;justify-content:space-between;gap:15px;
  padding:12px;border-bottom:1px solid #ECEDEF
}
.rx-review div:last-child{border-bottom:0}
.rx-review span{color:#747A80;font-size:10px}
.rx-review strong{font-size:10px;text-align:right}

.rx-launched{
  text-align:center;padding:25px 10px;
  border:1px solid #E7E8EA;border-radius:16px
}
.rx-launched>svg{color:#43A57C}
.rx-launched h2{font-size:17px;margin:9px 0 5px}
.rx-launched p{font-size:10px;color:#747A80;margin:0}

@keyframes rx-side-float{
  0%,100%{transform:translateY(0) rotate(-3deg)}
  50%{transform:translateY(-6px) rotate(3deg)}
}
@keyframes rx-overlay-fade{
  from{opacity:0}
  to{opacity:1}
}
@keyframes rx-sheet-enter{
  from{transform:translate3d(0,100%,0)}
  to{transform:translate3d(0,0,0)}
}
@keyframes rx-float{
  0%,100%{transform:translateX(-50%) translateY(0) rotate(-.3deg)}
  50%{transform:translateX(-50%) translateY(-5px) rotate(.3deg)}
}

@media(max-width:430px){
  .rx-create-stage{height:300px}
  .rx-platform{width:300px;height:215px}
  .rx-rocket-crop{top:51px;width:98px;height:102px}
  .rx-rocket-crop img{width:98px;height:102px}
  .rx-flame-video{top:148px;width:54px;height:106px}
  .rx-cloud-video{width:320px;height:174px}
  .rx-side-coin{width:29px;height:29px}
  .rx-side-left{left:calc(50% - 106px)}
  .rx-side-right{right:calc(50% - 106px)}
  .rx-side-art{right:calc(50% - 106px);top:99px;width:82px;height:82px}
}
`;

export default function SpaceCoinsDashboard({ onBack }) {
  const [mode, setMode] = useState("space");
  const [screen, setScreen] = useState("dashboard");
  const [overlay, setOverlay] = useState(null);
  const [coins, setCoins] = useState(COINS);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const handleNativeBack = useCallback(() => {
    if (overlay) {
      setOverlay(null);
      return true;
    }
    const previousScreen = {
      create: "dashboard",
      menu: "dashboard",
      creator: "dashboard",
      "liquidity-manage": "creator",
      "liquidity-remove": "liquidity-manage",
      "token-settings": "menu",
      holders: "menu",
      analytics: "menu",
      transactions: "menu",
      notifications: "menu",
    }[screen];
    if (previousScreen) {
      setScreen(previousScreen);
      return true;
    }
    return false;
  }, [overlay, screen]);

  useEffect(() => registerNativeBackHandler(handleNativeBack, "space-coins"), [handleNativeBack]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("space_coins").select("*").eq("status", "live").order("created_at", { ascending: false });
      if (active) setCoins(data || []);
    };
    load();
    const channel = supabase.channel("space-coins-registry").on("postgres_changes", { event: "*", schema: "public", table: "space_coins" }, load).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    try { sessionStorage.removeItem("rainx-space-screen"); } catch {}
  }, []);

  if (screen === "create") {
    return <CreateCoin onBack={() => setScreen("dashboard")} onCreated={(coin) => { setCoins((current) => [coin, ...current.filter((item) => item.id !== coin.id)]); setScreen("dashboard"); }} />;
  }
  if (screen === "menu") {
    return <MenuScreen onBack={() => setScreen("dashboard")} onDashboard={() => setScreen("creator")} onSelect={(label) => setScreen({ "Token Settings": "token-settings", Analytics: "analytics", Holders: "holders", Transactions: "transactions", Notifications: "notifications" }[label] || "menu")} />;
  }
  if (screen === "creator") {
    return <CreatorDashboard coin={selectedCoin || coins[0]} onBack={() => setScreen("dashboard")} onManage={() => setScreen("liquidity-manage")} />;
  }
  if (screen === "liquidity-manage") {
    return <LiquidityScreen onBack={() => setScreen("creator")} onToggle={() => {}} />;
  }
  if (screen === "liquidity-remove") {
    return <LiquidityScreen remove onBack={() => setScreen("liquidity-manage")} onToggle={() => {}} />;
  }
  if (screen === "token-settings") {
    return <TokenSettingsScreen onBack={() => setScreen("menu")} />;
  }
  if (screen === "holders") {
    return <HoldersScreen onBack={() => setScreen("menu")} />;
  }
  if (screen === "analytics") {
    return <AnalyticsScreen onBack={() => setScreen("menu")} />;
  }
  if (screen === "transactions") {
    return <TransactionsScreen onBack={() => setScreen("menu")} />;
  }
  if (screen === "notifications") {
    return <NotificationsScreen onBack={() => setScreen("menu")} />;
  }
  return (
    <>
      <style>{styles}</style>

      <Dashboard
        mode={mode}
        setMode={setMode}
        onCreate={() => setScreen("create")}
        onMenu={() => setScreen("menu")}
        onMyCoins={() => setOverlay("coins")}
        onConnect={() => setOverlay("wallet")}
        coins={coins}
        onSelectCoin={(coin) => { setSelectedCoin(coin); setScreen("creator"); }}
      />

      {overlay === "wallet" && (
        <WalletSheet onClose={() => setOverlay(null)} />
      )}

      {overlay === "coins" && (
        <MyCoinsSheet coins={coins} onClose={() => setOverlay(null)} />
      )}

    </>
  );
}
