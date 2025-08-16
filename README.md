# Prima Finance Assistant

A comprehensive Financial Planning & Analysis (FP&A) web application built with React, TypeScript, Supabase, and AI-powered insights.

## 🚀 Features

### Core Analytics
- **Overview Dashboard**: KPI tiles, monthly trends, variance summary
- **Variance Analysis**: Compare actual vs budget/forecast with drill-through capabilities
- **Sales Analysis**: Conversion funnel, retention rates, channel performance
- **Forecasting**: Multiple methods (Moving Average, YoY, CAGR) with rolling forecasts

### AI Integration
- **Ask Jude**: Natural language query interface for financial analysis
- **Smart Insights**: AI-powered variance explanations and recommendations
- **Report Generation**: Automated narrative creation and PowerPoint export

### Data Management
- **Import Wizard**: CSV/XLSX upload with field mapping and validation
- **Multi-dimensional Analysis**: Business units, markets, products, channels
- **Scenario Planning**: Create and compare multiple business scenarios

### Advanced Features
- **PowerPoint Export**: Branded slide deck generation with custom themes
- **Role-based Access**: Admin, Analyst, and Viewer permissions
- **Audit Trail**: Complete logging of all user actions and data changes

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Edge Functions)
- **AI**: OpenAI GPT integration for natural language processing
- **Charts**: Custom chart components for data visualization
- **File Processing**: SheetJS for Excel/CSV parsing
- **PPT Generation**: PptxGenJS for presentation export

## 📊 Database Schema

### Core Tables
- `companies`: Company information
- `business_units`: Organizational units
- `fact_ledger`: Main transactional data with scenarios (ACTUAL/BUDGET/FORECAST)
- `dim_*`: Dimension tables for accounts, products, channels, markets
- `calendar`: Time dimension with period keys

### Measures & KPIs
- Revenue, COGS, Gross Margin, Operating Expenses, EBITDA
- Gross Written Premium (GWP), Loss Ratio (LR)
- Contracts, Conversion Rate, Retention Rate

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- Supabase account
- OpenAI API key

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create new project at supabase.com
   - Run database migrations (included in project)
   - Configure RLS policies
4. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key (via Supabase Edge Function secrets)
5. Start development server: `npm run dev`

### Database Setup
The application includes:
- Complete schema migrations with RLS policies
- Sample data for Italy, UK, and Spain operations
- 12 months of ACTUAL and BUDGET data
- Mixed favorable/unfavorable variances for testing

## 🎯 Usage Examples

### Quick Start Workflow
1. **View Dashboard**: See KPIs and trends on Overview page
2. **Analyze Variances**: Compare actual vs budget performance
3. **Ask Jude**: Natural language queries like "Show Italy revenue variance vs budget"
4. **Upload Data**: Use Import wizard to upload CSV/Excel files (coming soon)
5. **Generate Reports**: Create branded PowerPoint presentations (coming soon)

### Ask Jude Examples
- "Show variance analysis for Italy vs budget"
- "Generate Q2 revenue forecast"
- "Compare conversion rates by channel"
- "Build a scenario with 10% price increase"
- "Create executive summary presentation"

## 🔐 Security Features

- Row Level Security (RLS) for multi-tenant data isolation
- Role-based access control (Admin/Analyst/Viewer)
- Audit logging for all financial operations
- Secure API key management via Supabase secrets

## 🎨 Customization

### Theme Management
- Custom color schemes for financial data
- Chart color palettes optimized for variance analysis
- Configurable slide masters for PowerPoint export
- Support for brand color extraction from existing presentations

### NetSuite Integration (Planned)
- OAuth 2.0 and Token-based authentication stubs
- Automated data synchronization for accounts, actuals, and budgets
- RESTlet and SOAP API support

## 📈 Performance Optimization

- Server-side aggregations for large datasets
- Efficient indexing on fact table dimensions
- Pagination for large query results
- Session-based caching for repeated operations

## 🧪 Testing Data

Sample data includes:
- 3 business units (Italy, UK, Spain)
- 12 months of financial data
- Multiple products and channels
- Realistic variance patterns for testing

## 📝 API Endpoints

### Edge Functions
- `/ask-jude`: AI-powered query processing
- `/explain-variance`: Detailed variance analysis (coming soon)
- `/generate-report`: PowerPoint generation (coming soon)
- `/import-data`: File upload and processing (coming soon)

## 🚀 Current Status

### ✅ Completed
- Complete database schema with seed data
- Overview Dashboard with KPIs and trends
- Variance Analysis with drill-through
- Ask Jude AI assistant with natural language processing
- Modern UI with finance-themed design system
- Global filters for multi-dimensional analysis
- Supabase integration with proper security

### 🔄 In Progress
- Sales Analysis dashboard
- Forecasting tools with multiple methods
- Scenario Simulator
- Data import wizard
- PowerPoint report generation

## 🤝 Contributing

This is a complete FP&A solution designed for:
- Finance teams needing modern analytics tools
- Companies seeking AI-powered financial insights
- Organizations requiring flexible scenario planning
- Enterprises needing branded reporting capabilities

## 📄 License

Enterprise-ready financial planning and analysis solution.

---

**Prima Finance Assistant** - Transforming Financial Planning & Analysis with AI-powered insights and modern web technology.