import React, { useState } from 'react';
import { Search, PlusCircle, Download } from 'lucide-react';

const OrganizationsComponent = () => {
  const [organizations, setOrganizations] = useState([
    { number: 1, name: 'PR9000105', email: '-' }
  ]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-grow mr-4">
          <input 
            type="text" 
            placeholder="Search Organization" 
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200">
            <Download className="mr-2" size={16} />
            Bulk Import
          </button>
          <button className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700">
            <PlusCircle className="mr-2" size={16} />
            Add Organization
          </button>
        </div>
      </div>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="text-left p-3 text-gray-600 font-medium">Number</th>
            <th className="text-left p-3 text-gray-600 font-medium">Organization Name</th>
            <th className="text-left p-3 text-gray-600 font-medium">Organization Mail</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr key={org.number} className="border-b hover:bg-gray-50">
              <td className="p-3">{org.number}</td>
              <td className="p-3">{org.name}</td>
              <td className="p-3">{org.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrganizationsComponent;