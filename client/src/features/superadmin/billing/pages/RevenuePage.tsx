import React from 'react';

const RevenuePage = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Revenue Ledger</h2>
        <div className="flex gap-2">
          <input type="month" className="px-3 py-1.5 border border-gray-300 rounded-md text-sm" />
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200">
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          This table displays only funds earned by Classgrid from SaaS subscriptions.
        </p>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway Fee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Settled</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">2026-07-30</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Delhi Public School</td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-600 hover:underline cursor-pointer">INV-2627-001</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">₹25,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">-₹500</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-green-700">₹24,500</td>
              </tr>
            </tbody>
            <tfoot className="bg-gray-50 font-semibold text-gray-900 text-sm">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right">Totals (July 2026)</td>
                <td className="px-6 py-3 text-right">₹25,000</td>
                <td className="px-6 py-3 text-right text-red-600">-₹500</td>
                <td className="px-6 py-3 text-right text-green-700">₹24,500</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;
