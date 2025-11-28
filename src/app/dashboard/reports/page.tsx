'use client';

import { useState, useEffect } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useToast } from '@/components/ToastProvider';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function ReportsPage() {
  const toast = useToast();
  const [reportType, setReportType] = useState('rabbits-inventory');
  // JSON export removed: format fixed to CSV for data downloads; Word export separate
  const format = 'csv';
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [birthStats, setBirthStats] = useState<any[]>([]);
  const [deathStats, setDeathStats] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [pieChartData, setPieChartData] = useState<any>(null);
  const [showPopulation, setShowPopulation] = useState(true);
  const [showOffspring, setShowOffspring] = useState(true);
  const [showLifecycle, setShowLifecycle] = useState(true);
  const [rabbitsData, setRabbitsData] = useState<any[]>([]);
  const [birthsData, setBirthsData] = useState<any[]>([]);
  const [offspringDeathsData, setOffspringDeathsData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [deathsData, setDeathsData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Removed JSON export forcing logic; 'complete' report option also removed from UI

  // Load analysis datasets when analysis view activated
  const fetchWithLoading = useFetchWithLoading();
  useEffect(() => {
    if (!showAnalysis) return;
    const load = async () => {
      try {
        const [birthRes, deathRes, offspringDeathRes, salesRes, expenseRes, rabbitsRes] = await Promise.all([
          fetchWithLoading('/api/births'),
          fetchWithLoading('/api/deaths'),
          fetchWithLoading('/api/offspring-deaths'),
          fetchWithLoading('/api/sales'),
          fetchWithLoading('/api/expenses'),
          fetchWithLoading('/api/rabbits'),
        ]);
        const births = birthRes.ok ? await birthRes.json() : [];
        const deaths = deathRes.ok ? await deathRes.json() : [];
        const offspringDeaths = offspringDeathRes.ok ? await offspringDeathRes.json() : [];
        const sales = salesRes.ok ? await salesRes.json() : [];
        const expenses = expenseRes.ok ? await expenseRes.json() : [];
        const rabbits = rabbitsRes.ok ? await rabbitsRes.json() : [];
        // Store raw datasets for drill-down & exports
        setRabbitsData(rabbits);
        setBirthsData(births);
        setOffspringDeathsData(offspringDeaths);
        setSalesData(sales);
        setDeathsData(deaths);

        const offspringDeathMap: Record<string, number> = {};
        offspringDeaths.forEach((od: any) => {
          const bid = od.birthId || (od.birth?.id);
          if (!bid) return;
          offspringDeathMap[bid] = (offspringDeathMap[bid] || 0) + (od.count || 0);
        });

        const birthData = births
          .sort((a: any, b: any) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime())
          .map((b: any) => ({
            date: new Date(b.birthDate).toLocaleDateString(),
            totalKits: b.totalKits,
            aliveKits: Math.max(0, b.aliveKits - (offspringDeathMap[b.id] || 0)),
            deadKits: b.deadKits + (offspringDeathMap[b.id] || 0),
            survivalRate: b.totalKits ? +((Math.max(0, b.aliveKits - (offspringDeathMap[b.id] || 0)) / b.totalKits) * 100).toFixed(2) : 0,
          }));

        const monthlyMap: Record<string, { births: number; deaths: number; offspringDeaths: number }> = {};
        births.forEach((b: any) => {
          const key = new Date(b.birthDate).toISOString().slice(0,7);
          monthlyMap[key] = monthlyMap[key] || { births: 0, deaths: 0, offspringDeaths: 0 };
          monthlyMap[key].births += b.totalKits;
        });
        deaths.forEach((d: any) => {
          const key = new Date(d.deathDate).toISOString().slice(0,7);
          monthlyMap[key] = monthlyMap[key] || { births: 0, deaths: 0, offspringDeaths: 0 };
          monthlyMap[key].deaths += 1;
        });
        offspringDeaths.forEach((od: any) => {
          const key = new Date(od.deathDate).toISOString().slice(0,7);
          monthlyMap[key] = monthlyMap[key] || { births: 0, deaths: 0, offspringDeaths: 0 };
            monthlyMap[key].offspringDeaths += (od.count || 0);
        });
        const deathBirthData = Object.keys(monthlyMap)
          .sort()
          .map(month => ({
            month,
            births: monthlyMap[month].births,
            deaths: monthlyMap[month].deaths,
            offspringDeaths: monthlyMap[month].offspringDeaths,
          }));

        const financialMap: Record<string, { sales: number; expenses: number }> = {};
        sales.forEach((s: any) => {
          const key = new Date(s.saleDate).toISOString().slice(0,7);
          financialMap[key] = financialMap[key] || { sales: 0, expenses: 0 };
          financialMap[key].sales += s.amount;
        });
        expenses.forEach((e: any) => {
          const key = new Date(e.expenseDate).toISOString().slice(0,7);
          financialMap[key] = financialMap[key] || { sales: 0, expenses: 0 };
          financialMap[key].expenses += e.amount;
        });
        const financialData = Object.keys(financialMap)
          .sort()
          .map(month => ({
            month,
            sales: +financialMap[month].sales.toFixed(2),
            expenses: +financialMap[month].expenses.toFixed(2),
            profit: +(financialMap[month].sales - financialMap[month].expenses).toFixed(2),
          }));

        setBirthStats(birthData);
        setDeathStats(deathBirthData);
        setFinancialStats(financialData);

        // Summary statistics
        const totalRabbits = rabbits.length;
        const bucks = rabbits.filter((r: any) => r.gender === 'BUCK').length;
        const does = rabbits.filter((r: any) => r.gender === 'DOE').length;
        const activeRabbits = rabbits.filter((r: any) => r.status === 'ACTIVE').length;
        const soldRabbits = rabbits.filter((r: any) => r.status === 'SOLD').length;
        const deceasedRabbits = rabbits.filter((r: any) => r.status === 'DECEASED').length;
        const totalKits = births.reduce((sum: number, b: any) => sum + b.totalKits, 0);
        const totalOffspringDeaths = offspringDeaths.reduce((sum: number, od: any) => sum + (od.count || 0), 0);
        const combinedKitDeaths = births.reduce((sum: number, b: any) => sum + b.deadKits, 0) + totalOffspringDeaths; // birth.deadKits + later deaths
        const kitMortalityRate = totalKits ? +((combinedKitDeaths / totalKits) * 100).toFixed(2) : 0;
        const adultMortalityRate = totalRabbits ? +((deceasedRabbits / totalRabbits) * 100).toFixed(2) : 0;

        setSummaryStats({
          totalRabbits,
          bucks,
          does,
          activeRabbits,
          soldRabbits,
          deceasedRabbits,
          totalKits,
          totalOffspringDeaths,
          kitMortalityRate,
          adultMortalityRate,
        });

        // Pie chart data
        const statusData = [
          { name: 'Active', value: activeRabbits, color: '#10B981' },
          { name: 'Sold', value: soldRabbits, color: '#3B82F6' },
          { name: 'Deceased', value: deceasedRabbits, color: '#EF4444' },
        ].filter(d => d.value > 0);

        const genderData = [
          { name: 'Bucks', value: bucks, color: '#6366F1' },
          { name: 'Does', value: does, color: '#EC4899' },
        ].filter(d => d.value > 0);

        const expenseCategoryMap: Record<string, number> = {};
        expenses.forEach((e: any) => {
          expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
        });
        const categoryData = Object.keys(expenseCategoryMap).map(cat => ({
          name: cat,
          value: +expenseCategoryMap[cat].toFixed(2),
        }));
        // Kit outcome distribution (alive vs dead at birth vs later deaths)
        const totalDeadAtBirth = births.reduce((sum: number, b: any) => sum + (b.deadKits || 0), 0);
        const totalLaterDeaths = totalOffspringDeaths;
        const adjustedAliveKits = Math.max(0, totalKits - (totalDeadAtBirth + totalLaterDeaths));
        const kitOutcomeData = [
          { name: 'Alive Kits', value: adjustedAliveKits, color: '#10B981' },
          { name: 'Dead At Birth', value: totalDeadAtBirth, color: '#EF4444' },
          { name: 'Later Deaths', value: totalLaterDeaths, color: '#F59E0B' },
        ].filter(d => d.value > 0);

        setPieChartData({ statusData, genderData, categoryData, kitOutcomeData });
      } catch (err) {
        console.error('Analysis load failed', err);
      }
    };
    load();
  }, [showAnalysis]);

  const exportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetchWithLoading(`/api/reports?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.pushToast({ message: 'Failed to export data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportSummaryStats = () => {
    if (!summaryStats) return;
    const rows = Object.entries(summaryStats).map(([k,v]) => `${k},${v}`);
    const csv = ['metric,value', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_stats_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportReportDocx = async () => {
    try {
      setLoading(true);
      const mod = await import('docx');
      const { Document, Packer, Paragraph, HeadingLevel, TextRun } = mod as any;

      // Fetch data based on reportType (always JSON)
      let data: any[] | any = [];
      const fetchJson = async (url: string) => {
        const res = await fetchWithLoading(url); return res.ok ? res.json() : [];
      };
      switch (reportType) {
        case 'rabbits':
        case 'rabbits-inventory':
          // Fetch both rabbits and offspring
          const [rabbits, offspring] = await Promise.all([
            fetchJson('/api/rabbits'),
            fetchJson('/api/offspring'),
          ]);
          const offspringBatches = Array.isArray(offspring)
            ? offspring
            : (offspring?.items || []);
          // Combine into single array
          data = [
            ...(Array.isArray(rabbits) ? rabbits : []).map((r: any) => ({
              type: 'Adult Rabbit',
              id: r.rabbitId,
              name: r.name,
              gender: r.gender,
              breed: r.breed,
              status: r.status,
              healthStatus: r.healthStatus,
              dateOfBirth: r.dateOfBirth,
              color: r.color,
              count: 1,
              cage: r.cage?.cageId,
              compartment: r.compartment,
              location: r.cage?.rabbitry?.location?.name,
              rabbitry: r.cage?.rabbitry?.name,
              notes: r.notes,
            })),
            ...offspringBatches
              .filter((b: any) => b.status !== 'ARCHIVED')
              .map((b: any) => ({
                type: b.status === 'SEXED' ? 'Grower Batch' : 'Kit Batch',
                id: b.batchId,
                name: null,
                gender:
                  b.maleCount && b.femaleCount
                    ? `${b.maleCount}M/${b.femaleCount}F`
                    : 'Unsexed',
                breed:
                  b.birth?.mating?.buck?.breed || b.birth?.mating?.doe?.breed || '',
                status: b.status,
                healthStatus: b.overallHealthStatus,
                dateOfBirth: b.birth?.birthDate,
                color: null,
                count: b.availableCount ?? b.count,
                cage: b.cage?.cageId,
                compartment: b.compartment,
                location: b.cage?.rabbitry?.location?.name,
                rabbitry: b.cage?.rabbitry?.name,
                notes: b.notes,
              })),
          ];
          break;
        case 'matings': data = await fetchJson('/api/matings'); break;
        case 'births': data = await fetchJson('/api/births'); break;
        case 'deaths':
        case 'death-records':
          // Fetch both adult deaths and offspring deaths
          const [deaths, offspringDeaths] = await Promise.all([
            fetchJson('/api/deaths'),
            fetchJson('/api/offspring-deaths'),
          ]);
          data = [
            ...(Array.isArray(deaths) ? deaths : []).map((d: any) => ({
              type: 'Adult Rabbit',
              deathDate: d.deathDate,
              id: d.rabbit?.rabbitId || d.rabbitId,
              name: d.rabbit?.name,
              breed: d.rabbit?.breed,
              gender: d.rabbit?.gender,
              count: 1,
              cause: d.cause,
              notes: d.notes,
            })),
            ...(Array.isArray(offspringDeaths) ? offspringDeaths : []).map((od: any) => ({
              type: 'Offspring (Kit)',
              deathDate: od.deathDate,
              id: null,
              name: null,
              breed: od.birth?.mating?.buck?.breed || od.birth?.mating?.doe?.breed || '',
              gender: null,
              count: od.count,
              cause: od.cause,
              notes: od.notes,
            })),
          ];
          break;
        case 'finance-records':
          // Fetch both sales and expenses
          const [sales, expenses] = await Promise.all([
            fetchJson('/api/sales'),
            fetchJson('/api/expenses'),
          ]);
          data = [
            ...(Array.isArray(sales) ? sales : []).map((s: any) => ({
              type: 'Sale',
              date: s.saleDate,
              description: s.description,
              category: null,
              amount: s.amount,
              rabbit: s.rabbit?.rabbitId || s.rabbitId,
              buyerName: s.buyerName,
              buyerContact: s.buyerContact,
              vendor: null,
              notes: s.notes,
            })),
            ...(Array.isArray(expenses) ? expenses : []).map((e: any) => ({
              type: 'Expense',
              date: e.expenseDate,
              description: e.description,
              category: e.category,
              amount: -Math.abs(e.amount), // Negative for expenses
              rabbit: null,
              buyerName: null,
              buyerContact: null,
              vendor: e.vendor,
              notes: e.notes,
            })),
          ];
          break;
        case 'locations': data = await fetchJson('/api/locations'); break;
        case 'cages': data = await fetchJson('/api/cages'); break;
        case 'workers': data = await fetchJson('/api/workers'); break;
        case 'health':
          // Fetch offspring batches including health history for Word export
          const offspringHealth = await fetchJson('/api/offspring');
          // Flatten health history entries
          const offspringBatchesHealth = Array.isArray(offspringHealth) ? offspringHealth : (offspringHealth?.items || []);
          data = offspringBatchesHealth.flatMap((b:any) =>
            (b.healthHistory || []).map((h:any) => ({
              batchId: b.batchId,
              status: h.status,
              notes: h.notes,
              createdAt: h.createdAt,
            }))
          );
          break;
        case 'complete':
          data = {
            rabbits: await fetchJson('/api/rabbits'),
            matings: await fetchJson('/api/matings'),
            births: await fetchJson('/api/births'),
            deaths: await fetchJson('/api/deaths'),
            sales: await fetchJson('/api/sales'),
            expenses: await fetchJson('/api/expenses'),
            locations: await fetchJson('/api/locations'),
            cages: await fetchJson('/api/cages'),
            workers: await fetchJson('/api/workers'),
          };
          break;
      }

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const reportTitleMap: Record<string, string> = {
        'rabbits-inventory': 'Rabbits Inventory Report',
        'death-records': 'Death Records Report',
        'finance-records': 'Finance Records Report',
      };
      const title = reportTitleMap[reportType] || `${reportType.charAt(0).toUpperCase()+reportType.slice(1).replace(/-/g, ' ')} Report - ${dateStr}`;
      const docSections: any[] = [];
      const addPara = (text: string, opts: any = {}) => docSections.push(new Paragraph({ children:[ new TextRun({ text }) ], ...opts }));

      addPara(title, { heading: HeadingLevel.HEADING_1 });
      addPara('Generated on: ' + today.toLocaleString());
      addPara('');

      if (reportType === 'complete') {
        Object.keys(data).forEach(key => {
          const arr = (data as any)[key];
          addPara(key.toUpperCase(), { heading: HeadingLevel.HEADING_2 });
          addPara(`Count: ${Array.isArray(arr) ? arr.length : 0}`);
          (Array.isArray(arr) ? arr : []).slice(0,200).forEach((item:any, idx:number) => {
            const summary = Object.entries(item)
              .filter(([k,v]) => ['id','rabbitId','batchId','matingDate','birthDate','deathDate','saleDate','expenseDate','gender','breed','status','amount','count','cause','category'].includes(k))
              .map(([k,v]) => `${k}: ${typeof v === 'string' ? v : v instanceof Date ? v.toISOString() : v}`)
              .join(' | ');
            addPara(`${idx+1}. ${summary}`);
          });
          addPara('');
        });
      } else if (reportType === 'health' && Array.isArray(data)) {
        addPara(`Health history entries: ${data.length}`);
        addPara('');
        data.slice(0,500).forEach((item:any, idx:number) => {
          const created = typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString();
          const summary = `Batch ${item.batchId} | Status: ${item.status} | Notes: ${item.notes || '-'} | Date: ${created}`;
          addPara(`${idx+1}. ${summary}`);
        });
      } else if (Array.isArray(data)) {
        addPara(`Record count: ${data.length}`);
        addPara('');
        // For combined reports, show summary by type
        if (reportType === 'rabbits-inventory' || reportType === 'death-records' || reportType === 'finance-records') {
          const typeCounts: Record<string, number> = {};
          data.forEach((item: any) => {
            const type = item.type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          addPara('Summary by type:');
          Object.entries(typeCounts).forEach(([type, count]) => {
            addPara(`  ${type}: ${count} records`);
          });
          addPara('');
        }
        data.slice(0,500).forEach((item:any, idx:number) => {
          const summary = Object.entries(item)
            .filter(([k,v]) => ['type','id','rabbitId','batchId','name','matingDate','birthDate','deathDate','date','saleDate','expenseDate','gender','breed','status','amount','count','cause','category','description'].includes(k))
            .map(([k,v]) => `${k}: ${v === null || v === undefined ? '-' : typeof v === 'string' ? v : v instanceof Date ? v.toISOString() : v}`)
            .join(' | ');
          addPara(`${idx+1}. ${summary}`);
        });
      } else {
        addPara('No data available');
      }

      const doc = new Document({ sections: [{ properties: {}, children: docSections }] });
      const blob = await Packer.toBlob(doc);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${reportType}_report_${dateStr}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Word report export failed', err);
      toast.pushToast({ message: 'Failed to export Word report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const cardBase = (extra: string = '') => `p-4 rounded-lg cursor-pointer transition shadow-sm hover:shadow-md ${extra}`;
  const isActive = (key: string) => activeFilter === key ? 'ring-2 ring-offset-2 ring-purple-500' : '';

  const exportEventsDocx = async () => {
    try {
      const mod = await import('docx');
      const { Document, Packer, Paragraph, TextRun } = mod;
      const dateFmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

      // Precompute offspring alive after adjustments
      const totalKits = birthsData.reduce((s,b)=>s + (b.totalKits||0),0);
      const totalDeadAtBirth = birthsData.reduce((s,b)=>s + (b.deadKits||0),0);
      const totalLaterDeaths = offspringDeathsData.reduce((s,od)=>s + (od.count||0),0);
      const adjustedAliveKits = Math.max(0, totalKits - (totalDeadAtBirth + totalLaterDeaths));

      const sections: any[] = [];
      const sepLine = '*'.repeat(62);

      // Birth events
      birthsData.forEach((b:any) => {
        const d = new Date(b.birthDate);
        const mating = b.mating;
        const doeId = mating?.doe?.id;
        const doeFull = rabbitsData.find((r:any)=> r.id === doeId);
        const cageCode = doeFull?.cage?.cageCode || 'N/A';
        const compartment = doeFull?.cage?.compartment ? `Comp ${doeFull.cage.compartment}` : 'Comp ?';
        const location = doeFull?.cage?.rabbitry?.location?.name || 'Location ?';
        const alive = b.aliveKits ?? 0;
        const dead = (b.deadKits ?? 0) + offspringDeathsData.filter(od=>od.birthId===b.id).reduce((s,od)=>s+(od.count||0),0);
        const total = b.totalKits ?? (alive + dead);
        const successRate = total ? ((alive / total) * 100).toFixed(0) : '0';
        const notePart = b.notes ? ` - ${b.notes}` : '';
        const subject = `⚠${successRate}% Successful Birth(${total} kits; ${dead} lost)${notePart}`;
        sections.push(new Paragraph({ children:[new TextRun({ text: sepLine })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Date: ${dateFmt(d)}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Subject: ${subject}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Cage: ${cageCode} • ${compartment} • ${location}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Offspring count: ${alive}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: '' })]}));
      });

      // Sales events (aggregate by date)
      const salesByDate: Record<string, any[]> = {};
      salesData.forEach((s:any)=>{
        const key = new Date(s.saleDate).toISOString().split('T')[0];
        salesByDate[key] = salesByDate[key] || []; salesByDate[key].push(s);
      });
      Object.keys(salesByDate).sort().forEach(dateKey => {
        const d = new Date(dateKey);
        const items = salesByDate[dateKey];
        const descParts = items.map(it=>{
          const rabbit = rabbitsData.find((r:any)=> r.id === it.rabbitId) || it.rabbit;
          const gender = rabbit?.gender === 'DOE' ? 'doe' : rabbit?.gender === 'BUCK' ? 'buck' : 'rabbit';
          return `${it.description || gender}`;
        });
        const subject = `💲Sale (${descParts.join('; ')})`;
        sections.push(new Paragraph({ children:[new TextRun({ text: sepLine })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Date: ${dateFmt(d)}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Subject: ${subject}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: '' })]}));
      });

      // Death (loss) events aggregated by date
      const deathsByDate: Record<string, any[]> = {};
      deathsData.forEach((dd:any)=>{
        const key = new Date(dd.deathDate).toISOString().split('T')[0];
        deathsByDate[key] = deathsByDate[key] || []; deathsByDate[key].push(dd);
      });
      Object.keys(deathsByDate).sort().forEach(dateKey => {
        const d = new Date(dateKey);
        const records = deathsByDate[dateKey];
        const count = records.length;
        // Choose most common cause
        const causeCount: Record<string,number> = {};
        records.forEach(r=>{ const c = r.cause || 'Unknown'; causeCount[c] = (causeCount[c]||0)+1; });
        const topCause = Object.entries(causeCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Unknown';
        const sampleRabbit = rabbitsData.find((r:any)=> r.id === records[0].rabbitId) || records[0].rabbit;
        const cageCode = sampleRabbit?.cage?.cageCode || 'N/A';
        const compartment = sampleRabbit?.cage?.compartment ? `Comp ${sampleRabbit.cage.compartment}` : 'Comp ?';
        const location = sampleRabbit?.cage?.rabbitry?.location?.name || 'Location ?';
        const subject = `☣Loss of ${count} rabbit${count>1?'s':''} (${topCause})`;
        sections.push(new Paragraph({ children:[new TextRun({ text: sepLine })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Date: ${dateFmt(d)}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Subject: ${subject}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Cage: ${cageCode} • ${compartment} • ${location}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: `Updated Offspring count: ${adjustedAliveKits}` })]}));
        sections.push(new Paragraph({ children:[new TextRun({ text: '' })]}));
      });

      // Final separator
      if (sections.length) {
        sections.push(new Paragraph({ children:[new TextRun({ text: sepLine })]}));
      }

      const doc = new Document({ sections: [{ properties: {}, children: sections }] });
      const blob = await Packer.toBlob(doc);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `event_log_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Word export failed', err);
      toast.pushToast({ message: 'Failed to export Word document', type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports & Export</h1>
        <button
          onClick={() => setShowAnalysis(v => !v)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700"
        >
          {showAnalysis ? 'Hide Analysis' : 'View Analysis'}
        </button>
      </div>

      {!showAnalysis && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Generate Report</h2>

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="rabbits-inventory">Rabbits Inventory (Adults + Offspring)</option>
              <option value="matings">Mating Records</option>
              <option value="births">Birth Records</option>
              <option value="death-records">Death Records (Adults + Offspring)</option>
              <option value="finance-records">Finance Records (Sales + Expenses)</option>
              <option value="locations">Locations</option>
              <option value="cages">Cages</option>
              <option value="workers">Workers</option>
              <option value="health">Offspring Health History</option>
            </select>
          </div>

          {/* Export Format */}
          {/* Export Format removed (CSV only) */}

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date (Optional)
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date (Optional)
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportData}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Generating Report...' : 'Export CSV'}
          </button>
          <button
            onClick={exportReportDocx}
            disabled={loading}
            className="w-full mt-3 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Preparing Word...' : 'Export Word (.docx)'}
          </button>
        </div>

        {/* Report Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Report Information</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• CSV files can be opened in Excel or Google Sheets</li>
            <li>• Word (.docx) export provides human‑readable summaries</li>
            <li>• Date filters apply to created/recorded dates</li>
          </ul>
        </div>
      </div>
      )}

      {/* Quick Stats - Mobile Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Available Reports</h3>
          <p className="text-3xl font-bold text-blue-600">8</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Different report types</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Export Formats</h3>
          <p className="text-3xl font-bold text-green-600">2</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">CSV and Word</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Coverage</h3>
          <p className="text-3xl font-bold text-purple-600">100%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Complete system data</p>
        </div>
      </div>

      {showAnalysis && (
        <div className="mt-10 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Analysis</h2>
            {summaryStats && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={exportSummaryStats} className="text-xs px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Summary CSV</button>
                <button onClick={exportEventsDocx} className="text-xs px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">Event Log Word</button>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          {summaryStats && (
            <div className="space-y-6">
              {/* Population Group */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Population</h4>
                  <button onClick={() => setShowPopulation(v=>!v)} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">{showPopulation?'Hide':'Show'}</button>
                </div>
                {showPopulation && <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div onClick={()=>setActiveFilter('all')} className={cardBase(`bg-blue-50 dark:bg-blue-900/20 ${isActive('all')}`)}>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Rabbits</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summaryStats.totalRabbits}</p>
                  </div>
                  <div onClick={()=>setActiveFilter('bucks')} className={cardBase(`bg-indigo-50 dark:bg-indigo-900/20 ${isActive('bucks')}`)}>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Bucks</p>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{summaryStats.bucks}</p>
                  </div>
                  <div onClick={()=>setActiveFilter('does')} className={cardBase(`bg-pink-50 dark:bg-pink-900/20 ${isActive('does')}`)}>
                    <p className="text-xs font-medium text-pink-600 dark:text-pink-400">Does</p>
                    <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">{summaryStats.does}</p>
                  </div>
                  <div onClick={()=>setActiveFilter('active')} className={cardBase(`bg-green-50 dark:bg-green-900/20 ${isActive('active')}`)}>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">Active</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summaryStats.activeRabbits}</p>
                  </div>
                  <div onClick={()=>setActiveFilter('sold')} className={cardBase(`bg-blue-50 dark:bg-blue-900/20 ${isActive('sold')}`)}>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Sold</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summaryStats.soldRabbits}</p>
                  </div>
                </div>}
              </div>

              {/* Offspring Group */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Offspring</h4>
                  <button onClick={() => setShowOffspring(v=>!v)} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">{showOffspring?'Hide':'Show'}</button>
                </div>
                {showOffspring && <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div onClick={()=>setActiveFilter('births')} className={cardBase(`bg-purple-50 dark:bg-purple-900/20 ${isActive('births')}`)}>
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Total Offspring</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summaryStats.totalKits}</p>
                  </div>
                  <div onClick={()=>setActiveFilter('offspring-deaths')} className={cardBase(`bg-orange-50 dark:bg-orange-900/20 ${isActive('offspring-deaths')}`)}>
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Offspring Deaths</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{summaryStats.totalOffspringDeaths}</p>
                  </div>
                  <div onClick={()=>setActiveFilter('kit-mortality')} className={cardBase(`bg-yellow-50 dark:bg-yellow-900/20 ${isActive('kit-mortality')}`)}>
                    <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">Kit Mortality %
                      <span className="relative group cursor-help">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="absolute left-0 top-5 w-40 p-2 text-[10px] rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">(Dead at birth + later deaths) / total kits</span>
                      </span>
                    </p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summaryStats.kitMortalityRate}%</p>
                  </div>
                  <div onClick={()=>setActiveFilter('kit-survival')} className={cardBase(`bg-green-50 dark:bg-green-900/20 ${isActive('kit-survival')}`)}>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">Kit Survival %
                      <span className="relative group cursor-help">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="absolute left-0 top-5 w-36 p-2 text-[10px] rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">100% - kit mortality rate</span>
                      </span>
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summaryStats.totalKits ? (100 - summaryStats.kitMortalityRate).toFixed(2) : '0.00'}%</p>
                  </div>
                </div>}
              </div>

              {/* Lifecycle Group */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Lifecycle</h4>
                  <button onClick={() => setShowLifecycle(v=>!v)} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">{showLifecycle?'Hide':'Show'}</button>
                </div>
                {showLifecycle && <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div onClick={()=>setActiveFilter('adult-deaths')} className={cardBase(`bg-red-50 dark:bg-red-900/20 ${isActive('adult-deaths')}`)}>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">Adult Deaths</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summaryStats.deceasedRabbits}</p>
                  </div>
                  <div onClick={()=>setActiveFilter('adult-mortality')} className={cardBase(`bg-red-50 dark:bg-red-900/30 ${isActive('adult-mortality')}`)}>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-1">Adult Mortality %
                      <span className="relative group cursor-help">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="absolute left-0 top-5 w-40 p-2 text-[10px] rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">Adult deaths / total rabbits</span>
                      </span>
                    </p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{summaryStats.adultMortalityRate}%</p>
                  </div>
                </div>}
              </div>
              {/* Drill-down table */}
              {activeFilter && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detail: {activeFilter.replace(/-/g,' ')}</h5>
                    <button onClick={()=>setActiveFilter(null)} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Close</button>
                  </div>
                  <div className="overflow-x-auto">
                    {activeFilter==='bucks' && (
                      <table className="min-w-full text-xs"><thead><tr><th className="p-2 text-left">Rabbit ID</th><th className="p-2 text-left">Breed</th></tr></thead><tbody>{rabbitsData.filter(r=>r.gender==='BUCK').map((r:any)=>(<tr key={r.id} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2">{r.rabbitId}</td><td className="p-2">{r.breed}</td></tr>))}</tbody></table>
                    )}
                    {activeFilter==='does' && (
                      <table className="min-w-full text-xs"><thead><tr><th className="p-2 text-left">Rabbit ID</th><th className="p-2 text-left">Breed</th></tr></thead><tbody>{rabbitsData.filter(r=>r.gender==='DOE').map((r:any)=>(<tr key={r.id} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2">{r.rabbitId}</td><td className="p-2">{r.breed}</td></tr>))}</tbody></table>
                    )}
                    {activeFilter==='active' && (
                      <table className="min-w-full text-xs"><thead><tr><th className="p-2 text-left">Rabbit ID</th><th className="p-2 text-left">Status</th></tr></thead><tbody>{rabbitsData.filter(r=>r.status==='ACTIVE').map((r:any)=>(<tr key={r.id} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2">{r.rabbitId}</td><td className="p-2">{r.status}</td></tr>))}</tbody></table>
                    )}
                    {activeFilter==='sold' && (
                      <table className="min-w-full text-xs"><thead><tr><th className="p-2 text-left">Rabbit ID</th><th className="p-2 text-left">Status</th></tr></thead><tbody>{rabbitsData.filter(r=>r.status==='SOLD').map((r:any)=>(<tr key={r.id} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2">{r.rabbitId}</td><td className="p-2">{r.status}</td></tr>))}</tbody></table>
                    )}
                    {activeFilter==='births' && (
                      <table className="min-w-full text-xs"><thead><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Total</th><th className="p-2 text-left">Alive</th><th className="p-2 text-left">Dead</th></tr></thead><tbody>{birthsData.map((b:any)=>(<tr key={b.id} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2">{new Date(b.birthDate).toLocaleDateString()}</td><td className="p-2">{b.totalKits}</td><td className="p-2">{b.aliveKits}</td><td className="p-2">{b.deadKits}</td></tr>))}</tbody></table>
                    )}
                    {activeFilter==='offspring-deaths' && (
                      <table className="min-w-full text-xs"><thead><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Count</th><th className="p-2 text-left">Cause</th></tr></thead><tbody>{offspringDeathsData.map((d:any)=>(<tr key={d.id} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2">{new Date(d.deathDate).toLocaleDateString()}</td><td className="p-2">{d.count}</td><td className="p-2">{d.cause||'-'}</td></tr>))}</tbody></table>
                    )}
                    {activeFilter==='adult-deaths' && (
                      <table className="min-w-full text-xs"><thead><tr><th className="p-2 text-left">Rabbit ID</th><th className="p-2 text-left">Cause</th></tr></thead><tbody>{rabbitsData.filter(r=>r.status==='DECEASED').map((r:any)=>(<tr key={r.id} className="border-t border-gray-200 dark:border-gray-700"><td className="p-2">{r.rabbitId}</td><td className="p-2">{r.deaths?.[0]?.cause||'-'}</td></tr>))}</tbody></table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pie Charts */}
          {pieChartData && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Rabbit Status Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">Rabbit Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieChartData.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieChartData.statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Gender Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">Gender Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieChartData.genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieChartData.genderData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Categories */}
              {pieChartData.categoryData?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieChartData.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieChartData.categoryData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#EF4444'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Kit Outcomes */}
              {pieChartData.kitOutcomeData?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">Kit Outcomes</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieChartData.kitOutcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieChartData.kitOutcomeData.map((entry: any, index: number) => (
                          <Cell key={`cell-outcome-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Birth Survival Rate Over Time</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={birthStats} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" label={{ value: 'Kits', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Survival %', angle: -90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="totalKits" stroke="#6366F1" name="Total Kits" />
                  <Line yAxisId="left" type="monotone" dataKey="aliveKits" stroke="#10B981" name="Alive Kits" />
                  <Line yAxisId="left" type="monotone" dataKey="deadKits" stroke="#EF4444" name="Dead Kits" />
                  <Line yAxisId="right" type="monotone" dataKey="survivalRate" stroke="#F59E0B" name="Survival %" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Births vs Deaths</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deathStats} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="births" fill="#3B82F6" name="Births" />
                  <Bar dataKey="deaths" fill="#DC2626" name="Deaths" />
                  <Bar dataKey="offspringDeaths" fill="#F59E0B" name="Offspring Deaths" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Financial Performance</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialStats} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#10B981" name="Sales" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#8B5CF6" name="Profit" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
