export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
}

export interface Stage {
  completed: boolean;
  content?: string;
  imageUrl?: string;
  finalNotes?: string;
}

export interface Group {
  id: string;
  name: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  groupId: string; // Changed from keyword to groupId
  userId: string;
  title: string;
  status: 'draft' | 'published';
  progress: number; // 0, 1, 2, 3
  stages: {
    writing: Stage;
    image: Stage;
    posting: Stage;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
  lastCompletedAt?: string;
}
