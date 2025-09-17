import Link from 'next/link';

const yearNow = new Date().getFullYear();

export default function LandingPage() {
  return (
    <>
      <div className="landing-topbar">
        <div className="brand"><strong>BetSpread</strong></div>
        <div className="topbar-actions">
          <Link href="/login" className="btn-ghost topbar-login">Logga in</Link>
        </div>
      </div>

      <section className="landing-hero">
        <div className="landing-card">
          <div>
            <h1>Spreadsheets för sports betting – snabbt, snyggt och enkelt</h1>
            <p>
              Bokför dina spel, följ dina resultat månadsvis och lås upp obegränsat med Premium. För
              hobbybettare och proffs.
            </p>
            <div className="cta-row">
              <Link href="/login" className="btn btn-primary">
                Kom igång gratis
              </Link>
            </div>
            <p className="cta-note">Bokför de första 20 spelen gratis. Inga kort krävs.</p>
          </div>
          <div className="feature">
            <strong>Hur funkar det?</strong>
            <ol>
              <li>Skapa konto och logga in</li>
              <li>Skapa projekt</li>
              <li>Registrera dina spel</li>
              <li>Se sammanställning och ROI per månad</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature">
          <strong>Snabb registrering</strong>
          <p>Matchdag, odds, insats, marknad, spelbolag.</p>
        </div>
        <div className="feature">
          <strong>Månadsvis överblick</strong>
          <p>ROI, profit och win/loss per månad.</p>
        </div>
        <div className="feature">
          <strong>Gratis → Premium</strong>
          <p>20 spel gratis, uppgradera när du vill.</p>
        </div>
      </section>

      <footer className="landing-footer">© {yearNow} BetSpread</footer>

      <style jsx global>{`
        body {
          background: #0b1116;
          color: #e7eef5;
        }
        .landing-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #1f2a37;
          background: #0f1720;
          position: sticky;
          top: 0;
          z-index: 5;
        }
        .brand {
          font-size: 20px;
        }
        .topbar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn {
          padding: 12px 14px;
          border-radius: 10px;
          border: 0;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-primary {
          background: #22c55e;
          color: #0b1116;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid #334155;
          color: #e7eef5;
          padding: 8px 12px;
          border-radius: 10px;
        }
        .landing-hero {
          min-height: 72svh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: radial-gradient(1000px 500px at 80% -10%, #132033, transparent), #0b1116;
        }
        .landing-card {
          max-width: 1100px;
          width: 92vw;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          align-items: center;
        }
        .landing-card h1 {
          font-size: 40px;
          line-height: 1.1;
          margin: 0 0 10px;
        }
        .landing-card p {
          color: #94a3b8;
          margin: 0 0 16px;
        }
        .cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .cta-note {
          color: #94a3b8;
          margin-top: 8px;
        }
        .feature-grid {
          max-width: 1100px;
          margin: 0 auto 30px;
          padding: 0 4vw 40px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .feature {
          background: #0f1720;
          border: 1px solid #1f2a37;
          border-radius: 12px;
          padding: 16px;
          color: #93a4b4;
        }
        .feature strong {
          display: block;
          color: #e7eef5;
          margin-bottom: 6px;
        }
        .landing-footer {
          padding: 20px;
          color: #93a4b4;
          border-top: 1px solid #1f2a37;
          background: #0f1720;
          text-align: center;
        }
        @media (max-width: 900px) {
          .landing-card {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 600px) {
          .landing-card h1 {
            font-size: 32px;
          }
          .landing-hero {
            padding: 32px 16px;
          }
        }
      `}</style>
    </>
  );
}
