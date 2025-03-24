export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  actions?: Action[];
}

export interface Action {
  id: number;
  title: string;
  description?: string;
  status: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  showDropdown?: boolean;
}

export interface Progress {
  id: number;
  actionId: number;
  count: number;
  notes?: string;
  createdAt: string;
} 