/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Topic } from './types';
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
  Calendar
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

// --- Main App ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicKeyword, setNewTopicKeyword] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkKeyword, setBulkKeyword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load topics from localStorage
    const savedTopics = localStorage.getItem('blogflow_topics');
    if (savedTopics) {
      try {
        setTopics(JSON.parse(savedTopics));
      } catch (e) {
        console.error("Failed to parse topics", e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Save topics to localStorage whenever they change
    if (!loading) {
      localStorage.setItem('blogflow_topics', JSON.stringify(topics));
    }
  }, [topics, loading]);

  const handleAddTopic = () => {
    if (!newTopicTitle.trim() || !newTopicKeyword.trim()) return;
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      userId: 'local-user',
      title: newTopicTitle.trim(),
      keyword: newTopicKeyword.trim(),
      status: 'draft',
      progress: 0,
      stages: {
        writing: { completed: false },
        image: { completed: false },
        posting: { completed: false }
      },
      order: topics.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTopics([...topics, newTopic]);
    setNewTopicTitle('');
    setNewTopicKeyword('');
    setIsAddOpen(false);
  };

  const handleBulkUpload = () => {
    if (!bulkText.trim() || !bulkKeyword.trim()) return;
    const titles = bulkText.split('\n').filter(l => l.trim());
    const newTopics: Topic[] = titles.map((title, index) => ({
      id: crypto.randomUUID(),
      userId: 'local-user',
      title: title.trim(),
      keyword: bulkKeyword.trim(),
      status: 'draft',
      progress: 0,
      stages: {
        writing: { completed: false },
        image: { completed: false },
        posting: { completed: false }
      },
      order: topics.length + index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setTopics([...topics, ...newTopics]);
    setBulkText('');
    setBulkKeyword('');
    setIsBulkOpen(false);
  };

  const toggleStage = (topic: Topic, stageKey: keyof Topic['stages']) => {
    // Check if a task was already completed today for this topic
    if (topic.lastCompletedAt) {
      const lastDate = startOfDay(new Date(topic.lastCompletedAt));
      const today = startOfDay(new Date());
      if (isSameDay(lastDate, today) && !topic.stages[stageKey].completed) {
        alert("You can only complete one task per topic per day. Come back tomorrow!");
        return;
      }
    }

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
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">BlogFlow</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold">{format(currentTime, 'EEEE, MMM do')}</p>
            <p className="text-xs text-zinc-400">{format(currentTime, 'h:mm a')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Active Topics</p>
            <p className="text-3xl font-bold">{topics.filter(t => t.progress < 3).length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Published</p>
            <p className="text-3xl font-bold text-green-600">{topics.filter(t => t.progress === 3).length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Due Today</p>
            <p className="text-3xl font-bold text-orange-600">
              {topics.filter(t => {
                const sched = getTopicSchedule(t.createdAt);
                if (t.progress === 3) return false;
                if (sched.currentStage === 'writing' && !t.stages.writing.completed) return true;
                if (sched.currentStage === 'image' && !t.stages.image.completed) return true;
                if (sched.currentStage === 'posting' && !t.stages.posting.completed) return true;
                return false;
              }).length}
            </p>
          </div>
        </div>

        {/* Desktop Table Grouped by Keyword */}
        <div className="hidden lg:block space-y-12">
          {Object.entries(
            topics.reduce((acc, topic) => {
              if (!acc[topic.keyword]) acc[topic.keyword] = [];
              acc[topic.keyword].push(topic);
              return acc;
            }, {} as Record<string, Topic[]>)
          ).map(([keyword, keywordTopics]) => (
            <div key={keyword} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-1.5 bg-orange-500 rounded-full" />
                <h2 className="text-2xl font-black tracking-tight text-zinc-800 uppercase">{keyword}</h2>
                <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">{keywordTopics.length} Topics</span>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest">Topic & Schedule</th>
                      <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Day 1: Write</th>
                      <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Day 2: Image</th>
                      <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Day 3: Post</th>
                      <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5 font-bold text-zinc-500 text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {keywordTopics.map((topic) => {
                      const sched = getTopicSchedule(topic.createdAt);
                      const isDoneToday = topic.lastCompletedAt && isSameDay(new Date(topic.lastCompletedAt), new Date());
                      
                      return (
                        <tr key={topic.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-bold text-lg mb-1">{topic.title}</p>
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
                                disabled={isDoneToday && !topic.stages.writing.completed}
                              />
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                sched.currentStage === 'writing' ? "text-orange-600" : "text-zinc-300"
                              )}>
                                {sched.currentStage === 'writing' ? "Today's Task" : format(sched.day1, 'MMM d')}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col items-center gap-2">
                              <Checkbox 
                                checked={topic.stages.image.completed} 
                                onChange={() => toggleStage(topic, 'image')} 
                                disabled={isDoneToday && !topic.stages.image.completed}
                              />
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                sched.currentStage === 'image' ? "text-orange-600" : "text-zinc-300"
                              )}>
                                {sched.currentStage === 'image' ? "Today's Task" : format(sched.day2, 'MMM d')}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col items-center gap-2">
                              <Checkbox 
                                checked={topic.stages.posting.completed} 
                                onChange={() => toggleStage(topic, 'posting')} 
                                disabled={isDoneToday && !topic.stages.posting.completed}
                              />
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                sched.currentStage === 'posting' ? "text-orange-600" : "text-zinc-300"
                              )}>
                                {sched.currentStage === 'posting' ? "Today's Task" : format(sched.day3, 'MMM d')}
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
                            {isDoneToday && topic.progress < 3 && (
                              <p className="text-[9px] font-bold text-orange-500 mt-2 uppercase tracking-tighter">Daily Task Done</p>
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
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View Grouped by Keyword */}
        <div className="lg:hidden space-y-12">
          {Object.entries(
            topics.reduce((acc, topic) => {
              if (!acc[topic.keyword]) acc[topic.keyword] = [];
              acc[topic.keyword].push(topic);
              return acc;
            }, {} as Record<string, Topic[]>)
          ).map(([keyword, keywordTopics]) => (
            <div key={keyword} className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-6 w-1 bg-orange-500 rounded-full" />
                <h2 className="text-xl font-black tracking-tight text-zinc-800 uppercase">{keyword}</h2>
              </div>
              <div className="space-y-6">
                {keywordTopics.map((topic) => {
                  const sched = getTopicSchedule(topic.createdAt);
                  const isDoneToday = topic.lastCompletedAt && isSameDay(new Date(topic.lastCompletedAt), new Date());
                  
                  return (
                    <motion.div 
                      key={topic.id}
                      layout
                      className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold leading-tight">{topic.title}</h3>
                          <p className="text-xs text-zinc-400 mt-1">Started {format(new Date(topic.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteTopic(topic.id)}>
                          <Trash2 className="w-5 h-5 text-zinc-300" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { key: 'writing', label: 'Write', day: sched.day1 },
                          { key: 'image', label: 'Image', day: sched.day2 },
                          { key: 'posting', label: 'Post', day: sched.day3 }
                        ].map((s) => (
                          <div key={s.key} className="flex flex-col items-center gap-2">
                            <Checkbox 
                              checked={topic.stages[s.key as keyof Topic['stages']].completed} 
                              onChange={() => toggleStage(topic, s.key as keyof Topic['stages'])} 
                              disabled={isDoneToday && !topic.stages[s.key as keyof Topic['stages']].completed}
                            />
                            <p className="text-[10px] font-bold uppercase text-zinc-400">{s.label}</p>
                            <p className={cn(
                              "text-[9px] font-medium px-2 py-0.5 rounded-full",
                              sched.currentStage === s.key ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-500"
                            )}>
                              {format(s.day, 'MMM d')}
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
                              <p className="text-[8px] font-bold text-orange-500 uppercase">Daily Task Done</p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="bg-white py-20 rounded-3xl border border-zinc-200 text-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-zinc-200" />
            </div>
            <h3 className="text-xl font-bold mb-2">No topics yet</h3>
            <p className="text-zinc-500">Add your first topic to start your 3-day journey.</p>
          </div>
        )}

        {/* Controls */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            {isAddOpen ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-lg space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Keyword / Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Tech, Lifestyle, Cooking..." 
                      className="w-full h-12 px-5 mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={newTopicKeyword}
                      onChange={(e) => setNewTopicKeyword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Topic Title</label>
                    <input 
                      type="text" 
                      placeholder="What's the topic title?" 
                      className="w-full h-12 px-5 mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddTopic} className="flex-1 h-12 px-8">Save Topic</Button>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)} className="h-12">Cancel</Button>
                </div>
              </motion.div>
            ) : isBulkOpen ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-lg space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Keyword for this Batch</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Tech, Lifestyle, Cooking..." 
                      className="w-full h-12 px-5 mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={bulkKeyword}
                      onChange={(e) => setBulkKeyword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Topics (One per line)</label>
                    <textarea 
                      className="w-full h-48 p-5 mt-1 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-lg"
                      placeholder="Topic 1&#10;Topic 2&#10;Topic 3..."
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsBulkOpen(false)} className="h-12 px-8">Cancel</Button>
                  <Button onClick={handleBulkUpload} className="h-12 px-8">Import All</Button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setIsAddOpen(true)} className="h-14 px-10 text-lg rounded-2xl">
                  <Plus className="w-5 h-5 mr-3" />
                  Add Normal
                </Button>
                <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="h-14 px-10 text-lg rounded-2xl">
                  <Upload className="w-5 h-5 mr-3" />
                  Upload in Bulk
                </Button>
              </div>
            )}
          </AnimatePresence>
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
