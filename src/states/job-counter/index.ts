import path from 'path';
import fs from 'fs';

interface DayData {
  date: string;
  count: number;
}

interface ApplicationData {
  total: number;
  days: DayData[];
}

const dataPath = path.join(__dirname, '../../../data/applications.json');

let data: ApplicationData;
try {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as ApplicationData;
} catch {
  data = { total: 0, days: [] };
}

const dateToday = new Date().toISOString().split('T')[0]!;
const dateYesterday = new Date(Date.now() - 86400000)
  .toISOString()
  .split('T')[0]!;

const yesterdayEntry = data.days.find((d) => d.date === dateYesterday);
let todayEntry = data.days.find((d) => d.date === dateToday);
if (!todayEntry) {
  todayEntry = { date: dateToday, count: 0 };
  data.days.push(todayEntry);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

let applicationsTotal = data.total;
let applicationsToday = todayEntry.count;
let applicationsTwoDays = todayEntry.count + (yesterdayEntry?.count ?? 0);

export const getApplicationCounts = () => ({
  applicationsTotal,
  applicationsToday,
  applicationsTwoDays,
});

export const persistIncrement = () => {
  data.total += 1;
  todayEntry!.count += 1;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  applicationsTotal++;
  applicationsToday++;
  applicationsTwoDays++;
};
