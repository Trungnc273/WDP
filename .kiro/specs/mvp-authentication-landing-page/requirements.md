# Requirements Document

## Introduction

Đây là tài liệu yêu cầu cho MVP Authentication & Landing Page của hệ thống Second-hand Marketplace. Hệ thống cung cấp hai chức năng cốt lõi: Authentication Module cho phép người dùng đăng ký, đăng nhập, xem profile và đăng xuất; Landing Page cho phép guest và authenticated users duyệt danh sách sản phẩm với khả năng search và filter cơ bản. Hệ thống sử dụng JWT authentication, MongoDB database, Node.js/Express.js backend và React.js frontend.

## Glossary

- **System**: Toàn bộ ứng dụng Second-hand Marketplace bao gồm backend và frontend
- **Auth_Service**: Backend service xử lý business logic cho authentication
- **Auth_Controller**: Backend controller xử lý HTTP requests liên quan authentication
- **Product_Service**: Backend service xử lý business logic cho products
- **Product_Controller**: Backend controller xử lý HTTP requests liên quan products
- **User**: Người dùng đã đăng ký tài khoản trong hệ thống
- **Guest**: Người dùng chưa đăng ký hoặc chưa đăng nhập
- **JWT_Token**: JSON Web Token dùng để authenticate user
- **Active_Product**: Sản phẩm có status là 'active' và hiển thị công khai
- **Password_Hash**: Mật khẩu đã được hash bằng bcrypt
- **MongoDB**: Database lưu trữ dữ liệu users và products
- **Frontend**: React application chạy trên client browser
- **Backend**: Express.js server xử lý API requests
- **AuthContext**: React Context quản lý global authentication state
- **Protected_Route**: API endpoint yêu cầu JWT token hợp lệ
- **Public_Route**: API endpoint không yêu cầu authentication

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to register an account with email and password, so that I can access authenticated features of the marketplace.

#### Acceptance Criteria

1. WHEN a user submits registration form with valid email, password (minimum 6 characters), and full name, THEN THE Auth_Service SHALL create a new user account in MongoDB
2. WHEN a user attempts to register with an email that already exists, THEN THE Auth_Service SHALL reject the registration and return error message "Email đã được sử dụng"
3. WHEN a user successfully registers, THEN THE Auth_Service SHALL hash the password using bcrypt with 10 salt rounds before storing
4. WHEN a user successfully registers, THEN THE Auth_Service SHALL generate a JWT token valid for 7 days
5. WHEN a user successfully registers, THEN THE System SHALL return user data without password field and the JWT token
6. WHEN a user submits registration form with invalid email format, THEN THE Auth_Controller SHALL reject the request and return error message "Email không hợp lệ"
7. WHEN a user submits registration form with password shorter than 6 characters, THEN THE Auth_Controller SHALL reject the request and return error message "Mật khẩu phải có ít nhất 6 ký tự"
8. WHEN a user successfully registers, THEN THE Frontend SHALL store the JWT token in localStorage
9. WHEN a user successfully registers, THEN THE Frontend SHALL redirect the user to the home page

### Requirement 2: User Login

**User Story:** As a registered user, I want to login with my email and password, so that I can access my account and authenticated features.

#### Acceptance Criteria

1. WHEN a user submits login form with valid credentials, THEN THE Auth_Service SHALL verify the email exists in MongoDB
2. WHEN a user submits login form with correct password, THEN THE Auth_Service SHALL compare the password with stored hash using bcrypt
3. WHEN a user submits login form with correct credentials, THEN THE Auth_Service SHALL generate a JWT token valid for 7 days
4. WHEN a user submits login form with correct credentials, THEN THE System SHALL return user data without password field and the JWT token
5. WHEN a user submits login form with incorrect email or password, THEN THE Auth_Service SHALL return error message "Email hoặc mật khẩu không đúng"
6. WHEN a user with suspended account attempts to login, THEN THE Auth_Service SHALL reject the login and return error message "Tài khoản đã bị khóa"
7. WHEN a user successfully logs in, THEN THE Frontend SHALL store the JWT token in localStorage
8. WHEN a user successfully logs in, THEN THE Frontend SHALL update the AuthContext with user data
9. WHEN a user successfully logs in, THEN THE Frontend SHALL redirect the user to the home page

