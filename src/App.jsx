// MAIN APP JS FILE

import React from "react";
import { Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import ProtectedRoute from "./components/ProtectedRoute";
import UserSideLayout from "./layouts/UserSideLayout";
import MainLayout from "./layouts/MainLayout";

import LoginForm from "./components/auth/LoginForm";
import ForgotPassword from "./components/forgot-password/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import Register from "./components/auth/Register";

import Home from "./components/Home";
import Timeline from "./components/Timeline";
import Backlog from "./components/Backlog";
import CreateIssueForm from "./components/ticket/CreateIssuePage";
import Profile from "./pages/User/Profile";
import Catalog from "./pages/Catalog/RequestIssueCatalogPage";
// import Details from "./pages/User/Tickets/TicketDetails";
import AssignedToMe from "./pages/User/Tickets/AssignedToMe";
import KnowledgeArticle from "./pages/KnowledgeArticle";
import Solution from "./pages/Solution";
import ListOfIncident from "./pages/ListOfIncident";
import Organisations from "./pages/Admin/Organisations";
import Priority from "./pages/Admin/Priority";
import Categorys from "./pages/Admin/Category";
import Roles from "./pages/Admin/Roles";
import SolutionGroup from "./pages/Admin/SolutionGroup";
import CreateIssueDetailPage from "./pages/User/Tickets/CreateIssueDetailsPage";
import ListAllTickets from "./pages/ListAllTickets";
import Dashboard from "./pages/User/Dashboard";
import { fetchUserDetails } from "./store/actions/userActions";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import MyTickets from "./pages/User/Tickets/MyTickets";
import OrganisationsTree from "./pages/Admin/OrgTree";
import ManageRoles from "./pages/Admin/ManageRoles";
import UserRoles from "./pages/Admin/UserRoles";
import Permissions from "./pages/Admin/Permissions";
import Employee from "./pages/Admin/Employee";
import DispatcherPage from "./pages/Dispatcher";
import ResolveIssue from "./pages/ResolveIssue/ResolveIssue.jsx";
import Projects from "./pages/Admin/Projects";
import GroupTickets from "./pages/GroupTickets";
import CreateIssue from "./pages/CreateIssue/CreateIssue";
import IssueCategory from "./pages/Admin/IssueCategory";
import IssueTypes from "./pages/Admin/IssueTypes";
import RolePermissions from "./pages/Admin/RolePermissions";
import ProjectAssignment from "./pages/Admin/ProjectAssignment.jsx";
import { AdminProgressProvider } from "./context/AdminProgressContext.js";
import RoleBasedRoute from "./components/RoleBasedRoute.jsx";

const App = () => {
  const dispatch = useDispatch();

  let accessToken = localStorage.getItem("access_token");
  useEffect(() => {
    dispatch(fetchUserDetails(accessToken));
  }, [accessToken]);

  return (
    <div className="flex bg-[#E3E3E3] h-screen">
      <Analytics />
      <div className="flex-1 flex flex-col">
        <AdminProgressProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <UserSideLayout>
                  <LoginForm />
                </UserSideLayout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <UserSideLayout>
                  <ForgotPassword />
                </UserSideLayout>
              }
            />

            <Route
              path="/reset-password"
              element={
                <ProtectedRoute>
                  <UserSideLayout>
                    <ResetPassword />
                  </UserSideLayout>
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Home />} />
              {/* <Route
                path="/reset-password"
                element={
                  <UserSideLayout>
                    <ResetPassword />
                  </UserSideLayout>
                }
              /> */}
              <Route
                path="/register"
                element={
               
                    <Register />
                 
                }
              />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/create-issue" element={<CreateIssueForm />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-ticket" element={<CreateIssue />} />
              <Route path="/request-issue" element={<Catalog />} />

              <Route
                path="/request-issue/application-support/:serviceType/create-issue"
                element={<CreateIssue />}
              />
              <Route
                path="/request-issue/application-support/sap/resolve-issue/:ticketId"
                element={<ResolveIssue />}
              />
              <Route
                path="/request-issue/application-support/sap/ticket-details/:ticketId"
                element={<CreateIssueDetailPage />}
              />
              {/* <Route
              path="/request-issue/application-support/request-issue/application-support/details/:ticket_Id"
              element={<Details />}
            /> */}
              <Route
                path="/request-issue/application-support/request-issue/application-support/assigned-me"
                element={<AssignedToMe />}
              />
              <Route
                path="/request-issue/application-support/request-issue/application-support/my-tickets"
                element={<MyTickets />}
              />
              <Route
                path="/request-issue/application-support/request-issue/application-support/knowledge-article"
                element={<KnowledgeArticle />}
              />
              <Route
                path="/request-issue/application-support/request-issue/application-support/details/:ticket_Id/solution"
                element={<Solution />}
              />
              <Route
                path="/request-issue/application-support/request-issue/application-support/list-of-incidents"
                element={<ListOfIncident />}
              />
              {/* New route added from second file */}
              <Route
                path="/request-issue/application-support/request-issue/application-support/Dashborad"
                element={<Dashboard />}
              />
              <Route
                path="/request-issue/application-support/request-issue/application-support/grouptickets"
                element={<GroupTickets />}
              />

              <Route path="/orgtree" element={<OrganisationsTree />} />
              <Route path="/tickets" element={<ListAllTickets />} />

              <Route
                path="/organisations"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <Organisations />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/manage-role"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <ManageRoles />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/user-role"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <UserRoles />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/permission"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <Permissions />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/employee"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <Employee />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/priority"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <Priority />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <Projects />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/category"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <Categorys />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/roles"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <Roles />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/solutionGrp"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <SolutionGroup />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/role-permissions"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <RolePermissions />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/project-assignment"
                element={
                  <RoleBasedRoute allowedRoles={["Admin"]}>
                    <ProjectAssignment />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/dispatcher"
                element={
                  <RoleBasedRoute allowedRoles={["Admin", "Dispatcher"]}>
                    <DispatcherPage />
                  </RoleBasedRoute>
                }
              />

              <Route path="/service-domain" element={<IssueCategory />} />
              <Route path="/service-type" element={<IssueTypes />} />

              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </AdminProgressProvider>
      </div>
    </div>
  );
};

export default App;
