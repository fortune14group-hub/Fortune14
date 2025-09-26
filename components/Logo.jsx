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
      sizes="(max-width: 520px) 150px, (max-width: 720px) 170px, (max-width: 900px) 188px, 220px"
      priority={priority}
    />
  );
}
