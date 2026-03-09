# Authentication Module Testing

## Overview

The authentication module has been fully implemented with the following endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/logout` - Logout user (protected)

## Implementation Status

### Completed Features

✅ **Task 3.1**: Auth Service with registerUser and loginUser functions
✅ **Task 3.2**: Auth Controller with all endpoints (register, login, getProfile, logout)
✅ **Task 3.3**: Auth Routes configuration
✅ **Task 3.4**: Password hashing with bcrypt (10 salt rounds)
✅ **Task 3.5**: JWT token generation and verification (7-day expiration)
✅ **Task 3.6**: Input validation (email format, password length, required fields)

### Features Implemented

1. **User Registration** (Req 1)
   - Email uniqueness validation
   - Password hashing with bcrypt
   - JWT token generation
   - Email format validation
   - Password length validation (minimum 6 characters)
   - Full name validation

2. **User Login** (Req 2)
   - Email and password verification
   - Suspended account check
   - JWT token generation
   - Generic error messages for security

3. **View Profile** (Req 3)
   - JWT token verification
   - User existence check
   - Suspended account check
   - Password field excluded from response

4. **Logout** (Req 4)
   - Protected endpoint
   - Client-side token removal (JWT is stateless)

5. **Password Security** (Req 11)
   - Bcrypt hashing with 10 salt rounds
   - No plain text storage
   - Password never exposed in responses

6. **JWT Security** (Req 12)
   - Payload contains userId, email, role
   - 7-day expiration
   - Secret key from environment variables
   - Token verification on protected routes

7. **Input Validation** (Req 13)
   - Email format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Password minimum 6 characters
   - Full name not empty
   - Appropriate error messages in Vietnamese

## Manual Testing

### Prerequisites

1. Start the MongoDB database (connection string in `.env`)
2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

### Option 1: Run Manual Test Script

```bash
node test-auth-manual.js
```

This script will automatically test all endpoints and display results.

### Option 2: Manual API Testing with curl/Postman

#### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

Expected Response (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "fullName": "Test User",
      "role": "user",
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Đăng ký thành công"
}
```

#### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "fullName": "Test User",
      "role": "user",
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Đăng nhập thành công"
}
```

#### 3. Get Profile (Protected)

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response (200):
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "user",
    "isVerified": false
  }
}
```

#### 4. Logout (Protected)

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response (200):
```json
{
  "success": true,
  "data": null,
  "message": "Đăng xuất thành công"
}
```

## Test Cases Covered

### Registration Tests
- ✅ Register with valid data
- ✅ Reject duplicate email
- ✅ Reject invalid email format
- ✅ Reject password < 6 characters
- ✅ Reject empty full name
- ✅ Email stored in lowercase

### Login Tests
- ✅ Login with correct credentials
- ✅ Reject incorrect password
- ✅ Reject non-existent email
- ✅ Reject suspended account
- ✅ Generic error message for security

### Profile Tests
- ✅ Get profile with valid token
- ✅ Reject request without token
- ✅ Reject request with invalid token
- ✅ Reject request with expired token
- ✅ Reject request for suspended user
- ✅ Password not included in response

### Logout Tests
- ✅ Logout with valid token
- ✅ Reject logout without token

## Validation Rules

### Email Validation
- Format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Must be unique (case-insensitive)
- Stored in lowercase

### Password Validation
- Minimum length: 6 characters
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Never exposed in API responses

### Full Name Validation
- Cannot be empty after trimming whitespace

## Security Features

1. **Password Hashing**: All passwords hashed with bcrypt before storage
2. **JWT Authentication**: Secure token-based authentication
3. **Token Expiration**: Tokens expire after 7 days
4. **Account Suspension**: Suspended accounts cannot login or access protected routes
5. **Generic Error Messages**: Login errors don't reveal if email exists
6. **Input Sanitization**: All inputs validated and sanitized
7. **No Password Exposure**: Password field never returned in responses

## Error Messages (Vietnamese)

- `"Vui lòng điền đầy đủ thông tin"` - Missing required fields
- `"Email không hợp lệ"` - Invalid email format
- `"Mật khẩu phải có ít nhất 6 ký tự"` - Password too short
- `"Họ tên không được để trống"` - Empty full name
- `"Email đã được sử dụng"` - Duplicate email
- `"Email hoặc mật khẩu không đúng"` - Invalid credentials
- `"Tài khoản đã bị khóa"` - Suspended account
- `"Token không hợp lệ"` - Invalid token
- `"Token đã hết hạn"` - Expired token
- `"User không tồn tại"` - User not found

## Next Steps

The authentication module is complete and ready for integration with:
- Frontend authentication pages (Login, Register, Profile)
- Product module (for authenticated product operations)
- Other protected features

## Notes

- JWT tokens are stateless, so logout is primarily handled client-side by removing the token from localStorage
- The logout endpoint exists for consistency and can be extended with token blacklisting in the future
- All endpoints return standardized JSON responses with `success`, `data`, and `message` fields
- Error handling is centralized through error middleware
