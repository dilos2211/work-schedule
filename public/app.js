const SHIFTS_CONFIG = {
  '1': { start: '06:00', end: '14:00', name: '1 смена' },
  '2': { start: '14:00', end: '22:00', name: '2 смена' },
  '3': { start: '22:00', end: '06:00', name: '3 смена' }
};

const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const todayBtn = document.getElementById('todayBtn');
const calendarGrid = document.getElementById('calendarGrid');

const calcTypeSelect = document.getElementById('calcTypeSelect');
const monthlyRateBox = document.getElementById('monthlyRateBox');
const hourlyRateBox = document.getElementById('hourlyRateBox');
const monthlyRateInput = document.getElementById('monthlyRateInput');
const rateInput = document.getElementById('rateInput');
const bonusInput = document.getElementById('bonusInput');

// Элементы модального окна
const dayModal = document.getElementById('dayModal');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const overtimePreview = document.getElementById('overtimePreview');
const quickBtns = document.querySelectorAll('.btn-quick');

// Элементы сводки
const totalShiftsEl = document.getElementById('totalShifts');
const totalBaseHoursEl = document.getElementById('totalBaseHours');
const totalOvertimeHoursEl = document.getElementById('totalOvertimeHours');
const totalAllHoursEl = document.getElementById('totalAllHours');
const totalGrossEarnedEl = document.getElementById('totalGrossEarned');
const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');

let monthData = {};
let selectedDay = null;
let currentShiftType = 'none';
let lastCalculatedGross = 0; // Сохраняем для отправки на бэкенд

// Установка текущего месяца и года при старте
function setCurrentDate() {
  const now = new Date();
  monthSelect.value = now.getMonth();
  yearSelect.value = now.getFullYear();
}

