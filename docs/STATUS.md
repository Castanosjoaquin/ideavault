# IdeaVault — Estado del proyecto

> Documento vivo. Actualizar al final de cada sesión de trabajo significativa.
> Último update: 2026-04-19 (post-commit `e86567c`).

## Contexto rápido

App web + mobile para capturar y desarrollar ideas con IA. MVP en camino a producción con constraint de costo ~$0. Autor: estudiante de Ing. en IA, Buenos Aires, stack cómodo con Python/React Native/Supabase, proyecto part-time.

## Stack decidido (no re-discutir sin motivo fuerte)

- **Monorepo**: pnpm workspaces, Node 20 LTS.
- **Web**: Vite 8 + React 19 + TypeScript 6 (versiones reales instaladas, más nuevas que el plan original — preservadas).
- **Mobile** (futuro): Expo managed workflow + EAS.
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage). Sin backend propio.
- **Shared**: `@ideavault/core` — tipos, Supabase client, schemas zod.
- **Estado servidor**: TanStack Query.
- **Routing web**: React Router.
- **Validación**: zod en cliente y Edge Functions.
- **IA**: Anthropic API, Claude Haiku default, Sonnet para paid tier. SIEMPRE via Edge Function con rate limit en DB.
- **Offline**: Dexie (web) / expo-sqlite (mobile), sync custom con `updated_at` + soft deletes. (No implementado aún.)
- **Hosting**: Vercel (web), Supabase (backend), EAS (mobile).

## Reglas no negociables

1. API key de Anthropic nunca en cliente — siempre Edge Function con JWT + rate limit.
2. RLS en toda tabla, en la misma migración que crea la tabla.
3. TypeScript estricto. Nada de `any`.
4. Lógica compartida en `@ideavault/core`, nunca duplicada.
5. Soft deletes (`deleted_at`) en toda entidad sincronizable.
6. Validación con zod en todo Edge Function antes de tocar DB.

## Progreso por fases

### Fase 0 — Setup e infra base: ✅ COMPLETADA

- [x] Monorepo con pnpm workspaces (`package.json` raíz, `pnpm-workspace.yaml`)
- [x] TypeScript config base compartida (`tsconfig.base.json`)
- [x] ESLint 9 flat config (`eslint.config.mjs`) con globals de browser
- [x] Prettier + Husky + lint-staged
- [x] `packages/core` con placeholder
- [x] `apps/web` scaffoldeado (Vite + React + TS)
- [x] Supabase CLI instalada como dev dep raíz
- [x] `packages/core/src/env.ts` con validación zod de env vars
- [x] `packages/core/src/supabase/client.ts` — factory tipada
- [x] `packages/core/src/supabase/database.types.ts` — placeholder (regenerar cuando haya schema)
- [x] `apps/web/src/lib/supabase.ts` — singleton del client
- [x] `.env.example` commiteado, `.env.local` con credenciales reales (ignorado)
- [x] Smoke test: `supabase.auth.getSession()` responde OK en browser

### Fase 1 — Auth + persistencia cloud: 🟡 EN PROGRESO (~10%)

Objetivo: usuarios se registran y sus ideas viven en Postgres. Proxy de Anthropic funcionando.

Pendiente:

- [ ] `supabase link` al proyecto remoto
- [ ] Primera migración SQL: `profiles`, `ideas`, `api_usage` + triggers `updated_at` + trigger crear profile al signup
- [ ] RLS policies para esas tablas
- [ ] Regenerar `database.types.ts` con `pnpm supabase gen types typescript --linked`
- [ ] Schemas zod de dominio en `packages/core/src/schemas/`
- [ ] React Query provider en `apps/web`
- [ ] Hooks: `useIdeas`, `useCreateIdea`, `useUpdateIdea`, `useDeleteIdea`
- [ ] Páginas `/login`, `/signup`, `/reset-password` (Supabase Auth UI o custom)
- [ ] Refactor del componente `ideas-app.jsx` → TS troceado en features
- [ ] OAuth Google (opcional, al final de la fase)
- [ ] Edge Function `develop-idea` con rate limit contra `api_usage`
- [ ] Secret `ANTHROPIC_API_KEY` en Supabase
- [ ] Reemplazar `fetch` directo a Anthropic por `supabase.functions.invoke`
- [ ] Opcional: script de migración de data de localStorage a Supabase al primer login

