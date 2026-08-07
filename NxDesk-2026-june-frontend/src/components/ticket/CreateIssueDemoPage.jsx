import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InputField from '../common/InputField';
import Button from '../common/Button';
import axios from 'axios';  
import { disableButton } from '../../store/Slices/buttonSlice';
import {
  setTicketId, setIssueType, setRequestor, setAssignee, setProject,
  setSolutionGroup, setProduct, setSupportTeam, setRequestorCountry, setPriority,
  setDeveloperOrganisationName, setImpact, setUrgency, setReferenceTicket,
//   setTicketTitle,
   setTicketSummary, setTicketDescription
} from '../../features/auth/ticketCreationSlice';
import { axiosInstance } from '../../utils/axiosInstance';

const CreateIssue = () => {
    const dispatch = useDispatch();
    const inputs = useSelector((state) => state.ticketCreation);
    const create_ticket_api = process.env.CREATE_TICKET_API;

    const handleCreateTicket = async () => {
        try {
            const apiUrl = create_ticket_api;
            const response = await axiosInstance.post("ticket/create/", {
                number: inputs.ticketId,  
                issueType: inputs.issueType,
                requester: inputs.requestor,
                assignee: inputs.assignee,
                project: inputs.project,
                solutionGroup: inputs.solutionGroup,
                product: inputs.product,
                supportTeam: inputs.supportTeam,
                customerCountry: inputs.requestorCountry,
                priority: inputs.priority,
                supportOrgName: inputs.developerOrganisationName,
                impact: inputs.impact,
                urgency: inputs.urgency,
                referenceTicket: inputs.referenceTicket,
                summary: inputs.ticketSummary,
                description: inputs.ticketDescription,
            });

            if (response.status == 200) {
                console.log('Ticket Created Successfully', response.data);
            }

            console.log('Ticket Created Successfully', response.data);
            dispatch(disableButton());  
        } catch (error) {
            console.error('Error creating ticket:', error);
        }
    };

    return (
        <div className="p-6 bg-gray-100 rounded-xl">
            <h1 className="text-2xl font-bold mb-4">CREATE ISSUE</h1>
            <p className="text-sm mb-4">Required fields are marked with an asterisk *</p>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">
                        Number <span className="text-red-500">*</span>
                    </label>
                    <div className="w-2/3">
                        <InputField
                            name="number"
                            placeholder="Number"
                            value={inputs.ticketId}  
                            onChange={(e) => dispatch(setTicketId(e.target.value))}  
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Issue Type</label>
                    <div className="w-2/3">
                        <InputField
                            name="issueType"
                            placeholder="Issue Type"
                            value={inputs.issueType}
                            onChange={(e) => dispatch(setIssueType(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">
                        Requester <span className="text-red-500">*</span>
                    </label>
                    <div className="w-2/3">
                        <InputField
                            name="requester"
                            placeholder="Requester"
                            value={inputs.requestor}
                            onChange={(e) => dispatch(setRequestor(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Assignee</label>
                    <div className="w-2/3">
                        <InputField
                            name="assignee"
                            placeholder="Assignee"
                            value={inputs.assignee}
                            onChange={(e) => dispatch(setAssignee(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Project</label>
                    <div className="w-2/3">
                        <InputField
                            name="project"
                            placeholder="Project"
                            value={inputs.project}
                            onChange={(e) => dispatch(setProject(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Solution Group</label>
                    <div className="w-2/3">
                        <InputField
                            name="solutionGroup"
                            placeholder="Solution Group"
                            value={inputs.solutionGroup}
                            onChange={(e) => dispatch(setSolutionGroup(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Product</label>
                    <div className="w-2/3">
                        <InputField
                            name="product"
                            placeholder="Product"
                            value={inputs.product}
                            onChange={(e) => dispatch(setProduct(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Support Team</label>
                    <div className="w-2/3">
                        <InputField
                            name="supportTeam"
                            placeholder="Support Team"
                            value={inputs.supportTeam}
                            onChange={(e) => dispatch(setSupportTeam(e.target.value))}
                        />
                    </div>
                </div>

                {/* Missing Fields */}
                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Customer Country</label>
                    <div className="w-2/3">
                        <InputField
                            name="requestorCountry"
                            placeholder="Customer Country"
                            value={inputs.requestorCountry}
                            onChange={(e) => dispatch(setRequestorCountry(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Priority</label>
                    <div className="w-2/3">
                        <InputField
                            name="priority"
                            placeholder="Priority"
                            value={inputs.priority}
                            onChange={(e) => dispatch(setPriority(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Support Org Name</label>
                    <div className="w-2/3">
                        <InputField
                            name="supportOrgName"
                            placeholder="Support Org Name"
                            value={inputs.developerOrganisationName}
                            onChange={(e) => dispatch(setDeveloperOrganisationName(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Impact</label>
                    <div className="w-2/3">
                        <InputField
                            name="impact"
                            placeholder="Impact"
                            value={inputs.impact}
                            onChange={(e) => dispatch(setImpact(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Urgency</label>
                    <div className="w-2/3">
                        <InputField
                            name="urgency"
                            placeholder="Urgency"
                            value={inputs.urgency}
                            onChange={(e) => dispatch(setUrgency(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">Reference Ticket</label>
                    <div className="w-2/3">
                        <InputField
                            name="referenceTicket"
                            placeholder="Reference Ticket"
                            value={inputs.referenceTicket}
                            onChange={(e) => dispatch(setReferenceTicket(e.target.value))}
                        />
                    </div>
                </div>

                {/* Existing Fields */}
                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">
                        Summary <span className="text-red-500">*</span>
                    </label>
                    <div className="w-2/3">
                        <InputField
                            name="summary"
                            placeholder="Summary"
                            value={inputs.ticketSummary}
                            onChange={(e) => dispatch(setTicketSummary(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="w-1/3 font-medium text-gray-700">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <div className="w-2/3">
                        <InputField
                            name="description"
                            placeholder="Description"
                            value={inputs.ticketDescription}
                            onChange={(e) => dispatch(setTicketDescription(e.target.value))}
                            type="textarea"
                        />
                    </div>
                </div>
                <Button label="Create Ticket" onClick={handleCreateTicket} />
            </div>
        </div>
    );
};

export default CreateIssue;