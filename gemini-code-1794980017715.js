// ====== 전역 상태 및 데이터 관리 ======
let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];
let currentView = 'list';
let currentListFilter = 'all'; // 'all', 'completed', 'incomplete'
let currentDate = new Date(); // 달력용 기준 날짜
let currentDetailTaskId = null;
let currentDailyDateStr = null; // 달력 팝업용 기준 일자

// 데이터 저장
function saveToLocalStorage() {
    localStorage.setItem('todo_tasks', JSON.stringify(tasks));
}

// 오늘 날짜 문자열 반환 (YYYY-MM-DD)
function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 날짜 포맷 (YYYY년 MM월 DD일)
function formatDateKor(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('headerDate').innerText = formatDateKor(getTodayString());
    renderTasks();
    if(currentView === 'calendar') renderCalendar();
});


// ====== UI 렌더링 및 뷰 전환 ======

// 리스트 필터 설정
function setListFilter(filter) {
    currentListFilter = filter;
    
    // 버튼 스타일 업데이트
    const btnClasses = {
        active: 'px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white shadow-sm transition-colors',
        inactive: 'px-4 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
    };
    
    ['all', 'completed', 'incomplete'].forEach(f => {
        const el = document.getElementById(`filter-${f}`);
        if(f === filter) {
            el.className = btnClasses.active;
        } else {
            el.className = btnClasses.inactive;
        }
    });
    
    renderTasks();
}

// 목록/달력 뷰 전환
function switchView(view) {
    currentView = view;
    const btnList = document.getElementById('btnListView');
    const btnCal = document.getElementById('btnCalendarView');
    const listView = document.getElementById('listView');
    const calView = document.getElementById('calendarView');
    const filters = document.getElementById('listFilters');

    if (view === 'list') {
        btnList.className = 'px-4 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm text-blue-600 transition-all';
        btnCal.className = 'px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition-all';
        listView.classList.remove('hidden');
        filters.classList.remove('hidden');
        calView.classList.add('hidden');
        renderTasks();
    } else {
        btnCal.className = 'px-4 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm text-blue-600 transition-all';
        btnList.className = 'px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition-all';
        calView.classList.remove('hidden');
        listView.classList.add('hidden');
        filters.classList.add('hidden');
        renderCalendar();
    }
}

// 일정 리스트 화면 그리기
function renderTasks() {
    const todayStr = getTodayString();
    
    const todayTasksList = document.getElementById('todayTasksList');
    const allTasksList = document.getElementById('allTasksList');
    const todayEmpty = document.getElementById('todayEmpty');
    const allEmpty = document.getElementById('allEmpty');
    
    todayTasksList.innerHTML = '';
    allTasksList.innerHTML = '';

    // 1. 오늘 할 일
    const todayTasks = tasks.filter(t => t.date === todayStr);
    if (todayTasks.length === 0) {
        todayEmpty.classList.remove('hidden');
    } else {
        todayEmpty.classList.add('hidden');
        todayTasks.forEach(task => todayTasksList.appendChild(createTaskCard(task)));
    }

    // 2. 모든 할 일 (필터 적용)
    let filteredTasks = tasks;
    if (currentListFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    } else if (currentListFilter === 'incomplete') {
        filteredTasks = tasks.filter(t => !t.completed);
    }

    // 날짜 오름차순 정렬
    const sortedTasks = [...filteredTasks].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (sortedTasks.length === 0) {
        allEmpty.classList.remove('hidden');
    } else {
        allEmpty.classList.add('hidden');
        sortedTasks.forEach(task => allTasksList.appendChild(createTaskCard(task)));
    }

    // 일별 팝업 갱신 (열려있는 경우)
    if(currentDailyDateStr) {
        renderDailyTasksList(currentDailyDateStr);
    }
    
    if(currentView === 'calendar') {
        renderCalendar();
    }
}

