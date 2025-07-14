
export enum Role {
  User = 'user',
  Model = 'model',
}

export interface Message {
  role: Role;
  content: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  summary: string;
  content: string;
}
