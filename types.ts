import React from 'react';

export type Role = 'ADMIN' | 'MANAGER' | 'USER' | string;

export interface User {
  id: string;
  username: string; // New field for login
  password?: string; // New field for login verification
  name: string;
  email: string;
  role: Role;
  avatar: string;
  // Enhanced Profile Fields
  memberSince: string;
  jobTitle: string;
  location: string;
  birthDate: string;
  phoneNumber: string;
  bio: string;
  permissions: string[];
}

export interface AccessLog {
    id: string;
    userId: string;
    timestamp: string; // ISO String
}

export interface MenuItemConfig {
  id: string;
  label: string;
  path: string;
  iconKey: string; // string reference to icon map
  visible: boolean;
  type: 'INTERNAL' | 'EXTERNAL';
  adminOnly?: boolean;
  allowedRoles?: string[]; // If empty, assumes logic based on routes or all allowed
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  trigger: 'WELCOME_PASSWORD' | 'RESET_PASSWORD' | 'TICKET_NEW_ASSIGN' | 'TICKET_UPDATED' | 'TICKET_COMMENT_REPLY';
}

export interface SmtpConfig {
  senderName: string;
  senderEmail: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  active: boolean;
  type: 'GLOBAL' | 'FIRST_ACCESS';
  startDate?: string;
  endDate?: string;
  // Targeting
  targetRoles: string[]; // Empty = All
  targetRoutes: string[]; // Empty = All, IDs of routes (e.g. 'dashboard')
}

export interface RoleDefinition {
  id: string;
  name: string;
  allowedRoutes: string[];
  capabilities: string[];
}

// --- NEW BOARD TYPES ---

export type ColumnType = 'text' | 'person' | 'status' | 'date' | 'priority' | 'link' | 'dropdown' | 'number' | 'tags';

export interface ColumnOption {
    id: string;
    label: string;
    color: string; // Tailwind class or Hex
}

export interface BoardColumn {
  id: string;
  title: string;
  type: ColumnType;
  width?: string;
  options?: ColumnOption[]; // Changed from string[] to ColumnOption[] for custom colors
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    done: boolean;
    dueDate?: string; // New: Deadline for specific item
    assigneeId?: string; // New: Responsible person
}

export interface Ticket {
  id: string;
  title: string;
  groupId: string;
  description?: string; // New field
  checklists?: ChecklistItem[]; // New field
  archived?: boolean; // New Field for archiving
  // Dynamic data storage: key is columnId, value is the content
  data: Record<string, any>; 
  comments: Comment[];
  // Legacy fields mapped for compatibility
  status: string;
  priority: string;
  assigneeId: string | null;
  startDate: string;
  dueDate: string;
}

export interface BoardGroup {
  id: string;
  title: string;
  color: string;
  collapsed?: boolean;
  archived?: boolean; // New Field
}

export interface AutomationRule {
    id: string;
    name: string;
    active: boolean;
    triggerColumnId: string; // The column that triggers (e.g., Status Column ID)
    triggerValue: string; // The value that triggers (e.g., "Done", "A Fazer") or empty for "Any"
    actionType: 'ASSIGN_USER' | 'NOTIFY_USER' | 'COMPLETE_CHECKLIST' | 'UPDATE_FIELD';
    actionTargetId?: string; // User ID or Field ID
    actionValue?: string; // Value to set or message
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  archived?: boolean; // New Field
  columns: BoardColumn[];
  groups: BoardGroup[];
  items: Ticket[];
  members: string[]; // List of User IDs
  automations?: AutomationRule[]; // New Field
}

// --- BRAND MANUAL TYPES ---
export type BrandBlockType = 'HEADER' | 'PARAGRAPH' | 'IMAGE' | 'COLOR_PALETTE' | 'TYPOGRAPHY' | 'DOWNLOAD' | 'INFO_BOX' | 'LINK_GROUP' | 'DIVIDER';

export interface BrandColor {
    hex: string;
    name: string;
    usage?: string;
}

export interface BrandLink {
    id: string;
    label: string;
    url: string;
}

export interface BrandBlock {
    id: string;
    type: BrandBlockType;
    // Flexible content based on type
    content: {
        text?: string;       // For Header, Paragraph, Typography Name, InfoBox Content
        subText?: string;    // For Typography CSS/Usage, InfoBox Title
        imageUrl?: string;   // For Image
        colors?: BrandColor[]; // For Palette
        links?: BrandLink[];   // For Link Group
        fileName?: string;   // For Download
        fileSize?: string;   // For Download
        style?: 'INFO' | 'WARNING' | 'TIP' | 'SOLID' | 'DASHED' | 'DOTTED'; // For InfoBox style OR Divider style
    };
}

export interface AppConfig {
  logoUrl: string;
  companyName: string;
  theme: {
    sidebarColor: string;
    sidebarTextColor: string;
    primaryColor: string;
    secondaryColor: string; // New Field
    // Login Customization
    loginBackgroundType: 'COLOR' | 'IMAGE';
    loginBackgroundContent: string; // Hex code or Image URL/Base64
    loginCardBackgroundColor: string;
  };
  emailTemplates: EmailTemplate[];
  smtpConfig: SmtpConfig;
  notices: Notice[];
  roles: RoleDefinition[];
  sidebarMenu: MenuItemConfig[];
  brandManual: BrandBlock[]; // New Field
}