// 할 일 카드 UI 생성
function createTaskCard(task) {
    const li = document.createElement('li');
    li.className = 'task-card flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm cursor-pointer';
    li.onclick = () => openDetailModal(task.id);
    
    // 체크박스 처리 (이벤트 전파 방지)
    const checkDiv = document.createElement('div');
    checkDiv.className = `mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-400'}`;
    checkDiv.onclick = (e) => {
        e.stopPropagation();
        toggleTaskStatus(task.id);
    };
    
    if (task.completed) {
        checkDiv.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
    }
    
    // 텍스트 영역
    const textDiv = document.createElement('div');
    textDiv.className = 'flex-grow min-w-0';
    textDiv.innerHTML = `
        <h3 class="font-bold text-gray-800 truncate ${task.completed ? 'line-through text-gray-400' : ''}">${task.title}</h3>
        <p class="text-sm text-gray-500 truncate mt-1">${task.desc || '내용 없음'}</p>
    `;
    
    // 날짜 영역
    const dateDiv = document.createElement('div');
    dateDiv.className = 'flex-shrink-0';
    dateDiv.innerHTML = `<span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">${task.date}</span>`;
    
    li.appendChild(checkDiv);
    li.appendChild(textDiv);
    li.appendChild(dateDiv);
    
    return li;
}


// ====== 달력 기능 ======
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('calendarMonthLabel').innerText = `${year}년 ${month + 1}월`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // 빈 칸(이전 달)
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'bg-gray-50/50 rounded-lg border border-transparent';
        grid.appendChild(emptyDiv);
    }
    
    // 날짜 렌더링
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.date === dateStr);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'bg-white rounded-lg border border-gray-100 p-1 flex flex-col hover:border-blue-300 transition-colors relative cursor-pointer';
        
        // 날짜 숫자
        const isToday = dateStr === getTodayString();
        dayDiv.innerHTML = `<div class="text-xs font-bold mb-1 ${isToday ? 'text-white bg-blue-500 w-6 h-6 flex items-center justify-center rounded-full mx-auto' : 'text-gray-700 text-center'}">${i}</div>`;
        
        // 클릭 시 이벤트 분기
        dayDiv.onclick = () => {
            if (dayTasks.length > 0) {
                openDailyTasksModal(dateStr);
            } else {
                openAddModal(dateStr);
            }
        };
        
        // 일정 뱃지 추가 (최대 2개)
        if (dayTasks.length > 0) {
            const maxTasksToShow = 2;
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'flex flex-col gap-1 overflow-hidden';
            
            dayTasks.slice(0, maxTasksToShow).forEach(task => {
                const badge = document.createElement('div');
                badge.className = `text-[10px] sm:text-xs truncate px-1 sm:px-1.5 py-0.5 rounded ${task.completed ? 'bg-gray-100 text-gray-400 line-through' : 'bg-blue-50 text-blue-700'} font-medium`;
                badge.innerText = task.title;
                tasksContainer.appendChild(badge);
            });
            dayDiv.appendChild(tasksContainer);
            
            // 3개 이상일 경우 더보기 표시
            if(dayTasks.length > maxTasksToShow) {
                const moreBadge = document.createElement('div');
                moreBadge.className = 'text-[10px] text-blue-500 font-bold text-center mt-auto';
                moreBadge.innerText = `+${dayTasks.length - maxTasksToShow} 더보기`;
                dayDiv.appendChild(moreBadge);
            }
        }
        
        grid.appendChild(dayDiv);
    }
}


// ====== 모달 제어 로직 ======
function applyModalAnimation(modalId, show) {
    const modal = document.getElementById(modalId);
    const inner = modal.children[0];
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.add('modal-active');
            inner.classList.add('modal-scale-active');
        }, 10);
    } else {
        modal.classList.remove('modal-active');
        inner.classList.remove('modal-scale-active');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
}

// 1. 추가/수정 모달
function openAddModal(defaultDate = null, editTaskId = null) {
    closeDetailModal(); // 혹시 열려있으면 닫기
    const form = document.getElementById('taskForm');
    const titleEl = document.getElementById('modalTitle');
    
    if (editTaskId) {
        const task = tasks.find(t => t.id === editTaskId);
        if(!task) return;
        titleEl.innerText = '할 일 수정';
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskDesc').value = task.desc;
    } else {
        titleEl.innerText = '새로운 할 일';
        form.reset();
        document.getElementById('taskId').value = '';
        document.getElementById('taskDate').value = defaultDate || getTodayString();
    }
    applyModalAnimation('addModal', true);
}

