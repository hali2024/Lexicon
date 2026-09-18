# The Lexicon

A vocabulary study with a dark Word Studio, saved collections, CSV import, and a dashboard built from actual learning records. Existing browser and account storage formats are preserved.

## Run

Requires Node.js 20.19+, 22.13+, or 24+ (including the DOM test suite).

```sh
npm install
npm start
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

CSV import and browser-local guest study work without external services. Use `word,definition,example` columns, or download the full template from the CSV tab. Quoted commas, multiline fields, UTF-8 BOM, and both `partOfSpeech` and `part_of_speech` are supported; repeated words are deduplicated case-insensitively.

For AI generation, configure `DEEPSEEK_API_KEY` in the server environment. `DEEPSEEK_MODEL` optionally overrides the existing default model. Topic mode selects words using count, CEFR difficulty and learning goal, then generates their entries. “Use my exact words” retains the original word-list workflow. No API credentials are sent to the browser.

Account persistence requires `DATABASE_URL`; production sessions should set `SESSION_SECRET`. The existing email/account features also need their original SMTP configuration. The server reads environment variables directly; it does not automatically load `.env` files.

## Verify

```sh
npm test
```

Tests cover CSV parsing, dashboard statistics, AI validation and matching returned definitions to requested words. AI tests use controlled responses; a real generation requires a configured key and provider access. Practice accuracy measures submitted answers rather than a claimed retention rate. The heatmap shows 12 weeks of saved activity; an empty account displays an empty collection and zero activity.
