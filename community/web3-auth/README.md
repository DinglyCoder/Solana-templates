## Web3Auth + Next.js (Solana)

A Next.js + Tailwind + TypeScript template showing Web3Auth social logins (Google, Twitter, Discord, GitHub), email passwordless, and SMS authentication with an embedded Solana wallet. Includes session management with JWT in HttpOnly cookies, protected routes, and examples to sign messages and send transactions.

### Quickstart

1. Create a project on Web3Auth Dashboard (`https://web3auth.io`).
2. Copy `.env.example` to `.env.local` and set the variables:

```
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your-client-id
NEXT_PUBLIC_WEB3AUTH_NETWORK=testnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_CHAIN_ID=solana-devnet
JWT_SECRET=replace-with-a-strong-secret
SESSION_MAX_AGE_SECONDS=604800
```

3. Install and run:

```
npm install
npm run dev
```

4. Open `http://localhost:3000`.

### Web3Auth Dashboard Setup

- Create a plug-and-play project and copy the Client ID.
- Configure login providers and verifiers (Google, Twitter, Discord, GitHub, Email, SMS).
- Whitelist `http://localhost:3000` for development.
- For production, add your domain(s) and update `NEXT_PUBLIC_*` envs.

Docs: `https://web3auth.io/docs`

### Authentication Flows

- Social Logins: Google, Twitter, Discord, GitHub.
- Email Passwordless: Enter email, receive OTP via Web3Auth.
- SMS Authentication: Enter E.164 phone number, receive OTP via Web3Auth.

### Embedded Wallet

On successful login, Web3Auth derives an embedded Solana keypair. This template exposes simple wallet actions:

- Get wallet address
- Sign a message
- Send a transaction (extend in `src/app/profile/page.tsx`)

### Session Management

- After login, a POST `/api/session/login` stores a signed JWT in an HttpOnly cookie.
- Middleware in `src/middleware.ts` protects `/profile` and `/protected/*` routes.
- Refresh endpoint rotates the session cookie.
- Logout clears the cookie and calls `web3auth.logout()`.

Security considerations:
- Use a strong `JWT_SECRET` and keep it private.
- Cookies are `httpOnly`, `sameSite=lax`, `secure` (set `secure=false` if needed locally behind HTTP).
- Never expose private keys; only use Web3Auth providers.

### Network Configuration

- `NEXT_PUBLIC_WEB3AUTH_NETWORK`: `mainnet`, `testnet`, or `cyan`.
- `NEXT_PUBLIC_SOLANA_CHAIN_ID`: `solana`, `solana-testnet`, or `solana-devnet`.
- `NEXT_PUBLIC_SOLANA_RPC`: match to your chain id.

### Troubleshooting

- Invalid verifier: ensure the verifier name matches your Web3Auth dashboard config.
- Domain not whitelisted: add your dev/prod domains in dashboard.
- Rate limits on testnet: avoid excessive auth attempts.

### Migration to Mainnet

- Switch `NEXT_PUBLIC_WEB3AUTH_NETWORK=mainnet` and `NEXT_PUBLIC_SOLANA_CHAIN_ID=solana`.
- Update `NEXT_PUBLIC_SOLANA_RPC` to a mainnet RPC endpoint.
- Verify verifiers and domains in Web3Auth dashboard.

### CLI Integration

This template includes a `create-solana-dapp` block in `package.json` to guide post-install steps.