function closeAddModal() {
    applyModalAnimation('addModal', false);
}

// 2. 제출(저장) 처리
function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value;
    const date = document.getElementById('taskDate').value;
    const desc = document.getElementById('taskDesc').value;

    if (id) {
        const index = tasks.findIndex(t => t.id == id);
        if (index > -1) {
            tasks[index].title = title;
            tasks[index].date = date;
            tasks[index].desc = desc;
        }
    } else {
        const newTask = {
            id: Date.now().toString(),
            title, date, desc,
            completed: false
        };
        tasks.push(newTask);
    }

    saveToLocalStorage();
    renderTasks();
    closeAddModal();
}

// 3. 상세보기 모달
function openDetailModal(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;
    
    currentDetailTaskId = id;
    
    document.getElementById('detailTitle').innerText = task.title;
    document.getElementById('detailTitle').className = `text-2xl font-bold break-words ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`;
    
    document.getElementById('detailDate').innerText = task.date;
    document.getElementById('detailDesc').innerText = task.desc || '내용이 없습니다.';
    
    const btnToggle = document.getElementById('btnDetailToggle');
    if (task.completed) {
        btnToggle.innerText = '미완료로 변경';
        btnToggle.className = 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm';
    } else {
        btnToggle.innerText = '완료로 변경';
        btnToggle.className = 'px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm';
    }
    
    document.getElementById('btnDetailEdit').onclick = () => openAddModal(null, id);
    btnToggle.onclick = () => {
        toggleTaskStatus(id);
        openDetailModal(id); // 변경된 내용 갱신
    };
    document.getElementById('btnDetailDelete').onclick = () => {
        const confirmModal = document.getElementById('confirmModal');
        applyModalAnimation('confirmModal', true);
        
        document.getElementById('btnConfirmNo').onclick = () => applyModalAnimation('confirmModal', false);
        document.getElementById('btnConfirmYes').onclick = () => {
            deleteTask(id);
            applyModalAnimation('confirmModal', false);
            closeDetailModal();
        };
    };

    applyModalAnimation('detailModal', true);
}

function closeDetailModal() {
    currentDetailTaskId = null;
    applyModalAnimation('detailModal', false);
}

// 상태 변경 및 삭제
function toggleTaskStatus(id) {
    const index = tasks.findIndex(t => t.id == id);
    if (index > -1) {
        tasks[index].completed = !tasks[index].completed;
        saveToLocalStorage();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id != id);
    saveToLocalStorage();
    renderTasks();
}

// 4. 달력용 일별 목록 팝업
function openDailyTasksModal(dateStr) {
    currentDailyDateStr = dateStr;
    const titleEl = document.getElementById('dailyTasksTitle');
    titleEl.innerText = formatDateKor(dateStr) + ' 일정';
    
    // 추가 버튼 이벤트 연결
    const btnAdd = document.getElementById('btnDailyAdd');
    btnAdd.onclick = () => openAddModal(dateStr);

    renderDailyTasksList(dateStr);
    applyModalAnimation('dailyTasksModal', true);
}

function closeDailyTasksModal() {
    currentDailyDateStr = null;
    applyModalAnimation('dailyTasksModal', false);
}

function renderDailyTasksList(dateStr) {
    const listEl = document.getElementById('dailyTasksList');
    listEl.innerHTML = '';
    
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    if (dayTasks.length === 0) {
        // 일정이 삭제되어 비어버린 경우 모달 닫기
        closeDailyTasksModal();
        return;
    }
    
    dayTasks.forEach(task => {
        const li = createTaskCard(task);
        li.className = li.className.replace('p-4', 'p-3').replace('rounded-xl', 'rounded-lg');
        listEl.appendChild(li);
    });
}