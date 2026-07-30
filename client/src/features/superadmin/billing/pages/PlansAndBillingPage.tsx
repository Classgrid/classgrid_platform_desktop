import React, { useState } from 'react';

const PlansAndBillingPage = () => {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="flex flex-col h-full">
      {/* Page Header Area inside the Shell */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Plans & Billing Ecosystem</h2>
        {activeTab === 'plans' && (
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md">
            + Create Plan
          </button>
        )}
        {activeTab === 'modules' && (
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md">
            + Create Module
          </button>
        )}
      </div>

      {/* Internal Tabs */}
      <div className="px-6 pt-4 border-b border-gray-200">
        <div className="flex gap-4">
          {['plans', 'modules', 'eligibility_rules', 'tax_rules', 'discounts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'plans' && (
          <div className="text-sm text-gray-500">
            {/* Table Mockup */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Base</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">Enterprise Suite</td>
                    <td className="px-6 py-4 whitespace-nowrap">v3.0</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹25,000</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'modules' && (
          <div className="text-sm text-gray-500">Modules Management Table goes here.</div>
        )}
      </div>
    </div>
  );
};

export default PlansAndBillingPage;
