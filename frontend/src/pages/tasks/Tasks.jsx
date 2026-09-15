import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './tasks.css';

const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState(getTodayDate);
  const [sortBy, setSortBy] = useState('dueDate');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const userId = parseInt(localStorage.getItem('userId'));
  const email = localStorage.getItem('email');

  const toLocalDateInput = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 10);
  };

  const toApiDueDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(`${dateString}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }

    const aDue = a.dueDate ? new Date(a.dueDate).setHours(0, 0, 0, 0) : Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate ? new Date(b.dueDate).setHours(0, 0, 0, 0) : Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  });

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/tasks');
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      await api.post('/tasks', {
        title: newTask,
        isDone: false,
        dueDate: toApiDueDate(newDueDate),
        userId: userId
      });
      setNewTask('');
      setNewDueDate(getTodayDate());
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const toggleTask = async (id, isDone) => {
    try {
      const task = tasks.find(t => t.id === id);
      await api.put(`/tasks/${id}`, {
        title: task.title,
        isDone: !isDone
      });
      loadTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const startEdit = (id, title, dueDate) => {
    setEditingId(id);
    setEditTitle(title);
    setEditDueDate(toLocalDateInput(dueDate));
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;

    try {
      const task = tasks.find(t => t.id === id);
      await api.put(`/tasks/${id}`, {
        title: editTitle,
        isDone: task.isDone,
        dueDate: toApiDueDate(editDueDate)
      });
      setEditingId(null);
      setEditTitle('');
      setEditDueDate('');
      loadTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const toggleTaskSelection = (id) => {
    setSelectedTaskIds(prev => (
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    ));
  };

  const deleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) return;

    const taskLabel = selectedTaskIds.length === 1 ? 'task' : 'tasks';
    if (!window.confirm(`Delete ${selectedTaskIds.length} selected ${taskLabel}?`)) return;

    try {
      await Promise.all(selectedTaskIds.map(id => api.delete(`/tasks/${id}`)));
      setSelectedTaskIds([]);
      setEditingId(null);
      await loadTasks();
    } catch (err) {
      setError('Failed to delete selected tasks');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    navigate('/login');
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="tasks-header-main">
          <h1><span aria-hidden="true">📝</span> Task Manager</h1>
          <button
            type="button"
            className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(prev => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="account-menu"
            aria-label={isMenuOpen ? 'Close account menu' : 'Open account menu'}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div id="account-menu" className={`user-info ${isMenuOpen ? 'open' : ''}`}>
          <span>{email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="tasks-grid">
        <div className="tasks-card">
          <form onSubmit={createTask} className="create-task-form">
            <div className="task-form-grid">
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="task-input"
              />
              <label className="date-label">
                <span>Due date</span>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="task-input task-date-input"
                  aria-label="Due date"
                />
              </label>
            </div>
            <div className="task-action-row">
              <button type="submit" className="btn-primary">Add Task</button>
              <button
                type="button"
                className={`btn-toggle ${isEditMode ? 'active' : ''}`}
                onClick={() => {
                  setIsEditMode(prev => !prev);
                  if (editingId) setEditingId(null);
                  setSelectedTaskIds([]);
                }}
              >
                {isEditMode ? 'Done Editing' : 'Edit Tasks'}
              </button>
              {isEditMode && (
                <button
                  type="button"
                  className="btn-delete-selected"
                  onClick={deleteSelectedTasks}
                  disabled={selectedTaskIds.length === 0}
                >
                  Delete Selected{selectedTaskIds.length > 0 ? ` (${selectedTaskIds.length})` : ''}
                </button>
              )}
            </div>
          </form>

          <div className="task-toolbar">
            <label className="sort-control">
              <span>Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="dueDate">Due date</option>
                <option value="createdAt">Date added</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="error-banner">
              {error}
              <button onClick={() => setError('')}>✕</button>
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <p className="no-tasks">No tasks yet. Create one to get started!</p>
          )}

          <ul className="tasks-list">
            {sortedTasks.map(task => (
              <li key={task.id} className={`task-item ${task.isDone ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isEditMode ? selectedTaskIds.includes(task.id) : task.isDone}
                  onChange={() => isEditMode
                    ? toggleTaskSelection(task.id)
                    : toggleTask(task.id, task.isDone)}
                  className="task-checkbox"
                  aria-label={isEditMode ? `Select ${task.title} for deletion` : `Mark ${task.title} as complete`}
                />

                <div className="task-content">
                  {editingId === task.id ? (
                    <>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="task-edit-input"
                        autoFocus
                      />
                      <div className="task-meta-edit">
                        <label className="date-label inline-date-label">
                          <span>Due date</span>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="task-input task-date-input"
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="task-main-row">
                        <span className="task-title">{task.title}</span>
                      </div>
                      <div className="task-meta">
                        <span>Added: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—'}</span>
                        <span>Due date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="task-actions">
                  {isEditMode ? (
                    <button onClick={() => startEdit(task.id, task.title, task.dueDate)} className="btn-edit">Edit</button>
                  ) : null}

                  {editingId === task.id && (
                    <>
                      <button onClick={() => saveEdit(task.id)} className="btn-save">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-cancel">Cancel</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}