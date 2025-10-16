import { useState, useEffect, useRef } from "react";
import { FiSearch, FiUser, FiUserX, FiUserPlus, FiUsers } from "react-icons/fi";

const ProjectAssignmentUserSelection = ({ users, selectedUserIds, onUserToggle }) => {
  const [userSearchTerm, setUserSearchTerm] = useState("");
  
  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!userSearchTerm.trim()) return true;
    
    const searchTermLower = userSearchTerm.toLowerCase().trim();
    return (
      user.username?.toLowerCase().includes(searchTermLower) ||
      user.email?.toLowerCase().includes(searchTermLower) ||
      user.first_name?.toLowerCase().includes(searchTermLower) ||
      user.last_name?.toLowerCase().includes(searchTermLower)
    );
  });
  
  // Separate users into selected and unselected
  const selectedUsers = filteredUsers.filter(user => selectedUserIds.includes(user.id));
  const unselectedUsers = filteredUsers.filter(user => !selectedUserIds.includes(user.id));
  
  const handleUserSearchInputChange = (e) => {
    setUserSearchTerm(e.target.value);
  };
  
  return (
    <div>
      {/* Search for users */}
      <div className="relative mb-3">
        <input
          type="text"
          className="border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          placeholder="Search users..."
          value={userSearchTerm}
          onChange={handleUserSearchInputChange}
        />
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" size={16} />
        </div>
      </div>

      {/* Selected Users Section */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <FiUsers className="mr-1 text-blue-500" size={16} />
          <h3 className="text-sm font-medium text-gray-700">Selected Users ({selectedUsers.length})</h3>
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-blue-50">
          {selectedUsers.length > 0 ? (
            <ul className="divide-y divide-blue-100 max-h-32 overflow-y-auto">
              {selectedUsers.map((user) => (
                <li
                  key={`selected-${user.id}`}
                  className="p-2 flex items-center justify-between hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FiUser className="mr-1 text-blue-500" size={14} />
                    <span className="text-sm">{user.username || user.email || user.first_name}</span>
                  </div>
                  <button
                    onClick={() => onUserToggle(user.id)}
                    className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                    title="Remove user"
                  >
                    <FiUserX size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-3">No users selected</p>
          )}
        </div>
      </div>

      {/* Unselected Users Section */}
      <div>
        <div className="flex items-center mb-2">
          <FiUsers className="mr-1 text-gray-500" size={16} />
          <h3 className="text-sm font-medium text-gray-700">Available Users ({unselectedUsers.length})</h3>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          {unselectedUsers.length > 0 ? (
            <ul className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
              {unselectedUsers.map((user) => (
                <li
                  key={`unselected-${user.id}`}
                  className="p-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FiUser className="mr-1 text-gray-400" size={14} />
                    <span className="text-sm">{user.username || user.email || user.first_name}</span>
                  </div>
                  <button
                    onClick={() => onUserToggle(user.id)}
                    className="p-1 rounded-full text-green-500 hover:bg-green-100 transition-colors"
                    title="Add user"
                  >
                    <FiUserPlus size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-3">No available users</p>
          )}
        </div>
      </div>
      
      {/* Selected users counter */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>{selectedUserIds.length} users selected</span>
        {selectedUserIds.length > 0 && (
          <button
            onClick={() => {
              // Clear all selected users
              selectedUsers.forEach(user => onUserToggle(user.id));
            }}
            className="text-xs text-red-500 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectAssignmentUserSelection;