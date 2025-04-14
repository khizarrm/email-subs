# Next.js 14 with Google OAuth and Gmail Access

This project demonstrates how to implement Google OAuth authentication with Gmail read-only access in a Next.js 14 application using the App Router.

## Features

- Next.js 14 with App Router
- Tailwind CSS for styling
- NextAuth.js for authentication
- Google OAuth with Gmail read-only access
- JWT-based sessions (no database required)
- TypeScript support

## Getting Started

### Prerequisites

1. Create a Google Cloud Project and configure OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Navigate to "APIs & Services" > "Credentials"
   - Create an OAuth client ID (Web application)
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-domain.com/api/auth/callback/google`
   - Enable the Gmail API in "APIs & Services" > "Library"

2. Note your Client ID and Client Secret for the next step

### Environment Setup

Create a `.env.local` file in the root of your project with the following variables:

\`\`\`
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
\`\`\`

For production, set `NEXTAUTH_URL` to your deployment URL.

### Installation

\`\`\`bash
npm install
# or
yarn
# or
pnpm install
\`\`\`

### Development

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How It Works

1. The application uses NextAuth.js to handle Google OAuth authentication
2. When a user signs in, the app requests permission to access their Gmail data (read-only)
3. The access token and refresh token are stored in a JWT
4. The home page displays the user's email and access token when signed in

## License

MIT
