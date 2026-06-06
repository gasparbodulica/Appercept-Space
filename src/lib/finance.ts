import { Database, Row } from './types';

export interface CategorySlice {
  label: string;
  amount: number;
  color: string;
}

export interface CompanyFinance {
  monthLabel: string;     // 'June'
  revenue: number;        // client retainer revenue
  consultingRevenue: number; // one-off consulting fees this month
  clubRevenue: number;    // ClubCrowd reservation fees (season-adjusted monthly avg)
  totalRevenue: number;   // revenue + consultingRevenue + clubRevenue
  expenses: number;       // effective cost of all rows this month (recurring + yearly + one-time)
  profit: number;         // totalRevenue - expenses
  byCategory: CategorySlice[];
  expenseCount: number;   // number of cost rows contributing this month
}

/**
 * ClubCrowd monthly revenue from reservation fees, season-adjusted.
 * Each club's yearly revenue = fee × monthly reservations × active months;
 * we divide the total by 12 to get a fair recurring monthly contribution.
 */
export function computeClubRevenue(clubcrowdDb: Database | undefined): { monthlyAvg: number; yearly: number; venueCount: number } {
  if (!clubcrowdDb) return { monthlyAvg: 0, yearly: 0, venueCount: 0 };
  const feeCol    = clubcrowdDb.columns.find(c => c.name === 'Fee / reservation (€)');
  const resCol    = clubcrowdDb.columns.find(c => c.name === 'Monthly reservations');
  const seasonCol = clubcrowdDb.columns.find(c => c.name === 'Operating season');
  if (!feeCol || !resCol) return { monthlyAvg: 0, yearly: 0, venueCount: 0 };
  const months = (label: string): number => {
    if (!label) return 12;
    if (/year|12/i.test(label)) return 12;
    const m = label.match(/(\d+)/);
    return m ? Number(m[1]) : 12;
  };
  let yearly = 0;
  let venueCount = 0;
  for (const row of clubcrowdDb.rows) {
    const fee = Number(row.cells[feeCol.id]) || 0;
    const res = Number(row.cells[resCol.id]) || 0;
    const monthly = fee * res;
    if (monthly > 0) venueCount += 1;
    const mo = seasonCol ? months(String(row.cells[seasonCol.id] ?? '')) : 12;
    yearly += monthly * mo;
  }
  return { monthlyAvg: Math.round(yearly / 12), yearly: Math.round(yearly), venueCount };
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function ym(dateStr: string): string {
  const d = String(dateStr).split('|')[0].split('T')[0];
  return d.slice(0, 7); // YYYY-MM
}

function nowYM(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface CostCols {
  companyCol?: { id: string };
  amountCol?: { id: string };
  dateCol?: { id: string };
  freqCol?: { id: string };
  categoryCol?: { id: string };
}

function costColumns(costsDb: Database): CostCols {
  return {
    companyCol: costsDb.columns.find(c => c.name === 'Company'),
    amountCol: costsDb.columns.find(c => c.type === 'number'),
    dateCol: costsDb.columns.find(c => c.type === 'date' || c.type === 'date_range'),
    freqCol: costsDb.columns.find(c => c.name === 'Frequency'),
    categoryCol: costsDb.columns.find(c => c.name === 'Category'),
  };
}

/**
 * The amount this cost row contributes to the CURRENT month's expenses,
 * honouring its billing frequency:
 *   • One-time → full amount only in the month it is dated
 *   • Monthly  → full amount every month from its start date onward
 *   • Yearly   → amortised (amount ÷ 12) every month from its start date onward
 */
export function effectiveMonthlyCost(row: Row, cols: CostCols, currentYM: string): number {
  if (!cols.amountCol || !cols.dateCol) return 0;
  const amt = Number(row.cells[cols.amountCol.id]) || 0;
  if (!amt) return 0;

  const dateVal = row.cells[cols.dateCol.id];
  const startYM = dateVal ? ym(String(dateVal)) : null;
  const freq = cols.freqCol ? String(row.cells[cols.freqCol.id] ?? 'One-time') : 'One-time';
  const started = !startYM || startYM <= currentYM;

  if (freq === 'Monthly') return started ? amt : 0;
  if (freq === 'Yearly') return started ? amt / 12 : 0;
  // One-time (default)
  return startYM === currentYM ? amt : 0;
}

/** Locate the expenses (Costs) database from a map of all databases. */
export function findCostsDb(databases: Record<string, Database>): Database | undefined {
  const dbs = Object.values(databases);
  return dbs.find(d => d.id === 'db-costs')
    ?? dbs.find(d => d.columns.some(c => c.name === 'Company') && d.columns.some(c => c.type === 'number') && d.columns.some(c => c.type === 'date'));
}

/** Locate the Clients database. */
export function findClientsDb(databases: Record<string, Database>): Database | undefined {
  const dbs = Object.values(databases);
  return dbs.find(d => d.id === 'db-clients')
    ?? dbs.find(d => d.columns.some(c => c.name === 'Company') && d.columns.some(c => c.name === 'Status') && d.columns.some(c => c.type === 'number'));
}

/**
 * A client's effective monthly revenue, honouring frequency:
 *   • Monthly  → full amount every month
 *   • Yearly   → amount ÷ 12 each month
 *   • One-time → counted as this month's revenue (a one-off payment)
 * Inactive clients contribute nothing.
 */
function clientEffectiveRevenue(row: Row, revColId: string, freqColId: string | undefined, statusColId: string | undefined): number {
  const status = statusColId ? String(row.cells[statusColId] ?? '') : '';
  if (status === 'Inactive') return 0;
  const amt = Number(row.cells[revColId]) || 0;
  if (!amt) return 0;
  const freq = freqColId ? String(row.cells[freqColId] ?? 'Monthly') : 'Monthly';
  if (freq === 'Yearly') return amt / 12;
  return amt; // Monthly or One-time both count toward this month
}

function clientMatchesCompany(clientCompany: string, companyName: string): boolean {
  const a = clientCompany.toLowerCase().replace(/\s+(d\.o\.o\.|obrt)\.?$/,'').trim();
  const b = companyName.toLowerCase().replace(/\s+(d\.o\.o\.|obrt)\.?$/,'').trim();
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * A company's monthly revenue:
 *   • Appercept (the agency) → sum of ALL clients' effective revenue
 *   • any other company       → that company's own client revenue (matched by name)
 */
export function companyRevenue(clientsDb: Database | undefined, companyName: string): number {
  if (!clientsDb || !companyName) return 0;
  const revCol = clientsDb.columns.find(c => c.type === 'number');
  const freqCol = clientsDb.columns.find(c => c.name === 'Frequency');
  const statusCol = clientsDb.columns.find(c => c.name === 'Status');
  const companyCol = clientsDb.columns.find(c => c.name === 'Company');
  if (!revCol) return 0;

  const isAgency = companyName.trim().toLowerCase() === 'appercept';
  let total = 0;
  for (const row of clientsDb.rows) {
    if (!isAgency) {
      const cc = companyCol ? String(row.cells[companyCol.id] ?? '') : '';
      if (!clientMatchesCompany(cc, companyName)) continue;
    }
    total += clientEffectiveRevenue(row, revCol.id, freqCol?.id, statusCol?.id);
  }
  return Math.round(total);
}

/**
 * Consulting fees earned this month (completed or in-progress rows with a fee in the current month).
 * Counts all consulting rows whose date falls in the current month-year.
 */
export function computeConsultingRevenue(consultingDb: Database | undefined): { revenue: number; count: number } {
  if (!consultingDb) return { revenue: 0, count: 0 };
  const feeCol = consultingDb.columns.find(c => c.name === 'Fee');
  const dateCol = consultingDb.columns.find(c => c.type === 'date');
  const statusCol = consultingDb.columns.find(c => c.type === 'status');
  if (!feeCol) return { revenue: 0, count: 0 };
  const curYM = nowYM();
  let revenue = 0;
  let count = 0;
  for (const row of consultingDb.rows) {
    const status = statusCol ? String(row.cells[statusCol.id] ?? '') : '';
    if (status === 'Not started') continue; // only count active/completed
    const fee = Number(row.cells[feeCol.id]) || 0;
    if (!fee) continue;
    const rowDate = dateCol ? String(row.cells[dateCol.id] ?? '') : '';
    // Include if date is this month OR no date (treat as this month)
    if (!rowDate || ym(rowDate) === curYM) {
      revenue += fee;
      count += 1;
    }
  }
  return { revenue: Math.round(revenue), count };
}

/** Total monthly revenue Appercept earns from all its clients (frequency-aware). */
export function computeClientRevenue(clientsDb: Database | undefined): { revenue: number; activeCount: number } {
  if (!clientsDb) return { revenue: 0, activeCount: 0 };
  const revCol = clientsDb.columns.find(c => c.type === 'number');
  const freqCol = clientsDb.columns.find(c => c.name === 'Frequency');
  const statusCol = clientsDb.columns.find(c => c.name === 'Status');
  if (!revCol) return { revenue: 0, activeCount: 0 };
  let revenue = 0;
  let activeCount = 0;
  for (const row of clientsDb.rows) {
    const eff = clientEffectiveRevenue(row, revCol.id, freqCol?.id, statusCol?.id);
    if (eff > 0) { revenue += eff; activeCount += 1; }
  }
  return { revenue: Math.round(revenue), activeCount };
}

/** Effective total of a company's costs for the current month (all frequencies). */
export function companyMonthlyExpenses(costsDb: Database | undefined, companyName: string): number {
  if (!costsDb || !companyName) return 0;
  const cols = costColumns(costsDb);
  if (!cols.amountCol || !cols.dateCol) return 0;
  const currentYM = nowYM();
  let total = 0;
  for (const row of costsDb.rows) {
    if (cols.companyCol && String(row.cells[cols.companyCol.id] ?? '') !== companyName) continue;
    total += effectiveMonthlyCost(row, cols, currentYM);
  }
  return total;
}

/**
 * Appercept finances for the current month.
 * Costs holds EXPENSES only — every cost (one-time, monthly or yearly) is taken
 * out of the company's total revenue (retainers + consulting) to give the monthly profit.
 */
export function computeCompanyFinance(
  costsDb: Database | undefined,
  companyName: string,
  monthlyRevenue: number,
  consultingRevenue = 0,
  clubRevenue = 0,
): CompanyFinance {
  const now = new Date();
  const currentYM = nowYM();

  const catColors: Record<string, string> = {};
  let cols: CostCols = {};
  if (costsDb) {
    cols = costColumns(costsDb);
    costsDb.columns.find(c => c.name === 'Category')?.config.options?.forEach(o => { catColors[o.label] = o.color; });
  }

  let expenses = 0;
  let expenseCount = 0;
  const catTotals: Record<string, number> = {};

  if (costsDb && cols.amountCol && cols.dateCol) {
    for (const row of costsDb.rows) {
      if (cols.companyCol && String(row.cells[cols.companyCol.id] ?? '') !== companyName) continue;
      const eff = effectiveMonthlyCost(row, cols, currentYM);
      if (eff <= 0) continue;
      expenses += eff;
      expenseCount += 1;
      const cat = cols.categoryCol ? String(row.cells[cols.categoryCol.id] ?? 'Other') : 'Other';
      catTotals[cat] = (catTotals[cat] ?? 0) + eff;
    }
  }

  const byCategory: CategorySlice[] = Object.entries(catTotals)
    .map(([label, amount]) => ({ label, amount: Math.round(amount), color: catColors[label] ?? '#6b7280' }))
    .sort((a, b) => b.amount - a.amount);

  const roundedExpenses = Math.round(expenses);
  const totalRevenue = monthlyRevenue + consultingRevenue + clubRevenue;
  return {
    monthLabel: MONTHS[now.getMonth()],
    revenue: monthlyRevenue,
    consultingRevenue,
    clubRevenue,
    totalRevenue,
    expenses: roundedExpenses,
    profit: totalRevenue - roundedExpenses,
    byCategory,
    expenseCount,
  };
}
