# Architecture Decision Records

**Last Updated**: 2026-01-12

This document consolidates the key architectural decisions made during WhatsAI development.

---

## ADR-001: Privacy-First Architecture

**Context**: Users upload sensitive WhatsApp chat data for analysis.

**Decision**: Zero server-side data persistence. All processing happens client-side.
- Chat files are parsed in the browser using Web Workers
- No user data is stored in databases or persistent file storage
- Session data is purged when the user closes/refreshes the page

**Consequences**: Enhanced user trust. Requires careful client-side performance optimization.

---

## ADR-002: LLM Provider Strategy

**Context**: Need to support multiple LLM providers while maintaining privacy.

**Decision**: Unified LLM Adapter pattern with local-first priority.
- **Local (Default)**: Ollama for fully private local execution
- **Cloud Options**: Cloudflare Workers AI, or Bring-Your-Own-Key (BYOK) for Gemini/OpenAI
- Explicit user consent required before any data transmission to cloud providers

**Consequences**: Flexibility for users with different privacy/convenience preferences.

---

## ADR-003: Chat Parsing Strategy

**Context**: WhatsApp exports vary by region, device, and language.

**Decision**: Regex-based client-side parsing.
- Structural filtering to remove admin messages (joins/leaves/encryption notices)
- Multi-pattern matching for reactions (Android/iOS variations)
- Auto-detect regional date/time formats
- Messages not matching `[Timestamp] Sender: Content` pattern are filtered as system messages

**Consequences**: Language-agnostic filtering. Best-effort reaction counting (may undercount unknown formats).

---

## ADR-004: Analysis Strategies for Large Files

**Context**: Large chat exports (>50MB) exceed LLM context windows.

**Decision**: Three selectable strategies for processing large files:
1. **Hybrid**: Script identifies "hot zones" (high-activity peaks) for targeted LLM analysis
2. **Multi-pass**: Split into chunks, summarize each, synthesize into final report
3. **Truncation**: Analyze only the N most recent messages (default: 100)

**Implementation**: `src/features/analysis/services/strategies/` with a common base class for shared logic (message formatting, progress reporting, streaming).

**Consequences**: Users control trade-off between comprehensiveness and speed.

---

## ADR-005: Programmatic vs LLM-Based Metrics

**Context**: Some insights require AI reasoning, others can be computed deterministically.

**Decision**: Clear separation between programmatic and LLM-based analysis.

**Programmatic (no LLM)**:
- Message count per user, average message length
- Media/file counts
- Activity heatmaps (hour × weekday)
- Conversation starters, response times
- Emoji/link frequency
- Reply rates, mention matrix, vocabulary richness

**LLM-Based**:
- Top 5 controversial topics with conclusions
- Overall chat summaries
- RAG-based Q&A on history

**Consequences**: Faster results for quantitative metrics. Reduced LLM costs. Local-only analysis possible.

---

## ADR-006: RAG for Chat Q&A

**Context**: Users want to ask questions about their chat history.

**Decision**: In-memory Retrieval-Augmented Generation (RAG).
- Index rebuilt on every chat load (no persistence across sessions)
- Embeddings generated in Web Worker
- Context chunks retrieved via semantic search
- LLM answers grounded in retrieved messages with citations

**Consequences**: Dynamic information retrieval vs static summaries. Privacy preserved (in-memory only).

---