/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const PlanetAnimation = ({ size = 'large' }: { size?: 'small' | 'large' }) => {
  const isLarge = size === 'large';
  const containerSize = isLarge ? 'w-[220px] h-[220px]' : 'w-[160px] h-[160px]';
  const planetSize = isLarge ? 'w-[150px] h-[150px]' : 'w-[100px] h-[100px]';
  const orbitSize = isLarge ? 'w-[200px] h-[200px]' : 'w-[130px] h-[130px]';

  return (
    <div className={`relative ${containerSize} mx-auto mb-8`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`${planetSize} rounded-full planet-gradient shadow-[0_20px_60px_rgba(124,92,255,0.35)] animate-spin-planet`} />
      </div>
      <div className={`absolute top-1/2 left-1/2 ${orbitSize} -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-primary/20`} />
      <div className={`absolute top-1/2 left-1/2 ${orbitSize} -translate-x-1/2 -translate-y-1/2 animate-rotate-star`}>
        {[0, 120, 240].map((deg) => (
          <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-sky rounded-full shadow-[0_0_12px_rgba(77,211,255,0.7)] animate-twinkle" />
          </div>
        ))}
      </div>
    </div>
  );
};
