# Tasks

## Backend Setup & Infrastructure

- [x] 1. Setup Backend Environment & MongoDB Connection
  - [x] 1.1 Create .env file with MONGODB_URI, JWT_SECRET, PORT, UPLOAD_DIR
  - [x] 1.2 Install dependencies: express, mongoose, bcryptjs, jsonwebtoken, dotenv, cors, multer
  - [x] 1.3 Create backend/src/config/db.js to connect MongoDB
  - [x] 1.4 Create backend/src/config/env.js to load environment variables
  - [x] 1.5 Update backend/src/server.js to initialize Express app and connect DB
  - [x] 1.6 Test MongoDB connection

- [x] 2. Create User Model & Authentication Utilities
  - [x] 2.1 Create backend/src/modules/users/user.model.js with User schema (Req 20)
  - [x] 2.2 Create backend/src/common/utils/jwt.util.js with generateJWT and verifyToken functions
  - [x] 2.3 Create backend/src/common/utils/response.util.js for standardized API responses
  - [x] 2.4 Create backend/src/common/middlewares/auth.middleware.js for JWT verification
  - [x] 2.5 Create backend/src/common/middlewares/error.middleware.js for error handling

- [x] 3. Implement Authentication Module
  - [x] 3.1 Create backend/src/modules/auth/auth.service.js with registerUser and loginUser (Req 1, 2)
  - [x] 3.2 Create backend/src/modules/auth/auth.controller.js with register, login, getProfile, logout endpoints
  - [x] 3.3 Create backend/src/modules/auth/auth.route.js with routes
  - [x] 3.4 Implement password hashing with bcrypt (Req 11)
  - [x] 3.5 Implement JWT token generation and verification (Req 12)
  - [x] 3.6 Implement input validation (Req 13)
  - [x] 3.7 Test authentication endpoints

- [x] 4. Create Product Model & Category Model
  - [x] 4.1 Create backend/src/modules/products/product.model.js with Product schema (Req 19)
  - [x] 4.2 Create backend/src/modules/products/category.model.js with Category schema
  - [x] 4.3 Create database indexes (Req 14)
  - [x] 4.4 Test models

- [x] 5. Implement Product Module
  - [x] 5.1 Create backend/src/modules/products/product.service.js with getProducts, searchProducts, filterProducts (Req 5-10)
  - [x] 5.2 Create backend/src/modules/products/product.controller.js with endpoints
  - [x] 5.3 Create backend/src/modules/products/product.route.js
  - [x] 5.4 Implement pagination logic
  - [x] 5.5 Implement search with text index
  - [x] 5.6 Implement filters (category, price range, location)
  - [x] 5.7 Test product endpoints

- [x] 6. Implement File Upload
  - [x] 6.1 Create backend/src/common/middlewares/upload.middleware.js with multer config (Req 18)
  - [x] 6.2 Create uploads directory structure
  - [x] 6.3 Add file upload endpoint
  - [x] 6.4 Add static file serving for /uploads
  - [x] 6.5 Test file upload

- [x] 7. Seed Sample Data
  - [x] 7.1 Create backend/src/seeds/categories.seed.js with sample categories
  - [x] 7.2 Create backend/src/seeds/products.seed.js with sample products
  - [x] 7.3 Run seed scripts
  - [x] 7.4 Verify data in MongoDB

- [x] 8. Setup API Routes
  - [x] 8.1 Update backend/src/routes.js to register all routes
  - [x] 8.2 Add CORS configuration
  - [x] 8.3 Add error handling middleware
  - [x] 8.4 Test all API endpoints with Postman/Thunder Client

## Frontend Setup & Infrastructure

- [x] 9. Setup Frontend Environment
  - [x] 9.1 Create .env file with REACT_APP_API_URL
  - [x] 9.2 Install dependencies: react-router-dom, axios
  - [x] 9.3 Update frontend/src/services/api.js with axios instance
  - [x] 9.4 Test API connection

