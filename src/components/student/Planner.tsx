import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Ensure this path is correct
import { db } from '../../lib/firebase'; // Ensure this path is correct
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Calendar as CalendarIcon, Check, Loader2, CalendarDays, Save, X } from 'lucide-react'; // Added CalendarDays, Save, X

interface PlannerGoal {
  id: string;
  text: string;
  completed: boolean;
  date: string; // Specific date in ISO format
  createdAt: string;
  userId: string;
}

const Planner: React.FC = () => {
  const { currentUser: user, loading: authLoading } = useAuth(); // Destructure authLoading
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [goals, setGoals] = useState<PlannerGoal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [plannerLoading, setPlannerLoading] = useState(true); // Renamed from 'loading' to avoid conflict
  const [isAdding, setIsAdding] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ goalId: string; goalText: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format date to ISO string (YYYY-MM-DD)
  const formatDateToISO = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Get week dates for display
  const getWeekDates = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();
    
    // Create an array of 7 dates representing the week
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(curr);
      day.setDate(first + i);
      return day;
    });

    return {
      days: weekDays,
      start: weekDays[0],
      end: weekDays[6]
    };
  };

  // Get previous week
  const getPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    return newDate;
  };

  // Get next week
  const getNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    return newDate;
  };

  // Check if a date is in the past
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (goals.length === 0) return 0;
    const completedGoals = goals.filter(goal => goal.completed).length;
    return Math.round((completedGoals / goals.length) * 100);
  };

  // Change week with simple animation
  const changeWeek = (newWeek: Date, dir: number) => {
    setDirection(dir);
    setCurrentWeek(newWeek);
  };

  // Select a specific date to view tasks
  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    // Wait for authentication to resolve
    if (authLoading) {
      setPlannerLoading(true); // Keep planner loading if auth is still loading
      return;
    }

    if (!user?.uid) {
      setPlannerLoading(false); // If no user after auth resolves, stop loading
      setGoals([]);      // Clear existing goals if any
      console.log('[Planner] useEffect: No user ID, clearing goals and stopping loading.');
      return;
    }

    console.log('[Planner] useEffect: User ID present, fetching goals for:', user.uid, 'and date:', selectedDate);
    setPlannerLoading(true);
    const dateStr = formatDateToISO(selectedDate);
    const goalsRef = collection(db, 'planner_goals');
    const goalsQuery = query(
      goalsRef,
      where('userId', '==', user.uid),
      where('date', '==', dateStr)
    );

    const unsubscribe = onSnapshot(goalsQuery, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlannerGoal[];
      
      setGoals(goalsData);
      setPlannerLoading(false);
      console.log('[Planner] useEffect: Goals fetched:', goalsData);
    }, (error) => { 
      console.error("[Planner] Error fetching planner goals:", error);
      toast.error("Failed to load tasks. Please check your connection or try again.");
      setPlannerLoading(false); 
    });

    return () => unsubscribe();
  }, [user?.uid, selectedDate, authLoading]); // Added authLoading to dependency array

  const handleAddGoal = async () => {
    console.log('[Planner] handleAddGoal triggered.');
    console.log('[Planner] Current newGoal:', newGoal);
    console.log('[Planner] Current user object:', user);

    // Button's disabled state should ensure newGoal is not empty.
    // This check is a fallback.
    if (!newGoal.trim()) {
      console.log('[Planner] newGoal is empty. Aborting.');
      toast.error('Task text cannot be empty.');
      return;
    }
    console.log('[Planner] newGoal has text:', newGoal);

    // If user ID is missing, inform the user and abort.
    if (!user?.uid) {
      console.log('[Planner] user.uid is missing. User object:', user);
      toast.error('User not identified. Please log in again to add tasks.');
      return;
    }
    console.log('[Planner] user.uid is present:', user.uid);

    setIsAdding(true);
    console.log('[Planner] setIsAdding(true). Attempting to add document.');
    try {
      const dateStr = formatDateToISO(selectedDate);
      console.log('[Planner] Adding doc with data:', { text: newGoal, completed: false, date: dateStr, createdAt: new Date().toISOString(), userId: user.uid });
      
      const docRef = await addDoc(collection(db, 'planner_goals'), {
        text: newGoal,
        completed: false,
        date: dateStr,
        createdAt: new Date().toISOString(),
        userId: user.uid 
      });
      console.log('[Planner] Document added successfully with ID:', docRef.id);

      setNewGoal('');
      toast.success('Goal added successfully');
    } catch (error) {
      console.error('[Planner] Error adding goal:', error);
      if (error instanceof Error) {
        toast.error(`Failed to add goal: ${error.message}`);
      } else {
        toast.error('Failed to add goal. Please try again.');
      }
    } finally {
      console.log('[Planner] setIsAdding(false) in finally block.');
      setIsAdding(false);
    }
  };

  const handleToggleGoal = async (goal: PlannerGoal) => {
    if (isPastDate(new Date(goal.date)) && goal.date !== formatDateToISO(new Date())) {
      toast.error("Can't modify tasks from past days");
      return;
    }

    try {
      const goalRef = doc(db, 'planner_goals', goal.id);
      await updateDoc(goalRef, {
        completed: !goal.completed
      });
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };
  
  const handleEditGoal = (goal: PlannerGoal) => {
    if (isPastDate(new Date(goal.date)) && goal.date !== formatDateToISO(new Date())) {
      toast.error("Can't edit tasks from past days");
      return;
    }
    
    setEditingGoal(goal.id);
    setEditText(goal.text);
  };
  
  const handleSaveEdit = async (goalId: string) => {
    if (!editText.trim()) {
      toast.error("Task text cannot be empty");
      return;
    }
    
    try {
      const goalRef = doc(db, 'planner_goals', goalId);
      await updateDoc(goalRef, {
        text: editText.trim()
      });
      setEditingGoal(null);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingGoal(null);
    setEditText('');
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    if (isSelectedDatePast) {
      toast.error("Can't delete tasks from past days");
      return;
    }
    
    try {
      setIsDeleting(goalId);
      const goalRef = doc(db, 'planner_goals', goalId);
      await deleteDoc(goalRef);
      toast.success('Task deleted successfully');
      setDeleteConfirm(null); // Close confirmation dialog
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteClick = (goal: PlannerGoal) => {
    setDeleteConfirm({ goalId: goal.id, goalText: goal.text });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const weekInfo = getWeekDates(currentWeek);
  const progress = calculateProgress();
  const isSelectedDatePast = isPastDate(selectedDate) && 
    formatDateToISO(selectedDate) !== formatDateToISO(new Date());

  // Early return if auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="ml-2 text-gray-600">Loading planner...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <CalendarDays className="h-6 w-6 mr-2 text-indigo-600" /> {/* Changed to CalendarDays */}
          My Task Planner
        </h2>
        
        <div className="text-sm bg-indigo-50 rounded-lg px-3 py-1 text-indigo-700 font-medium">
          {formatDateForDisplay(selectedDate)}
        </div>
      </div>

      <div className="relative mb-6">
        <motion.div
          key={currentWeek.toISOString()}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-7 gap-1 overflow-hidden rounded-lg bg-gray-50 p-3">
            {weekInfo.days.map((date, index) => {
              const isToday = formatDateToISO(date) === formatDateToISO(new Date());
              const isSelected = formatDateToISO(date) === formatDateToISO(selectedDate);
              const isPast = isPastDate(date) && !isToday;
              
              return (
                <div 
                  key={index} 
                  onClick={() => selectDate(date)}
                  className={`
                    text-center p-2 rounded-md cursor-pointer
                    ${isSelected ? 'bg-indigo-600 text-white' : ''}
                    ${isToday && !isSelected ? 'border-2 border-indigo-600' : ''}
                    ${isPast && !isSelected ? 'text-gray-400' : ''}
                    ${!isPast && !isSelected && !isToday ? 'hover:bg-indigo-100' : ''}
                  `}
                >
                  <div className="text-xs font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
        
        <button
          onClick={() => changeWeek(getPreviousWeek(), -1)}
          className="absolute top-1/2 -left-3 transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md text-indigo-600 hover:bg-indigo-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => changeWeek(getNextWeek(), 1)}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md text-indigo-600 hover:bg-indigo-50"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => {
            const today = new Date();
            setCurrentWeek(today);
            setSelectedDate(today);
            setDirection(0);
          }}
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs bg-indigo-500 text-white rounded-full shadow-md hover:bg-indigo-600 font-medium"
        >
          Today
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {!isSelectedDatePast && (
        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              placeholder={`Add a new task for ${formatDateForDisplay(selectedDate)}...`}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddGoal}
              disabled={isAdding || !newGoal.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                !newGoal.trim() ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Add Task
            </button>
          </div>
        </div>
      )}

      {isSelectedDatePast && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mb-4 text-amber-700 text-sm">
          Tasks from past days cannot be modified
        </div>
      )}

      <div className="space-y-2">
        {plannerLoading ? ( // Changed from 'loading' to 'plannerLoading'
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-lg">No tasks for {formatDateForDisplay(selectedDate)}</p>
            {!isSelectedDatePast && (
              <p className="text-sm text-indigo-500 mt-2">
                Add your first task above
              </p>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`flex items-center justify-between p-4 rounded-lg shadow-sm ${
                  goal.completed ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white border-l-4 border-indigo-400'
                }`}
              >
                <div className="flex items-center flex-1">
                  <button
                    onClick={() => handleToggleGoal(goal)}
                    disabled={isSelectedDatePast}
                    className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                      goal.completed
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-indigo-400 bg-white'
                    } ${isSelectedDatePast ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                  >
                    {goal.completed && <Check className="h-4 w-4" />}
                  </button>
                  
                  {editingGoal === goal.id ? (
                    <div className="ml-3 flex-1 flex">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(goal.id)}
                        className="flex-1 py-1 px-2 border border-gray-300 rounded-md text-sm"
                        autoFocus
                      />
                      <div className="flex space-x-1 ml-2">
                        <button 
                          onClick={() => handleSaveEdit(goal.id)}
                          className="p-1 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                        >
                          <Save size={16} />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="p-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className={`ml-3 flex-1 ${goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {goal.text}
                    </span>
                  )}
                </div>
                
                {!isSelectedDatePast && editingGoal !== goal.id && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditGoal(goal)}
                      className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-md"
                      disabled={isSelectedDatePast}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(goal)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                      disabled={isSelectedDatePast || isDeleting === goal.id}
                    >
                      {isDeleting === goal.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task?
            </p>
            <p className="text-sm bg-gray-50 p-3 rounded-md mb-6 font-medium text-gray-800">
              "{deleteConfirm.goalText}"
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteGoal(deleteConfirm.goalId)}
                disabled={isDeleting === deleteConfirm.goalId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting === deleteConfirm.goalId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin inline" />
                    Deleting...
                  </>
                ) : (
                  'Delete Task'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;