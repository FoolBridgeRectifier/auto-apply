import path from 'path';
import fs from 'fs';

const defaultData = {
  total: 0,
  days: [],
};

const dataPath = path.join(__dirname, '../../data/applications.json');

interface DayData {
  date: string;
  count: number;
}

interface ApplicationData {
  total: number;
  days: DayData[];
}

export const syncFile = () => {
  let data: ApplicationData;

  try {
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch {
    data = { ...defaultData };
  }

  const dateToday = new Date().toISOString().split('T')[0];
  const todayFromFile = data.days.find((day) => day.date === dateToday);

  const todayEntry = todayFromFile
    ? todayFromFile
    : { date: dateToday, count: 0 };

  if (!todayFromFile) {
    data.days.push(todayEntry);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }

  const incrementApplications = () => {
    data.total += 1;
    todayEntry.count += 1;

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  };

  return {
    applicationsTotal: data.total,
    applicationsToday: todayEntry.count,
    incrementApplications,
  };
};
