# IdeaVault — Estado del proyecto

> Documento vivo. Actualizar al final de cada sesión de trabajo significativa.
> Último update: 2026-04-20 (post-commit feat(ai): edge function develop-idea).

## Contexto rápido

App web + mobile para capturar y desarrollar ideas con IA. MVP en camino a producción con constraint de costo ~$0. Autor: estudiante de Ing. en IA, Buenos Aires, stack cómodo con Python/React Native/Supabase, proyecto part-time.

## Stack decidido (no re-discutir sin motivo fuerte)

- **Monorepo**: pnpm workspaces, Node 20 LTS.
- **Web**: Vite 8 + React 19 + TypeScript 6 (versiones reales instaladas, más nuevas que el plan original — preservadas).
- **Mobile** (futuro): Expo managed workflow + EAS.
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage). Sin backend propio.
- **Shared**: `@ideavault/core` — tipos, Supabase client, schemas zod.
- **Estado servidor**: TanStack Query v5.
- **Routing web**: React Router v6.
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
- [x] `packages/core/src/supabase/database.types.ts` — tipos reales generados
- [x] `apps/web/src/lib/supabase.ts` — singleton del client
- [x] `.env.example` commiteado, `.env.local` con credenciales reales (ignorado)
- [x] Smoke test: `supabase.auth.getSession()` responde OK en browser

### Fase 1 — Auth + persistencia cloud: ✅ COMPLETADA

Objetivo: usuarios se registran y sus ideas viven en Postgres. Proxy de Anthropic funcionando.

Completado:

- [x] `supabase link` al proyecto remoto (`buxpbftbncgvicayvhrl`)
- [x] Primera migración SQL: `profiles`, `ideas`, `api_usage` + triggers `updated_at` + trigger crear profile al signup
- [x] RLS policies para las 3 tablas (en la misma migración)
- [x] `database.types.ts` regenerado con tipos reales de `profiles`, `ideas`, `api_usage`
- [x] Schemas zod de dominio en `packages/core/src/schemas/` (idea, auth)
- [x] React Query provider en `apps/web` (`app/providers.tsx`, `staleTime: 30_000`)
- [x] Hooks: `useIdeas`, `useIdea`, `useCreateIdea`, `useUpdateIdea`, `useDeleteIdea` (soft delete)
- [x] `useDevelopIdea` — stub (lanza error hasta Prompt C)
- [x] Auth con magic link: `LoginPage`, `AuthCallbackPage`, `AuthForm`
- [x] `useAuth` hook con `AuthProvider` (Context, `onAuthStateChange`, expone `{ user, session, loading }`)
- [x] `useSignOut` hook
- [x] `ProtectedRoute` con spinner + redirect a `/login`
- [x] Rutas: `/login`, `/signup`, `/auth/callback`, `/`, `/ideas/new`, `/ideas/:id`
- [x] `IdeasListPage` con Sidebar (stage filter + search) + lista de IdeaCards
- [x] `NewIdeaPage` con formulario validado con zod
- [x] `IdeaDetailPage` con edición inline, eliminación (soft delete), botón IA (stub)
- [x] Componentes: `IdeaCard`, `StagePill`, `Sidebar`, `DevBlock`
- [x] CSS Modules — dark theme `#0f0e0c`, fuentes Lora + JetBrains Mono
- [x] `pnpm --filter @ideavault/web build` ✅ sin errores TS

- [x] **OAuth Google** — `useSignInWithGoogle`, `GoogleButton` (SVG inline), separador en `AuthForm`

- [x] Edge Function `develop-idea` con rate limit contra `api_usage`
- [x] Secret `ANTHROPIC_API_KEY` en Supabase
- [x] Reemplazar stub `useDevelopIdea` por `supabase.functions.invoke`

### Fase 1.5 — Multi-provider + BYOK: PENDIENTE

- Nuevos providers: OpenAIProvider, GeminiProvider (DeepSeek on-demand).
- Tabla `user_api_keys` encriptada (usar pgcrypto + supabase vault).
- Settings page: user pega su key, test de validez.
- Router: si tier=byok usa key del user, si no usa la del sistema.
- Selector de provider/modelo en la UI del botón "Desarrollar".

### Fases 2-6 — PENDIENTES

- Fase 2: Tags custom + compartir ideas (link público + por usuario)
- Fase 3: App mobile con Expo
- Fase 4: Offline + sync
- Fase 5: Export PDF + Notion
- Fase 6: Polish, dominio, landing, analytics, deploy final

## Schema actual

Tres tablas en `public`, todas con RLS habilitado:

| Tabla       | Descripción                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`  | Perfil de usuario, 1:1 con `auth.users`. Se crea automáticamente al signup vía trigger. Campo `tier` (free_trial/byok/paid, default free_trial).     |
| `ideas`     | Ideas del usuario. Soft delete (`deleted_at`). Stage: `seed / growing / ready`. Campo `development` jsonb libre.                                     |
| `api_usage` | Log de llamadas a Anthropic. Modelo (`haiku` / `sonnet`), tokens in/out. Solo lectura vía RLS; escritura solo desde Edge Functions con service role. |

Migración: `supabase/migrations/20260420124310_initial_schema.sql`

## Estructura actual del repo

```
ideavault/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.mjs
├── docs/
│   └── STATUS.md
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 20260420124310_initial_schema.sql
├── packages/
│   └── core/
│       └── src/
│           ├── index.ts
│           ├── env.ts
│           ├── schemas/
│           │   ├── idea.ts        # IdeaStage, IdeaDevelopment, Idea, NewIdeaInput, UpdateIdeaInput
│           │   ├── auth.ts        # Email, MagicLinkRequest
│           │   └── index.ts
│           └── supabase/
│               ├── client.ts
│               ├── database.types.ts
│               └── index.ts
└── apps/
    └── web/
        ├── index.html             # Google Fonts (Lora + JetBrains Mono)
        └── src/
            ├── main.tsx           # BrowserRouter + Providers
            ├── App.tsx            # AppRouter
            ├── styles/
            │   └── globals.css    # vars CSS, dark theme, reset
            ├── lib/
            │   └── supabase.ts
            ├── app/
            │   ├── providers.tsx  # QueryClientProvider + AuthProvider
            │   ├── router.tsx     # Routes
            │   └── ProtectedRoute.tsx
            └── features/
                ├── auth/
                │   ├── hooks/     useAuth, useSignOut
                │   ├── pages/     LoginPage, AuthCallbackPage
                │   └── components/ AuthForm
                └── ideas/
                    ├── hooks/     useIdeas, useIdea, useCreateIdea, useUpdateIdea, useDeleteIdea, useDevelopIdea
                    ├── pages/     IdeasListPage, NewIdeaPage, IdeaDetailPage
                    └── components/ IdeaCard, StagePill, Sidebar, DevBlock
```

## Commits hechos

- `d2a19a3` — chore: setup monorepo con apps/web scaffolded
- `e86567c` — feat(core): supabase client tipado + smoke test en web
- `00fb3c2` — feat(db): initial schema con profiles, ideas, api_usage + RLS
- `768142f` — feat(core): schemas zod de idea y auth
- `5078287` — feat(web): auth con magic link + protected routes
- `4ebec9c` — refactor(web): refactor de ideas a features/ con react query
- `(próximo)` — feat(auth): oauth con google

## Decisiones técnicas clave tomadas (para no revisitar)

- **React 19 + Vite 8 + TS 6**: versiones scaffoldeadas por Vite, preservadas. Más nuevas que el plan original pero estables.
- **pnpm** sobre npm/yarn.
- **Extensiones `.js` en imports TS internos de core**: requisito de `moduleResolution: "Bundler"` + `verbatimModuleSyntax`.
- **`globals` en ESLint root config**: no en workspace. Coupling invertido evitado.
- **`eslint.config.mjs`** (no `.js`): para evitar conflicto con package.json sin `"type": "module"`.
- **Node ≥ 20.12** en engines (Vite 8 pide ≥ 20.19).
- **Un solo proyecto Supabase** (`ideavault`), región São Paulo, plan Free. Branches cuando escale.
- **Sin Turbo/Nx** todavía. pnpm -r alcanza.
- **CSS Modules** para estilos de features. `styles/globals.css` para variables y reset.
- **`AuthProvider` con Context**: evita duplicar la suscripción `onAuthStateChange`, compartido vía `useAuth()`.
- **React Router v6** (v6.26 instalado, no v7). BrowserRouter + Routes + Route + Outlet.
- **`@ideavault/core` consumido vía source (`.ts`)**, no vía dist. Ahorra build intermedio.
- **Rate limit LIFETIME (20 para free_trial)** en vez de mensual, dado que la estrategia es free trial → BYOK / paid (Fase 1.5). Se cuenta con `count(*) from api_usage where user_id = X` sin filtro temporal.
- **Provider abstraction en `develop-idea`**: interfaz `AIProvider` con `AnthropicProvider` como única implementación. Agregar providers = nueva clase + `case` en `getProvider` switch.

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

**Fase 2 — Tags custom + compartir ideas.**

## Cómo retomar con un Claude nuevo

Pegar este `STATUS.md` completo como primer mensaje. Indicar qué tarea específica se quiere hacer. No hace falta re-explicar el plan general — está acá.
