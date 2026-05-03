const CLASS_TYPES = {
	КП: { name: "Курсовой проект", color: "#FFF", second: "#CCC" },
	"Л/ЛР": { name: "Лекция/лабораторная", color: "#EFF", second: "#BEF" },
	"Л/П": { name: "Лекция/практика", color: "#EFF", second: "#9DF" },
	ЛАБ: { name: "Лабораторная работа", color: "#EEF", second: "#AAF" },
	ЛЕК: { name: "Лекция", color: "#DFD", second: "#BF9" },
	"П/ЛР": { name: "Практика/лабораторная", color: "#EFF", second: "#AEF" },
	ПР: { name: "Практическое занятие", color: "#DEF", second: "#7DF" },
	ПЭКЗ: { name: "Переэкзаменовка", color: "#FFE", second: "#FD8" },
	СЕМ: { name: "Семинар", color: "#FFE", second: "#FEA" },
	ЭКЗ: { name: "Экзамен", color: "#FCC", second: "#F99" },
	ЗАЧ: { name: "Зачёт", color: "#FDC", second: "#FBA" },
	ЗАЧО: { name: "Зачёт с оценкой", color: "#FCD", second: "#FAB" },
};
const WEEK_DAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const YEAR_MONTH = [
	"Январь",
	"Февраль",
	"Март",
	"Апрель",
	"Май",
	"Июнь",
	"Июль",
	"Август",
	"Сентябрь",
	"Октябрь",
	"Ноябрь",
	"Декабрь",
];
const TIME_CLASS_MAP = {
	"09:00": 1,
	"10:45": 2,
	"13:15": 3,
	"15:00": 4,
	"16:45": 5,
	"18:30": 6,
};

const SEARCH_PARAMS = new URLSearchParams(window.location.search);
const ROOT_ELEMENT_STYLE = document.documentElement.style;

const MAIN_CONTENT = document.querySelector("main");
const DAY_SELECTOR_ELEMENTS = document.querySelectorAll(".day-selector");
const CLASS_CONTAINER_ELEMENTS = document.querySelectorAll(".class-container");
const DINNER_LINE_CONTAINER_ELEMENT = document.querySelector(".dinner-line-container");
const [DISABLE_DINNER_ELEMENT, CHANGE_THEME_ELEMENT, TODAY_BUTTON_ELEMENT, SELECT_GROUP_ELEMENT] =
	document.querySelectorAll(".action-button");
const TITLE_ELEMENT = document.getElementById("title");
const CLOSE_NOTES_EDITOR = document.getElementById("close-notes-editor");
const COLOR_BADGE_ELEMENTS = Array.from(document.querySelectorAll(".color-badge"));
const SEARCH_FIELD_ELEMENT = document.querySelector(".search-field");
const GROUP_SELECTOR_ELEMENT = document.querySelector(".group-selector");
const NOTES_EDITOR_ELEMENT = document.querySelector(".notes-editor");
const NO_INTERNET_NOTICE_ELEMENT = document.getElementById("no-internet-notice");
const NOTE_TITLE_ELEMENT = document.getElementById("note-title");
const NOTE_CONTENT_ELEMENT = document.getElementById("note-content");

const groupFetch = fetch("https://schedule.npi-tu.ru/api/v1/groups/-");

const changeableDate = new Date();

const notesData = JSON.parse(localStorage.notes ?? "{}");

let currentScheduleState = {
	year: SEARCH_PARAMS.get("year") ?? "2",
	group: SEARCH_PARAMS.get("group") ?? "РПИа",
	faculty: SEARCH_PARAMS.get("faculty") ?? "2",
};
let isClickAllowed = true;

