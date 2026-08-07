import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import ChatbotPopup from "../../components/ChatBot";
import { ToastContainer, toast } from "react-toastify";

export default function ManageRoles() {
  const [loading, setLoading] = useState(true);
  const [organisations, setOrganisations] = useState([]);

  useEffect(() => {
    const checkAuthentication = () => {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Please log in to access this page.");
        setLoading(false);
        return false;
      }
      return true;
    };

    if (checkAuthentication()) {
      setLoading(false);
    }
  }, []);

return (
    <div className="flex w-full min-h-screen bg-gray-50">
        <div className="hidden lg:flex">
            <Sidebar />
        </div>

        <main className="flex-1">
            <div className="p-8">
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-gray-800">Organization Chart</h1>
                    <p className="text-gray-600 mt-2">
                        View and manage your organization's s structure
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* <OrgChart /> */}
                </div>
            </div>
        </main>

        <ChatbotPopup />
        <ToastContainer position="top-right" autoClose={3000} />
    </div>
);
}