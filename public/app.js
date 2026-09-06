const TRANSLATIONS = {
  ru: {
    months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    monthLabel: "Месяц:",
    yearLabel: "Год:",
    todayBtn: "📅 Текущий месяц",
    calcTypeLabel: "Тип оплаты:",
    optMonthly: "Оклад за месяц (zł/мес)",
    optHourly: "Почасовая ставка (zł/ч)",
    monthlyRateLabel: "Оклад брутто (zł):",
    hourlyRateLabel: "Ставка в час (zł/ч):",
    bonusLabel: "Премия брутто (zł):",
    sumDays: "Отработано дней:",
    sumBaseHours: "Базовые часы:",
    sumOvertime: "Переработка (Nadgodziny):",
    sumAllHours: "Всего часов:",
    sumGross: "Ориентировочно брутто:",
    saveBtn: "Сохранить отчет",
    savingBtn: "Сохранение...",
    saveSuccess: "✓ Все данные сохранены!",
    saveError: "⚠ Ошибка сохранения в БД.",
    unsavedWarning: "⚠ Есть несохраненные изменения",
    modalTitleDefault: "Настройка дня",
    holidayPrefix: "Праздник: ",
    quickSelectLabel: "Быстрый выбор смены:",
    shift1Btn: "1 смена",
    shift2Btn: "2 смена",
    shift3Btn: "3 смена",
    shiftOffBtn: "Выходной",
    timeStart: "Начало:",
    timeEnd: "Конец:",
    dayOffText: "Выходной день",
    applyBtn: "Применить",
    shiftBadge1: "1 смена",
    shiftBadge2: "2 смена",
    shiftBadge3: "3 смена",
    overtimeBadgeText: "ч надг."
  },
  pl: {
    months: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
    weekdays: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"],
    monthLabel: "Miesiąc:",
    yearLabel: "Rok:",
    todayBtn: "📅 Bieżący miesiąc",
    calcTypeLabel: "Typ wynagrodzenia:",
    optMonthly: "Pensja miesięczna (zł/mies)",
    optHourly: "Stawka godzinowa (zł/h)",
    monthlyRateLabel: "Pensja brutto (zł):",
    hourlyRateLabel: "Stawka za godzinę (zł/h):",
    bonusLabel: "Premia brutto (zł):",
    sumDays: "Przepracowane dni:",
    sumBaseHours: "Godziny bazowe:",
    sumOvertime: "Nadgodziny:",
    sumAllHours: "Razem godzin:",
    sumGross: "Szacunkowo brutto:",
    saveBtn: "Zapisz raport",
    savingBtn: "Zapisywanie...",
    saveSuccess: "✓ Wszystkie dane zapisane!",
    saveError: "⚠ Błąd zapisu do bazy danych.",
    unsavedWarning: "⚠ Masz niezapisane zmiany",
    modalTitleDefault: "Konfiguracja dnia",
    holidayPrefix: "Święto: ",
    quickSelectLabel: "Szybki wybór zmiany:",
    shift1Btn: "1 zmiana",
    shift2Btn: "2 zmiana",
    shift3Btn: "3 zmiana",
    shiftOffBtn: "Wolne",
    timeStart: "Początek:",
    timeEnd: "Koniec:",
    dayOffText: "Dzień wolny",
    applyBtn: "Zastosuj",
    shiftBadge1: "1 zm.",
    shiftBadge2: "2 zm.",
    shiftBadge3: "3 zm.",
    overtimeBadgeText: "h nadg."
  }
};

let currentLang = localStorage.getItem('app_lang') || 'ru';

const SHIFTS_CONFIG = {
  '1': { start: '06:00', end: '14:00' },
  '2': { start: '14:00', end: '22:00' },
  '3': { start: '22:00', end: '06:00' }
};

const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const todayBtn = document.getElementById('todayBtn');
const calendarGrid = document.getElementById('calendarGrid');
const weekdaysGrid = document.getElementById('weekdaysGrid');

const calcTypeSelect = document.getElementById('calcTypeSelect');
const monthlyRateBox = document.getElementById('monthlyRateBox');
const hourlyRateBox = document.getElementById('hourlyRateBox');
const monthlyRateInput = document.getElementById('monthlyRateInput');
const rateInput = document.getElementById('rateInput');
const bonusInput = document.getElementById('bonusInput');

const dayModal = document.getElementById('dayModal');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const overtimePreview = document.getElementById('overtimePreview');
const quickBtns = document.querySelectorAll('.btn-quick');

const totalShiftsEl = document.getElementById('totalShifts');
const totalBaseHoursEl = document.getElementById('totalBaseHours');
const totalOvertimeHoursEl = document.getElementById('totalOvertimeHours');
const totalAllHoursEl = document.getElementById('totalAllHours');
const totalGrossEarnedEl = document.getElementById('totalGrossEarned');
const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');

const langRuBtn = document.getElementById('langRu');
const langPlBtn = document.getElementById('langPl');

let monthData = {};
let selectedDay = null;
let currentShiftType = 'none';
let currentHolidayName = null;

function t(key) {
  return TRANSLATIONS[currentLang][key] || key;
}

function updateTexts() {
  langRuBtn.classList.toggle('active', currentLang === 'ru');
  langPlBtn.classList.toggle('active', currentLang === 'pl');

  // Обновление статических элементов с data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerText = t(key);
  });

  // Заполнение селекта месяцев текущим языком
  const selectedMonthVal = monthSelect.value;
  monthSelect.innerHTML = '';
  TRANSLATIONS[currentLang].months.forEach((mName, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = mName;
    monthSelect.appendChild(opt);
  });
  if (selectedMonthVal !== "") monthSelect.value = selectedMonthVal;

  // Дни недели в шапке календаря
  weekdaysGrid.innerHTML = '';
  TRANSLATIONS[currentLang].weekdays.forEach(wd => {
    const div = document.createElement('div');
    div.innerText = wd;
    weekdaysGrid.appendChild(div);
  });
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('app_lang', lang);
  updateTexts();
  renderCalendar();
  if (selectedDay !== null) {
    openModal(selectedDay, currentHolidayName);
  }
}

langRuBtn.addEventListener('click', () => setLanguage('ru'));
langPlBtn.addEventListener('click', () => setLanguage('pl'));

function markAsUnsaved() {
  statusMsg.style.backgroundColor = "rgba(234, 179, 8, 0.1)";
  statusMsg.style.color = "#eab308";
  statusMsg.innerText = t('unsavedWarning');
  statusMsg.style.display = "block";
}

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
  addHoliday(12, 25, 'Boże Narodzenie');
  addHoliday(12, 26, 'Boże Narodzenie');

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
  addHoliday(easterMonday.getMonth() + 1, easterMonday.getDate(), 'Poniedziałek Wielkanocny');

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
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays[`${monthKey}-${dayKey}`]) {
      workingDaysCount++;
    }
  }
  return workingDaysCount * 8;
}

calcTypeSelect.addEventListener('change', () => {
  monthlyRateBox.style.display = calcTypeSelect.value === 'monthly' ? 'block' : 'none';
  hourlyRateBox.style.display = calcTypeSelect.value === 'monthly' ? 'none' : 'block';
  calculateTotals();
  markAsUnsaved();
});

monthSelect.addEventListener('change', loadShiftsFromDB);
yearSelect.addEventListener('change', loadShiftsFromDB);
todayBtn.addEventListener('click', () => { setCurrentDate(); loadShiftsFromDB(); });

monthlyRateInput.addEventListener('input', () => { calculateTotals(); markAsUnsaved(); });
rateInput.addEventListener('input', () => { calculateTotals(); markAsUnsaved(); });
bonusInput.addEventListener('input', () => { calculateTotals(); markAsUnsaved(); });

