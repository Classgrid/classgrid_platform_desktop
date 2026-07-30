import React from 'react';

const TransactionsPage = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">All Network Transactions</h2>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
            <option value="ALL">All Flows</option>
            <option value="CLASSGRID_SUBSCRIPTION">Classgrid Subscriptions</option>
            <option value="STUDENT_FEE">Student Fees</option>
            <option value="REFUND">Refunds</option>
          </select>
          <input type="text" placeholder="Search Txn ID..." className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-64" />
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          This table displays all transactions across the platform, including student-to-institution payments.
        </p>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Txn ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flow</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">2026-07-30 14:00</td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600">pay_NM2x9P...</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Delhi Public School</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">Student Fee</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">₹4,500</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Captured</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">2026-07-30 11:30</td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600">pay_NM1x8A...</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Delhi Public School</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">SaaS Subscription</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">₹25,000</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Captured</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
