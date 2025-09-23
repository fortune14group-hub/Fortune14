'use client';

import Image from 'next/image';

export default function Logo({ className, priority = false }) {
  return (
    <Image
      src="/betspread-logo.svg"
      alt="BetSpread"
      width={240}
      height={64}
      className={className}
      priority={priority}
    />
  );
}
