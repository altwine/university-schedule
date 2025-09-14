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

const SEARCH_PARAMS = new URLSearchParams(window.location.search);
const MAIN_CONTENT = document.querySelector('.main-content');
const DAY_SELECTOR_ELEMENTS = document.querySelectorAll('.day-selector');
const CLASS_CONTAINER_ELEMENTS = document.querySelectorAll('.class-container');
const DINNER_LINE_CONTAINER_ELEMENT = document.querySelector('.dinner-line-container');
const DISABLE_DINNER_BUTTON = document.getElementById('disable-dinner-button');
const TITLE_ELEMENT = document.getElementById('title');
const TODAY_BUTTON_ELEMENT = document.getElementById('today-button');
const SELECT_GROUP_BUTTON = document.getElementById('select-group-button');
const COLOR_BADGE_ELEMENTS = Array.from(document.querySelectorAll('.color-badge'));

const groupFetch = fetch('https://schedule.npi-tu.ru/api/v1/groups/-');

const changeableDate = new Date();
const realDate = new Date();

const INITIAL_YEAR = SEARCH_PARAMS.get('year') ?? '2';
const INITIAL_FACULTY = SEARCH_PARAMS.get('faculty') ?? '2';
const INITIAL_GROUP = SEARCH_PARAMS.get('group') ?? 'РПИа';

let currentScheduleUrl = `https://schedule.npi-tu.ru/api/v2/faculties/${INITIAL_FACULTY}/years/${INITIAL_YEAR}/groups/${INITIAL_GROUP}/schedule`;
let isClickAllowed = true;

function updateDinnerLine() {
    DINNER_LINE_CONTAINER_ELEMENT.style.display = localStorage.getItem('dinnerLineState') ?? 'none';
}

function updateTitle() {
    TITLE_ELEMENT.textContent = `${YEAR_MONTH[changeableDate.getMonth()]} ${changeableDate.getFullYear()}`;
}

function updateLabels(schedule) {
    const uniqueClassTypes = new Set();
    schedule.classes.forEach(uniqueClassType => uniqueClassTypes.add(uniqueClassType.type))

    COLOR_BADGE_ELEMENTS.forEach((colorBadgeEl) => {
        colorBadgeEl.textContent = '';
        colorBadgeEl.style.backgroundColor = 'transparent';
    });

    Array.from(uniqueClassTypes).forEach((uniqueClassType, uniqueClassTypeIndex) => {
        const colorBadgeElement = COLOR_BADGE_ELEMENTS[uniqueClassTypeIndex];
        colorBadgeElement.textContent = CLASS_TYPES[uniqueClassType].name;
        colorBadgeElement.style.backgroundColor = CLASS_TYPES[uniqueClassType].color;
    });
}

updateDinnerLine();
updateTitle();

