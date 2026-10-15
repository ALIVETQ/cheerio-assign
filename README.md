# Cheerio AI - WhatsApp Marketing Platform with AI Support

Cheerio AI is a prototype WhatsApp marketing platform featuring **Rio**, an AI support agent that guides users through campaign setup with interactive workflow tutorials. Rio can answer questions, offer step-by-step guides, and hand off complex issues to human support.

This is a demo project showcasing AI-powered user onboarding and contextual help within a SaaS marketing tool.

## Demo Scenario

The app simulates a WhatsApp marketing platform where users can:
- Connect channels (WhatsApp, Email, SMS)
- Create message templates
- Add contacts and launch campaigns
- Track credits and campaign analytics

**Rio** (the AI agent) helps users navigate the platform by:
- Responding to natural language questions
- Offering interactive guided workflows
- Detecting when users need help and suggesting relevant tutorials
- Handing off to human support when needed

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd cheerio-ai
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

4. Run the development server
```bash
npm run dev
```



## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) | - |
| `GEMINI_MODEL` | Gemini model to use | `gemini-3.5-flash-lite` |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion
- **AI Integration:** Google Gemini API
- **Routing:** React Router
- **Testing:** Vitest, Playwright, React Testing Library
- **Deployment:** Vercel (configured)

## Project Structure

```
cheerio-ai/
├── api/                 # Vercel serverless API handlers
│   └── _lib/            # Shared API utilities
├── docs/                # Documentation
│   └── ARCHITECTURE.md  # Detailed technical architecture
├── e2e/                 # End-to-end Playwright tests
├── public/              # Static assets
├── reference-screenshots/ # UI reference images
├── scripts/             # Build and test scripts
└── src/
    ├── components/      # React components
    │   ├── dashboard/   # Dashboard UI components
    │   ├── engine/      # Workflow guide engine
    │   └── rio/         # Rio AI chat widget
    ├── context/         # React Context providers
    ├── data/            # Mock data and fixtures
    ├── lib/             # Utility functions
    ├── pages/           # Route pages
    └── workflows/       # Workflow definitions (JSON)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run typecheck` - Run TypeScript type checking
- `npm run test:all` - Run all tests and checks

## Documentation

For detailed architecture, design decisions, and implementation details, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Live Demo

Live demo: (add after deploy)

## License

This is a prototype project for demonstration purposes.
