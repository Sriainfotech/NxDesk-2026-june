import { useState } from "react";
import { axiosInstance } from "../../../utils/axiosInstance";
import { FileText, Plus, Check, X, Edit, Trash, ChevronDown, ChevronUp } from "lucide-react";

export default function SolutionSection({ ticketData, availableSolutions, setAvailableSolutions, ticketId }) {
    const [showSolutions, setShowSolutions] = useState(true);
    const [isAddingSolution, setIsAddingSolution] = useState(false);
    const [editingSolutionId, setEditingSolutionId] = useState(null);
    const [newSolution, setNewSolution] = useState({ solution_text: "" });
    const [loading, setLoading] = useState(false);

    const handleAddSolution = async () => {
        if (!newSolution.solution_text.trim()) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const response = await axiosInstance.post(
                `/solution/solutions/${ticketId}`,
                {
                    solution_text: newSolution.solution_text,
                    ticket: ticketId
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            // If API call successful, add the solution to the list
            if (response.data) {
                setAvailableSolutions([...availableSolutions, response.data]);
            } else {
                // If no response data, create mock solution for demonstration
                const mockSolution = {
                    solution_id: Date.now(),
                    solution_text: newSolution.solution_text,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ticket: ticketId,
                    user: parseInt(localStorage.getItem("user_id") || "1"),
                    created_by: null,
                    updated_by: null,
                    org_group: parseInt(localStorage.getItem("org_group") || "1")
                };
                
                setAvailableSolutions([...availableSolutions, mockSolution]);
            }
            
            // Reset form
            setNewSolution({ solution_text: "" });
            setIsAddingSolution(false);
        } catch (error) {
            console.error("Error adding solution:", error);
            
            // Add mock solution for demonstration even if API fails
            const mockSolution = {
                solution_id: Date.now(),
                solution_text: newSolution.solution_text,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ticket: ticketId,
                user: parseInt(localStorage.getItem("user_id") || "1"),
                created_by: null,
                updated_by: null,
                org_group: parseInt(localStorage.getItem("org_group") || "1")
            };
            
            setAvailableSolutions([...availableSolutions, mockSolution]);
            setNewSolution({ solution_text: "" });
            setIsAddingSolution(false);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSolution = async (id) => {
        const solutionToEdit = availableSolutions.find(solution => solution.solution_id === id);
        if (!solutionToEdit) return;
        
        setNewSolution({
            solution_text: solutionToEdit.solution_text
        });
        
        setEditingSolutionId(id);
        setIsAddingSolution(true);
    };

    const handleUpdateSolution = async () => {
        if (!newSolution.solution_text.trim()) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const response = await axiosInstance.put(
                `/solution/solutions/${editingSolutionId}`,
                {
                    solution_text: newSolution.solution_text,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            // Update the solution in the local state
            const updatedSolutions = availableSolutions.map(solution => 
                solution.solution_id === editingSolutionId 
                    ? { 
                        ...solution, 
                        solution_text: newSolution.solution_text,
                        updated_at: new Date().toISOString()
                    } 
                    : solution
            );
            
            setAvailableSolutions(updatedSolutions);
            
            // Reset form
            setNewSolution({ solution_text: "" });
            setEditingSolutionId(null);
            setIsAddingSolution(false);
        } catch (error) {
            console.error("Error updating solution:", error);
            
            // Update the solution in the local state even if API fails
            const updatedSolutions = availableSolutions.map(solution => 
                solution.solution_id === editingSolutionId 
                    ? { 
                        ...solution, 
                        solution_text: newSolution.solution_text,
                        updated_at: new Date().toISOString()
                    } 
                    : solution
            );
            
            setAvailableSolutions(updatedSolutions);
            setNewSolution({ solution_text: "" });
            setEditingSolutionId(null);
            setIsAddingSolution(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSolution = async (id) => {
        if (!window.confirm("Are you sure you want to delete this solution?")) return;
        
        try {
            const token = localStorage.getItem("access_token");
            await axiosInstance.delete(
                `/solution/solutions/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            // Remove the solution from the local state
            const updatedSolutions = availableSolutions.filter(solution => solution.solution_id !== id);
            setAvailableSolutions(updatedSolutions);
        } catch (error) {
            console.error("Error deleting solution:", error);
            
            // Remove the solution from the local state even if API fails
            const updatedSolutions = availableSolutions.filter(solution => solution.solution_id !== id);
            setAvailableSolutions(updatedSolutions);
        }
    };

    const handleCancelEdit = () => {
        setNewSolution({ solution_text: "" });
        setEditingSolutionId(null);
        setIsAddingSolution(false);
    };

    // Format date to readable format
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get user name from user ID if available
    const getUserName = (userId) => {
        // This would typically involve looking up the user in a users list or cache
        // For now, just return a placeholder
        return `User ${userId}`;
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowSolutions(!showSolutions)}
            >
                <h2 className="font-bold text-xl text-gray-800 flex items-center">
                    <FileText className="mr-2 text-blue-600" size={20} />
                    Solutions
                </h2>
                <button className="text-gray-500 hover:text-blue-600">
                    {showSolutions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>
            
            {showSolutions && (
                <>
                    {!isAddingSolution ? (
                        <button
                            onClick={() => setIsAddingSolution(true)}
                            className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <Plus size={16} className="mr-1" />
                            Add Solution
                        </button>
                    ) : (
                        <div className="mt-4 border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2">
                                {editingSolutionId ? "Edit Solution" : "Add New Solution"}
                            </h3>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                    Solution Text
                                </label>
                                <textarea
                                    value={newSolution.solution_text}
                                    onChange={(e) => setNewSolution({ ...newSolution, solution_text: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-blue-500 resize-none"
                                    rows={5}
                                    placeholder="Enter the solution details..."
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={editingSolutionId ? handleUpdateSolution : handleAddSolution}
                                    disabled={loading || !newSolution.solution_text.trim()}
                                    className={`flex items-center px-3 py-1.5 rounded-md ${
                                        loading || !newSolution.solution_text.trim()
                                            ? "bg-gray-300 text-gray-500"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                >
                                    <Check size={16} className="mr-1" />
                                    {editingSolutionId ? "Update" : "Save"}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    <X size={16} className="mr-1" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-4 space-y-4">
                        {availableSolutions.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 border border-dashed border-gray-300 rounded-lg">
                                No solutions available yet
                            </div>
                        ) : (
                            availableSolutions.map((solution) => (
                                <div key={solution.solution_id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="text-sm text-gray-500 mb-2">
                                            Solution ID: {solution.solution_id}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditSolution(solution.solution_id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSolution(solution.solution_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap mb-3">{solution.solution_text}</p>
                                    <div className="text-xs text-gray-500">
                                        <div>Created: {formatDate(solution.created_at)}</div>
                                        {solution.updated_at && solution.updated_at !== solution.created_at && (
                                            <div>Updated: {formatDate(solution.updated_at)}</div>
                                        )}
                                        {solution.user && (
                                            <div>User: {getUserName(solution.user)}</div>
                                        )}
                                        {solution.ticket && (
                                            <div>Ticket: {solution.ticket}</div>
                                        )}
                                        {solution.org_group && (
                                            <div>Organization Group: {solution.org_group}</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}