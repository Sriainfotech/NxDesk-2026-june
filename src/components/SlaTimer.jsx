import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../utils/axiosInstance';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * SLATimer component displays the remaining time for SLA compliance
 * Implements 2-hour SLA rule from ticket creation (start_time)
 * Shows breach if status remains "Open" after 2 hours
 */
export default function SLATimer() {
  const { ticketId } = useParams();
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('');
  const [slaInfo, setSlaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [breached, setBreached] = useState(false);
  
  // Format seconds to HH:MM:SS display
  const formatTime = useCallback((seconds) => {
    if (seconds === null) return '--:--:--';
    
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    
    const formattedTime = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
    
    return seconds < 0 ? `-${formattedTime}` : formattedTime;
  }, []);

  // Calculate time remaining until 2-hour SLA breach
  const calculateTimeRemaining = useCallback((startTime) => {
    if (!startTime) return 0;
    
    const now = new Date();
    const start = new Date(startTime);
    
    // Add 2 hours to start time to get SLA deadline
    const slaDeadline = new Date(start);
    slaDeadline.setHours(slaDeadline.getHours() + 2);
    
    const diffMs = slaDeadline - now;
    return Math.floor(diffMs / 1000);
  }, []);

  // Fetch ticket status
  const fetchTicketStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axiosInstance.get(`ticket/tickets/${ticketId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatus(response.data.status);
      return response.data;
    } catch (err) {
      console.error('Error fetching ticket status:', err);
      setError('Failed to load ticket status');
      return null;
    }
  }, [ticketId]);

  // Fetch SLA timer data
  const fetchSlaTimer = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axiosInstance.get(`/ticket/sla-timers/${ticketId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlaInfo(response.data);
      
      // Set breached status based on API data or time calculation
      const isBreached = response.data.breached || 
                         (response.data.sla_status === 'Active' && 
                          response.data.start_time && 
                          calculateTimeRemaining(response.data.start_time) <= 0 && 
                          status === 'Open');
      
      setBreached(isBreached);
      
      // Calculate remaining time from start_time + 2 hours
      const remainingTime = calculateTimeRemaining(response.data.start_time);
      setTimeLeft(remainingTime);
      
      return response.data;
    } catch (err) {
      console.error('Error fetching SLA timer:', err);
      setError('Failed to load SLA timer data');
      return null;
    }
  }, [ticketId, calculateTimeRemaining, status]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const ticketData = await fetchTicketStatus();
        if (ticketData) {
          const slaData = await fetchSlaTimer();
        }
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError('Failed to initialize SLA timer');
      }
    };
    
    fetchData();
  }, [fetchTicketStatus, fetchSlaTimer]);

  // Update breach status in database
  const updateBreachStatus = useCallback(async (isBreached) => {
    try {
      const token = localStorage.getItem('access_token');
      await axiosInstance.post(`/ticket/sla/${ticketId}/check-breach/`, 
        { breached: isBreached },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
    } catch (err) {
      console.error('Error updating SLA breach status:', err);
    }
  }, [ticketId]);

  // Timer countdown logic
  useEffect(() => {
    // Don't start timer if still loading or if status is in a paused state
    if (loading || timeLeft === null) return;
    
    // Statuses where the SLA timer should be paused
    const pausedStatuses = ['Waiting for User Response', 'Resolved', 'Closed'];
    if (pausedStatuses.includes(status)) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        // Check if we need to update the breach status
        if (prevTime === 1 && status === 'Open') {
          setBreached(true);
          // Update breach status in the database
          updateBreachStatus(true);
        }
        // Continue counting into negative values when breached
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, status, timeLeft, updateBreachStatus]);

  // Check for breach based on time and status
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && status === 'Open' && !breached) {
      setBreached(true);
      updateBreachStatus(true);
    }
  }, [timeLeft, status, breached, updateBreachStatus]);

  // Determine timer color based on remaining time (specifically for 2-hour rule)
  const getTimerColor = useCallback(() => {
    if (timeLeft === null) return 'text-gray-500';
    if (timeLeft <= 0 || breached) return 'text-red-600'; // Breached or time's up
    if (timeLeft <= 600) return 'text-red-600'; // Red for last 10 minutes
    if (timeLeft <= 1800) return 'text-yellow-600'; // Warning (30 min or less)
    return 'text-green-600'; // Safe
  }, [timeLeft, breached]);

  // Get timer icon based on status
  const getTimerIcon = useCallback(() => {
    if (['Resolved', 'Closed'].includes(status)) {
      return <CheckCircle size={16} className="text-green-600" />;
    }
    
    if (breached || (timeLeft !== null && timeLeft <= 0 && status === 'Open')) {
      return <AlertTriangle size={16} className="text-red-600" />;
    }
    
    return <Clock size={16} className={getTimerColor()} />;
  }, [status, breached, timeLeft, getTimerColor]);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Clock className="animate-pulse" size={16} />
        <span className="text-sm">Loading SLA...</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <AlertTriangle size={16} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  // Handle resolved or closed tickets
  if (['Resolved', 'Closed'].includes(status)) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <CheckCircle size={16} className="text-green-600" />
        <span className="text-sm font-medium">{status}</span>
      </div>
    );
  }

  // Determine if timer is paused
  const isPaused = status === 'Waiting for User Response';
  
  // Get appropriate warning or breach message
  const getStatusMessage = () => {
    if (breached) return <span className="ml-1 text-red-600 font-normal">(Breached)</span>;
    if (timeLeft <= 0 && status === 'Open') return <span className="ml-1 text-red-600 font-normal">(Breached)</span>;
    if (timeLeft <= 600) return <span className="ml-1 text-red-600 font-normal">(Critical)</span>;
    if (isPaused) return <span className="ml-1 text-gray-500 font-normal">(Paused)</span>;
    return null;
  };

  return (
    <div className="flex items-center gap-2">
      {getTimerIcon()}
      <div className="flex flex-col">
        <span className={`font-mono text-sm font-medium ${getTimerColor()}`}>
          {formatTime(timeLeft)}
          {getStatusMessage()}
        </span>
        {slaInfo?.sla_status && (
          <span className="text-xs text-gray-500">
            {slaInfo.sla_status}
          </span>
        )}
      </div>
    </div>
  );
}