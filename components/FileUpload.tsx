import React, { useCallback, useState } from 'react';
import { ParsingStatus } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  status: ParsingStatus;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, status }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        alert("請上傳 PDF 格式的檔案");
      }
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const isLoading = status === ParsingStatus.PARSING;

  return (
    <div 
      className={`relative w-full max-w-2xl mx-auto mt-8 p-12 border-2 border-dashed rounded-xl text-center transition-all duration-300 ease-in-out
        ${dragActive ? 'border-primary bg-blue-50' : 'border-gray-300 bg-white'}
        ${isLoading ? 'opacity-70 pointer-events-none' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="application/pdf"
        onChange={handleChange}
        disabled={isLoading}
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-gray-600">正在 AI 解析題目中，這可能需要幾秒鐘...</p>
        </div>
      ) : (
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <span className="text-xl font-semibold text-gray-700">點擊上傳 PDF 或拖曳檔案至此</span>
          <p className="mt-2 text-sm text-gray-500">支援 PDF 格式，AI 將自動辨識其中的程式題目</p>
        </label>
      )}
    </div>
  );
};

export default FileUpload;