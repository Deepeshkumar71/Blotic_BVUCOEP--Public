# 🚀 BLOTIC - Blockchain & Web3 Club Platform

> ⚠️ **Note:** This is a public version of the original private repository. Sensitive information and secret keys have been removed.

> **Bharati Vidyapeeth's Premier Blockchain & Web3 Club Management System**

A modern, full-stack web application built for managing blockchain and Web3 club activities, events, and community engagement.

## 🌟 Features

### 🔐 Authentication & User Management
- **Secure Authentication** with Supabase Auth
- **Role-based Access Control** (Admin, Core Team, Co-Head, Member, Student)
- **Email Verification** system with admin toggle
- **Profile Management** with avatar uploads
- **Session Management** across multiple devices

### 🤖 AI Integration (Model Context Protocol)
- **MCP Server** for AI assistant integration
- **Tools** for accessing user, event, and team data
- **Resources** for application statistics
- **Streamable HTTP** transport support

### 📅 Event Management
- **Complete Event CRUD** operations
- **Event Registration** system with capacity limits
- **Real-time Registration Tracking**
- **CSV Export** for registration data
- **Virtual/Physical Event** support
- **Event Photo Galleries**

### 👥 Team Management
- **Core Team Showcase** with leadership hierarchy
- **Faculty Coordinators** section
- **Social Media Integration** (LinkedIn, Instagram, WhatsApp)
- **Dynamic Team Updates** via admin dashboard

### 📢 Announcements System
- **Multi-type Announcements** (General, Event, Important, Urgent)
- **Priority-based Display**
- **Target Audience** filtering
- **Real-time Synchronization**

### 🖼️ Media Management
- **Photo Gallery** with HEIC/HEIF conversion
- **Bulk Upload** with progress tracking
- **Supabase Storage** integration
- **Responsive Image Display**

### ⚙️ Admin Dashboard
- **Real-time Analytics** and statistics
- **User Management** with role updates
- **System Settings** configuration
- **Activity Monitoring**

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Router** for navigation

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database with RLS
- **Supabase Auth** for authentication
- **Supabase Storage** for file uploads
- **Real-time subscriptions**

### AI Integration
- **Model Context Protocol (MCP)** for AI assistant connectivity
- **MCP SDK** for tool and resource exposure

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Git** for version control

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd blotic-web-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the credentials template
   cp CREDENTIALS_TEMPLATE.md CREDENTIALS.md
   
   # Create environment file
   cp .env.example .env.local
   ```

4. **Configure your credentials**
   - Edit `CREDENTIALS.md` with your actual Supabase credentials
   - Update `.env.local` with your environment variables

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── admin/          # Admin-specific components
├── contexts/           # React contexts (Auth, Upload Progress)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/      # Supabase client and types
├── pages/              # Page components
├── utils/              # Utility functions
└── App.tsx            # Main application component
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend Servers
npm run server       # Start main backend server
npm run mcp-server   # Start MCP server for AI integration

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Database
npm run db:types     # Generate TypeScript types from Supabase
```

## 🌐 Deployment

### Recommended Platforms
- **Vercel** (Recommended)
- **Netlify**
- **Cloudflare Pages**

### Build Configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x

### Environment Variables
Set the following environment variables in your deployment platform:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### MCP Server
The MCP server runs on port 3002 and can be started with `npm run mcp-server`. For AI assistant integration, ensure this server is accessible from the AI client.

## 🔒 Security & Credentials

> **⚠️ IMPORTANT**: Never commit sensitive credentials to version control!

- All sensitive information is documented in `CREDENTIALS_TEMPLATE.md`
- Create your own `CREDENTIALS.md` file (gitignored) with actual values
- Use environment variables for all sensitive configuration
- Supabase RLS policies protect data access

## 👨‍💼 Admin Access

### Default Admin Account
- **Email**: `bloticbvducoep@gmail.com`
- **Role**: Super Admin
- **Access**: Full system administration

### Admin Features
- User role management
- Event creation and management
- Announcement publishing
- Core team management
- System settings configuration
- Analytics and reporting

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

### Development Team
- **Email**: bloticbvducoep@gmail.com
- **Institution**: Bharati Vidyapeeth College of Engineering, Pune
- **Department**: Computer Engineering

### Getting Help
- 📖 Check the documentation in `CREDENTIALS_TEMPLATE.md`
- 🐛 Report bugs via GitHub Issues
- 💡 Request features via GitHub Issues
- 📧 Contact the team for urgent matters

## 🙏 Acknowledgments

- **Bharati Vidyapeeth College of Engineering** for institutional support
- **Supabase** for providing excellent backend services
- **Vercel** for hosting and deployment platform
- **Open Source Community** for the amazing tools and libraries

---

**Built with ❤️ by the BLOTIC Development Team**
