const CLASS_TYPES = {
  'КП': { name: 'Курсовой проект', color: '#FFFFFF', second: '#C6C6C6', },
  'Л/ЛР': { name: 'Лекция/лабораторная', color: '#F0FBFF', second: '#BAE9FA', },
  'Л/П': { name: 'Лекция/практика', color: '#F0FBFF', second: '#A0E5FE', },
  'ЛАБ': { name: 'Лабораторная работа', color: '#E7E8F8', second: '#A8AEFD', },
  'ЛЕК': { name: 'Лекция', color: '#E5FFD5', second: '#C0FF99', },
  'П/ЛР': { name: 'Практика/лабораторная', color: '#F0FBFF', second: '#AFE7FC', },
  'ПР': { name: 'Практическое занятие', color: '#D5F6FF', second: '#7DE3FF', },
  'ПЭКЗ': { name: 'Переэкзаменовка', color: '#FFFBF0', second: '#FFDF89', },
  'СЕМ': { name: 'Семинар', color: '#FFFBF0', second: '#FFE9AD', },
};
const WEEK_DAYS = [ 'вс', 'пн', 'вт', 'ср','чт', 'пт', 'сб', ];
const YEAR_MONTH = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const MAIN_CONTENT = document.querySelector('.main-content');
const DAY_SELECTOR_ELEMENTS = document.querySelectorAll('.day-selector');
const CLASS_CONTAINER_ELEMENTS = document.querySelectorAll('.class-container');
const DINNER_LINE_CONTAINER_ELEMENT = document.querySelector('.dinner-line-container');
const DISABLE_DINNER_BUTTON = document.getElementById('disable-dinner-button');
const TITLE_ELEMENT = document.getElementById('title');
const TODAY_BUTTON_ELEMENT = document.getElementById('today-button');
const COLOR_BADGE_ELEMENTS = Array.from(document.querySelectorAll('.color-badge'));

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
        scheduleResponse, /* finalsScheduleResponse */,
    ] = await Promise.all([
        fetch('https://schedule.npi-tu.ru/api/v2/faculties/2/years/2/groups/РПИа/schedule'),
        /* fetch('https://schedule.npi-tu.ru/api/v2/faculties/2/years/2/groups/РПИа/finals-schedule'), */
    ]);
    
    const [
        schedule, /*finalsSchedule,*/,
    ] = await Promise.all([
        scheduleResponse.json(),
        /* finalsScheduleResponse.json(), */
    ]);

    const uniqueClassTypes = new Set();
    schedule.classes.forEach(uniqueClassType => uniqueClassTypes.add(uniqueClassType.type))

    Array.from(uniqueClassTypes).forEach((uniqueClassType, uniqueClassTypeIndex) => {
        const colorBadgeElement = COLOR_BADGE_ELEMENTS[uniqueClassTypeIndex];
        colorBadgeElement.textContent = CLASS_TYPES[uniqueClassType].name;
        colorBadgeElement.style.backgroundColor = CLASS_TYPES[uniqueClassType].color;
    });

    let touchstartX = null;
    let touchendX = null;

    MAIN_CONTENT.addEventListener('touchstart', (event) => {
        touchstartX = event.changedTouches[0].screenX;
    });

    MAIN_CONTENT.addEventListener('touchend', (event) => {
        touchendX = event.changedTouches[0].screenX;
        if (Math.abs(touchstartX - touchendX) <= 60) return;
        if (touchendX < touchstartX) {
            changeableDate.setDate(changeableDate.getDate() + 1);
        }
        if (touchendX > touchstartX) {
            changeableDate.setDate(changeableDate.getDate() - 1);
        }
        renderSchedule(changeableDate);
    });

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
            const classInfoContainerEl = classEl.querySelector('#class-info-container');
            const classInfoLineEl = classEl.querySelector('.pillar');
            const classInfoEl = classEl.querySelector('.class-info');
            const classInfoTitleEl = classInfoEl.querySelector('#class-title');
            const classInfoLecturerEl = classInfoEl.querySelector('#class-lecturer');
            if (!currentClass?.dates?.find?.(date => date === nowDate.toLocaleDateString('en-CA'))) {
                classInfoTitleEl.textContent = '';
                classInfoLecturerEl.textContent = '';
                classInfoContainerEl.style.border = 'none';
                classInfoContainerEl.style.opacity = '0';
                return;
            };
            const disciplineRenamed = currentClass.discipline.replace(/ \(\d+ час\)/, '');
            classInfoTitleEl.textContent = `${currentClass.auditorium} ${disciplineRenamed}`;
            classInfoLecturerEl.textContent = currentClass.lecturer;
            classInfoContainerEl.style.border = '#d1d1d1 1px solid';
            classInfoContainerEl.style.backgroundColor = CLASS_TYPES[currentClass.type].color;
            classInfoLineEl.style.backgroundColor = CLASS_TYPES[currentClass.type].second;
            classInfoContainerEl.style.opacity = '1';
        });
    }
})();
