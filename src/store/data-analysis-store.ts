import { create } from 'zustand';
import type { DataFile, ChatMessage, AnalysisResult } from '@/components/data-analysis/types';

interface DataAnalysisStore {
  files: DataFile[];
  selectedFileIds: string[];
  chatMessages: ChatMessage[];
  analysisResults: AnalysisResult[];
  isAnalyzing: boolean;

  addFile: (file: DataFile) => void;
  updateFile: (id: string, updates: Partial<DataFile>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  
  toggleFileSelection: (id: string) => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;
  
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearChatMessages: () => void;
  
  addAnalysisResult: (result: AnalysisResult) => void;
  clearAnalysisResults: () => void;
  
  setIsAnalyzing: (value: boolean) => void;
}

export const useDataAnalysisStore = create<DataAnalysisStore>((set, get) => ({
  files: [],
  selectedFileIds: [],
  chatMessages: [],
  analysisResults: [],
  isAnalyzing: false,

  addFile: (file) => set((state) => ({ 
    files: [...state.files, file],
    selectedFileIds: [...state.selectedFileIds, file.id]
  })),

  updateFile: (id, updates) => set((state) => ({
    files: state.files.map((f) => (f.id === id ? { ...f, ...updates } : f)),
  })),

  removeFile: (id) => set((state) => ({
    files: state.files.filter((f) => f.id !== id),
    selectedFileIds: state.selectedFileIds.filter((fid) => fid !== id),
  })),

  clearFiles: () => set({ files: [], selectedFileIds: [] }),

  toggleFileSelection: (id) => set((state) => ({
    selectedFileIds: state.selectedFileIds.includes(id)
      ? state.selectedFileIds.filter((fid) => fid !== id)
      : [...state.selectedFileIds, id],
  })),

  selectAllFiles: () => set((state) => ({
    selectedFileIds: state.files.map((f) => f.id),
  })),

  deselectAllFiles: () => set({ selectedFileIds: [] }),

  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message],
  })),

  updateChatMessage: (id, updates) => set((state) => ({
    chatMessages: state.chatMessages.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    ),
  })),

  clearChatMessages: () => set({ chatMessages: [] }),

  addAnalysisResult: (result) => set((state) => ({
    analysisResults: [...state.analysisResults, result],
  })),

  clearAnalysisResults: () => set({ analysisResults: [] }),

  setIsAnalyzing: (value) => set({ isAnalyzing: value }),
}));
