import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface WorkspaceContext {
  workspaceName: string;
  currentDate: string;
  team: { name: string; role: string }[];
  clients: { name: string; company: string; status: string; revenue: number; frequency: string }[];
  projects: { name: string; client: string; status: string; progress: number; assignee: string }[];
  tasks: { name: string; status: string; assignee: string; overdue: boolean }[];
  meetings: { title: string; date: string; client: string }[];
  finance: { monthLabel: string; retainerRevenue: number; consultingRevenue: number; totalRevenue: number; costs: number; profit: number };
  consulting: { name: string; client: string; service: string; fee: number; status: string }[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local and restart the server.' }, { status: 503 });
  }

  const { question, context, history = [] }: { question: string; context: WorkspaceContext; history: { role: string; content: string }[] } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: 'No question provided.' }, { status: 400 });

  const systemPrompt = `You are the AI assistant embedded in Appercept Space — an internal workspace tool for Appercept, a Croatian digital agency that specialises in AI consulting, voice bots, chatbots, and process automation.

You have live access to the workspace data shown below. Answer questions concisely and helpfully. When referencing numbers (revenue, progress, counts), be specific. When something needs attention (overdue tasks, at-risk clients, low capacity), flag it proactively. Keep answers short — 2-4 sentences unless the user asks for more detail.

Today is ${context.currentDate}.

## Workspace: ${context.workspaceName}

### Team (${context.team.length} members)
${context.team.map((m) => `- ${m.name} (${m.role})`).join('\n')}

### Clients (${context.clients.length} total)
${context.clients.map((c) => `- ${c.company} | ${c.name} | ${c.status} | €${c.revenue}/${c.frequency}`).join('\n')}

### Projects (${context.projects.length} total)
${context.projects.map((p) => `- ${p.name} | Client: ${p.client} | ${p.status} | ${p.progress}% | Assignee: ${p.assignee}`).join('\n')}

### Tasks (${context.tasks.length} open)
${context.tasks.slice(0, 20).map((t) => `- ${t.name} | ${t.status}${t.overdue ? ' ⚠ OVERDUE' : ''} | ${t.assignee}`).join('\n')}
${context.tasks.length > 20 ? `... and ${context.tasks.length - 20} more tasks` : ''}

### Upcoming meetings
${context.meetings.slice(0, 8).map((m) => `- ${m.title} | ${m.date} | ${m.client}`).join('\n') || 'None scheduled'}

### Consulting pipeline
${context.consulting.map((c) => `- ${c.name} | ${c.client} | ${c.service} | €${c.fee} | ${c.status}`).join('\n') || 'Empty'}

### Finance — ${context.finance.monthLabel}
- Client retainers: €${context.finance.retainerRevenue.toLocaleString()}
- Consulting fees: €${context.finance.consultingRevenue.toLocaleString()}
- Total revenue: €${context.finance.totalRevenue.toLocaleString()}
- Costs: €${context.finance.costs.toLocaleString()}
- Profit: €${context.finance.profit.toLocaleString()}

Answer in English. Be direct, specific, and helpful. If you don't have enough data to answer precisely, say so briefly.`;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: question },
  ];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.error?.message ?? `API error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const answer = data.content?.[0]?.text ?? 'No response.';
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reach Anthropic API.' }, { status: 500 });
  }
}
