import { useState } from "react";
import SearchBar from "./SearchBar";
import Card from "./Card";
import { AlertTriangle, HeartHandshake, BookOpenText, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatbotPopup from "./ChatBot";

const MainHomeContent = () => {
  const navigate = useNavigate();
  const [showServiceMessage, setShowServiceMessage] = useState(false);
  const [showKbMessage, setShowKbMessage] = useState(false);

  const handleServiceRequestClick = () => {
    setShowServiceMessage(true);
    setTimeout(() => {
      setShowServiceMessage(false);
    }, 3000);
  };

  const handleKnowledgeBaseClick = () => {
    setShowKbMessage(true);
    setTimeout(() => {
      setShowKbMessage(false);
    }, 3000);
  };

  return (
    <div className="bg-slate-50 text-gray-800 w-full flex flex-col">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 text-center text-blue-900 tracking-tight">
          How may we assist you?
        </h2>

        <div className="mt-12 sm:mt-16 lg:mt-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card
              icon={<AlertTriangle className="w-8 h-8 text-white" />}
              title="Report an Issue"
              description="Report issues related to application, infrastructure, and more"
              className="shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] cursor-pointer"
              onClick={() => navigate("/request-issue")}
            />

            <div className="relative">
              <Card
                icon={<HeartHandshake className="w-8 h-8 text-white" />}
                title="Raise a Service Request"
                description="Request new services related to applications, infrastructure and more"
                className="shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] cursor-pointer"
                onClick={handleServiceRequestClick}
              />
              
              <div className="absolute top-2 right-2 bg-blue-100 rounded-full p-1">
                <Clock className="w-4 h-4 text-blue-700" />
              </div>
              
              {showServiceMessage && (
                <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                  <div className="bg-blue-900 text-white py-3 px-6 rounded-lg shadow-lg flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Coming soon! This feature is under development.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Card
                icon={<BookOpenText className="w-8 h-8 text-white" />}
                title="Knowledge Base"
                description="Find guides, FAQs, and troubleshooting tips for applications, infrastructure and more"
                className="shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] cursor-pointer"
                onClick={handleKnowledgeBaseClick}
              />
              
              <div className="absolute top-2 right-2 bg-blue-100 rounded-full p-1">
                <Clock className="w-4 h-4 text-blue-700" />
              </div>
              
              {showKbMessage && (
                <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                  <div className="bg-blue-900 text-white py-3 px-6 rounded-lg shadow-lg flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Work in progress - Coming soon!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 md:mt-24 text-center">
          <a href="/reset-password" className="text-blue-700 font-medium hover:underline transition-colors">
            Need to reset your password?
          </a>
        </div>
      </div>
      
      <div className="fixed bottom-6 right-6 z-20">
        <ChatbotPopup />
      </div>
    </div>
  );
};

export default MainHomeContent;