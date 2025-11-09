
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SystemPrompt } from '../../types';
import toast from 'react-hot-toast';

const Prompts: React.FC = () => {
  const { prompts, addPrompt, setActivePrompt, activePrompt } = useAppContext();
  const [newPromptContent, setNewPromptContent] = useState('');

  const handleAddPrompt = () => {
    if (newPromptContent.trim()) {
      addPrompt({ content: newPromptContent });
      setNewPromptContent('');
      toast.success('New prompt version saved.');
    } else {
      toast.error('Prompt content cannot be empty.');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">System Prompts</h1>
      <p className="text-gray-400">Define and version System Prompts and guardrails for each use case.</p>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-xl font-semibold">Add New Prompt Version</h2>
        <textarea
          value={newPromptContent}
          onChange={(e) => setNewPromptContent(e.target.value)}
          placeholder="Enter the new system prompt here..."
          rows={6}
          className="w-full bg-gray-700 text-gray-200 p-3 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
        />
        <div className="text-right">
          <button
            onClick={handleAddPrompt}
            className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save New Version
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold p-6">Prompt History</h2>
        <div className="space-y-4 p-6">
          {prompts.slice().reverse().map((prompt: SystemPrompt) => (
            <div key={prompt.id} className={`p-4 rounded-lg ${prompt.isActive ? 'bg-gray-700 border border-brand-primary' : 'bg-gray-700/50'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">Version {prompt.version}</span>
                  <span className="text-sm text-gray-400">{prompt.createdAt.toLocaleString()}</span>
                </div>
                {prompt.isActive ? (
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Active</span>
                ) : (
                  <button
                    onClick={() => setActivePrompt(prompt.id)}
                    className="bg-gray-600 text-white text-xs font-semibold px-3 py-1 rounded-full hover:bg-brand-primary transition-colors"
                  >
                    Set Active
                  </button>
                )}
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{prompt.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Prompts;
