// ==========================================
// STATE MANAGEMENT
// ==========================================
let tasks = [
    {
        id: 1,
        title: "Explore the glassmorphic AuraTask dashboard",
        completed: false,
        category: "work",
        createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
    },
    {
        id: 2,
        title: "Add a new urgent task using the creation form",
        completed: false,
        category: "urgent",
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
        id: 3,
        title: "Toggle this task to see progress bar update",
        completed: true,
        category: "general",
        createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
    }
];

let currentFilter = "all";
let searchQuery = "";
let selectedCategory = "general";
let selectedCategoryFilter = "all";

// ==========================================
// DOM ELEMENTS
// ==========================================
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const themeToggle = document.getElementById("theme-toggle");
const timeDisplay = document.getElementById("current-time");
const dateDisplay = document.getElementById("current-date");

// Stats Elements
const statsTotal = document.getElementById("stats-total");
const statsActive = document.getElementById("stats-active");
const statsCompleted = document.getElementById("stats-completed");
const statsPercentage = document.getElementById("stats-percentage");
const progressBar = document.getElementById("progress-bar");

// Filter Tabs, Category Chips & Sidebar
const filterTabs = document.querySelectorAll(".tab-btn");
const categoryChips = document.querySelectorAll(".cat-chip");
const sidebarItems = document.querySelectorAll(".sidebar-item");

// ==========================================
// DATE & TIME DISPLAY
// ==========================================
function updateDateTime() {
    const now = new Date();
    
    // Time format: HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

    // Date format: Saturday, June 6, 2026
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

// Start clock
setInterval(updateDateTime, 1000);
updateDateTime();

// ==========================================
// THEME CONTROLLER
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem("aura-task-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("aura-task-theme", newTheme);
});

// ==========================================
// RENDER LOGIC
// ==========================================
function renderTasks() {
    // 1. Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategoryFilter === "all" || task.category === selectedCategoryFilter;
        
        if (!matchesCategory) return false;
        
        if (currentFilter === "active") {
            return !task.completed && matchesSearch;
        } else if (currentFilter === "completed") {
            return task.completed && matchesSearch;
        }
        return matchesSearch;
    });

    // Sort: uncompleted first, then newest first
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return b.createdAt - a.createdAt;
    });

    // Clear list
    taskList.innerHTML = "";

    // 2. Render List Items
    if (filteredTasks.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
        
        filteredTasks.forEach(task => {
            const li = document.createElement("li");
            li.className = `task-item ${task.completed ? "completed" : ""}`;
            li.dataset.id = task.id;

            const timeString = formatTimeAgo(task.createdAt);

            li.innerHTML = `
                <div class="task-item-left">
                    <label class="checkbox-container">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
                        <div class="custom-checkbox">
                            <i data-lucide="check"></i>
                        </div>
                    </label>
                    <div class="task-content">
                        <span class="task-title">${escapeHTML(task.title)}</span>
                        <div class="task-meta">
                            <span class="task-badge ${task.category}">${task.category}</span>
                            <span class="time-meta">${timeString}</span>
                        </div>
                    </div>
                </div>
                <button class="delete-btn" aria-label="Delete task">
                    <i data-lucide="trash-2"></i>
                </button>
            `;

            // Event: Toggle status
            const checkbox = li.querySelector(".task-checkbox");
            checkbox.addEventListener("change", () => toggleTaskStatus(task.id));

            // Event: Delete task
            const deleteBtn = li.querySelector(".delete-btn");
            deleteBtn.addEventListener("click", () => deleteTask(task.id, li));

            taskList.appendChild(li);
        });
    }

    // Refresh lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Update Statistics
    updateStatistics();
}

// ==========================================
// STATISTICS UPDATE
// ==========================================
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    statsTotal.textContent = total;
    statsActive.textContent = active;
    statsCompleted.textContent = completed;
    statsPercentage.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
}

// ==========================================
// STATE MUTATIONS (CRUD)
// ==========================================
function addTask(title, category) {
    const newTask = {
        id: Date.now(),
        title: title,
        completed: false,
        category: category,
        createdAt: new Date()
    };
    tasks.push(newTask);
    renderTasks();
}

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
}

function deleteTask(id, listItemElement) {
    // 1. Add class to animate removal
    listItemElement.classList.add("removing");
    
    // 2. Wait for animation to finish before mutating state & rendering
    listItemElement.addEventListener("animationend", () => {
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
    }, { once: true });
}

// ==========================================
// EVENT LISTENERS & DELEGATION
// ==========================================

// Handle task form submit
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (title) {
        addTask(title, selectedCategory);
        taskInput.value = "";
    }
});

// Category Selector Chips
categoryChips.forEach(chip => {
    chip.addEventListener("click", () => {
        categoryChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedCategory = chip.dataset.category;
    });
});

// Sidebar Category Filter
sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
        sidebarItems.forEach(s => s.classList.remove("active"));
        item.classList.add("active");
        selectedCategoryFilter = item.dataset.categoryFilter;
        
        // Sync the form's category selector with the chosen category
        if (selectedCategoryFilter !== "all") {
            categoryChips.forEach(chip => {
                chip.classList.toggle("active", chip.dataset.category === selectedCategoryFilter);
                if (chip.dataset.category === selectedCategoryFilter) {
                    selectedCategory = selectedCategoryFilter;
                }
            });
        }
        
        renderTasks();
    });
});

// Toolbar Filter Tabs
filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        filterTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentFilter = tab.dataset.filter;
        renderTasks();
    });
});

// Search Input Listener
searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderTasks();
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return "Just now";
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ==========================================
// INITIALIZATION
// ==========================================
initTheme();
renderTasks();
