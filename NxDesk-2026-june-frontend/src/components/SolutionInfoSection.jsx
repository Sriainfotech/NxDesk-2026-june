// File: components/TicketDetails/SolutionSection.jsx
import { useState, useEffect } from "react";
import { axiosInstance } from "../utils/axiosInstance";
import { Check, Edit, Loader } from "lucide-react";
import decodeJwtToken from "../utils/jwtDecode";
import { toast, ToastContainer } from "react-toastify";

export default function SolutionSection({ ticketData, availableSolutions, setAvailableSolutions, ticketId }) {
    const [solutionInput, setSolutionInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSolution, setSelectedSolution] = useState(
        availableSolutions.length > 0 ? availableSolutions[0] : null
    );
    const [isEditing, setIsEditing] = useState(false);
    const [editInput, setEditInput] = useState("");

    const token = decodeJwtToken(localStorage.getItem("access_token"));
    console.log(token);
    console.log(token.user_id);

    const [solutionSteps, setSolutionSteps] = useState([]);

    useEffect(() => {
        if (selectedSolution) {
            parseSolutionSteps(selectedSolution.solution_text);
        }
    }, [selectedSolution]);

    const parseSolutionSteps = (solutionText) => {
        try {
            // Check if there are step markers in the text
            if (solutionText.includes("STEP") || solutionText.includes("Step")) {
                // Simple regex to extract steps
                const stepRegex = /(STEP|Step)\s*(\d+)[:\s]*(.*?)(?=(?:STEP|Step)\s*\d+|$)/gs;
                const matches = [...solutionText.matchAll(stepRegex)];
                
                if (matches.length > 0) {
                    const extractedSteps = matches.map((match, index) => {
                        const stepTitle = `${match[1]} ${match[2]}`;
                        const stepContent = match[3].trim();
                        
                        // Split step content into bullet points
                        const items = stepContent
                            .split(/\n|•|\./)
                            .filter(item => item.trim().length > 0)
                            .map(item => item.trim());
                        
                        return {
                            title: stepTitle,
                            items: items.length > 0 ? items : ["No details provided for this step"]
                        };
                    });
                    
                    setSolutionSteps(extractedSteps);
                    return;
                }
            }
            
            // If no steps found, create a default step with the entire solution
            setSolutionSteps([{
                title: "SOLUTION",
                items: [solutionText]
            }]);
        } catch (error) {
            console.error("Error parsing solution steps:", error);
            // Fallback to default
            setSolutionSteps([{
                title: "SOLUTION",
                items: [solutionText]
            }]);
        }
    };

    const handleSolutionSubmit = async () => {
        if (!solutionInput.trim()) {
            alert("Please enter a solution");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("access_token");
            const solutionData = {
                ticket: ticketId,
                solution_text: solutionInput,
                user: ticketData?.assignee || 2,
                created_by: token.user_id || ticketData.created_by || 1,
                updated_by: token.user_id || ticketData.assignee|| 1,
                org_group: 1,
            };

            const response = await axiosInstance.post("/solution/create/", solutionData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            // Refetch available solutions to update the list
            const availableSolutionsResponse = await axiosInstance.get(`solution/solutions/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const solutions = availableSolutionsResponse.data || [];
            setAvailableSolutions(solutions);
            if (solutions.length > 0) {
                setSelectedSolution(response.data || solutions[0]); 
            }

            setSolutionInput(""); // Clear input after submission
            toast.success("Solution submitted successfully!");
        } catch (error) {
            console.error("Error submitting solution:", error);
            toast.error("Failed to submit solution. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectSolution = (solution) => {
        setSelectedSolution(solution);
        setIsEditing(false);
    };

    const handleEditSolution = () => {
        if (selectedSolution) {
            setEditInput(selectedSolution.solution_text);
            setIsEditing(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!editInput.trim()) {
            alert("Solution cannot be empty");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("access_token");
            
            const updateData = {
                solution_text: editInput,
                updated_by: localStorage.getItem("user_id") || 1,
            };

            await axiosInstance.patch(`/solution/update/${selectedSolution.solution_id}/`, updateData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            // Refetch available solutions to update the list
            const availableSolutionsResponse = await axiosInstance.get(`solution/solutions/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const solutions = availableSolutionsResponse.data || [];
            setAvailableSolutions(solutions);
            
            // Find the updated solution
            const updatedSolution = solutions.find(s => s.solution_id === selectedSolution.solution_id);
            if (updatedSolution) {
                setSelectedSolution(updatedSolution);
            }

            setIsEditing(false);
            alert("Solution updated successfully!");
        } catch (error) {
            console.error("Error updating solution:", error);
            alert("Failed to update solution. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format date to a readable format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Check if user is an admin or assignee (allowed to edit solutions)
    const canEditSolution = () => {
        const userRole = localStorage.getItem("user_role");
        const userId = token.user_id 
        
        return (ticketData?.assignee && token.user_id === ticketData.assignee);
    };

    console.log("Available Solutions:", ticketData);

    return (
        <div className="bg-white p-4 px-7 my-10 rounded-xl">
            <h1 className="font-bold text-xl my-5">Solution</h1>

            {availableSolutions.length > 0 ? (
                <div>
                    {availableSolutions.length > 1 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Available Solutions ({availableSolutions.length})</h3>
                            <div className="flex flex-wrap gap-3">
                                {availableSolutions.map((solution, index) => (
                                    <button
                                        key={solution.solution_id}
                                        onClick={() => handleSelectSolution(solution)}
                                        className={`px-4 py-2 rounded-lg ${selectedSolution && selectedSolution.solution_id === solution.solution_id
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        Solution #{index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedSolution && (
                        <div className="border p-4 rounded-lg">
                            <div className="flex justify-between mb-3">
                                <span className="text-sm text-gray-500">Solution ID: {selectedSolution.solution_id}</span>
                                <span className="text-sm text-gray-500">Created: {formatDate(selectedSolution.created_at)}</span>
                            </div>
                            
                            {isEditing ? (
                                <div>
                                    <textarea
                                        value={editInput}
                                        onChange={(e) => setEditInput(e.target.value)}
                                        className="w-full p-2 border rounded-md mb-2"
                                        rows="8"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={isSubmitting}
                                            className={`px-4 py-2 rounded-md flex items-center ${
                                                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-600"
                                            }`}
                                        >
                                            {isSubmitting ? (
                                                <><Loader size={16} className="animate-spin mr-2" /> Saving...</>
                                            ) : (
                                                <><Check size={16} className="mr-2" /> Save</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        {canEditSolution() && (
                                            <button
                                                onClick={handleEditSolution}
                                                className="float-right p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                                                title="Edit Solution"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                        <p className="whitespace-pre-line">{selectedSolution.solution_text}</p>
                                    </div>
                                    
                                    {/* Solution steps visualization */}
                                    {solutionSteps.length > 0 && (
                                        <div className="relative w-full pt-16 mt-6 border-t">
                                            <div className="absolute top-6 left-0 right-0 h-[4px] bg-gray-200" />
                                            <div className={`grid grid-cols-1 ${solutionSteps.length > 1 ? "md:grid-cols-" + Math.min(solutionSteps.length, 4) : ""} gap-6 relative`}>
                                                {solutionSteps.map((step, index) => (
                                                    <div key={index} className="space-y-4">
                                                        <h3 className="bg-white pr-4 inline-block relative z-10 text-lg font-bold">{step.title}</h3>
                                                        <ul className="space-y-3 text-sm text-gray-600 font-medium">
                                                            {step.items.map((item, itemIndex) => (
                                                                <li key={itemIndex} className="flex items-start">
                                                                    <span className="mr-2">•</span>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <p className="text-gray-500 italic">No solution has been provided for this ticket yet.</p>
                    {ticketData?.status !== "Resolved" && 
                     ticketData?.status !== "Closed" && 
                     ticketData?.status !== "Cancelled" && 
                     canEditSolution() && (
                        <div className="mt-4">
                            <textarea
                                value={solutionInput}
                                onChange={(e) => setSolutionInput(e.target.value)}
                                placeholder="Enter solution here... (You can use 'STEP 1:', 'STEP 2:' to organize the solution)"
                                className="w-full p-2 border rounded-md mb-2"
                                rows="6"
                            />
                            <button
                                onClick={handleSolutionSubmit}
                                disabled={isSubmitting}
                                className={`bg-blue-500 text-white px-4 py-2 rounded-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                                    }`}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Solution"}
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Add new solution button when there are already solutions */}
            {availableSolutions.length > 0 && 
             ticketData?.status !== "Resolved" && 
             ticketData?.status !== "Closed" && 
             ticketData?.status !== "Cancelled" && 
             canEditSolution() && (
                <div className="mt-6">
                    <details className="border rounded-md p-3">
                        <summary className="font-medium cursor-pointer">Add Another Solution</summary>
                        <div className="mt-3">
                            <textarea
                                value={solutionInput}
                                onChange={(e) => setSolutionInput(e.target.value)}
                                placeholder="Enter new solution here... (You can use 'STEP 1:', 'STEP 2:' to organize the solution)"
                                className="w-full p-2 border rounded-md mb-2"
                                rows="6"
                            />
                            <button
                                onClick={handleSolutionSubmit}
                                disabled={isSubmitting}
                                className={`bg-blue-500 text-white px-4 py-2 rounded-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                                    }`}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Solution"}
                            </button>
                        </div>
                    </details>
                </div>
            )}
            <ToastContainer/>
        </div>
    );
}