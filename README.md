# LazyWhatsApp - WhatsApp Chat Insights

LazyWhatsApp is a privacy-first, browser-based WhatsApp chat analyzer. It provides quantitative statistics and qualitative AI-driven insights without ever sending your chat data to a server. This was vibe-coded over a weekend, don't expect any level of "production readiness" quality. I build this because I didn't want to read more 500 messages I got on an old group chat 🫣

![SCR-20260112-sifn](https://github.com/user-attachments/assets/f186a405-f016-41c0-a1dd-2125a6008995)
![SCR-20260112-siib](https://github.com/user-attachments/assets/082e707d-0c3e-4f84-a41c-a7408addcb06)
![SCR-20260112-snyt](https://github.com/user-attachments/assets/4e921ebf-29f1-40b1-99cf-da91495df0e7)

## 🚀 Quick Start (Local)

1. **Install Dependencies**:
   ```bash
   ./scripts/setup-local.sh
   ```

2. **Start the App**:
   ```bash
   npm run dev
   ```

3. **LLM Support (Optional)**:
   Install [Ollama](https://ollama.ai), run `ollama pull llama3`, and ensure the model matches your preference in `src/config.ts`.

Access the app at `http://localhost:4321`.

## 📊 Data Funnel & Processing

WhatsAI uses a multi-stage pipeline to transform raw chat exports into structured insights:

1.  **Browser Upload**: The user selects a `.txt` file. The content is read into memory as a raw string.
2.  **Web Worker Isolation**: Processing is offloaded to a background Web Worker to ensure the UI remains responsive even for massive (50MB+) files.
3.  **Chat Parsing Engine**: A regex-based service identifies message patterns (iOS/Android) and filters out administrative noise (e.g., encryption notices).
4.  **Insight Computation**:
    *   **Quantitative Stats**: Calculates message counts, unique senders, and speaker rankings.
    *   **Engagement Analysis**: Maps interaction patterns to identify the most replied-to participants and average response times.
    *   **Controversy Detection**: A density-based clustering algorithm identifies periods of high-frequency messaging ("Controversy Peaks").
5.  **Dashboard Rendering**: The resulting data is displayed in a premium, interactive dashboard with ranked lists and highlight badges.
6.  **AI Orchestrator**: User-triggered on-demand analysis. For selected peaks, relevant message windows are sent to an LLM (Ollama or Cloudflare) to generate qualitative summaries and action items.

## 🛡️ Privacy

All chat parsing happens in your browser's Web Workers. No chat content is uploaded or stored. AI insights are generated locally via Ollama or through secure Cloudflare Workers AI endpoints (if configured).

## 🛠️ Tech Stack

- **Framework**: Astro 4.x
- **Language**: TypeScript 5.x
- **Markdown**: Marked (for AI summaries)
- **Testing**: Vitest & Playwright
- **AI**: Ollama & Cloudflare AI
