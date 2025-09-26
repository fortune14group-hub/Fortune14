import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type VerifyEmailProps = {
  actionUrl: string;
  userEmail: string;
};

export const VerifyEmail = ({ actionUrl, userEmail }: VerifyEmailProps) => (
  <Html lang="sv">
    <Head />
    <Preview>Bekräfta din e-postadress för BetSpread</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section>
          <Text style={styles.h1}>Bekräfta din e-post</Text>
          <Text style={styles.paragraph}>
            Hej {userEmail},
            <br />
            Tack för att du registrerade dig hos BetSpread. Klicka på länken nedan för att bekräfta din
            adress och komma igång.
          </Text>
          <Link href={actionUrl} style={styles.link}>
            Bekräfta min e-postadress
          </Link>
          <Text style={styles.paragraph}>
            Länken är giltig i 60 minuter. Fungerar det inte att klicka kan du kopiera och klistra in länken
            i din webbläsare:
          </Text>
          <Text style={styles.url}>{actionUrl}</Text>
          <Text style={styles.paragraph}>Lycka till med spelet! / Team BetSpread</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f4f4f5',
    color: '#111827',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    margin: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '12px',
  },
  h1: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '12px',
  },
  link: {
    display: 'inline-block',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    marginBottom: '20px',
  },
  url: {
    wordBreak: 'break-all',
    fontSize: '14px',
    color: '#2563eb',
  },
};

export default VerifyEmail;