### Fases 2-6 — PENDIENTES

- Fase 2: Tags custom + compartir ideas (link público + por usuario)
- Fase 3: App mobile con Expo
- Fase 4: Offline + sync
- Fase 5: Export PDF + Notion
- Fase 6: Polish, dominio, landing, analytics, deploy final

## Estructura actual del repo

```
ideavault/
├── package.json              # raíz, pnpm workspaces
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.mjs         # flat config, con globals
├── .prettierrc, .editorconfig, .nvmrc, .gitignore
├── .vscode/settings.json
├── .husky/pre-commit         # corre lint-staged
├── CLAUDE.md                 # convenciones para Claude Code
├── docs/
│   └── STATUS.md             # este archivo
├── supabase/
│   └── config.toml           # inicializado, sin link todavía
├── packages/
│   └── core/
│       ├── package.json      # @ideavault/core, workspace
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # re-exports
│           ├── env.ts        # parseClientEnv + zod schema
│           └── supabase/
│               ├── client.ts          # createIdeaVaultClient factory
│               ├── database.types.ts  # placeholder, regenerar
│               └── index.ts
└── apps/
    └── web/
        ├── package.json      # @ideavault/web
        ├── tsconfig.json (+ app.json, node.json)
        ├── vite.config.ts
        ├── index.html
        ├── .env.example      # commiteado
        ├── .env.local        # IGNORADO, con credenciales reales
        └── src/
            ├── main.tsx
            ├── App.tsx       # smoke test de conexión Supabase
            ├── index.css
            ├── vite-env.d.ts
            └── lib/
                └── supabase.ts
```

## Commits hechos

- `d2a19a3` — chore: setup monorepo con apps/web scaffolded
- `e86567c` — feat(core): supabase client tipado + smoke test en web

## Decisiones técnicas clave tomadas (para no revisitar)

- **React 19 + Vite 8 + TS 6**: versiones scaffoldeadas por Vite, preservadas. Más nuevas que el plan original pero estables.
- **pnpm** sobre npm/yarn.
- **Extensiones `.js` en imports TS internos de core**: requisito de `moduleResolution: "Bundler"` + `verbatimModuleSyntax`.
- **`globals` en ESLint root config**: no en workspace. Coupling invertido evitado.
- **`eslint.config.mjs`** (no `.js`): para evitar conflicto con package.json sin `"type": "module"`.
- **Node ≥ 20.12** en engines (Vite 8 pide ≥ 20.19).
- **Un solo proyecto Supabase** (`ideavault`), región São Paulo, plan Free. Branches cuando escale.
- **Sin Turbo/Nx** todavía. pnpm -r alcanza.
- **Sin Tailwind** todavía. Estilos inline del MVP → CSS modules cuando toque ese componente.
- **`@ideavault/core` consumido vía source (`.ts`)**, no vía dist. Ahorra build intermedio.

## Riesgos activos

1. **Costo de Anthropic** — único gasto variable. Rate limit duro (30/mes free, Haiku default) antes de marketing.
2. **Sync offline** — pendiente Fase 4. Soft deletes + timestamps. Testing riguroso con 2 devices.
3. **Lock-in Supabase** — aceptable. Postgres estándar, open source. Migrable a Neon + NextAuth en ~2 semanas si hace falta.

## Credenciales y secrets

- Supabase project URL + anon key: en `apps/web/.env.local` (ignorado).
- Supabase service role key: NO usada todavía. Solo para Edge Functions.
- Anthropic API key: NO creada todavía. Se genera cuando armemos `develop-idea`.
- No hay secrets commiteados. `.env.example` es el único con nombres.

## Próximo paso inmediato

**`supabase link` + primera migración (profiles + ideas + RLS).**

Comando probable para arrancar:

```bash
pnpm supabase link --project-ref <ref>
```

Donde `<ref>` es el identificador del proyecto Supabase (aparece en la URL del dashboard).

## Cómo retomar con un Claude nuevo

Pegar este `STATUS.md` completo como primer mensaje. Indicar qué tarea específica se quiere hacer. No hace falta re-explicar el plan general — está acá.
