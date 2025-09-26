'use client';

import Image from 'next/image';

export default function Logo({ className, priority = false }) {
  return (
    <Image
      src="/betspread-logo.svg"
      alt="BetSpread"
      width={640}
      height={200}
      className={className}
      sizes="(max-width: 640px) 170px, (max-width: 768px) 200px, (max-width: 1024px) 220px, 240px"
      priority={priority}
    />
  );
}
