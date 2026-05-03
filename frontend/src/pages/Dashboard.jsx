import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (projectId) {
          // Project specific stats
          const response = await api.get(`/projects/${projectId}/stats`);
          setStats(response.data);
        } else {
          // Global personal stats
          const [tasksRes, projectsRes] = await Promise.all([
            api.get('/tasks/my-tasks'),
            api.get('/projects')
          ]);
          
          const tasks = tasksRes.data;
          setProjects(projectsRes.data);
          
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
          const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
          const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
          const overdueTasks = tasks.filter((t) => {
            if (!t.due_date) return false;
            return new Date(t.due_date) < new Date() && t.status !== 'COMPLETED';
          }).length;

          setStats({
            total: totalTasks,
            completed: completedTasks,
            inProgress: inProgressTasks,
            todo: todoTasks,
            overdue: overdueTasks,
            tasks,
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  return (
    <div className="dashboard-view">
      {loading ? (
        <div className="dashboard-loading">Loading your workspace...</div>
      ) : stats ? (
        <>
          <div className="dashboard-greeting">
            <h1>{projectId ? 'Project Overview' : `Welcome back, ${user?.username}`}</h1>
            <p>{projectId ? 'Performance and task metrics for this project' : "Here's an overview of your productivity across all projects"}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">My total tasks</div>
            </div>
            <div className="stat-card stat-card--todo">
              <div className="stat-value">{stats.todo}</div>
              <div className="stat-label">To do</div>
            </div>
            <div className="stat-card stat-card--progress">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In progress</div>
            </div>
            <div className="stat-card stat-card--done">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          {!projectId && projects.length > 0 && (
            <>
              {projects.filter(p => p.status !== 'COMPLETED').length > 0 && (
                <div className="dashboard-projects-summary">
                  <h2>Your Active Projects</h2>
                  <div className="project-summary-grid">
                    {projects.filter(p => p.status !== 'COMPLETED').map(p => (
                      <div key={p.id} className="project-summary-card" onClick={() => navigate(`/projects/${p.id}/dashboard`)}>
                        <div className="ps-top">
                          <span className="ps-name">{p.name}</span>
                          <span className="ps-status">{p.status}</span>
                        </div>
                        <div className="ps-meta">
                          Created {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {projects.filter(p => p.status === 'COMPLETED').length > 0 && (
                <div className="dashboard-projects-summary" style={{ marginTop: '24px' }}>
                  <h2 style={{ opacity: 0.7 }}>Completed Projects</h2>
                  <div className="project-summary-grid">
                    {projects.filter(p => p.status === 'COMPLETED').map(p => (
                      <div key={p.id} className="project-summary-card project-summary-card--completed" onClick={() => navigate(`/projects/${p.id}/dashboard`)}>
                        <div className="ps-top">
                          <span className="ps-name" style={{ opacity: 0.6 }}>{p.name}</span>
                          <span className="ps-status" style={{ background: 'var(--surface)', color: 'var(--text-tertiary)' }}>{p.status}</span>
                        </div>
                        <div className="ps-meta">
                          Finished {new Date(p.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="dashboard-tasks">
            <h2>{projectId ? 'Project Tasks' : 'Priority Tasks'}</h2>
            {stats.tasks.length === 0 ? (
              <p className="empty-state">No tasks assigned to you yet. Head to a project board to get started.</p>
            ) : (
              <div className="task-grid">
                {stats.tasks.slice(0, 6).map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';
                  const project = projects.find(p => p.id === task.project_id);
                  
                  return (
                    <div key={task.id} className={`dash-task-card ${isOverdue ? 'dash-task-card--overdue' : ''}`}>
                      <div className="dash-task-top">
                        <div className="dash-task-title-group">
                          {!projectId && project && (
                            <span className="dash-task-project-label">{project.name}</span>
                          )}
                          <span className="dash-task-title">{task.title}</span>
                        </div>
                        <span className={`dash-task-priority priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="dash-task-desc">{task.description}</p>
                      )}
                      <div className="dash-task-bottom">
                        <span className={`dash-task-status status-${task.status.toLowerCase()}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.due_date && (
                          <span className={`dash-task-due ${isOverdue ? 'due-overdue' : ''}`}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!projectId && stats.tasks.length > 6 && (
              <button className="view-all-tasks-btn" onClick={() => navigate('/tasks')}>
                View all my tasks
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="dashboard-loading">Failed to load dashboard</div>
      )}
    </div>
  );
};

export default Dashboard;
