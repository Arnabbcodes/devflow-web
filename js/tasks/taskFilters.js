/**
 * DevFlow Task Filters & Search State
 */

export const taskFilterState = {
  searchQuery: '',
  projectId: '',
  priority: '',
  viewMode: 'kanban' // 'kanban' or 'list'
};

export function setupTaskFilters(onFilterChange) {
  const searchInput = document.getElementById('tasks-search');
  const projectSelect = document.getElementById('tasks-filter-project');
  const prioritySelect = document.getElementById('tasks-filter-priority');
  const viewKanbanBtn = document.getElementById('view-kanban-btn');
  const viewListBtn = document.getElementById('view-list-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      taskFilterState.searchQuery = e.target.value.toLowerCase().trim();
      onFilterChange();
    });
  }

  if (projectSelect) {
    projectSelect.addEventListener('change', (e) => {
      taskFilterState.projectId = e.target.value;
      onFilterChange();
    });
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      taskFilterState.priority = e.target.value;
      onFilterChange();
    });
  }

  if (viewKanbanBtn && viewListBtn) {
    viewKanbanBtn.addEventListener('click', () => {
      taskFilterState.viewMode = 'kanban';
      viewKanbanBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      onFilterChange();
    });

    viewListBtn.addEventListener('click', () => {
      taskFilterState.viewMode = 'list';
      viewListBtn.classList.add('active');
      viewKanbanBtn.classList.remove('active');
      onFilterChange();
    });
  }
}

export function filterTasks(tasks) {
  return tasks.filter(task => {
    // Search query
    if (taskFilterState.searchQuery) {
      const matchTitle = task.title.toLowerCase().includes(taskFilterState.searchQuery);
      const matchDesc = task.description && task.description.toLowerCase().includes(taskFilterState.searchQuery);
      if (!matchTitle && !matchDesc) return false;
    }

    // Project
    if (taskFilterState.projectId && task.project_id !== taskFilterState.projectId) {
      return false;
    }

    // Priority
    if (taskFilterState.priority && task.priority !== taskFilterState.priority) {
      return false;
    }

    return true;
  });
}
