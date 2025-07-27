# CareSync - Intelligent Emergency Department Management System

[Français](./README_FR.md) | **English**

## Demo Video

https://github.com/user-attachments/assets/3f42b9ac-d325-4b4f-b3b1-d22c6143fdd9

## Overview

CareSync is an advanced healthcare management system designed to optimize emergency department workflows through artificial intelligence and real-time patient monitoring. This comprehensive platform integrates voice-enabled patient check-in, AI-powered triage analysis, and intelligent workflow management to enhance healthcare delivery efficiency and patient outcomes.

## Development Context

This project was developed as part of the **Shipfast w/ Anthropic, Cerebras, Lovable and Windsurf** hackathon, demonstrating the integration of cutting-edge AI technologies in healthcare applications.

## Team Members

- **Paul Archer**
- **Tom Effernelli**
- **Orpheo Hellandsjo**
- **Valentin Potié**
- **Basekou Diaby**

## Key Features

### 1. Intelligent Patient Check-In System
- **Voice-Activated Check-In**: Natural language processing powered by Anthropic's Claude AI for seamless patient registration
- **Multi-Modal Input**: Support for both traditional form-based and voice-driven data collection
- **Real-Time Validation**: Intelligent form validation with contextual error handling and suggestions
- **Medical Image Analysis**: AI-powered analysis of injury photographs for preliminary assessment

### 2. AI-Powered Triage Analysis
- **Clinical Decision Support**: Advanced algorithms for urgency level determination and resource allocation
- **Risk Stratification**: Automated patient prioritization based on clinical indicators and historical data
- **Predictive Analytics**: Machine learning models for wait time estimation and treatment duration forecasting
- **Multi-Factor Assessment**: Integration of vital signs, symptoms, medical history, and visual evidence

### 3. Dynamic Workflow Management
- **Real-Time Patient Tracking**: Live dashboard with drag-and-drop interface for workflow optimization
- **Kanban-Style Board**: Visual representation of patient progression through emergency department stages
- **Automated Status Updates**: System-driven patient status transitions with audit trail maintenance
- **Resource Optimization**: Intelligent allocation of medical staff and equipment based on current demand

### 4. Advanced Analytics and Reporting
- **Performance Metrics**: Comprehensive dashboard with key performance indicators and trend analysis
- **Seasonal Pattern Recognition**: Historical data analysis for capacity planning and resource management
- **Predictive Modeling**: Statistical forecasting for patient volume and resource requirements
- **Quality Assurance**: Continuous monitoring of care quality metrics and patient satisfaction

## Technical Architecture

### Frontend Framework
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for responsive and accessible user interface design
- **Shadcn/UI** component library for consistent design system implementation
- **React Hook Form** with Zod validation for robust form management

### Backend Infrastructure
- **Supabase** for real-time database operations and authentication
- **PostgreSQL** with Row Level Security (RLS) for data protection
- **Edge Functions** for serverless AI processing and external API integration

### AI and Machine Learning
- **Anthropic Claude API** for natural language processing and clinical decision support
- **Web Speech API** for voice recognition and synthesis
- **Computer Vision** for medical image analysis and assessment

### Security and Compliance
- **Role-Based Access Control (RBAC)** with medical staff hierarchies
- **Comprehensive Audit Logging** for all system interactions and data modifications
- **Data Encryption** for sensitive medical information protection
- **HIPAA-Compliant** security measures and privacy controls

## Installation and Setup

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- Supabase account and project setup

### Environment Configuration
Create a `.env.local` file with the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Installation Steps
```bash
# Clone the repository
git clone https://github.com/your-username/CareSync-AI-Triage.git
cd CareSync-AI-Triage

# Install dependencies
npm install

# Initialize database schema
npm run db:migrate

# Start development server
npm run dev
```

## Usage Guidelines

### For Medical Staff
1. **Authentication**: Log in with assigned medical credentials
2. **Patient Management**: Access patient dashboard for real-time status monitoring
3. **Triage Assessment**: Conduct clinical evaluations with AI-assisted decision support
4. **Workflow Optimization**: Utilize drag-and-drop interface for patient flow management

### For Patients
1. **Self Check-In**: Complete registration using voice or traditional form input
2. **Medical History**: Provide comprehensive health information and current symptoms
3. **Image Upload**: Submit photographs of injuries for AI analysis (optional)
4. **QR Code Receipt**: Receive digital identification for tracking and updates

### For Administrators
1. **Analytics Dashboard**: Monitor department performance and resource utilization
2. **Staff Management**: Configure user roles and permissions
3. **System Configuration**: Adjust AI parameters and workflow settings
4. **Audit Review**: Access comprehensive logs for compliance and quality assurance

## API Documentation

### Core Endpoints
- `POST /api/patients` - Create new patient record
- `GET /api/patients` - Retrieve patient list with filtering
- `PUT /api/patients/:id` - Update patient status and information
- `POST /api/triage/analyze` - Perform AI-powered triage analysis
- `GET /api/analytics` - Generate performance reports and statistics

### Authentication
All API endpoints require authentication via Supabase JWT tokens with appropriate role-based permissions.

## Performance Metrics

The system has been optimized for:
- **Sub-second response times** for critical operations
- **99.9% uptime** through robust error handling and fallback mechanisms
- **WCAG 2.1 AA compliance** for accessibility standards
- **Mobile-responsive design** for cross-device compatibility

## Contributing

We welcome contributions from the healthcare technology community. Please review our contribution guidelines and code of conduct before submitting pull requests.

### Development Standards
- TypeScript strict mode enabled
- ESLint and Prettier configuration for code consistency
- Comprehensive unit and integration testing
- Security-first development practices

## License

This project is licensed under the MIT License. See the LICENSE file for detailed terms and conditions.

## Acknowledgments

Special thanks to the organizers of the Shipfast hackathon and the supporting technology partners: Anthropic, Cerebras, Lovable, and Windsurf for providing the platform and resources that made this project possible.

## Contact Information

For technical inquiries, collaboration opportunities, or deployment assistance, please contact the development team through the project repository or hackathon communication channels.

---

**Disclaimer**: This system is designed for educational and demonstration purposes. Any production deployment in healthcare environments must undergo appropriate clinical validation, regulatory approval, and compliance verification.