### Requirement 3: View User Profile

**User Story:** As an authenticated user, I want to view my profile information, so that I can verify my account details.

#### Acceptance Criteria

1. WHEN an authenticated user requests their profile, THEN THE Auth_Service SHALL verify the JWT token is valid and not expired
2. WHEN an authenticated user requests their profile with valid token, THEN THE Auth_Service SHALL retrieve user data from MongoDB by userId from token
3. WHEN an authenticated user requests their profile with valid token, THEN THE System SHALL return user data without password field
4. WHEN a user requests profile with expired token, THEN THE Auth_Service SHALL reject the request and return error message "Token đã hết hạn"
5. WHEN a user requests profile with invalid token, THEN THE Auth_Service SHALL reject the request and return error message "Token không hợp lệ"
6. WHEN a user requests profile and the user no longer exists in database, THEN THE Auth_Service SHALL reject the request and return error message "User không tồn tại"
7. WHEN a user requests profile and the account is suspended, THEN THE Auth_Service SHALL reject the request and return error message "Tài khoản đã bị khóa"

### Requirement 4: User Logout

**User Story:** As an authenticated user, I want to logout from my account, so that I can secure my session when finished using the application.

#### Acceptance Criteria

1. WHEN a user clicks logout button, THEN THE Frontend SHALL remove the JWT token from localStorage
2. WHEN a user clicks logout button, THEN THE Frontend SHALL clear user data from AuthContext
3. WHEN a user clicks logout button, THEN THE Frontend SHALL redirect the user to the login page

### Requirement 5: Browse Products as Guest

**User Story:** As a guest user, I want to browse products on the landing page without logging in, so that I can explore the marketplace before deciding to register.

#### Acceptance Criteria

1. WHEN a guest visits the landing page, THEN THE Product_Service SHALL retrieve all products with status 'active' from MongoDB
2. WHEN a guest visits the landing page, THEN THE System SHALL display products in paginated format with default 20 products per page
3. WHEN a guest requests a specific page, THEN THE Product_Service SHALL return products for that page with pagination metadata (total, page, totalPages)
4. WHEN displaying products, THEN THE System SHALL populate seller information (fullName, isVerified) and category information (name, slug)
5. WHEN displaying products, THEN THE System SHALL sort products by createdAt in descending order (newest first)
6. THE System SHALL limit pagination to maximum 100 products per page

### Requirement 6: Search Products

**User Story:** As a user (guest or authenticated), I want to search for products by keyword, so that I can quickly find items I'm interested in.

#### Acceptance Criteria

1. WHEN a user enters a search keyword and submits, THEN THE Product_Service SHALL perform text search on product title and description fields
2. WHEN a user searches with a keyword, THEN THE System SHALL return only products where title or description contains the keyword
3. WHEN a user searches with a keyword, THEN THE System SHALL return only products with status 'active'
4. WHEN a user submits an empty search, THEN THE System SHALL return all active products
5. WHEN displaying search results, THEN THE System SHALL apply pagination with the same rules as browsing
6. WHEN a user enters a new search keyword, THEN THE Frontend SHALL reset pagination to page 1

### Requirement 7: Filter Products by Category

**User Story:** As a user (guest or authenticated), I want to filter products by category, so that I can browse specific types of items.

#### Acceptance Criteria

1. WHEN a user selects a category filter, THEN THE Product_Service SHALL return only products belonging to that category
2. WHEN a user selects a category filter, THEN THE System SHALL return only products with status 'active'
3. WHEN displaying filtered results, THEN THE System SHALL apply pagination with the same rules as browsing
4. WHEN a user changes category filter, THEN THE Frontend SHALL reset pagination to page 1
5. WHEN a user clears category filter, THEN THE System SHALL return all active products

### Requirement 8: Filter Products by Price Range

**User Story:** As a user (guest or authenticated), I want to filter products by price range, so that I can find items within my budget.

#### Acceptance Criteria

1. WHEN a user sets minimum price filter, THEN THE Product_Service SHALL return only products with price greater than or equal to minimum price
2. WHEN a user sets maximum price filter, THEN THE Product_Service SHALL return only products with price less than or equal to maximum price
3. WHEN a user sets both minimum and maximum price, THEN THE Product_Service SHALL return only products with price within the range (inclusive)
4. WHEN a user sets price filters, THEN THE System SHALL return only products with status 'active'
5. WHEN displaying filtered results, THEN THE System SHALL apply pagination with the same rules as browsing
6. WHEN a user changes price filter, THEN THE Frontend SHALL reset pagination to page 1

### Requirement 9: Filter Products by Location

**User Story:** As a user (guest or authenticated), I want to filter products by city location, so that I can find items near me.

#### Acceptance Criteria

1. WHEN a user selects a city filter, THEN THE Product_Service SHALL return only products where location.city matches the selected city
2. WHEN a user selects a city filter, THEN THE System SHALL return only products with status 'active'
3. WHEN displaying filtered results, THEN THE System SHALL apply pagination with the same rules as browsing
4. WHEN a user changes location filter, THEN THE Frontend SHALL reset pagination to page 1
5. WHEN a user clears location filter, THEN THE System SHALL return all active products

### Requirement 10: Combine Multiple Filters

**User Story:** As a user (guest or authenticated), I want to apply multiple filters simultaneously (search, category, price, location), so that I can narrow down products to exactly what I need.

#### Acceptance Criteria

1. WHEN a user applies multiple filters, THEN THE Product_Service SHALL combine all filter conditions using AND logic
2. WHEN a user applies search with category filter, THEN THE System SHALL return products matching both search keyword AND category
3. WHEN a user applies search with price range, THEN THE System SHALL return products matching both search keyword AND price range
4. WHEN a user applies all filters together, THEN THE System SHALL return products matching all conditions
5. WHEN displaying combined filter results, THEN THE System SHALL apply pagination with the same rules as browsing

### Requirement 11: Password Security

**User Story:** As a system administrator, I want all user passwords to be securely hashed, so that user credentials are protected even if the database is compromised.

#### Acceptance Criteria

1. THE Auth_Service SHALL hash all passwords using bcrypt with 10 salt rounds before storing in MongoDB
2. THE System SHALL never store passwords in plain text format
3. THE System SHALL never return password or password hash in API responses
4. THE System SHALL never log passwords in application logs
5. WHEN comparing passwords during login, THE Auth_Service SHALL use bcrypt.compare function

### Requirement 12: JWT Token Security

**User Story:** As a system administrator, I want JWT tokens to be secure and properly validated, so that only authenticated users can access protected resources.

#### Acceptance Criteria

1. THE Auth_Service SHALL generate JWT tokens with payload containing userId, email, and role
2. THE Auth_Service SHALL sign JWT tokens with a secret key stored in environment variables
3. THE Auth_Service SHALL set JWT token expiration to 7 days
4. WHEN verifying a JWT token, THE Auth_Service SHALL validate the token signature using the secret key
5. WHEN verifying a JWT token, THE Auth_Service SHALL check the token has not expired
6. WHEN verifying a JWT token, THE Auth_Service SHALL verify the user still exists in MongoDB
7. WHEN verifying a JWT token, THE Auth_Service SHALL verify the user account is not suspended

### Requirement 13: Input Validation

**User Story:** As a system administrator, I want all user inputs to be validated, so that the system is protected from invalid data and injection attacks.

#### Acceptance Criteria

1. WHEN a user submits email, THE Auth_Controller SHALL validate email format matches regex pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/
2. WHEN a user submits password, THE Auth_Controller SHALL validate password length is at least 6 characters
3. WHEN a user submits full name, THE Auth_Controller SHALL validate full name is not empty after trimming whitespace
4. WHEN a user submits invalid data, THE Auth_Controller SHALL return HTTP status 400 with descriptive error message
5. THE System SHALL sanitize all user inputs before processing to prevent injection attacks

### Requirement 14: Database Indexing

**User Story:** As a system administrator, I want proper database indexes, so that queries perform efficiently as data grows.

#### Acceptance Criteria

1. THE System SHALL create a unique index on users.email field
2. THE System SHALL create a text index on products.title and products.description fields for search functionality
3. THE System SHALL create a compound index on products.status and products.createdAt fields
4. THE System SHALL create an index on products.category field
5. THE System SHALL create an index on products.price field

