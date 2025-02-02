export interface TimelineEvent {
  timestamp: string;
  description: string;
}

export interface Medication {
  medication: string;
  reason: string;
}

export interface Allergy {
  allergy_name: string;
  details: string;
}

export interface Information {
  condition: string;
  details: string;
}

export interface Summary {
  id: string;
  _id?: string;
  title: string;
  date: string;
  ambulance_notes: string;
  timeline_events?: TimelineEvent[];
  medical_journal: {
    critical_information?: Information[];
    current_medications?: Medication[];
    allergy_information?: Allergy[];
  };
  status: "processing" | "completed" | "live";
  ai_summary?: string;
}