- [x] 10. Implement AuthContext & Authentication Services
  - [x] 10.1 Create frontend/src/context/AuthContext.jsx with state management (Req 16)
  - [x] 10.2 Create frontend/src/services/auth.service.js with login, register, getProfile methods
  - [x] 10.3 Create frontend/src/hooks/useAuth.js custom hook
  - [x] 10.4 Wrap App with AuthProvider
  - [x] 10.5 Test AuthContext

- [x] 11. Implement Authentication Pages
  - [x] 11.1 Create frontend/src/modules/auth/Register.jsx with form and validation (Req 1)
  - [x] 11.2 Create frontend/src/modules/auth/Login.jsx with form and validation (Req 2)
  - [x] 11.3 Create frontend/src/modules/profile/Profile.jsx to display user info (Req 3)
  - [x] 11.4 Implement logout functionality (Req 4)
  - [x] 11.5 Add error handling and loading states
  - [x] 11.6 Test authentication flow

- [x] 12. Implement Product Services & Components
  - [x] 12.1 Create frontend/src/services/product.service.js with getProducts, searchProducts methods
  - [x] 12.2 Create frontend/src/components/ProductCard.jsx
  - [x] 12.3 Create frontend/src/components/ProductList.jsx
  - [x] 12.4 Create frontend/src/components/SearchBar.jsx
  - [x] 12.5 Create frontend/src/components/FilterPanel.jsx
  - [x] 12.6 Test components

- [x] 13. Implement Home Page (Landing Page)
  - [x] 13.1 Create frontend/src/modules/home/Home.jsx with product listing (Req 5)
  - [x] 13.2 Implement search functionality (Req 6)
  - [x] 13.3 Implement category filter (Req 7)
  - [x] 13.4 Implement price range filter (Req 8)
  - [x] 13.5 Implement location filter (Req 9)
  - [x] 13.6 Implement pagination
  - [x] 13.7 Test home page

- [x] 14. Setup Routing
  - [x] 14.1 Create frontend/src/routes/index.js with React Router routes
  - [x] 14.2 Create ProtectedRoute component for authenticated routes
  - [x] 14.3 Add routes: /, /login, /register, /profile
  - [x] 14.4 Update frontend/src/App.js with Router
  - [x] 14.5 Test navigation

- [ ] 15. Styling (Chợ Tốt Style)
  - [x] 15.1 Create frontend/src/assets/styles/global.css with base styles
  - [x] 15.2 Style authentication pages
  - [x] 15.3 Style home page with grid layout similar to Chợ Tốt
  - [x] 15.4 Style product cards
  - [x] 15.5 Style search bar and filters
  - [x] 15.6 Make responsive for mobile

## Testing & Final Steps

- [ ] 16. Integration Testing
  - [ ] 16.1 Test complete registration flow
  - [ ] 16.2 Test complete login flow
  - [ ] 16.3 Test profile view
  - [ ] 16.4 Test logout
  - [ ] 16.5 Test product browsing as guest
  - [ ] 16.6 Test search and filters
  - [ ] 16.7 Test pagination

- [ ] 17. Error Handling & Edge Cases
  - [ ] 17.1 Test with invalid inputs
  - [ ] 17.2 Test with expired tokens
  - [ ] 17.3 Test with network errors
  - [ ] 17.4 Test with empty results
  - [ ] 17.5 Verify error messages are user-friendly

- [ ] 18. Documentation & Deployment Prep
  - [ ] 18.1 Update README.md with setup instructions
  - [ ] 18.2 Document API endpoints
  - [ ] 18.3 Create .env.example files
  - [ ] 18.4 Verify all environment variables are documented
  - [ ] 18.5 Test fresh installation

## Checkpoints

- [ ] Checkpoint 1: After Task 3 - Authentication backend working
- [ ] Checkpoint 2: After Task 8 - All backend APIs working
- [ ] Checkpoint 3: After Task 14 - Frontend routing working
- [ ] Checkpoint 4: After Task 18 - MVP complete and tested
