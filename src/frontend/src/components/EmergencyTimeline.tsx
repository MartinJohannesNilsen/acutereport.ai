import React, { useRef } from "react";
import { Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { TimelineEvent } from "../types";

interface TimelineEventProps {
  time: string;
  description: string;
  isFirst: boolean;
  isLast: boolean;
  status: "live" | "processing" | "completed";
}

const TimelineEvent = ({
  time,
  description,
  isFirst,
  isLast,
  status,
}: TimelineEventProps) => (
  <div className="relative flex-none w-[140px] group">
    {/* Connector Line */}
    {!isFirst && (
      <div
        className={`absolute left-[-70px] right-[70px] top-4 h-0.5 -translate-y-1/2 
        ${status === "live" 
          ? "bg-red-300/50" 
          : status === "processing" 
          ? "bg-yellow-300/50"
          : "bg-blue-300/50"} 
        transition-colors duration-300`}
      />
    )}

    {/* Event Point */}
    <div className="relative flex flex-col items-center">
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 
        transition-all duration-300 ${
          status === "live"
            ? "border-red-500 bg-red-50 animate-pulse"
            : status === "processing"
            ? "border-yellow-500 bg-yellow-50"
            : "border-blue-500 bg-blue-50"
        }`}
      >
        {status === "live" ? (
          <div className="w-2 h-2 bg-red-600 rounded-full" />
        ) : status === "processing" ? (
          <Loader2 className="w-3 h-3 text-yellow-600" />
        ) : (
          <div className="w-2 h-2 bg-blue-600 rounded-full" />
        )}
      </div>

      {/* Time */}
      <div className="mt-1 text-xs font-semibold text-gray-600 truncate max-w-full px-1">
        {time}
      </div>

      {/* Description */}
      <div className="mt-1 text-xs text-gray-600 font-medium text-center line-clamp-2 px-1">
        {description}
      </div>
    </div>

    {/* Progress line for last event */}
    {isLast && status !== "completed" && (
      <div
        className={`absolute left-[70px] right-[-70px] top-4 h-0.5 -translate-y-1/2 
        ${status === "live" 
          ? "bg-gradient-to-r from-red-300/50 to-transparent" 
          : "bg-gradient-to-r from-yellow-300/50 to-transparent"}`}
      />
    )}
  </div>
);

interface TimelineProps {
  events: TimelineEvent[];
  status: "live" | "processing" | "completed";
}

const EmergencyTimeline = ({ events = [], status }: TimelineProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formattedEvents = events.map((event) => ({
    time: new Date(event.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    description: event.description,
  }));

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -140 : 140;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (events.length === 0) {
    return (
      <div className={`bg-white rounded-lg border ${
        status === "live" 
          ? "border-red-200" 
          : status === "processing"
          ? "border-yellow-200"
          : "border-gray-100"
      } p-6 mb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-gray-600 shrink-0" />
          <h3 className="font-medium text-gray-900 text-lg">Emergency Timeline</h3>
        </div>
        <div className="flex gap-2 justify-center">
          <TimelineEvent
            time="Now"
            description={status === "live" ? "Emergency in progress..." : "Processing..."}
            isFirst={true}
            isLast={true}
            status={status}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${
      status === "live" 
        ? "border-red-200" 
        : status === "processing"
        ? "border-yellow-200"
        : "border-gray-100"
    } p-6 mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <Clock className="h-5 w-5 text-black shrink-0" />
        <h3 className="font-medium text-gray-900 text-lg">Emergency Timeline</h3>
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        {formattedEvents.length > 4 && (
          <>
            <button
              onClick={() => scroll("left")}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </>
        )}

        {/* Timeline Container */}
        <div className="mx-6 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{
              width: "760px", // 560px - Fixed width to show 4 events (4 * 140px)
              maxWidth: "100%"
            }}
          >
            {formattedEvents.map((event, index) => (
              <TimelineEvent
                key={index}
                time={event.time}
                description={event.description}
                isFirst={index === 0}
                isLast={index === formattedEvents.length - 1}
                status={status}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyTimeline;