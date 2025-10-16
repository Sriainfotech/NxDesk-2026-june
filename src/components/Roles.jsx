import { Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../utils/axiosInstance';
import { toast, ToastContainer } from 'react-toastify';
import UserRoleManagement from './UserRoleMaage';

function Roles() {
    // Initial demo users
    const [users, setUsers] = useState([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Editor' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Viewer' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Admin' }
    ]); 
    
    const [value, setValue] = useState([]);
    const [orgEmp, setOrgEmp] = useState([]); // Added missing state declaration

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'Viewer'
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const roles = ['Admin', 'Editor', 'Viewer'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser({
            ...newUser,
            [name]: value
        });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();

        try {
            const response = await axiosInstance.post('user/api/register/', {
                username: newUser.name,
                email: newUser.email,
                role: newUser.role
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            console.log('User added successfully:', response.data);
            toast.success('User added successfully!');

            // After a successful API call, update users state
            if (editingUser) {
                // Update existing user
                setUsers(users.map(user =>
                    user.id === editingUser.id
                        ? { ...user, name: newUser.name, email: newUser.email, role: newUser.role }
                        : user
                ));
                setEditingUser(null);
            } else {
                // Add new user
                setUsers([
                    ...users,
                    {
                        id: users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1,
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role
                    }
                ]);
            }

            // Reset form and close modal
            setNewUser({ name: '', email: '', role: 'Viewer' });
            setIsModalOpen(false);

        } catch (error) {
            if (error.response) {
                // Custom error handling: Check if the error is in the response
                const errorMessages = error.response.data;
                if (errorMessages.username) {
                    toast.error(`Username error: ${errorMessages.username[0]}`);
                }
                if (errorMessages.email) {
                    toast.error(`Email error: ${errorMessages.email[0]}`);
                }
            } else {
                // Generic error handling if no response from API
                toast.error('Error adding user. Please try again.');
            }
            console.error('Error adding user:', error);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axiosInstance.get('org/organisation/4/employee/', {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setValue(response.data);
                // Commented code block removed as it appears to be unused/commented out
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Error fetching users. Please try again.');
            }
        };
        fetchUsers();
    }, []);

    // Process organization employees data
    useEffect(() => {
        const valueMap = () => {
            return value.map((item) => {
                return {
                    id: item.employee_id,
                    name: item.name || 'Unknown',
                    email: item.email || `${item.employee_id}@example.com`,  // Default email if not provided
                    role: item.role || 'Viewer'  // Added default role
                };
            });
        };
        const mappedUsers = valueMap();
        setOrgEmp(mappedUsers);
    }, [value]);

    const handleEditUser = (user) => {
        setNewUser({
            name: user.name,
            email: user.email,
            role: user.role
        });
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (userId) => {
        setUsers(users.filter(user => user.id !== userId));
    };

    const openModal = () => {
        setNewUser({ name: '', email: '', role: 'Viewer' });
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filter users based on the search query
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) // Search by name
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col gap-5">
                <div className="p-6 bg-white rounded-lg shadow">
                    <UserRoleManagement
                        title="Employee Role Management"
                        users={users}
                        handleEditUser={handleEditUser}
                        handleDeleteUser={handleDeleteUser}
                        openModal={openModal}
                    />
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                    <UserRoleManagement
                        title="Organisation Employees"
                        users={orgEmp} 
                        handleEditUser={handleEditUser}
                        handleDeleteUser={handleDeleteUser}
                        openModal={openModal}
                    />
                </div>
            </div>

            {/* Toast container for notifications */}
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Modal for adding/editing users */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h2>

                        <form onSubmit={handleAddUser}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    User Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={newUser.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={newUser.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={newUser.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editingUser ? 'Update User' : 'Add User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Roles;