# IdeaVault — Estado del proyecto

> Documento vivo. Actualizar al final de cada sesión de trabajo significativa.
> Último update: 2026-04-21 (post-commit fix(ai): bypass verify_jwt en develop-idea).

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

### Fase 1 — Auth + persistencia cloud: 🟡 99% — pendiente activar Anthropic

✅ Hecho:

- Auth con magic link + OAuth Google
- Postgres (profiles, ideas, api_usage) con RLS, triggers, soft deletes
- Migración de `profiles.tier` para estrategia free_trial/byok/paid
- Edge Function `develop-idea` desplegada con:
  - Provider abstraction (AIProvider interface, AnthropicProvider)
  - Rate limit lifetime 20 req para tier `free_trial`
  - Validación zod en request y response del modelo
  - Fix de CORS (x-client-info, apikey)
  - verify_jwt = false para compatibilidad con ES256
- Hook `useDevelopIdea` conectado, error handling inline en IdeaDetailPage

⏸️ Pendiente (administrativo, no código):

- Cargar crédito en Anthropic (mínimo USD 5 en console.anthropic.com/settings/billing)
- Crear API key y setearla como secret en Supabase:
  ```bash
  echo "ANTHROPIC_API_KEY=sk-ant-api03-..." > .env.tmp
  pnpm supabase secrets set --env-file .env.tmp
  rm .env.tmp
  ```
- Testear end-to-end: logueo → crear idea → "Desarrollar con IA" → se llenan los 6 bloques
- Verificar en Supabase Dashboard que `api_usage` registra la request y `ideas.development` se llena

**Decisión explícita del usuario**: este paso se pospone hasta después de Fase 2 (mobile-first).
El costo estimado de testing es despreciable (~USD 0.01 por develop-idea con Haiku), pero queremos
probar la IA sobre la UI final, no la actual.

### Fase 1.5 — Multi-provider + BYOK: PENDIENTE

- Nuevos providers: OpenAIProvider, GeminiProvider (DeepSeek on-demand).
- Tabla `user_api_keys` encriptada (usar pgcrypto + supabase vault).
- Settings page: user pega su key, test de validez.
- Router: si tier=byok usa key del user, si no usa la del sistema.
- Selector de provider/modelo en la UI del botón "Desarrollar".

### Fase 2 — Mobile-first responsive: PRÓXIMA

Alcance definido:

- Sidebar lateral → hamburger menu en <768px
- Grid de cards → columna única en mobile
- Forms y detalle con tipografía/spacing mobile-adaptados
- Empty state: 1-2 ideas de ejemplo pre-desarrolladas inyectadas por
  `handle_new_user()` trigger de Postgres (sin gastar requests de Anthropic)
- Viewport meta tag y PWA basics (manifest, theme color)
- NO hacemos app nativa (React Native/Expo) todavía — responsive PWA alcanza

### Fases 3-6 — PENDIENTES

- Fase 3: Tags custom + compartir ideas (link público + por usuario)
- Fase 4: App mobile con Expo
- Fase 5: Offline + sync
- Fase 6: Export PDF + Notion + polish, dominio, landing, analytics, deploy final

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
- `4ea3219` — feat(auth): oauth con google
- `1e322be` — feat(db): columna tier en profiles para segmentación de uso
- `65f60e5` — feat(ai): edge function develop-idea con provider abstraction y rate limit lifetime
- `6a7a064` — fix(ai): permitir headers x-client-info y apikey en cors de develop-idea
- `8615bc4` — fix(ai): soporte de JWT ES256 en develop-idea
- `9096303` — fix(ai): bypass verify_jwt en develop-idea (ES256 lo validamos en el handler)

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
- **Estrategia de monetización (definida, implementación en Fase 1.5)**:
  free_trial (20 lifetime) → byok (propia key, uso ilimitado) → paid (suscripción).
  BYOK es la defensa contra multi-accounting del free trial — los abusadores
  pasan a BYOK, no hacen daño económico.
- **verify_jwt = false en develop-idea**: necesario porque Supabase aún no
  soporta ES256 en el verify automático de la plataforma. Nuestro handler
  valida el JWT manualmente con `admin.auth.getUser(token)`. Seguro.
- **Supabase secrets método preferido**: `--env-file` con archivo temporal
  que se borra después. El método inline (`set KEY=value`) tiene problemas
  de parsing con caracteres especiales.

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

**Fase 2 (mobile-first responsive) ANTES de activar Anthropic.**

Decisión: el target primario del producto es mobile (capturar ideas al vuelo).
Hacer la web responsive mobile-first ahora evita rediseñar después. Cuando la
UI esté lista, recién ahí cargamos USD 5 en Anthropic y testeamos IA sobre la
versión final.

Alcance Fase 2:

- Sidebar lateral → hamburger menu en <768px
- Grid de cards → columna única en mobile
- Forms y detalle con tipografía/spacing mobile-adaptados
- Empty state: 1-2 ideas de ejemplo pre-desarrolladas inyectadas por
  `handle_new_user()` trigger de Postgres (sin gastar requests de Anthropic)
- Viewport meta tag y PWA basics (manifest, theme color)
- NO hacemos app nativa (React Native/Expo) todavía — responsive PWA alcanza

## Cómo retomar con un Claude nuevo

Pegar este `STATUS.md` completo como primer mensaje. Indicar qué tarea específica se quiere hacer. No hace falta re-explicar el plan general — está acá.
