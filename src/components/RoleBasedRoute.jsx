// import React from "react";
// import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";
// import Button from "./common/Button";
// import { useNavigate } from "react-router-dom";
 
 
 
// const RoleBasedRoute = ({ allowedRoles, children }) => {
//     const userProfile = useSelector((state) => state.userProfile.user);
//     const navigate = useNavigate();
//   if (!userProfile) {
//     return <div>Loading user data...</div>; // or <Navigate to="/login" />
//   }
 
//   if (!allowedRoles.includes(userProfile?.role)) {
//     return (
//       <div style={{ textAlign: "center", padding: "2rem" }}>
//         <h2>🚫 Access Denied</h2>
//         <p>You don’t have permission to access this page.</p>
       
//         <Button label="Go Back" onClick={() => navigate(-1)} blueBackground />
//       </div>
//     );
//   }
 
//   return children;
// };
 
// export default RoleBasedRoute;
import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Button from "./common/Button";
 
const RoleBasedRoute = ({ allowedRoles = [], children }) => {
  const userProfile = useSelector((state) => state.userProfile.user);
  const navigate = useNavigate();
 
  if (!userProfile) {
    return <div>Loading user data...</div>; // Optionally redirect to login
  }
 
  const hasAccess =
    userProfile.is_superuser || allowedRoles.includes(userProfile.role);
 
  if (!hasAccess) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h2>🚫 Access Denied</h2>
        <p>You don’t have permission to access this page.</p>
        <Button label="Go Back" onClick={() => navigate(-1)} blueBackground />
      </div>
    );
  }
 
  return children;
};
 
export default RoleBasedRoute;
 
 
 