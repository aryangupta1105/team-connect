# Team Connect
  
## Description
Team Connect is a modern hackathon team finder and management platform. It helps students and professionals discover, connect, and collaborate with the best teammates for hackathons and projects. The app features secure contact sharing, advanced filtering, team invites, profile management, and a beautiful, responsive UI.
  
## Features
- **Team Discovery & Management**
  - Create, edit, and manage teams
  - Browse open teams and view details
  - Invite users to teams (leader-only)
  - Accept/reject join requests and invites
  - Team dashboard and analytics
- **Profile Management**
  - Create and edit personal profiles
  - Upload avatars and showcase skills, bio, links
  - Profile completion indicator
- **Advanced Filtering**
  - Filter teams by domain, skills, year, female member requirement, and problem statement
  - Filter profiles by skills, year, gender, and "looking for team" status
  - Multi-select and dynamic search for skills and problems
- **Secure Contact Sharing**
  - Request contact info from team members or profiles
  - Accept/reject/revoke contact info requests
  - Contact info only visible to authorized users
  - Audit trail for all contact sharing actions
- **Requests & Invites**
  - Track incoming/outgoing requests and invites
  - Withdraw/cancel requests and invites
  - Real-time status updates and notifications
- **Admin & Analytics**
  - Admin dashboard for user and team stats
  - Manage teams and users
- **Responsive UI**
  - Fully responsive for all screen sizes
  - Modern grid, motion, and feedback animations
  - Accessible forms, dropdowns, and modals
  
## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend:** Convex (serverless database & functions)
- **Auth:** Convex Auth
- **Notifications:** Sonner
- **Routing:** React Router
  
## Filtering Techniques
- **Teams:**
  - Domain filter (text search)
  - Skills filter (multi-select, comma-separated)
  - Year filter (dropdown)
  - Female member filter (requires/has)
  - Problem statement filter (multi-select)
- **Profiles:**
  - Skills filter (multi-select)
  - Year filter (dropdown)
  - Gender filter (dropdown)
  - "Looking for team" filter (boolean)
- **Dynamic Filtering:**
  - All filters update results in real-time
  - Multi-select and creatable options for skills/problems
  - Sorting by profile completion and team membership
  
## Secure Contact Sharing
- Contact info is hidden by default
- Users must request access to contact info
- Only authorized users can view contact info
- Team leaders can accept/reject/revoke requests
- All actions are logged for security
  
## How to Run
1. Clone the repo
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Configure Convex backend and environment variables as needed
  
## Contributing
Pull requests and issues are welcome! Please follow the code style and add tests for new features.
  
## License
MIT
  
---
Made with ❤️ by Aryan Gupta
