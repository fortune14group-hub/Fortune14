import './globals.css';

export const metadata = {
  title: 'BetSpread',
  description: 'Logga dina spel och följ din ROI med BetSpread.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
