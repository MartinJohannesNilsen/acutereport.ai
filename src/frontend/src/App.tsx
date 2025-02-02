import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Ambulance,
  BookOpen,
  Clock,
  Heart,
  Pill,
  AlertCircle,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { mongoDb } from "./lib/mongodb";
import type { Summary } from "./types";
import EmergencyTimeline from "./components/EmergencyTimeline";
import LiveEmergencyView from "./components/LiveEmergencyView";
import NeutralView from "./components/NeutralView";

function App() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchSummaries = useCallback(async () => {
    try {
      setError(null);
      const data: (Summary & { _id?: string })[] = await mongoDb.getSummaries();
      if (data) {
        const mappedData: Summary[] = data
          .map(summary => ({
            ...summary,
            id: summary.id || summary._id || String(Date.now()),
          }))
        setSummaries(mappedData);
      }
    } catch (error) {
      console.error("Error fetching summaries:", error);
      setError("Failed to fetch summaries. Please try again.");
    }
  }, []);

  const updateSelectedSummary = useCallback(() => {
    if (selectedSummary) {
      const updatedSummary = summaries.find(
        summary => summary.id === selectedSummary.id || summary._id === selectedSummary._id
      );
      if (updatedSummary && JSON.stringify(updatedSummary) !== JSON.stringify(selectedSummary)) {
        setSelectedSummary(updatedSummary);
      }
    }
  }, [summaries, selectedSummary]);

  useEffect(() => {
    updateSelectedSummary();
  }, [summaries, updateSelectedSummary]);

  useEffect(() => {
    if (selectedSummary && window.innerWidth <= 1024) {
      setIsSidebarCollapsed(true);
    }
  }, [selectedSummary]);

  useEffect(() => {
    const setupMongoConnection = async () => {
      try {
        await fetchSummaries();
        const intervalId = setInterval(fetchSummaries, 1000);
        return () => {
          clearInterval(intervalId);
          mongoDb.disconnect();
          mongoDb.removeAllListeners("INSERT");
          mongoDb.removeAllListeners("UPDATE");
        };
      } catch (error) {
        console.error("MongoDB connection error:", error);
        setError("Failed to connect to database. Please refresh the page.");
      }
    };

    setupMongoConnection();
  }, [fetchSummaries]);

  const getStatusBadge = (status: Summary["status"]) => {
    if (status === "live") {
      return (
        <span className="flex items-center space-x-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span>Live</span>
        </span>
      );
    }

    if (status === "processing") {
      return (
        <span className="flex items-center space-x-1.5 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Processing</span>
        </span>
      );
    }

    return (
      <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
        Completed
      </span>
    );
  };

  const getSectionHeader = (status: Summary["status"], title: string) => {
    const processingMessages: Record<string, string> = {
      "Emergency Summary": "Processing emergency data...",
      "First Responder Summary": "Analyzing first responder notes...",
      "Patient Journal": "Analyzing medical history..."
    };

    const icons: Record<string, JSX.Element> = {
      "Emergency Summary": <FileText className="h-6 w-6 text-black" />,
      "First Responder Summary": <Ambulance className="h-6 w-6 text-black" />,
      "Patient Journal": <BookOpen className="h-6 w-6 text-black" />
    };

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {icons[title] || <FileText className="h-6 w-6 text-black" />}
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        {status === "processing" && (
          <div className="flex items-center space-x-2 text-yellow-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{processingMessages[title] || "Processing..."}</span>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <div className="text-red-600 mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchSummaries}
            className="mt-4 px-4 py-2 bg-black-100 text-black rounded-md hover:bg-black-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Ambulance className="h-7 w-7 text-black" />
              <span className="text-2xl font-semibold text-gray-900">
                AcuteReport.ai
              </span>
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6 relative">
          {/* Sidebar with transition */}
          <div 
            className={`
              transition-all duration-300 ease-in-out
              ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-96 opacity-100'}
              lg:opacity-100
              overflow-hidden
              bg-white rounded-xl shadow-sm
              flex-shrink-0
            `}
          >
            {/* Sidebar content */}
            <div className="w-96"> {/* Fixed width container */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-black" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Summaries
                    </h2>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {summaries.map((summary) => (
                  <div
                    key={summary.id || summary._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSummary(summary);
                    }}
                    className={`
                      p-6 
                      cursor-pointer 
                      relative 
                      transition-colors
                      duration-200
                      border-l-4
                      ${selectedSummary && (selectedSummary.id === summary.id || selectedSummary._id === summary._id)
                        ? summary.status === "live"
                          ? "bg-red-100 border-l-red-600" 
                          : "bg-gray-100 border-l-black"
                        : "border-l-transparent hover:bg-gray-100"
                      }
                      ${summary.status === "live" && !selectedSummary 
                        ? "bg-red-50" 
                        : ""
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${summary.status === 'live' ? 'text-red-700' : 'text-gray-900'}`}>
                        {summary.title}
                      </h3>
                      {getStatusBadge(summary.status)}
                    </div>
                    
                    <p className={`text-sm mt-1 ${summary.status === 'live' ? 'text-red-500' : 'text-gray-500'}`}>
                      {new Date(summary.date).toLocaleString()}
                    </p>
                    
                    <p className={`text-sm mt-2 line-clamp-3 ${summary.status === 'live' ? 'text-red-700' : 'text-gray-600'}`}>
                      {summary.ambulance_notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content with transition */}
          <div 
            className={`
              transition-all duration-300 ease-in-out
              flex-1
              ${isSidebarCollapsed ? 'w-full' : 'lg:flex-1'}
            `}
          >
            {/* Toggle button for mobile/tablet */}
            {selectedSummary && (
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="lg:hidden fixed left-4 top-1/2 transform -translate-y-1/2 z-50
                  bg-white rounded-full p-3 shadow-lg border border-gray-200
                  hover:bg-gray-50 active:bg-gray-100 transition-all
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-6 w-6 text-gray-600" />
                ) : (
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                )}
              </button>
            )}

            {selectedSummary ? (
              <>
                {selectedSummary.status === "live" && (
                  <LiveEmergencyView summary={selectedSummary} />
                )}
                <div className="space-y-6">
                  {/* Emergency Timeline */}
                  {selectedSummary && (
                    <EmergencyTimeline
                      events={selectedSummary.timeline_events || []}
                      status={selectedSummary.status}
                    />
                  )}

                  {/* Regular content sections - only shown when not live */}
                  {selectedSummary?.status !== "live" && (
                    <>
                      {/* AI Summary Section */}
                      <div
                        className={`bg-white rounded-xl shadow-sm p-8 relative ${
                          selectedSummary?.status === "processing"
                            ? "border-2 border-yellow-500"
                            : ""
                        }`}
                      >
                        {selectedSummary &&
                          getSectionHeader(selectedSummary.status, "Emergency Summary")}
                        {selectedSummary?.ai_summary && (
                          <div className="bg-blue-50 p-6 rounded-lg border border-gray-100 relative min-h-[120px]">
                            <p className="text-gray-600">{selectedSummary.ai_summary}</p>
                          </div>
                        )}
                      </div>

                      {/* First Responder Summary Section */}
                      <div
                        className={`bg-white rounded-xl shadow-sm p-8 relative ${
                          selectedSummary?.status === "processing"
                            ? "border-2 border-yellow-500"
                            : ""
                        }`}
                      >
                        {selectedSummary &&
                          getSectionHeader(
                            selectedSummary.status,
                            "First Responder Summary"
                          )}
                        {selectedSummary?.ambulance_notes && (
                          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 relative min-h-[120px]">
                            <p className="text-gray-600">
                              {selectedSummary.ambulance_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Patient Medical History Section */}
                      <div className={`bg-white rounded-xl shadow-sm p-8 relative ${
                        selectedSummary?.status === "processing"
                          ? "border-2 border-yellow-500"
                          : ""
                      }`}>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-6 w-6 text-black" />
                            <h2 className="text-xl font-semibold text-gray-900">
                              Patient Journal
                            </h2>
                          </div>
                          {selectedSummary?.status === "processing" && (
                            <div className="flex items-center space-x-2 text-yellow-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Analyzing medical history...</span>
                            </div>
                          )}
                        </div>
                        {selectedSummary ? (
                          <div className="space-y-6 relative">
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                              <div className="flex items-center space-x-2 mb-3">  
                              <Heart className="h-5 w-5 text-red-500" />
                                <h3 className="font-medium text-red-500">
                                  Critical Information
                                </h3>
                              </div>
                              <ul className="list-disc list-inside text-gray-600 space-y-1">
                                {selectedSummary.medical_journal.critical_information?.map(
                                  (info, index) => (
                                    <li key={index}>{info.condition}: {info.details}</li>
                                  )
                                )}
                              </ul>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                              <div className="flex items-center space-x-2 mb-3">
                                <Pill className="h-5 w-5 text-black" />
                                <h3 className="font-medium text-gray-900">
                                  Current Medications
                                </h3>
                              </div>
                              <ul className="list-disc list-inside text-gray-600 space-y-1">
                                {selectedSummary.medical_journal.current_medications?.map(
                                  (medication, index) => (
                                    <li key={index}>{medication.medication}: {medication.reason}</li>
                                  )
                                )}
                              </ul>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                              <div className="flex items-center space-x-2 mb-3">
                                <AlertCircle className="h-5 w-5 text-black" />
                                <h3 className="font-medium text-gray-900">
                                  Allergy Information
                                </h3>
                              </div>
                              <ul className="list-disc list-inside text-gray-600 space-y-1">
                                {selectedSummary.medical_journal.allergy_information?.map(
                                  (allergy, index) => (
                                    <li key={index}>{allergy.allergy_name}: {allergy.details}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <p className="text-gray-600">
                              Select a summary from the list to view patient history...
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <NeutralView onShowSidebar={() => setIsSidebarCollapsed(false)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;