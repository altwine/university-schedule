import './index.css';

const I_HOPE_CLASS_TYPES_WILL_STAY_UNCHANGED: any = {"ЗАЧ":{"name":"Зачет","color":"#F0FBFF"},"ЗАЧО":{"name":"Зачет с оценкой","color":"#F0FBFF"},"КОНТ":{"name":"Контрольная работа","color":"#FFFBF0"},"КП":{"name":"Курсовой проект","color":"#FFFFFF"},"Л/ЛР":{"name":"Лекция/лабораторная","color":"#F0FBFF"},"Л/П":{"name":"Лекция/практика","color":"#F0FBFF"},"ЛАБ":{"name":"Лабораторная работа","color":"#E7E8F8"},"ЛЕК":{"name":"Лекция","color":"#E5FFD5"},"П/ЛР":{"name":"Практика/лабораторная","color":"#F0FBFF"},"ПР":{"name":"Практическое занятие","color":"#D5F6FF"},"ПЭКЗ":{"name":"Переэкзаменовка","color":"#FFFBF0"},"СЕМ":{"name":"Семинар","color":"#FFFBF0"},"ЭКЗ":{"name":"Экзамен","color":"#F0FBFF"}};

async function fetchJson (url: string) {
    const response = await fetch(url);
    return await response.json();
}

const DAYS_OF_WEEK = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const [CLASS_INTERVALS, CLASS_TYPES, SCHEDULE, FINAL_CLASSES] = await Promise.all([
    fetchJson(`https://schedule.npi-tu.ru/api/v1/class-intervals`),
    // fetchJson(`https://schedule.npi-tu.ru/api/v1/class-types`),
    I_HOPE_CLASS_TYPES_WILL_STAY_UNCHANGED,
    fetchJson(`https://schedule.npi-tu.ru/api/v2/faculties/2/years/1/groups/РПИа/schedule`),
    fetchJson(`https://schedule.npi-tu.ru/api/v1/faculties/2/years/1/groups/РПИа/finals-schedule`),
]);
const DATE_NOW = new Date().toLocaleDateString('ru-RU').replaceAll('.', '-');

SCHEDULE.classes = SCHEDULE.classes.concat(FINAL_CLASSES);

const SEMESTER_START = new Date(SCHEDULE.semester.start);
const FINALS_END = new Date(SCHEDULE.finals.end);
const currentDate = new Date(SEMESTER_START);
const fragment = document.createDocumentFragment();
const endTime = new Date(FINALS_END).getTime()
while (currentDate.getTime() <= endTime) {
    const currentDateStr = currentDate.toLocaleDateString('ru-RU').replaceAll('.', '-');
    const spanDate = document.createElement('span');
    spanDate.className = 'discipline-date';
    spanDate.textContent = `${DAYS_OF_WEEK[currentDate.getDay()]} (${currentDateStr.replaceAll('-', '.')})`;
    const currentDateStrRev = currentDateStr.split('-').reverse().join('-');
    const discs = SCHEDULE.classes.filter((e: any) => (e?.date === currentDateStrRev || e?.dates?.includes?.(currentDateStrRev)));
    const scheduleItem = document.createElement('div');
    scheduleItem.id = currentDateStr;
    scheduleItem.className = DATE_NOW === currentDateStr ? 'schedule-item-active' : 'schedule-item';
    scheduleItem.appendChild(spanDate);
    if (discs.length > 0) {
        for (const disc of discs) {
            const disciplineInfo = document.createElement('div');
            const disciplineName = document.createElement('div');
            const disciplineDescription = document.createElement('div');
            const disciplineType = document.createElement('div');
            const disciplineAuditorium = document.createElement('div');
            disciplineInfo.className = 'discipline-info';
            disciplineName.className = 'discipline-name';
            disciplineDescription.className = 'discipline-description';
            disciplineType.className = 'discipline-badge';
            disciplineAuditorium.className = 'discipline-badge';
            disciplineName.textContent = disc.discipline.replace(/ \(\d*? час\)/gm, '').toLowerCase();
            disciplineDescription.textContent = `${(disc?.class ? CLASS_INTERVALS[disc.class].start : disc.start)} - ${disc?.class ? CLASS_INTERVALS[disc.class].end : disc.end}`;
            const discAuditorium = disc.auditorium.toLowerCase();
            disciplineAuditorium.textContent = discAuditorium;
            const discType = CLASS_TYPES[disc.type].name.toLowerCase();
            disciplineType.title = discType;
            disciplineType.textContent = disc.type.toLowerCase();
            disciplineType.style.backgroundColor = CLASS_TYPES[disc.type].color;
            disciplineInfo.append(disciplineName, disciplineDescription);
            disciplineName.append(disciplineAuditorium, disciplineType);
            scheduleItem.appendChild(disciplineInfo);
        }
    } else {
        const disciplineDescription = document.createElement('div');
        const disciplineInfo = document.createElement('div');
        disciplineInfo.className = 'discipline-info';
        disciplineDescription.className = 'discipline-description';
        disciplineDescription.textContent = 'на этот день пар нет!!';
        disciplineInfo.appendChild(disciplineDescription);
        scheduleItem.appendChild(disciplineInfo);
    }
    fragment.appendChild(scheduleItem);
    currentDate.setDate(currentDate.getDate() + 1);
}
console.info(`Загружено ${SCHEDULE.classes.length} типов занятий.`);
document.body.appendChild(fragment);
const currentDay = document.getElementById(DATE_NOW);
if (currentDay) currentDay.scrollIntoView({ inline: 'center', behavior: 'instant', });
