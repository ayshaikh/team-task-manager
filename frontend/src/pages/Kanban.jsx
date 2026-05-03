import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import '../styles/Kanban.css';

const TASK_STATUSES = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

const STATUS_LABELS = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed'
};

const STATUS_COLORS = {
  TODO: '#B4B2A9',
  IN_PROGRESS: '#EF9F27',
  COMPLETED: '#1D9E75'
};

const PRIORITY_CONFIG = {
  HIGH: { label: 'High', bg: '#FCEBEB', color: '#A32D2D' },
  MEDIUM: { label: 'Medium', bg: '#FAEEDA', color: '#854F0B' },
  LOW: { label: 'Low', bg: '#EAF3DE', color: '#3B6D11' },
};

const ASSIGNEE_AVATARS = [
  { initials: 'AK', bg: '#EEEDFE', color: '#534AB7' },
  { initials: 'SR', bg: '#E1F5EE', color: '#0F6E56' },
  { initials: 'PM', bg: '#FAEEDA', color: '#854F0B' },
];

function getDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate) {
  if (!dueDate) return '';
  const d = new Date(dueDate);
  const month = d.toLocaleString('default', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

function getUrgencyClass(dueDate, status) {
  if (!dueDate || status === TASK_STATUSES.COMPLETED) return '';
  const days = getDaysUntilDue(dueDate);
  if (days === null) return '';
  if (days < 0) return 'task-card--overdue-border';
  if (days <= 3) return 'task-card--due-soon';
  return '';
}

export default function Kanban() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { on, off, emit, isConnected } = useSocket(user?.id, projectId);

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState({
    [TASK_STATUSES.TODO]: [],
    [TASK_STATUSES.IN_PROGRESS]: [],
    [TASK_STATUSES.COMPLETED]: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInlineForm, setShowInlineForm] = useState(null); // which column
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    due_date: '',
    assigned_to: ''
  });

  // Filters
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [filterDue, setFilterDue] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filterPriority, filterAssignee, filterDue].filter(f => f !== 'ALL').length;

  const isOwner = project?.owner_id === user?.id;
  const allTasksDone = tasks[TASK_STATUSES.TODO].length === 0 && 
                      tasks[TASK_STATUSES.IN_PROGRESS].length === 0 && 
                      tasks[TASK_STATUSES.COMPLETED].length > 0;
  const isProjectCompleted = project?.status === 'COMPLETED';

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

  // Socket.io event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Task creation is handled via HTTP API only (no socket broadcast)
    // Other socket events still apply for real-time updates from other users

    on('task_updated', (data) => {
      setTasks(prev => {
        const newTasks = JSON.parse(JSON.stringify(prev));
        for (let status of Object.values(TASK_STATUSES)) {
          const taskIndex = newTasks[status].findIndex(t => t.id === data.task_id);
          if (taskIndex !== -1) {
            newTasks[status][taskIndex] = {
              ...newTasks[status][taskIndex],
              ...data.updates
            };
            break;
          }
        }
        return newTasks;
      });
    });

    on('task_status_changed', (data) => {
      setTasks(prev => {
        const newTasks = JSON.parse(JSON.stringify(prev));
        let movedTask = null;
        for (let status of Object.values(TASK_STATUSES)) {
          const taskIndex = newTasks[status].findIndex(t => t.id === data.task_id);
          if (taskIndex !== -1) {
            movedTask = newTasks[status].splice(taskIndex, 1)[0];
            break;
          }
        }
        if (movedTask) {
          movedTask.status = data.status;
          newTasks[data.status].push(movedTask);
        }
        return newTasks;
      });
    });

    on('task_deleted', (data) => {
      setTasks(prev => {
        const newTasks = JSON.parse(JSON.stringify(prev));
        for (let status of Object.values(TASK_STATUSES)) {
          newTasks[status] = newTasks[status].filter(t => t.id !== data.task_id);
        }
        return newTasks;
      });
    });

    on('user_joined', (data) => {
      console.log('User joined:', data);
    });

    on('user_left', (data) => {
      console.log('User left:', data);
    });

    return () => {
      off('task_updated');
      off('task_status_changed');
      off('task_deleted');
      off('user_joined');
      off('user_left');
    };
  }, [isConnected, on, off]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      const projectRes = await api.get(`/projects/${projectId}`);
      setProject(projectRes.data);
      setMembers(projectRes.data?.project_members || []);

      const tasksRes = await api.get(`/tasks/project/${projectId}`);
      const tasksData = tasksRes.data || [];

      const organized = {
        [TASK_STATUSES.TODO]: [],
        [TASK_STATUSES.IN_PROGRESS]: [],
        [TASK_STATUSES.COMPLETED]: []
      };

      tasksData.forEach(task => {
        if (organized[task.status]) {
          organized[task.status].push(task);
        }
      });

      setTasks(organized);
      setError('');
    } catch (err) {
      setError('Failed to load project or tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    const applyFilters = (taskList) => {
      return taskList.filter(task => {
        // Priority filter
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;

        // Assignee filter
        if (filterAssignee !== 'ALL' && task.assigned_to !== filterAssignee) return false;

        // Due date filter
        if (filterDue !== 'ALL') {
          const days = getDaysUntilDue(task.due_date);
          if (filterDue === 'OVERDUE' && (days === null || days >= 0)) return false;
          if (filterDue === 'THIS_WEEK' && (days === null || days < 0 || days > 7)) return false;
          if (filterDue === 'NO_DATE' && task.due_date) return false;
        }

        return true;
      });
    };

    return {
      [TASK_STATUSES.TODO]: applyFilters(tasks[TASK_STATUSES.TODO]),
      [TASK_STATUSES.IN_PROGRESS]: applyFilters(tasks[TASK_STATUSES.IN_PROGRESS]),
      [TASK_STATUSES.COMPLETED]: applyFilters(tasks[TASK_STATUSES.COMPLETED]),
    };
  }, [tasks, filterPriority, filterAssignee, filterDue]);

  const handleCreateTask = async (e, targetStatus = 'TODO') => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        status: targetStatus,
      };
      if (formData.due_date) {
        payload.due_date = new Date(formData.due_date).toISOString();
      }
      if (formData.assigned_to) {
        payload.assigned_to = formData.assigned_to;
      }

      const response = await api.post(`/tasks/${projectId}`, payload);

      const newTask = response.data;
      
      // Add task from API response immediately
      setTasks(prev => ({
        ...prev,
        [targetStatus]: [...prev[targetStatus], newTask]
      }));

      setFormData({ title: '', description: '', priority: 'MEDIUM', due_date: '', assigned_to: '' });
      setShowInlineForm(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId, status) => {
    if (window.confirm('Delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        emit('task_deleted', {
          project_id: projectId,
          task_id: taskId
        });
        setTasks(prev => ({
          ...prev,
          [status]: prev[status].filter(t => t.id !== taskId)
        }));
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // Work on unfiltered tasks for reordering
    const newTasks = JSON.parse(JSON.stringify(tasks));

    // Find the actual task from filtered view
    const filteredSourceTasks = filteredTasks[sourceStatus];
    const draggedTaskId = filteredSourceTasks[source.index]?.id;
    if (!draggedTaskId) return;

    // Find the task in the unfiltered source list
    const actualSourceIndex = newTasks[sourceStatus].findIndex(t => t.id === draggedTaskId);
    if (actualSourceIndex === -1) return;

    if (sourceStatus !== destStatus) {
      try {
        await api.patch(`/tasks/${draggedTaskId}/status`, { status: destStatus });
        emit('task_status_changed', {
          project_id: projectId,
          task_id: draggedTaskId,
          status: destStatus
        });
      } catch (err) {
        setError('Failed to update task status');
        return;
      }
    }

    const [movedTask] = newTasks[sourceStatus].splice(actualSourceIndex, 1);
    movedTask.status = destStatus;

    // If same column, calculate destination properly
    if (sourceStatus === destStatus) {
      const filteredDestTasks = filteredTasks[destStatus];
      const destTaskId = filteredDestTasks[destination.index]?.id;
      const actualDestIndex = destTaskId
        ? newTasks[destStatus].findIndex(t => t.id === destTaskId)
        : newTasks[destStatus].length;
      newTasks[destStatus].splice(actualDestIndex, 0, movedTask);
    } else {
      // Different column — insert at the end or at the filtered position
      newTasks[destStatus].push(movedTask);
    }

    setTasks(newTasks);
  };

  const handleProjectComplete = async () => {
    try {
      await api.put(`/projects/${projectId}`, { status: 'COMPLETED' });
      setProject(prev => ({ ...prev, status: 'COMPLETED' }));
    } catch (err) {
      setError('Failed to update project status');
    }
  };

  const clearFilters = () => {
    setFilterPriority('ALL');
    setFilterAssignee('ALL');
    setFilterDue('ALL');
  };

  if (loading) {
    return (
      <div className="kanban-loading">
        <p>Loading board...</p>
      </div>
    );
  }

  return (
    <div className="kanban-board-wrapper">
      {error && <div className="kanban-error">{error}</div>}

      {/* Filter Bar */}
      <div className="kanban-filter-bar">
        <button
          className={`filter-toggle ${showFilters ? 'filter-toggle--active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 2.5h10M3 6h6M5 9.5h2" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {showFilters && (
          <div className="filter-dropdowns">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All assignees</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user?.username || m.user_id}
                </option>
              ))}
            </select>

            <select
              value={filterDue}
              onChange={(e) => setFilterDue(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All dates</option>
              <option value="OVERDUE">Overdue</option>
              <option value="THIS_WEEK">Due this week</option>
              <option value="NO_DATE">No due date</option>
            </select>

            {activeFilterCount > 0 && (
              <button className="filter-clear" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>
        )}

        <div className="filter-bar-spacer" style={{ flex: 1 }} />

        {isOwner && allTasksDone && !isProjectCompleted && (
          <button className="project-complete-btn" onClick={handleProjectComplete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17L4 12" />
            </svg>
            Mark as completed
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {Object.values(TASK_STATUSES).map(status => (
            <Droppable key={status} droppableId={status} isDropDisabled={false}>
              {(provided, snapshot) => (
                <div
                  className={`kanban-column ${snapshot.isDraggingOver ? 'kanban-column--drag-over' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {/* Column header */}
                  <div className="column-header">
                    <div
                      className="column-stripe"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    <span className="column-title">{STATUS_LABELS[status]}</span>
                    <span className="column-count">{filteredTasks[status].length}</span>
                  </div>

                  {/* Task cards */}
                  <div className="column-tasks">
                    {filteredTasks[status].length === 0 && !showInlineForm ? (
                      <div className="column-empty">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                        <span>No tasks yet</span>
                        <span className="column-empty-hint">Click + below to add one</span>
                      </div>
                    ) : (
                      filteredTasks[status].map((task, index) => {
                        const isCompleted = status === TASK_STATUSES.COMPLETED;
                        const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                        const overdue = isOverdue(task.due_date);
                        const urgencyClass = getUrgencyClass(task.due_date, status);
                        const assigneeAvatar = ASSIGNEE_AVATARS[index % ASSIGNEE_AVATARS.length];

                        return (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`task-card ${isCompleted ? 'task-card--completed' : ''} ${snapshot.isDragging ? 'task-card--dragging' : ''} ${urgencyClass}`}
                                style={provided.draggableProps.style}
                              >
                                {/* Top row: title + priority */}
                                <div className="card-top">
                                  <span className={`card-title ${isCompleted ? 'card-title--done' : ''}`}>
                                    {task.title}
                                  </span>
                                  <span
                                    className="card-priority"
                                    style={{ backgroundColor: isCompleted ? '#E1F5EE' : priority.bg, color: isCompleted ? '#1D9E75' : priority.color }}
                                  >
                                    {isCompleted ? 'Done' : priority.label}
                                  </span>
                                </div>

                                {/* Description */}
                                {task.description && (
                                  <p className="card-description">{task.description}</p>
                                )}

                                {/* Progress bar (in-progress only) */}
                                {status === TASK_STATUSES.IN_PROGRESS && (
                                  <div className="card-progress">
                                    <div className="card-progress-fill" style={{ width: '60%' }} />
                                  </div>
                                )}

                                {/* Footer: due date + avatars */}
                                <div className="card-footer">
                                  {task.due_date ? (
                                    <span className={`card-due ${overdue ? 'card-due--overdue' : ''}`}>
                                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                                        <circle cx="5" cy="5" r="4" />
                                        <path d="M5 3V5.5L6.5 6.5" />
                                      </svg>
                                      {urgencyClass === 'task-card--due-soon' && <span className="deadline-badge">Deadline:</span>}
                                      {formatDueDate(task.due_date)}
                                    </span>
                                  ) : <span />}
                                  <div className="card-avatars">
                                    <div
                                      className="card-avatar"
                                      style={{ backgroundColor: assigneeAvatar.bg, color: assigneeAvatar.color }}
                                    >
                                      {assigneeAvatar.initials}
                                    </div>
                                  </div>
                                </div>

                                {/* Delete button (visible on hover via CSS) */}
                                <button
                                  className="card-delete"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id, status); }}
                                  title="Delete task"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>

                  {/* Add task ghost button */}
                  {showInlineForm === status ? (
                    <form className="inline-task-form" onSubmit={(e) => handleCreateTask(e, status)}>
                      <input
                        type="text"
                        placeholder="Task title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        autoFocus
                      />
                      <textarea
                        placeholder="Task description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="inline-task-description"
                        rows="2"
                      />
                      <div className="inline-form-row">
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                        <input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                          className="inline-date-input"
                          placeholder="Due date"
                        />
                      </div>
                      {members.length > 0 && (
                        <select
                          value={formData.assigned_to}
                          onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                          className="inline-assignee-select"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                              {m.user?.username || m.user_id}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="inline-form-actions">
                        <button type="submit" className="inline-form-submit">Add</button>
                        <button type="button" className="inline-form-cancel" onClick={() => setShowInlineForm(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="add-task-ghost"
                      onClick={() => setShowInlineForm(status)}
                    >
                      <span>+</span> Add task
                    </button>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
