import React from 'react';
import { ClipboardList } from 'lucide-react';

interface NeutralViewProps {
  onShowSidebar: () => void;
}

const NeutralView = ({ onShowSidebar }: NeutralViewProps) => {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div 
        className="text-center p-8 rounded-xl border-2 border-dashed border-gray-200 
          hover:border-gray-300 transition-colors duration-200 cursor-pointer
          hover:bg-gray-50/50 group"
        onClick={onShowSidebar}
      >
        <div className="inline-block p-4 bg-gray-50 rounded-full mb-4 
          group-hover:bg-gray-100 transition-colors duration-200">
          <ClipboardList className="h-10 w-10 text-gray-400 group-hover:text-gray-500 transition-colors duration-200" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-black transition-colors duration-200">
          No Summary Selected
        </h2>
        <p className="text-gray-500 max-w-md group-hover:text-gray-600 transition-colors duration-200">
          Click anywhere to show the summaries list and select an emergency to view its details
        </p>
      </div>
    </div>
  );
};

export default NeutralView;