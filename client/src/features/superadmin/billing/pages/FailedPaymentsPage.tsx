import React from 'react';

const FailedPaymentsPage = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Failed Payments Triage</h2>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
            <option value="ALL">All Failures</option>
            <option value="UNRESOLVED">Unresolved</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md">
            Generate Recovery Link
          </button>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          Triage and recover failed payment attempts. Never automatically retry a charge; generate a new secure checkout link instead.
        </p>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flow</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">2026-07-30 15:45</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Delhi Public School</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">SaaS Subscription</td>
                <td className="px-6 py-4 whitespace-nowrap text-red-600">INSUFFICIENT_FUNDS</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">₹25,000</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Unresolved</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FailedPaymentsPage;
