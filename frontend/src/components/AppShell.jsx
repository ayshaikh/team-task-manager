import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import RightPanel from './RightPanel';
import Toast from './Toast';
import '../styles/AppShell.css';

export default function AppShell({ children }) {
  const { projectId } = useParams();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-content">
          {children}
        </div>
      </div>
      {projectId && <RightPanel />}
      <Toast />
    </div>
  );
}
