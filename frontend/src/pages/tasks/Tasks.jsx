import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './tasks.css';

const PRIORITY_OPTIONS = ['High', 'Standard', 'Low'];
const RECURRENCE_OPTIONS = ['None', 'Daily', 'Weekly', 'Monthly', 'Occasional', 'Additional'];

const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const getDueDateStatus = (value) => {
  if (!value) return 'none';

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 3) return 'soon';
  return 'upcoming';
};

const normalizeTask = (task = {}) => ({
  ...task,
  description: task.description ?? '',
  priority: task.priority ?? 'Standard',
  recurrence: task.recurrence ?? 'None',
  lastResetAt: task.lastResetAt ?? null,
  isDone: Boolean(task.isDone),
  dueDate: task.dueDate ?? null,
});

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newPriority, setNewPriority] = useState('Standard');
  const [newRecurrence, setNewRecurrence] = useState('None');
  const [newDueDate, setNewDueDate] = useState(getTodayDate);
  const [sortBy, setSortBy] = useState('dueDate');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [recurrenceFilter, setRecurrenceFilter] = useState('All');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Standard');
  const [editRecurrence, setEditRecurrence] = useState('None');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [cropImage, setCropImage] = useState('');
  const [cropScale, setCropScale] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const navigate = useNavigate();
  const userId = Number(localStorage.getItem('userId') ?? 0);
  const email = localStorage.getItem('email') ?? '';
  const username = localStorage.getItem('username') ?? '';
  const profileName = username || email.split('@')[0] || 'User';
  const profileInitial = profileName.charAt(0).toUpperCase();

  const closePasswordForm = () => {
    setIsPasswordOpen(false);
    setPasswordMessage('');
    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const cancelProfileCrop = () => {
    setCropImage('');
    setCropScale(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setIsCropOpen(false);
  };

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!userId) return;

      try {
        const response = await api.get(`/users/${userId}/profile-picture`, { responseType: 'blob' });
        setProfilePictureUrl(URL.createObjectURL(response.data));
      } catch {
        setProfilePictureUrl('');
      }
    };

    loadProfilePicture();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const trigger = document.querySelector('.profile-trigger');
      const menu = document.querySelector('.profile-menu');
      const toggle = document.querySelector('.menu-toggle');
      const clickedInsideMenu = menu && menu.contains(event.target);
      const clickedInsideTrigger = trigger && trigger.contains(event.target);
      const clickedInsideToggle = toggle && toggle.contains(event.target);

      if (!clickedInsideMenu && !clickedInsideTrigger && !clickedInsideToggle && (isProfileOpen || isMenuOpen)) {
        setIsProfileOpen(false);
        setIsMenuOpen(false);
        if (isPasswordOpen && !isCropOpen) closePasswordForm();
      }
    };

    const handleEsc = (event) => {
      if (event.key !== 'Escape') return;

      if (isCropOpen) {
        cancelProfileCrop();
        return;
      }

      if (isPasswordOpen) {
        closePasswordForm();
        return;
      }

      if (isProfileOpen || isMenuOpen) {
        setIsProfileOpen(false);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isProfileOpen, isMenuOpen, isPasswordOpen, isCropOpen]);

  const toLocalDateInput = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  };

  const toApiDueDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(`${dateString}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const loadTasks = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/tasks');
      setTasks(Array.isArray(res.data) ? res.data.map(normalizeTask) : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isDone !== b.isDone) {
      return Number(a.isDone) - Number(b.isDone);
    }

    if (sortBy === 'createdAt') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }

    const aDue = a.dueDate ? new Date(a.dueDate).setHours(0, 0, 0, 0) : Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate ? new Date(b.dueDate).setHours(0, 0, 0, 0) : Number.MAX_SAFE_INTEGER;
    if (aDue !== bDue) return aDue - bDue;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const filteredTasks = sortedTasks.filter((task) => {
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    const matchesRecurrence = recurrenceFilter === 'All' || (task.recurrence || 'None') === recurrenceFilter;
    return matchesPriority && matchesRecurrence;
  });

  const totalCompleted = tasks.filter((task) => task.isDone).length;

  const createTask = async (event) => {
    event.preventDefault();
    if (!newTask.trim()) return;

    try {
      await api.post('/tasks', {
        title: newTask,
        description: newTaskDescription,
        priority: newPriority,
        recurrence: newRecurrence,
        lastResetAt: newRecurrence === 'None' ? null : new Date().toISOString(),
        isDone: false,
        dueDate: toApiDueDate(newDueDate),
        userId,
      });

      setNewTask('');
      setNewTaskDescription('');
      setNewPriority('Standard');
      setNewRecurrence('None');
      setNewDueDate(getTodayDate());
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const toggleTask = async (id, isDone) => {
    try {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;

      await api.put(`/tasks/${id}`, {
        title: task.title,
        description: task.description ?? '',
        priority: task.priority ?? 'Standard',
        recurrence: task.recurrence ?? 'None',
        lastResetAt: task.lastResetAt ?? null,
        isDone: !isDone,
        dueDate: task.dueDate,
      });
      await loadTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(toLocalDateInput(task.dueDate));
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'Standard');
    setEditRecurrence(task.recurrence || 'None');
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;

    try {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;

      await api.put(`/tasks/${id}`, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        recurrence: editRecurrence,
        lastResetAt: editRecurrence === 'None' ? null : (task.lastResetAt ?? new Date().toISOString()),
        isDone: task.isDone,
        dueDate: toApiDueDate(editDueDate),
      });

      setEditingId(null);
      setEditTitle('');
      setEditDueDate('');
      setEditDescription('');
      setEditPriority('Standard');
      setEditRecurrence('None');
      await loadTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const toggleTaskSelection = (id) => {
    setSelectedTaskIds((prev) => (
      prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id]
    ));
  };

  const allTasksSelected = tasks.length > 0 && tasks.every((task) => selectedTaskIds.includes(task.id));

  const toggleAllTaskSelection = () => {
    setSelectedTaskIds(allTasksSelected ? [] : tasks.map((task) => task.id));
  };

  const deleteSelectedTasks = async () => {
    if (selectedTaskIds.length === 0) return;

    const taskLabel = selectedTaskIds.length === 1 ? 'task' : 'tasks';
    if (!window.confirm(`Delete ${selectedTaskIds.length} selected ${taskLabel}?`)) return;

    try {
      await Promise.all(selectedTaskIds.map((id) => api.delete(`/tasks/${id}`)));
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
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.put(`/users/${userId}/password`, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordMessage('Password changed successfully.');
      setTimeout(() => closePasswordForm(), 600);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openCropEditor = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(String(reader.result || ''));
      setCropScale(1);
      setCropOffsetX(0);
      setCropOffsetY(0);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPicture(true);
    setPasswordError('');
    openCropEditor(file);
    event.target.value = '';
    setIsUploadingPicture(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) openCropEditor(file);
  };

  const applyCroppedProfile = async () => {
    if (!cropImage) return;

    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const size = 256;
      const cropSize = Math.min(image.width, image.height);
      const offsetX = (image.width - cropSize) / 2 + cropOffsetX / cropScale;
      const offsetY = (image.height - cropSize) / 2 + cropOffsetY / cropScale;

      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (!context) {
        cancelProfileCrop();
        return;
      }

      context.clearRect(0, 0, size, size);
      context.drawImage(image, offsetX, offsetY, cropSize, cropSize, 0, 0, size, size);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('image', blob, 'profile-picture.jpg');

        try {
          await api.put(`/users/${userId}/profile-picture`, formData);
          const response = await api.get(`/users/${userId}/profile-picture`, { responseType: 'blob' });
          setProfilePictureUrl(URL.createObjectURL(response.data));
          setPasswordError('');
        } catch (err) {
          setPasswordError(err.response?.data?.message || 'Could not update profile picture.');
        }
      }, 'image/jpeg', 0.92);

      cancelProfileCrop();
    };
    image.src = cropImage;
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="tasks-header-main">
          <h1>
            <span aria-hidden="true">📝</span> Task Manager
          </h1>
          <button
            type="button"
            className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
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
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-label="Open user settings"
          >
            <span>{email}</span>
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt="" className="profile-avatar profile-avatar-image" />
            ) : (
              <span className="profile-avatar" aria-hidden="true">{profileInitial}</span>
            )}
          </button>

          {isProfileOpen && (
            <div className="profile-menu" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <strong className="profile-menu-title">Settings</strong>

              {isCropOpen ? (
                <div className="crop-panel">
                  <div className="crop-panel-header">
                    <strong>Crop profile picture</strong>
                  </div>
                  <div className="crop-stage">
                    <img
                      src={cropImage}
                      alt="Crop preview"
                      className="crop-preview-image"
                      style={{ transform: `scale(${cropScale}) translate(${cropOffsetX}px, ${cropOffsetY}px)` }}
                    />
                  </div>
                  <div className="crop-controls">
                    <label>
                      Zoom
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.05"
                        value={cropScale}
                        onChange={(event) => setCropScale(Number(event.target.value))}
                      />
                    </label>
                    <div className="crop-position-row">
                      <button type="button" onClick={() => setCropOffsetX((prev) => prev - 10)}>◀</button>
                      <button type="button" onClick={() => setCropOffsetX((prev) => prev + 10)}>▶</button>
                      <button type="button" onClick={() => setCropOffsetY((prev) => prev - 10)}>▲</button>
                      <button type="button" onClick={() => setCropOffsetY((prev) => prev + 10)}>▼</button>
                    </div>
                  </div>
                  <div className="crop-actions">
                    <button type="button" className="btn-cancel" onClick={cancelProfileCrop}>Cancel</button>
                    <button type="button" className="btn-save" onClick={applyCroppedProfile}>Confirm</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="profile-identity">
                    <label className="profile-picture-picker" aria-label="Change profile picture">
                      {profilePictureUrl ? (
                        <img src={profilePictureUrl} alt="Current profile" className="profile-avatar profile-avatar-large" />
                      ) : (
                        <span className="profile-avatar profile-avatar-large" aria-hidden="true">{profileInitial}</span>
                      )}
                      <input type="file" accept="image/*" onChange={handleProfilePictureChange} disabled={isUploadingPicture} />
                    </label>
                    <div className="profile-identity-details">
                      <strong>{username || 'Username not set'}</strong>
                      <span>{email}</span>
                    </div>
                  </div>

                  <div className="profile-upload-hint">
                    <span>Drag &amp; drop a photo here or click the avatar to choose a file.</span>
                  </div>

                  {isPasswordOpen ? (
                    <form onSubmit={handleChangePassword} className="password-form">
                      <label>
                        Current password
                        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                      </label>
                      <label>
                        New password
                        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                      </label>
                      <label>
                        Confirm new password
                        <input type="password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
                      </label>
                      {passwordError && <span className="password-status error">{passwordError}</span>}
                      {passwordMessage && <span className="password-status success">{passwordMessage}</span>}
                      <div className="password-form-actions">
                        <button type="button" className="btn-cancel-password" onClick={closePasswordForm}>Cancel</button>
                        <button type="submit" className="btn-save-password" disabled={isSavingPassword}>
                          {isSavingPassword ? 'Saving...' : 'Save password'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" className="btn-change-password" onClick={() => setIsPasswordOpen(true)}>
                      Change password
                    </button>
                  )}

                  {!isPasswordOpen && passwordError && <span className="password-status error">{passwordError}</span>}
                  <button type="button" onClick={handleLogout} className="logout-btn">Logout</button>
                </>
              )}
            </div>
          )}
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
                onChange={(event) => setNewTask(event.target.value)}
                className="task-input"
              />
              <label className="date-label">
                <span>Due date</span>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(event) => setNewDueDate(event.target.value)}
                  className="task-input task-date-input"
                  aria-label="Due date"
                />
              </label>
            </div>

            <div className="task-form-grid task-form-meta-grid">
              <label className="date-label">
                <span>Priority</span>
                <select value={newPriority} onChange={(event) => setNewPriority(event.target.value)} className="task-input task-select-input">
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="date-label">
                <span>Recurrence</span>
                <select value={newRecurrence} onChange={(event) => setNewRecurrence(event.target.value)} className="task-input task-select-input">
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="date-label task-description-label">
              <span>Description</span>
              <textarea
                value={newTaskDescription}
                onChange={(event) => setNewTaskDescription(event.target.value)}
                className="task-input task-textarea"
                rows={3}
                placeholder="Add any notes or details..."
              />
            </label>

            <div className="task-action-row">
              <button type="submit" className="btn-primary">Add Task</button>
              <button
                type="button"
                className={`btn-toggle ${isEditMode ? 'active' : ''}`}
                onClick={() => {
                  setIsEditMode((prev) => !prev);
                  if (editingId) setEditingId(null);
                  setSelectedTaskIds([]);
                }}
              >
                {isEditMode ? 'Done Editing' : 'Edit Tasks'}
              </button>
            </div>
          </form>

          <div className="task-toolbar">
            {isEditMode && (
              <div className="task-selection-controls">
                <label className="select-all-control">
                  <input
                    type="checkbox"
                    checked={allTasksSelected}
                    onChange={toggleAllTaskSelection}
                    disabled={tasks.length === 0}
                    className="task-checkbox"
                  />
                  <span>Select all</span>
                </label>
                <button
                  type="button"
                  className="btn-delete-selected"
                  onClick={deleteSelectedTasks}
                  disabled={selectedTaskIds.length === 0}
                >
                  Delete Selected{selectedTaskIds.length > 0 ? ` (${selectedTaskIds.length})` : ''}
                </button>
              </div>
            )}

            <div className="task-toolbar-side">
              <div className="completed-stat">
                <span className="completed-stat-label">Completed</span>
                <strong>{totalCompleted}</strong>
              </div>

              <label className="sort-control">
                <span>Sort by:</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="dueDate">Due date</option>
                  <option value="createdAt">Date added</option>
                </select>
              </label>
            </div>
          </div>

          <div className="task-filters">
            <label className="filter-control">
              <span>Priority</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="All">All</option>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="filter-control">
              <span>Recurrence</span>
              <select value={recurrenceFilter} onChange={(event) => setRecurrenceFilter(event.target.value)}>
                <option value="All">All</option>
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="error-banner">
              {error}
              <button type="button" onClick={() => setError('')}>✕</button>
            </div>
          )}

          {!loading && filteredTasks.length === 0 && <p className="no-tasks">No tasks match the current filters.</p>}

          <ul className="tasks-list">
            {filteredTasks.map((task) => (
              <li key={task.id} className={`task-item ${task.isDone ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isEditMode ? selectedTaskIds.includes(task.id) : task.isDone}
                  onChange={() => (isEditMode ? toggleTaskSelection(task.id) : toggleTask(task.id, task.isDone))}
                  className="task-checkbox"
                  aria-label={isEditMode ? `Select ${task.title} for deletion` : `Mark ${task.title} as complete`}
                />

                <div className="task-content">
                  {editingId === task.id ? (
                    <>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="task-edit-input"
                        autoFocus
                      />

                      <div className="task-meta-edit">
                        <label className="date-label inline-date-label">
                          <span>Due date</span>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(event) => setEditDueDate(event.target.value)}
                            className="task-input task-date-input"
                          />
                        </label>

                        <label className="date-label inline-date-label">
                          <span>Priority</span>
                          <select
                            value={editPriority}
                            onChange={(event) => setEditPriority(event.target.value)}
                            className="task-input task-select-input"
                          >
                            {PRIORITY_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>

                        <label className="date-label inline-date-label">
                          <span>Recurrence</span>
                          <select
                            value={editRecurrence}
                            onChange={(event) => setEditRecurrence(event.target.value)}
                            className="task-input task-select-input"
                          >
                            {RECURRENCE_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="date-label task-description-label">
                        <span>Description</span>
                        <textarea
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                          className="task-input task-textarea"
                          rows={3}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="task-main-row">
                        <span className="task-title">{task.title}</span>
                        {task.priority && (
                          <span className={`task-priority priority-${String(task.priority).toLowerCase()}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>

                      {task.description && <p className="task-description">{task.description}</p>}

                      <div className="task-meta">
                        <span>Added: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—'}</span>
                        <span className={`task-meta-due due-${getDueDateStatus(task.dueDate)}`}>
                          Due date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                        {task.recurrence && task.recurrence !== 'None' && <span>Recurrence: {task.recurrence}</span>}
                        {task.recurrence && task.recurrence !== 'None' && (
                          <span>Last reset: {task.lastResetAt ? new Date(task.lastResetAt).toLocaleString() : 'Not set'}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="task-actions">
                  {isEditMode ? <button onClick={() => startEdit(task)} className="btn-edit">Edit</button> : null}

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
