import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface Lead {
  id: string;
  name: string;
  email: string;
  interest: string;
  message: string;
  source: string;
  createdAt: string;
}

const leadDirectory = path.join(process.cwd(), "data");
const leadFile = path.join(leadDirectory, "leads.jsonl");

export async function appendLead(lead: Lead) {
  await mkdir(leadDirectory, { recursive: true });
  await appendFile(leadFile, `${JSON.stringify(lead)}\n`, "utf8");
}
