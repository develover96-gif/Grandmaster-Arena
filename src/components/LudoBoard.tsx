'use client';

import { useMemo, useState } from 'react';
import Dice3D from './Dice3D';
import {
  TRACK_SET,
  HOME_OF,
  START_OF,
  SAFE,
  cellOfRoute,
  inYard
} from '../lib/ludoEngine';

const N = 15;
const step = 100 / N;
const ARROWS: Record<string, [string, string]> = {
  '7,0': ['right', '#4a4a5c'],
  '0,7': ['down', '#1fe0ff'],
  '7,14': ['left', '#4a4a5c'],
  '14,7': ['up', '#ff2e88']
};
const COLORS: Record<string, string> = { pink: '#ff2e88', cyan: '#1fe0ff' };

/* ---- shared SVG shapes (ported from prototype) ---- */

const PALETTES: any = {
  pink:   {hi:'#ffd3e6', light:'#ff6fae', mid:'#ff2e88', dark:'#8f0f4a', knurl:'#52082a', occ:'#6b0b38'},
  cyan:   {hi:'#dbfbff', light:'#7cf1ff', mid:'#1fe0ff', dark:'#086d80', knurl:'#043d49', occ:'#06505f'},
  slate:  {hi:'#f2f0ee', light:'#8d8b98', mid:'#4a4955', dark:'#1a1922', knurl:'#111', occ:'#111'}
};
const STAR_PATH = 'M0,-19.5 L4.7,-6.5 L18.6,-6 L7.7,2.5 L11.5,15.8 L0,8 L-11.5,15.8 L-7.7,2.5 L-18.6,-6 L-4.7,-6.5 Z';

