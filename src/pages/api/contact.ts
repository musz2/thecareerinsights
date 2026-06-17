import type { APIRoute } from "astro";
import { appendLead } from "../../lib/lead-store";

export const prerender = false;

function clean(value: unknown, limit = 2000) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, limit);
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const lead = {
    id: crypto.randomUUID(),
    name: clean(payload.name, 120),
    email: clean(payload.email, 240).toLowerCase(),
    interest: clean(payload.interest || "Career Consultation", 160),
    message: clean(payload.message),
    source: "thecareerinsights.com",
    createdAt: new Date().toISOString()
  };

  const errors: Record<string, string> = {};
  if (!lead.name) errors.name = "Name is required";
  if (!/^\S+@\S+\.\S+$/.test(lead.email)) errors.email = "A valid email is required";
  if (!lead.message) errors.message = "Context is required";

  if (Object.keys(errors).length) {
    return Response.json({ errors }, { status: 422 });
  }

  await appendLead(lead);
  return Response.json({ ok: true, leadId: lead.id }, { status: 201 });
};
