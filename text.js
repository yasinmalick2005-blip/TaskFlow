// ============================================
// TASK MANAGER + CALCULATOR APP
// ============================================

// ============================================
// TASK MANAGER LOGIC
// ============================================

class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        this.updateStats();
    }

    setupEventListeners() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());

        // Enter key on task input
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const categorySelect = document.getElementById('categorySelect');
        const timeInput = document.getElementById('timeInput');

        const taskName = taskInput.value.trim();
        const priority = prioritySelect.value;
        const category = categorySelect.value;
        const time = parseInt(timeInput.value) || 0;

        if (!taskName) {
            alert('Please enter a task name');
            return;
        }

        const task = {
            id: Date.now(),
            name: taskName,
            priority,
            category,
            time,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.updateStats();

        // Clear inputs
        taskInput.value = '';
        timeInput.value = '';
        taskInput.focus();
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    render() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">📭 No tasks yet. Add one to get started!</div>';
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => {
            const isOverdue = this.isTaskOverdue(task);
            const categoryEmoji = { work: '💼', study: '📚', personal: '👤' }[task.category];

            return `
                <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''} 
                        onchange="taskManager.toggleTask(${task.id})"
                    >
                    <div class="task-content">
                        <div class="task-name">${this.escapeHtml(task.name)}</div>
                        <div class="task-meta">
                            <span class="task-priority priority-${task.priority}">
                                ${task.priority.toUpperCase()}
                            </span>
                            <span class="task-badge">${categoryEmoji} ${task.category}</span>
                            <span class="task-badge">⏱️ ${task.time} min</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-small btn-delete" onclick="taskManager.deleteTask(${task.id})">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const remaining = total - completed;
        const totalTime = this.tasks.reduce((sum, t) => sum + t.time, 0);

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('remainingTasks').textContent = remaining;

        // Format time
        const hours = Math.floor(totalTime / 60);
        const minutes = totalTime % 60;
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        document.getElementById('totalTime').textContent = timeStr;

        // Update progress bar
        const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
        document.getElementById('progressFill').style.width = progressPercent + '%';
        document.getElementById('progressText').textContent = `${progressPercent}% completed`;

        // Workload warning
        const warning = document.getElementById('workloadWarning');
        if (totalTime > 480) { // 480 minutes = 8 hours
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
    }

    isTaskOverdue(task) {
        // Mark as overdue if created more than 24 hours ago and not completed
        if (task.completed) return false;
        const createdTime = new Date(task.createdAt).getTime();
        const now = new Date().getTime();
        const diffHours = (now - createdTime) / (1000 * 60 * 60);
        return diffHours > 24;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// ============================================
// CALCULATOR LOGIC
// ============================================

class Calculator {
    constructor() {
        this.display = document.getElementById('calcDisplay');
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardSupport();
    }

    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.calc-number').forEach(btn => {
            btn.addEventListener('click', () => this.handleNumber(btn.dataset.number));
        });

        // Operator buttons
        document.querySelectorAll('.calc-operator').forEach(btn => {
            btn.addEventListener('click', () => this.handleOperator(btn.dataset.operator));
        });

        // Clear button
        document.getElementById('calcClear').addEventListener('click', () => this.clear());

        // Backspace button
        document.getElementById('calcBackspace').addEventListener('click', () => this.backspace());

        // Equals button
        document.getElementById('calcEquals').addEventListener('click', () => this.calculate());
    }

    setupKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                this.handleNumber(e.key);
            } else if (e.key === '+' || e.key === '-') {
                this.handleOperator(e.key);
            } else if (e.key === '*') {
                e.preventDefault();
                this.handleOperator('*');
            } else if (e.key === '/') {
                e.preventDefault();
                this.handleOperator('/');
            } else if (e.key === '.') {
                this.handleNumber('.');
            } else if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                this.calculate();
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.backspace();
            } else if (e.key === 'Escape') {
                this.clear();
            }
        });
    }

    handleNumber(num) {
        if (num === '.' && this.currentValue.includes('.')) return;

        if (this.shouldResetDisplay) {
            this.currentValue = num === '.' ? '0.' : num;
            this.shouldResetDisplay = false;
        } else {
            this.currentValue = this.currentValue === '0' && num !== '.' ? num : this.currentValue + num;
        }

        this.updateDisplay();
    }

    handleOperator(op) {
        if (this.operation !== null) {
            this.calculate();
        }

        this.previousValue = this.currentValue;
        this.operation = op;
        this.shouldResetDisplay = true;
    }

    calculate() {
        if (this.operation === null || this.shouldResetDisplay) return;

        let result;
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);

        switch (this.operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                result = current !== 0 ? prev / current : 0;
                break;
            default:
                return;
        }

        this.currentValue = result.toString();
        this.operation = null;
        this.shouldResetDisplay = true;
        this.updateDisplay();
    }

    backspace() {
        if (this.shouldResetDisplay) return;
        this.currentValue = this.currentValue.slice(0, -1) || '0';
        this.updateDisplay();
    }

    clear() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = this.currentValue;
    }
}

// ============================================
// INITIALIZE APP
// ============================================

const taskManager = new TaskManager();
const calculator = new Calculator();