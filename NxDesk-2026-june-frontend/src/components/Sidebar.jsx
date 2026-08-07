import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  User,
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  UserCheck,
  Activity,
  List,
  FileText,
  Bug,
  Link as LinkIcon,
  Download,
  Users,
  Briefcase,
  CheckCircle,
  ArrowUp,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  RollerCoaster,
  UserIcon,
  Cog,
  MonitorCheck,
  Ticket,
  ListFilter,
  Flag,
  FolderTree,
    Home,
} from "lucide-react";

function Sidebar() {
  const location = useLocation();
  const userProfile = useSelector((state) => state.userProfile.user);
  const isAdmin = userProfile?.role === "Admin";
  const isDispatcher = userProfile?.role === "Dispatcher";
  const isRequester = userProfile?.role === "Requester";

  // Track open sections
  const [openSections, setOpenSections] = useState({
    dashboard: false,
    incidents: true,
    configuration: false,
    // resources: false,
    admin: false,
    projects: false,
    dispatcher: false,
  });

  // Track open nested sections
  const [openNestedSections, setOpenNestedSections] = useState({
    createTicket: false,
  });

  // Toggle nested section visibility
  const toggleNestedSection = (section, event) => {
    // Prevent the click from navigating to parent link
    event && event.preventDefault();
    event && event.stopPropagation();

    setOpenNestedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Configure which links are disabled (all enabled by default)
  const [disabledLinks, setDisabledLinks] = useState({
    // Set to true to disable specific links
      home: false, 
    dashboard: false,
    incidents: false,
    createIncident: false,
    reportIssue: false,
    serviceRequest: true, // Disabled as requested
    myTickets: isAdmin || isDispatcher, // Available for non-admin, non-dispatcher users only
    assignedToMe: isAdmin || isDispatcher || isRequester, // Now also disabled for Requester
    grouptickets: false,
    projects: false,
    allActivities: false,
    knowledgeBase: false,

    // Configuration items
    priority: false,
    serviceDomain: false,
    serviceType: false,
    category: false,
    solutionGroup: false,
    projectAssignment: false,

    // Dispatcher specific
    dispatcher: false,

    // Disabled items
    rolePermissions: true,
    // linkIncidentToSR: true,
    // downloadSRForm: true,
    // linkIncidentsToPBI: true,
    // resolvedPBI: true,
    // problemTickets: true,
    // createProblemTickets: true,
    // escalation: true,
    // support: true,
  });

  // Toggle section visibility
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Define which items should be shown for admin vs non-admin vs dispatcher vs Requester
  const getItemVisibility = (item) => {
    // Default visibility rules if not specified
    if (!item.showForRoles) {
      if (isAdmin) {
        return true; // Show all items to admin by default
      } else if (isDispatcher) {
        // For dispatcher, only show these specific items by default
        return ["dashboard", "incidents", "dispatcher"].includes(item.id);
      } else if (isRequester) {
        // For Requester, only show these specific items (excluding "assignedToMe")
        return [
          "dashboard",
          "incidents",
          "createIncident",
          "myTickets",
        ].includes(item.id);
      } else {
        // For other non-admin, non-dispatcher roles, show these items including "assignedToMe"
        return [
          "dashboard",
          "incidents",
          "createIncident",
          "reportIssue",
          "serviceRequest",
          "myTickets",
          "assignedToMe",
        ].includes(item.id);
      }
    }

    // If showForRoles is specified, use it
    return (
      item.showForRoles.includes("all") ||
      (isAdmin && item.showForRoles.includes("Admin")) ||
      (isDispatcher && item.showForRoles.includes("Dispatcher")) ||
      (isRequester && item.showForRoles.includes("Requester")) ||
      (!isAdmin &&
        !isDispatcher &&
        !isRequester &&
        item.showForRoles.includes("non-admin"))
    );
  };

  const getGroupVisibility = (group) => {
    // Default visibility rules if not specified
    if (!group.showForRoles) {
      if (isAdmin) {
        return true; // Show all groups to admin by default
      } else if (isDispatcher) {
        // For dispatcher, only show these specific groups by default
        return ["dashboard", "incidents", "dispatcher"].includes(group.id);
      } else if (isRequester) {
        // For Requester, only show these specific groups by default
        return ["dashboard", "incidents"].includes(group.id);
      } else {
        // For other non-admin, non-dispatcher roles, show these specific groups by default
        return ["dashboard", "incidents"].includes(group.id);
      }
    }

    // If showForRoles is specified, use it
    return (
      group.showForRoles.includes("all") ||
      (isAdmin && group.showForRoles.includes("Admin")) ||
      (isDispatcher && group.showForRoles.includes("Dispatcher")) ||
      (isRequester && group.showForRoles.includes("Requester")) ||
      (!isAdmin &&
        !isDispatcher &&
        !isRequester &&
        group.showForRoles.includes("non-admin"))
    );
  };

  // Organize sidebar items into logical groups
  // Organize sidebar items into logical groups
// Organize sidebar items into logical groups
const sidebarGroups = isDispatcher
  ? [
      // Direct items for Dispatcher - no subcategories
      {
        id: "dispatcher-items",
        title: "Navigation",
        showForRoles: ["Dispatcher"],
        items: [
          {
            id: "home",
            name: "Home",
            route: "/",
            icon: <Home size={16} />,
            showForRoles: ["all"],
          },
          {
            id: "dashboard",
            name: "Dashboard",
            route:
              "/request-issue/application-support/request-issue/application-support/Dashborad",
            icon: <LayoutDashboard size={16} />,
            showForRoles: ["Dispatcher"],
          },
          {
            id: "incidents",
            name: "All Incidents",
            route:
              "/request-issue/application-support/request-issue/application-support/list-of-incidents",
            icon: <AlertTriangle size={16} />,
            showForRoles: ["Dispatcher"],
          },
          {
            id: "dispatcher",
            name: "Dispatcher",
            route: "/dispatcher",
            icon: <MonitorCheck size={16} />,
            showForRoles: ["Dispatcher"],
          },
        ],
      },
    ]
  : [
      {
        id: "home",
        title: "Home",
        showForRoles: ["all"],
        items: [
          {
            id: "home",
            name: "Home",
            route: "/",
            icon: <Home size={16} />,
            showForRoles: ["all"],
          },
        ],
      },
      {
        id: "dashboard",
        title: "Dashboard",
        showForRoles: ["all"], // Show for all roles
        items: [
          {
            id: "dashboard",
            name: "Dashboard",
            route:
              "/request-issue/application-support/request-issue/application-support/Dashborad",
            icon: <LayoutDashboard size={16} />,
            showForRoles: ["all"], // Show for all roles
          },
        ],
      },
      {
        id: "incidents",
        title: "Incident Management",
        showForRoles: ["all"], // Show for all roles
        items: [
          {
            id: "incidents",
            name: "All Incidents",
            route:
              "/request-issue/application-support/request-issue/application-support/list-of-incidents",
            icon: <AlertTriangle size={16} />,
            showForRoles: ["all"],
          },
          {
            id: "createIncident",
            name: "Create Incident",
            route: "#",
            icon: <PlusCircle size={16} />,
            showForRoles: ["Admin", "non-admin", "Requester"], // Available for Admin, non-admin, and Requester
            hasSubItems: true,
            subItems: [
              {
                id: "reportIssue",
                name: "Report an Incident",
                route: "/request-issue",
                icon: <AlertTriangle size={14} />,
                showForRoles: ["Admin", "non-admin", "Requester"], // Available for Admin, non-admin, and Requester
              },
              {
                id: "serviceRequest",
                name: "Report a Service Incident",
                route: "/request-service",
                icon: <Ticket size={14} />,
                showForRoles: ["Admin", "non-admin", "Requester"], // Available for Admin, non-admin, and Requester
              },
            ],
          },
          {
            id: "myTickets",
            name: "My Incidents",
            route:
              "/request-issue/application-support/request-issue/application-support/my-tickets",
            icon: <UserCheck size={16} />,
            showForRoles: ["non-admin", "Requester"], // Available for non-admin and Requester users
          },
          {
            id: "assignedToMe",
            name: "Assigned to Me",
            route:
              "/request-issue/application-support/request-issue/application-support/assigned-me",
            icon: <User size={16} />,
            showForRoles: ["non-admin"], // Only for non-admin users (excluding Requester)
          },
          // {
          //   id: "grouptickets",
          //   name: "Group Tickets",
          //   route: "/request-issue/application-support/request-issue/application-support/grouptickets",
          //   icon: <Ticket size={16} />,
          //   showForRoles: ["all"]
          // },
          // {
          //   id: "problemTickets",
          //   name: "Problem Tickets",
          //   route: "/create-ticket",
          //   icon: <Bug size={16} />,
          //   showForRoles: ["all"]
          // },
          // {
          //   id: "createProblemTickets",
          //   name: "Create Problem Ticket",
          //   route: "/support-pm",
          //   icon: <PlusCircle size={16} />,
          //   showForRoles: ["all"]
          // },
        ],
      },
      {
        id: "projects",
        title: "Projects",
        showForRoles: ["Admin"], // Only for Admin
        items: [
          {
            id: "projects",
            name: "Projects Dashboard",
            route: "/projects",
            icon: <Briefcase size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "projectAssignment",
            name: "Project Assignment",
            route: "/project-assignment",
            icon: <UserCheck size={16} />,
            showForRoles: ["Admin"],
          },
        ],
      },
      {
        id: "configuration",
        title: "Configuration",
        showForRoles: ["Admin"], // Only for Admin
        items: [
          {
            id: "priority",
            name: "Priority Levels",
            route: "/priority",
            icon: <Flag size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "serviceDomain",
            name: "Service Domains",
            route: "/service-domain",
            icon: <FolderTree size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "serviceType",
            name: "Service Types",
            route: "/service-type",
            icon: <ListFilter size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "category",
            name: "Categories",
            route: "/category",
            icon: <List size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "solutionGroup",
            name: "Solution Groups",
            route: "/solutionGrp",
            icon: <Users size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "organizations",
            name: "Organizations",
            route: "/organisations",
            icon: <Briefcase size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "organizationTree",
            name: "Organization Structure",
            route: "/orgtree",
            icon: <FolderTree size={16} />,
            showForRoles: ["all"],
          },
        ],
      },
      // {
      //   id: "resources",
      //   title: "Resources",
      //   showForRoles: ["Admin"], // Only for Admin
      //   items: [
      //     {
      //       id: "knowledgeBase",
      //       name: "Knowledge Base",
      //       route: "/request-issue/application-support/request-issue/application-support/knowledge-article",
      //       icon: <FileText size={16} />,
      //       showForRoles: ["Admin"]
      //     },
      //     {
      //       id: "linkIncidentToSR",
      //       name: "Link to Service Request",
      //       route: "/link-incident-to-sr",
      //       icon: <LinkIcon size={16} />,
      //       showForRoles: ["Admin"]
      //     },
      //     {
      //       id: "downloadSRForm",
      //       name: "Download SR Form",
      //       route: "/download-sr-form",
      //       icon: <Download size={16} />,
      //       showForRoles: ["Admin"]
      //     },
      //     {
      //       id: "linkIncidentsToPBI",
      //       name: "Link to PBI",
      //       route: "/link-incidents-to-pbi",
      //       icon: <LinkIcon size={16} />,
      //       showForRoles: ["Admin"]
      //     },
      //     {
      //       id: "resolvedPBI",
      //       name: "Resolved PBI",
      //       route: "/resolved-pbi",
      //       icon: <CheckCircle size={16} />,
      //       showForRoles: ["Admin"]
      //     },
      //   ],
      // },
      {
        id: "admin",
        title: "Administration",
        showForRoles: ["Admin"], // Only for Admin
        items: [
          {
            id: "employee",
            name: "Employee Management",
            route: "/employee",
            icon: <Users size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "register",
            name: "User Registration",
            route: "/register",
            icon: <UserIcon size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "roles",
            name: "Role Management",
            route: "/roles",
            icon: <UserIcon size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "permission",
            name: "Permission Settings",
            route: "/permission",
            icon: <Cog size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "rolePermissions",
            name: "Role Permissions",
            route: "/role-permissions",
            icon: <Lock size={16} />,
            showForRoles: ["Admin"],
          },
          {
            id: "userRole",
            name: "User Role Assignment",
            route: "/user-role",
            icon: <RollerCoaster size={16} />,
            showForRoles: ["Admin"],
          },
          // {
          //   id: "escalation",
          //   name: "Escalation Matrix",
          //   route: "/escalation",
          //   icon: <ArrowUp size={16} />,
          //   showForRoles: ["Admin"]
          // },
          // {
          //   id: "support",
          //   name: "Support Levels",
          //   route: "/support",
          //   icon: <HelpCircle size={16} />,
          //   showForRoles: ["Admin"]
          // },
        ],
      },
    ];
  // Check if current route is in a section to auto-expand it
  useEffect(() => {
    // Check main sections
    sidebarGroups.forEach((group) => {
      const isActiveSection = group.items.some((item) => {
        // Check if the main item matches the current path
        if (item.route === location.pathname) return true;

        // Check if any subitem matches the current path
        if (item.subItems) {
          return item.subItems.some(
            (subItem) => subItem.route === location.pathname
          );
        }

        return false;
      });

      if (isActiveSection) {
        setOpenSections((prev) => ({ ...prev, [group.id]: true }));
      }
    });

    // Check nested sections
    sidebarGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const isActiveNestedSection = item.subItems.some(
            (subItem) => subItem.route === location.pathname
          );

          if (isActiveNestedSection) {
            setOpenNestedSections((prev) => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  // Helper function to check if an item or any of its subitems is active
  const isItemActive = (item) => {
    if (item.route === location.pathname) return true;

    if (item.subItems) {
      return item.subItems.some(
        (subItem) => subItem.route === location.pathname
      );
    }

    return false;
  };

  // Render sub-menu items
  const renderSubMenuItems = (parentItem) => {
    if (!parentItem.subItems || !openNestedSections[parentItem.id]) return null;

    return (
      <div className="pl-6 pt-1 pb-1 space-y-1">
        {parentItem.subItems.map((subItem) => {
          // Skip rendering if subitem shouldn't be shown for current role
          if (!getItemVisibility(subItem)) {
            return null;
          }

          const isActive = location.pathname === subItem.route;
          const isDisabled = disabledLinks[subItem.id];

          const linkClasses = `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
            isDisabled
              ? "opacity-50 cursor-not-allowed text-blue-200"
              : isActive
              ? "bg-white/20 text-white"
              : "hover:bg-blue-700/40 text-blue-100"
          }`;

          if (isDisabled) {
            return (
              <div
                key={subItem.id}
                className={linkClasses}
                title="This feature is currently disabled"
              >
                {subItem.icon}
                <span className="flex-grow truncate">{subItem.name}</span>
                <Lock size={12} className="ml-auto opacity-70" />
              </div>
            );
          }

          return (
            <Link key={subItem.id} to={subItem.route} className={linkClasses}>
              {subItem.icon}
              <span className="flex-grow truncate">{subItem.name}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></span>
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  // Render link with disabled state handling
  const renderLink = (item) => {
    // Skip rendering if item shouldn't be shown for current role
    if (!getItemVisibility(item)) {
      return null;
    }

    const isActive = location.pathname === item.route;
    const isDisabled = disabledLinks[item.id];
    const hasSubItems = item.hasSubItems;

    // Custom classes for parent items with subitems
    const linkClasses = `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
      isDisabled
        ? "opacity-50 cursor-not-allowed text-blue-200"
        : isActive
        ? "bg-white/20 text-white"
        : "hover:bg-blue-700/40 text-blue-100"
    }`;

    // If item has subitems, render a button that toggles subitem visibility
    if (hasSubItems) {
      const isActive = isItemActive(item);

      return (
        <div key={item.id} className="w-full">
          <button
            onClick={(e) => toggleNestedSection(item.id, e)}
            className={`${
              isActive
                ? "bg-white/20 text-white"
                : "text-blue-100 hover:bg-blue-700/40"
            } flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200 w-full justify-between ${
              isDisabled ? "opacity-50 cursor-not-allowed text-blue-200" : ""
            }`}
            disabled={isDisabled}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
              )}
              {isDisabled ? (
                <Lock size={12} className="opacity-70" />
              ) : openNestedSections[item.id] ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </div>
          </button>
          {renderSubMenuItems(item)}
        </div>
      );
    }

    // For disabled items
    if (isDisabled) {
      return (
        <div
          key={item.id}
          className={linkClasses}
          title="This feature is currently disabled"
        >
          {item.icon}
          <span className="flex-grow truncate">{item.name}</span>
          <Lock size={12} className="ml-auto opacity-70" />
        </div>
      );
    }

    // For regular items
    return (
      <Link key={item.id} to={item.route} className={linkClasses}>
        {item.icon}
        <span className="flex-grow truncate">{item.name}</span>
        {isActive && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></span>
        )}
      </Link>
    );
  };

  return (
    <div className="h-screen sticky top-0">
      <aside className="bg-[#2e6ec0] text-white h-full w-64 rounded-tr-xl rounded-br-xl flex flex-col shadow-lg">
        {/* Header with user profile */}
        <div className="p-3 flex items-center gap-3 border-b border-blue-400/30">
          {/* <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden shadow-md ring-1 ring-blue-400 ring-offset-1 ring-offset-blue-600">
            {userProfile && userProfile.profile_pic_url ? (
              <img
                src={userProfile.profile_pic_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div> */}
          <div>
            <h2 className="text-base font-bold ml-2">Actions</h2>
            {/* <p className="text-xs text-blue-100">Software Project</p>
            {userProfile?.role && (
              <p className="text-xs text-blue-200">{userProfile.role}</p>
            )} */}
          </div>
        </div>

        {/* Navigation with collapsible sections */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto scrollbar-hide">
          {sidebarGroups
            .filter((group) => getGroupVisibility(group))
            .map((group) => {
              // Filter items within each group based on user role
              const filteredItems = group.items.filter((item) =>
                getItemVisibility(item)
              );

              // Don't render the group if it has no visible items
              if (filteredItems.length === 0) return null;

              return (
                <div key={group.id} className="mb-1">
                  <button
                    onClick={() => toggleSection(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-blue-100 hover:bg-blue-700/50 transition-all duration-200"
                  >
                    <span className="text-sm font-medium">{group.title}</span>
                    {openSections[group.id] ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {/* Collapsible content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSections[group.id]
                        ? "max-h-screen opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="space-y-0.5 pl-2 pr-1 pb-1">
                      {filteredItems.map((item) => renderLink(item))}
                    </div>
                  </div>
                </div>
              );
            })}
        </nav>

        {/* Footer */}
        {/* <div className="p-2 text-center text-xs text-blue-200 border-t border-blue-400/30">
          <Briefcase size={12} className="inline mr-1" />
          Software Support Portal
        </div> */}
      </aside>

      {/* Add global CSS for hiding scrollbars */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
