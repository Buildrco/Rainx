import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { createChart, CrosshairMode, LineStyle, PriceScaleMode } from "lightweight-charts";
import { registerNativeBackHandler } from "./nativeBackStack";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AlarmClockPlus,
  BarChart3,
  Bell,
  CandlestickChart,
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
  Maximize2,
  MoreVertical,
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
const RAINX_LOGO_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwMDAgQDAwMEBAQFBgoGBgUFBgwICQcKDgwPDg4MDQ0PERYTDxAVEQ0NExoTFRcYGRkZDxIbHRsYHRYYGRj/2wBDAQQEBAYFBgsGBgsYEA0QGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCAEAAQADASIAAhEBAxEB/8QAHAABAQEBAQEBAQEAAAAAAAAAAAEHBgQCBQMI/8QAQBAAAgAEAwMHCAgGAwEAAAAAAAECAwQRBTFBIVGTBgcSFWGx0RMWMlRxcpHhFCIzNFNVgcIXJEJSc4MjocFj/8QAGgEBAQEBAQEBAAAAAAAAAAAAAAYHBQQIAf/EAEERAAECBAAHCQ8EAwEAAAAAAAABAgMEBREGByExUYGREhUWF1NUYbHBExQiNDZBQ1JxgpKhssLRM0Ry4TJig/D/2gAMAwEAAhEDEQA/AP8ARqy2lIshsPiE04alRAgAUiZQANANAAExbYwAACIAqCAABEUAAAABAAAAAAAXIAUAAAAIAAAAEAACewIiVkVAAIpAAEEUAEGZQAmAABYDaQAtwAAEiFJmgAioiRQALglgCoAAAhRYAE2goBEXQhQCLYXQAAgWQsVZABCwWRACgDQAWBCgAgCAFgELAFINAAWwIigAhQAAAABYIADQEKAAQIAoyQABEUWIAUAAAJWAvsAGhN4WRUAQZhhAAuhEABqND24ThlTi+Jw0VNZNrpRRvKCFZtncyOQmDwSVDOm1U2PWJRqFX7FYqqBgZU65DdGlGojEyXctkvoTzqeCbqUCVXcxFy6EM6BpHmNgW6q4vyL5j4GtKri/IoOKit6WfEv4PJv9K9Oz+zNgaT5j4FuquL8h5j4FbKp4vyP3iorelnxL+Bv9K9Oz+zNgddj3Iz6FRR1uGzJkyCWulHKj2tQ709fYcjYjK1QZyix+951llzoudFTSi/8AlOlLTUOZZu4S3QIAHHPQTUFIAUEOt5P8jusKKCuxGbHKlRq8uVBsiiW9t5HXotCnKzMd7STLuzr5kRNKqeeZmocszdxVshyYNI8xsD3VXF+Q8x8CtlU8X5FpxUVvSz4l/Bzd/pXp2f2ZuDSPMfAt1VxfkXzHwO2VVxfkOKit6WfEv4G/0r07P7M1KaNM5CYNFKiUuOqlxvKLpp2/Ro4fGMIqcFxF0lREo010oJkKso1v+RwK9gVVKJCSPNNRWLku1boi9OZU6j1ylTgTTtzDXL0nguUiKSZ7wAgAAQoAWRFsKsgAM0QuhFkAEANgB2vN7CnMxCNralLV+z63gdwcTzeZ4j/r/cdsfU2LdETB6Xt/t9biFrPjj9XUgABcHLKQFAI4VHA4IldNWaMUjShmRQrJNr/s2xGKTfto/efeYljkRNzJr/P7Cmwb9Jq7T5AQMOKgADQAWurG1SoIZciCXCrQwwpJLdYxVG2Q+gvYjbsTSJecX+H3kxhGv6evsBSA3AmAAAB2nGc4MC+i0EVlfpxq/ZZHZnG84L/kqH/JH3IjMYKIuD8zfQ36mnSo/jbNfUpwoIU+VC8AAAAA0AGgCyAAIUWAIkUiZQDtubxbcR/1/uO2OI5vH9bEVf8AD/cdufU2Lfyel/e+txC1nxx+rqQAAuDlgF0IAVZmKzfto/efebUszFp8MUFTNhjVmo2mt21mKY5E8CTXpf8AaU2DeeJq7T+YCBhhUAAABZm2Q+gvYjFIE444YIU220klqbWrqFJ52NwxNItpxf4feTGEfo9fYBoCm3EwQAAFON5wfuVD/kj7kdicbzg/cqD/ACR9yI3GD5PzXsb9TTpUjxtmvqU4RFJcp8pl4AAAAAAFkNAsgAECFAFgAAfq8nsaiwTF/LxQuORMh6E2BZ23rtRokjlHgU+SpkOKU0KekyLoNfozJbEsXODOH0/QYCy0NqPh3uiLfIvnsqLmXRp1nLnaTCm3btyqi9Br/XuC59bUfFQ69wT82o+KjIbbAlYpuOGe5uzap4uDsL11+Rr3XuCfm1HxUfUvGcImx9GXilHFE8kpsPiY+0LKzP1uOGdvllm7VPzg7C9dTbVZrO6e26OK5Tckp8+sjxHC5ajcx9KbJvZ31ih9u4/K5LcoajDsQl0VRMijo5sSgtE7+Sbya7N6NLL2UmKZh5S1bFarVauVL+Ex2lFtlRU6Mui6HKeyPSo92re+xUMg6lxZNrqusuv/AJReA6nxb8srODF4Gvpj9Sf4nZPnLtiHr4RRPUQx/qbFvyus4MXgVYNi7dlhdZwYvA16/aW44nZPnLtiDhFE9RDh+TPJGolV0GI4rApfk30pci923o4t1tx2+V2FuM35VcoaiuxCbQU01y6SVE4GoXbyrWbfZuRQzMamYB0tEhNVyuXIl/Ce7Sq+ZETosmi65fIxseqx/CW1tiId3HjOESo3BMxSkhiWac1bP+z569wT82o+KjIUrIqIF2OGdvklm29qnVTB2F66mu9fYJ+bUfFQ69wT82o+KjIhofnHDPc3ZtU/eDsL11+RrU3lFgUmU44sVpmt0EfSb/RGe8pcceN4lDHLhigp5K6MuGLN3ziftPx1vBN4S4wJ+uS/er2oyHnVEvltmuqrm89tJ7JKkwpV/dEVVXpIikKmQh1QgCAFAyABFkVZDQiAGwqJsCAKQpABoVELoAAS5UANABoAF6atvRti9FewxOFfWXtRti9Few3DE1mnPc+8mMI/R6+wAA24mAAACrMxSa/5mZ7772bWjFJn3iZ7z72Ypjk/Tk/a/wC0psG88TV2nyADDCoBCiwAAAAJYoAAIUAE0KAAsgQAFCAAA0BEAEUIACxCjMAIlgVZAFh9NW3o2teivYZFguGzsVxiVSy4X0ekopkWkMKe1mu9xvGJ2VisgTUw5LNcrURdKt3V+tCVwie1XMYi5Uv8xoAU2YmyD2FIAVZmKTFaome++82pZmSY7hs3C8cnSJkLUEUTjlRf3Qt7PAxzHDKxXy0tHal2tVyKui9rdSlHg49qPexVyrb5XPzgLgwQqxfYAQAoAAAAAAIUAADQAiyAWxFAJoLMDQAX2AEQB7MMw2qxbEYKOlhXSi2uJ5QrVvsO3kcgsLglWqKqqmzNYoWoV+iszw83kuH6RiEy14lDLhT7G34HdG9YvMDabNUxs/OQ0iPeq2vmREVUzar3JSr1KMyOsKGtkS35OY8xMF/ErOIvAeYmCfi1nEXgdMC94F0PmjNhyt8prlFOZ8xMF/ErOIvALkJgifp1b7PKLwOmGh+pgZQ0/aM2DfKa5RTy4fh1FhlN5Chp4ZUD2xW2uJ9rzZ+fjnKaiwRKVFDFPqYldSYXay3xPQ/bRjNfPmVeK1NVNbccyY4m2+3YvhY4GHWETsGpCFAp7Ea590bkSzUS17JmvlS3mPVSpNJ2K50ZbomfpOmfOBiF30cPpktE4omT+IGI+oUvxi8TkxYxXh7X+dLsb+Cm3qlOTT5nW/xAxG33Cl+MXiRc4GIJ7cPpbe9EcloMxw9r3Ol2N/A3qlOTT5mpYDyno8bvJhgciphV3Kid+kt8L1P0q/DaHE6fyFdTwzoFlfY4XvTzRkFHUTKOvk1cmJqZKjUas9zNoW1X3m0YB4SPwlkosCoNRzmWR2RLOR17XTNfIt/NmJqqySSUVr4K2Rc3RY5rzFwS7aiq12KYvAeYuC/iVfEXgdKCh4GUPmjNh5N8prlFOZ8xMEt9pWcReA8xMF/ErOIvA6YDgZQ+aM2DfKa5RTlpvILCopThkVFVLj0icSiXwscTiuF1OEYjFSVKT1gjWUcO9Gvo4vnBlw+SoJlvrdKOG/ZsIXGBgXTJelvnpOGkN8O2bMqKqJZU13udSkVKO+OkKI66KcOgCaGAlYUAAAIAALIAAAhSACw0AAO15vPTxH2S/wBx3GhxHN59piPsl/uO3PqXFt5PS/v/AFuIWs+OP1dSAAFycsAFACMUmr/nj2/1PvNrRis37eP3n3mJ45P8JP3/ALCmwbzxNXafCABhpUAligAI2uH0F7EYojbIfQXsNvxNfvP+f3kxhH6PX2AAG3kwEAUAHGc4OyloNv8AXH3I7M4znB+7UHvx9yIvGF5PzXsb9bTpUfxtmvqU4S5QD5VLwhQAANANAABoAAQpAArsAoB2vN56eIrsl/uO3Mr5NY0sFxZzJqbp5q6E22a27GvZ/wCmkSMXwupkqdJxCmigeT8ok/g8j6RxZVmTfR2SixESJDV10VbLlcqoqaUy7SMrctESYWJbItuqx7AedV9B69TcWHxH0+g9epuLD4mi9+QOUTahx+5u0HoB5/p9B67TcWHxL9PoPXqbiw+I78gcom1B3N2g9CMUmtOdH7z7zR+UHKqhoqCZIoqiCfVRwuGFS4rqDtbXcZosjB8bNYlZuNLysu9HOh7pXWyom6tZL6cmXQVWD8tEhte96WRbW1XPpALIGQlCAAALo2yH0FbcjEnZpmj8nOVNDV4dKpq2ogkVUuFQPyjsplsmnlfsNcxTVeVk5iYlph6NWIjdzfIi7m+S+nLkJ+vyz4jGvYl7XvrOmB5+sMP9epuLD4jrCg9epuLD4m89+QOUTahKdzfoPQDz9YUHr1NxYfEdYUHr1NxYfEd+QOUTag7m/Qp6Uji+cL7rQe/H3I6ibi2FyJUUybiNLDCtfKJ/+mc8p8chxrEoYpCiVNJThl9JWcTecVtNDP8AGRW5OHRosr3RFiRLIiIt1yORVVeiybTr0WWiLMtiWyJfqPxARalR81FoAAAAAAANAABoCAFWQIigEsRwp6JlKAfKhVsl8B0V/avgfSAB89Fbl8CpQ2yXwKACW2ApACrYAgAAAAQliiwB89Fbl8D66K3L4FABOity+BOity+BdBYAJJLKwAsALFRCoAE0KACFA0ACyAAAIMhcAIpEUAAligAhQAQIDaAUizBUAAAAANAAQFIAUaAgAAAAKQoAAAABAmAUIAAaEGgALoRAoBAFkUAAEAGhSfqACgAAWJkUlwCky1CZQCLMpLlABNBYWAAKgARbwUlgCjQW2BZAEKiFQA0IkUgBQAATQDQWAKRBIAFIUAADUWAJbaUCwBAWwsACFFtgBEigWAJYoAAAsLAEKSwAKQoAAAsAAAAQqQAAAAB//9k=";
// Space Coin order quantities are token quantities. The product calls these
// "lots", so keep the mapping explicit and shared with the RPC contract.
const SPACE_COIN_TOKENS_PER_LOT = 1;

function isRainxCoin(coin) {
  const name = String(coin?.name || "");
  const symbol = String(coin?.symbol || coin?.ticker || "").replace(/\/USD$/i, "").toUpperCase();
  return /rainx/i.test(name) || symbol === "RXC";
}

function getCoinImage(coin) {
  return coin?.image_url || coin?.image || (isRainxCoin(coin) ? RAINX_LOGO_DATA_URL : coinArtwork);
}


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

