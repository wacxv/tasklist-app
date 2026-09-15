import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './tasks.css';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const navigate = useNavigate();

  const userId = parseInt(localStorage.getItem('userId'));
  const email = localStorage.getItem('email');

  useEffect(() => {
    loadTasks();
  }, []);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }

    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
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
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        userId: userId
      });
      setNewTask('');
      setNewDueDate('');
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
    setEditDueDate(dueDate ? new Date(dueDate).toISOString().slice(0, 10) : '');
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;

    try {
      const task = tasks.find(t => t.id === id);
      await api.put(`/tasks/${id}`, {
        title: editTitle,
        isDone: task.isDone,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null
      });
      setEditingId(null);
      setEditTitle('');
      setEditDueDate('');
      loadTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await api.delete(`/tasks/${id}`);
      loadTasks();
    } catch (err) {
      setError('Failed to delete task');
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
        <h1>📝 Task Manager</h1>
        <div className="user-info">
          <span>{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
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
                }}
              >
                {isEditMode ? 'Done Editing' : 'Edit Tasks'}
              </button>
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
                  checked={task.isDone}
                  onChange={() => toggleTask(task.id, task.isDone)}
                  className="task-checkbox"
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
                    <>
                      <button onClick={() => startEdit(task.id, task.title, task.dueDate)} className="btn-edit">Edit</button>
                      <button onClick={() => deleteTask(task.id)} className="btn-delete">Delete</button>
                    </>
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