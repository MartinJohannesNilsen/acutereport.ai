import React, { useState, useEffect } from 'react';
import { AlertCircle, Ambulance, Clock } from 'lucide-react';
import type { Summary } from '../types';

const EMERGENCY_MESSAGES = [
  "Emergency response in progress...",
  "Monitoring vital signs...",
  "Updating patient status...",
  "Coordinating with medical team...",
  "Processing real-time data...",
  "Analyzing emergency situation..."
];

interface LiveEmergencyViewProps {
  summary: Summary;
}

const LiveEmergencyView = ({ summary }: LiveEmergencyViewProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % EMERGENCY_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-white rounded-xl shadow-sm mb-6">
      {/* Background skeleton pulse effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-gray-50 animate-pulse" />

      {/* Emergency Header */}
      <div className="relative bg-white/80 border-b-2 border-red-500 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Ambulance className="h-8 w-8 text-red-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">LIVE EMERGENCY</h2>
              <p className="text-sm text-red-600 animate-pulse">{EMERGENCY_MESSAGES[messageIndex]}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-600" />
            <span className="text-red-600 font-medium">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Critical Info Grid */}
      {/* <div className="relative grid grid-cols-2 gap-4 p-6">
        <div className="bg-white/80 rounded-lg p-6 border-l-4 border-yellow-500 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">First Responder Notes</h3>
          <p className="text-gray-800">{summary.ambulance_notes}</p>
        </div>

        <div className="bg-white/80 rounded-lg p-6 border-l-4 border-blue-500 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical Medical Info</h3>
          <div className="space-y-4">
            {summary.medical_journal.critical_information.map((info, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800">{info}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default LiveEmergencyView;