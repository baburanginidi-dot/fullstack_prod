
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { VoiceAgentSettings } from '../../types';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useAppContext();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    updateSettings({ [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // In a real app, this would be an API call.
    toast.success('Settings saved successfully!');
  };

  const voices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Agent Settings</h1>
      <p className="text-gray-400">Configure voice, language, and fallback behaviors for the voice agent.</p>

      <div className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-6">
        <div>
          <label htmlFor="voice" className="block text-sm font-medium text-gray-300 mb-2">Agent Voice</label>
          <select
            id="voice"
            name="voice"
            value={settings.voice}
            onChange={handleChange}
            className="w-full bg-gray-700 text-gray-200 p-3 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
          >
            {voices.map(voice => <option key={voice} value={voice}>{voice}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">Language</label>
          <input
            type="text"
            id="language"
            name="language"
            value={settings.language}
            onChange={handleChange}
            disabled
            className="w-full bg-gray-700 text-gray-400 p-3 rounded-md cursor-not-allowed"
          />
           <p className="text-xs text-gray-500 mt-1">Currently locked to en-US.</p>
        </div>

        <div>
          <label htmlFor="fallbackMessage" className="block text-sm font-medium text-gray-300 mb-2">Fallback Message</label>
          <textarea
            id="fallbackMessage"
            name="fallbackMessage"
            value={settings.fallbackMessage}
            onChange={handleChange}
            rows={4}
            className="w-full bg-gray-700 text-gray-200 p-3 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">This message is played when the agent doesn't understand the user.</p>
        </div>
        
        <div className="text-right pt-4">
            <button
                onClick={handleSave}
                className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors"
            >
                Save Settings
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