function CoinList({ coins = COINS, onSelect, loaded = false }) {
  return (
    <section className="rx-space-section">
      <div className="rx-section-head">
        <h2>Top Space Coins</h2>
        <button>View All</button>
      </div>

      <div className="rx-coin-list">
        {coins.length ? coins.map((coin) => (
          <button className="rx-coin-row" key={coin.id || coin.ticker || coin.symbol} onClick={() => onSelect?.(coin)}>
            <img src={getCoinImage(coin)} alt="" onError={(e) => { e.currentTarget.src = coinArtwork; }} />
            <span className="rx-coin-name">
              <strong>{coin.name}</strong>
              <small>{coin.symbol || coin.ticker || "COIN"}</small>
            </span>
            <span className="rx-coin-value">
              <strong>{coin.price || (Number.isFinite(Number(coin.current_price)) ? "$" + formatPrice(coin.current_price) : "—")}</strong>
              <small className={Number(coin.price_change_24h) < 0 ? "red" : ""}>{coin.change || (Number.isFinite(Number(coin.price_change_24h)) ? (Number(coin.price_change_24h) >= 0 ? "+" : "") + Number(coin.price_change_24h).toFixed(2) + "%" : "—")}</small>
            </span>
          </button>
        )) : loaded ? <div className="rx-empty-coin-list">No Space Coins yet. Create one to see it here.</div> : <div className="rx-empty-coin-list">Loading Space Coins…</div>}
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

function SwipeArea({ mode, setMode, onMyCoins, onConnect, onProgress, onSwipeStateChange, coins, coinsLoaded, coinActivity = {}, onSelectCoin }) {
  const viewportRef = useRef(null);
  const start = useRef(null);
  const dragProgressRef = useRef(0);
  const [dragProgress, setDragProgress] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, axis: null, pointerId: e.pointerId };
    dragProgressRef.current = mode === "external" ? 1 : 0;
    setSwiping(false);
    onSwipeStateChange?.(false);
    setDragProgress(null);
  };
  const onPointerMove = (e) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (!start.current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      start.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (start.current.axis !== "x") return;
    if (!swiping) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setSwiping(true);
      onSwipeStateChange?.(true);
    }
    e.preventDefault();
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    const progress = mode === "external" ? 1 - dx / width : -dx / width;
    const boundedProgress = Math.max(0, Math.min(1, progress));
    dragProgressRef.current = boundedProgress;
    setDragProgress(boundedProgress);
    onProgress?.(boundedProgress);
  };
  const onPointerEnd = (e) => {
    if (!start.current) return;
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
          <CoinList coins={[...coins].sort((a,b) => { const A=coinActivity[a.id]||{}; const B=coinActivity[b.id]||{}; return (Number(B.trades||0)-Number(A.trades||0)) || (Number(B.realizedPnl||0)-Number(A.realizedPnl||0)); })} onSelect={onSelectCoin} loaded={coinsLoaded} />
          <Trending coins={[...coins].sort((a,b) => { const A=coinActivity[a.id]||{}; const B=coinActivity[b.id]||{}; return (Number(B.trades||0)-Number(A.trades||0)) || (Number(B.realizedPnl||0)-Number(A.realizedPnl||0)); })} />
        </div>

        <div className="rx-swipe-panel rx-external-slide">
          <ExternalPanel onConnect={onConnect} />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ mode, setMode, onCreate, onMenu, onMyCoins, onConnect, coins, coinsLoaded, coinActivity = {}, onSelectCoin }) {
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
            coinsLoaded={coinsLoaded}
            coinActivity={coinActivity}
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

async function normalizeCoinLogo(file) {
  if (!file) return null;
  const type = String(file.type || "").toLowerCase();
  if (!type || !/^image\/(png|jpe?g|jpg|webp)$/i.test(type)) {
    throw new Error("Choose a PNG, JPG or WEBP image.");
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("The selected image is empty or could not be read.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5MB or smaller.");
  // Capacitor WebViews can hand us a File-like Blob from the native picker whose
  // prototype is not the window.File constructor. Storage accepts the Blob directly.
  if (typeof file.arrayBuffer !== "function") throw new Error("The selected logo could not be read.");
  return file;
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
      let uploadedLogoPath = null;
      if (logo) {
        const preparedLogo = await normalizeCoinLogo(logo);
        const fileId = globalThis.crypto?.randomUUID?.() || Date.now() + "-" + Math.random().toString(36).slice(2);
        const ext = (preparedLogo.type.split("/")[1] || "jpeg").replace("jpeg", "jpg").replace("jpe", "jpg");
        uploadedLogoPath = user.id + "/" + fileId + "." + ext;
        const upload = await supabase.storage.from("space-coin-logos").upload(uploadedLogoPath, preparedLogo, { contentType: preparedLogo.type, cacheControl: "3600", upsert: false });
        if (upload.error) throw upload.error;
        image_url = supabase.storage.from("space-coin-logos").getPublicUrl(uploadedLogoPath).data.publicUrl;
      }
      const supply = Number(String(form.supply).replace(/,/g, ""));
      const totalSupply = supply > 0 ? supply : 1000000000;
      const initialPrice = 0.01;
      const { data, error: insertError } = await supabase.from("space_coins").insert({ creator_id: user.id, name: form.name.trim(), symbol: form.symbol.trim().toUpperCase(), description: form.description.trim(), network: form.network, total_supply: totalSupply, initial_price: initialPrice, current_price: initialPrice, market_cap: totalSupply * initialPrice, volume_24h: 0,
        token_reserve: totalSupply * 0.5,
        quote_reserve: totalSupply * 0.5 * initialPrice,
        image_url, status: "live" }).select("*").single();
      if (insertError) {
        if (uploadedLogoPath) await supabase.storage.from("space-coin-logos").remove([uploadedLogoPath]);
        throw insertError;
      }
      const { error: tickError } = await supabase.rpc("space_coin_seed_initial_tick", { p_coin_id: data.id, p_price: data.current_price });
      if (tickError) {
        await supabase.from("space_coins").delete().eq("id", data.id);
        if (uploadedLogoPath) await supabase.storage.from("space-coin-logos").remove([uploadedLogoPath]);
        throw tickError;
      }
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
              <label className="rx-upload" htmlFor="rx-coin-logo-input" aria-label="Upload Coin Logo">
                <input
                  id="rx-coin-logo-input"
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) return;
                    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type || "")) {
                      setError("Choose a PNG, JPG or WEBP image.");
                      e.target.value = "";
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
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
                <small>PNG, JPG or WEBP · Max 5MB</small>
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

        {coins.map((coin) => {
          const change = Number(coin.price_change_24h || 0);
          return (
            <div className="rx-mycoin" key={coin.id || coin.symbol}>
              <img src={getCoinImage(coin)} alt="" onError={(e) => { e.currentTarget.src = coinArtwork; }} />

              <div>
                <strong>{coin.name}</strong>
                <small>{coin.symbol}</small>
                <span>{Number(coin.market_cap || 0).toLocaleString()} · {Number(coin.holder_count || 0).toLocaleString()} holders</span>
              </div>

              <div className="rx-mycoin-price">
                <strong>{formatPrice(coin.current_price)}</strong>
                <small className={change < 0 ? "red" : ""}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </small>
              </div>
            </div>
          );
        })}
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

function MenuScreen({ onBack, onDashboard, onFunds, onSelect }) {
  const groups = [menuItems.slice(0, 2), menuItems.slice(2, 5), menuItems.slice(5)];
  const swipe = useHorizontalSwipe(undefined, onBack);
  return (
    <div className="rx-native-screen rx-menu-screen" {...swipe}>
      <style>{styles}</style>
      <div className="rx-menu-topbar"><button className="rx-native-back" onClick={onBack} aria-label="Back"><ArrowLeft size={24} /></button></div>
      <div className="rx-menu-content">
        <div className="rx-menu-feature-grid">
          <button className="rx-menu-feature" onClick={onDashboard}><span className="rx-menu-feature-icon"><Home size={25} /></span><strong>Dashboard</strong></button>
          <button className="rx-menu-feature" onClick={onFunds || onDashboard}><span className="rx-menu-feature-icon"><BriefcaseBusiness size={25} /></span><strong>Funds</strong></button>
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

function CoinPriceChart({ coin, range, timeframe = "15m", chartType, entryLines = [], onPriceChange, onEntryCoordinates }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const liveBarRef = useRef(null);
  const loadSeqRef = useRef(0);
  const entryPriceLinesRef = useRef(new Map());

  const RANGE_MS = useMemo(() => ({
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
    "3m": 90 * 24 * 60 * 60 * 1000,
  }), []);
  const BUCKET_SECONDS = useMemo(() => ({ "1m": 60, "3m": 3 * 60, "5m": 5 * 60, "10m": 10 * 60, "15m": 15 * 60, "30m": 30 * 60, "1h": 60 * 60, "2h": 2 * 60 * 60, "4h": 4 * 60 * 60, "1D": 24 * 60 * 60, "1W": 7 * 24 * 60 * 60, "1M": 30 * 24 * 60 * 60 }), []);
  const bucketSeconds = BUCKET_SECONDS[timeframe] || ({ "24h": 60, "7d": 5 * 60, "1m": 30 * 60, "3m": 60 * 60 }[range] || 60);

  const aggregate = useCallback((ticks, fallback) => {
    const map = new Map();
    const safeFallback = Number.isFinite(fallback) && fallback > 0 ? fallback : 0.000001;
    for (const row of ticks || []) {
      const rawTime = Math.floor(new Date(row.created_at || 0).getTime() / 1000);
      const open = Number(row.open ?? row.close ?? row.price);
      const close = Number(row.close ?? row.price ?? row.open);
      const high = Number(row.high ?? Math.max(open, close));
      const low = Number(row.low ?? Math.min(open, close));
      if (!Number.isFinite(rawTime) || rawTime <= 0) continue;
      if (![open, close, high, low].every(Number.isFinite)) continue;
      if (open <= 0 || close <= 0 || high <= 0 || low <= 0) continue;
      if (high < Math.max(open, close) || low > Math.min(open, close)) continue;
      const time = Math.floor(rawTime / bucketSeconds) * bucketSeconds;
      const previous = map.get(time);
      if (!previous) map.set(time, { time, open, high, low, close });
      else map.set(time, {
        time,
        open: previous.open,
        high: Math.max(previous.high, high),
        low: Math.min(previous.low, low),
        close,
      });
    }
    const bars = [...map.values()].sort((a, b) => a.time - b.time);
    if (bars.length) return bars;
    const now = Math.floor(Date.now() / 1000);
    const anchor = Math.floor(now / bucketSeconds) * bucketSeconds;
    return [{ time: anchor, open: safeFallback, high: safeFallback, low: safeFallback, close: safeFallback }];
  }, [bucketSeconds]);

  const publish = useCallback((price, data) => {
    onPriceChange?.(price, data);
  }, [onPriceChange]);

  const setSeriesData = useCallback((bars) => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series) return;
    if (chartType === "line") series.setData(bars.map((b) => ({ time: b.time, value: b.close })));
    else series.setData(bars);
    chart?.timeScale().fitContent();
  }, [chartType]);

  const updateEntryCoordinates = useCallback(() => {
    const series = seriesRef.current;
    if (!series) return;
    const next = {};
    for (const entry of entryLines || []) {
      const id = String(entry?.id || "");
      const price = Number(entry?.price);
      if (!id || !Number.isFinite(price) || price <= 0) continue;
      next[id] = series.priceToCoordinate?.(price) ?? null;
    }
    onEntryCoordinates?.(next);
  }, [entryLines, onEntryCoordinates]);

  const fetchTicks = useCallback(async (coinId, sinceIso, requestId) => {
    const rows = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      if (requestId !== loadSeqRef.current) return { data: [], error: null, stale: true };
      const { data, error } = await supabase.from("space_coin_ticks")
        .select("price,open,high,low,close,created_at")
        .eq("coin_id", coinId)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) return { data: rows, error, stale: false };
      if (!data?.length) break;
      rows.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
      if (rows.length >= 20000) break;
    }
    return { data: rows, error: null, stale: false };
  }, []);

  const priceDragRef = useRef(null);
  const priceScaleMarginsRef = useRef({ top: 0.08, bottom: 0.08 });
  const priceAxisFrameRef = useRef(null);
  const resetPriceScale = useCallback(() => {
    const scale = chartRef.current?.priceScale("right");
    if (!scale) return;
    priceScaleMarginsRef.current = { top: 0.08, bottom: 0.08 };
    scale.applyOptions({ autoScale: true, scaleMargins: priceScaleMarginsRef.current });
  }, []);
  const handlePriceAxisPointerDown = useCallback((e) => {
    e.stopPropagation?.();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const margins = priceScaleMarginsRef.current;
    priceDragRef.current = { startY: e.clientY, startMargin: (margins.top + margins.bottom) / 2, lastMargin: (margins.top + margins.bottom) / 2 };
  }, []);
  const handlePriceAxisPointerMove = useCallback((e) => {
    const drag = priceDragRef.current;
    if (!drag) return;
    e.stopPropagation?.();
    const scale = chartRef.current?.priceScale("right");
    const chartHeight = Math.max(1, containerRef.current?.clientHeight || 255);
    if (!scale) return;
    const delta = ((e.clientY - drag.startY) / chartHeight) * 0.85;
    const nextMargin = Math.max(0.01, Math.min(0.44, drag.startMargin + delta));
    if (Math.abs(nextMargin - drag.lastMargin) < 0.001) return;
    drag.lastMargin = nextMargin;
    priceScaleMarginsRef.current = { top: nextMargin, bottom: nextMargin };
    if (priceAxisFrameRef.current) cancelAnimationFrame(priceAxisFrameRef.current);
    priceAxisFrameRef.current = requestAnimationFrame(() => {
      if (priceDragRef.current !== drag || !chartRef.current) return;
      chartRef.current.priceScale("right").applyOptions({ autoScale: false, scaleMargins: priceScaleMarginsRef.current });
    });
    e.preventDefault?.();
  }, []);
  const handlePriceAxisPointerUp = useCallback((e) => {
    if (priceAxisFrameRef.current) cancelAnimationFrame(priceAxisFrameRef.current);
    priceDragRef.current = null;
    e.stopPropagation?.();
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);
  const load = useCallback(async () => {
    if (!coin?.id || !seriesRef.current) return;
    const requestId = ++loadSeqRef.current;
    const fallbackBeforeLoad = Number(coin.current_price || coin.initial_price || 0.000001);
    const immediateBars = aggregate([], fallbackBeforeLoad);
    try {
      setSeriesData(immediateBars);
      publish(fallbackBeforeLoad, immediateBars.map((b) => ({ time: b.time, value: b.close })));
    } catch (error) {
      console.warn("[SpaceCoins] immediate chart paint failed", error);
    }

    const since = new Date(Date.now() - RANGE_MS[range]).toISOString();
    const [ticksResult, latestResult] = await Promise.all([
      fetchTicks(coin.id, since, requestId),
      supabase.from("space_coins").select("current_price,initial_price,updated_at").eq("id", coin.id).maybeSingle(),
    ]);
    if (requestId !== loadSeqRef.current || ticksResult.stale || !seriesRef.current) return;

    const fallback = Number(latestResult.data?.current_price || coin.current_price || coin.initial_price || 0.000001);
    if (ticksResult.error) console.warn("[SpaceCoins] tick load failed", ticksResult.error);
    const bars = aggregate(ticksResult.data, fallback);
    liveBarRef.current = bars[bars.length - 1] || null;
    try {
      setSeriesData(bars);
      publish(bars[bars.length - 1]?.close || fallback, bars.map((b) => ({ time: b.time, value: b.close })));
    } catch (error) {
      console.warn("[SpaceCoins] chart update failed", error);
    }
  }, [coin, range, chartType, RANGE_MS, aggregate, publish, setSeriesData, fetchTicks]);

  // Create the chart before the data-loading effect below. React runs effects in
  // declaration order; doing this first fixes the initial blank-chart race.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const el = containerRef.current;
    const chart = createChart(el, {
      attributionLogo: false,
      width: el.clientWidth || 340,
      height: el.clientHeight || 255,
      layout: { background: { color: "#FFFFFF" }, textColor: "#8B8F94", fontFamily: "-apple-system,BlinkMacSystemFont,\"SF Pro Display\",\"SF Pro Text\",Arial,sans-serif", fontSize: 10 },
      grid: { vertLines: { color: "rgba(17,20,24,.045)", style: LineStyle.Dashed }, horzLines: { color: "rgba(17,20,24,.045)", style: LineStyle.Dashed } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: "#D7A21A", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#D7A21A" }, horzLine: { color: "#D7A21A", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#D7A21A" } },
      rightPriceScale: { borderVisible: false, mode: PriceScaleMode.Logarithmic, scaleMargins: { top: 0.08, bottom: 0.08 } },
      leftPriceScale: { visible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 3, barSpacing: 8, minBarSpacing: 2, rightBarStaysOnScroll: true },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: { time: true, price: true } },
    });
    const series = chartType === "line"
      ? chart.addAreaSeries({ lineColor: "#5D80D7", topColor: "rgba(117,147,223,.34)", bottomColor: "rgba(117,147,223,.06)", lineWidth: 2, priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: true, crosshairMarkerRadius: 4 })
      : chart.addCandlestickSeries({ upColor: "#2787D9", downColor: "#E64B4B", borderUpColor: "#2787D9", borderDownColor: "#E64B4B", wickUpColor: "#2787D9", wickDownColor: "#E64B4B", priceLineVisible: false, lastValueVisible: true });
    chartRef.current = chart;
    seriesRef.current = series;
    priceScaleMarginsRef.current = { top: 0.08, bottom: 0.08 };
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      chart.resize(r?.width || el.clientWidth || 340, r?.height || el.clientHeight || 255);
    });
    ro.observe(el);
    // TradingView-style behavior: every horizontal history move restores
    // automatic scaling from the candles currently in the visible range.
    const handleVisibleRangeChange = () => {
      const scale = chart.priceScale("right");
      if (!scale) return;
      priceScaleMarginsRef.current = { top: 0.08, bottom: 0.08 };
      scale.applyOptions({ autoScale: true, scaleMargins: priceScaleMarginsRef.current });
      requestAnimationFrame(() => {
        if (chartRef.current !== chart) return;
        chart.priceScale("right").applyOptions({ autoScale: true, scaleMargins: priceScaleMarginsRef.current });
        requestAnimationFrame(() => {
          if (chartRef.current !== chart) return;
          chart.priceScale("right").applyOptions({ autoScale: true, scaleMargins: priceScaleMarginsRef.current });
          updateEntryCoordinates();
        });
      });
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      loadSeqRef.current += 1;
    };
  }, [chartType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!coin?.id) return undefined;
    let active = true;
    const refreshLatest = async () => {
      const { data: row, error } = await supabase.from("space_coin_ticks")
        .select("price,open,high,low,close,created_at")
        .eq("coin_id", coin.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active || error || !row || !seriesRef.current) return;
      const close = Number(row.close ?? row.price);
      const rawTime = Math.floor(new Date(row.created_at || Date.now()).getTime() / 1000);
      if (!Number.isFinite(close) || close <= 0 || !Number.isFinite(rawTime) || rawTime <= 0) return;
      const time = Math.floor(rawTime / bucketSeconds) * bucketSeconds;
      try {
        if (chartType === "line") {
          seriesRef.current.update({ time, value: close });
          requestAnimationFrame(updateEntryCoordinates);
        } else {
          const previous = liveBarRef.current;
          const next = previous && previous.time === time
            ? { time, open: previous.open, high: Math.max(previous.high, close), low: Math.min(previous.low, close), close }
            : { time, open: previous?.close ?? close, high: Math.max(previous?.close ?? close, close), low: Math.min(previous?.close ?? close, close), close };
          liveBarRef.current = next;
          seriesRef.current.update(next);
          requestAnimationFrame(updateEntryCoordinates);
        }
        publish(close);
      } catch {}
    };
    refreshLatest();
    const timer = window.setInterval(refreshLatest, 5000);
    const channel = supabase.channel("space-coin-chart-" + coin.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "space_coin_ticks", filter: "coin_id=eq." + coin.id }, (payload) => {
        const row = payload.new || {};
        const close = Number(row.close ?? row.price);
        const rawTime = Math.floor(new Date(row.created_at || Date.now()).getTime() / 1000);
        const since = Math.floor((Date.now() - RANGE_MS[range]) / 1000);
        if (!Number.isFinite(close) || close <= 0 || !Number.isFinite(rawTime) || rawTime < since || !seriesRef.current) return;
        const time = Math.floor(rawTime / bucketSeconds) * bucketSeconds;
        try {
          if (chartType === "line") {
            seriesRef.current.update({ time, value: close });
            requestAnimationFrame(updateEntryCoordinates);
          } else {
            const previous = liveBarRef.current;
            const next = previous && previous.time === time
              ? { time, open: previous.open, high: Math.max(previous.high, close), low: Math.min(previous.low, close), close }
              : { time, open: previous?.close ?? close, high: Math.max(previous?.close ?? close, close), low: Math.min(previous?.close ?? close, close), close };
            liveBarRef.current = next;
            seriesRef.current.update(next);
            requestAnimationFrame(updateEntryCoordinates);
          }
          publish(close);
        } catch {}
      })
      .subscribe();
    return () => { active = false; window.clearInterval(timer); supabase.removeChannel(channel); };
  }, [coin?.id, range, chartType, RANGE_MS, bucketSeconds, publish, updateEntryCoordinates]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return undefined;

    for (const line of entryPriceLinesRef.current.values()) {
      try { series.removePriceLine(line); } catch {}
    }
    entryPriceLinesRef.current.clear();

    const coordinates = {};
    for (const entry of entryLines || []) {
      const id = String(entry?.id || "");
      const price = Number(entry?.price);
      if (!id || !Number.isFinite(price) || price <= 0) continue;

      const line = series.createPriceLine({
        price,
        color: entry?.side === "sell" ? "#E64B4B" : "#2D91E8",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: ""
      });

      entryPriceLinesRef.current.set(id, line);
      coordinates[id] = series.priceToCoordinate?.(price) ?? null;
    }

    requestAnimationFrame(updateEntryCoordinates);

    onEntryCoordinates?.(coordinates);

    return () => {
      for (const line of entryPriceLinesRef.current.values()) {
        try { series.removePriceLine(line); } catch {}
      }
      entryPriceLinesRef.current.clear();
    };
  }, [entryLines, chartType, onEntryCoordinates, updateEntryCoordinates]);

  return <div className="rx-real-chart-shell">
    <div ref={containerRef} className="rx-real-chart" aria-label={`${chartType === "line" ? "Live line" : "Live candlestick"} Space Coin price chart`} onDoubleClick={resetPriceScale} />
    <div
      className="rx-price-axis-gesture"
      aria-hidden="true"
      onPointerDown={handlePriceAxisPointerDown}
      onPointerMove={handlePriceAxisPointerMove}
      onPointerUp={handlePriceAxisPointerUp}
      onPointerCancel={handlePriceAxisPointerUp}
    />
  </div>;
}

