import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart2, FileText, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';


const AdminLayout: React.FC = () => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
        navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: BarChart2 },
    { name: 'Knowledge', path: '/admin/knowledge', icon: FileText },
    { name: 'Prompts', path: '/admin/prompts', icon: MessageSquare },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const NavItem: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive ? 'bg-brand-primary text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span>{item.name}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <aside className="w-64 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-2">
            <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <h1 className="text-xl font-bold ml-2">Voice Agent</h1>
          </div>
           <p className="text-sm text-gray-400 px-2 mb-6">Welcome, {user?.fullName}</p>
          <nav className="space-y-2">
            {navItems.map(item => <NavItem key={item.path} item={item} />)}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-200 hover:bg-gray-700 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;