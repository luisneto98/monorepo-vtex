# Data Models

## User

**Purpose:** Represents both admin users (backoffice) and event participants (app users)

**Key Attributes:**
- `_id`: ObjectId - MongoDB unique identifier
- `email`: string - Unique email for authentication
- `password`: string - Hashed password (bcrypt)
- `role`: enum - Role type (super_admin, producer, sponsor, participant)
- `profile`: object - User profile information
- `preferences`: object - User preferences and settings
- `ticketCode`: string - Ticket validation code (participants only)
- `isValidated`: boolean - Whether ticket has been validated
- `createdAt`: Date - Registration timestamp
- `updatedAt`: Date - Last modification timestamp

### TypeScript Interface
```typescript
interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: 'super_admin' | 'producer' | 'sponsor' | 'participant';
  profile: {
    name: string;
    phone?: string;
    company?: string;
    position?: string;
    photoUrl?: string;
    language: 'pt-BR' | 'en';
  };
  preferences?: {
    interests: string[];
    notificationsEnabled: boolean;
    favoriteSessionIds: Types.ObjectId[];
  };
  ticketCode?: string;
  isValidated: boolean;
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Has many FavoriteSessions (through preferences.favoriteSessionIds)
- Has many SocialPosts (author)
- Has many Messages (sender/receiver)

## Session

**Purpose:** Represents event sessions/talks with schedule and location information

**Key Attributes:**
- `_id`: ObjectId - MongoDB unique identifier
- `title`: object - Multilingual title (pt-BR, en)
- `description`: object - Multilingual description
- `speakerIds`: ObjectId[] - Array of speaker references
- `startTime`: Date - Session start time
- `endTime`: Date - Session end time
- `stage`: string - Physical location/stage
- `tags`: string[] - Categorization tags
- `sponsorIds`: ObjectId[] - Session sponsors
- `isHighlight`: boolean - Featured session flag
- `capacity`: number - Maximum attendees

### TypeScript Interface
```typescript
interface ISession {
  _id: Types.ObjectId;
  title: {
    'pt-BR': string;
    'en': string;
  };
  description: {
    'pt-BR': string;
    'en': string;
  };
  speakerIds: Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  stage: string;
  tags: string[];
  sponsorIds?: Types.ObjectId[];
  isHighlight: boolean;
  isVisible: boolean;
  capacity?: number;
  streamUrl?: string; // For phase 2 live streaming
  materials?: {
    title: string;
    url: string;
    type: 'pdf' | 'video' | 'link';
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Belongs to many Speakers (speakerIds)
- Belongs to many Sponsors (sponsorIds)
- Has many UserFavorites (through User.preferences)

## Speaker

**Purpose:** Information about event speakers/presenters

### TypeScript Interface
```typescript
interface ISpeaker {
  _id: Types.ObjectId;
  name: string;
  bio: {
    'pt-BR': string;
    'en': string;
  };
  photoUrl: string;
  company: string;
  position: {
    'pt-BR': string;
    'en': string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  priority: number;
  isHighlight: boolean;
  isVisible: boolean;
  sessionIds: Types.ObjectId[]; // Computed from Sessions
  createdAt: Date;
  updatedAt: Date;
}
```

## Sponsor

**Purpose:** Event sponsors with different tiers and benefits

### TypeScript Interface
```typescript
interface ISponsor {
  _id: Types.ObjectId;
  name: string;
  description: {
    'pt-BR': string;
    'en': string;
  };
  logoUrl: string;
  tier: string; // References SponsorTier
  orderInTier: number;
  websiteUrl: string;
  standLocation?: string;
  adminEmail: string;
  contactEmail?: string;
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  maxPosts: number;
  postsUsed: number;
  materials?: {
    title: string;
    url: string;
    type: 'pdf' | 'video' | 'link';
  }[];
  metrics?: {
    profileViews: number;
    messagesReceived: number;
    materialsDownloaded: number;
  };
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