### Requirement 15: Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN an error occurs, THE System SHALL return appropriate HTTP status codes (400 for bad request, 401 for unauthorized, 403 for forbidden, 404 for not found, 500 for server error)
2. WHEN an error occurs, THE System SHALL return error messages in Vietnamese language
3. WHEN authentication fails, THE System SHALL not reveal whether the email exists or password is wrong (use generic message)
4. WHEN a server error occurs, THE System SHALL log detailed error information server-side
5. WHEN a server error occurs, THE System SHALL return generic error message to client without exposing sensitive details
6. WHEN a network error occurs, THE Frontend SHALL display user-friendly error message with retry option

### Requirement 16: Frontend State Management

**User Story:** As a developer, I want centralized authentication state management, so that user authentication status is consistent across all components.

#### Acceptance Criteria

1. THE Frontend SHALL implement AuthContext using React Context API
2. THE AuthContext SHALL provide user object, token, isAuthenticated boolean, and authentication methods (login, register, logout)
3. WHEN the application loads, THE Frontend SHALL check localStorage for existing token and load user data if token exists
4. WHEN a user logs in or registers, THE Frontend SHALL update AuthContext with user data and token
5. WHEN a user logs out, THE Frontend SHALL clear AuthContext state
6. WHEN token is expired or invalid, THE Frontend SHALL automatically logout the user and clear localStorage

### Requirement 17: MongoDB Connection

**User Story:** As a system administrator, I want reliable database connection, so that the application can access data consistently.

#### Acceptance Criteria

1. THE Backend SHALL connect to MongoDB using connection string: mongodb+srv://reflow:A123456a@trungnc.lqfrzux.mongodb.net/ReFlow
2. THE Backend SHALL store MongoDB connection string in environment variable MONGODB_URI
3. WHEN MongoDB connection fails, THE Backend SHALL log error details and attempt to reconnect
4. WHEN MongoDB connection is lost during operation, THE Backend SHALL handle errors gracefully and return appropriate error response
5. THE Backend SHALL use database name "ReFlow"

### Requirement 18: File Upload for Product Images

**User Story:** As a user, I want to upload product images, so that I can showcase my items with photos.

#### Acceptance Criteria

1. THE Backend SHALL accept image uploads in formats: jpg, jpeg, png, gif
2. THE Backend SHALL limit image file size to maximum 5MB per image
3. THE Backend SHALL store uploaded images in local file system at path backend/uploads/products/{productId}/
4. THE Backend SHALL generate unique filenames using format {timestamp}-{randomString}.{extension}
5. THE Backend SHALL validate file type before accepting upload
6. WHEN a user uploads invalid file type, THE Backend SHALL reject the upload and return error message
7. WHEN a user uploads file exceeding size limit, THE Backend SHALL reject the upload and return error message
8. THE Backend SHALL serve uploaded images via public route /uploads/:path

### Requirement 19: Product Data Model

**User Story:** As a developer, I want well-defined product data structure, so that product information is stored consistently.

#### Acceptance Criteria

1. THE System SHALL store products with fields: title (max 200 chars), description (max 2000 chars), price (min 0), condition (enum), images (array), category (reference), seller (reference), location (object), status (enum), views (number), createdAt, updatedAt
2. THE System SHALL validate product title does not exceed 200 characters
3. THE System SHALL validate product description does not exceed 2000 characters
4. THE System SHALL validate product price is greater than or equal to 0
5. THE System SHALL validate product condition is one of: 'new', 'like-new', 'good', 'fair', 'poor'
6. THE System SHALL validate product has at least one image
7. THE System SHALL validate product status is one of: 'pending', 'active', 'sold', 'rejected', 'expired'
8. THE System SHALL set default product status to 'pending' when created

### Requirement 20: User Data Model

**User Story:** As a developer, I want well-defined user data structure, so that user information is stored consistently.

#### Acceptance Criteria

1. THE System SHALL store users with fields: email (unique, lowercase), password (hashed), fullName, role (enum), isVerified (boolean), isSuspended (boolean), violationCount (number), createdAt, updatedAt
2. THE System SHALL validate user email is unique across all users
3. THE System SHALL store user email in lowercase format
4. THE System SHALL validate user role is one of: 'user', 'moderator', 'admin'
5. THE System SHALL set default user role to 'user' when created
6. THE System SHALL set default isVerified to false when user is created
7. THE System SHALL set default isSuspended to false when user is created
8. THE System SHALL set default violationCount to 0 when user is created