function useSheetDrag(open, onClose, initial = 0.94) {
  const [progress, setProgress] = useState(open ? 0.08 : 0);
  const progressRef = useRef(open ? 0.08 : 0);
  const start = useRef(null);
  const frame = useRef(null);
  const openFrame = useRef(null);
  const [dragging, setDragging] = useState(false);

  const setProgressSafe = (value) => {
    const next = Math.max(0.08, Math.min(0.94, value));
    progressRef.current = next;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setProgress(next));
  };

  const onTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    start.current = { y: touch.clientY, x: touch.clientX, progress: progressRef.current };
    setDragging(true);
  };

  const onTouchMove = (e) => {
    const touch = e.touches?.[0];
    if (!start.current || !touch) return;

    const dy = start.current.y - touch.clientY;
    const dx = Math.abs(touch.clientX - start.current.x);

    // The sheet is vertically draggable from anywhere. Ignore horizontal movement.
    if (dx > Math.abs(dy) + 8) return;

    const height = Math.max(1, window.innerHeight || 800);
    setProgressSafe(start.current.progress + dy / height);

    // Do not let the WebView turn a sheet swipe into pull-to-refresh/page scrolling.
    if (e.cancelable) e.preventDefault();
  };

  const finish = (e) => {
    if (!start.current) return;

    const touch = e.changedTouches?.[0];
    const endY = touch?.clientY ?? start.current.y;
    const delta = endY - start.current.y;
    const current = progressRef.current;

    start.current = null;
    setDragging(false);

    // A downward swipe from the sheet dismisses it.
    if (delta > 90 && current < 0.50) {
      onClose?.();
      return;
    }

    const snapPoints = [0.42, 0.68, 0.94];
    const target = snapPoints.reduce((closest, point) =>
      Math.abs(point - current) < Math.abs(closest - current) ? point : closest
    , snapPoints[0]);
    setProgressSafe(target);
  };

  useEffect(() => {
    if (open) {
      if (openFrame.current) cancelAnimationFrame(openFrame.current);
      progressRef.current = 0.08;
      setProgress(0.08);
      setDragging(false);
      start.current = null;
      openFrame.current = requestAnimationFrame(() => {
        openFrame.current = requestAnimationFrame(() => setProgressSafe(initial));
      });
    }

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      if (openFrame.current) cancelAnimationFrame(openFrame.current);
    };
  }, [open, initial]);

  return {
    progress,
    dragging,
    bind: {
      onTouchStartCapture: onTouchStart,
      onTouchMoveCapture: onTouchMove,
      onTouchEndCapture: finish,
      onTouchCancelCapture: finish
    }
  };
}

