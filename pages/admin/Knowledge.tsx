
import React, { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { UploadCloud, File, Trash2 } from 'lucide-react';
import { KnowledgeDocument } from '../../types';
import toast from 'react-hot-toast';

const Knowledge: React.FC = () => {
  const { documents, addDocument } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      // In a real app, you'd upload the file and then add it.
      // Here, we simulate it.
      addDocument({ name: file.name, size: file.size });
      toast.success(`Document "${file.name}" added successfully.`);
    }
  }, [addDocument]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          handleFiles(e.target.files);
      }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
      <p className="text-gray-400">Upload and manage knowledge documents for Retrieval-Augmented Generation (RAG).</p>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-300 ${isDragging ? 'border-brand-primary bg-gray-800' : 'border-gray-600 hover:border-brand-primary'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
        <p className="mt-4 text-sm text-gray-400">
          <span className="font-semibold text-brand-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">PDF, TXT, DOCX (max. 10MB)</p>
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.txt,.docx"
        />
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold p-6">Uploaded Documents</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Size</th>
                <th className="p-4 font-semibold">Uploaded At</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-gray-500">No documents uploaded yet.</td>
                </tr>
              )}
              {documents.map((doc: KnowledgeDocument) => (
                <tr key={doc.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4 flex items-center"><File className="w-5 h-5 mr-3 text-brand-primary"/>{doc.name}</td>
                  <td className="p-4">{formatBytes(doc.size)}</td>
                  <td className="p-4">{doc.uploadedAt.toLocaleString()}</td>
                  <td className="p-4">
                    <button className="text-brand-danger hover:text-red-400 p-2 rounded-full">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Knowledge;
