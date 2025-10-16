"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../../components/Sidebar";
import ChatbotPopup from "../../components/ChatBot";
import ReferenceTicketSelector from "./Components/ReferenceTicketSelector";
import QuillTextEditor from "./Components/QuillTextEditor";
import CKTextEditor from "./Components/QuillTextEditor";
import { axiosInstance } from "../../utils/axiosInstance";
import SearchableField from "./Components/SearchableField";
import { ChevronLeft, Paperclip, Image, Send } from "lucide-react";
import ResolutionPopup from "../../components/ResolutionPopup";
import {
  selectActiveServiceDomain,
  selectActiveServiceType,
} from "../../store/Slices/serviceDomainSlice";
import { format } from "libphonenumber-js";
import Select from "react-select";
import { use } from "react";
import AssigneeSearchableField from "./Components/AssigneeSearchableField";
import {
  Building2,
  Settings,
  User,
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  AlertTriangle,
  Target
} from "lucide-react";

export default function CreateIssue() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOptionalFieldsOpen, setIsOptionalFieldsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const fileInputRef = useRef(null);
  const userProfile = useSelector((state) => state.userProfile.user);
  const [showDescription, setShowDescription] = useState(true);
  const [expandEditor, setExpandEditor] = useState(false);
  const editorRef = useRef(null);
  const [currentTab, setCurrentTab] = useState("Notes");
  const [activityLog, setActivityLog] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [historySearch, setHistorySearch] = useState("");
  const imageInputRef = useRef(null);

  const [ticketNotes, setTicketNotes] = useState([]);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [attachments, setAttachments] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const [assignedProjects, setAssignedProjects] = useState([]);
  const [requestorList, setRequestorList] = useState([]);

  const [usersListWithOrganisations, setUsersListWithOrganisations] = useState(
    []
  );
  const [requestorEmpList, setRequestorEmpList] = useState([]);

  const ordId = userProfile?.organisation_id || null;

  // acttive category and selected service from redux


  // Selectors
  const activeServiceDomain = useSelector(selectActiveServiceDomain);
  const activeServiceType = useSelector(selectActiveServiceType);

  // This is used to highlight the field when it is focused
  const [focusedField, setFocusedField] = useState(null);

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const [formData, setFormData] = useState({
    number: "",
    requestor: "",
    customerCountry: "india",
    supportOrgName: "",
    assignee: "",
    solutionGroup: "",
    referenceTicket: [],
    description: "",
    summary: "",
    serviceDomain: "",
    serviceType: "",
    impact: "",
    supportTeam: "",
    project: "",
    product: "",
    priority: "",
    email: "",
    developerOrganization: "",
    contactNumber: "",
    contactMode: "",
    search: "",
    ticketOrganisation: "",
  });

  const [solutionGroupList, setSolutionGroupList] = useState([]);
  const [organizationsList, setOrganizationsList] = useState([]);
  const [supportTeamList, setSupportTeamList] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [impactList, setImpactList] = useState([]);
  const [contactModeList, setContactModeList] = useState([]);
  const [priorityList, setPriorityList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [roleBasedAssignee, setRoleBasedAssignee] = useState([]);

  const [resolutionCodes, setResolutionCodes] = useState([
    { id: 1, name: "Fixed" },
    { id: 2, name: "Workaround Provided" },
    { id: 3, name: "Configuration Change" },
    { id: 4, name: "No Action Required" },
    { id: 5, name: "Duplicate" },
  ]);

  // Fetch ticket details data
  const fetchTicketDetails = async (ticketId) => {
    setDetailsLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Access token missing. Please log in.");
        return;
      }

      if (!ticketId) {
        setDetailsLoading(false);
        return;
      }

      // Replace with your actual ticket details endpoint
      const response = await axiosInstance.get(
        `/ticket/ticket-details/${ticketId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      setTicketDetails(response.data);
    } catch (error) {
      console.error("Error fetching Incident details:", error);
      // toast.error("Failed to load ticket details");
    } finally {
      setDetailsLoading(false);
    }
  };
  const fetchMessages = async (ticketId) => {
    try {
      const accessToken = localStorage.getItem("access_token");
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => {
        const objectUrl = URL.createObjectURL(file); // Create a local URL for preview
        return {
          id: `local-${Date.now()}-${Math.random()}`, // Temporary ID for local files
          name: file.name,
          type: file.type,
          size: file.size,
          file: file, // Store the actual File object for later upload
          previewUrl: objectUrl, // URL for preview
          isLocal: true, // Flag to indicate this is a local file
        };
      });

      setAttachments((prev) => [...prev, ...newFiles]);
    }

    // Reset the file input so the same file can be selected again
    e.target.value = "";
  };
  // const handleKeyPress = (e) => {
  //   if (e.key === "Enter" && !e.shiftKey) {
  //     e.preventDefault();
  //     sendMessage();
  //   }
  // };
  // const sendMessage = async () => {
  //   if (!newMessage.trim() && attachments.length === 0) return;

  //   try {
  //     const accessToken = localStorage.getItem("access_token");
  //     if (!accessToken) {
  //       toast.error("Access token missing. Please log in.");
  //       return;
  //     }

  //     // First, upload any local files
  //     let uploadedAttachments = [];
  //     for (const attachment of attachments) {
  //       if (attachment.isLocal) {
  //         const fileFormData = new FormData();
  //         fileFormData.append("attachments", attachment.file);
  //         fileFormData.append("ticket", formData.number);
  //           fileFormData.append("title", newMessage || "Attachment Added");
  //         console.log("Attachments FormData", fileFormData);
  //         const response = await axiosInstance.post(
  //           "/ticket/reports/",
  //           fileFormData,
  //           {
  //             headers: {
  //               Authorization: `Bearer ${accessToken}`,
  //               "Content-Type": "multipart/form-data",
  //             },
  //           }
  //         );

  //         // Assuming the response contains the uploaded file details
  //         const uploadedFile = response.data;
  //         uploadedAttachments.push({
  //           id: uploadedFile.id,
  //           name: attachment.name,
  //           type: attachment.type,
  //           url: uploadedFile.file_url,
  //         });
  //       } else {
  //         uploadedAttachments.push(attachment); // Already uploaded files
  //       }
  //     }

  //     // Create array of attachment IDs for the API request
  //     const attachmentIds = uploadedAttachments
  //       .map((att) => att.id)
  //       .filter((id) => typeof id === "number");

  //     // Add message to UI immediately for responsive feeling
  //     const tempMessage = {
  //       id: `temp-${Date.now()}`,
  //       text: newMessage,
  //       timestamp: "Sending...",
  //       isCurrentUser: true,
  //       user: userProfile.first_name || "You",
  //       attachments: [...uploadedAttachments],
  //     };

  //     setMessages((prev) => [...prev, tempMessage]);

  //     setNewMessage("");
  //     setAttachments([]);

  //     // Revoke object URLs to prevent memory leaks
  //     attachments.forEach((att) => {
  //       if (att.previewUrl && att.previewUrl.startsWith("blob:")) {
  //         URL.revokeObjectURL(att.previewUrl);
  //       }
  //     });

  //     // Refresh messages to ensure we have the latest data
  //     fetchMessages(formData.number);
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     toast.error("Failed to send message and attachments");

  //     // Remove the temp message if sending failed
  //     setMessages((prev) =>
  //       prev.filter((msg) => msg.id !== `temp-${Date.now()}`)
  //     );
  //   }
  // };
  // Fetch ticket notes data
  const fetchTicketNotes = async (ticketId) => {
    setNotesLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Access token missing. Please log in.");
        return;
      }

      if (!ticketId) {
        setNotesLoading(false);
        return;
      }

      // Use the actual endpoint for notes
      const response = await axiosInstance.get(`/ticket/attachments/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        ticketId,
        params: { ticket: ticketId },
      });

      // Filter notes for the current ticket if needed
      const filteredNotes = response.data.filter(
        (note) => note.ticket === ticketId
      );
      setTicketNotes(filteredNotes);
    } catch (error) {
      console.error("Error fetching Incident notes:", error);
      // toast.error("Failed to load ticket notes");
    } finally {
      setNotesLoading(false);
    }
  };
  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleImageAttachment = () => {
    imageInputRef.current?.click();
  };

  const fetchHistoryData = async (ticketId) => {
    setHistoryLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Access token missing. Please log in.");
        return;
      }

      // If creating a new ticket, we don't have a ticket ID yet
      if (!ticketId) {
        // Only show creation history for new tickets
        setHistoryData([
          {
            id: 1,
            type: "Issue Creation",
            user: formData.requestor || "System",
            timestamp: new Date().toLocaleString(),
            changes: [
              {
                field: "Issue Number",
                originalValue: "",
                newValue: formData.number,
              },
              {
                field: "Created By",
                originalValue: "",
                newValue: formData.requestor,
              },
            ],
          },
        ]);
        setHistoryLoading(false);
        return;
      }

      // For existing tickets, fetch history from API - use the new endpoint
      const response = await axiosInstance.get(`/ticket/history/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { ticket: ticketId },
      });

      // Transform API data to match our format
      const formattedHistory = response.data.map((item) => ({
        id: item.history_id,
        type: item.title,
        user: "", // The API doesn't provide this
        timestamp: new Date(item.modified_at).toLocaleString(),
        changes: [
          { field: "Action", originalValue: "-", newValue: item.title },
        ],
      }));

      setHistoryData(formattedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
      // toast.error("Failed to load history data");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Add a new note
  // const addNote = async () => {
  //   if (!newNote.trim()) return;

  //   try {
  //     const accessToken = localStorage.getItem("access_token");
  //     if (!accessToken) {
  //       toast.error("Access token missing. Please log in.");
  //       return;
  //     }

  //     // Call the API to add a new note
  //     const response = await axiosInstance.post(
  //       "/ticket/reports/",
  //       {
  //         title: newNote,
  //         ticket: formData.number,
  //       },
  //       { headers: { Authorization: `Bearer ${accessToken}` } }
  //     );

  //     // Add to local state for immediate UI update
  //     setTicketNotes([response.data, ...ticketNotes]);

  //     // Clear the input field
  //     setNewNote("");

  //     // Refresh the notes to ensure we have the latest data
  //     fetchTicketNotes(formData.number);
  //   } catch (error) {
  //     console.error("Error adding note:", error);
  //     toast.error("Failed to add note");
  //   }
  // };

  // Handle resolution
  const handleResolve = async (e) => {
    e.preventDefault();

    if (!formData.resolutionNotes || !formData.resolutionCode) {
      toast.error(
        "Resolution notes and code are required to resolve the incident."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      setTimeout(() => {
        setFormData({
          ...formData,
          state: "Resolved",
          resolvedBy: formData.requestor,
          resolvedDate: new Date().toLocaleString(),
        });

        setIsLoading(false);

        // Add to activity log
        setActivityLog([
          {
            user: formData.requestor,
            timestamp: new Date().toLocaleString(),
            type: "Resolution",
            changes: [
              { field: "State", value: "Resolved" },
              { field: "Resolution Code", value: formData.resolutionCode },
            ],
          },
          ...activityLog,
        ]);
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("There was an error resolving the incident.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Function to handle clicks outside the editor
    const handleClickOutside = (event) => {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        setFocusedField(null);
      }
    };

    // Add event listener when the editor is expanded
    if (expandEditor) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandEditor]);

  useEffect(() => {
    if (userProfile?.username && userProfile?.email) {
      setFormData((prev) => ({
        ...prev,
        requestor: userProfile?.username,
        email: userProfile?.email,
        ticketOrganisation: userProfile?.organisation_name || "",
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeServiceDomain) {
      setFormData((prev) => ({
        ...prev,
        serviceDomainObj: activeServiceDomain,
        serviceTypeObj: activeServiceType,
      }));
    }
  }, [activeServiceDomain, activeServiceType]);

  const fetchTicketId = async () => {
    const accessToken = localStorage.getItem("access_token");

    const authHeaders = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    try {
      const response = await axiosInstance.get("ticket/getId/", authHeaders);

      const ticketNumber = response.data;

      // FIXED: Set defaults after all data is loaded, with proper state update
      setFormData((prev) => {
        const updatedData = {
          ...prev,
          number: ticketNumber,
          search: `Issue - ${ticketNumber}`,
        };

        return updatedData;
      });
    } catch (error) {
      console.error("Error fetching Incident ID:", error);
      toast.error("Failed to fetch Incident ID. Please try again.");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form data before validation:", formData); // Debug log

    if (!validateForm()) {
      console.log("Validation failed:", formErrors); // Debug log
      return;
    }

    setIsLoading(true);
    const accessToken = localStorage.getItem("access_token");

    try {
      const response = await axiosInstance.post(
        "/ticket/create/",
        convertFormDataToSnakeCase(formData),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const ticketId = response.data.ticket_id;

      // Add history entries
      const addHistoryEntry = async (title, ticketId) => {
        try {
          await axiosInstance.post(
            "ticket/history/",
            { title: title, ticket: ticketId },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
        } catch (error) {
          console.error("Error adding history entry:", error);
        }
      };

      await addHistoryEntry("Incident created", ticketId);

      if (formData.assignee && formData.assignee.trim() !== "") {
        await addHistoryEntry(
          `Incident directly assigned to ${formData.assignee}`,
          ticketId
        );
      } else {
        await addHistoryEntry(
          "Incident sent to dispatcher for assignment",
          ticketId
        );
      }
      console.log("Incident created successfully", convertFormDataToSnakeCase(formData));
      toast.success(`Incident ${ticketId} raised successfully`);
      fetchTicketId();

      // FIXED: Reset form with proper default values maintained
      setFormData((prev) => {
        const resetData = {
          ...prev,
          number: "",
          requestor: userProfile?.username || "",
          customerCountry: "india",
          supportOrgName: "",
          assignee: "",
          solutionGroup: "",
          referenceTicket: [],
          description: "",
          summary: "",
          supportTeam: "",
          project: "",
          product: "",
          email: userProfile?.email || "",
          developerOrganization: "",
          contactNumber: "",
          contactMode: "",
          search: "",
          ticketOrganisation: userProfile?.organisation_name || "",
        };

        // Maintain the default Low priority and impact after reset
        if (priorityList.length > 0) {
          const priorityLowChoice = priorityList.find(
            (choice) => choice.urgency_name.toLowerCase() === "low"
          );
          if (priorityLowChoice) {
            resetData.priority = priorityLowChoice.priority_id;
          } else {
            resetData.priority = priorityList[0].priority_id;
          }
        }

        if (impactList.length > 0) {
          const impactLowChoice = impactList.find(
            (choice) => choice[1].toLowerCase() === "low"
          );
          if (impactLowChoice) {
            resetData.impact = impactLowChoice[0];
          } else {
            resetData.impact = impactList[0][0];
          }
        }

        return resetData;
      });

      setAttachments([]);
      setNewMessage("");
      setExpandEditor(false);
      setFormErrors({});
      setTimeout(() => {
        navigate(`/request-issue/application-support/sap/resolve-issue/${ticketId}`);
      }, 3000);
    } catch (error) {
      console.log("Incident Not Creating", error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        for (const [field, message] of Object.entries(errors)) {
          if (field === "summary") {
            toast.error("Summary should not contain more than 250 characters.");
          } else {
            toast.error(`${field}: ${message}`);
          }
        }
      } else {
        toast.error("Network or server error.");
      }
    } finally {
      setIsLoading(false);
    }
  };

    const flattenEmployees = (data, parentInfo = null) => {
    let result = [];

    data.forEach((entry) => {
      const { children, ...employeeData } = entry;

      result.push({
        ...employeeData,
        isChild: parentInfo !== null,
        parentUsername: parentInfo?.username || null,
        parentId: parentInfo?.employee_id || null,
      });

      if (children && Array.isArray(children) && children.length > 0) {
        const childEntries = flattenEmployees(children, {
          username: employeeData.username,
          employee_id: employeeData.employee_id,
        });
        result = result.concat(childEntries);
      }
    });

    return result;
  };

  // 1. Fix the useEffect that sets default values
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          toast.error("Access token missing. Please log in.");
          return;
        }

        const authHeaders = {
          headers: { Authorization: `Bearer ${accessToken}` },
        };

        const [
          subGroupsList,
          orgList,
          choicesList,
          activeUsersList,
          priorityList,
          nextTicketId,
          assignedProjectsResponse,
          usersListWithOrganisations,
          userRole,
          requestorEmployeesList,
        ] = await Promise.all([
          axiosInstance.get("solution_grp/create/", authHeaders),
          axiosInstance.get("org/organisation/", authHeaders),
          axiosInstance.get("ticket/ticket/choices/", authHeaders),
          axiosInstance.get("user/api/assignee/", authHeaders),
          axiosInstance.get("priority/priority/", authHeaders),
          axiosInstance.get("ticket/getId/", authHeaders),
          axiosInstance.get("ticket/create/", authHeaders),
          axiosInstance.get("org/autoAssignee/", authHeaders),
          axiosInstance.get("roles/user_role/", authHeaders),
          axiosInstance.get(`/org/organisation/${ordId}/employee/`, authHeaders),
        ]);
        setSolutionGroupList(subGroupsList.data);
        setOrganizationsList(orgList.data);
        setActiveUsersList(activeUsersList.data);
        setRoleBasedAssignee(userRole.data);
        setSupportTeamList(choicesList.data.support_team_choices);
        setImpactList(choicesList.data.impact_choices);
        setContactModeList(choicesList.data.contact_mode_choices);
        setPriorityList(priorityList.data);
        setUsersListWithOrganisations(usersListWithOrganisations.data);
        setRequestorList(activeUsersList.data.map((user) => user.username));

          const requestorEmployees = flattenEmployees(requestorEmployeesList.data);
        setRequestorEmpList(requestorEmployees.map((user) => user.username))
        console.log(requestorEmployees)

        console.log("Requestor Employees List:",requestorEmployeesList)

        console.log("userRole", roleBasedAssignee);


        if (
          assignedProjectsResponse.data &&
          assignedProjectsResponse.data.assigned_projects
        ) {
          setAssignedProjects(assignedProjectsResponse.data.assigned_projects);
        }

        const ticketNumber = nextTicketId.data;

        // FIXED: Set defaults after all data is loaded, with proper state update
        setFormData((prev) => {
          const updatedData = {
            ...prev,
            number: ticketNumber,
            search: `Issue - ${ticketNumber}`,
          };

          // Set Low priority as default - FIX: Check array length first
          if (priorityList.data && priorityList.data.length > 0) {
            const priorityLowChoice = priorityList.data.find(
              (choice) => choice.urgency_name.toLowerCase() === "low"
            );
            console.log("choice", priorityLowChoice);
            if (priorityLowChoice) {
              updatedData.priority = priorityLowChoice.priority_id;
            } else {
              // Fallback to first priority if "Low" not found
              updatedData.priority = priorityList.data[0].priority_id;
            }
          }

          // Set Low impact as default - FIX: Check array structure
          if (
            choicesList.data.impact_choices &&
            choicesList.data.impact_choices.length > 0
          ) {
            const impactLowChoice = choicesList.data.impact_choices.find(
              (choice) => choice[1].toLowerCase() === "low"
            );
            if (impactLowChoice) {
              updatedData.impact = impactLowChoice[0];
            } else {
              // Fallback to first impact if "Low" not found
              updatedData.impact = choicesList.data.impact_choices[0][0];
            }
          }

          return updatedData;
        });

        // Initialize activity log
        setActivityLog([
          {
            user: userProfile?.first_name || "System User",
            timestamp: new Date().toLocaleString(),
            type: "Issue creation",
            changes: [
              { field: "Issue Number", value: ticketNumber },
              {
                field: "Created by",
                value: userProfile?.first_name || "System User",
              },
            ],
          },
        ]);

        // Fetch history, notes, and details for the new ticket
        fetchHistoryData(ticketNumber);
        fetchTicketNotes(ticketNumber);
        fetchTicketDetails(ticketNumber);
      } catch (error) {
        console.error("Error fetching APIs:", error);
      }
    };
    fetchData();
  }, [userProfile]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleChange = useCallback(
    (e) => {
      console.log("handleChange", e);
      const { name, value } = e.target;
      console.log(e.target, "name");

      const isHtmlEmpty = (html) => {
        if (typeof html !== "string") return true;
        const text = html.replace(/<[^>]*>/g, "").trim();
        return text === "";
      };

      const sanitizedValue =
        name === "description" && isHtmlEmpty(value) ? "" : value;
      console.log("sanitizedValue", sanitizedValue);

      setFormData((prev) => {
        // Prevent unnecessary updates if value hasn't actually changed
        if (prev[name] === sanitizedValue) {
          return prev;
        }

        const updatedData = { ...prev, [name]: sanitizedValue };

        if (name === "project") {
          const selectedProject = assignedProjects.find(
            (p) => p.project_id.toString() === value
          );
          if (selectedProject) {
            updatedData.product = selectedProject.product_mail || "";
            updatedData.project_id = selectedProject.project_id;
          }
        }
        // Auto assignee-organization connection
        if (name === "assignee") {
          if (value === "") {
            updatedData.developerOrganization = "";
          } else {
            const selectedUser = roleBasedAssignee.find(
              (user) =>
                user.user === value && user.role.toLowerCase() === "developer"
            );

            if (selectedUser) {
              const orgDetails = usersListWithOrganisations.find(
                (org) => org.username === selectedUser.user
              );
              updatedData.developerOrganization =
                orgDetails?.organisation_name || "";
            } else {
              updatedData.developerOrganization = "";
            }
          }
        }
        return updatedData;
      });

      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    },
    [roleBasedAssignee, usersListWithOrganisations]
  ); // Add dependencies

  const convertFormDataToSnakeCase = (data) => {
    console.log("activeUsersList", activeUsersList);
    const selectedAssignee = activeUsersList.find(
      (user) => user.username === data.assignee
    );
    console.log("selectedAssignee", selectedAssignee);
    const assigneeUserId = selectedAssignee?.id || "";
    console.log("assigneeUserId", assigneeUserId);
    const ticketOrganisationObj = organizationsList.find(
      (org) => org.organisation_name === data.ticketOrganisation
    );
    const ticketOrganisationId = ticketOrganisationObj?.organisation_id || "";
    console.log("ticketOrganisationId", ticketOrganisationId);
    return {
      ticket_id: data.number,
      assignee: assigneeUserId,
      summary: data.summary,
      description: data.description,
      service_domain: data.serviceDomainObj?.originalId,
      service_type: data.serviceTypeObj?.originalId,
      solution_grp: data.solutionGroup,
      reference_tickets: data.referenceTicket,
      impact: data.impact,
      support_team: data.supportTeam,
      project: data.project_id || data.project,
      product: data.product,
      customer_country: data.customerCountry,
      developer_organization: data.developerOrganization,
      requester_email: data.email,
      priority: data.priority,
      customer_number: data.contactNumber,
      contact_mode: data.contactMode,
      created_by: userProfile?.username || "",
      on_behalf_of: data.requestor,
      is_active: true,
      attachments: attachments,
      ticket_organization: ticketOrganisationId,
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      // Auto-populate product when project is selected
      if (name === "project") {
        const selectedProject = assignedProjects.find(
          (p) => p.project_id.toString() === value
        );
        if (selectedProject) {
          updatedData.product = selectedProject.product_mail || "";
          updatedData.project_id = selectedProject.project_id;
        }
      }

      return updatedData;
    });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const assigneeOptions = [
    { label: "-- Select --", value: "" },
    ...roleBasedAssignee
      .filter((user) => user.role.toLowerCase() === "developer") // Fix case sensitivity
      .map((user) => ({
        label: user.user,
        value: user.user,
      })),
  ];

  const [relatedRecords, setRelatedRecords] = useState([
    {
      id: "INC0010001",
      type: "Incident",
      summary: "Related NTP issue on server 1",
    },
    {
      id: "PRB0000123",
      type: "Problem",
      summary: "NTP synchronization failures",
    },
  ]);

  const requiredFields = [
    "requestor",
    "impact",
    "priority",
    "summary",
    "description",
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.requestor || !formData.requestor.trim()) {
      newErrors.requestor = "Requestor is required";
    }

    if (!formData.priority || formData.priority === "") {
      newErrors.priority = "Priority is required";
    }

    if (!formData.impact || formData.impact === "") {
      newErrors.impact = "Impact is required";
    }

    if (!formData.summary || !formData.summary.trim()) {
      newErrors.summary = "Summary is required";
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFilteredHistory = () => {
    let filtered = [...historyData];

    // Apply filter by type
    if (historyFilter !== "All") {
      filtered = filtered.filter((item) => item.type.includes(historyFilter));
    }

    // Apply search filter
    if (historySearch) {
      filtered = filtered.filter(
        (item) =>
          item.type.toLowerCase().includes(historySearch.toLowerCase()) ||
          (item.user &&
            item.user.toLowerCase().includes(historySearch.toLowerCase())) ||
          item.changes.some(
            (change) =>
              change.field
                .toLowerCase()
                .includes(historySearch.toLowerCase()) ||
              (change.originalValue &&
                change.originalValue
                  .toString()
                  .toLowerCase()
                  .includes(historySearch.toLowerCase())) ||
              (change.newValue &&
                change.newValue
                  .toString()
                  .toLowerCase()
                  .includes(historySearch.toLowerCase()))
          )
      );
    }

    return filtered;
  };

  // Helper function to render field in details tab
  const renderField = (label, value) => {
    return value ? (
      <div className="mb-3 flex">
        <div className="w-1/3 font-medium text-gray-600">{label}:</div>
        <div className="w-2/3">{value}</div>
      </div>
    ) : null;
  };

  // Call fetchHistoryData when component mounts or when ticket number changes
  useEffect(() => {
    if (formData.number) {
      fetchHistoryData(formData.number);
      fetchTicketNotes(formData.number);
      fetchTicketDetails(formData.number);
    }
  }, [formData.number]);
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, [window.location.pathname]);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <div
        className={`fixed md:static top-0 left-0 h-full z-30 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1">
        {/* Sub Header */}
        <div className="bg-white border-b flex items-center justify-between p-2">
          <div className="flex items-center">
            <button className="p-1 border  mr-2" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">≡</span>
            <div>
              <div className="font-bold">Report an Incident</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              className="bg-blue-500 text-white px-3 py-1 "
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Submiting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Main form */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-2">
              <div className="flex items-center ">
                <label className="w-44 text-gray-600 pr-2 flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  Incident Number
                </label>
                <div>
                  <input
                    // type="text"
                    name="number"
                    value={formData.number || ""}
                    readOnly
                    className={`bg-gray-100 border px-2 py-[2.5px] w-64 cursor-not-allowed outline-none `}
                  />
                </div>
              </div>

              {/* <div className="flex items-center">
                <label className="w-44 text-gray-600">
                  {formData.requestor === userProfile?.username
                    ? "Requestor"
                    : "On Behalf"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="w-64">
                  <SearchableField
                    name="requestor"
                    value={formData.requestor}
                    onChange={handleChange}
                    options={requestorList}
                    placeholder="Select requestor..."
                    error={formErrors.requestor}
                  />
                </div>
                {formErrors.requestor && (
                  <p className="text-red-500">{formErrors.requestor}</p>
                )}
              </div> */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                  <label className="w-44 text-gray-600 text-right pr-2 flex items-center  gap-2">
                    <User size={16} className="text-gray-500" />
                    {formData.requestor === userProfile?.username
                      ? "Requestor"
                      : "On Behalf"}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="w-64">
                    <SearchableField
                      name="requestor"
                      value={formData.requestor}
                      onChange={handleChange}
                      options={requestorEmpList}
                      placeholder="Select requestor..."
                      error={formErrors.requestor}
                    />
                  </div>
                </div>
                {formErrors.requestor && (
                  <p className="text-red-500 text-sm ml-44">
                    {formErrors.requestor}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <label className="w-44 text-gray-600 text-right pr-2 flex items-center  gap-2">
                  <Users size={16} className="text-gray-500" />
                  Solution Group
                </label>
                <select
                  name="solutionGroup"
                  value={formData.solutionGroup}
                  onChange={handleChange}
                  onFocus={() => handleFocus("solutionGroup")}
                  onBlur={handleBlur}
                  className={`border  px-2 py-[2.5px] w-64 outline-none rounded-none appearance-none ${
                    focusedField === "solutionGroup"
                      ? "ring-2 ring-blue-100 border-blue-600"
                      : "border-gray-300"
                  } `}
                >
                  <option value="">-- Select --</option>
                  {solutionGroupList.map((group) => (
                    <option key={group.group_name} value={group.group_name}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex item-center">
                <div className="flex items-center">
                  <label className="w-44 text-gray-600 text-right pr-2 flex items-center  gap-2">
                    <UserCheck size={16} className="text-gray-500" />
                    Assignee
                  </label>
                  <div className="w-64">
                    <AssigneeSearchableField
                      name="assignee"
                      value={formData.assignee}
                      onChange={handleChange}
                      options={assigneeOptions}
                      placeholder="Search assignee..."
                      error={formErrors.assignee}
                    />
                  </div>
                </div>
                <div>
                  {/* <label className="w-44 text-gray-600 text-right pr-2">
                      Support Vendor
                    </label> */}
                  <input
                    type="text"
                    name="Organization"
                    value={formData.developerOrganization}
                    readOnly
                    className={`px-2 py-[2.5px] outline-none  `}
                  />
                </div>
              </div>

              {/* {formData.assignmentType === "manual" && (
                <> */}

              {/* </>
              )} */}

              {/* <div className="flex items-center">
                  <label className="w-44 text-gray-600">Contact Mode</label>
                  <select 
                    name="contactMode"
                    value={formData.contactMode}
                    onChange={handleChange}
                    className={`border  px-2 py-1 w-64 `}
                  >
                    <option value="">-- Select --</option>
                 
                  </select>
                  {formErrors.contactMode && <span className="text-red-500 text-xs ml-1">*</span>}
                </div> */}

              {/* {formData.contactMode === "phone" && (
                  <div className="flex items-center">
                    <label className="w-44 text-gray-600">Contact Number</label>
                    <input 
                      type="text" 
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className="border  px-2 py-1 w-64"
                    />
                  </div>
                )} */}
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              {/* <div className="flex items-center">
                <label className="w-44 text-gray-600">
                  Impact <span className="text-red-500">*</span>
                </label>
                <select
                  name="impact"
                  value={formData.impact}
                  onChange={handleChange}
                  onFocus={() => handleFocus("impact")}
                  onBlur={handleBlur}
                  className={`border  px-2 py-1 w-64 outline-none ${
                    focusedField === "impact"
                      ? "ring-2 ring-blue-100 border-blue-600"
                      : "border-gray-300"
                  } `}
                >
                  {impactList.map((impact, index) => (
                    <option key={index} value={impact[0]}>
                      {impact[1]}
                    </option>
                  ))}
                </select>
              </div> */}
              <div className="flex items-center ">
                <label className="w-44 text-gray-600 pr-2 flex items-center gap-2">
                  <Building2 size={16} className="text-gray-500" />
                  Service Domain
                </label>
                <div>
                  <input
                    // type="text"
                    name="serviceDomain"
                    value={formData.serviceDomainObj?.title || ""}
                    readOnly
                    className={`bg-gray-100 border px-2 py-[2.5px] w-64 cursor-not-allowed outline-none `}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <label className="w-44 text-gray-600 text-right pr-2 flex items-center  gap-2">
                  <Settings size={16} className="text-gray-500" />
                  Service Type
                </label>
                <div>
                  <input
                    type="text"
                    name="serviceType"
                    value={formData.serviceTypeObj?.title || ""}
                    readOnly
                    className={`border bg-gray-100 px-2 py-[2.5px] w-64 cursor-not-allowed outline-none  `}
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                  <label className="w-44 text-gray-600 text-right pr-2 flex items-center  gap-2">
                    <AlertTriangle size={16} className="text-gray-500" />
                    Impact <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="impact"
                    value={formData.impact}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("impact")}
                    onBlur={handleBlur}
                    className={`border  px-2 py-[2.5px] w-64 outline-none ${
                      focusedField === "impact"
                        ? "ring-2 ring-blue-100 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {impactList.map((impact, index) => (
                      <option key={index} value={impact[0]}>
                        {impact[1]}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.impact && (
                  <p className="text-red-500 text-xs ml-44">
                    {formErrors.impact}
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                  <label className="w-44 text-gray-600 text-right pr-2 flex items-center  gap-2">
                    <Target size={16} className="text-gray-500" />
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("priority")}
                    onBlur={handleBlur}
                    className={`border  px-2 py-[2.5px] w-64 outline-none ${
                      focusedField === "priority"
                        ? "ring-2 ring-blue-100 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {priorityList.map((priority) => (
                      <option
                        key={priority.priority_id}
                        value={priority.priority_id}
                      >
                        {priority.urgency_name}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.priority && (
                  <p className="text-red-500 text-xs ml-44">
                    {formErrors.priority}
                  </p>
                )}
              </div>

              {/* <div className="flex items-center">
                <label className="w-44 text-gray-600">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  onFocus={() => handleFocus("priority")}
                  onBlur={handleBlur}
                  className={`border  px-2 py-1 w-64 outline-none ${
                    focusedField === "priority"
                      ? "ring-2 ring-blue-100 border-blue-600"
                      : "border-gray-300"
                  } `}
                >
                  {priorityList.map((priority) => (
                    <option
                      key={priority.priority_id}
                      value={priority.priority_id}
                    >
                      {priority.urgency_name}
                    </option>
                  ))}
                </select>
              </div> */}
              {/* <div className="flex items-center">
  <label className="w-44 text-gray-600 text-right pr-2">
    Project
  </label>
  <select
    name="project"
    value={formData.project}
    onChange={handleChange}
    onFocus={() => handleFocus("project")}
    onBlur={handleBlur}
    className={`border px-2 py-1 w-64 outline-none ${
      focusedField === "project"
        ? "ring-2 ring-blue-100 border-blue-600"
        : "border-gray-300"
    }`}
  >
    <option value="">-- Select Project --</option>
    {assignedProjects.map((project) => (
      <option key={project.project_id} value={project.project_id}>
        {project.project_name}
      </option>
    ))}
  </select>
</div> */}
              {/* <div className="flex items-center">
                <label className="w-44 text-gray-600 text-right pr-2">
                  Project Owner
                </label>
                <input
                  type="text"
                  name="product"
                  value={formData.product}
                  readOnly
                  className={`bg-gray-100 border  px-2 py-1 w-64 cursor-not-allowed outline-none  `}
                />
              </div> */}
              {/* <div className="flex items-center">
                <label className="w-44 text-gray-600">Reference Ticket</label>
                <div className="w-64">
                  <ReferenceTicketSelector
                    value={formData.referenceTicket}
                    onChange={handleChange}
                    isOptional
                    className="text-xs p-1 border  w-64"
                  />
                </div>
              </div> */}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-start flex-col w-full space-y-1">
              <div className="flex w-full items-center">
                <label className="w-44 text-gray-600 text-right pr-2 flex items-center  gap-2">
                  <FileText size={16} className="text-gray-500" />
                  Incident Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  onFocus={() => handleFocus("summary")}
                  onBlur={handleBlur}
                  maxLength={120}
                  className={`border w-[71.6%] px-2 py-[2.5px] outline-none ${
                    focusedField === "summary"
                      ? "ring-2 ring-blue-100 border-blue-600"
                      : "border-gray-300"
                  }`}
                />
              </div>
              <div className="ml-44">
                <p className="text-gray-500 text-xs">
                  {formData.summary?.length || 0}/120 characters
                </p>
              </div>
              {formErrors.summary && (
                <p className="text-red-500 text-xs ml-44">
                  {formErrors.summary}
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex items-start mt-2">
                <label className="w-44 text-gray-600 text-sm pr-2 flex items-center gap-2 mt-1">
                  <MessageSquare size={16} className="text-gray-500" />
                  Describe Your Issue <span className="text-red-500">*</span>
                </label>
                <div className="flex items-start gap-3 w-[71.6%]">
                  <div className="flex-1">
                    <QuillTextEditor
                      name="description"
                      value={formData.description}
                      onChange={(e) => {
                        // Only call handleChange if the value actually changed
                        if (e.target.value !== formData.description) {
                          handleChange(e);
                        }
                      }}
                      onFocus={() => handleFocus("description")}
                      onBlur={handleBlur}
                      className="bg-white max-w-full"
                    />
                  </div>
                </div>
              </div>

              {formErrors.description && (
                <div className="flex items-start">
                  <div className="w-44"></div>
                  {/* Spacer to match label width */}
                  <p className="text-red-500 text-xs">
                    {formErrors.description}
                  </p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </div>

            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <button
                  onClick={handleFileAttachment}
                  className="flex items-center gap-2 ml-44 px-2 py-[2.5px] bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 transition-all whitespace-nowrap"
                >
                  <Paperclip size={16} />
                  <span>Attach</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
              </div>

              {attachments.length > 0 && (
                <div className="ml-44 space-y-2 w-[71.6%]">
                  <div className="text-sm font-semibold text-gray-700">
                    Attached Files:
                  </div>
                  <ul className="space-y-1">
                    {attachments.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between bg-white shadow-sm border px-3 py-1 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {file.type.includes("image") ? (
                            <img
                              src={file.previewUrl}
                              alt={file.name}
                              className="w-6 h-6 object-cover rounded"
                            />
                          ) : (
                            <Paperclip size={16} className="text-gray-500" />
                          )}
                          <span className="text-sm truncate max-w-xs">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((f) => f.id !== file.id)
                              )
                            }
                            className="text-red-500 hover:text-red-700 ml-2 text-xs"
                            title="Remove"
                          >
                            ✕
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="text-sm text-left truncate max-w-xs text-blue-600 hover:underline"
                            title="Click to preview"
                          >
                            Preview
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {previewFile && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={() => setPreviewFile(null)}
                >
                  <div
                    className="bg-white p-4 rounded shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-700">
                        Preview: {previewFile.name}
                      </h2>
                      <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setPreviewFile(null)}
                      >
                        &times;
                      </button>
                    </div>

                    {previewFile.type.includes("image") ? (
                      <img
                        src={previewFile.previewUrl || previewFile.url}
                        alt={previewFile.name}
                        className="max-w-full max-h-[70vh] object-contain mx-auto"
                      />
                    ) : previewFile.type.includes("pdf") ? (
                      <iframe
                        src={previewFile.previewUrl || previewFile.url}
                        title={previewFile.name}
                        className="w-full h-[70vh]"
                      />
                    ) : (
                      <div className="text-sm text-gray-800">
                        Cannot preview this file type. <br />
                        <a
                          href={previewFile.url || previewFile.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Download instead
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs Section */}
            <div className=" mt-10 border-black border-1  -lg p-2 flex-1 justify-between">
              {/* Tab Content */}
            </div>
          </div>

          {/* Toast Container and Chatbot */}
          <ChatbotPopup />
          {false && (
            <ResolutionPopup
              isOpen={false}
              onClose={() => {}}
              onSubmit={() => {}}
            />
          )}
          <ToastContainer
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </div>
    </div>
  );
}