function formatMoney(value, currency = "$") {
  const n = Number(value || 0);
  return `${n >= 0 ? currency : `-${currency}`}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "0.00";
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const precision = n.toPrecision(10);
  if (!/[eE]/.test(precision)) return precision.replace(/0+$/, "").replace(/\.$/, "");
  const exponent = Math.floor(Math.log10(n));
  const decimals = Math.min(18, Math.max(6, -exponent + 9));
  return n.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

function formatTradeValue(value, currency = "$") {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${currency}0.00`;
  const abs = Math.abs(n);
  // Never round a micro-coin order down to $0.00.
  if (abs > 0 && abs < 0.01) {
    const shown = abs.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
    return `${n < 0 ? "-" : ""}${currency}${shown}`;
  }
  return `${n < 0 ? "-" : ""}${currency}${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function OrderTabs({ active, setActive }) {
  const tabs = ["open", "pending", "closed"];
  const start = useRef(null);
  const finish = (e) => {
    if (!start.current) return;
    const dx = e.clientX - start.current;
    if (Math.abs(dx) > 55) {
      const index = tabs.indexOf(active);
      const next = dx < 0 ? Math.min(2, index + 1) : Math.max(0, index - 1);
      setActive(tabs[next]);
    }
    start.current = null;
  };
  return <div className="rx-order-tabs" onPointerDown={(e) => { start.current = e.clientX; }} onPointerUp={finish} onPointerCancel={finish}>
    {tabs.map((tab) => <button key={tab} className={active === tab ? "active" : ""} onClick={() => setActive(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}
  </div>;
}

function OrderSheet({ market, orders, pending, closed, livePrice, getPnl, initialTab = "open", onClose, onSelectOrder }) {
  const [active, setActive] = useState(initialTab);
  const sheet = useSheetDrag(true, onClose, 0.94);
  const rows = active === "open" ? orders : active === "pending" ? pending : closed;
  return <div className="rx-order-backdrop" onClick={onClose}>
    <section className="rx-order-sheet" style={{ transform: `translateY(${Math.max(0, (1 - sheet.progress) * 100)}%)`, transition: sheet.dragging ? "none" : "transform 420ms cubic-bezier(.16,1,.3,1)" }} onClick={(e) => e.stopPropagation()} {...sheet.bind}>
      <div className="rx-sheet-drag-handle" />
      <OrderTabs active={active} setActive={setActive} />
      <div className="rx-order-list">
        {rows.length ? rows.map((order) => {
          const price = active === "closed" ? Number(order.close_price || order.price) : Number(livePrice || order.price);
          const pnl = Number(getPnl ? getPnl(order) : (order.side === "buy" ? (price - order.price) * order.quantity : (order.price - price) * order.quantity));
          return <button key={order.id} className="rx-order-row" onClick={() => onSelectOrder(order)}>
            <span className={`rx-order-side ${order.side}`}>{order.side === "buy" ? "Buy" : "Sell"}</span>
            <div><strong>{market?.name || "Space Coin"}</strong><small>{order.side === "buy" ? "Buy" : "Sell"} · {Number(order.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })} lot</small></div>
            <b className={pnl >= 0 ? "profit" : "loss"}>{pnl >= 0 ? "+" : ""}{formatMoney(pnl)}</b>
          </button>;
        }) : <div className="rx-order-empty"><strong>{active === "pending" ? "No pending orders" : active === "closed" ? "No closed orders" : "No open orders"}</strong><span>{active === "pending" ? "Use the opportunity to trade on the world's major financial markets" : "Your Space Coin orders will appear here."}</span></div>}
      </div>
    </section>
  </div>;
}

function OrderDetailSheet({ market, order, livePrice, getPnl, onClose, onModify, onCloseOrder }) {
  const [view, setView] = useState("actions");
  const [stopLoss, setStopLoss] = useState(order.stop_loss ? String(order.stop_loss) : "");
  const [takeProfit, setTakeProfit] = useState(order.take_profit ? String(order.take_profit) : "");
  const [slOn, setSlOn] = useState(Boolean(order.stop_loss));
  const [tpOn, setTpOn] = useState(Boolean(order.take_profit));
  const [confirm, setConfirm] = useState(false);
  const sheet = useSheetDrag(true, onClose, 0.94);
  const isClosed = order.status === "closed";
  const price = Number(
    isClosed
      ? (order.close_price || livePrice || order.price)
      : (livePrice || order.price || order.close_price)
  );
  const pnl = Number(getPnl ? getPnl(order) : (order.side === "buy" ? (price - Number(order.price)) * Number(order.quantity) : (Number(order.price) - price) * Number(order.quantity)));
  const sideClass = order.side === "buy" ? "buy" : "sell";
  return <div className="rx-order-backdrop" onClick={onClose}>
    <section className="rx-order-detail-sheet" style={{ transform: `translateY(${Math.max(0, (1 - sheet.progress) * 100)}%)`, transition: sheet.dragging ? "none" : "transform 420ms cubic-bezier(.16,1,.3,1)" }} onClick={(e) => e.stopPropagation()} {...sheet.bind}>
      <div className="rx-sheet-drag-handle" />
      <div className="rx-order-detail-head"><strong>#{String(order.id).slice(0, 10)}</strong><button onClick={onClose}><X size={21} /></button></div>
      <div className="rx-order-detail-summary"><div><strong>{market?.name || "Space Coin"}</strong><small>{order.side === "buy" ? "Buy" : "Sell"} · {Number(order.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })} lots</small></div><b className={pnl >= 0 ? "profit" : "loss"}>{pnl >= 0 ? "+" : "-"}{formatMoney(Math.abs(pnl))}</b></div>
      {!isClosed && view === "actions" && <div className="rx-order-action-menu"><button className={`rx-order-action ${sideClass}`} onClick={() => setView("modify")}><strong>Edit order</strong><small>Modify position, Stop Loss and Take Profit</small><ChevronRight size={19} /></button><button className="rx-order-action close" onClick={() => setConfirm(true)}><strong>Close order</strong><small>Close at the current live market price</small><ChevronRight size={19} /></button></div>}
      {!isClosed && view === "modify" && <>
        <div className="rx-modify-head"><button onClick={() => setView("actions")}><ArrowLeft size={18} /> Back</button><strong>Modify position</strong></div>
        <div className="rx-order-detail-grid"><div><small>Entry price</small><strong>{fmtPrice(order.price)}</strong></div><div><small>Current price</small><strong>{fmtPrice(price)}</strong></div><div><small>Volume</small><strong>{Number(order.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })} lots</strong></div><div><small>Floating P/L</small><strong className={pnl >= 0 ? "profit" : "loss"}>{pnl >= 0 ? "+" : "-"}{formatMoney(Math.abs(pnl))}</strong></div></div>
        <div className="rx-order-setting"><span>Stop Loss</span><button className={`rx-switch ${slOn ? "on" : ""}`} onClick={() => setSlOn(!slOn)}><i /></button></div>
        {slOn && <input className="rx-order-input" inputMode="decimal" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="Stop loss price" />}
        <div className="rx-order-setting"><span>Take Profit</span><button className={`rx-switch ${tpOn ? "on" : ""}`} onClick={() => setTpOn(!tpOn)}><i /></button></div>
        {tpOn && <input className="rx-order-input" inputMode="decimal" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="Take profit price" />}
        <button className="rx-order-save" onClick={() => onModify(order.id, slOn ? Number(stopLoss) || null : null, tpOn ? Number(takeProfit) || null : null)}>Save changes</button>
        <button className="rx-order-close" onClick={() => setConfirm(true)}>Close order</button>
      </>}
      {isClosed && <div className="rx-closed-order-state"><Check size={28} /><strong>Order closed</strong><span>Closed at {fmtPrice(order.close_price)}</span><b className={pnl >= 0 ? "profit" : "loss"}>{pnl >= 0 ? "+" : "-"}{formatMoney(Math.abs(pnl))}</b></div>}
      {confirm && <div className="rx-close-confirm"><h3>Close position?</h3><div><span>Lot size</span><b>{Number(order.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}</b></div><div><span>Closing price</span><b>{fmtPrice(price)}</b></div><div><span>Profit / Loss</span><b className={pnl >= 0 ? "profit" : "loss"}>{pnl >= 0 ? "+" : "-"}{formatMoney(Math.abs(pnl))}</b></div><button onClick={() => onCloseOrder(order)}>Confirm close</button><button onClick={() => setConfirm(false)}>Cancel</button></div>}
    </section>
  </div>;
}

function ClosePositionSheet({ order, livePrice, getPnl, onClose, onConfirm }) {
  const sheet = useSheetDrag(Boolean(order), onClose, 0.94);
  if (!order) return null;
  const price = Number(livePrice || order.price);
  const pnl = Number(getPnl ? getPnl(order) : (order.side === "buy"
    ? (price - Number(order.price)) * Number(order.quantity)
    : (Number(order.price) - price) * Number(order.quantity)));
  return <div className="rx-close-position-backdrop" onClick={onClose}>
    <section
      className="rx-close-position-sheet"
      style={{ transform: `translateY(${Math.max(0, (1 - sheet.progress) * 100)}%)`, transition: sheet.dragging ? "none" : "transform 420ms cubic-bezier(.16,1,.3,1)" }}
      onClick={(e) => e.stopPropagation()}
      {...sheet.bind}
    >
      <div className="rx-sheet-drag-handle" />
      <h3>Close position #{String(order.id).slice(0, 9)}?</h3>
      <div><span>Lots</span><b>{Number(order.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}</b></div>
      <div><span>Closing price</span><b>{fmtPrice(price)}</b></div>
      <div><span>Profit</span><b className={pnl >= 0 ? "profit" : "loss"}>{pnl >= 0 ? "+" : "-"}{formatMoney(Math.abs(pnl))}</b></div>
      <button className="rx-close-position-confirm" onClick={() => onConfirm(order)}>Confirm</button>
      <button className="rx-close-position-cancel" onClick={onClose}>Cancel</button>
    </section>
  </div>;
}

function ChartTypeSheet({ value, onSelect, onClose }) {
  const sheet = useSheetDrag(true, onClose, 0.94);
  const options = [
    ["candles", "Candlesticks", CandlestickChart],
    ["line", "Line", BarChart3],
  ];
  return <div className="rx-chart-type-backdrop" onClick={onClose}>
    <section
      className="rx-chart-type-sheet"
      style={{ transform: `translateY(${Math.max(0, (1 - sheet.progress) * 100)}%)`, transition: sheet.dragging ? "none" : "transform 420ms cubic-bezier(.16,1,.3,1)" }}
      onClick={(e) => e.stopPropagation()}
      {...sheet.bind}
    >
      <div className="rx-sheet-drag-handle" />
      <h3>Chart type</h3>
      <div className="rx-chart-type-list">
        {options.map(([key, label, Icon]) => <button key={key} onClick={() => onSelect(key)}><span><Icon size={21} />{label}</span>{value === key && <Check size={25} strokeWidth={2.5} />}</button>)}
      </div>
    </section>
  </div>;
}

function TimeframeSheet({ value, onSelect, onClose }) {
  const sheet = useSheetDrag(true, onClose, 0.94);
  const options = [
    ["1m", "1 minute"],
    ["3m", "3 minutes"],
    ["5m", "5 minutes"],
    ["10m", "10 minutes"],
    ["15m", "15 minutes"],
    ["30m", "30 minutes"],
    ["1h", "1 hour"],
    ["2h", "2 hours"],
    ["4h", "4 hours"],
    ["1D", "1 day"],
    ["1W", "1 week"],
    ["1M", "1 month"]
  ];
  return <div className="rx-timeframe-backdrop" onClick={onClose}>
    <section
      className="rx-timeframe-sheet"
      style={{ transform: `translateY(${Math.max(0, (1 - sheet.progress) * 100)}%)`, transition: sheet.dragging ? "none" : "transform 420ms cubic-bezier(.16,1,.3,1)" }}
      onClick={(e) => e.stopPropagation()}
      {...sheet.bind}
    >
      <div className="rx-sheet-drag-handle" />
      <h3>Time frame</h3>
      <div className="rx-timeframe-list">
        {options.map(([key, label]) => <button key={key} onClick={() => onSelect(key)}><span>{label}</span>{value === key && <Check size={27} strokeWidth={2.5} />}</button>)}
      </div>
    </section>
  </div>;
}

function fmtPrice(value) { return formatPrice(value); }

function CreatorDashboard({ onBack, onManage, coin }) {
  const market = coin || null;
  const [range, setRange] = useState("24h");
  const [chartType, setChartType] = useState("candles");
  const [timeframe, setTimeframe] = useState("15m");
  const [timeframeOpen, setTimeframeOpen] = useState(false);
  const [chartMenuOpen, setChartMenuOpen] = useState(false);
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const [livePrice, setLivePrice] = useState(Number(market?.current_price || market?.initial_price || 0.000001));
  const [marketLiquidity, setMarketLiquidity] = useState({ tokenReserve: Number(market?.token_reserve || 0), quoteReserve: Number(market?.quote_reserve || 0) });
  const [chartData, setChartData] = useState([]);
  const [positionCoordinates, setPositionCoordinates] = useState({});
  const [trades, setTrades] = useState([]);
  const [account, setAccount] = useState(null);
  const [tradeSheet, setTradeSheet] = useState(null);
  const [ordersSheet, setOrdersSheet] = useState(false);
  const [ordersSheetTab, setOrdersSheetTab] = useState("open");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [closeConfirmOrder, setCloseConfirmOrder] = useState(null);
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [tradeQuote, setTradeQuote] = useState(null);
  const tradeSheetDrag = useSheetDrag(Boolean(tradeSheet), () => setTradeSheet(null), 0.94);

  const loadTrades = useCallback(async () => {
    if (!market?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    const { data } = await supabase.from("space_coin_trades").select("id,side,quantity,price,notional,created_at,status,close_price,closed_at,stop_loss,take_profit").eq("coin_id", market.id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setTrades(data || []);
  }, [market?.id]);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  useEffect(() => {
    if (!market?.id) return;
    let active = true;
    const loadAccount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !active) return;
      const accountKey = "real:" + user.id;
      const { data } = await supabase.from("space_coin_accounts").upsert({ user_id: user.id, account_key: accountKey, mode: "real" }, { onConflict: "account_key" }).select("*").single();
      if (active && data) setAccount(data);
    };
    loadAccount();
    return () => { active = false; };
  }, [market?.id]);

  const handlePriceChange = useCallback((price, data = null) => {
    setLivePrice(Number(price) || 0.000001);
    if (data) setChartData(data);
  }, []);

  const fmt = formatPrice;
  const pct = Number(market?.price_change_24h || 0);
  const initial = Number(market?.initial_price || market?.current_price || livePrice || 0.000001);
  const computedChange = initial ? ((livePrice - initial) / initial) * 100 : 0;
  const displayChange = Number.isFinite(computedChange) ? computedChange : pct;
  const high = chartData.length ? Math.max(...chartData.map((p) => p.value)) : livePrice;
  const low = chartData.length ? Math.min(...chartData.map((p) => p.value)) : livePrice;
  const openOrders = useMemo(() => trades.filter((trade) => (trade.status || "open") === "open"), [trades]);
  const pendingOrders = useMemo(() => trades.filter((trade) => trade.status === "pending"), [trades]);
  const closedOrders = useMemo(() => trades.filter((trade) => trade.status === "closed"), [trades]);
  const entryLines = useMemo(() => openOrders.map((order) => ({ id: order.id, price: order.price, side: order.side })), [openOrders]);
  const selectedPnl = (order) => {
    if (!order) return 0;
    const qty = Number(order.quantity);
    const entryNotional = Number(order.notional);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(entryNotional)) return 0;
    if (order.status === "closed") {
      const closePrice = Number(order.close_price || livePrice || order.price);
      return order.side === "buy"
        ? (closePrice - Number(order.price)) * qty
        : (Number(order.price) - closePrice) * qty;
    }
    const x = Number(marketLiquidity.tokenReserve);
    const y = Number(marketLiquidity.quoteReserve);
    if (x > 0 && y > 0) {
      const k = x * y;
      if (order.side === "buy") {
        const newX = x + qty;
        if (newX > 0) {
          const closeNotional = y - (k / newX);
          if (Number.isFinite(closeNotional)) return closeNotional - entryNotional;
        }
      } else if (qty < x) {
        const newX = x - qty;
        const closeNotional = (k / newX) - y;
        if (Number.isFinite(closeNotional)) return entryNotional - closeNotional;
      }
    }
    return 0;
  };

  useEffect(() => {
    let active = true;
    const qty = Number(amount);
    if (!market?.id || !tradeSheet || !Number.isFinite(qty) || qty <= 0) {
      setTradeQuote(null);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("quote_space_coin_trade", { p_coin_id: market.id, p_side: tradeSheet, p_quantity: qty });
      if (active) setTradeQuote(error ? null : data);
    }, 120);
    return () => { active = false; window.clearTimeout(timer); };
  }, [amount, tradeSheet, market?.id, livePrice]);

  const executeTrade = async () => {
    const quantity = Number(amount);
    if (!market?.id || !tradeSheet || !Number.isFinite(quantity) || quantity <= 0 || loadingTrade) return setNotice("Choose a valid lot size.");
    setLoadingTrade(true); setNotice("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Sign in to trade.");
      const accountKey = "real:" + user.id;
      const tokenQuantity = quantity * SPACE_COIN_TOKENS_PER_LOT;
      const { data: result, error } = await supabase.rpc("execute_space_coin_trade", { p_account_key: accountKey, p_mode: "real", p_coin_id: market.id, p_side: tradeSheet, p_quantity: tokenQuantity });
      if (error) throw error;
      const price = Number(result?.price || livePrice);
      const effectivePrice = Number(result?.market_price || result?.current_price || price);
      const notional = Number(result?.notional || tokenQuantity * price);
      const { data: latestAccount } = await supabase.from("space_coin_accounts").select("*").eq("account_key", accountKey).single();
      const { data: latestTrades } = await supabase.from("space_coin_trades").select("id,side,quantity,price,notional,created_at,status,close_price,closed_at,stop_loss,take_profit").eq("coin_id", market.id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
       setAccount(latestAccount
         ? { ...latestAccount, cash_balance: result?.cash_balance ?? latestAccount.cash_balance, token_balances: result?.token_balances ?? latestAccount.token_balances }
         : (account ? { ...account, cash_balance: result?.cash_balance ?? account.cash_balance, token_balances: result?.token_balances ?? account.token_balances } : account));
      setLivePrice(effectivePrice);
      setTrades(latestTrades || trades);
       setNotice(`${tradeSheet === "buy" ? "Buy" : "Sell"} order opened: ${fmt(quantity)} lots @ $${fmt(price)} · ${formatMoney(notional)}`);
      setAmount(""); setTradeSheet(null);
    } catch (error) { setNotice(error?.message || "Trade failed."); }
    finally { setLoadingTrade(false); }
  };

  const modifyOrder = async (id, stopLoss, takeProfit) => {
    const { data, error } = await supabase.from("space_coin_trades").update({ stop_loss: stopLoss, take_profit: takeProfit }).eq("id", id).select("*").single();
    if (error) return setNotice(error.message || "Unable to modify order.");
    setTrades((old) => old.map((row) => row.id === id ? data : row));
    setSelectedOrder(data);
    setNotice("Order modified.");
  };

  const closeOrder = async (order) => {
    if (!order?.id || !account?.id) return;
    const price = Number(livePrice);
    if (!Number.isFinite(price) || price <= 0) return setNotice("Live price is unavailable.");
    try {
      const { data, error } = await supabase.rpc("close_space_coin_trade", { p_trade_id: order.id, p_close_price: price });
      if (error) throw error;
      const latestAccount = await supabase.from("space_coin_accounts").select("*").eq("id", account.id).single();
      setAccount(latestAccount.data || (account ? { ...account, cash_balance: data?.cash_balance ?? account.cash_balance } : account));
      const closePrice = Number(data?.closing_price || data?.execution_price || price);
      setTrades((old) => old.map((row) => row.id === order.id ? (data?.trade || { ...row, status: "closed", close_price: closePrice, closed_at: new Date().toISOString() }) : row));
      setSelectedOrder(null); setOrdersSheet(false);
      const pnl = Number(data?.pnl ?? selectedPnl({ ...order, close_price: closePrice }));
      setNotice(`Order closed. ${pnl >= 0 ? "Profit" : "Loss"}: ${pnl >= 0 ? "+" : "-"}${formatMoney(Math.abs(pnl))}. Balance updated.`);
    } catch (error) { setNotice(error?.message || "Unable to close order."); }
  };

  // Read the shared market price. Server-side trade execution is the only price writer.
  useEffect(() => {
    if (!market?.id) return undefined;
    let active = true;
    const refreshMarketPrice = async () => {
      const { data } = await supabase.from("space_coins")
        .select("current_price,initial_price,updated_at,token_reserve,quote_reserve")
        .eq("id", market.id).maybeSingle();
      if (!active || !data) return;
      const next = Number(data.current_price || data.initial_price || 0.000001);
      if (Number.isFinite(next) && next > 0) setLivePrice(next);
      setMarketLiquidity({ tokenReserve: Number(data.token_reserve || 0), quoteReserve: Number(data.quote_reserve || 0) });
    };
    refreshMarketPrice();
    const timer = window.setInterval(refreshMarketPrice, 3000);
    const channel = supabase.channel("space-coin-market-" + market.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "space_coins", filter: "id=eq." + market.id }, (payload) => {
        const next = Number(payload.new?.current_price);
        if (Number.isFinite(next) && next > 0) setLivePrice(next);
        setMarketLiquidity({ tokenReserve: Number(payload.new?.token_reserve || 0), quoteReserve: Number(payload.new?.quote_reserve || 0) });
      }).subscribe();
    return () => { active = false; window.clearInterval(timer); supabase.removeChannel(channel); };
  }, [market?.id]);

  useEffect(() => {
    if (!market?.id) return;
    const channel = supabase.channel(`space-coin-trades-${market.id}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "space_coin_trades", filter: `coin_id=eq.${market.id}` }, () => loadTrades())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [market?.id, loadTrades]);

  useEffect(() => {
    if (!livePrice || !openOrders.length) return;
    openOrders.forEach((order) => {
      const sl = Number(order.stop_loss), tp = Number(order.take_profit);
      const hitSL = Number.isFinite(sl) && sl > 0 && (order.side === "buy" ? livePrice <= sl : livePrice >= sl);
      const hitTP = Number.isFinite(tp) && tp > 0 && (order.side === "buy" ? livePrice >= tp : livePrice <= tp);
      if (hitSL || hitTP) closeOrder(order);
    });
  }, [livePrice]);


  if (!market) return <main className="rx-native-screen"><style>{styles + createStyles + detailStyles}</style><NativeHeader title="Space Coin" onBack={onBack} /><div className="rx-native-scroll"><div className="rx-empty-coins"><strong>No Space Coins yet</strong><span>Create your first Space Coin and it will appear here.</span></div></div></main>;

  const primaryOrder = openOrders[0];
  const primaryPnl = primaryOrder ? selectedPnl(primaryOrder) : 0;
  const chartPullGuardRef = useRef(null);
  const handleChartTouchStart = useCallback((e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    chartPullGuardRef.current = { y: touch.clientY };
  }, []);
  const handleChartTouchMove = useCallback((e) => {
    const start = chartPullGuardRef.current;
    const touch = e.touches?.[0];
    const target = e.target instanceof Element ? e.target : null;
    if (!start || !touch || target?.closest?.("[class*=\"sheet\"]")) return;
    if (touch.clientY - start.y > 8 && e.cancelable) e.preventDefault();
  }, []);
  const handleChartTouchEnd = useCallback(() => { chartPullGuardRef.current = null; }, []);
  return <main
    className={`rx-native-screen rx-coin-detail-screen${chartFullscreen ? " rx-chart-fullscreen" : ""}`}
    style={{ overscrollBehaviorY: "none", overscrollBehaviorX: "none", touchAction: "pan-y" }}
    onTouchStart={handleChartTouchStart}
    onTouchMove={handleChartTouchMove}
    onTouchEnd={handleChartTouchEnd}
    onTouchCancel={handleChartTouchEnd}
  >
    <style>{styles + createStyles + detailStyles}</style>

    <header className="rx-detail-top">
      <button className="rx-detail-back" onClick={onBack} aria-label="Back"><ArrowLeft size={23} /></button>
      <button className="rx-detail-account" onClick={() => setOrdersSheet(true)} aria-label="Open real account">
        <span className="rx-real-pill">Real</span>
        <strong>${Number(account?.cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        <MoreVertical size={18} />
      </button>
      <span className="rx-detail-top-spacer" aria-hidden="true" />
    </header>
    {chartFullscreen && <button className="rx-fullscreen-account" onClick={() => setOrdersSheet(true)} aria-label="Open real account">
      <span className="rx-real-pill">Real</span>
      <strong>${Number(account?.cash_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      <MoreVertical size={18} />
    </button>}

    {!chartFullscreen && <div className="rx-chart-toolbar">
      <button className="rx-chart-one-click" aria-label="One-click trading"><span>ϟ</span><small>One-click</small></button>
      <div className="rx-chart-toolbar-spacer" />
      <button className="rx-chart-tool" onClick={() => setOrdersSheet(true)} aria-label="Alarm"><AlarmClockPlus size={24} /></button>
      <button className="rx-chart-tool" onClick={() => setChartFullscreen(true)} aria-label="Full chart view"><Maximize2 size={24} /></button>
      <button className="rx-chart-tool" onClick={() => primaryOrder && setSelectedOrder(primaryOrder)} aria-label="Chart settings"><Settings size={24} /></button>
      <button className="rx-chart-tool" onClick={() => setOrdersSheet(true)} aria-label="More"><MoreVertical size={25} /></button>
    </div>}

    <div className="rx-detail-scroll">
      {!chartFullscreen && <section className="rx-open-trades-card">
        <button className="rx-open-trades-side" onClick={() => { setOrdersSheetTab("open"); setOrdersSheet(true); }}><span>Open</span><b>{openOrders.length}</b></button>
        <button className="rx-open-trades-side" onClick={() => { setOrdersSheetTab("pending"); setOrdersSheet(true); }}><span>Pending</span><b>{pendingOrders.length}</b></button>
        <strong className={openOrders.reduce((sum, order) => sum + selectedPnl(order), 0) >= 0 ? "profit" : "loss"}>
          {(() => { const pnl = openOrders.reduce((sum, order) => sum + selectedPnl(order), 0); return `${pnl >= 0 ? "+" : "-"}${formatMoney(Math.abs(pnl))}`; })()}
        </strong>
        <button className="rx-open-trades-close" onClick={() => primaryOrder && setCloseConfirmOrder(primaryOrder)} disabled={!primaryOrder} aria-label="Close trade"><X size={30} /></button>
      </section>}

      <section className="rx-detail-chart-wrap">
        <div className="rx-chart-symbol">
          <span className="rx-chart-symbol-stack">
            <img src={getCoinImage(market)} alt="" onError={(e) => { e.currentTarget.src = coinArtwork; }} />
            <span className="rx-chart-flag" aria-hidden="true">🇺🇸</span>
          </span>
          <strong>{String(market.symbol || "RXC").replace(/\/USD$/i, "")}<span>/USD</span></strong>
          <ChevronDown size={18} />
        </div>
        <CoinPriceChart
          coin={market}
          range={range}
          timeframe={timeframe}
          chartType={chartType}
          entryLines={entryLines}
          onPriceChange={handlePriceChange}
          onEntryCoordinates={setPositionCoordinates}
        />
        {openOrders.map((order, index) => {
          const orderPnl = selectedPnl(order);
          const markerCoordinate = Number(positionCoordinates[String(order.id)]);
          const markerTop = Number.isFinite(markerCoordinate) ? Math.max(4, 36 + markerCoordinate - 12) : 4;

          return (
            <button
              key={order.id}
              className={`rx-position-marker ${order.side === "buy" ? "buy" : "sell"}`}
              style={{ top: `${markerTop}px`, zIndex: 8 + index }}
              onClick={() => setOrdersSheet(true)}
              aria-label={`Open position ${order.id}`}
            >
              <span>
                {Number(order.quantity).toLocaleString(undefined, {
                  maximumFractionDigits: 8
                })}
              </span>

              <b className={orderPnl >= 0 ? "profit" : "loss"}>
                {orderPnl >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(orderPnl))}
              </b>

              <i
                onClick={(e) => {
                  e.stopPropagation();
                  setCloseConfirmOrder(order);
                }}
                aria-label="Close trade"
              >
                <X size={13} />
              </i>
            </button>
          );
        })}
      </section>

      {!chartFullscreen && <div className="rx-chart-controls">
        <div className="rx-chart-control-wrap">
          <button className="rx-chart-control" onClick={() => { setTimeframeOpen(v => !v); setChartMenuOpen(false); }} aria-label="Select timeframe"><span>{timeframe}</span></button>
          {timeframeOpen && <TimeframeSheet value={timeframe} onSelect={(tf) => { setTimeframe(tf); setTimeframeOpen(false); }} onClose={() => setTimeframeOpen(false)} />}
        </div>
        <div className="rx-chart-control-wrap">
          <button className="rx-chart-control rx-chart-type-control" onClick={() => { setChartMenuOpen(v => !v); setTimeframeOpen(false); }} aria-label="Select chart type"><CandlestickChart size={20} /></button>
          {chartMenuOpen && <ChartTypeSheet value={chartType} onSelect={(type) => { setChartType(type); setChartMenuOpen(false); }} onClose={() => setChartMenuOpen(false)} />}
        </div>
        <button className="rx-chart-control rx-chart-fx" onClick={() => setOrdersSheet(true)} aria-label="Chart tools">ƒx</button>
      </div>}

      {notice && <div className="rx-detail-notice">{notice}</div>}
    </div>

    <div className="rx-detail-actions"><button className="rx-detail-sell" onClick={() => { setTradeSheet("sell"); setNotice(""); }}><span>Sell</span></button><button className="rx-detail-buy" onClick={() => { setTradeSheet("buy"); setNotice(""); }}><span>Buy</span></button></div>

    {chartFullscreen && <button className="rx-chart-fullscreen-exit" onClick={() => setChartFullscreen(false)} aria-label="Exit full chart"><Maximize2 size={21} /></button>}

    {tradeSheet && <div className="rx-trade-sheet-backdrop" onClick={() => setTradeSheet(null)}><section className="rx-trade-sheet" style={{ transform: `translateY(${Math.max(0, (1 - tradeSheetDrag.progress) * 100)}%)`, transition: tradeSheetDrag.dragging ? "none" : "transform 220ms cubic-bezier(.22,.61,.36,1)" }} onClick={(e) => e.stopPropagation()} {...tradeSheetDrag.bind}><div className="rx-trade-sheet-handle" /><h3>{tradeSheet === "buy" ? "Buy" : "Sell"} {market.symbol}</h3><p>Live price · ${fmt(livePrice)}</p><div className="rx-lot-label"><span>Volume, lots</span><span>Real account</span></div><div className="rx-lot-stepper"><button onClick={() => setAmount(String(Math.max(0.01, (Number(amount) || 0.01) - 0.01).toFixed(2)))}>−</button><input autoFocus type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.01" /><button onClick={() => setAmount(String(((Number(amount) || 0) + 0.01).toFixed(2)))}>+</button></div><div className="rx-lot-presets">{["0.01","0.05","0.10","1.00"].map((lot) => <button key={lot} className={amount === lot ? "active" : ""} onClick={() => setAmount(lot)}>{lot}</button>)}</div>{amount && <div className="rx-trade-preview"><span>Estimated value</span><strong>{tradeQuote ? `${fmt(Number(amount))} lots · ${formatTradeValue(Number(tradeQuote.notional))} @ $${fmt(Number(tradeQuote.execution_price))}` : `${fmt(Number(amount))} lots · calculating…`}</strong></div>}<button disabled={!amount || Number(amount) <= 0 || loadingTrade || !tradeQuote} className={tradeSheet === "buy" ? "confirm-buy" : "confirm-sell"} onClick={executeTrade}>{loadingTrade ? "Processing…" : `Confirm ${tradeSheet === "buy" ? "Buy" : "Sell"} ${amount || "0.00"} lots`}</button>{notice && <div className="rx-detail-notice">{notice}</div>}</section></div>}
    {ordersSheet && <OrderSheet market={market} orders={openOrders} pending={pendingOrders} closed={closedOrders} livePrice={livePrice} getPnl={selectedPnl} initialTab={ordersSheetTab} onClose={() => setOrdersSheet(false)} onSelectOrder={(order) => { setOrdersSheet(false); setSelectedOrder(order); }} />}
    {selectedOrder && <OrderDetailSheet market={market} order={selectedOrder} livePrice={livePrice} getPnl={selectedPnl} onClose={() => setSelectedOrder(null)} onModify={modifyOrder} onCloseOrder={closeOrder} />}
    {closeConfirmOrder && <ClosePositionSheet order={closeConfirmOrder} livePrice={livePrice} getPnl={selectedPnl} onClose={() => setCloseConfirmOrder(null)} onConfirm={async (order) => { setCloseConfirmOrder(null); await closeOrder(order); }} />}
  </main>;
}

const detailStyles = `
html:has(.rx-coin-detail-screen),body:has(.rx-coin-detail-screen),#root:has(.rx-coin-detail-screen){overscroll-behavior:none!important;overscroll-behavior-y:none!important;overflow:hidden!important}
.rx-coin-detail-screen{background:#fff!important;color:#111418;overscroll-behavior:none!important;overscroll-behavior-y:none!important;overscroll-behavior-x:none!important;touch-action:pan-y!important}
.rx-detail-top{height:76px;flex:0 0 76px;padding:calc(8px + env(safe-area-inset-top)) 15px 0;display:grid;grid-template-columns:42px minmax(0,1fr) 42px;align-items:center;gap:8px}
.rx-detail-back,.rx-detail-down{border:0;background:transparent;color:#111418;display:grid;place-items:center;padding:0;width:40px;height:40px}
.rx-detail-wallet{display:flex;align-items:center;gap:8px;font-size:14px;min-width:0}.rx-detail-wallet strong{font-size:15px}.rx-detail-lock{font-size:13px}.rx-detail-status{width:38px;height:38px;border-radius:50%;background:#eff9df;color:#78b735;display:grid;place-items:center;font-size:16px}
.rx-detail-account{justify-self:center;max-width:330px;min-width:0;height:44px;padding:0 12px 0 10px;border:1px solid #e2e5e7;border-radius:24px;background:#fff;display:flex;align-items:center;justify-content:center;gap:9px;color:#17191c;box-shadow:0 1px 3px rgba(17,20,24,.03)}.rx-real-pill{padding:4px 9px;border-radius:14px;background:#eef0f2;color:#17191c;font-size:12px;font-weight:500}.rx-detail-account strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px;font-weight:700;letter-spacing:-.2px}.rx-detail-account svg{flex:0 0 auto}.rx-detail-top-spacer{display:block;width:42px;height:1px}.rx-detail-wallet,.rx-detail-status,.rx-detail-down{display:none}
.rx-detail-scroll{position:relative;flex:1;min-width:0;width:100%;max-width:100%;box-sizing:border-box;min-height:0;overflow:hidden;padding:8px 16px calc(76px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch;overscroll-behavior:none;overscroll-behavior-y:none;overscroll-behavior-x:none;touch-action:pan-y;overscroll-behavior-block:none}
.rx-detail-hero-card,.rx-detail-coin-name,.rx-detail-price,.rx-detail-change{display:none}
.rx-real-chart-shell{position:absolute;inset:0;z-index:1;padding-top:36px;touch-action:none;overscroll-behavior:none;overscroll-behavior-y:none}.rx-real-chart{width:100%;height:100%;touch-action:none;overscroll-behavior:none}.rx-price-axis-gesture{position:absolute;z-index:24;top:36px;right:0;bottom:0;width:42px;touch-action:none;background:transparent}.rx-detail-range{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0 18px}.rx-detail-range button{height:39px;border:1px solid #e5e7eb;border-radius:20px;background:#fff;color:#8a8f96;font:700 10px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-detail-range button.active{border-color:#111418;color:#111418;box-shadow:inset 0 0 0 1px #111418}
.rx-detail-summary,.rx-detail-stat-card,.rx-detail-history-card{border-radius:20px;background:#fff;border:1px solid #edf0f2;box-shadow:0 6px 24px rgba(17,20,24,.04)}.rx-detail-summary{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#edf0f2;overflow:hidden}.rx-detail-summary>div{background:#fff;padding:15px}.rx-detail-summary span,.rx-detail-stat-card span{display:block;color:#8b9096;font-size:10px}.rx-detail-summary strong,.rx-detail-stat-card strong{display:block;margin-top:6px;font-size:14px}
.rx-detail-stat-card{display:grid;grid-template-columns:1fr 1fr;gap:0;overflow:hidden}.rx-detail-stat-card>div{padding:18px 15px;border-bottom:1px solid #edf0f2}.rx-detail-stat-card>div:nth-child(odd){border-right:1px solid #edf0f2}
.rx-detail-history-card{overflow:hidden}.rx-detail-history-row{min-height:67px;display:grid;grid-template-columns:45px 1fr auto;gap:10px;align-items:center;padding:10px 13px;border-bottom:1px solid #edf0f2}.rx-detail-history-row:last-child{border-bottom:0}.rx-detail-history-row>span{font-size:10px;font-weight:800}.rx-detail-history-row>span.buy{color:#d7a21a}.rx-detail-history-row>span.sell{color:#111418}.rx-detail-history-row strong,.rx-detail-history-row small{display:block}.rx-detail-history-row strong{font-size:11px}.rx-detail-history-row small{margin-top:4px;color:#8a8f95;font-size:8px}.rx-detail-history-row>b{font-size:10px}.rx-detail-empty-history{padding:25px 16px;color:#8a8f95;font-size:11px;text-align:center}
.rx-detail-actions{position:absolute;z-index:10;left:0;right:0;bottom:5px;height:72px;padding:5px 16px calc(5px + env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1fr;gap:10px;background:rgba(255,255,255,.96);border-top:1px solid #edf0f2;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.rx-detail-actions button{border:0;border-radius:17px;font:800 15px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-detail-buy{background:#2D91E8;color:#fff}.rx-detail-sell{background:#E64B4B;color:#fff}.rx-detail-bell{background:#eef2fa;color:#111418;display:grid;place-items:center}
.rx-detail-notice{margin:12px 0;padding:11px 12px;border-radius:12px;background:#f6f7f8;color:#4e555c;font-size:10px;line-height:1.45}
.rx-trade-sheet-backdrop{position:absolute;z-index:30;inset:0;background:rgba(17,20,24,.36);display:flex;align-items:flex-end}.rx-trade-sheet{width:100%;padding:10px 18px calc(18px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#fff;box-shadow:0 -15px 45px rgba(17,20,24,.18)}.rx-trade-sheet-handle{width:42px;height:4px;border-radius:9px;background:#d8dadd;margin:0 auto 15px}.rx-trade-sheet h3{margin:0;font-size:19px}.rx-trade-sheet p{margin:5px 0 16px;color:#81868c;font-size:10px}.rx-trade-sheet label{display:block;color:#5e646a;font-size:10px;font-weight:700}.rx-trade-sheet input{width:100%;height:48px;margin-top:7px;border:1px solid #e0e3e6;border-radius:13px;padding:0 13px;outline:0;font:600 15px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-trade-sheet>button{width:100%;height:50px;margin-top:12px;border:0;border-radius:14px;font:800 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-trade-sheet .confirm-buy{background:#F4D35E;color:#111418}.rx-trade-sheet .confirm-sell{background:#111418;color:#fff}
.rx-empty-coins{min-height:55vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;color:#747a80}.rx-empty-coins strong{font-size:17px;color:#111418}.rx-empty-coins span{font-size:11px;max-width:250px;line-height:1.5}
@media(max-width:430px){.rx-detail-price{font-size:35px}.rx-detail-scroll{padding-left:13px;padding-right:13px}.rx-detail-actions{padding-left:13px;padding-right:13px}}
/* Space Coin detail-only refinements: keep the existing screen/layout intact. */

.rx-chart-symbol{position:absolute;z-index:5;left:20px;top:8px;display:flex;align-items:center;gap:5px;font-size:16px;font-weight:700;color:#20252a;pointer-events:none}.rx-chart-symbol strong{display:flex;align-items:baseline;gap:1px}.rx-chart-symbol strong span{font-weight:500}.rx-chart-symbol-stack{width:30px;height:34px;position:relative;display:block;flex:0 0 30px}.rx-chart-symbol-stack img,.rx-chart-symbol-fallback{position:absolute;left:0;top:0;width:25px;height:25px;border-radius:50%;object-fit:cover;background:#f3f4f5;display:grid;place-items:center;font-size:11px;font-weight:800}.rx-chart-symbol-fallback{color:#b17e0b}.rx-chart-flag{position:absolute;left:7px;top:16px;width:19px;height:19px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:12px;line-height:1;overflow:hidden;box-shadow:0 0 0 1px #fff}
.rx-position-card{position:absolute;right:9px;top:10px;z-index:4;min-width:126px;border:0;border-radius:12px;padding:8px 10px;display:grid;grid-template-columns:auto 1fr;column-gap:7px;text-align:left;box-shadow:0 5px 18px rgba(17,20,24,.13);cursor:pointer}.rx-position-card span{font-size:9px;font-weight:800}.rx-position-card strong{font-size:9px}.rx-position-card b{grid-column:1/-1;margin-top:4px;font-size:13px}.rx-position-card.profit{background:#4bc98a;color:#fff}.rx-position-card.loss{background:#ef4b4b;color:#fff}
.rx-detail-wallet{border:0;background:transparent;color:#111418;padding:0;cursor:pointer;text-align:left;position:relative}.rx-detail-wallet em{font-style:normal;position:absolute;right:-10px;top:-8px;min-width:16px;height:16px;border-radius:8px;padding:0 4px;background:#d7a21a;color:#fff;font-size:8px;display:grid;place-items:center}
.rx-order-backdrop,.rx-trade-sheet-backdrop{touch-action:none;pointer-events:auto}.rx-order-backdrop{position:absolute;inset:0;z-index:45;background:rgba(17,20,24,.38);display:flex;align-items:flex-end}.rx-order-sheet,.rx-order-detail-sheet{width:100%;background:#fff;border-radius:26px 26px 0 0;box-shadow:0 -18px 50px rgba(17,20,24,.2);will-change:transform;touch-action:none;overflow:hidden;user-select:none;-webkit-user-select:none}.rx-order-sheet{height:72dvh}.rx-order-detail-sheet{height:82dvh;padding-bottom:calc(14px + env(safe-area-inset-bottom));overflow-y:auto;overflow-x:hidden;touch-action:none}.rx-sheet-drag-handle{width:42px;height:4px;border-radius:9px;background:#d8dadd;margin:10px auto 13px}.rx-order-tabs{height:55px;display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #e7e8ea}.rx-order-tabs button{border:0;border-bottom:3px solid transparent;background:#fff;color:#858a90;font:500 15px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-order-tabs button.active{color:#111418;border-bottom-color:#111418}.rx-order-list{height:calc(100% - 69px);overflow:auto;-webkit-overflow-scrolling:touch}.rx-order-row{width:100%;min-height:76px;border:0;border-bottom:1px solid #edf0f2;background:#fff;display:grid;grid-template-columns:48px 1fr auto;gap:9px;align-items:center;text-align:left;padding:10px 18px;cursor:pointer}.rx-order-side{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:10px;font-weight:800}.rx-order-side.buy{background:#eaf8f1;color:#39a878}.rx-order-side.sell{background:#fdeceb;color:#d94c4c}.rx-order-row strong,.rx-order-row small{display:block}.rx-order-row strong{font-size:13px}.rx-order-row small{margin-top:4px;color:#858a90;font-size:9px}.rx-order-row b{font-size:11px;text-align:right}.profit{color:#39ad7a!important}.loss{color:#d94c4c!important}.rx-order-empty{min-height:52vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:25px;color:#747a80}.rx-order-empty strong{font-size:17px;color:#111418}.rx-order-empty span{margin-top:8px;max-width:260px;font-size:11px;line-height:1.45}.rx-order-detail-head{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 18px}.rx-order-detail-head strong{font-size:16px}.rx-order-detail-head button{border:0;background:transparent;color:#111418}.rx-order-detail-summary{display:flex;justify-content:space-between;align-items:center;padding:12px 18px 15px}.rx-order-detail-summary strong,.rx-order-detail-summary small{display:block}.rx-order-detail-summary strong{font-size:16px}.rx-order-detail-summary small{margin-top:5px;color:#7f858b;font-size:10px}.rx-order-detail-summary>b{font-size:15px}.rx-order-detail-tabs{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #e6e8ea;margin:0 18px}.rx-order-detail-tabs button{height:44px;border:0;background:#fff;color:#858a90;border-bottom:3px solid transparent;font:500 11px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-order-detail-tabs button.active{color:#111418;border-bottom-color:#111418}.rx-order-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #edf0f2;margin:0 18px}.rx-order-detail-grid>div{padding:14px 0;border-bottom:1px solid #edf0f2}.rx-order-detail-grid>div:nth-child(odd){border-right:1px solid #edf0f2;padding-right:12px}.rx-order-detail-grid>div:nth-child(even){padding-left:12px}.rx-order-detail-grid small,.rx-order-detail-grid strong{display:block}.rx-order-detail-grid small{font-size:9px;color:#858a90}.rx-order-detail-grid strong{margin-top:5px;font-size:12px}.rx-order-setting{height:52px;margin:0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf0f2;font-size:13px}.rx-switch{width:45px;height:26px;border:0;border-radius:14px;background:#d2d5d8;padding:3px;display:flex;align-items:center;justify-content:flex-start}.rx-switch i{display:block;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.16)}.rx-switch.on{background:#d7a21a;justify-content:flex-end}.rx-order-input{display:block;width:calc(100% - 36px);height:42px;margin:8px 18px;border:1px solid #e0e3e6;border-radius:11px;padding:0 11px;outline:0;font:600 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-order-save,.rx-order-close{width:calc(100% - 36px);height:47px;margin:10px 18px 0;border:0;border-radius:13px;font:800 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-order-save{background:#f4d35e;color:#111418}.rx-order-close{background:#f2f3f5;color:#111418}.rx-close-confirm{position:absolute;left:12px;right:12px;bottom:12px;z-index:4;background:#fff;border-radius:22px;padding:20px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 8px 35px rgba(17,20,24,.2);border:1px solid #eceeef}.rx-close-confirm h3{margin:0 0 16px;font-size:19px}.rx-close-confirm>div{display:flex;justify-content:space-between;padding:8px 0;color:#737980;font-size:12px}.rx-close-confirm>div b{color:#111418}.rx-close-confirm button{width:100%;height:46px;border:0;border-radius:12px;margin-top:8px;font:800 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-close-confirm button:first-of-type{background:#f4d35e;color:#111418}.rx-close-confirm button:last-of-type{background:#f1f2f4;color:#111418}
.rx-trade-sheet{touch-action:none}.rx-trade-preview{display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding:9px 11px;border-radius:11px;background:#f5f6f7}.rx-trade-preview span{font-size:10px;color:#7f858b}.rx-trade-preview strong{font-size:12px}

.rx-detail-actions{height:68px;padding:4px 13px calc(4px + env(safe-area-inset-bottom));grid-template-columns:1fr 1fr;gap:8px}.rx-detail-actions button{height:54px;border-radius:15px;font-size:14px}.rx-trade-sheet{padding:9px 16px calc(14px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0}.rx-trade-sheet h3{font-size:18px}.rx-trade-sheet p{margin-bottom:13px}.rx-lot-label{display:flex;justify-content:space-between;align-items:center;color:#565c62;font-size:11px;font-weight:700;margin-bottom:7px}.rx-lot-label span:last-child{font-size:9px;color:#92979d;font-weight:600}.rx-lot-stepper{height:52px;border:1px solid #e0e3e6;border-radius:12px;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;overflow:hidden}.rx-lot-stepper button{height:100%;border:0;background:#fff;font-size:25px;color:#6f757b}.rx-lot-stepper input{width:100%;height:100%;border:0;text-align:center;outline:0;font:700 16px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-lot-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px}.rx-lot-presets button{height:31px;border:1px solid #e2e4e7;border-radius:9px;background:#fff;color:#777d83;font:700 10px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-lot-presets button.active{border-color:#111418;color:#111418;background:#f7f7f7}.rx-trade-preview{margin-top:8px;padding:8px 10px}.rx-trade-sheet>button{height:47px;margin-top:10px}.rx-trade-sheet>button:disabled{opacity:.45}
.rx-order-action-menu{padding:7px 18px 20px}.rx-order-action{width:100%;min-height:66px;margin-top:8px;border:1px solid #e9ebed;border-radius:15px;background:#fff;display:grid;grid-template-columns:1fr 22px;gap:2px;text-align:left;padding:13px 14px;align-items:center}.rx-order-action strong{font-size:14px;color:#111418}.rx-order-action small{font-size:9px;color:#858a90;grid-column:1}.rx-order-action svg{grid-column:2;grid-row:1 / span 2}.rx-order-action.close{background:#fafafa}.rx-order-action.close strong{color:#111418}.rx-modify-head{height:42px;padding:0 18px;display:flex;align-items:center;gap:18px;border-bottom:1px solid #edf0f2}.rx-modify-head button{border:0;background:transparent;display:flex;align-items:center;gap:5px;font:700 11px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-modify-head strong{font-size:15px}.rx-closed-order-state{min-height:38vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:#747a80}.rx-closed-order-state svg{color:#39ad7a}.rx-closed-order-state strong{font-size:18px;color:#111418}.rx-closed-order-state span{font-size:10px}.rx-closed-order-state b{font-size:18px}

.rx-detail-history-row strong{font-size:13px}.rx-detail-history-row small{font-size:10px}.rx-detail-history-row>b{font-size:12px}
/* Space Coins dashboard: reference-matched trading chrome only. */
.rx-chart-toolbar{height:64px;flex:0 0 64px;padding:0 4px 0 30px;display:flex;align-items:center;gap:0;background:#fff}
.rx-chart-toolbar-spacer{flex:1;min-width:0}
.rx-chart-one-click{display:flex;align-items:center;gap:8px;border:0;background:transparent;color:#b6b9bd;padding:0;font:500 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}
.rx-chart-one-click span{width:43px;height:28px;border-radius:16px;background:#d3d5d8;color:#fff;display:grid;place-items:center;font-size:15px}
.rx-chart-tool{width:34px;height:40px;flex:0 0 34px;border:0;background:transparent;color:#111418;display:grid;place-items:center;padding:0}
.rx-open-trades-card{height:38px;margin:0 0 4px;min-width:0;width:100%;box-sizing:border-box;border-radius:10px;background:#f7f8f8;display:flex;align-items:center;padding:0 7px 0 14px;gap:10px;overflow:hidden}
.rx-open-trades-side{display:flex;align-items:center;gap:8px;white-space:nowrap;border:0;background:transparent;padding:0;color:inherit;font:inherit;cursor:pointer}
.rx-open-trades-side span{font-size:14px;color:#20252a}
.rx-open-trades-side b{min-width:23px;width:23px;height:23px;flex:0 0 23px;border-radius:50%;background:#eef0f2;color:#353a40;display:grid;place-items:center;font-size:11px;font-weight:600}
.rx-open-trades-card>strong{margin-left:auto;min-width:0;flex:1;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:500}
.rx-open-trades-close{width:28px;height:28px;flex:0 0 28px;border:0;background:transparent;color:#df4d4d;display:grid;place-items:center;padding:0}
.rx-open-trades-close:disabled{opacity:.45}
.rx-detail-chart-wrap{height:calc(100% - 88px);min-height:0;max-height:none;position:relative;width:100%;max-width:100%;min-width:0;margin:0;overflow:hidden}
.rx-chart-symbol{position:absolute;z-index:25;left:12px;top:4px;display:flex;align-items:center;gap:5px;font-size:16px;font-weight:700;color:#20252a;pointer-events:none}
.rx-position-marker{position:absolute;left:0;right:auto;z-index:8;display:flex;align-items:stretch;height:24px;min-width:0;max-width:calc(100% - 40px);border:0;padding:0;background:transparent;filter:drop-shadow(0 2px 5px rgba(17,20,24,.10));cursor:pointer}
.rx-position-marker span{min-width:0;width:max-content;padding:0 7px;border-radius:6px 0 0 6px;display:grid;place-items:center;font:800 8px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;white-space:nowrap;color:#111418}
.rx-position-marker b{min-width:0;width:max-content;padding:0 7px;border:1px solid currentColor;border-left:0;border-radius:0;background:#fff;display:grid;place-items:center;font:800 8px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;white-space:nowrap}
.rx-position-marker i{width:25px;height:24px;border:1px solid currentColor;border-left:0;border-radius:0 6px 6px 0;background:#fff;color:#3f464d;display:grid;place-items:center}
.rx-position-marker.buy span{background:#2D91E8;color:#fff}.rx-position-marker.sell span{background:#E64B4B;color:#fff}
.rx-position-marker.buy b,.rx-position-marker.buy i{border-color:#2D91E8}.rx-position-marker.sell b,.rx-position-marker.sell i{border-color:#E64B4B}.rx-position-marker .profit{color:#39ad7a!important}.rx-position-marker .loss{color:#d94c4c!important}
.rx-chart-controls{position:absolute;z-index:30;left:13px;bottom:76px;display:flex;align-items:center;gap:6px;margin:0}
.rx-chart-control-wrap{position:relative}
.rx-chart-control{height:36px;min-width:50px;width:auto;padding:0 8px;border:0;border-radius:8px;background:#f3f4f5;color:#22272c;display:flex;align-items:center;justify-content:center;gap:4px;font:600 10px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;box-sizing:border-box;flex:0 0 auto}
.rx-chart-type-control{min-width:42px;width:42px;height:36px;padding:0}.rx-chart-fx{min-width:38px;width:38px;height:36px;font-size:15px;font-weight:500;padding:0}
.rx-chart-popover{position:absolute;z-index:30;left:0;bottom:49px;min-width:105px;padding:6px;border:1px solid #e5e7e9;border-radius:12px;background:#fff;box-shadow:0 8px 28px rgba(17,20,24,.14)}
.rx-chart-popover button{width:100%;height:34px;border:0;border-radius:8px;background:#fff;color:#4e555c;text-align:left;padding:0 10px;font:600 11px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}
.rx-chart-popover button.active{background:#f2f4f6;color:#111418}
.rx-chart-fullscreen .rx-detail-top{display:none}
.rx-chart-fullscreen .rx-detail-scroll{padding:0;position:absolute;inset:0;overflow:hidden;touch-action:none}
.rx-chart-fullscreen .rx-detail-chart-wrap{position:absolute;left:0;right:0;top:78px;bottom:136px;height:auto;margin:0;background:#fff}
.rx-chart-fullscreen .rx-real-chart-shell,.rx-chart-fullscreen .rx-real-chart{height:100%!important}
.rx-chart-fullscreen .rx-chart-symbol{top:18px;left:30px}
.rx-chart-fullscreen .rx-chart-controls{bottom:76px}
.rx-chart-fullscreen .rx-detail-actions{display:grid}
.rx-fullscreen-account{position:absolute;z-index:101;top:calc(12px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);height:44px;max-width:330px;min-width:0;padding:0 12px 0 10px;border:1px solid #e2e5e7;border-radius:24px;background:#fff;display:flex;align-items:center;justify-content:center;gap:9px;color:#17191c;box-shadow:0 1px 3px rgba(17,20,24,.03)}
.rx-fullscreen-account strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px;font-weight:700;letter-spacing:-.2px}.rx-fullscreen-account svg{flex:0 0 auto}
.rx-chart-fullscreen-exit{position:absolute;z-index:102;top:calc(12px + env(safe-area-inset-top));right:12px;left:auto;width:40px;height:40px;border:1px solid #dce1e5;border-radius:9px;background:#f5f6f7;color:#111418;display:grid;place-items:center}
.rx-close-position-backdrop,.rx-timeframe-backdrop,.rx-chart-type-backdrop{animation:rx-sheet-backdrop-in .22s ease-out both}.rx-close-position-backdrop,.rx-timeframe-backdrop,.rx-chart-type-backdrop{position:fixed;inset:0;z-index:70;background:rgba(17,20,24,.38);display:flex;align-items:flex-end;overflow:hidden;touch-action:none}.rx-close-position-sheet,.rx-timeframe-sheet,.rx-chart-type-sheet{width:100%;max-height:92dvh;background:#fff;border-radius:26px 26px 0 0;box-shadow:0 -18px 50px rgba(17,20,24,.22);will-change:transform;touch-action:none;overflow:hidden}.rx-close-position-sheet{padding:9px 31px calc(18px + env(safe-area-inset-bottom))}.rx-close-position-sheet h3{margin:16px 0 19px;font-size:21px;letter-spacing:-.3px}.rx-close-position-sheet>div{display:flex;align-items:center;justify-content:space-between;padding:7px 0;color:#747a80;font-size:14px}.rx-close-position-sheet>div b{color:#17191c;font-weight:500}.rx-close-position-confirm,.rx-close-position-cancel{width:100%;height:48px;border:0;border-radius:11px;margin-top:13px;font:500 14px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-close-position-confirm{background:#F4D35E;color:#111418}.rx-close-position-cancel{margin-top:9px;background:#f1f2f4;color:#272b2f}.rx-timeframe-sheet{height:min(78dvh,720px);padding:9px 0 calc(14px + env(safe-area-inset-bottom));display:flex;flex-direction:column}.rx-timeframe-sheet h3{margin:22px 31px 18px;font-size:25px;letter-spacing:-.4px}.rx-timeframe-list{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch}.rx-timeframe-list button{width:100%;height:59px;padding:0 31px;border:0;background:#fff;color:#17191c;display:flex;align-items:center;justify-content:space-between;text-align:left;font:400 16px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-timeframe-list button:active{background:#f7f7f7}.rx-timeframe-list button svg{flex:0 0 auto;color:#17191c}
.rx-chart-type-sheet{padding:9px 0 calc(14px + env(safe-area-inset-bottom));display:flex;flex-direction:column}
.rx-chart-type-sheet h3{margin:22px 31px 18px;font-size:25px;letter-spacing:-.4px}.rx-chart-type-list{padding-bottom:8px}.rx-chart-type-list button{width:100%;height:59px;padding:0 31px;border:0;background:#fff;color:#17191c;display:flex;align-items:center;justify-content:space-between;text-align:left;font:400 16px -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.rx-chart-type-list button span{display:flex;align-items:center;gap:14px}.rx-chart-type-list button:active{background:#f7f7f7}
.rx-chart-fullscreen-exit{position:absolute;z-index:100;top:calc(14px + env(safe-area-inset-top));left:12px;width:40px;height:40px;border:0;border-radius:20px;background:#f2f3f4;color:#111418;display:grid;place-items:center}

`;

const liquidityDashboardStyles = `
.rx-liquidity-dashboard{background:#fbfbfa!important;color:#17191c}
.rx-liquidity-dashboard .rx-liquidity-topbar{height:72px;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;padding:calc(8px + env(safe-area-inset-top)) 16px 0;background:#fff;border-bottom:1px solid #edf0f2}
.rx-liquidity-dashboard .rx-liquidity-topbar h1{margin:0;text-align:center;font:700 18px -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;letter-spacing:-.3px}
.rx-liquidity-dashboard .rx-liquidity-topbar button{width:40px;height:40px;border:0;background:transparent;color:#17191c;display:grid;place-items:center;padding:0}
.rx-liquidity-dashboard .rx-native-scroll{padding:14px 16px calc(30px + env(safe-area-inset-bottom));overflow-y:auto}
.rx-liquidity-dashboard .rx-liquidity-tabs{height:46px;margin:0 0 14px}
.rx-liquidity-dashboard .rx-liquidity-tabs button{font-size:12px}
.rx-liquidity-dashboard .rx-liquidity-art,.rx-liquidity-dashboard .rx-pool-card,.rx-liquidity-dashboard .rx-form-card{border-radius:16px;border-color:#e7e9eb;box-shadow:0 3px 14px rgba(17,20,24,.035)}
.rx-liquidity-dashboard .rx-liquidity-art{height:150px;padding:18px}
.rx-liquidity-dashboard .rx-liquidity-art strong{font-size:15px;letter-spacing:-.15px}
.rx-liquidity-dashboard .rx-liquidity-art small{font-size:11px}
.rx-liquidity-dashboard .rx-orbit-art{right:34px;bottom:18px;transform:rotate(-12deg) scale(1.12)}
.rx-liquidity-dashboard .rx-pool-card,.rx-liquidity-dashboard .rx-form-card{padding:16px}
.rx-liquidity-dashboard .rx-pool-card h3,.rx-liquidity-dashboard .rx-form-card h3{font-size:13px;margin-bottom:14px}
.rx-liquidity-dashboard .rx-pool-card>small{font-size:10px;color:#777}
.rx-liquidity-dashboard .rx-pool-card>div{gap:18px 24px;margin-top:16px}
.rx-liquidity-dashboard .rx-pool-card p small{font-size:10px}
.rx-liquidity-dashboard .rx-pool-card p strong{font-size:14px}
.rx-liquidity-dashboard .rx-form-card label{font-size:10px;margin:14px 0;color:#62676d}
.rx-liquidity-dashboard .rx-form-card input{height:42px;border-radius:10px;font-size:13px}
.rx-liquidity-dashboard .rx-form-card>small{font-size:10px}
.rx-liquidity-dashboard .rx-gold-cta,.rx-liquidity-dashboard .rx-danger-cta{height:44px;border-radius:11px;font-size:12px;font-weight:800}
.rx-liquidity-dashboard .rx-warning{font-size:11px;border-radius:13px;padding:13px;margin-bottom:14px}
.rx-liquidity-dashboard .rx-receive p{padding:12px;border-radius:10px}
.rx-liquidity-dashboard .rx-receive small{font-size:10px}
.rx-liquidity-dashboard .rx-receive strong{font-size:14px}
.rx-liquidity-dashboard .rx-receive em{font-size:10px}
.rx-liquidity-dashboard .rx-slider-labels{font-size:10px}
`;

function LiquidityScreen({ onBack, remove = false, coin = null, dashboard = false, onMenu, onConnect }) {
  const [activeRemove, setActiveRemove] = useState(remove);
  const [dragX, setDragX] = useState(0);
  const swipe = useHorizontalSwipe(() => { setActiveRemove(true); setDragX(0); }, () => { setActiveRemove(false); setDragX(0); }, (dx) => setDragX(Math.max(-window.innerWidth, Math.min(window.innerWidth, dx))));
  const trackStyle = { transform: "translate3d(calc(" + (activeRemove ? -50 : 0) + "% + " + dragX + "px),0,0)", transition: dragX === 0 ? "transform .28s cubic-bezier(.2,.8,.2,1)" : "none" };
  const symbol = String(coin?.symbol || "RXC").replace(/\/USD$/i, "");
  return <><style>{styles + liquidityDashboardStyles}</style><div className={"rx-native-screen rx-liquidity-screen" + (dashboard ? " rx-liquidity-dashboard" : "")} {...swipe}>
    {dashboard ? <header className="rx-liquidity-topbar"><button onClick={onMenu} aria-label="Open menu"><Menu size={22} /></button><h1>Liquidity</h1><span /></header> : <NativeHeader title="Manage Liquidity" onBack={onBack} right={<CircleHelp size={18} />} />}
    <div className="rx-native-scroll"><div className="rx-liquidity-tabs"><button className={!activeRemove ? "active" : ""} onClick={() => { setActiveRemove(false); setDragX(0); }}>Add Liquidity</button><button className={activeRemove ? "active" : ""} onClick={() => { setActiveRemove(true); setDragX(0); }}>Remove Liquidity</button></div><div className="rx-liquidity-swipe"><div className="rx-liquidity-track" style={trackStyle}><div className="rx-liquidity-panel"><AddLiquidity coin={coin} symbol={symbol} onConnect={onConnect} /></div><div className="rx-liquidity-panel"><RemoveLiquidity coin={coin} symbol={symbol} onConnect={onConnect} /></div></div></div></div>
  </div></>;
}
function AddLiquidity({ coin, symbol = "RXC", onConnect }) {
  const price = Number(coin?.current_price || coin?.initial_price || 0);
  const tokenReserve = Number(coin?.token_reserve || 0);
  const quoteReserve = Number(coin?.quote_reserve || 0);
  const [tokenAmount, setTokenAmount] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const format = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const updateToken = (value) => { setTokenAmount(value); const amount = Number(value); setQuoteAmount(Number.isFinite(amount) && amount > 0 && price > 0 ? (amount * price).toFixed(2) : ""); };
  const updateQuote = (value) => { setQuoteAmount(value); const amount = Number(value); setTokenAmount(Number.isFinite(amount) && amount > 0 && price > 0 ? (amount / price).toFixed(2) : ""); };
  return <><div className="rx-liquidity-art"><strong>{symbol} Liquidity Pool</strong><small>{symbol} / USDT</small><div className="rx-orbit-art"><Droplets size={58} /></div></div><div className="rx-pool-card"><h3>Pool Balance</h3><div><p><small>{symbol}</small><strong>{format(tokenReserve)}</strong></p><p><small>USDT</small><strong>{format(quoteReserve)}</strong></p><p><small>Price</small><strong>{price > 0 ? formatPrice(price) : "—"}</strong></p><p><small>Pool Share</small><strong>{coin ? "100%" : "—"}</strong></p></div></div><div className="rx-form-card"><h3>Add Liquidity</h3><label>Amount of {symbol}<span>Balance: {format(tokenReserve)}</span><input value={tokenAmount} onChange={(e) => updateToken(e.target.value)} inputMode="decimal" placeholder="0.00" /></label><label>Amount of USDT<span>Balance: {format(quoteReserve)}</span><input value={quoteAmount} onChange={(e) => updateQuote(e.target.value)} inputMode="decimal" placeholder="0.00" /></label><small>{price > 0 ? "1 " + symbol + " = " + formatPrice(price) + " USDT" : "Connect a wallet to view the pool price"}</small><button type="button" className="rx-gold-cta" onClick={onConnect}>Connect Wallet</button></div></>;
}
function RemoveLiquidity({ coin, symbol = "RXC", onConnect }) {
  const tokenReserve = Number(coin?.token_reserve || 0);
  const quoteReserve = Number(coin?.quote_reserve || 0);
  const [percent, setPercent] = useState(50);
  const format = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const tokenOut = tokenReserve * percent / 100;
  const quoteOut = quoteReserve * percent / 100;
  return <><div className="rx-warning"><ShieldCheck size={17} /><span>Removing liquidity will reduce your pool share and may affect price stability.</span></div><div className="rx-pool-card"><h3>Your Liquidity</h3><small>{symbol} / USDT</small><div><p><small>Pool Share</small><strong>{coin ? "100%" : "—"}</strong></p><p><small>LP Tokens</small><strong>{coin ? format(Math.sqrt(Math.max(0, tokenReserve * quoteReserve))) : "—"}</strong></p></div></div><div className="rx-form-card"><h3>You Will Receive</h3><div className="rx-receive"><p><small>{symbol}</small><strong>{format(tokenOut)}</strong><em>Pool share: {percent}%</em></p><p><small>USDT</small><strong>{format(quoteOut)}</strong><em>Pool share: {percent}%</em></p></div><div className="rx-slider"><span style={{ width: percent + "%" }} /><b>{percent}%</b></div><input aria-label="Liquidity percentage" type="range" min="0" max="100" step="1" value={percent} onChange={(e) => setPercent(Number(e.target.value))} style={{ width: "100%", accentColor: "#c89112" }} /><div className="rx-slider-labels"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>MAX</span></div><button type="button" className="rx-danger-cta" onClick={onConnect}>Connect Wallet</button></div></>;
}

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
  object-fit:cover;flex:none;display:block;background:#FDD102
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
.rx-coin-value small.red{color:#D94C4C}

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
.rx-mycoin>img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#FDD102}
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
  justify-content:center;background:#FAFAFA;cursor:pointer;touch-action:manipulation;
  -webkit-tap-highlight-color:transparent
}
.rx-upload input{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;cursor:pointer;z-index:5}
.rx-upload-circle{
  width:72px;height:72px;border-radius:50%;display:grid;
  place-items:center;background:#FFF7DA;color:#D7A21A;
  overflow:hidden;margin-bottom:8px
}
.rx-upload-circle img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
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
@keyframes rx-sheet-backdrop-in{from{opacity:0}to{opacity:1}}
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
  const [coinActivity, setCoinActivity] = useState({});
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [coinsLoaded, setCoinsLoaded] = useState(false);

  const handleNativeBack = useCallback(() => {
    if (overlay) {
      setOverlay(null);
      return true;
    }
    const previousScreen = {
      create: "dashboard",
      menu: "dashboard",
      creator: "dashboard",
      "liquidity-dashboard": "menu",
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

  const loadRegistry = useCallback(async () => {
    const { data, error } = await supabase.from("space_coins").select("*").eq("status", "live").order("created_at", { ascending: false });
    if (error) return;
    setCoins(data || []);
    setCoinsLoaded(true);
  }, []);

  const loadActivity = useCallback(async (coinIds) => {
    const ids = (coinIds || []).filter(Boolean);
    if (!ids.length) { setCoinActivity({}); return; }
    const { data } = await supabase.from("space_coin_trades").select("coin_id,side,quantity,price,close_price,status").in("coin_id", ids).order("created_at", { ascending: false }).limit(1000);
    const stats = {};
    (data || []).forEach((trade) => {
      const key = trade.coin_id;
      if (!stats[key]) stats[key] = { trades: 0, realizedPnl: 0 };
      stats[key].trades += 1;
      if (trade.status === "closed" && trade.close_price != null) {
        const pnl = (Number(trade.close_price) - Number(trade.price)) * Number(trade.quantity) * (trade.side === "buy" ? 1 : -1);
        stats[key].realizedPnl += Number.isFinite(pnl) ? pnl : 0;
      }
    });
    setCoinActivity(stats);
  }, []);

  useEffect(() => {
    let active = true;
    const start = async () => {
      await loadRegistry();
      if (!active) return;
      const { data } = await supabase.from("space_coins").select("id").eq("status", "live");
      if (active) loadActivity((data || []).map((coin) => coin.id));
    };
    start();
    const coinChannel = supabase.channel("space-coins-registry")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "space_coins" }, (payload) => {
        if (payload.new?.status === "live") setCoins((old) => [payload.new, ...old.filter((c) => c.id !== payload.new.id)]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "space_coins" }, (payload) => {
        setCoins((old) => {
          const next = old.filter((c) => c.id !== payload.new?.id);
          return payload.new?.status === "live" ? [payload.new, ...next] : next;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "space_coins" }, (payload) => setCoins((old) => old.filter((c) => c.id !== payload.old?.id)))
      .subscribe();
    const tradeChannel = supabase.channel("space-coins-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "space_coin_trades" }, async () => {
        const { data } = await supabase.from("space_coins").select("id").eq("status", "live");
        loadActivity((data || []).map((coin) => coin.id));
      }).subscribe();
    return () => { active = false; supabase.removeChannel(coinChannel); supabase.removeChannel(tradeChannel); };
  }, [loadRegistry, loadActivity]);

  useEffect(() => {
    try { sessionStorage.removeItem("rainx-space-screen"); } catch {}
  }, []);

  if (screen === "create") {
    return <CreateCoin onBack={() => setScreen("dashboard")} onCreated={(coin) => { setCoins((current) => [coin, ...current.filter((item) => item.id !== coin.id)]); setScreen("dashboard"); }} />;
  }
  if (screen === "menu") {
    return <MenuScreen onBack={() => setScreen("dashboard")} onDashboard={() => setScreen("liquidity-dashboard")} onFunds={() => setScreen("creator")} onSelect={(label) => setScreen({ "Token Settings": "token-settings", Analytics: "analytics", Holders: "holders", Transactions: "transactions", Notifications: "notifications" }[label] || "menu")} />;
  }
  if (screen === "liquidity-dashboard") {
    const activeCoin = selectedCoin || coins[0] || null;
    return <>
      <LiquidityScreen dashboard coin={activeCoin} onBack={() => setScreen("menu")} onMenu={() => setScreen("menu")} onConnect={() => setOverlay("wallet")} />
      {overlay === "wallet" && <WalletSheet onClose={() => setOverlay(null)} />}
    </>;
  }
  if (screen === "creator") {
    const activeCoin = selectedCoin || coins[0] || null;
    if (!activeCoin && !coinsLoaded) {
      return <main className="rx-native-screen"><style>{styles + createStyles + detailStyles}</style><NativeHeader title="Space Coin" onBack={() => setScreen("dashboard")} /><div className="rx-native-scroll"><div className="rx-empty-coins"><strong>Loading Space Coin…</strong><span>Syncing your live Space Coin market.</span></div></div></main>;
    }
    return <CreatorDashboard coin={activeCoin} onBack={() => setScreen("dashboard")} onManage={() => setScreen("liquidity-manage")} />;
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
        coinsLoaded={coinsLoaded}
        coinActivity={coinActivity}
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

