/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Topic, Group } from './types';
import { cn } from './lib/utils';
import { 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Upload, 
  Loader2,
  Check,
  Clock,
  AlertTriangle,
  User as UserIcon,
  Github,
  Twitter,
  ExternalLink,
  Calendar,
  FolderPlus,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays, addDays, isSameDay, startOfDay } from 'date-fns';

// --- Components ---

const Button = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}) => {
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm',
    secondary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm',
    outline: 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    danger: 'text-red-600 hover:bg-red-50 hover:text-red-700',
    ghost: 'text-zinc-500 hover:bg-zinc-100'
  };
  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2'
  };
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )} 
      {...props} 
    />
  );
};

const Checkbox = ({ checked, onChange, disabled }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) => (
  <button 
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all",
      checked ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200" : "border-zinc-200 bg-white hover:border-zinc-300",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {checked && <Check className="w-5 h-5 stroke-[3]" />}
  </button>
);

const ConfirmationModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Yes, proceed",
  cancelText = "Cancel",
  variant = "danger"
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary"
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 p-8 overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              variant === "danger" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-900"
            )}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black tracking-tight">{title}</h3>
          </div>
          <p className="text-zinc-500 leading-relaxed mb-8">{message}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={onCancel}>{cancelText}</Button>
            <Button variant={variant === "danger" ? "danger" : "primary"} className={cn("flex-1 h-12", variant === "danger" && "bg-red-600 text-white hover:bg-red-700")} onClick={onConfirm}>{confirmText}</Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // UI States
  const [isGroupAddOpen, setIsGroupAddOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isTopicAddOpen, setIsTopicAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [bulkText, setBulkText] = useState('');
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "danger" | "primary";
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const tomorrow = addDays(startOfDay(now), 1);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load data from localStorage
    const savedTopics = localStorage.getItem('blogflow_topics');
    const savedGroups = localStorage.getItem('blogflow_groups');
    
    if (savedTopics) {
      try {
        setTopics(JSON.parse(savedTopics));
      } catch (e) {
        console.error("Failed to parse topics", e);
      }
    }
    
    if (savedGroups) {
      try {
        const parsedGroups = JSON.parse(savedGroups);
        setGroups(parsedGroups);
        if (parsedGroups.length > 0) {
          setActiveGroupId(parsedGroups[0].id);
        }
      } catch (e) {
        console.error("Failed to parse groups", e);
      }
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    // Save data to localStorage whenever they change
    if (!loading) {
      localStorage.setItem('blogflow_topics', JSON.stringify(topics));
      localStorage.setItem('blogflow_groups', JSON.stringify(groups));
    }
  }, [topics, groups, loading]);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: newGroupName.trim(),
      createdAt: new Date().toISOString()
    };
    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setIsGroupAddOpen(false);
    setActiveGroupId(newGroup.id);
  };

  const deleteGroup = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Group",
      message: "Are you sure? This will delete all topics in this group. This action cannot be undone.",
      variant: "danger",
      onConfirm: () => {
        setGroups(prev => prev.filter(g => g.id !== id));
        setTopics(prev => prev.filter(t => t.groupId !== id));
        if (activeGroupId === id) {
          setActiveGroupId(null);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddTopic = () => {
    if (!newTopicTitle.trim() || !activeGroupId) return;
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      groupId: activeGroupId,
      userId: 'local-user',
      title: newTopicTitle.trim(),
      status: 'draft',
      progress: 0,
      stages: {
        writing: { completed: false },
        image: { completed: false },
        posting: { completed: false }
      },
      order: topics.filter(t => t.groupId === activeGroupId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTopics([...topics, newTopic]);
    setNewTopicTitle('');
    setIsTopicAddOpen(false);
  };

  const handleBulkUpload = () => {
    if (!bulkText.trim() || !activeGroupId) return;
    const titles = bulkText.split('\n').filter(l => l.trim());
    const existingCount = topics.filter(t => t.groupId === activeGroupId).length;
    
    const newTopics: Topic[] = titles.map((title, index) => ({
      id: crypto.randomUUID(),
      groupId: activeGroupId,
      userId: 'local-user',
      title: title.trim(),
      status: 'draft',
      progress: 0,
      stages: {
        writing: { completed: false },
        image: { completed: false },
        posting: { completed: false }
      },
      order: existingCount + index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setTopics([...topics, ...newTopics]);
    setBulkText('');
    setIsBulkOpen(false);
  };

  const toggleStage = (topic: Topic, stageKey: keyof Topic['stages']) => {
    const isCurrentlyCompleted = topic.stages[stageKey].completed;
    
    if (isCurrentlyCompleted) {
      setConfirmModal({
        isOpen: true,
        title: "Unmark Task",
        message: "do you want to unmark",
        variant: "primary",
        onConfirm: () => {
          performToggle(topic, stageKey);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    performToggle(topic, stageKey);
  };

  const performToggle = (topic: Topic, stageKey: keyof Topic['stages']) => {
    const newTopics: Topic[] = topics.map(t => {
      if (t.id !== topic.id) return t;
      
      const isCompleting = !t.stages[stageKey].completed;
      const newStages = { 
        ...t.stages, 
        [stageKey]: { ...t.stages[stageKey], completed: isCompleting } 
      };
      
      let progress = 0;
      if (newStages.writing.completed) progress++;
      if (newStages.image.completed) progress++;
      if (newStages.posting.completed) progress++;

      const status: Topic['status'] = progress === 3 ? 'published' : 'draft';

      return {
        ...t,
        stages: newStages,
        progress,
        status,
        updatedAt: new Date().toISOString(),
        lastCompletedAt: isCompleting ? new Date().toISOString() : t.lastCompletedAt
      };
    });
    setTopics(newTopics);
  };

  const deleteTopic = (id: string) => {
    setTopics(topics.filter(t => t.id !== id));
  };

  const getTopicSchedule = (createdAt: string) => {
    const start = startOfDay(new Date(createdAt));
    const day1 = start;
    const day2 = addDays(start, 1);
    const day3 = addDays(start, 2);
    const today = startOfDay(new Date());
    
    const diff = differenceInDays(today, start);
    
    return {
      day1, day2, day3, today, diff,
      currentStage: diff === 0 ? 'writing' : diff === 1 ? 'image' : diff === 2 ? 'posting' : 'overdue'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">BlogFlow</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-zinc-900" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 leading-none">Completed Today</p>
              <p className="text-sm font-bold text-zinc-900 tabular-nums leading-tight">
                {topics.filter(t => t.lastCompletedAt && isSameDay(new Date(t.lastCompletedAt), new Date())).length} Tasks
              </p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold">{format(currentTime, 'EEEE, MMM do')}</p>
            <p className="text-xs text-zinc-400">{format(currentTime, 'h:mm a')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Groups */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Your Groups</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsGroupAddOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <AnimatePresence>
              {isGroupAddOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-3 overflow-hidden"
                >
                  <input 
                    type="text" 
                    placeholder="Group name..." 
                    className="w-full h-10 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={handleAddGroup}>Create</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsGroupAddOpen(false)}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {groups.map(group => (
                <div 
                  key={group.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer",
                    activeGroupId === group.id ? "bg-zinc-900 text-white shadow-md" : "hover:bg-zinc-100 text-zinc-600"
                  )}
                  onClick={() => setActiveGroupId(group.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activeGroupId === group.id ? "bg-orange-500" : "bg-zinc-300"
                    )} />
                    <span className="font-bold text-sm truncate max-w-[140px]">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                      activeGroupId === group.id ? "bg-white/20" : "bg-zinc-200"
                    )}>
                      {topics.filter(t => t.groupId === group.id).length}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-500 hover:text-white",
                        activeGroupId === group.id && "group-hover:bg-white/20"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {groups.length === 0 && !isGroupAddOpen && (
                <div className="text-center py-10 px-4 border-2 border-dashed border-zinc-200 rounded-2xl">
                  <FolderPlus className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No groups yet. Create one to start adding topics.</p>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content: Topics in Active Group */}
          <div className="flex-1 space-y-8">
            {activeGroupId ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                      {groups.find(g => g.id === activeGroupId)?.name}
                      <span className="text-sm font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                        {topics.filter(t => t.groupId === activeGroupId).length} Topics
                      </span>
                    </h2>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="h-8 px-3 text-xs"
                      onClick={() => deleteGroup(activeGroupId)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete Group
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsTopicAddOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Topic
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsBulkOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk
                    </Button>
                  </div>
                </div>

                {/* Dashboard Stats for Active Group */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Active</p>
                    <p className="text-3xl font-bold">{topics.filter(t => t.groupId === activeGroupId && t.progress < 3).length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Published</p>
                    <p className="text-3xl font-bold text-green-600">{topics.filter(t => t.groupId === activeGroupId && t.progress === 3).length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Due Today</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {topics.filter(t => {
                        if (t.groupId !== activeGroupId || t.progress === 3) return false;
                        const sched = getTopicSchedule(t.createdAt);
                        if (sched.currentStage === 'writing' && !t.stages.writing.completed) return true;
                        if (sched.currentStage === 'image' && !t.stages.image.completed) return true;
                        if (sched.currentStage === 'posting' && !t.stages.posting.completed) return true;
                        return false;
                      }).length}
                    </p>
                  </div>
                </div>

                {/* Daily Focus / Status */}
                <div className="p-6 rounded-3xl border bg-white border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-zinc-900 text-white">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">Daily Progress Tracker</h3>
                      <p className="text-sm text-zinc-500">
                        You've completed {topics.filter(t => t.lastCompletedAt && isSameDay(new Date(t.lastCompletedAt), new Date())).length} tasks today. Keep going!
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Session Active</p>
                    <p className="text-2xl font-black text-zinc-900 tabular-nums">{format(currentTime, 'h:mm:ss a')}</p>
                  </div>
                </div>

                {/* Add Topic Modal-like UI */}
                <AnimatePresence>
                  {isTopicAddOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-lg flex flex-col sm:flex-row gap-4"
                    >
                      <input 
                        type="text" 
                        placeholder="What's the topic title?" 
                        className="flex-1 h-12 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleAddTopic} className="flex-1 sm:flex-none h-12 px-8">Save</Button>
                        <Button variant="outline" onClick={() => setIsTopicAddOpen(false)} className="h-12">Cancel</Button>
                      </div>
                    </motion.div>
                  )}

                  {isBulkOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-lg space-y-6"
                    >
                      <div>
                        <h3 className="text-xl font-bold mb-1">Bulk Upload to {groups.find(g => g.id === activeGroupId)?.name}</h3>
                        <p className="text-sm text-zinc-500">Paste multiple topics, one per line.</p>
                      </div>
                      <textarea 
                        className="w-full h-48 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-lg"
                        placeholder="Topic 1&#10;Topic 2&#10;Topic 3..."
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                      />
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsBulkOpen(false)} className="h-12 px-8">Cancel</Button>
                        <Button onClick={handleBulkUpload} className="h-12 px-8">Import All</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Topics Table (Desktop) */}
                <div className="hidden lg:block bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest">Topic & Schedule</th>
                        <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Stage 1: Write</th>
                        <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Stage 2: Image</th>
                        <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Stage 3: Post</th>
                        <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Status</th>
                        <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {topics.filter(t => t.groupId === activeGroupId).map((topic, index) => {
                        const sched = getTopicSchedule(topic.createdAt);
                        const baseDay = index * 3;
                        const isDoneToday = topic.lastCompletedAt && isSameDay(new Date(topic.lastCompletedAt), new Date());
                        
                        return (
                          <tr key={topic.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-lg">{topic.title}</p>
                                <span className="text-[10px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-md">DAY {baseDay + 3}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <Calendar className="w-3 h-3" />
                                <span>Started {format(new Date(topic.createdAt), 'MMM d')}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col items-center gap-2">
                                <Checkbox 
                                  checked={topic.stages.writing.completed} 
                                  onChange={() => toggleStage(topic, 'writing')} 
                                />
                                <span className={cn(
                                  "text-[10px] font-bold uppercase",
                                  sched.currentStage === 'writing' ? "text-orange-600" : "text-zinc-300"
                                )}>
                                  Day {baseDay + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col items-center gap-2">
                                <Checkbox 
                                  checked={topic.stages.image.completed} 
                                  onChange={() => toggleStage(topic, 'image')} 
                                />
                                <span className={cn(
                                  "text-[10px] font-bold uppercase",
                                  sched.currentStage === 'image' ? "text-orange-600" : "text-zinc-300"
                                )}>
                                  Day {baseDay + 2}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col items-center gap-2">
                                <Checkbox 
                                  checked={topic.stages.posting.completed} 
                                  onChange={() => toggleStage(topic, 'posting')} 
                                />
                                <span className={cn(
                                  "text-[10px] font-bold uppercase",
                                  sched.currentStage === 'posting' ? "text-orange-600" : "text-zinc-300"
                                )}>
                                  Day {baseDay + 3}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              {topic.progress === 3 ? (
                                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-bold text-xs">
                                  <CheckCircle2 className="w-4 h-4" />
                                  PUBLISHED
                                </div>
                              ) : (
                                <div className={cn(
                                  "inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs",
                                  sched.diff > 2 ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-600"
                                )}>
                                  {sched.diff > 2 ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
                                  {sched.diff > 2 ? "OVERDUE" : `DAY ${sched.diff + 1}`}
                                </div>
                              )}
                              {isDoneToday && (
                                <p className="text-[9px] font-bold text-orange-500 mt-2 uppercase tracking-tighter">Daily Goal Met</p>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <Button variant="ghost" size="icon" onClick={() => deleteTopic(topic.id)}>
                                <Trash2 className="w-5 h-5 text-zinc-300 hover:text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {topics.filter(t => t.groupId === activeGroupId).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center text-zinc-400">
                            <Plus className="w-10 h-10 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No topics in this group yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Topics Cards (Mobile) */}
                <div className="lg:hidden space-y-6">
                    {topics.filter(t => t.groupId === activeGroupId).map((topic, index) => {
                      const sched = getTopicSchedule(topic.createdAt);
                      const baseDay = index * 3;
                      const isDoneToday = topic.lastCompletedAt && isSameDay(new Date(topic.lastCompletedAt), new Date());
                      
                      return (
                        <motion.div 
                          key={topic.id}
                          layout
                          className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold leading-tight">{topic.title}</h3>
                                <span className="text-[9px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-md">DAY {baseDay + 3}</span>
                              </div>
                              <p className="text-xs text-zinc-400 mt-1">Started {format(new Date(topic.createdAt), 'MMM d, yyyy')}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteTopic(topic.id)}>
                              <Trash2 className="w-5 h-5 text-zinc-300" />
                            </Button>
                          </div>
  
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { key: 'writing', label: 'Write', day: baseDay + 1 },
                              { key: 'image', label: 'Image', day: baseDay + 2 },
                              { key: 'posting', label: 'Post', day: baseDay + 3 }
                            ].map((s) => (
                              <div key={s.key} className="flex flex-col items-center gap-2">
                                <Checkbox 
                                  checked={topic.stages[s.key as keyof Topic['stages']].completed} 
                                  onChange={() => toggleStage(topic, s.key as keyof Topic['stages'])} 
                                />
                                <p className="text-[10px] font-bold uppercase text-zinc-400">{s.label}</p>
                                <p className={cn(
                                  "text-[9px] font-medium px-2 py-0.5 rounded-full",
                                  sched.currentStage === s.key ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-500"
                                )}>
                                  Day {s.day}
                                </p>
                              </div>
                            ))}
                          </div>
  
                          <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full transition-all", topic.progress === 3 ? "bg-green-500" : "bg-zinc-900")} 
                                  style={{ width: `${(topic.progress / 3) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400">{topic.progress}/3</span>
                            </div>
                            
                            {topic.progress === 3 ? (
                              <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                PUBLISHED
                              </span>
                            ) : (
                              <div className="text-right">
                                <span className={cn(
                                  "text-xs font-bold flex items-center gap-1 justify-end",
                                  sched.diff > 2 ? "text-red-600" : "text-zinc-500"
                                )}>
                                  {sched.diff > 2 ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {sched.diff > 2 ? "OVERDUE" : `DAY ${sched.diff + 1}`}
                                </span>
                                {isDoneToday && (
                                  <p className="text-[8px] font-bold text-orange-500 uppercase">Daily Goal Met</p>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-8">
                  <FolderPlus className="w-12 h-12 text-zinc-300" />
                </div>
                <h2 className="text-3xl font-black mb-4">Your Workflow Hub</h2>
                <p className="text-zinc-500 max-w-md mx-auto mb-10">
                  Organize your blogging journey. Create groups to categorize your topics, and we'll help you stay on track with a 3-day completion cycle.
                </p>
                
                {groups.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                    {groups.map(group => (
                      <button 
                        key={group.id}
                        onClick={() => setActiveGroupId(group.id)}
                        className="flex items-center justify-between p-6 bg-white border border-zinc-200 rounded-3xl hover:border-zinc-900 hover:shadow-lg transition-all text-left"
                      >
                        <div>
                          <p className="font-black text-lg">{group.name}</p>
                          <p className="text-xs text-zinc-400">{topics.filter(t => t.groupId === group.id).length} Topics</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300" />
                      </button>
                    ))}
                    <button 
                      onClick={() => setIsGroupAddOpen(true)}
                      className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-zinc-200 rounded-3xl hover:border-zinc-300 hover:bg-zinc-50 transition-all"
                    >
                      <Plus className="w-5 h-5 text-zinc-400" />
                      <span className="font-bold text-zinc-500">New Group</span>
                    </button>
                  </div>
                ) : (
                  <Button className="h-14 px-10 text-lg shadow-xl shadow-zinc-200" onClick={() => setIsGroupAddOpen(true)}>
                    <Plus className="w-6 h-6 mr-3" />
                    Create Your First Group
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Maker Section */}
      <footer className="mt-20 border-t border-zinc-200 bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-100 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-500">
            <UserIcon className="w-3 h-3" />
            Maker Spotlight
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter">
              ejimofor chibuike victor
            </h2>
            <p className="text-xl text-zinc-400 font-medium italic">aka Aegis</p>
          </div>

          <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed">
            Crafting tools that empower creators to build faster, track better, and publish smarter. 
            BlogFlow is a testament to the power of structured workflows.
          </p>

          <div className="flex items-center justify-center gap-6 pt-4">
            <a href="#" className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all group">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all group">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all group">
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <div className="pt-12 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em]">
            &copy; 2026 BlogFlow by Aegis
          </div>
        </div>
      </footer>
    </div>
  );
}
