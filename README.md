# Gmail Sender

A minimal Next.js app to send bulk emails from a CSV or Excel file using the Gmail API and Google OAuth2.

## Features

- Upload CSV (`.csv`) or Excel (`.xlsx`, `.xls`) files
- Select the email column; supports multiple emails per cell (comma, semicolon, or whitespace separated)
- Compose one subject, body, and optional attachment
- Send individually to each valid address via Gmail API
- Live progress, pause/cancel, and failed-recipient CSV export
- Encrypted session cookies for OAuth tokens (no database)

## Prerequisites

- Node.js 18+
- A Google Cloud project with Gmail API enabled
- OAuth 2.0 Web Client credentials

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Enable **Gmail API** (APIs & Services → Library)
4. Configure **OAuth consent screen**
   - User type: External (or Internal for Workspace)
   - Add scope: `https://www.googleapis.com/auth/gmail.send`
   - Add your email as a test user (while in Testing mode)
5. Create **OAuth 2.0 Client ID** (Web application)
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback`
   - For production, add: `https://YOUR_DOMAIN/api/auth/callback`
6. Copy the Client ID and Client Secret

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
APP_URL=http://localhost:3000
SESSION_SECRET=your-32-char-or-longer-random-secret
MAX_ATTACHMENT_BYTES=10485760
SEND_DELAY_MS=600
MAX_RECIPIENTS=500
```

Generate a session secret:

```bash
openssl rand -base64 32
```

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Connect Gmail**, upload your file, compose your email, and click **Start sending**.

## Usage Notes

- **Keep the tab open** while sending — the browser orchestrates the batch loop
- Each recipient receives an individual email (same content)
- Invalid email addresses are skipped and shown in the preview
- Maximum 500 recipients per batch (configurable via `MAX_RECIPIENTS`)
- Attachment limit: 10 MB (configurable via `MAX_ATTACHMENT_BYTES`)

## Gmail Sending Limits

| Account type | Daily limit (approx.) |
|--------------|----------------------|
| Free Gmail   | ~500 emails/day      |
| Google Workspace | ~2,000 emails/day |

The app throttles sends with a 600 ms delay between each email to reduce rate-limit errors.

## Security

- OAuth tokens stored in encrypted httpOnly cookies (`iron-session`)
- CSRF protection via OAuth `state` parameter
- Minimum scope: `gmail.send` only
- Server-side validation with Zod
- Rate limiting on send API (30 requests/minute per IP)
- Security headers (CSP, X-Frame-Options, etc.)

## Project Structure

```
app/           → Pages and API routes
components/    → UI components
lib/           → OAuth, Gmail, parsing, validation
types/         → Shared TypeScript types
```

## Production Deployment

1. Set all environment variables on your host (Vercel, etc.)
2. Update `APP_URL` to your production domain
3. Add production redirect URI in Google Cloud Console
4. Publish the OAuth consent screen (or keep test users for personal use)

## License

Private / personal use.