function getPolishHolidays(year) {
  const holidays = {};
  const addHoliday = (m, d, name) => {
    holidays[`${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = name;
  };

  addHoliday(1, 1, 'Nowy Rok');
  addHoliday(1, 6, 'Trzech Króli');
  addHoliday(5, 1, 'Święto Pracy');
  addHoliday(5, 3, 'Święto Konstytucji 3 Maja');
  addHoliday(8, 15, 'Wniebowzięcie NMP');
  addHoliday(11, 1, 'Wszystkich Świętych');
  addHoliday(11, 11, 'Święto Niepodległości');
  addHoliday(12, 25, 'Boże Narodzenie (1 dzień)');
  addHoliday(12, 26, 'Boże Narodzenie (2 dzień)');

  const a = year % 19;
  const b = Math.floor(year / 100);
  const cYear = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(cYear / 4);
  const k = cYear % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;

  const easterDate = new Date(year, easterMonth - 1, easterDay);
  addHoliday(easterDate.getMonth() + 1, easterDate.getDate(), 'Wielkanoc');

  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterDate.getDate() + 1);
  addHoliday(easterMonday.getMonth() + 1, easterMonday.getDate(), 'Poniedziałek Wielkanocный');

  const pentecost = new Date(easterDate);
  pentecost.setDate(easterDate.getDate() + 49);
  addHoliday(pentecost.getMonth() + 1, pentecost.getDate(), 'Zielone Świątki');

  const corpusChristi = new Date(easterDate);
  corpusChristi.setDate(easterDate.getDate() + 60);
  addHoliday(corpusChristi.getMonth() + 1, corpusChristi.getDate(), 'Boże Ciało');

  return holidays;
}

function getMonthlyNormHours(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const holidays = getPolishHolidays(year);
  let workingDaysCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const monthKey = String(month + 1).padStart(2, '0');
    const dayKey = String(day).padStart(2, '0');
    const isHoliday = Boolean(holidays[`${monthKey}-${dayKey}`]);

    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isHoliday) {
      workingDaysCount++;
    }
  }

  return workingDaysCount * 8;
}

calcTypeSelect.addEventListener('change', () => {
  if (calcTypeSelect.value === 'monthly') {
    monthlyRateBox.style.display = 'flex';
    hourlyRateBox.style.display = 'none';
  } else {
    monthlyRateBox.style.display = 'none';
    hourlyRateBox.style.display = 'flex';
  }
  calculateTotals();
});

monthSelect.addEventListener('change', loadShiftsFromDB);
yearSelect.addEventListener('change', loadShiftsFromDB);

todayBtn.addEventListener('click', () => {
  setCurrentDate();
  loadShiftsFromDB();
});

monthlyRateInput.addEventListener('input', calculateTotals);
rateInput.addEventListener('input', calculateTotals);
bonusInput.addEventListener('input', calculateTotals);

// Безопасный парсинг чисел с поддержкой запятых (например, "25,50" -> 25.50)
function parseFormattedFloat(value) {
  if (!value) return 0;
  return parseFloat(String(value).replace(',', '.')) || 0;
}

async function loadShiftsFromDB() {
  const month = monthSelect.value;
  const year = yearSelect.value;

  const storageKey = `finance_${year}_${month}`;
  const savedFinance = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  if (savedFinance.calcType) {
    calcTypeSelect.value = savedFinance.calcType;
  }
  monthlyRateInput.value = savedFinance.monthlyRate || '';
  rateInput.value = savedFinance.rate || '';
  bonusInput.value = savedFinance.bonus || '';

  calcTypeSelect.dispatchEvent(new Event('change'));

  try {
    const res = await fetch(`/api/shifts?year=${year}&month=${month}`);
    if (!res.ok) throw new Error('Ошибка загрузки данных');
    
    const rows = await res.json();
    monthData = {};

    rows.forEach(row => {
      const dayNum = parseInt(row.work_date.split('-')[2], 10);
      monthData[dayNum] = {
        shift: row.shift_type,
        start: row.start_time,
        end: row.end_time,
        totalHours: row.total_hours,
        overtime: row.overtime_hours
      };
    });

    renderCalendar();
  } catch (err) {
    console.error('Не удалось загрузить данные из базы:', err);
    monthData = {};
    renderCalendar();
  }
}

function renderCalendar() {
  calendarGrid.innerHTML = '';
  const month = parseInt(monthSelect.value);
  const year = parseInt(yearSelect.value);

  const polishHolidays = getPolishHolidays(year);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let startingDay = firstDay.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  for (let i = 0; i < startingDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay();
    
    const monthKey = String(month + 1).padStart(2, '0');
    const dayKey = String(day).padStart(2, '0');
    const holidayName = polishHolidays[`${monthKey}-${dayKey}`];

    const isSunday = (dayOfWeek === 0);
    const isSaturday = (dayOfWeek === 6);
    const isHoliday = Boolean(holidayName) || isSunday || isSaturday;

    const dayState = monthData[day];

    const cell = document.createElement('div');
    cell.className = `day-cell ${isHoliday ? 'holiday' : ''}`;
    
    let shiftBadgeHTML = '';
    let timeRangeHTML = '';
    let overtimeHTML = '';
    let holidayLabelHTML = holidayName ? `<div class="holiday-label">${holidayName}</div>` : '';

    if (dayState && dayState.shift !== 'none') {
      shiftBadgeHTML = `<span class="shift-badge shift-${dayState.shift}">${dayState.shift} смена</span>`;
      timeRangeHTML = `<div class="time-range">${dayState.start} - ${dayState.end}</div>`;
      
      const dayCalc = calculateHoursForDay(year, month, day, dayState.start, dayState.end);
      if (dayCalc.overtime > 0) {
        overtimeHTML = `<div class="overtime-badge">+${dayCalc.overtime}ч надг.</div>`;
      }
    }

    cell.innerHTML = `
      <div class="day-header">
        <span class="day-number">${day}</span>
        ${shiftBadgeHTML}
      </div>
      ${holidayLabelHTML}
      ${timeRangeHTML}
      ${overtimeHTML}
    `;

    cell.addEventListener('click', () => openModal(day, holidayName));
    calendarGrid.appendChild(cell);
  }

  calculateTotals();
}

function calculateHoursForDay(year, month, day, start, end) {
  if (!start || !end) return { total: 0, base: 0, overtime: 0 };

  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);

  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalHours = (endMinutes - startMinutes) / 60;

  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  const holidays = getPolishHolidays(year);
  const monthKey = String(month + 1).padStart(2, '0');
  const dayKey = String(day).padStart(2, '0');
  const isHoliday = Boolean(holidays[`${monthKey}-${dayKey}`]);
  
  if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday) {
    return { total: totalHours, base: 0, overtime: totalHours };
  }

  const base = Math.min(8, totalHours);
  const overtime = Math.max(0, totalHours - 8);

  return { total: totalHours, base: base, overtime: overtime };
}

function updateOvertimePreview() {
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  const month = parseInt(monthSelect.value);
  const year = parseInt(yearSelect.value);

  if (currentShiftType === 'none' || !start || !end) {
    overtimePreview.innerHTML = 'Выходной день';
    return;
  }

  const calc = calculateHoursForDay(year, month, selectedDay, start, end);
  overtimePreview.innerHTML = `Всего: <strong>${calc.total} ч</strong> | База: ${calc.base} ч | Переработка: <strong>${calc.overtime} ч</strong>`;
}

function openModal(day, holidayName = null) {
  selectedDay = day;
  const monthName = monthSelect.options[monthSelect.selectedIndex].text;
  modalTitle.innerText = `Настройка: ${day} ${monthName}`;

  let holidayBanner = document.getElementById('modalHolidayBanner');
  if (!holidayBanner) {
    holidayBanner = document.createElement('div');
    holidayBanner.id = 'modalHolidayBanner';
    holidayBanner.className = 'modal-holiday-info';
    document.querySelector('.modal-body').prepend(holidayBanner);
  }

  if (holidayName) {
    holidayBanner.innerText = `Праздничный день: ${holidayName}`;
    holidayBanner.style.display = 'block';
  } else {
    holidayBanner.style.display = 'none';
  }

  const current = monthData[day] || { shift: 'none', start: '', end: '', overtime: 0 };
  currentShiftType = current.shift;

  quickBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shift === currentShiftType);
  });

  startTimeInput.value = current.start || '';
  endTimeInput.value = current.end || '';

  updateOvertimePreview();
  dayModal.style.display = 'flex';
}

quickBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const shift = btn.dataset.shift;
    currentShiftType = shift;

    quickBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (shift !== 'none') {
      startTimeInput.value = SHIFTS_CONFIG[shift].start;
      endTimeInput.value = SHIFTS_CONFIG[shift].end;
    } else {
      startTimeInput.value = '';
      endTimeInput.value = '';
    }

    updateOvertimePreview();
  });
});

startTimeInput.addEventListener('input', updateOvertimePreview);
endTimeInput.addEventListener('input', updateOvertimePreview);

modalClose.addEventListener('click', () => dayModal.style.display = 'none');

modalSaveBtn.addEventListener('click', () => {
  if (!selectedDay) return;

  const month = parseInt(monthSelect.value);
  const year = parseInt(yearSelect.value);

  if (currentShiftType === 'none') {
    delete monthData[selectedDay];
  } else {
    const start = startTimeInput.value;
    const end = endTimeInput.value;
    const calc = calculateHoursForDay(year, month, selectedDay, start, end);

    monthData[selectedDay] = {
      shift: currentShiftType,
      start: start,
      end: end,
      totalHours: calc.total,
      overtime: calc.overtime
    };
  }

  dayModal.style.display = 'none';
  renderCalendar();
});

function calculateTotals() {
  const month = parseInt(monthSelect.value);
  const year = parseInt(yearSelect.value);

  const normBaseHours = getMonthlyNormHours(year, month);

  let daysWorked = 0;
  let actualWorkedBaseHours = 0;
  let totalOvertime = 0;

  Object.keys(monthData).forEach(dayNum => {
    const d = monthData[dayNum];
    if (d.shift !== 'none') {
      daysWorked++;
      const calc = calculateHoursForDay(year, month, parseInt(dayNum), d.start, d.end);
      actualWorkedBaseHours += calc.base;
      totalOvertime += calc.overtime;
    }
  });

  const bonusAmount = parseFormattedFloat(bonusInput.value);
  const isMonthlyCalc = (calcTypeSelect.value === 'monthly');

  let totalBasePay = 0;
  let totalOvertimePay = 0;

  if (isMonthlyCalc) {
    const monthlyRate = parseFormattedFloat(monthlyRateInput.value);
    const effectiveHourlyRate = normBaseHours > 0 ? (monthlyRate / normBaseHours) : 0;
    
    if (actualWorkedBaseHours >= normBaseHours) {
      totalBasePay = monthlyRate;
    } else {
      totalBasePay = actualWorkedBaseHours * effectiveHourlyRate;
    }

    totalOvertimePay = totalOvertime * (effectiveHourlyRate * 2);

  } else {
    const hourlyRate = parseFormattedFloat(rateInput.value);
    totalBasePay = actualWorkedBaseHours * hourlyRate;
    totalOvertimePay = totalOvertime * (hourlyRate * 2);
  }

  lastCalculatedGross = totalBasePay + totalOvertimePay + bonusAmount;

  totalShiftsEl.innerText = daysWorked;
  totalBaseHoursEl.innerText = `${actualWorkedBaseHours} ч (из ${normBaseHours}ч)`;
  totalOvertimeHoursEl.innerText = `${totalOvertime} ч`;
  totalAllHoursEl.innerText = `${actualWorkedBaseHours + totalOvertime} ч`;
  totalGrossEarnedEl.innerText = `${lastCalculatedGross.toFixed(2)} zł`;

  const storageKey = `finance_${year}_${month}`;
  localStorage.setItem(storageKey, JSON.stringify({
    calcType: calcTypeSelect.value,
    monthlyRate: monthlyRateInput.value,
    rate: rateInput.value,
    bonus: bonusInput.value
  }));
}

saveBtn.addEventListener('click', async function() {
  saveBtn.disabled = true;
  saveBtn.innerText = "Сохранение...";

  const month = monthSelect.value;
  const year = yearSelect.value;

  const payload = {
    month: month,
    year: year,
    calcType: calcTypeSelect.value,
    monthlyRate: parseFormattedFloat(monthlyRateInput.value),
    rate: parseFormattedFloat(rateInput.value),
    bonus: parseFormattedFloat(bonusInput.value),
    totalGross: lastCalculatedGross, // Передаем итоговую сумму для бэкенда
    scheduleData: monthData
  };

  try {
    const response = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Ошибка сохранения на сервере');

    statusMsg.style.backgroundColor = "rgba(74, 222, 128, 0.1)";
    statusMsg.style.color = "var(--success-color)";
    statusMsg.innerText = `✓ Все данные сохранены!`;
    statusMsg.style.display = "block";

  } catch (err) {
    statusMsg.style.backgroundColor = "rgba(248, 113, 113, 0.1)";
    statusMsg.style.color = "var(--error-color)";
    statusMsg.innerText = "⚠ Ошибка сохранения в БД.";
    statusMsg.style.display = "block";
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = "Сохранить отчет";
  }
});

// Инициализация при первой загрузке страницы
setCurrentDate();
loadShiftsFromDB();
