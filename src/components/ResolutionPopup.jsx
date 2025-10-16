import { useState } from 'react';
import { X, Check, CalendarClock, User, FileText, Tag, Clock } from 'lucide-react';

export default function ResolutionPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    resolution: '',
    description: '',
    incidentReason: '',
    category: '',
    comment: '',
    isCustomerVisible: true
  });
  
  const resolutionOptions = [
    'Fixed',
    'Workaround Provided',
    'Not Reproducible',
    'Duplicate',
    'Not an Issue'
  ];
  
  const incidentReasons = [
    'None',
    'Development activities needed',
    'Incident of SR category',
    'Dependency with third party Service Provider',
    'Inappropriate Incidents (Incident not reproducible, withdrawal Incidents)',
    'Other'
  ];
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = () => {
    // Handle form submission
    console.log('Submitting resolution data:', formData);
    // Here you would typically make an API call to save the data
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      {/* Button to open the popup */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`"bg-green-100 border-t border-l border-r" : "bg-gray-100"}`}
      >
        Resolve Incident
      </button>
      
      {/* Overlay and Popup */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900 bg-opacity-50" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Popup Content */}
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative z-10 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Resolution Information</h2>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-5">
                {/* Resolution Field */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="font-medium flex items-center">
                    <Tag size={16} className="mr-2 text-blue-600" />
                    Resolution<span className="text-red-500">*</span>
                  </label>
                  <div className="col-span-2">
                    <select
                      name="resolution"
                      value={formData.resolution}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Select Resolution --</option>
                      {resolutionOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Description Field */}
                <div className="grid grid-cols-3 gap-4 items-start">
                  <label className="font-medium flex items-center pt-2">
                    <FileText size={16} className="mr-2 text-blue-600" />
                    Resolution Description<span className="text-red-500">*</span>
                  </label>
                  <div className="col-span-2">
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide detailed description of how the incident was resolved..."
                      required
                    ></textarea>
                  </div>
                </div>
                
                {/* Incident Reason Field */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="font-medium flex items-center">
                    <Clock size={16} className="mr-2 text-blue-600" />
                    Incident based on<span className="text-red-500">*</span>
                  </label>
                  <div className="col-span-2">
                    <select
                      name="incidentReason"
                      value={formData.incidentReason}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Select Reason --</option>
                      {incidentReasons.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Category Field */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="font-medium flex items-center">
                    <Tag size={16} className="mr-2 text-blue-600" />
                    Incident category<span className="text-red-500">*</span>
                  </label>
                  <div className="col-span-2">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Select Category --</option>
                      <option value="Software">Software</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Network">Network</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                {/* Comment Field */}
                <div className="grid grid-cols-3 gap-4 items-start">
                  <label className="font-medium flex items-center pt-2">
                    <FileText size={16} className="mr-2 text-blue-600" />
                    Comment
                  </label>
                  <div className="col-span-2">
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any additional comments or notes..."
                    ></textarea>
                    
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        id="customerVisible"
                        name="isCustomerVisible"
                        checked={formData.isCustomerVisible}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="customerVisible" className="text-sm text-gray-600">
                        Visible to customer
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Metadata Section */}
                <div className="bg-gray-50 p-4 rounded-md mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Resolution Metadata</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User size={14} className="mr-2" />
                      Resolved by: <span className="font-medium ml-1">Current User</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarClock size={14} className="mr-2" />
                      Resolution time: <span className="font-medium ml-1">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit & Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}