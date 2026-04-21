# CLAUDE.md — Convenciones de IdeaVault

Archivo leído automáticamente por Claude Code al inicio de cada sesión. Contiene convenciones estables del proyecto. El estado variable (qué está hecho, qué viene) vive en `docs/STATUS.md`.

## Stack

- Monorepo pnpm workspaces, Node 20 LTS (engines: `>=20.12`)
- Web: Vite 8 + React 19 + TypeScript 6
- Mobile (Fase 3): Expo managed workflow + EAS
- Backend: Supabase (Postgres + Auth + Edge Functions + Storage)
- Shared: `@ideavault/core` (tipos, Supabase client, schemas zod)
- Estado servidor: TanStack Query
- Routing web: React Router
- Validación: zod en cliente y Edge Functions
- IA: Anthropic API, Claude Haiku 4.5 por default, siempre vía Edge Function

## Reglas no negociables

1. API key de Anthropic nunca en cliente — siempre Edge Function con JWT validado y rate limit en DB.
2. RLS en toda tabla, en la misma migración que crea la tabla.
3. TypeScript estricto. Cero `any`, cero `@ts-ignore`. Si hay un tipo complicado, usar `unknown` + narrow.
4. Lógica compartida en `@ideavault/core`, nunca duplicada entre apps.
5. Soft deletes (`deleted_at`) en toda entidad sincronizable.
6. Validación zod en Edge Functions antes de tocar DB.
7. Extensiones `.js` en imports TS internos de `@ideavault/core` — requisito de `moduleResolution: "Bundler"` + `verbatimModuleSyntax`.

## Comandos frecuentes

### Desarrollo

- `pnpm --filter @ideavault/web dev` — dev server de la web
- `pnpm --filter @ideavault/web build` — type-check + build de prod

### Supabase — migraciones y tipos

- `pnpm supabase migration new <nombre>` — crea archivo SQL vacío
- `pnpm supabase db push` — aplica migraciones al remoto
- `pnpm supabase gen types typescript --linked > packages/core/src/supabase/database.types.ts` — regenera tipos

### Supabase — Edge Functions

- `pnpm supabase functions new <nombre>` — scaffoldea función
- `pnpm supabase functions deploy <nombre>` — deploy al remoto
- `pnpm supabase functions deploy <nombre> --no-verify-jwt` — si la función valida JWT manualmente
- Logs de functions: **solo desde el dashboard web** (la CLI no tiene `logs`). URL: `https://supabase.com/dashboard/project/<ref>/functions/<name>/logs`

### Supabase — secrets

Usar siempre archivo temporal (el inline tiene problemas de parsing con caracteres especiales):

```bash
echo "MI_SECRET=valor" > .env.tmp
pnpm supabase secrets set --env-file .env.tmp
rm .env.tmp
pnpm supabase secrets list
```

## Convenciones de commits

Conventional commits. Formato: `tipo(scope): descripción en minúscula sin punto final`.

Tipos usados:

- `feat`: nueva feature
- `fix`: bug fix
- `refactor`: refactor sin cambio funcional
- `docs`: solo documentación
- `chore`: housekeeping (config, deps, etc.)

Scopes usados: `auth`, `ai`, `db`, `web`, `core`.

Ejemplos reales del repo:

- `feat(ai): edge function develop-idea con provider abstraction y rate limit lifetime`
- `fix(ai): bypass verify_jwt en develop-idea (ES256 lo validamos en el handler)`
- `docs: status + pausa antes de fase 2 mobile-first`

## Estructura del repo

```
ideavault/
├── CLAUDE.md              # este archivo
├── docs/
│   ├── STATUS.md          # estado variable del proyecto
│   └── HANDOFF.md         # efímero entre sesiones, gitignored
├── packages/
│   └── core/              # @ideavault/core — shared TS
│       └── src/
│           ├── env.ts
│           ├── schemas/   # zod schemas de dominio
│           └── supabase/
│               ├── client.ts
│               └── database.types.ts   # regenerado por CLI
├── apps/
│   └── web/
│       └── src/
│           ├── app/       # providers, router, ProtectedRoute
│           ├── features/  # feature folders: auth, ideas
│           ├── lib/       # supabase singleton, etc.
│           └── styles/
└── supabase/
    ├── config.toml
    ├── migrations/
    └── functions/
```

## Convención de carpetas dentro de un feature

```
features/<nombre>/
├── components/   # componentes específicos del feature
├── hooks/        # hooks de React Query + custom hooks
├── pages/        # componentes a nivel ruta
└── lib/          # helpers internos del feature (opcional)
```

## Gotchas conocidos

### Supabase

- **Proyectos nuevos usan ES256 para firmar JWTs**. El verify automático de la plataforma aún no lo soporta. Edge Functions con user auth necesitan `verify_jwt = false` en `config.toml` y validar manualmente con `admin.auth.getUser(token)` usando service role key.
- **CORS en Edge Functions**: el SDK de Supabase (`supabase.functions.invoke`) manda headers `x-client-info` y `apikey`. Incluirlos en `Access-Control-Allow-Headers` del preflight.
- **`database.types.ts` con CHECK constraints**: Supabase solo genera unions literales para enum types nativos de Postgres. Columnas con `check (x in ('a','b'))` se tipean como `string`. Cast manual con `as MyType` cuando se necesite el tipo específico.

### Estilos

- MVP original tenía estilos inline en el componente. Al portar a features/, usar **CSS Modules** (`.module.css`). Variables de color/fuente/spacing en `styles/globals.css` como custom properties CSS.
- Paleta actual: fondo `#0f0e0c`, surface `#161410`, acento `#c8a84b`. Tipografía Lora (serif) + JetBrains Mono.

### Workflow

- **Un solo proyecto Supabase** (`ideavault`, región São Paulo, plan Free). Branches cuando escale.
- **`@ideavault/core` se consume vía source (`.ts`)**, no vía dist. No hay build intermedio.
- **Sin Turbo/Nx**: `pnpm -r` alcanza por ahora.
- **Sin Tailwind**: CSS Modules es la convención actual.

## Cuando algo cambia en este archivo

Si hay una convención nueva o un gotcha que descubrimos en una sesión, agregarlo acá antes de cerrar esa sesión. Commit: `docs: <descripción>`.

Si lo que cambia es el estado (feature nueva, bug fix, decisión de producto), va en `STATUS.md`, no acá.
