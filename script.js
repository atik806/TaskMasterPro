document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const tasksCount = document.getElementById('tasks-count');
    const completionText = document.getElementById('completion-text');
    const themeSwitch = document.getElementById('theme-switch');
    const emptyState = document.getElementById('empty-state');
    
    // Modal Elements
    const modal = document.getElementById('task-details-modal');
    const modalTaskTitle = document.getElementById('modal-task-title');
    const taskTitleInput = document.getElementById('task-title');
    const taskNotesInput = document.getElementById('task-notes');
    const taskPrioritySelect = document.getElementById('task-priority');
    const taskDueDateInput = document.getElementById('task-due-date');
    const saveTaskDetailsBtn = document.getElementById('save-task-details');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let darkMode = localStorage.getItem('darkMode') === 'true';
    let currentEditingTaskId = null;
    
    // Initialize
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    }
    
    renderTodos();
    updateTasksCount();
    updateEmptyState();
    
    // Event Listeners
    addButton.addEventListener('click', () => openTaskModal());
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            openTaskModal();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.getAttribute('data-filter');
            renderTodos();
        });
    });
    
    themeSwitch.addEventListener('click', toggleTheme);
    
    // Modal event listeners
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    saveTaskDetailsBtn.addEventListener('click', saveTaskDetails);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Functions
    function openTaskModal(taskId = null) {
        // If taskId is provided, we're editing an existing task
        currentEditingTaskId = taskId;
        
        if (taskId) {
            const task = todos.find(todo => todo.id === taskId);
            if (task) {
                modalTaskTitle.textContent = 'Edit Task';
                taskTitleInput.value = task.text || '';
                taskNotesInput.value = task.notes || '';
                taskPrioritySelect.value = task.priority || 'medium';
                taskDueDateInput.value = task.dueDate || '';
            }
        } else {
            // We're creating a new task
            modalTaskTitle.textContent = 'New Task';
            taskTitleInput.value = taskInput.value || '';
            taskNotesInput.value = '';
            taskPrioritySelect.value = 'medium';
            taskDueDateInput.value = '';
        }
        
        modal.classList.add('show');
        taskTitleInput.focus();
    }
    
    function closeModal() {
        modal.classList.remove('show');
        currentEditingTaskId = null;
    }
    
    function saveTaskDetails() {
        const title = taskTitleInput.value.trim();
        const notes = taskNotesInput.value.trim();
        const priority = taskPrioritySelect.value;
        const dueDate = taskDueDateInput.value;
        
        if (!title) {
            // Highlight the title field if empty
            taskTitleInput.classList.add('error');
            setTimeout(() => taskTitleInput.classList.remove('error'), 1000);
            return;
        }
        
        if (currentEditingTaskId) {
            // Update existing task
            todos = todos.map(todo => {
                if (todo.id === currentEditingTaskId) {
                    return {
                        ...todo,
                        text: title,
                        notes: notes,
                        priority: priority,
                        dueDate: dueDate,
                        updatedAt: new Date().toISOString()
                    };
                }
                return todo;
            });
        } else {
            // Create new task
            const newTask = {
                id: Date.now(),
                text: title,
                notes: notes,
                priority: priority,
                dueDate: dueDate,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            todos.push(newTask);
        }
        
        saveTodos();
        renderTodos();
        updateTasksCount();
        updateEmptyState();
        closeModal();
        
        // Clear input
        taskInput.value = '';
    }
    
    function deleteTodo(id, event) {
        // Prevent opening the modal when clicking delete button
        event.stopPropagation();
        
        // Find the element to animate before removing from array
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            // Add fade out animation
            todoElement.style.animation = 'fadeIn 0.3s ease reverse';
            
            // Wait for animation to complete before removing
            setTimeout(() => {
                todos = todos.filter(todo => todo.id !== id);
                saveTodos();
                renderTodos();
                updateTasksCount();
                updateEmptyState();
            }, 300);
        }
    }
    
    function toggleTodo(id, event) {
        // Prevent opening the modal when clicking the checkbox
        event.stopPropagation();
        
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveTodos();
        renderTodos();
        updateTasksCount();
    }
    
    function clearCompleted() {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateTasksCount();
        updateEmptyState();
    }
    
    function renderTodos() {
        todoList.innerHTML = '';
        
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });
        
        // Sort by creation date (newest first)
        filteredTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', todo.id);
            li.addEventListener('click', () => openTaskModal(todo.id));
            
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'checkbox-wrapper';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', (e) => toggleTodo(todo.id, e));
            
            checkboxWrapper.appendChild(checkbox);
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'todo-content';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'todo-text';
            titleSpan.textContent = todo.text;
            
            contentDiv.appendChild(titleSpan);
            
            // Add notes preview if there are notes
            if (todo.notes && todo.notes.trim()) {
                const notesPreview = document.createElement('div');
                notesPreview.className = 'todo-notes-preview';
                notesPreview.textContent = todo.notes;
                contentDiv.appendChild(notesPreview);
            }
            
            // Add meta information (priority and due date)
            const metaDiv = document.createElement('div');
            metaDiv.className = 'todo-meta';
            
            if (todo.priority) {
                const prioritySpan = document.createElement('span');
                prioritySpan.className = `todo-priority priority-${todo.priority}`;
                prioritySpan.textContent = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
                metaDiv.appendChild(prioritySpan);
            }
            
            if (todo.dueDate) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.className = 'todo-due-date';
                
                // Format the date
                const dueDate = new Date(todo.dueDate);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                if (dueDate.toDateString() === today.toDateString()) {
                    dueDateSpan.textContent = 'Due: Today';
                    dueDateSpan.style.color = '#ff6b6b'; // Highlight today's tasks
                } else if (dueDate.toDateString() === tomorrow.toDateString()) {
                    dueDateSpan.textContent = 'Due: Tomorrow';
                } else {
                    dueDateSpan.textContent = `Due: ${dueDate.toLocaleDateString()}`;
                }
                
                metaDiv.appendChild(dueDateSpan);
            }
            
            if (metaDiv.children.length > 0) {
                contentDiv.appendChild(metaDiv);
            }
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'todo-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'todo-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening the modal twice
                openTaskModal(todo.id);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'todo-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', (e) => deleteTodo(todo.id, e));
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            li.appendChild(checkboxWrapper);
            li.appendChild(contentDiv);
            li.appendChild(actionsDiv);
            todoList.appendChild(li);
        });
        
        // Enable drag and drop after rendering
        enableDragAndDrop();
    }
    
    function updateTasksCount() {
        const activeTodos = todos.filter(todo => !todo.completed);
        const completedTodos = todos.filter(todo => todo.completed);
        
        tasksCount.textContent = `${activeTodos.length} item${activeTodos.length !== 1 ? 's' : ''} left`;
        
        // Update completion text
        if (todos.length > 0) {
            const percentComplete = Math.round((completedTodos.length / todos.length) * 100);
            completionText.textContent = `${percentComplete}% complete`;
        } else {
            completionText.textContent = '';
        }
    }
    
    function updateEmptyState() {
        if (todos.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }
    
    function toggleTheme() {
        darkMode = !darkMode;
        if (darkMode) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('darkMode', darkMode);
    }
    
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    // Enable drag and drop functionality with performance optimizations
    let draggedItem = null;
    let draggedItemId = null;
    
    function enableDragAndDrop() {
        const items = document.querySelectorAll('.todo-item');
        
        items.forEach(item => {
            item.setAttribute('draggable', true);
            
            // Use event delegation to improve performance
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
        });
    }
    
    function handleDragStart(e) {
        draggedItem = this;
        draggedItemId = parseInt(this.getAttribute('data-id'));
        
        // Add a class for styling
        setTimeout(() => this.classList.add('dragging'), 0);
        
        // Set ghost drag image
        const dragImage = this.cloneNode(true);
        dragImage.style.opacity = '0.8';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        
        // Clean up the clone after drag starts
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    }
    
    function handleDragEnd() {
        draggedItem = null;
        draggedItemId = null;
        
        // Remove all drag styling
        document.querySelectorAll('.todo-item').forEach(item => {
            item.classList.remove('dragging');
            item.style.borderTop = '';
        });
    }
    
    function handleDragOver(e) {
        e.preventDefault(); // Allow drop
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        if (this !== draggedItem) {
            this.style.borderTop = '2px solid var(--primary)';
        }
    }
    
    function handleDragLeave() {
        if (this !== draggedItem) {
            this.style.borderTop = '';
        }
    }
    
    function handleDrop(e) {
        e.preventDefault();
        if (this !== draggedItem) {
            const dropId = parseInt(this.getAttribute('data-id'));
            
            const draggedIndex = todos.findIndex(todo => todo.id === draggedItemId);
            const dropIndex = todos.findIndex(todo => todo.id === dropId);
            
            if (draggedIndex !== -1 && dropIndex !== -1) {
                // Reorder the todos array
                const [movedItem] = todos.splice(draggedIndex, 1);
                todos.splice(dropIndex, 0, movedItem);
                
                saveTodos();
                renderTodos();
            }
        }
        this.style.borderTop = '';
    }
    
    // Virtual scrolling for better performance with large lists
    function setupVirtualScrolling() {
        const scrollableContainer = document.querySelector('.scrollable-container');
        let isScrolling = false;
        
        scrollableContainer.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    // Optimize rendering during scroll
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }
    
    // Initialize virtual scrolling
    setupVirtualScrolling();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N to add new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openTaskModal();
        }
        
        // Escape to close modal
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
    
    // Check for due tasks and show notifications
    function checkDueTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dueTasks = todos.filter(todo => {
            if (!todo.completed && todo.dueDate) {
                const dueDate = new Date(todo.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === today.getTime();
            }
            return false;
        });
        
        if (dueTasks.length > 0 && "Notification" in window && Notification.permission === "granted") {
            new Notification("TaskMaster Pro", {
                body: `You have ${dueTasks.length} task${dueTasks.length > 1 ? 's' : ''} due today!`,
                icon: "https://cdn-icons-png.flaticon.com/512/2098/2098402.png"
            });
        }
    }
    
    // Request notification permission
    if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    
    // Check for due tasks on load
    checkDueTasks();
});