;(async () => {
    let lastScheduleUrl = null;
    let lastSchedule = null;

    let touchstartX = null;
    let touchendX = null;

    MAIN_CONTENT.addEventListener('touchstart', (event) =>
        touchstartX = event.changedTouches[0].screenX);

    MAIN_CONTENT.addEventListener('touchend', (event) => {
        touchendX = event.changedTouches[0].screenX;
        if (Math.abs(touchstartX - touchendX) <= 60) return;
        if (touchendX < touchstartX) {
            changeableDate.setDate(changeableDate.getDate() + 1);
        } else if (touchendX > touchstartX) {
            changeableDate.setDate(changeableDate.getDate() - 1);
        }
        renderSchedule(changeableDate, currentScheduleUrl);
    });

    DISABLE_DINNER_BUTTON.addEventListener('click', () => {
        if (!isClickAllowed) return;
        isClickAllowed = false;
        setTimeout(() => isClickAllowed = true, 25);
        localStorage.setItem('dinnerLineState', localStorage.getItem('dinnerLineState') !== 'flex' ? 'flex' : 'none');
        updateDinnerLine();
    });

    TODAY_BUTTON_ELEMENT.addEventListener('click', () => {
        if (!isClickAllowed) return;
        isClickAllowed = false;
        setTimeout(() => isClickAllowed = true, 25);
        changeableDate.setTime(realDate.getTime());
        renderSchedule(changeableDate, currentScheduleUrl);
    });

    let groups = null;
    SELECT_GROUP_BUTTON.addEventListener('click', async () => {
        if (!isClickAllowed) return;
        isClickAllowed = false;
        setTimeout(() => isClickAllowed = true, 25);
        const searchField = document.querySelector('.search-field');
        const groupSelector = document.querySelector('.group-selector');
        const cc = groupSelector.classList;
        if (!groups) {
            const groupsResponse = await groupFetch;
            groups = await groupsResponse.json();
            const groupsKeys = Object.keys(groups);
            const groupSelectorBody = document.querySelector('.group-selector-body');
            groupsKeys.forEach((groupKey) => {
                const groupKeyBtn = document.createElement('div');
                groupKeyBtn.className = 'group-selector-element';
                groupKeyBtn.dataset['faculty'] = groups[groupKey].faculty;
                groupKeyBtn.dataset['year'] = groups[groupKey].year;
                groupKeyBtn.dataset['group'] = groups[groupKey].group;
                groupKeyBtn.textContent = groupKey;
                groupSelectorBody.appendChild(groupKeyBtn);
            });
            searchField.addEventListener('input', () => {
                while (groupSelectorBody.firstChild) groupSelectorBody.firstChild.remove();
                groupsKeys.filter(key => key.toLowerCase().includes(searchField.value.toLowerCase())).forEach((groupKey) => {
                    const groupKeyBtn = document.createElement('div');
                    groupKeyBtn.className = 'group-selector-element';
                    groupKeyBtn.dataset['faculty'] = groups[groupKey].faculty;
                    groupKeyBtn.dataset['year'] = groups[groupKey].year;
                    groupKeyBtn.dataset['group'] = groups[groupKey].group;
                    groupKeyBtn.textContent = groupKey;
                    groupSelectorBody.appendChild(groupKeyBtn);
                });
            });
            document.addEventListener('click', (event) => {
                if (event?.target?.className !== 'group-selector-element') return;
                const { faculty, year, group } = event.target.dataset;
                renderSchedule(changeableDate, `https://schedule.npi-tu.ru/api/v2/faculties/${faculty}/years/${year}/groups/${group}/schedule`);
                SEARCH_PARAMS.set('faculty', faculty);
                SEARCH_PARAMS.set('year', year);
                SEARCH_PARAMS.set('group', group);
                window.history.pushState('', '', SEARCH_PARAMS);
                searchField.value = '';
                groupSelectorBody.scrollTop = 0;
                if(!cc.contains('hidden')) cc.add('hidden');
            });
        }
        cc.contains('hidden') ? cc.remove('hidden') : cc.add('hidden');
    });

    DAY_SELECTOR_ELEMENTS.forEach((daySelector, dayIndex) => {
        daySelector.addEventListener('click', () => {
            if (!isClickAllowed) return;
            isClickAllowed = false;
            setTimeout(() => isClickAllowed = true, 25);
            changeableDate.setDate(changeableDate.getDate() + dayIndex - 3);
            renderSchedule(changeableDate, currentScheduleUrl);
        });
    });

    renderSchedule(changeableDate, currentScheduleUrl);

    async function renderSchedule(nowDate, scheduleUrl) {
        updateTitle();
        updateDinnerLine();

        if (!lastSchedule || lastScheduleUrl !== scheduleUrl) {
            currentScheduleUrl = scheduleUrl;
            lastScheduleUrl = currentScheduleUrl;
            const [
                scheduleResponse,
            ] = await Promise.all([
                fetch(scheduleUrl),
            ]);
            lastSchedule = await scheduleResponse.json();
            lastSchedule.classes = lastSchedule.classes.filter(c => c.type !== '-');
        }

        updateLabels(lastSchedule);
        const today = new Date(nowDate);
        today.setHours(0, 0, 0, 0);

        const week = Array.from({ length: 7 }, (_, i) => {
            const newDate = new Date(nowDate);
            newDate.setDate(nowDate.getDate() + i - 3);
            return newDate;
        });

        const currentClasses = lastSchedule.classes.filter(c => c.day == today.getDay() && c.dates.find(date => date === nowDate.toLocaleDateString('en-CA')));

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
