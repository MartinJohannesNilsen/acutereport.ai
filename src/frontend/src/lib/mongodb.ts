// src/lib/mongodb.ts
import type { Summary } from "../types";

type EventCallback = (data: any) => void;

class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, data: any) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(data));
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

const API_BASE_URL = "http://89.169.97.156:8080";

class DatabaseClient {
  private eventEmitter: EventEmitter;
  private eventSource: EventSource | null = null;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  async connect() {
    try {
      // We might not need SSE connection for pages deployment
      // Will depend on your setup
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  }

  async getSummaries(): Promise<Summary[]> {
    const response = await fetch(`${API_BASE_URL}/db/summaries`, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch summaries");
    }
    return response.json();
  }

  async insertSummary(summary: Omit<Summary, "id">): Promise<Summary> {
    const response = await fetch(`${API_BASE_URL}/db/summaries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(summary),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("Failed to insert summary:", errorDetails);
      throw new Error("Failed to insert summary");
    }
    return response.json();
  }

  async updateSummary(id: string, update: Partial<Summary>): Promise<Summary> {
    const response = await fetch(`${API_BASE_URL}/db/summaries/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      throw new Error("Failed to update summary");
    }
    return response.json();
  }

  onInsert(callback: (summary: Summary) => void) {
    this.eventEmitter.on("INSERT", callback);
    // Simulate real-time updates if needed
  }

  onUpdate(callback: (summary: Summary) => void) {
    this.eventEmitter.on("UPDATE", callback);
    // Simulate real-time updates if needed
  }

  removeAllListeners(event?: string) {
    this.eventEmitter.removeAllListeners(event);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.removeAllListeners();
  }
}

export const mongoDb = new DatabaseClient();
