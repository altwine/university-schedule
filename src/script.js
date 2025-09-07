const CLASS_TYPES_SECONDARY_COLORS = {
	'КП': '#c6c6c6', 'Л/ЛР': '#bae9fa', 'Л/П': '#a0e5fe',
	'ЛАБ': '#a8aefd', 'ЛЕК': '#c0ff99', 'П/ЛР': '#afe7fc',
	'ПР': '#7de3ff', 'ПЭКЗ': '#ffdf89', 'СЕМ': '#ffe9ad',
};
const WEEK_DAYS = [ 'вс', 'пн', 'вт', 'ср','чт', 'пт', 'сб', ];
const YEAR_MONTH = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const DAY_SELECTOR_ELEMENTS = document.querySelectorAll('.day-selector');
const CLASS_CONTAINER_ELEMENTS = document.querySelectorAll('.class-container');
const DINNER_LINE_CONTAINER_ELEMENT = document.querySelector('.dinner-line-container');
const DISABLE_DINNER_BUTTON = document.getElementById('disable-dinner-button');
const TITLE_ELEMENT = document.getElementById('title');
const TODAY_BUTTON_ELEMENT = document.getElementById('today-button');

const changeableDate = new Date();
const realDate = new Date();

let _clickAllowed = true;

function updateDinnerLine() {
    DINNER_LINE_CONTAINER_ELEMENT.style.display = localStorage.getItem('dinnerLineState') ?? 'none';
}

function updateTitle() {
    TITLE_ELEMENT.textContent = `${YEAR_MONTH[changeableDate.getMonth()]} ${changeableDate.getFullYear()}`;
}

updateDinnerLine();
updateTitle();

;(async () => {
    const [
        scheduleResponse, classTypesResponse, classIntervalsResponse, /* finalsScheduleResponse */,
    ] = await Promise.all([
        fetch('https://schedule.npi-tu.ru/api/v2/faculties/2/years/2/groups/РПИа/schedule'),
        fetch('https://schedule.npi-tu.ru/api/v1/class-types'),
        fetch('https://schedule.npi-tu.ru/api/v1/class-intervals'),
        /* fetch('https://schedule.npi-tu.ru/api/v2/faculties/2/years/2/groups/РПИа/finals-schedule'), */
    ]);
    
    const [
        schedule, classTypes, classIntervals, /*finalsSchedule,*/,
    ] = await Promise.all([
        scheduleResponse.json(),
        classTypesResponse.json(),
        classIntervalsResponse.json(),
        /* finalsScheduleResponse.json(), */
    ]);

    DISABLE_DINNER_BUTTON.addEventListener('click', () => {
        if (!_clickAllowed) return
        _clickAllowed = false;
        setTimeout(() => _clickAllowed = true, 25);
        localStorage.setItem('dinnerLineState', localStorage.getItem('dinnerLineState') !== 'flex' ? 'flex' : 'none');
        updateDinnerLine();
    });

    TODAY_BUTTON_ELEMENT.addEventListener('click', () => {
        if (!_clickAllowed) return
        _clickAllowed = false;
        setTimeout(() => _clickAllowed = true, 25);
        changeableDate.setTime(realDate.getTime());
        renderSchedule(changeableDate);
    });

    DAY_SELECTOR_ELEMENTS.forEach((daySelector, dayIndex) => {
        daySelector.addEventListener('click', () => {
            if (!_clickAllowed) return
            _clickAllowed = false;
            setTimeout(() => _clickAllowed = true, 25);
            changeableDate.setDate(changeableDate.getDate() + dayIndex - 3);
            renderSchedule(changeableDate);
        });
    });

    renderSchedule(changeableDate);

    async function renderSchedule(nowDate) {
        updateTitle();
        updateDinnerLine();
        const today = new Date(nowDate);
        today.setHours(0, 0, 0, 0);

        const week = Array.from({ length: 7 }, (_, i) => {
            const newDate = new Date(nowDate);
            newDate.setDate(nowDate.getDate() + i - 3);
            return newDate;
        });

        const currentClasses = schedule.classes.filter(c => c.day == today.getDay() && c.dates.find(date => date === nowDate.toLocaleDateString('en-CA')));

        DAY_SELECTOR_ELEMENTS.forEach((daySelector, dayIndex) => {
            const dayNameEl = daySelector.querySelector('#day-name');
            const dayNumberEl = daySelector.querySelector('#day-number');
            const currentDay = week[dayIndex];
            dayNameEl.textContent = WEEK_DAYS[currentDay.getDay()];
            dayNumberEl.textContent = currentDay.getDate();
            if (currentDay.getDate() == today.getDate()) dayNumberEl.classList.add('selected');
        });

        CLASS_CONTAINER_ELEMENTS.forEach((classEl, classIndex) => {
            const currentClass = currentClasses.find(c => c.class == classIndex + 1);
            const classDateStartEl = classEl.querySelector('#class-date-start');
            const classDateBetween = classEl.querySelector('#class-date-between');
            const classDateEndEl = classEl.querySelector('#class-date-end');
            const classInfoContainerEl = classEl.querySelector('#class-info-container');
            const classInfoLineEl = classEl.querySelector('.pillar');
            const classInfoEl = classEl.querySelector('.class-info');
            const classInfoTitleEl = classInfoEl.querySelector('#class-title');
            const classInfoLecturerEl = classInfoEl.querySelector('#class-lecturer');
            const classStartDate = classIntervals[classIndex + 1].start;
            const classEndDate = classIntervals[classIndex + 1].end;
            classDateStartEl.textContent = classStartDate;
            const [startHours, startMinutes] = classStartDate.split(':').map(Number);
            const [endHours, endMinutes] = classEndDate.split(':').map(Number);
            const averageTotalMinutes = ((startHours * 60 + startMinutes) + (endHours * 60 + endMinutes)) / 2;
            const averageHours = Math.floor(averageTotalMinutes / 60);
            const averageMinutes = Math.floor(averageTotalMinutes % 60);
            classDateBetween.textContent = `${averageHours.toString().padStart(2, '0')}:${averageMinutes.toString().padStart(2, '0')}`;
            classDateEndEl.textContent = classEndDate;
            if (!currentClass?.dates?.find?.(date => date === nowDate.toLocaleDateString('en-CA'))) {
                classInfoTitleEl.textContent = '';
                classInfoLecturerEl.textContent = '';
                classInfoContainerEl.style.border = 'none';
                classInfoContainerEl.style.opacity = '0';
                return;
            };
            const disciplineRenamed = currentClass.discipline.replace(/ \(\d+ час\)/, '');
            classInfoTitleEl.textContent = disciplineRenamed;
            classInfoLecturerEl.textContent = currentClass.lecturer;
            classInfoContainerEl.style.border = '#d1d1d1 1px solid';
            classInfoContainerEl.style.backgroundColor = classTypes[currentClass.type].color;
            classInfoLineEl.style.backgroundColor = CLASS_TYPES_SECONDARY_COLORS[currentClass.type];
            classInfoContainerEl.style.opacity = '1';
        });
    }
})();
