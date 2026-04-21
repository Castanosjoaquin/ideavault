// Edge Function: develop-idea
// Auth → rate limit → AI provider → update idea → log usage → respond

import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod";

// ============================================================
// CONFIG
// ============================================================

const LIFETIME_LIMIT_BY_TIER = {
  free_trial: 20,
  byok: Infinity,
  paid: Infinity,
} as const;

type Tier = keyof typeof LIFETIME_LIMIT_BY_TIER;

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================
// SCHEMAS
// ============================================================

const RequestSchema = z.object({
  ideaId: z.string().uuid(),
});

const DevelopmentSchema = z.object({
  problema: z.string(),
  propuesta: z.string(),
  pasos: z.array(z.string()).min(1),
  desafios: z.array(z.string()).min(1),
  recursos: z.array(z.string()).min(1),
  proxima_accion: z.string(),
});

type Development = z.infer<typeof DevelopmentSchema>;

// ============================================================
// PROVIDER ABSTRACTION
// ============================================================

type ProviderName = "anthropic"; // | 'openai' | 'gemini' | 'deepseek' (Fase 1.5)

interface ProviderResult {
  development: Development;
  tokensInput: number | null;
  tokensOutput: number | null;
  model: string;
}

interface AIProvider {
  readonly name: ProviderName;
  develop(title: string, description: string | null): Promise<ProviderResult>;
}

class AnthropicProvider implements AIProvider {
  readonly name: ProviderName = "anthropic";
  constructor(
    private apiKey: string,
    private model: string = DEFAULT_MODEL,
  ) {}

  async develop(title: string, description: string | null): Promise<ProviderResult> {
    const prompt = buildPrompt(title, description);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new ProviderError(`anthropic_${res.status}`, detail);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const text = data.content.map((b) => b.text ?? "").join("");
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed: Development;
    try {
      parsed = DevelopmentSchema.parse(JSON.parse(clean));
    } catch (e) {
      throw new ProviderError("invalid_model_output", `${e}. Raw: ${clean.slice(0, 500)}`);
    }

    return {
      development: parsed,
      tokensInput: data.usage?.input_tokens ?? null,
      tokensOutput: data.usage?.output_tokens ?? null,
      model: this.model,
    };
  }
}

class ProviderError extends Error {
  constructor(
    public code: string,
    public detail: string,
  ) {
    super(`${code}: ${detail}`);
  }
}

function getProvider(name: ProviderName): AIProvider {
  switch (name) {
    case "anthropic":
      return new AnthropicProvider(Deno.env.get("ANTHROPIC_API_KEY")!);
    default: {
      const _exhaustive: never = name;
      throw new Error(`unknown_provider: ${_exhaustive}`);
    }
  }
}

// ============================================================
// HANDLER
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    // 2. Validación body
    const body = await req.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "invalid_request", details: parsed.error.flatten() }, 400);
    }
    const { ideaId } = parsed.data;

    // 3. Admin client para queries privilegiadas
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 4. Fetch tier + current usage + idea — en paralelo
    const [profileRes, usageRes, ideaRes] = await Promise.all([
      admin.from("profiles").select("tier").eq("id", userId).single(),
      admin.from("api_usage").select("*", { count: "exact", head: true }).eq("user_id", userId),
      userClient
        .from("ideas")
        .select("id, title, description, stage")
        .eq("id", ideaId)
        .is("deleted_at", null)
        .single(),
    ]);

    if (profileRes.error || !profileRes.data) {
      return json({ error: "profile_not_found" }, 500);
    }
    if (usageRes.error) {
      return json({ error: "internal", detail: usageRes.error.message }, 500);
    }
    if (ideaRes.error || !ideaRes.data) {
      return json({ error: "idea_not_found" }, 404);
    }

    const tier = profileRes.data.tier as Tier;
    const used = usageRes.count ?? 0;
    const limit = LIFETIME_LIMIT_BY_TIER[tier] ?? LIFETIME_LIMIT_BY_TIER.free_trial;
    const idea = ideaRes.data;

    // 5. Rate limit check
    if (used >= limit) {
      return json(
        {
          error: "rate_limit",
          tier,
          limit,
          used,
          window: "lifetime",
        },
        429,
      );
    }

    // 6. Call provider
    const provider = getProvider("anthropic");
    let result: ProviderResult;
    try {
      result = await provider.develop(idea.title, idea.description);
    } catch (e) {
      if (e instanceof ProviderError) {
        return json({ error: e.code, detail: e.detail }, 502);
      }
      throw e;
    }

    // 7. Update idea + log usage (en paralelo)
    const newStage = idea.stage === "seed" ? "growing" : idea.stage;
    const [updateRes, logRes] = await Promise.all([
      admin
        .from("ideas")
        .update({ development: result.development, stage: newStage })
        .eq("id", ideaId)
        .eq("user_id", userId),
      admin.from("api_usage").insert({
        user_id: userId,
        model: "haiku",
        tokens_input: result.tokensInput,
        tokens_output: result.tokensOutput,
      }),
    ]);

    if (updateRes.error) {
      return json({ error: "update_failed", detail: updateRes.error.message }, 500);
    }
    if (logRes.error) {
      // Log fallido pero idea actualizada: no rompemos la respuesta.
      console.error("usage log failed:", logRes.error);
    }

    return json(
      {
        development: result.development,
        usage: {
          used: used + 1,
          limit,
          tier,
          remaining: limit === Infinity ? null : limit - used - 1,
        },
      },
      200,
    );
  } catch (e) {
    console.error("unhandled:", e);
    return json({ error: "internal", detail: String(e) }, 500);
  }
});

// ============================================================
// HELPERS
// ============================================================

function json(body: unknown, status = 200) {
  // JSON.stringify no serializa Infinity — lo mapeamos a null antes.
  const safe = JSON.parse(JSON.stringify(body, (_k, v) => (v === Infinity ? null : v)));
  return new Response(JSON.stringify(safe), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function buildPrompt(title: string, description: string | null): string {
  return `Eres un coach de proyectos e ideas. El usuario tiene esta idea: "${title}". ${
    description ? `Descripción inicial: "${description}".` : ""
  }

Desarrolla esta idea de forma estructurada y práctica. Responde SOLO en JSON con este formato exacto, sin texto adicional ni markdown:
{
  "problema": "¿Qué problema o necesidad resuelve esta idea? (2-3 oraciones)",
  "propuesta": "¿Cuál es la solución o propuesta central? (2-3 oraciones)",
  "pasos": ["paso 1 concreto", "paso 2 concreto", "paso 3 concreto", "paso 4 concreto"],
  "desafios": ["desafío 1", "desafío 2", "desafío 3"],
  "recursos": ["recurso o herramienta 1", "recurso 2", "recurso 3"],
  "proxima_accion": "Una sola acción inmediata y muy concreta que puedes hacer hoy o mañana"
}`;
}
