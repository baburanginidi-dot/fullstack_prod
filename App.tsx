
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Knowledge from './pages/admin/Knowledge';
import Prompts from './pages/admin/Prompts';
import Settings from './pages/admin/Settings';
import Login from './pages/voice/Login';
import Agent from './pages/voice/Agent';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: '',
          style: {
            background: '#2C2C2C',
            color: '#EAEAEA',
          },
        }}
      />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="prompts" element={<Prompts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
