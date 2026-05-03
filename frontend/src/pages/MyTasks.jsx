import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import '../styles/Dashboard.css';

export default function MyTasks() {
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tasks
        const tasksRes = await api.get('/tasks/my-tasks');
        let myTasks = tasksRes.data;
        
        if (projectId) {
          // Filter by project if in project context
          myTasks = myTasks.filter(t => t.project_id === projectId);
          
          // Also get project name
          const projectRes = await api.get(`/projects/${projectId}`);
          setProjectName(projectRes.data.name);
        }
        
        // Sort tasks: Priority (High > Medium > Low) then Due Date (Soonest first)
        const priorityMap = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
        myTasks.sort((a, b) => {
          // First sort by priority
          if (priorityMap[a.priority] !== priorityMap[b.priority]) {
            return priorityMap[a.priority] - priorityMap[b.priority];
          }
          // Then by due date (tasks with no due date go last)
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });
        
        setTasks(myTasks);
      } catch (err) {
        console.error('Failed to fetch my tasks', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  return (
    <div className="dashboard-view">
      <div className="dashboard-greeting">
        <h1>My Tasks {projectName ? `in ${projectName}` : ''}</h1>
        <p>Focus on what matters today</p>
      </div>

      <div className="dashboard-tasks" style={{ marginTop: '24px' }}>
        {loading ? (
          <p className="empty-state">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">No tasks assigned to you here. Check the board to find new work!</p>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';
              return (
                <div key={task.id} className={`dash-task-card ${isOverdue ? 'dash-task-card--overdue' : ''}`}>
                  <div className="dash-task-top">
                    <span className="dash-task-title">{task.title}</span>
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
      </div>
    </div>
  );
}
