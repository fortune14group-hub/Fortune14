import './globals.css';

export const metadata = {
  title: 'BetSpread',
  description: 'Logga dina spel och följ din ROI med BetSpread.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