async function loadShiftsFromDB() {
  const month = monthSelect.value;
  const year = yearSelect.value;
  const storageKey = `finance_${year}_${month}`;
  const savedFinance = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  if (savedFinance.calcType) calcTypeSelect.value = savedFinance.calcType;
  monthlyRateInput.value = savedFinance.monthlyRate || '5800';
  rateInput.value = savedFinance.rate || '';
  bonusInput.value = savedFinance.bonus || '0';

  monthlyRateBox.style.display = calcTypeSelect.value === 'monthly' ? 'block' : 'none';
  hourlyRateBox.style.display = calcTypeSelect.value === 'monthly' ? 'none' : 'block';

  try {
    const res = await fetch(`/api/shifts?year=${year}&month=${month}`);
    if (!res.ok) throw new Error();
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
    statusMsg.style.display = 'none';
  } catch (err) {
    monthData = {};
    renderCalendar();
    statusMsg.style.display = 'none';
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
    const isHoliday = Boolean(holidayName) || dayOfWeek === 0 || dayOfWeek === 6;

    const dayState = monthData[day];
    const cell = document.createElement('div');
    cell.className = `day-cell ${isHoliday ? 'holiday' : ''}`;
    
    let shiftBadgeHTML = '', timeRangeHTML = '', overtimeHTML = '', holidayLabelHTML = '';
    if (holidayName) holidayLabelHTML = `<div class="holiday-label">${holidayName}</div>`;

    if (dayState && dayState.shift !== 'none') {
      const shiftBadgeText = t(`shiftBadge${dayState.shift}`);
      shiftBadgeHTML = `<span class="shift-badge shift-${dayState.shift}">${shiftBadgeText}</span>`;
      timeRangeHTML = `<div class="time-range">${dayState.start}-${dayState.end}</div>`;
      const dayCalc = calculateHoursForDay(year, month, day, dayState.start, dayState.end);
      if (dayCalc.overtime > 0) overtimeHTML = `<div class="overtime-badge">+${dayCalc.overtime}${t('overtimeBadgeText')}</div>`;
    }

    cell.innerHTML = `
      <div class="day-header"><span class="day-number">${day}</span>${shiftBadgeHTML}</div>
      ${holidayLabelHTML}${timeRangeHTML}${overtimeHTML}
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
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  const totalHours = (endMinutes - startMinutes) / 60;

  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  const holidays = getPolishHolidays(year);
  const isHoliday = Boolean(holidays[`${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`]);
  
  if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday) {
    return { total: totalHours, base: 0, overtime: totalHours };
  }
  return { total: totalHours, base: Math.min(8, totalHours), overtime: Math.max(0, totalHours - 8) };
}

function updateOvertimePreview() {
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  if (currentShiftType === 'none' || !start || !end) {
    overtimePreview.innerHTML = t('dayOffText');
    return;
  }
  const calc = calculateHoursForDay(parseInt(yearSelect.value), parseInt(monthSelect.value), selectedDay, start, end);
  const totalLabel = currentLang === 'ru' ? 'Всего' : 'Razem';
  const baseLabel = currentLang === 'ru' ? 'База' : 'Baza';
  overtimePreview.innerHTML = `${totalLabel}: <strong>${calc.total}h</strong> | ${baseLabel}: ${calc.base}h | Nadg: <strong>${calc.overtime}h</strong>`;
}

function openModal(day, holidayName = null) {
  selectedDay = day;
  currentHolidayName = holidayName;
  const monthName = TRANSLATIONS[currentLang].months[parseInt(monthSelect.value)];
  modalTitle.innerText = `${day} ${monthName}`;

  const holidayBanner = document.getElementById('modalHolidayBanner');
  if (holidayName) {
    holidayBanner.innerText = `${t('holidayPrefix')}${holidayName}`;
    holidayBanner.style.display = 'block';
  } else {
    holidayBanner.style.display = 'none';
  }

  const current = monthData[day] || { shift: 'none', start: '', end: '' };
  currentShiftType = current.shift;
  
  quickBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.shift === currentShiftType));
  startTimeInput.value = current.start || '';
  endTimeInput.value = current.end || '';
  
  updateOvertimePreview();
  dayModal.style.display = 'flex';
}

quickBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentShiftType = btn.dataset.shift;
    quickBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (currentShiftType !== 'none') {
      startTimeInput.value = SHIFTS_CONFIG[currentShiftType].start;
      endTimeInput.value = SHIFTS_CONFIG[currentShiftType].end;
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
    const calc = calculateHoursForDay(year, month, selectedDay, startTimeInput.value, endTimeInput.value);
    monthData[selectedDay] = {
      shift: currentShiftType,
      start: startTimeInput.value,
      end: endTimeInput.value,
      totalHours: calc.total,
      overtime: calc.overtime
    };
  }
  dayModal.style.display = 'none';
  renderCalendar();
  markAsUnsaved();
});

function calculateTotals() {
  const month = parseInt(monthSelect.value);
  const year = parseInt(yearSelect.value);
  const normBaseHours = getMonthlyNormHours(year, month);

  let daysWorked = 0, actualWorkedBaseHours = 0, totalOvertime = 0;
  Object.keys(monthData).forEach(dayNum => {
    const d = monthData[dayNum];
    if (d.shift !== 'none') {
      daysWorked++;
      const calc = calculateHoursForDay(year, month, parseInt(dayNum), d.start, d.end);
      actualWorkedBaseHours += calc.base;
      totalOvertime += calc.overtime;
    }
  });

  const bonusAmount = parseFloat(bonusInput.value) || 0;
  let totalBasePay = 0, totalOvertimePay = 0;

  if (calcTypeSelect.value === 'monthly') {
    const monthlyRate = parseFloat(monthlyRateInput.value) || 0;
    const effectiveHourlyRate = normBaseHours > 0 ? (monthlyRate / normBaseHours) : 0;
    totalBasePay = actualWorkedBaseHours >= normBaseHours ? monthlyRate : actualWorkedBaseHours * effectiveHourlyRate;
    totalOvertimePay = totalOvertime * (effectiveHourlyRate * 2);
  } else {
    const hourlyRate = parseFloat(rateInput.value) || 0;
    totalBasePay = actualWorkedBaseHours * hourlyRate;
    totalOvertimePay = totalOvertime * (hourlyRate * 2);
  }

  const totalGrossEarned = totalBasePay + totalOvertimePay + bonusAmount;
  totalShiftsEl.innerText = daysWorked;
  totalBaseHoursEl.innerText = `${actualWorkedBaseHours} ч (из ${normBaseHours}ч)`;
  totalOvertimeHoursEl.innerText = `${totalOvertime} ч`;
  totalAllHoursEl.innerText = `${actualWorkedBaseHours + totalOvertime} ч`;
  totalGrossEarnedEl.innerText = `${totalGrossEarned.toFixed(2)} zł`;

  localStorage.setItem(`finance_${year}_${month}`, JSON.stringify({
    calcType: calcTypeSelect.value,
    monthlyRate: monthlyRateInput.value,
    rate: rateInput.value,
    bonus: bonusInput.value
  }));
}

saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  saveBtn.innerText = t('savingBtn');
  try {
    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: monthSelect.value,
        year: yearSelect.value,
        calcType: calcTypeSelect.value,
        monthlyRate: parseFloat(monthlyRateInput.value) || 0,
        rate: parseFloat(rateInput.value) || 0,
        bonus: parseFloat(bonusInput.value) || 0,
        scheduleData: monthData
      })
    });
    if (!res.ok) throw new Error();
    statusMsg.style.backgroundColor = "rgba(74, 222, 128, 0.1)";
    statusMsg.style.color = "var(--success-color)";
    statusMsg.innerText = t('saveSuccess');
    statusMsg.style.display = "block";
  } catch (err) {
    statusMsg.style.backgroundColor = "rgba(248, 113, 113, 0.1)";
    statusMsg.style.color = "var(--error-color)";
    statusMsg.innerText = t('saveError');
    statusMsg.style.display = "block";
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = t('saveBtn');
  }
});

updateTexts();
setCurrentDate();
loadShiftsFromDB();