import { Database, Page } from './types';
import {
  computeClientRevenue, computeConsultingRevenue, computeClubRevenue,
  computeCompanyFinance, computeProjectRevenue, findCostsDb, findClientsDb,
} from './finance';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export interface MoneyLine { label: string; amount: number; color: string; }

function dbBySlug(databases: Record<string, Database>, pages: Page[], slug: string): Database | undefined {
  return Object.values(databases).find((d) => pages.some((p) => p.id === d.page_id && p.slug === slug));
}

// ── Profit & Loss ─────────────────────────────────────────────────────────────
export interface PLStatement {
  monthLabel: string;
  revenueLines: MoneyLine[];
  totalRevenue: number;
  costLines: MoneyLine[];
  totalCosts: number;
  netProfit: number;
  margin: number; // %
}

export function computePL(databases: Record<string, Database>, pages: Page[]): PLStatement {
  const clientsDb  = findClientsDb(databases);
  const projectsDb = dbBySlug(databases, pages, 'projects');
  const consultingDb = dbBySlug(databases, pages, 'consulting');
  const clubcrowdDb  = dbBySlug(databases, pages, 'clubcrowd');
  const costsDb = findCostsDb(databases);

  const { upfrontThisMonth, monthlyRecurring } = computeProjectRevenue(projectsDb, clientsDb);
  const retainers = computeClientRevenue(clientsDb).revenue;
  const consulting = computeConsultingRevenue(consultingDb).revenue;
  // Use actual monthly club revenue (not season-averaged) for the P&L statement.
  const feeC  = clubcrowdDb?.columns.find(c => c.name === 'Fee / reservation (€)');
  const resC  = clubcrowdDb?.columns.find(c => c.name === 'Monthly reservations');
  const statC = clubcrowdDb?.columns.find(c => c.name === 'Status');
  const clubs = (feeC && resC)
    ? (clubcrowdDb?.rows ?? []).reduce((s, r) => {
        const st = statC ? String(r.cells[statC.id] ?? '') : '';
        if (st === 'Lead') return s;
        return s + (Number(r.cells[feeC.id]) || 0) * (Number(r.cells[resC.id]) || 0);
      }, 0)
    : 0;
  const totalRevenue = upfrontThisMonth + monthlyRecurring + retainers + consulting + clubs;
  const fin = computeCompanyFinance(costsDb, 'Appercept', upfrontThisMonth + retainers + monthlyRecurring, consulting, clubs);

  const revenueLines: MoneyLine[] = [
    { label: 'Project upfronts (this month)', amount: upfrontThisMonth, color: 'var(--color-accent-bright)' },
    { label: 'Project monthly recurring', amount: monthlyRecurring, color: 'var(--color-teal)' },
    { label: 'Client retainers', amount: retainers, color: '#2dd4bf' },
    { label: 'Consulting fees', amount: consulting, color: '#a78bfa' },
    { label: 'Club fees (ClubCrowd)', amount: clubs, color: '#635bff' },
  ].filter((l) => l.amount > 0);

  const costLines: MoneyLine[] = fin.byCategory.map((c) => ({ label: c.label, amount: c.amount, color: c.color }));

  const netProfit = totalRevenue - fin.expenses;
  return {
    monthLabel: fin.monthLabel,
    revenueLines,
    totalRevenue,
    costLines,
    totalCosts: fin.expenses,
    netProfit,
    margin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
  };
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────
export interface CashFlowStatement {
  monthLabel: string;
  operating: { in: number; out: number; net: number };
  investing: { in: number; out: number; net: number };
  financing: { in: number; out: number; net: number };
  netChange: number;
}

export function computeCashFlow(databases: Record<string, Database>, pages: Page[]): CashFlowStatement {
  const pl = computePL(databases, pages);
  const cashflowDb = dbBySlug(databases, pages, 'cashflow');

  // Operating = real revenue in, real costs out (matches the P&L)
  const operating = { in: pl.totalRevenue, out: pl.totalCosts, net: pl.totalRevenue - pl.totalCosts };

  // Investing / Financing from the manual Cash Flow database (this month)
  const dirCol = cashflowDb?.columns.find((c) => c.name === 'Direction');
  const amtCol = cashflowDb?.columns.find((c) => c.name === 'Amount');
  const dateCol = cashflowDb?.columns.find((c) => c.type === 'date');
  const actCol = cashflowDb?.columns.find((c) => c.name === 'Activity');
  const curYM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const inv = { in: 0, out: 0, net: 0 };
  const fin = { in: 0, out: 0, net: 0 };
  for (const r of cashflowDb?.rows ?? []) {
    const d = dateCol ? String(r.cells[dateCol.id] ?? '').slice(0, 7) : '';
    if (d && d !== curYM) continue;
    const act = actCol ? String(r.cells[actCol.id] ?? '') : '';
    const dir = dirCol ? String(r.cells[dirCol.id] ?? '') : '';
    const amt = amtCol ? Number(r.cells[amtCol.id]) || 0 : 0;
    const bucket = act === 'Investing' ? inv : act === 'Financing' ? fin : null;
    if (!bucket) continue;
    if (dir === 'Inflow') bucket.in += amt; else if (dir === 'Outflow') bucket.out += amt;
  }
  inv.net = inv.in - inv.out;
  fin.net = fin.in - fin.out;

  return {
    monthLabel: pl.monthLabel,
    operating, investing: inv, financing: fin,
    netChange: operating.net + inv.net + fin.net,
  };
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────
export interface BalanceItem { name: string; amount: number; type: string; }
export interface BalanceSheetStatement {
  assets: { items: BalanceItem[]; current: number; nonCurrent: number; total: number };
  liabilities: { items: BalanceItem[]; current: number; nonCurrent: number; total: number };
  equity: { items: BalanceItem[]; total: number };
  liabPlusEquity: number;
  balanced: boolean;
  difference: number;
}

export function computeBalanceSheet(databases: Record<string, Database>, pages: Page[]): BalanceSheetStatement {
  const db = dbBySlug(databases, pages, 'balance-sheet');
  const nameCol = db?.columns.find((c) => c.position === 0);
  const catCol = db?.columns.find((c) => c.name === 'Category');
  const typeCol = db?.columns.find((c) => c.name === 'Type');
  const amtCol = db?.columns.find((c) => c.name === 'Amount');

  const assets: BalanceItem[] = [], liabilities: BalanceItem[] = [], equity: BalanceItem[] = [];
  for (const r of db?.rows ?? []) {
    const name = nameCol ? String(r.cells[nameCol.id] ?? '') : '';
    const cat = catCol ? String(r.cells[catCol.id] ?? '') : '';
    const type = typeCol ? String(r.cells[typeCol.id] ?? '') : '';
    const amt = amtCol ? Number(r.cells[amtCol.id]) || 0 : 0;
    const item = { name, amount: amt, type };
    if (cat === 'Asset') assets.push(item);
    else if (cat === 'Liability') liabilities.push(item);
    else if (cat === 'Equity') equity.push(item);
  }
  const sumBy = (items: BalanceItem[], t?: string) => items.filter((i) => !t || i.type === t).reduce((s, i) => s + i.amount, 0);
  const aTotal = sumBy(assets), lTotal = sumBy(liabilities), eTotal = sumBy(equity);
  const liabPlusEquity = lTotal + eTotal;

  return {
    assets: { items: assets, current: sumBy(assets, 'Current'), nonCurrent: sumBy(assets, 'Non-current'), total: aTotal },
    liabilities: { items: liabilities, current: sumBy(liabilities, 'Current'), nonCurrent: sumBy(liabilities, 'Non-current'), total: lTotal },
    equity: { items: equity, total: eTotal },
    liabPlusEquity,
    balanced: Math.abs(aTotal - liabPlusEquity) < 1,
    difference: aTotal - liabPlusEquity,
  };
}

// ── Forecast (recurring run-rate + your predictions → quarters + year) ─────────
export interface ForecastPeriod { label: string; revenue: number; costs: number; profit: number; }
export interface ForecastAssumptions { monthlyConsulting: number; quarterlyGrowthPct: number; annualTarget: number; }
export interface Forecast {
  baseRevenue: number;       // recurring retainers + clubs (from real data)
  monthlyRevenue: number;    // baseRevenue + predicted monthly consulting
  monthlyCosts: number;
  monthlyProfit: number;
  consultingThisMonth: number; // actual consulting booked this month (for reference)
  quarters: ForecastPeriod[];
  year: ForecastPeriod;
  annualTarget: number;
}

/** Recurring monthly costs: Monthly = full, Yearly = ÷12, One-time = excluded. */
function recurringMonthlyCosts(costsDb: Database | undefined): number {
  if (!costsDb) return 0;
  const amountCol = costsDb.columns.find((c) => c.type === 'number');
  const freqCol = costsDb.columns.find((c) => c.name === 'Frequency');
  const companyCol = costsDb.columns.find((c) => c.name === 'Company');
  if (!amountCol) return 0;
  let total = 0;
  for (const r of costsDb.rows) {
    if (companyCol && String(r.cells[companyCol.id] ?? '') !== 'Appercept') continue;
    const amt = Number(r.cells[amountCol.id]) || 0;
    const freq = freqCol ? String(r.cells[freqCol.id] ?? 'One-time') : 'One-time';
    if (freq === 'Monthly') total += amt;
    else if (freq === 'Yearly') total += amt / 12;
    // One-time excluded from a forward run-rate
  }
  return Math.round(total);
}

export function computeForecast(databases: Record<string, Database>, pages: Page[], a: ForecastAssumptions): Forecast {
  const clientsDb = findClientsDb(databases);
  const clubcrowdDb = dbBySlug(databases, pages, 'clubcrowd');
  const consultingDb = dbBySlug(databases, pages, 'consulting');
  const costsDb = findCostsDb(databases);

  // Recurring revenue = client retainers (frequency-aware) + club monthly average.
  const baseRevenue = computeClientRevenue(clientsDb).revenue + computeClubRevenue(clubcrowdDb).monthlyAvg;
  // + your predicted monthly consulting (editable)
  const monthlyRevenue = baseRevenue + (a.monthlyConsulting || 0);
  const monthlyCosts = recurringMonthlyCosts(costsDb);
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const consultingThisMonth = computeConsultingRevenue(consultingDb).revenue;

  // Apply quarter-over-quarter growth to revenue (costs held flat = conservative).
  const g = 1 + (a.quarterlyGrowthPct || 0) / 100;
  const year = new Date().getFullYear();
  let yRev = 0, yCost = 0, yProfit = 0;
  const quarters: ForecastPeriod[] = [1, 2, 3, 4].map((q) => {
    const factor = Math.pow(g, q - 1);
    const revenue = Math.round(monthlyRevenue * 3 * factor);
    const costs = Math.round(monthlyCosts * 3);
    const profit = revenue - costs;
    yRev += revenue; yCost += costs; yProfit += profit;
    return { label: `Q${q} ${year}`, revenue, costs, profit };
  });

  return {
    baseRevenue, monthlyRevenue, monthlyCosts, monthlyProfit, consultingThisMonth,
    quarters,
    year: { label: `${year}`, revenue: yRev, costs: yCost, profit: yProfit },
    annualTarget: a.annualTarget || 0,
  };
}

export const STATEMENT_MONTHS = MONTHS;
