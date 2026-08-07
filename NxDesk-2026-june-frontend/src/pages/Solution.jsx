"use client"

import { ChevronsUp, Search, Upload, ChevronDown } from "lucide-react"
import Sidebar from "../components/Sidebar"
import { useState, useEffect, useRef } from "react";
import ChatbotPopup from "../components/ChatBot";
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from "../utils/axiosInstance";
import { toast } from "react-toastify";

export default function Solution() {
    const [selected, setSelected] = useState('Comments');
    const [resolutionType, setResolutionType] = useState('Fixed');
    const [incidentBasedOn, setIncidentBasedOn] = useState('None');
    const [incidentCategory, setIncidentCategory] = useState('None');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [ticketData, setTicketData] = useState(null);
    const [resolutionDescription, setResolutionDescription] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState(null);
    
    const router = useNavigate();
    const dropdownRef = useRef(null);

    // Resolution options based on Image 1
    const resolutionOptions = [
        'Fixed',
        'Cannot Reproduce',
        'Not a Bug',
        'Solved by workaround',
        'User instruction provided',
        'Withdrawn by user',
        'No solution available',
        'Rejected',
        'Expired',
        'Known Error',
        'Hardware failure',
        'Software failure',
        'Implemented'
    ];

    // Incident based on options from Image 3
    const incidentBasedOnOptions = [
        'None',
        'Development activities needed',
        'Incident of SR category',
        'Dependency with third party Service Provider',
        'Inappropriate Incidents (Incident not reproducible, withdrawal Incidents)',
        'Other'
    ];

    // Incident category options from Image 2
    const incidentCategoryOptions = [
        'None',
        'Access Issues',
        'Configuration',
        'Data Quality',
        'Development',
        'Infrastructure',
        'Missing User Knowledge',
        'Mistake',
        'Other CUS Requests',
        'Short Dump',
        'Workflow Issue',
        'ZtoolBox',
        'Others'
    ];

    useEffect(() => {
        // Check if we have a ticket ID from the router query
        if (router.location && router.location.search) {
            const params = new URLSearchParams(router.location.search);
            const ticketId = params.get('id');
            if (ticketId) {
                fetchTicketData(ticketId);
            }
        }

        // Add event listener to close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [router.location]);

    const fetchTicketData = (ticketId) => {
        // Simulating API fetch - in a real app, this would be a real API call
        // This data matches what we see in the images
        const mockData = {
            id: ticketId,
            title: "Return Sales Order BOM Item",
            priority: "Major",
            status: "Resolved",
            sla: "11:00",
            timeForResolution: "10 hrs",
            assignee: "ABC",
            materialId: "48097",
            resolutionType: "Fixed",
            incidentBasedOn: "None",
            incidentCategory: "None"
        };
        
        setTicketData(mockData);
        setResolutionType(mockData.resolutionType);
        setIncidentBasedOn(mockData.incidentBasedOn);
        setIncidentCategory(mockData.incidentCategory);
    };

    const handleClick = (item) => {
        setSelected(item);
    };

    const toggleDropdown = (dropdownName) => {
        setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    };

    const handleOptionSelect = (option, type) => {
        if (type === 'resolution') {
            setResolutionType(option);
        } else if (type === 'incidentBased') {
            setIncidentBasedOn(option);
        } else if (type === 'incidentCategory') {
            setIncidentCategory(option);
        }
        setActiveDropdown(null);
    };

    const handleAttachmentChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };
     const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          toast.error("Access token is missing. Please login.");
          return;
        }

    const handleSubmit = async () => {
        if (!resolutionDescription.trim()) {
            setError("Resolution description is required");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // Prepare the data for the API request
        const solutionData = {
            ticket: ticketData?.id || 1, // Use the ticket ID from the data or default to 1
            solution_text: resolutionDescription,
            resolution_type: resolutionType,
            incident_based_on: incidentBasedOn,
            incident_category: incidentCategory,
            comment: comment,
            user: 2, // Assuming user ID is available or using a default
            created_by: 2, // Same as user ID for now
            updated_by: 2, // Same as user ID for now
            org_group: 1 // Default org_group ID
        };

        try {
            // Create FormData if there are attachments
            let payload;
            if (attachments.length > 0) {
                const formData = new FormData();
                
                // Add JSON data
                formData.append('data', JSON.stringify(solutionData));
                
                // Add file attachments
                attachments.forEach((file, index) => {
                    formData.append(`attachment_${index}`, file);
                });
                
                payload = formData;
            } else {
                payload = JSON.stringify(solutionData);
            }

            // Make the API call
            const response = await axiosInstance.post('https://ticketing-tool-nug5.onrender.com/solution/create/', payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`, // Replace with actual token retrieval logic
                    ...(attachments.length === 0 && { 'Content-Type': 'application/json' })
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create solution');
            }

            const data = await response.json();
            console.log('Solution created successfully:', data);
            
            // Show success message
            alert("Solution provided and resolved successfully!");
            
            // Navigate back to tickets list or details page
            router.push('/tickets');
        } catch (err) {
            console.error('Error creating solution:', err);
            setError(err.message || 'An error occurred while creating the solution');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Dropdown component for reusability
    const Dropdown = ({ label, value, options, type, required = true, width = "w-full sm:w-[300px]" }) => (
        <div className="flex flex-wrap items-center gap-5 mb-6">
            <label className={`font-medium w-full sm:w-[120px] ${required ? 'after:content-["*"] after:text-red-500 after:ml-0.5' : ''}`}>
                {label}
            </label>
            <div ref={dropdownRef} className={`relative ${width}`}>
                <div 
                    onClick={() => toggleDropdown(type)}
                    className="border p-4 w-full rounded-md shadow-md flex justify-between items-center cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                >
                    <span className="truncate">{value}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${activeDropdown === type ? 'transform rotate-180' : ''}`} />
                </div>
                {activeDropdown === type && (
                    <div className="absolute z-20 bg-white w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {options.map((option, index) => (
                            <div 
                                key={index} 
                                className={`p-3 hover:bg-blue-100 cursor-pointer transition-colors ${option === value ? 'bg-[#2e6ec0] text-white' : ''}`}
                                onClick={() => handleOptionSelect(option, type)}
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex w-full min-h-screen ">
            <Sidebar />
            <main className="flex-1 mx-4 lg:mx-16">
                <div className="p-6">
                    {/* Header section */}
                    <div className="mb-8  p-6 rounded-xl ">
                        <div className="mb-4">
                            <h1 className="text-2xl md:text-3xl font-semibold text-[#293988]">Solution Provided and Resolved</h1>
                            <div className="flex flex-wrap justify-between w-full items-center mt-3 gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <h1 className="text-lg md:text-xl font-medium">{ticketData?.title || "Return Sales Order BOM Item"}</h1>
                                    <p className="flex text-md md:text-lg items-center text-[#F24E1E] font-bold bg-red-50 px-3 py-1 rounded-full">
                                        <ChevronsUp className="h-5 w-5 mr-1" /> {ticketData?.priority || "Major"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#C3E593] rounded-full py-1 px-4">
                                        <h1 className="font-bold">{ticketData?.status || "Resolved"}</h1>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="pl-10 pr-4 py-2 rounded-full border w-full md:w-[192px] border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex mt-4">
                                <ul className="flex gap-4 text-gray-500 text-sm">
                                    <li>Home</li>
                                    <li className="flex items-center before:content-['>'] before:mx-2">List of Incident</li>
                                    <li className="flex items-center before:content-['>'] before:mx-2">Details</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-6">
                            <div className="bg-gray-50 w-full sm:w-64 p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center px-2 mb-2">
                                    <p className="text-gray-700 font-medium">SLA:</p>
                                    <p className="text-lg font-semibold text-[#293988]">{ticketData?.sla || "11:00"}</p>
                                </div>
                                <p className="text-[#293988] px-2 text-sm">
                                    Time for Resolution: {ticketData?.timeForResolution || "10 hrs"}
                                </p>
                            </div>
                            <div className="bg-gray-50 w-full sm:w-64 p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center px-2 mb-2">
                                    <p className="text-gray-700 font-medium">People</p>
                                </div>
                                <p className="text-[#293988] px-2 text-sm">
                                    Assignee: {ticketData?.assignee || "ABC"}
                                </p>
                            </div>
                            <div className="bg-gray-50 w-full sm:w-64 p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center px-2 mb-2">
                                    <p className="text-gray-700 font-medium">Service Project Request</p>
                                </div>
                                <p className="text-[#293988] px-2 text-sm">
                                    Time for Resolution: <span className="text-red-500">No Match</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form section */}
                    <div className=" p-6 rounded-xl mb-8">
                        <div className="mx-2 lg:mx-8">
                            {/* Using the reusable Dropdown component */}
                            <Dropdown 
                                label="Resolution" 
                                value={resolutionType} 
                                options={resolutionOptions} 
                                type="resolution" 
                            />

                            <div className="flex flex-wrap items-center gap-5 mb-6">
                                <label className="font-medium w-full sm:w-[120px] after:content-['*'] after:text-red-500 after:ml-0.5">
                                    Resolution Description
                                </label>
                                <div className="w-full sm:flex-1">
                                    <textarea
                                        id="description"
                                        required
                                        value={resolutionDescription}
                                        onChange={(e) => setResolutionDescription(e.target.value)}
                                        className="border p-3 rounded-md w-full min-h-[120px] shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                        placeholder="Enter the resolution details..."
                                    />
                                    <p className="pl-2 text-sm text-gray-500 mt-1">Noteworthy details about fixing the issue or restoring service and necessary further repair actions.</p>
                                </div>
                            </div>

                            <Dropdown 
                                label="Incident Based on" 
                                value={incidentBasedOn} 
                                options={incidentBasedOnOptions} 
                                type="incidentBased" 
                            />

                            <Dropdown 
                                label="Incident Category" 
                                value={incidentCategory} 
                                options={incidentCategoryOptions} 
                                type="incidentCategory" 
                                width="w-full sm:w-[500px]"
                            />

                            <div className="flex flex-wrap items-center gap-5 mb-6">
                                <label htmlFor="attachment" className="font-medium w-full sm:w-[120px]">Attachment</label>
                                <div className="relative w-full sm:flex-1 group">
                                    <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
                                        <input
                                            type="file"
                                            id="attachment"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleAttachmentChange}
                                            multiple
                                        />
                                        <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors mb-2" />
                                        <p className="text-gray-500 group-hover:text-gray-700 transition-colors">Drop files to attach, or browse.</p>
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-medium text-gray-700">Selected files:</p>
                                            <ul className="list-disc pl-5 text-sm text-gray-600">
                                                {attachments.map((file, index) => (
                                                    <li key={index}>{file.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md">
                        {/* Navigation tabs */}
                        <div className="mb-6 mx-2 lg:mx-8">
                            <nav className="border-b border-gray-200">
                                <ul className="flex gap-8">
                                    <li
                                        onClick={() => handleClick('Comments')}
                                        className={`cursor-pointer pb-3 px-1 ${
                                            selected === 'Comments' 
                                            ? 'border-b-2 border-[#0066CC] text-[#0066CC] font-medium' 
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Comments
                                    </li>
                                    <li
                                        onClick={() => handleClick('Respond To Customer')}
                                        className={`cursor-pointer pb-3 px-1 ${
                                            selected === 'Respond To Customer' 
                                            ? 'border-b-2 border-[#0066CC] text-[#0066CC] font-medium' 
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Respond To Customer
                                    </li>
                                    <li
                                        onClick={() => handleClick('Internal Comment')}
                                        className={`cursor-pointer pb-3 px-1 ${
                                            selected === 'Internal Comment' 
                                            ? 'border-b-2 border-[#0066CC] text-[#0066CC] font-medium' 
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Internal Comment
                                    </li>
                                </ul>
                            </nav>
                            <p className="text-sm text-gray-500 mt-4">Your comment will be visible to customers. Embed attachments to make them visible to customers.</p>
                        </div>

                        {/* Comment section */}
                        <div className="mx-2 lg:mx-8">
                            <textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="border p-4 rounded-lg w-full min-h-[250px] shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                placeholder="Type your comment here..."
                            />

                            <div className="flex gap-2 mt-4">
                                <button className="bg-[#306EBF] text-white py-2 px-6 rounded-lg hover:bg-[#1C5CB8] transition-colors">Visual</button>
                                <button className="bg-white text-[#306EBF] py-2 px-6 rounded-lg border border-[#306EBF] hover:bg-gray-50 transition-colors">Text</button>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-4 mt-8">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`bg-[#104084] text-white py-2 px-8 rounded-lg hover:bg-[#0A3169] transition-colors w-auto sm:w-80 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Solution provided and resolved'}
                                </button>
                                <button 
                                    className="bg-white text-[#104084] py-2 px-8 rounded-lg border border-[#306EBF] hover:bg-gray-50 transition-colors"
                                    onClick={() => router.goBack()}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <ChatbotPopup/>
        </div>
    )
}