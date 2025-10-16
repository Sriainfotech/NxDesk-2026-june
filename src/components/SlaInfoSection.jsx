// File: components/TicketDetails/SLAInfoSection.jsx
import { useEffect, useState, useRef } from "react";
import { Clock, AlertCircle } from "lucide-react";

export default function SLAInfoSection({ sla, status, ticketData }) {
    const [slaTimeLeft, setSlaTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isNegative: false
    });
    const timerRef = useRef(null);

    // Calculate SLA time remaining and update the countdown
    const calculateTimeRemaining = () => {
        if (!sla || !sla.sla_due_date) return;

        const now = new Date();
        const dueDate = new Date(sla.sla_due_date);

        // If ticket is closed/resolved/cancelled, no need to calculate
        if (["Closed", "Resolved", "Cancelled", "Waiting for users"].includes(status)) {
            return;
        }

        // Calculate time difference in seconds - allow negative values
        let diff = Math.floor((dueDate - now) / 1000);

        // For negative values, use the absolute value for display but track the sign
        const isNegative = diff < 0;
        diff = Math.abs(diff);

        // Convert to hours, minutes, seconds
        const hours = Math.floor(diff / 3600);
        diff %= 3600;
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        setSlaTimeLeft({
            hours: isNegative ? -hours : hours,
            minutes,
            seconds,
            totalSeconds: isNegative ? -(hours * 3600 + minutes * 60 + seconds) : (hours * 3600 + minutes * 60 + seconds),
            isNegative
        });
    };

    // Format time for display (add leading zeros)
    const formatTime = (value) => {
        const absValue = Math.abs(value);
        return absValue < 10 ? `0${absValue}` : absValue;
    };

    // Get SLA status color
    const getSlaStatusColor = () => {
        if (!sla) return "bg-gray-200 text-gray-600";

        if (sla.breached) return "bg-red-100 text-red-600";

        // Warning when less than 1 hour remains
        if (slaTimeLeft.totalSeconds < 3600) return "bg-yellow-100 text-yellow-600";

        // Paused
        if (sla.paused_time) return "bg-gray-100 text-gray-600";

        // Active and healthy
        return "bg-green-100 text-green-600";
    };

    // Setup timer when SLA data is available
    useEffect(() => {
        if (sla) {
            // Calculate initial time remaining
            calculateTimeRemaining();

            // Setup interval for countdown
            timerRef.current = setInterval(() => {
                calculateTimeRemaining();
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [sla, status]);

    return (
        <div className="flex gap-4">
            {/* SLA Status Card */}
            <div className={` mt-8 w-64 p-4 rounded-xl shadow-lg ${sla?.breached ? "bg-red-100 border border-red-500" : " bg-white"}`}>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-500 mr-2" />
                        <p className="font-bold text-black">SLA:</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSlaStatusColor()}`}>
                        {sla?.sla_status || "Loading..."}
                    </div>
                </div>

                <div className="mt-3 mb-1">
                    <p className="text-[#293988] text-sm font-medium">
                        Time for Resolution: <span className="font-bold">
                            {((new Date("2025-04-05T04:54:42.102068+05:30") - new Date("2025-04-05T02:54:42.102068+05:30")) / (1000 * 60 * 60)).toFixed(2)} hrs
                        </span>
                    </p>
                </div>

                {/* SLA Due Date */}
                <div className="mt-2 text-xs text-gray-500">
                    {sla && (
                        <p>Due: {new Date(sla.sla_due_date).toLocaleString()}</p>
                    )}
                </div>
            </div>

            {/* SLA Countdown Card */}
            <div className="bg-white mt-8 w-64 font-bold p-4 rounded-xl shadow-lg">
                {sla && !["Closed", "Resolved", "Cancelled", "Waiting for users"].includes(status) && (
                    <div className="">
                        <p className="text-sm text-gray-600 mb-1 flex  gap-2">
                            {slaTimeLeft.isNegative ? "SLA Breached:" : "Time Remaining:"}
                            <AlertCircle className={`h-5 w-5 ${slaTimeLeft.isNegative ? "text-red-600" : "text-gray-500"} mr-2`} />
                        </p>
                        <div className={`flex justify-center items-center ${slaTimeLeft.isNegative ? "bg-red-100" : "bg-gray-100"} rounded-lg p-2`}>
                            <div className="flex items-center">
                                {slaTimeLeft.isNegative && <span className="text-red-600 font-bold mr-1">-</span>}
                                <div className="flex flex-col items-center px-2">
                                    <span className={`text-lg font-bold ${slaTimeLeft.isNegative ? "text-red-600" : ""}`}>
                                        {formatTime(slaTimeLeft.hours)}
                                    </span>
                                    <span className="text-xs text-gray-500">hr</span>
                                </div>
                                <span className={`text-lg font-bold ${slaTimeLeft.isNegative ? "text-red-600" : ""}`}>:</span>
                                <div className="flex flex-col items-center px-2">
                                    <span className={`text-lg font-bold ${slaTimeLeft.isNegative ? "text-red-600" : ""}`}>
                                        {formatTime(slaTimeLeft.minutes)}
                                    </span>
                                    <span className="text-xs text-gray-500">min</span>
                                </div>
                                <span className={`text-lg font-bold ${slaTimeLeft.isNegative ? "text-red-600" : ""}`}>:</span>
                                <div className="flex flex-col items-center px-2">
                                    <span className={`text-lg font-bold ${slaTimeLeft.isNegative ? "text-red-600" : ""}`}>
                                        {formatTime(slaTimeLeft.seconds)}
                                    </span>
                                    <span className="text-xs text-gray-500">sec</span>
                                </div>
                            </div>
                        </div>

                        {/* Add breached indicator when time is negative */}
                        {slaTimeLeft.isNegative && !sla.breached && (
                            <div className="flex items-center mt-2 text-red-600 text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                <span>SLA time exceeded!</span>
                            </div>
                        )}

                        {/* Warning indicator for SLA approaching breach */}
                        {!slaTimeLeft.isNegative && slaTimeLeft.totalSeconds < 3600 && !sla.breached && (
                            <div className="flex items-center mt-2 text-yellow-600 text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                <span>SLA nearing breach!</span>
                            </div>
                        )}
                    </div>
                )}
                {/* SLA Breach notification */}
                {sla && sla.breached && (
                    <div className="mt-2 flex items-center text-red-500 text-[11px]">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>SLA Breached on {new Date(sla.sla_due_date).toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Service Project Info Card */}
            <div className="bg-white mt-8 w-64 font-bold p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-center px-2 mb-1">
                    <p className="text-black">Service Project Request</p>
                </div>
                <p className="text-[#293988] px-2 text-sm font-medium">Assignee: {ticketData?.assignee || "ABC"}</p>
                <p className="text-[#293988] px-2 text-sm font-medium">
                    Time for Resolution: <span className="text-red-400">No Match</span>
                </p>
            </div>
        </div>
    );
}