function CoinSVG({ color, id = 'c', style = 'classic' }: { color: string; id?: string; style?: 'classic' | 'neon' | 'metallic' }) {
  const p = color === '#ff2e88' ? PALETTES.pink : (color === '#1fe0ff' ? PALETTES.cyan : PALETTES.slate);
  const uid = id.replace(/[^a-z0-9]/gi, '') + (color === '#ff2e88' ? 'p' : 'c') + style;
  
  if (style === 'neon') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" className="w-full h-full block">
        <defs>
          <filter id={`neon${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="80" cy="80" r="60" fill="none" stroke={p.mid} strokeWidth="6" strokeOpacity="0.4" filter={`url(#neon${uid})`} />
        <circle cx="80" cy="80" r="60" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="80" cy="80" r="50" fill="none" stroke={p.light} strokeWidth="4" opacity="0.6" filter={`url(#neon${uid})`} />
        <path transform="translate(80 80) scale(0.8)" d={STAR_PATH} fill="none" stroke={p.light} strokeWidth="2" filter={`url(#neon${uid})`} />
      </svg>
    );
  }

  if (style === 'metallic') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" className="w-full h-full block drop-shadow-2xl">
        <defs>
          <linearGradient id={`metal${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.hi} />
            <stop offset="25%" stopColor={p.light} />
            <stop offset="50%" stopColor={p.hi} />
            <stop offset="75%" stopColor={p.dark} />
            <stop offset="100%" stopColor={p.hi} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="84" r="60" fill="#000" opacity="0.4" />
        <circle cx="80" cy="80" r="60" fill={`url(#metal${uid})`} stroke={p.knurl} strokeWidth="2" />
        <circle cx="80" cy="80" r="50" fill="none" stroke={p.hi} strokeWidth="1" strokeOpacity="0.5" />
        <path transform="translate(80 80)" d={STAR_PATH} fill={p.dark} fillOpacity="0.3" stroke={p.knurl} strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" className="w-full h-full block drop-shadow-xl">
      <defs>
        <radialGradient id={`t${uid}`} cx="0.35" cy="0.3" r="0.95">
          <stop offset="0" stopColor={p.hi}/><stop offset=".25" stopColor={p.light}/>
          <stop offset=".6" stopColor={p.mid}/><stop offset="1" stopColor={p.dark}/>
        </radialGradient>
        <radialGradient id={`s${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity=".7"/><stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
        <filter id={`f${uid}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <circle cx="80" cy="86" r="59" fill="#000" opacity=".38" filter={`url(#f${uid})`}/>
      <circle cx="80" cy="80" r="60" fill={`url(#t${uid})`} stroke={p.dark} strokeWidth="1.5"/>
      <circle cx="80" cy="80" r="58" fill="none" stroke={p.knurl} strokeWidth="3.5" strokeDasharray="2.5 4.5" opacity=".45"/>
      <circle cx="80" cy="80" r="55" fill="none" stroke={p.occ} strokeWidth="4" strokeDasharray="90 999" opacity=".35"/>
      <circle cx="80" cy="80" r="59" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="70 999" opacity=".22"/>
      <circle cx="80" cy="80" r="47" fill="none" stroke={p.dark} strokeWidth="2.6" opacity=".55"/>
      <circle cx="80" cy="81" r="47" fill="none" stroke={p.light} strokeWidth="1.1" opacity=".5"/>
      <circle cx="80" cy="80" r="34" fill="none" stroke={p.dark} strokeWidth="2.2" opacity=".5"/>
      <circle cx="80" cy="81" r="34" fill="none" stroke={p.light} strokeWidth="1" opacity=".45"/>
      <path transform="translate(80 81.6)" d={STAR_PATH} fill={p.light} opacity=".55"/>
      <path transform="translate(80 80)" d={STAR_PATH} fill={p.dark} opacity=".8"/>
      <ellipse cx="62" cy="58" rx="25" ry="17" fill={`url(#s${uid})`} transform="rotate(-18 62 58)"/>
      <ellipse cx="57" cy="51" rx="9" ry="6" fill="#fff" opacity=".5" transform="rotate(-18 57 51)"/>
    </svg>
  );
}

function StarSVG() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-30 star-icon" fill="white">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function PulseBadge({ name, color, active, diceValue, shaking, onRoll }: { name: string; color: string; active?: boolean; diceValue: number | null; shaking: boolean; onRoll?: () => void }) {
  const initials = name.charAt(0).toUpperCase();
  return (
    <div className={`pulse-badge flex items-center gap-3 p-2 pr-4 rounded-full border border-white/10 bg-[#09090d]/80 backdrop-blur-md shadow-2xl ${active ? 'active' : ''}`}>
      <div 
        className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0"
        style={{ 
          backgroundColor: `${color}33`, 
          borderColor: color,
          color: color,
          boxShadow: active ? `0 0 15px ${color}66` : 'none'
        }}
      >
        {initials}
      </div>
      <div className="flex flex-col min-w-[60px]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 leading-none">{name}</span>
        <span className="text-[8px] text-slate-500 uppercase mt-1 tracking-tighter">{active ? 'Tactical Phase' : 'Standby'}</span>
      </div>
      <div className="badge-dice ml-1">
        <Dice3D 
          value={diceValue} 
          shaking={shaking} 
          onClick={onRoll}
        />
      </div>
    </div>
  );
}

function ArrowSVG({ dir, color }: { dir: string; color: string }) {
  const rot = ({ right: 0, down: 90, left: 180, up: 270 } as any)[dir];
  return (
    <span className="arrow block w-full h-full">
      <svg viewBox="0 0 24 24" style={{ transform: `rotate(${rot}deg)` }} className="w-full h-full block">
        <path d="M3 12h14M12 5l7 7-7 7" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function HomeHub() {
  return (
    <svg viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" fill="#09090d" />
      <polygon points="50,50 0,0 100,0" fill="#1fe0ff" opacity=".8" />
      <polygon points="50,50 100,0 100,100" fill="#221a3a" opacity=".8" />
      <polygon points="50,50 100,100 0,100" fill="#ff2e88" opacity=".8" />
      <polygon points="50,50 0,100 0,0" fill="#221a3a" opacity=".8" />
      <line x1="0" y1="0" x2="100" y2="100" stroke="#09090d" strokeWidth="2" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="#09090d" strokeWidth="2" />
    </svg>
  );
}

/* ---- board grid ---- */

function buildCells() {
  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const k = r + ',' + c;
      const cls = ['cell'];
      const y = inYard(r, c);
      if (y) cls.push('yard-' + y);
      else if (HOME_OF[k]) cls.push('home-' + HOME_OF[k]);
      else if (START_OF[k]) cls.push('path', 'start-' + START_OF[k]);
      else if (TRACK_SET.has(k)) cls.push('path');
      if (SAFE.has(k)) cls.push('safe');
      cells.push({ k, r, c, cls: cls.join(' '), arrow: ARROWS[k] });
    }
  }
  return cells;
}

/* ---- board component ---- */

export function LudoBoard({ 
  mirror, 
  myColor, 
  onPickMove, 
  onRoll,
  isMyTurn,
  diceRolled,
  lastRoll,
  isShaking,
  previewMoves = [],
  coinStyle = 'classic'
}: any) {
  const [hoveredToken, setHoveredToken] = useState<{ color: string; i: number } | null>(null);
  const cells = useMemo(buildCells, []);

  const hoveredPath = useMemo(() => {
    if (!hoveredToken) return new Set<string>();
    const move = previewMoves.find((m: any) => m.i === hoveredToken.i && m.color === hoveredToken.color);
    if (!move) return new Set<string>();

    const pathKeys = new Set<string>();
    const player = mirror.players[move.color];
    const token = player?.tokens?.[move.i];
    if (!token) return pathKeys;

    let currentLoc = token.loc === 'yard' ? 0 : token.loc + 1;
    const destLoc = move.dest;

    // Build intermediate steps
    for (let l = currentLoc; l <= destLoc; l++) {
      const [r, c] = cellOfRoute(move.color, l);
      pathKeys.add(`${r},${c}`);
    }
    return pathKeys;
  }, [hoveredToken, previewMoves, mirror.players]);

  // Group tokens by coordinate to handle stacking
  const groupedOnTrack: Record<string, any[]> = {};
  for (const color of ['pink', 'cyan']) {
    const P = mirror.players[color];
    if (!P || !P.tokens) continue;
    P.tokens.forEach((t: any, i: number) => {
      if (typeof t.loc === 'number') {
        const [r, c] = cellOfRoute(color, t.loc);
        const k = `${r},${c}`;
        if (!groupedOnTrack[k]) groupedOnTrack[k] = [];
        const home = t.loc === 56;
        const move = previewMoves.find((m: any) => m.i === i && m.color === color);
        groupedOnTrack[k].push({ color, i, r, c, home, movable: !!move, move });
      }
    });
  }

  // Flatten with offsets
  const onTrackWithOffsets: any[] = [];
  Object.entries(groupedOnTrack).forEach(([k, tokens]) => {
    tokens.forEach((t, index) => {
      let offsetX = 0;
      let offsetY = 0;
      if (tokens.length > 1) {
        // Apply slight offset for multiple tokens in the same cell
        const angle = (index / tokens.length) * Math.PI * 2;
        const radius = 0.22; // very tight shift for ~10% visibility
        offsetX = Math.cos(angle) * radius;
        offsetY = Math.sin(angle) * radius;
      }
      onTrackWithOffsets.push({ ...t, offsetX, offsetY });
    });
  });

  const previewCells = previewMoves.map((m: any) => {
    const [r, c] = cellOfRoute(myColor, m.dest);
    return { ...m, r, c };
  });

  const yardOrder = { tl: [0, 1, 2, 3], tr: [0, 1, 2, 3], bl: [0, 1, 2, 3], br: [0, 1, 2, 3] };

  const yardFill = (y: string) => {
    if (y === 'bl') return 'pink';
    if (y === 'tr') return 'cyan';
    return 'slate';
  };

  return (
    <div className="board-mat w-full">
      <div className={`board-wrap ${myColor === 'cyan' ? 'rotated-view' : ''}`} id="boardWrap">
        <div className="board">
          {cells.map((cell) => (
            <div 
              className={`${cell.cls} ${hoveredPath.has(cell.k) ? 'path-glow' : ''}`} 
              key={cell.k}
              style={hoveredPath.has(cell.k) ? { color: COLORS[hoveredToken?.color || 'pink'] } : {}}
            >
              {cell.arrow ? <ArrowSVG dir={cell.arrow[0]} color={cell.arrow[1]} /> : null}
              {SAFE.has(cell.k) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <StarSVG />
                </div>
              )}
            </div>
          ))}
        </div>

        {['tl', 'tr', 'bl', 'br'].map((y) => (
          <div className={'yard-block pos-' + y + ' fill-' + yardFill(y)} key={y}>
            {y === 'bl' && (
              <div className="absolute -bottom-16 -left-12 z-[20]">
                <PulseBadge 
                  name="Commander" 
                  color={COLORS.pink} 
                  active={isMyTurn}
                  diceValue={isMyTurn ? lastRoll : null}
                  shaking={isShaking && isMyTurn}
                  onRoll={isMyTurn && !diceRolled ? onRoll : undefined}
                />
              </div>
            )}
            {y === 'tr' && (
              <div className="absolute -top-16 -right-12 z-[20]">
                <PulseBadge 
                  name={mirror.players.cyan?.id === 'BOT_USER' ? 'Tactical Bot' : 'Challenger'} 
                  color={COLORS.cyan} 
                  active={mirror.turn === 'cyan'}
                  diceValue={mirror.turn === 'cyan' ? lastRoll : null}
                  shaking={mirror.turn === 'cyan' && !diceRolled && !mirror.botThinking}
                />
              </div>
            )}
            
            <div className="yard-panel">
              {(yardOrder as any)[y].map((slot: number) => {
                const color = yardFill(y);
                const token = color !== 'slate' ? mirror.players[color]?.tokens?.find((t: any) => t.loc === 'yard' && t.slot === slot) : null;
                const move = token ? previewMoves.find((m: any) => m.i === token.i && m.color === color) : null;
                
                return (
                   <div className="yard-slot" key={slot}>
                     <div className={'ghost ' + (color === 'slate' ? 'slate' : color)} />
                     {token ? (
                       <div 
                         className={`coin-wrapper ${move ? 'movable' : ''}`}
                         onClick={() => move && onPickMove(move)}
                         onMouseEnter={() => move && setHoveredToken({ color, i: token.i })}
                         onMouseLeave={() => setHoveredToken(null)}
                       >
                         <CoinSVG color={COLORS[color]} id={`${color}-yard-${slot}`} style={coinStyle} />
                       </div>
                     ) : null}
                   </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="home-hub">
          <HomeHub />
        </div>

        <div className="tokenLayer">
          {onTrackWithOffsets.map((t) => (
            <div
              className={'token ' + t.color + (t.movable ? ' movable' : '') + (t.home ? ' homed' : '')}
              key={t.color + '-' + t.i}
              style={{ 
                left: (t.c + 0.5 + t.offsetX) * step + '%', 
                top: (t.r + 0.5 + t.offsetY) * step + '%',
                zIndex: t.movable ? 10 : 5
              }}
              onClick={() => t.move && onPickMove(t.move)}
              onMouseEnter={() => t.movable && setHoveredToken({ color: t.color, i: t.i })}
              onMouseLeave={() => setHoveredToken(null)}
            >
              <CoinSVG color={COLORS[t.color]} id={t.color + '-' + t.i} style={coinStyle} />
            </div>
          ))}
          {previewCells.map((p: any) => (
            <div
              className="move-preview"
              key={'p' + p.i + '-' + p.dest}
              style={{ left: (p.c + 0.5) * step + '%', top: (p.r + 0.5) * step + '%' }}
              onClick={() => onPickMove(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
