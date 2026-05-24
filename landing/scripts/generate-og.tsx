import { ImageResponse } from '@vercel/og';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BRAND = 'Acme';
const TAGLINE = 'Analytics for modern product teams';

async function main() {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 600, opacity: 0.95 }}>{BRAND}</div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 600,
            lineHeight: 1.1,
            marginTop: 24,
            letterSpacing: '-0.04em',
          }}
        >
          {TAGLINE}
        </div>
        <div style={{ marginTop: 40, fontSize: 28, opacity: 0.7 }}>acme.com</div>
      </div>
    ) as React.ReactElement,
    { width: 1200, height: 630 },
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  const outPath = resolve(process.cwd(), 'public/og-default.png');
  writeFileSync(outPath, buffer);
  console.log(`OG written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