if (!localStorage.theme) {
	localStorage.theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

if (localStorage.theme === "dark") {
	ROOT_ELEMENT_STYLE.colorScheme = "dark";
	CHANGE_THEME_ELEMENT.textContent = "☀️";
} else {
	ROOT_ELEMENT_STYLE.colorScheme = "light";
	// CHANGE_THEME_ELEMENT.textContent = "🌙"; // по умолчанию в разметке стоит луна
}

function updateDinnerLine() {
	DINNER_LINE_CONTAINER_ELEMENT.style.display = localStorage.dinnerLineState ?? "none";
}

function updateTitle() {
	TITLE_ELEMENT.textContent = `${YEAR_MONTH[changeableDate.getMonth()]} ${changeableDate.getFullYear()}`;
}

function updateLabels(schedule) {
	const uniqueClassTypes = Array.from(new Set(schedule.classes.map((c) => c.type))).filter(
		(type) => CLASS_TYPES[type],
	);

	uniqueClassTypes.sort((a, b) => CLASS_TYPES[b].name.length - CLASS_TYPES[a].name.length);

	COLOR_BADGE_ELEMENTS.forEach((badge, i) => {
		const type = uniqueClassTypes[i];
		if (type) {
			badge.textContent = CLASS_TYPES[type].name;
			badge.style.backgroundColor = CLASS_TYPES[type].color;
			badge.style.display = "unset";
		} else {
			badge.textContent = "";
			badge.style.backgroundColor = "transparent";
			badge.style.display = "none";
		}
		if (i < 3) badge.classList.remove("skeletal");
	});
}

function preventDoubleClick() {
	if (!isClickAllowed) return;
	isClickAllowed = false;
	setTimeout(() => (isClickAllowed = true), 25);
}

updateDinnerLine();
updateTitle();

(async () => {
	let lastScheduleState = { year: null, group: null, faculty: null };
	let lastSchedule = null;

	let touchstartX = null;
	let touchendX = null;

	MAIN_CONTENT.addEventListener("touchstart", (event) => (touchstartX = event.changedTouches[0].screenX));

	MAIN_CONTENT.addEventListener("touchend", (event) => {
		touchendX = event.changedTouches[0].screenX;
		if (Math.abs(touchstartX - touchendX) <= 60) return;
		if (touchendX < touchstartX) {
			changeableDate.setDate(changeableDate.getDate() + 1);
		} else if (touchendX > touchstartX) {
			changeableDate.setDate(changeableDate.getDate() - 1);
		}
		renderSchedule(changeableDate);
	});

	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
		const theme = e.matches ? "dark" : "light";
		localStorage.theme = theme;
		ROOT_ELEMENT_STYLE.colorScheme = theme;
		CHANGE_THEME_ELEMENT.textContent = theme === "dark" ? "☀️" : "🌙";
	});

	DISABLE_DINNER_ELEMENT.addEventListener("click", () => {
		preventDoubleClick();
		localStorage.dinnerLineState = localStorage.dinnerLineState !== "flex" ? "flex" : "none";
		updateDinnerLine();
	});

	TODAY_BUTTON_ELEMENT.addEventListener("click", () => {
		preventDoubleClick();
		changeableDate.setTime(new Date().getTime());
		renderSchedule(changeableDate);
	});

	CHANGE_THEME_ELEMENT.addEventListener("click", () => {
		preventDoubleClick();
		if (localStorage.theme === "dark") {
			localStorage.theme = "light";
			ROOT_ELEMENT_STYLE.colorScheme = "light";
			CHANGE_THEME_ELEMENT.textContent = "🌙";
		} else {
			localStorage.theme = "dark";
			ROOT_ELEMENT_STYLE.colorScheme = "dark";
			CHANGE_THEME_ELEMENT.textContent = "☀️";
		}
	});

	let groups = null;
	SELECT_GROUP_ELEMENT.addEventListener("click", async () => {
		preventDoubleClick();
		NOTES_EDITOR_ELEMENT.classList.add("hidden");
		const cc = GROUP_SELECTOR_ELEMENT.classList;
		if (!groups) {
			const groupsResponse = await groupFetch;
			groups = await groupsResponse.json();
			const groupsKeys = Object.keys(groups);
			const groupSelectorBody = document.querySelector(".group-selector-body");
			groupsKeys.forEach((groupKey) => {
				const groupKeyBtn = document.createElement("div");
				groupKeyBtn.className = "group-selector-element";
				groupKeyBtn.dataset.faculty = groups[groupKey].faculty;
				groupKeyBtn.dataset.year = groups[groupKey].year;
				groupKeyBtn.dataset.group = groups[groupKey].group;
				groupKeyBtn.textContent = groupKey;
				groupSelectorBody.appendChild(groupKeyBtn);
			});
			SEARCH_FIELD_ELEMENT.addEventListener("input", () => {
				groupSelectorBody.replaceChildren();
				groupsKeys
					.filter((key) => key.toLowerCase().includes(SEARCH_FIELD_ELEMENT.value.toLowerCase()))
					.forEach((groupKey) => {
						const groupKeyBtn = document.createElement("div");
						groupKeyBtn.className = "group-selector-element";
						groupKeyBtn.dataset.faculty = groups[groupKey].faculty;
						groupKeyBtn.dataset.year = groups[groupKey].year;
						groupKeyBtn.dataset.group = groups[groupKey].group;
						groupKeyBtn.textContent = groupKey;
						groupSelectorBody.appendChild(groupKeyBtn);
					});
			});
			document.addEventListener("click", (event) => {
				if (event?.target?.className !== "group-selector-element") return;
				Object.assign(currentScheduleState, event.target.dataset);
				delete localStorage.cachedSchedule;
				renderSchedule(changeableDate);
				SEARCH_PARAMS.set("faculty", currentScheduleState.faculty);
				SEARCH_PARAMS.set("year", currentScheduleState.year);
				SEARCH_PARAMS.set("group", currentScheduleState.group);
				window.history.pushState(
					"",
					"",
					`${window.location.origin}${window.location.pathname}?${SEARCH_PARAMS.toString()}`,
				);
				SEARCH_FIELD_ELEMENT.value = "";
				groupSelectorBody.scrollTop = 0;
				cc.add("hidden");
			});
		}
		cc.toggle("hidden");
	});

	DAY_SELECTOR_ELEMENTS.forEach((daySelector, dayIndex) => {
		daySelector.addEventListener("click", () => {
			preventDoubleClick();
			changeableDate.setDate(changeableDate.getDate() + dayIndex - 3);
			renderSchedule(changeableDate);
		});
	});

	CLOSE_NOTES_EDITOR.addEventListener("click", async () => {
		preventDoubleClick();
		NOTES_EDITOR_ELEMENT.classList.add("hidden");

		const noteContent = NOTE_CONTENT_ELEMENT.value.trim();
		if (noteContent === "") {
			delete notesData[latestClassHash];
		} else {
			notesData[latestClassHash] = noteContent;
		}
		localStorage.notes = JSON.stringify(notesData);
		renderSchedule(changeableDate);
	});

	let latestClassHash;
	CLASS_CONTAINER_ELEMENTS.forEach((classEl) => {
		const classInfoContainerEl = classEl.querySelector("#class-info-container");
		classInfoContainerEl.addEventListener("click", () => {
			const hash = classInfoContainerEl.dataset.hash;
			if (hash === "") return;
			latestClassHash = hash;
			const cc = GROUP_SELECTOR_ELEMENT.classList;
			cc.add("hidden");
			const cl = NOTES_EDITOR_ELEMENT.classList;
			cl.remove("hidden");
			const classTitleEl = classInfoContainerEl.querySelector("#class-title");
			NOTE_TITLE_ELEMENT.textContent = classTitleEl.textContent.split(" ").slice(1).join(" ");
			NOTE_CONTENT_ELEMENT.value = notesData?.[hash] ?? "";
		});
	});

	renderSchedule(changeableDate);

	async function renderSchedule(nowDate) {
		updateTitle();

		if (
			!lastSchedule ||
			currentScheduleState.year !== lastScheduleState.year ||
			currentScheduleState.group !== lastScheduleState.group ||
			currentScheduleState.faculty !== lastScheduleState.faculty
		) {
			try {
				Object.assign(lastScheduleState, currentScheduleState);
				const scheduleUrl = `https://schedule.npi-tu.ru/api/v2/faculties/${currentScheduleState.faculty}/years/${currentScheduleState.year}/groups/${currentScheduleState.group}/schedule`;
				const finalsUrl = `https://schedule.npi-tu.ru/api/v2/faculties/${currentScheduleState.faculty}/years/${currentScheduleState.year}/groups/${currentScheduleState.group}/finals-schedule`;
				const [scheduleResponse, scheduleFinals] = await Promise.all([fetch(scheduleUrl), fetch(finalsUrl)]);
				lastSchedule = await scheduleResponse.json();
				lastSchedule.classes = lastSchedule.classes.filter((c) => c.type !== "-");
				let finals = await scheduleFinals.json();
				finals = finals.map((exam) => {
					const containers = Array.from(document.querySelectorAll(".class-container"));
					const timeStartContainer = containers.findIndex((c) => c.innerHTML.includes(exam.start));
					const timeEndContainer = containers.findIndex((c) => c.innerHTML.includes(exam.end));
					const h = getComputedStyle(containers[0]).height.split("px")[0];
					const mul = Math.min(Math.max(timeEndContainer - timeStartContainer + 1, 1), 6);
					exam.tileSize = h * mul - 8 - 4;
					exam.dates = [exam.date];
					exam.class = TIME_CLASS_MAP[exam.start];
					return exam;
				});
				for (const final of finals) {
					lastSchedule.classes.push(final);
				}
				localStorage.cachedSchedule = JSON.stringify(lastSchedule);
				// localStorage.cachedScheduleTimestamp = (+realDate).toString(); // Может добавлю устаревание
				NO_INTERNET_NOTICE_ELEMENT.style.display = "none";
			} catch (e) {
				console.log(e);
				NO_INTERNET_NOTICE_ELEMENT.style.display = "flex";
				const cachedSchedule = localStorage.cachedSchedule;
				if (cachedSchedule) {
					lastSchedule = JSON.parse(cachedSchedule);
				} else {
					return;
				}
			}
		}

		updateLabels(lastSchedule);
		document.title = `Расписание ${lastSchedule.group}`;

		const week = Array.from({ length: 7 }, (_, i) => {
			const newDate = new Date(nowDate);
			newDate.setDate(nowDate.getDate() + i - 3);
			return newDate;
		});

		const nowDateFormatted = nowDate.toLocaleDateString("en-CA");
		const currentClasses = lastSchedule.classes.filter((c) => c.dates.includes(nowDateFormatted));

		DAY_SELECTOR_ELEMENTS.forEach((daySelector, dayIndex) => {
			const dayNameEl = daySelector.querySelector("#day-name");
			const dayNumberEl = daySelector.querySelector("#day-number");
			const currentDay = week[dayIndex];
			dayNameEl.textContent = WEEK_DAYS[currentDay.getDay()];
			dayNumberEl.textContent = currentDay.getDate();
			if (currentDay.getDate() === nowDate.getDate()) {
				dayNumberEl.classList.add("selected");
			}
		});

		CLASS_CONTAINER_ELEMENTS.forEach((classEl, classIndex) => {
			const currentClass = currentClasses.find((c) => c.class === classIndex + 1);
			const classInfoContainerEl = classEl.querySelector("#class-info-container");
			const classInfoEl = classEl.querySelector(".class-info");
			const classInfoTitleEl = classInfoEl.querySelector("#class-title");
			const classInfoLecturerEl = classInfoEl.querySelector("#class-lecturer");
			const classInfoNotePreviewEl = classInfoEl.querySelector("#class-note-preview");
			if (!currentClass) {
				classInfoTitleEl.textContent = "";
				classInfoLecturerEl.textContent = "";
				classInfoNotePreviewEl.textContent = "";
				classInfoContainerEl.dataset.hash = "";
				Object.assign(classInfoContainerEl.style, {
					border: "none",
					opacity: "0",
					position: "unset",
					height: "unset",
					width: "unset",
					right: "unset",
					zIndex: "unset",
					backgroundColor: "unset",
				});
				return;
			}
			const classHash =
				currentScheduleState.faculty +
				currentScheduleState.group +
				currentScheduleState.year +
				nowDateFormatted +
				classIndex;
			classInfoContainerEl.dataset.hash = classHash;
			let noteContent = notesData?.[classHash];
			if (noteContent) {
				noteContent = noteContent.slice(0, 24);
				if (noteContent.length > 23) noteContent += "...";
				classInfoNotePreviewEl.textContent = `Заметка: ${noteContent}`;
			} else {
				classInfoNotePreviewEl.textContent = "";
			}
			const disciplineRenamed = currentClass.discipline.replace(/ \(\d+ час\)/, "");
			classInfoTitleEl.textContent = `${currentClass.auditorium} ${disciplineRenamed}`;
			classInfoLecturerEl.textContent = currentClass.lecturer;
			classInfoContainerEl.style.border = "var(--border-card) 1px solid";
			classInfoContainerEl.style.backgroundColor = CLASS_TYPES[currentClass.type].color;
			const classInfoLineEl = classEl.querySelector(".pillar");
			classInfoLineEl.style.backgroundColor = CLASS_TYPES[currentClass.type].second;
			classInfoContainerEl.style.opacity = "1";

			if (currentClass.tileSize) {
				Object.assign(classInfoContainerEl.style, {
					position: "absolute",
					height: `${currentClass.tileSize}px`,
					width: getComputedStyle(classInfoContainerEl).width,
					right: "4px",
					zIndex: 1,
				});
			} else {
				Object.assign(classInfoContainerEl.style, {
					position: "unset",
					height: "unset",
					width: "unset",
					right: "unset",
					zIndex: "unset",
				});
			}
		});
	}
})();
