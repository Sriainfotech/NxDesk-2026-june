import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ticketId: '',
  issueType: '',
  requestor: '',
  assignee: '',
  project: '',
  solutionGroup: '',
  product: '',
  supportTeam: '',
  requestorCountry: '',
  priority: '',
  developerOrganisationName: '',
  impact: '',
  urgency: '',
  referenceTicket: '',
  ticketTitle: '',
  ticketSummary: '',
  ticketDescription: '',
  status: '',
  createdOn: '',
  lastModified: '',
  isResolved: false,  
};

const ticketCreationSlice = createSlice({
  name: 'ticketCreation',
  initialState,
  reducers: {
    setTicketId: (state, action) => {
      state.ticketId = action.payload;
    },
    setIssueType: (state, action) => {
      state.issueType = action.payload;
    },
    setRequestor: (state, action) => {
      state.requestor = action.payload;
    },
    setAssignee: (state, action) => {
      state.assignee = action.payload;
    },
    setProject: (state, action) => {
      state.project = action.payload;
    },
    setSolutionGroup: (state, action) => {
      state.solutionGroup = action.payload;
    },
    setProduct: (state, action) => {
      state.product = action.payload;
    },
    setSupportTeam: (state, action) => {
      state.supportTeam = action.payload;
    },
    setRequestorCountry: (state, action) => {
      state.requestorCountry = action.payload;
    },
    setPriority: (state, action) => {
      state.priority = action.payload;
    },
    setDeveloperOrganisationName: (state, action) => {
      state.developerOrganisationName = action.payload;
    },
    setImpact: (state, action) => {
      state.impact = action.payload;
    },
    setUrgency: (state, action) => {
      state.urgency = action.payload;
    },
    setReferenceTicket: (state, action) => {
      state.referenceTicket = action.payload;
    },
    setTicketTitle: (state, action) => {
      state.ticketTitle = action.payload;
    },
    setTicketSummary: (state, action) => {
      state.ticketSummary = action.payload;
    },
    setTicketDescription: (state, action) => {
      state.ticketDescription = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setCreatedOn: (state, action) => {
      state.createdOn = action.payload;
    },
    setLastModified: (state, action) => {
      state.lastModified = action.payload;
    },
    setIsResolved: (state, action) => {
      state.isResolved = action.payload;
    },

    clearTicketState: (state) => {
      state.ticketId = '';
      state.issueType = '';
      state.requestor = '';
      state.assignee = '';
      state.project = '';
      state.solutionGroup = '';
      state.product = '';
      state.supportTeam = '';
      state.requestorCountry = '';
      state.priority = '';
      state.developerOrganisationName = '';
      state.impact = '';
      state.urgency = '';
      state.referenceTicket = '';
      state.ticketTitle = '';
      state.ticketSummary = '';
      state.ticketDescription = '';
      state.status = '';
      state.createdOn = '';
      state.lastModified = '';
      state.isResolved = false;
    },
  },
});

export const {
  setTicketId,
  setIssueType,
  setRequestor,
  setAssignee,
  setProject,
  setSolutionGroup,
  setProduct,
  setSupportTeam,
  setRequestorCountry,
  setPriority,
  setDeveloperOrganisationName,
  setImpact,
  setUrgency,
  setReferenceTicket,
  setTicketTitle,
  setTicketSummary,
  setTicketDescription,
  setStatus,
  setCreatedOn,
  setLastModified,
  setIsResolved,
  clearTicketState,
} = ticketCreationSlice.actions;

export default ticketCreationSlice.reducer;
