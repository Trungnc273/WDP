# User-Side Complete Features Specification

## Overview

This specification covers the complete development of user-side features for the ReFlow second-hand marketplace platform, based on the SRS (Software Requirement Specification) and SDS (Software Design Specification) documents.

## Current Status

### ✅ Completed (MVP)
- Authentication system (Register, Login, Profile, Logout)
- Product browsing with search and filters
- Landing page with Chợ Tốt design
- 8 categories with 80 products seeded
- Basic backend infrastructure

### 🆕 To Be Developed
This spec covers 10 major feature areas with 48 detailed tasks:

1. **Product Management** - Create, edit, delete, manage listings
2. **Transaction Flow** - Complete escrow-based purchase system
3. **Wallet System** - Balance management, top-up, withdrawal
4. **Chat System** - Real-time buyer-seller communication
5. **Order Management** - View and track orders
6. **Rating & Feedback** - Rate sellers after transactions
7. **Report System** - Report products and create disputes
8. **Profile Management** - Update profile and KYC verification
9. **Shipping Integration** - Create and track shipping orders
10. **Payment Integration** - VNPay payment gateway

## Documents

### 📋 [Design Document](./design.md)
- System architecture
- Technology stack
- Module structure
- Feature designs (detailed UI/UX specifications)
- Database schema
- API endpoints
- Security considerations
- Performance optimization
- Testing strategy

### 📝 [Requirements Document](./requirements.md)
- 10 functional requirement categories (FR1-FR10)
- 48 detailed functional requirements
- 7 non-functional requirement categories (NFR1-NFR7)
- Constraints, assumptions, and dependencies
- Acceptance criteria
- Success metrics
- Risk assessment
- Out of scope items
- Glossary

### ✅ [Tasks Document](./tasks.md)
- 48 detailed implementation tasks
- Organized into 9 phases
- Priority levels (High, Medium, Low)
- Time estimates
- Dependencies
- Subtasks and acceptance criteria
- Recommended implementation order

## Key Features

### 1. Escrow-Based Transaction System
The core of the platform is a secure escrow system:
1. Buyer sends purchase request to seller
2. Seller accepts and creates order (with 5% platform fee)
3. Buyer pays to escrow (funds held by platform)
4. Seller ships product
5. Buyer confirms receipt
6. Funds released to seller
7. Buyer rates seller

**Safety Features**:
- Funds held in escrow until buyer confirms receipt
- Auto-release after 5 days if no dispute
- Dispute system for problematic transactions
- KYC verification for trusted sellers

### 2. Wallet System
Digital wallet for all transactions:
- View balance and transaction history
- Top-up via bank transfer or VNPay
- Withdrawal requests
- All transactions logged

### 3. Real-time Chat
Socket.io-based chat system:
- Buyer-seller communication
- Product context in chat
- Online/offline status
- Message history

### 4. Trust & Safety
Multiple mechanisms to build trust:
- Seller ratings and reviews
- KYC verification (verified badge)
- Report system for violations
- Dispute resolution
- Escrow protection

## Technology Stack

### Frontend
- **Framework**: React.js 18+
- **State Management**: Context API
- **Routing**: React Router v6
- **Real-time**: Socket.io-client
- **Styling**: CSS Modules
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB 5+
- **ODM**: Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Payment**: VNPay Gateway

### Infrastructure
- **Database**: MongoDB Atlas
- **File Storage**: Local storage (Multer)
- **Environment**: Development, Production

## Implementation Plan

### Phase 1: Foundation (30 hours)
- Create all database models
- Update existing models
- Implement core services (wallet, order, escrow, payment)
- Set up Socket.io

### Phase 2: Product Management (17 hours)
- Product CRUD APIs
- Product detail page
- Create/edit product pages
- My products management

### Phase 3: Wallet System (16 hours)
- Wallet APIs
- VNPay integration
- Wallet dashboard
- Top-up and withdrawal pages

### Phase 4: Transaction Flow (27 hours)
- Purchase request system
- Order payment to escrow
- Order fulfillment (ship, confirm receipt)
- Auto-release cron job
- Complete UI flow

### Phase 5: Chat System (15 hours)
- Chat APIs
- Socket.io integration
- Chat interface
- Start chat from product

### Phase 6: Order Management (12 hours)
- Order list APIs
- Order detail API
- Order list page
- Order detail page

### Phase 7: Rating & Reports (11 hours)
- Review APIs
- Report & dispute APIs
- Rating component
- Report & dispute forms

### Phase 8: Profile & KYC (12 hours)
- User profile APIs
- KYC APIs
- Profile page
- Edit profile & KYC pages

### Phase 9: Shipping & Polish (15 hours)
- Delivery APIs
- Shipping form
- Navigation updates
- Testing & bug fixes

**Total Estimated Time**: 150+ hours

## Getting Started

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account
- VNPay merchant account (for payment integration)
- Basic understanding of React and Express

### Development Workflow
1. Read the Design Document to understand the architecture
2. Review the Requirements Document for detailed specifications
3. Follow the Tasks Document for implementation
4. Start with Phase 1 (Database & Backend Foundation)
5. Complete each task and test before moving to next
6. Commit regularly with descriptive messages

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for APIs
- E2E tests for critical flows
- Manual testing for UI/UX
- Test on multiple devices and browsers

## Success Criteria

### User Engagement
- 80% of users create at least one product
- 60% of products receive purchase requests
- 50% of purchase requests are accepted
- Average 5 messages per conversation

### Transaction Success
- 90% of paid orders completed successfully
- < 5% dispute rate
- Average 3 days from payment to completion
- 95% payment success rate

### User Satisfaction
- Average seller rating > 4.0 stars
- < 10% report rate
- 70% of buyers rate sellers
- 80% of users complete KYC

### System Performance
- 99% API uptime
- < 500ms average API response time
- < 1 second message delivery
- Zero data loss incidents

## Security Considerations

- HTTPS for all API calls
- JWT authentication with 24-hour expiration
- Bcrypt password hashing (10 rounds)
- Input validation on frontend and backend
- File upload validation (type, size, content)
- Rate limiting (100 requests/minute/IP)
- XSS and CSRF protection
- VNPay signature verification

## Support & Documentation

### API Documentation
- All endpoints documented in Design Document
- Request/response examples
- Error codes and messages

### User Guide
- Transaction flow explanation
- Wallet usage guide
- Chat instructions
- Safety tips

### Developer Guide
- Code structure
- Naming conventions
- Git workflow
- Deployment process

## Out of Scope

The following features are NOT included in this specification:
- Moderator and admin features
- Mobile application
- Push notifications
- Email notifications
- Advanced search (Elasticsearch)
- Recommendation system
- Social features
- Multiple languages
- Dark mode

## Contact & Questions

For questions or clarifications about this specification:
1. Review the Design Document for architecture details
2. Check the Requirements Document for feature specifications
3. Refer to the Tasks Document for implementation guidance
4. Consult the SRS and SDS documents for original requirements

## Version History

- **v1.0** (Current) - Initial specification based on SRS/SDS documents
  - 10 major feature areas
  - 48 detailed tasks
  - 150+ hours estimated
  - Complete user-side features

## Next Steps

1. ✅ Review and approve this specification
2. ⏳ Set up development environment
3. ⏳ Start Phase 1: Database & Backend Foundation
4. ⏳ Implement features phase by phase
5. ⏳ Test continuously
6. ⏳ Deploy to production

---

**Note**: This specification focuses exclusively on user-side features. Moderator and admin features will be covered in a separate specification.
