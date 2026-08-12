'use client';

import { useRef, useEffect } from 'react';

const FACES: Record<number, number[]> = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const faceRot: Record<number, string> = {
  1: 'rotateY(0deg)',
  2: 'rotateY(180deg)',
  3: 'rotateY(90deg)',
  4: 'rotateY(-90deg)',
  5: 'rotateX(-90deg)',
  6: 'rotateX(90deg)'
};

interface Dice3DProps {
  value: number | null;
  shaking?: boolean;
  onClick?: (() => void) | null;
}

export default function Dice3D({ value, shaking = false, onClick = null }: Dice3DProps) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const flickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;
    if (shaking) {
      cube.style.transition = 'none';
      flickRef.current = setInterval(() => {
        cube.style.transform =
          'rotateX(' + (Math.random() * 720 - 360) + 'deg) rotateY(' + (Math.random() * 720 - 360) + 'deg)';
      }, 90);
    } else {
      if (flickRef.current) {
        clearInterval(flickRef.current);
        flickRef.current = null;
      }
      const v = value || 1;
      cube.style.transition = 'transform .9s cubic-bezier(.2,.9,.3,1.2)';
      cube.style.transform = faceRot[v];
    }
    return () => {
      if (flickRef.current) clearInterval(flickRef.current);
    };
  }, [value, shaking]);

  return (
    <div
      className={'mini-stage' + (onClick ? ' clickable' : '')}
      onClick={onClick || undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? 'Roll dice' : undefined}
      title={onClick ? 'Tap to roll' : undefined}
    >
      <div className="mini-cube" ref={cubeRef}>
        {[1, 2, 3, 4, 5, 6].map((f) => {
          const on = new Set(FACES[f]);
          return (
            <div className={'mface f' + f} key={f}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <i key={i} className={on.has(i) ? 'on' : ''} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
