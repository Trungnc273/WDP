# Design Document: MVP Authentication & Landing Page

## Overview

Đây là MVP đầu tiên của hệ thống Second-hand Marketplace, tập trung vào hai chức năng cốt lõi: Authentication Module (đăng ký, đăng nhập, xem profile, đăng xuất) và Landing Page (hiển thị danh sách sản phẩm với search/filter cơ bản, cho phép guest access). Hệ thống sử dụng JWT authentication, MongoDB cho database, Node.js/Express.js cho backend và React.js cho frontend. Design này kết hợp cả high-level architecture (diagrams, interfaces) và low-level implementation details (algorithms, formal specifications).

## Architecture

```mermaid
graph TD
    A[Client Browser] --> B[React Frontend]
    B --> C[API Gateway / Express Routes]
    C --> D[Auth Module]
    C --> E[Products Module]
    C --> F[Users Module]
    D --> G[MongoDB - users collection]
    E --> H[MongoDB - products collection]
    F --> G
    D --> I[JWT Utility]
    B --> J[AuthContext - Global State]
    B --> K[Local Storage - JWT Token]
```

## Sequence Diagrams

### User Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Controller
    participant S as Auth Service
    participant DB as MongoDB
    
    U->>F: Nhập email/password
    F->>A: POST /api/auth/register
    A->>S: registerUser(email, password)
    S->>DB: Kiểm tra email tồn tại
    DB-->>S: Email chưa tồn tại
    S->>S: Hash password (bcrypt)
    S->>DB: Lưu user mới
    DB-->>S: User created
    S->>S: Tạo JWT token
    S-->>A: {user, token}
    A-->>F: 201 Created {user, token}
    F->>F: Lưu token vào localStorage
    F-->>U: Chuyển đến Home page
```


### User Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Controller
    participant S as Auth Service
    participant DB as MongoDB
    
    U->>F: Nhập email/password
    F->>A: POST /api/auth/login
    A->>S: loginUser(email, password)
    S->>DB: Tìm user theo email
    DB-->>S: User data
    S->>S: So sánh password (bcrypt.compare)
    S->>S: Tạo JWT token
    S-->>A: {user, token}
    A-->>F: 200 OK {user, token}
    F->>F: Lưu token vào localStorage
    F->>F: Cập nhật AuthContext
    F-->>U: Chuyển đến Home page
```

### Guest Browse Products Flow

```mermaid
sequenceDiagram
    participant G as Guest
    participant F as Frontend
    participant P as Product Controller
    participant S as Product Service
    participant DB as MongoDB
    
    G->>F: Truy cập Landing Page
    F->>P: GET /api/products?page=1&limit=20
    P->>S: getProducts(filters)
    S->>DB: Query products (status: active)
    DB-->>S: Products list
    S-->>P: Products data
    P-->>F: 200 OK {products, total, page}
    F-->>G: Hiển thị danh sách sản phẩm
    
    G->>F: Nhập từ khóa search
    F->>P: GET /api/products?search=keyword
    P->>S: searchProducts(keyword)
    S->>DB: Text search query
    DB-->>S: Filtered products
    S-->>P: Products data
    P-->>F: 200 OK {products}
    F-->>G: Hiển thị kết quả search
```


## Components and Interfaces

### Backend Components

#### 1. Auth Controller

**Purpose**: Xử lý HTTP requests liên quan đến authentication

**Interface**:
```javascript
class AuthController {
  async register(req, res, next)
  async login(req, res, next)
  async getProfile(req, res, next)
  async logout(req, res, next)
}
```

**Responsibilities**:
- Validate request data
- Gọi Auth Service để xử lý business logic
- Trả về HTTP response với status code phù hợp
- Xử lý errors thông qua error middleware

#### 2. Auth Service

**Purpose**: Xử lý business logic cho authentication

**Interface**:
```javascript
class AuthService {
  async registerUser(email, password, fullName)
  async loginUser(email, password)
  async getUserById(userId)
  async updateUserProfile(userId, updateData)
}
```

**Responsibilities**:
- Validate business rules (email unique, password strength)
- Hash passwords sử dụng bcrypt
- Tạo JWT tokens
- Tương tác với User Model để lưu/lấy data

#### 3. Product Controller

**Purpose**: Xử lý HTTP requests liên quan đến products

**Interface**:
```javascript
class ProductController {
  async getProducts(req, res, next)
  async getProductById(req, res, next)
  async searchProducts(req, res, next)
  async filterProducts(req, res, next)
}
```

**Responsibilities**:
- Parse query parameters (pagination, search, filters)
- Gọi Product Service
- Trả về product data với pagination info


#### 4. Product Service

**Purpose**: Xử lý business logic cho products

**Interface**:
```javascript
class ProductService {
  async getProducts(filters, pagination)
  async getProductById(productId)
  async searchProducts(keyword, filters)
  async filterByCategory(categoryId, filters)
  async filterByPriceRange(minPrice, maxPrice, filters)
}
```

**Responsibilities**:
- Build MongoDB queries với filters
- Implement text search
- Handle pagination logic
- Populate related data (seller info, category)

### Frontend Components

#### 1. AuthContext

**Purpose**: Quản lý global authentication state

**Interface**:
```javascript
const AuthContext = {
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  login: (email, password) => Promise<void>,
  register: (email, password, fullName) => Promise<void>,
  logout: () => void,
  loading: boolean
}
```

**Responsibilities**:
- Lưu trữ user state và token
- Provide authentication methods cho toàn bộ app
- Sync với localStorage
- Auto-load user từ token khi app khởi động

#### 2. Login Component

**Purpose**: UI cho đăng nhập

**Interface**:
```javascript
function Login() {
  // State: email, password, errors, loading
  // Methods: handleSubmit, validateForm
  // Render: Form với email/password inputs, submit button
}
```


#### 3. Register Component

**Purpose**: UI cho đăng ký tài khoản

**Interface**:
```javascript
function Register() {
  // State: email, password, confirmPassword, fullName, errors, loading
  // Methods: handleSubmit, validateForm, checkPasswordMatch
  // Render: Form với các input fields, submit button
}
```

#### 4. Home Component (Landing Page)

**Purpose**: Hiển thị danh sách sản phẩm với search/filter

**Interface**:
```javascript
function Home() {
  // State: products, loading, filters, searchKeyword, pagination
  // Methods: fetchProducts, handleSearch, handleFilter, handlePageChange
  // Render: SearchBar, FilterPanel, ProductGrid, Pagination
}
```

#### 5. ProductList Component

**Purpose**: Hiển thị grid/list của products

**Interface**:
```javascript
function ProductList({ products, loading }) {
  // Render: Grid layout với ProductCard components
}
```

#### 6. ProductCard Component

**Purpose**: Hiển thị thông tin cơ bản của một product

**Interface**:
```javascript
function ProductCard({ product }) {
  // Props: product {id, title, price, image, location, createdAt}
  // Render: Card với image, title, price, location
}
```

#### 7. SearchBar Component

**Purpose**: Input để search products

**Interface**:
```javascript
function SearchBar({ onSearch, placeholder }) {
  // State: searchValue
  // Methods: handleChange, handleSubmit
  // Render: Input field với search icon, submit button
}
```


#### 8. FilterPanel Component

**Purpose**: UI để filter products theo category, price range, location

**Interface**:
```javascript
function FilterPanel({ onFilterChange, categories }) {
  // State: selectedCategory, priceRange, selectedLocation
  // Methods: handleCategoryChange, handlePriceChange, handleLocationChange, applyFilters
  // Render: Dropdown/Checkbox cho categories, price range slider, location select
}
```

## Data Models

### User Model (MongoDB Schema)

```javascript
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  violationCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

**Validation Rules**:
- Email phải unique và valid format
- Password tối thiểu 6 ký tự
- FullName không được rỗng
- Role chỉ có thể là 'user', 'moderator', hoặc 'admin'


### Product Model (MongoDB Schema)

```javascript
const ProductSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: true
  },
  images: [{
    type: String,
    required: true
    // Lưu đường dẫn local: /uploads/products/{productId}/{filename}
  }],
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: String,
    district: String
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'sold', 'rejected', 'expired'],
    default: 'pending'
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Text index cho search
ProductSchema.index({ title: 'text', description: 'text' });
```

**Validation Rules**:
- Title tối đa 200 ký tự
- Description tối đa 2000 ký tự
- Price phải >= 0
- Condition phải thuộc enum values
- Ít nhất 1 image
- Category và Seller phải tồn tại
- Images lưu local tại thư mục `backend/uploads/products/`


### Category Model (MongoDB Schema)

```javascript
const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  icon: String,
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

**Validation Rules**:
- Name phải unique
- Slug phải unique và lowercase
- ParentCategory phải tồn tại nếu được set

## Algorithmic Pseudocode

### User Registration Algorithm

```javascript
ALGORITHM registerUser(email, password, fullName)
INPUT: email (String), password (String), fullName (String)
OUTPUT: {user: User, token: String}

PRECONDITIONS:
  - email is non-empty and valid format
  - password length >= 6
  - fullName is non-empty

BEGIN
  // Step 1: Validate input
  ASSERT email matches regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  ASSERT password.length >= 6
  ASSERT fullName.trim().length > 0
  
  // Step 2: Check email uniqueness
  existingUser ← await User.findOne({ email: email.toLowerCase() })
  IF existingUser !== null THEN
    THROW Error("Email đã được sử dụng")
  END IF
  
  // Step 3: Hash password
  saltRounds ← 10
  hashedPassword ← await bcrypt.hash(password, saltRounds)
  
  // Step 4: Create user
  newUser ← {
    email: email.toLowerCase(),
    password: hashedPassword,
    fullName: fullName.trim(),
    role: 'user',
    isVerified: false,
    createdAt: Date.now()
  }
  
  savedUser ← await User.create(newUser)
  
  // Step 5: Generate JWT token
  payload ← {
    userId: savedUser._id,
    email: savedUser.email,
    role: savedUser.role
  }
  token ← jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  
  // Step 6: Return user without password
  userResponse ← {
    id: savedUser._id,
    email: savedUser.email,
    fullName: savedUser.fullName,
    role: savedUser.role
  }
  
  ASSERT userResponse.id !== null
  ASSERT token !== null
  
  RETURN { user: userResponse, token: token }
END

POSTCONDITIONS:
  - User is created in database
  - Password is hashed (not stored in plain text)
  - JWT token is valid and contains user info
  - Returned user object does not contain password
```


### User Login Algorithm

```javascript
ALGORITHM loginUser(email, password)
INPUT: email (String), password (String)
OUTPUT: {user: User, token: String}

PRECONDITIONS:
  - email is non-empty
  - password is non-empty

BEGIN
  // Step 1: Validate input
  ASSERT email.trim().length > 0
  ASSERT password.length > 0
  
  // Step 2: Find user by email
  user ← await User.findOne({ email: email.toLowerCase() })
  IF user === null THEN
    THROW Error("Email hoặc mật khẩu không đúng")
  END IF
  
  // Step 3: Check if account is suspended
  IF user.isSuspended === true THEN
    THROW Error("Tài khoản đã bị khóa")
  END IF
  
  // Step 4: Verify password
  isPasswordValid ← await bcrypt.compare(password, user.password)
  IF isPasswordValid === false THEN
    THROW Error("Email hoặc mật khẩu không đúng")
  END IF
  
  // Step 5: Generate JWT token
  payload ← {
    userId: user._id,
    email: user.email,
    role: user.role
  }
  token ← jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  
  // Step 6: Return user without password
  userResponse ← {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isVerified: user.isVerified
  }
  
  ASSERT token !== null
  ASSERT userResponse.id !== null
  
  RETURN { user: userResponse, token: token }
END

POSTCONDITIONS:
  - JWT token is valid and contains user info
  - Returned user object does not contain password
  - User is authenticated
```


### Get Products with Filters Algorithm

```javascript
ALGORITHM getProducts(filters, pagination)
INPUT: filters (Object), pagination (Object)
OUTPUT: {products: Array<Product>, total: Number, page: Number, totalPages: Number}

PRECONDITIONS:
  - pagination.page >= 1
  - pagination.limit > 0 and <= 100

BEGIN
  // Step 1: Initialize query
  query ← { status: 'active' }
  
  // Step 2: Apply search filter
  IF filters.search !== null AND filters.search.trim().length > 0 THEN
    query.$text ← { $search: filters.search }
  END IF
  
  // Step 3: Apply category filter
  IF filters.categoryId !== null THEN
    query.category ← filters.categoryId
  END IF
  
  // Step 4: Apply price range filter
  IF filters.minPrice !== null OR filters.maxPrice !== null THEN
    query.price ← {}
    IF filters.minPrice !== null THEN
      query.price.$gte ← filters.minPrice
    END IF
    IF filters.maxPrice !== null THEN
      query.price.$lte ← filters.maxPrice
    END IF
  END IF
  
  // Step 5: Apply location filter
  IF filters.city !== null THEN
    query['location.city'] ← filters.city
  END IF
  
  // Step 6: Calculate pagination
  page ← pagination.page || 1
  limit ← Math.min(pagination.limit || 20, 100)
  skip ← (page - 1) * limit
  
  // Step 7: Execute query with pagination
  products ← await Product.find(query)
    .populate('seller', 'fullName isVerified')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
  
  // Step 8: Get total count
  total ← await Product.countDocuments(query)
  totalPages ← Math.ceil(total / limit)
  
  ASSERT products.length <= limit
  ASSERT page <= totalPages OR totalPages === 0
  
  RETURN {
    products: products,
    total: total,
    page: page,
    totalPages: totalPages
  }
END

POSTCONDITIONS:
  - products array length <= limit
  - All products have status 'active'
  - Products are sorted by createdAt descending
  - Seller and category info are populated

LOOP INVARIANTS:
  - All processed products match the query filters
  - Pagination boundaries are respected
```


### JWT Token Verification Algorithm

```javascript
ALGORITHM verifyToken(token)
INPUT: token (String)
OUTPUT: decodedPayload (Object)

PRECONDITIONS:
  - token is non-empty string

BEGIN
  // Step 1: Validate token format
  IF token === null OR token.trim().length === 0 THEN
    THROW Error("Token không hợp lệ")
  END IF
  
  // Step 2: Verify and decode token
  TRY
    decodedPayload ← jwt.verify(token, JWT_SECRET)
  CATCH error
    IF error.name === 'TokenExpiredError' THEN
      THROW Error("Token đã hết hạn")
    ELSE IF error.name === 'JsonWebTokenError' THEN
      THROW Error("Token không hợp lệ")
    ELSE
      THROW error
    END IF
  END TRY
  
  // Step 3: Validate payload structure
  ASSERT decodedPayload.userId !== null
  ASSERT decodedPayload.email !== null
  ASSERT decodedPayload.role !== null
  
  // Step 4: Check if user still exists
  user ← await User.findById(decodedPayload.userId)
  IF user === null THEN
    THROW Error("User không tồn tại")
  END IF
  
  // Step 5: Check if user is suspended
  IF user.isSuspended === true THEN
    THROW Error("Tài khoản đã bị khóa")
  END IF
  
  RETURN decodedPayload
END

POSTCONDITIONS:
  - Token is valid and not expired
  - User exists in database
  - User is not suspended
  - Decoded payload contains userId, email, role
```


## Key Functions with Formal Specifications

### Function 1: hashPassword()

```javascript
async function hashPassword(plainPassword) {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
}
```

**Preconditions:**
- `plainPassword` is non-null string
- `plainPassword.length >= 6`

**Postconditions:**
- Returns hashed password string
- Hashed password length > plainPassword length
- Hashed password !== plainPassword (not stored in plain text)
- Hash is bcrypt format with salt rounds = 10

**Loop Invariants:** N/A (no loops)

### Function 2: comparePassword()

```javascript
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

**Preconditions:**
- `plainPassword` is non-null string
- `hashedPassword` is non-null string in bcrypt format

**Postconditions:**
- Returns boolean value
- `true` if and only if plainPassword matches the original password used to create hashedPassword
- No mutations to input parameters

**Loop Invariants:** N/A (no loops)

### Function 3: generateJWT()

```javascript
function generateJWT(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}
```

**Preconditions:**
- `payload` is non-null object
- `payload.userId` exists
- `process.env.JWT_SECRET` is defined
- `expiresIn` is valid time string (e.g., '7d', '24h')

**Postconditions:**
- Returns JWT token string
- Token contains encoded payload
- Token is signed with JWT_SECRET
- Token has expiration time set to expiresIn

**Loop Invariants:** N/A (no loops)


### Function 4: validateEmail()

```javascript
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Preconditions:**
- `email` is defined (may be null/empty)

**Postconditions:**
- Returns boolean value
- `true` if and only if email matches valid email format
- No side effects

**Loop Invariants:** N/A (no loops)

### Function 5: buildProductQuery()

```javascript
function buildProductQuery(filters) {
  const query = { status: 'active' };
  
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  if (filters.categoryId) {
    query.category = filters.categoryId;
  }
  
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }
  
  if (filters.city) {
    query['location.city'] = filters.city;
  }
  
  return query;
}
```

**Preconditions:**
- `filters` is object (may be empty)
- If `filters.minPrice` exists, it is >= 0
- If `filters.maxPrice` exists, it is >= 0

**Postconditions:**
- Returns MongoDB query object
- Query always includes `status: 'active'`
- Query includes only non-null filter values
- If both minPrice and maxPrice exist, minPrice <= maxPrice

**Loop Invariants:** N/A (no loops)


## Example Usage

### Backend Example: User Registration

```javascript
// Controller
async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.body;
    
    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }
    
    // Call service
    const result = await authService.registerUser(email, password, fullName);
    
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Service
async function registerUser(email, password, fullName) {
  // Check email exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('Email đã được sử dụng');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    fullName: fullName.trim(),
    role: 'user'
  });
  
  // Generate token
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return {
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    },
    token
  };
}
```


### Backend Example: Get Products with Filters

```javascript
// Controller
async function getProducts(req, res, next) {
  try {
    const filters = {
      search: req.query.search,
      categoryId: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      city: req.query.city
    };
    
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };
    
    const result = await productService.getProducts(filters, pagination);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Service
async function getProducts(filters, pagination) {
  const query = buildProductQuery(filters);
  
  const page = pagination.page;
  const limit = Math.min(pagination.limit, 100);
  const skip = (page - 1) * limit;
  
  const products = await Product.find(query)
    .populate('seller', 'fullName isVerified')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Product.countDocuments(query);
  
  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}
```


### Frontend Example: Login Component

```javascript
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        
        <Input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        
        {errors.submit && <p className="error">{errors.submit}</p>}
        
        <Button type="submit" loading={loading}>
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}

export default Login;
```


### Frontend Example: Home Component (Landing Page)

```javascript
import React, { useState, useEffect } from 'react';
import { productService } from '../services/product.service';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ProductList from '../components/ProductList';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    minPrice: null,
    maxPrice: null,
    city: null
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setProducts(result.products);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  return (
    <div className="home-container">
      <SearchBar onSearch={handleSearch} placeholder="Tìm kiếm sản phẩm..." />
      
      <div className="content">
        <FilterPanel onFilterChange={handleFilterChange} />
        
        <div className="products-section">
          <ProductList products={products} loading={loading} />
          
          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={page === pagination.page ? 'active' : ''}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
```


### Frontend Example: AuthContext Implementation

```javascript
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load user from localStorage on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      loadUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadUser = async (token) => {
    try {
      const userData = await authService.getProfile(token);
      setUser(userData);
      setToken(token);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem('token', result.token);
  };
  
  const register = async (email, password, fullName) => {
    const result = await authService.register(email, password, fullName);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem('token', result.token);
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };
  
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password Hashing Round Trip

*For any* valid password (length >= 6), hashing the password and then comparing it with the original using bcrypt.compare should return true.

**Validates: Requirements 1.3, 2.2, 11.1, 11.5**

### Property 2: Password Never Stored in Plain Text

*For any* user in the database, the stored password field should be a bcrypt hash (starting with "$2a$" or "$2b$") and should not equal any plain text password.

**Validates: Requirements 1.3, 11.2**

### Property 3: Password Never Exposed in API Responses

*For any* API response containing user data (registration, login, profile), the response object should not contain a password or password hash field.

**Validates: Requirements 1.5, 2.4, 3.3, 11.3**

### Property 4: Email Uniqueness

*For any* two different users in the database, their email addresses should be different (case-insensitive comparison).

**Validates: Requirements 1.2, 20.2**

### Property 5: Email Format Validation

*For any* email that passes validation, it should match the regex pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/.

**Validates: Requirements 1.6, 13.1**

### Property 6: Email Lowercase Normalization

*For any* user created in the system, the stored email should be in lowercase format regardless of the input case.

**Validates: Requirement 20.3**

### Property 7: Password Length Validation

*For any* password shorter than 6 characters, registration or login should be rejected with appropriate error message.

**Validates: Requirements 1.7, 13.2**

### Property 8: JWT Token Generation and Verification

*For any* successful registration or login, a JWT token should be generated that, when verified with the correct secret, decodes to a payload containing userId, email, and role matching the user's data.

**Validates: Requirements 1.4, 2.3, 12.1, 12.2, 12.4**

### Property 9: JWT Token Expiration

*For any* JWT token generated by the system, the token should have an expiration time of exactly 7 days from creation.

**Validates: Requirements 1.4, 2.3, 12.3**

### Property 10: Suspended Account Login Rejection

*For any* user with isSuspended = true, login attempts should be rejected with error message "Tài khoản đã bị khóa".

**Validates: Requirements 2.6, 3.7, 12.7**

### Property 11: Token Verification Requires Existing User

*For any* valid JWT token, the userId in the token payload should correspond to a user that exists in the database.

**Validates: Requirements 3.2, 12.6**

### Property 12: LocalStorage Token Persistence

*For any* successful login or registration, the JWT token should be stored in browser localStorage under the key "token".

**Validates: Requirements 1.8, 2.7**

### Property 13: Logout Clears Authentication State

*For any* logout action, the JWT token should be removed from localStorage and the AuthContext should be cleared (user = null, token = null).

**Validates: Requirements 4.1, 4.2**

### Property 14: Only Active Products Visible

*For any* product returned by public product listing, search, or filter endpoints, the product status should be 'active'.

**Validates: Requirements 5.1, 6.3, 7.2, 8.4, 9.2**

### Property 15: Product List Sorted by Creation Date

*For any* product listing result, products should be sorted by createdAt in descending order (newest first).

**Validates: Requirement 5.5**

### Property 16: Pagination Limit Enforcement

*For any* product listing request, the number of products returned should not exceed the specified limit, and should never exceed 100 even if a higher limit is requested.

**Validates: Requirements 5.2, 5.6**

### Property 17: Pagination Metadata Accuracy

*For any* paginated product listing, the response should include accurate pagination metadata where totalPages = ceil(total / limit) and page <= totalPages.

**Validates: Requirement 5.3**

### Property 18: Product Data Population

*For any* product in listing results, the seller field should be populated with fullName and isVerified, and the category field should be populated with name and slug.

**Validates: Requirement 5.4**

### Property 19: Search Result Relevance

*For any* non-empty search keyword, all returned products should contain the keyword (case-insensitive) in either the title or description field.

**Validates: Requirement 6.2**

### Property 20: Category Filter Accuracy

*For any* category filter applied, all returned products should have their category field matching the specified category ID.

**Validates: Requirement 7.1**

### Property 21: Price Range Filter Accuracy

*For any* price range filter with minPrice and/or maxPrice, all returned products should have price >= minPrice (if set) AND price <= maxPrice (if set).

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 22: Location Filter Accuracy

*For any* city filter applied, all returned products should have location.city matching the specified city.

**Validates: Requirement 9.1**

### Property 23: Combined Filters Use AND Logic

*For any* combination of filters (search, category, price range, location), all returned products should satisfy ALL filter conditions simultaneously.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 24: Filter Changes Reset Pagination

*For any* change to search keyword or filter parameters, the frontend should reset the page number to 1.

**Validates: Requirements 6.6, 7.4, 8.6, 9.4**

### Property 25: Duplicate Email Registration Rejection

*For any* registration attempt with an email that already exists in the database, the registration should be rejected with error message "Email đã được sử dụng".

**Validates: Requirement 1.2**

### Property 26: Invalid Credentials Generic Error

*For any* login attempt with incorrect email or password, the error message should be generic ("Email hoặc mật khẩu không đúng") without revealing which field is incorrect.

**Validates: Requirements 2.5, 15.3**

### Property 27: Product Title Length Validation

*For any* product creation or update, if the title exceeds 200 characters, validation should fail.

**Validates: Requirement 19.2**

### Property 28: Product Description Length Validation

*For any* product creation or update, if the description exceeds 2000 characters, validation should fail.

**Validates: Requirement 19.3**

### Property 29: Product Price Non-Negative Validation

*For any* product creation or update, if the price is negative, validation should fail.

**Validates: Requirement 19.4**

### Property 30: Product Condition Enum Validation

*For any* product creation or update, the condition field should be one of: 'new', 'like-new', 'good', 'fair', 'poor'.

**Validates: Requirement 19.5**

### Property 31: Product Requires At Least One Image

*For any* product creation, if the images array is empty, validation should fail.

**Validates: Requirement 19.6**

### Property 32: Product Status Enum Validation

*For any* product, the status field should be one of: 'pending', 'active', 'sold', 'rejected', 'expired'.

**Validates: Requirement 19.7**

### Property 33: Product Default Status

*For any* newly created product without explicit status, the status should default to 'pending'.

**Validates: Requirement 19.8**

### Property 34: User Role Enum Validation

*For any* user, the role field should be one of: 'user', 'moderator', 'admin'.

**Validates: Requirement 20.4**

### Property 35: User Default Values

*For any* newly created user without explicit values, the defaults should be: role = 'user', isVerified = false, isSuspended = false, violationCount = 0.

**Validates: Requirements 20.5, 20.6, 20.7, 20.8**

### Property 36: Image Upload Format Validation

*For any* image upload, the file should be rejected if the format is not one of: jpg, jpeg, png, gif.

**Validates: Requirements 18.1, 18.6**

### Property 37: Image Upload Size Limit

*For any* image upload, the file should be rejected if the size exceeds 5MB.

**Validates: Requirements 18.2, 18.7**

### Property 38: Image Filename Uniqueness

*For any* uploaded image, the generated filename should follow the format {timestamp}-{randomString}.{extension} and should be unique.

**Validates: Requirement 18.4**

### Property 39: HTTP Status Code Appropriateness

*For any* error response, the HTTP status code should match the error type: 400 for validation errors, 401 for authentication failures, 403 for authorization failures, 404 for not found, 500 for server errors.

**Validates: Requirements 13.4, 15.1**

### Property 40: AuthContext Provides Required Interface

*For any* component using AuthContext, the context should provide: user object, token string, isAuthenticated boolean, and methods (login, register, logout).

**Validates: Requirement 16.2**


## Error Handling

### Error Scenario 1: Invalid Credentials

**Condition**: User nhập sai email hoặc password khi login

**Response**: 
- Backend trả về status 401 Unauthorized
- Error message: "Email hoặc mật khẩu không đúng"
- Không tiết lộ thông tin cụ thể (email tồn tại hay không)

**Recovery**: 
- User có thể thử lại với credentials khác
- Frontend hiển thị error message rõ ràng
- Không lock account sau nhiều lần thử sai (MVP không có feature này)

### Error Scenario 2: Email Already Exists

**Condition**: User đăng ký với email đã tồn tại trong hệ thống

**Response**:
- Backend trả về status 400 Bad Request
- Error message: "Email đã được sử dụng"

**Recovery**:
- User có thể thử email khác
- Hoặc chuyển sang trang Login nếu đã có account

### Error Scenario 3: Token Expired

**Condition**: User gửi request với JWT token đã hết hạn

**Response**:
- Backend trả về status 401 Unauthorized
- Error message: "Token đã hết hạn"

**Recovery**:
- Frontend tự động logout user
- Clear localStorage
- Redirect về trang Login
- User cần đăng nhập lại

### Error Scenario 4: Account Suspended

**Condition**: User bị khóa account (isSuspended = true) cố gắng login

**Response**:
- Backend trả về status 403 Forbidden
- Error message: "Tài khoản đã bị khóa"

**Recovery**:
- User không thể login
- Cần liên hệ admin để unlock account
- Frontend hiển thị thông báo và hướng dẫn liên hệ support


### Error Scenario 5: Invalid Input Data

**Condition**: User gửi request với data không hợp lệ (email sai format, password quá ngắn, etc.)

**Response**:
- Backend trả về status 400 Bad Request
- Error message cụ thể cho từng field
- Example: "Email không hợp lệ", "Mật khẩu phải có ít nhất 6 ký tự"

**Recovery**:
- Frontend validation ngăn chặn trước khi gửi request
- Nếu vẫn xảy ra, hiển thị error message cho từng field
- User sửa lại input và submit lại

### Error Scenario 6: Database Connection Error

**Condition**: MongoDB connection bị mất hoặc timeout

**Response**:
- Backend trả về status 500 Internal Server Error
- Error message: "Lỗi hệ thống, vui lòng thử lại sau"
- Log error chi tiết ở server side

**Recovery**:
- Frontend hiển thị generic error message
- User có thể retry request
- Backend tự động reconnect MongoDB nếu có thể

### Error Scenario 7: Product Not Found

**Condition**: User cố gắng xem product đã bị xóa hoặc không tồn tại

**Response**:
- Backend trả về status 404 Not Found
- Error message: "Sản phẩm không tồn tại"

**Recovery**:
- Frontend redirect về trang Home
- Hiển thị notification "Sản phẩm không tồn tại hoặc đã bị xóa"

### Error Scenario 8: Network Error

**Condition**: Client không thể kết nối đến server (network offline, server down)

**Response**:
- Frontend catch network error
- Error message: "Không thể kết nối đến server"

**Recovery**:
- Frontend hiển thị retry button
- Check network connection
- User có thể retry khi network stable


## Testing Strategy

### Unit Testing Approach

**Backend Unit Tests**:

1. **Auth Service Tests**:
   - Test `registerUser()` với valid data → expect user created và token returned
   - Test `registerUser()` với duplicate email → expect error thrown
   - Test `loginUser()` với correct credentials → expect user và token returned
   - Test `loginUser()` với wrong password → expect error thrown
   - Test `loginUser()` với suspended account → expect error thrown

2. **Product Service Tests**:
   - Test `getProducts()` với no filters → expect all active products
   - Test `getProducts()` với search keyword → expect filtered results
   - Test `getProducts()` với price range → expect products within range
   - Test `getProducts()` với pagination → expect correct page results

3. **JWT Utility Tests**:
   - Test `generateJWT()` → expect valid token
   - Test `verifyToken()` với valid token → expect decoded payload
   - Test `verifyToken()` với expired token → expect error
   - Test `verifyToken()` với invalid token → expect error

4. **Password Utility Tests**:
   - Test `hashPassword()` → expect hashed string different from input
   - Test `comparePassword()` với matching passwords → expect true
   - Test `comparePassword()` với non-matching passwords → expect false

**Frontend Unit Tests**:

1. **Component Tests**:
   - Test Login component renders correctly
   - Test Login form validation
   - Test Register component renders correctly
   - Test Register form validation
   - Test ProductCard displays product info correctly
   - Test SearchBar handles input changes

2. **Hook Tests**:
   - Test `useAuth` hook provides correct context values
   - Test `useAuth` login function updates state correctly
   - Test `useAuth` logout function clears state

3. **Service Tests**:
   - Test `authService.login()` calls correct API endpoint
   - Test `authService.register()` calls correct API endpoint
   - Test `productService.getProducts()` builds correct query params

**Coverage Goals**:
- Backend: 80% code coverage minimum
- Frontend: 70% code coverage minimum
- Critical paths (authentication, product listing) must have 100% coverage


### Property-Based Testing Approach

**Property Test Library**: fast-check (cho JavaScript/TypeScript)

**Property Tests for Authentication**:

1. **Password Hashing Property**:
```javascript
// Property: Hashing the same password twice produces different hashes (due to salt)
fc.assert(
  fc.property(fc.string({ minLength: 6 }), async (password) => {
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    return hash1 !== hash2;
  })
);
```

2. **Password Comparison Property**:
```javascript
// Property: A hashed password always matches its original
fc.assert(
  fc.property(fc.string({ minLength: 6 }), async (password) => {
    const hash = await hashPassword(password);
    const isMatch = await comparePassword(password, hash);
    return isMatch === true;
  })
);
```

3. **Email Validation Property**:
```javascript
// Property: Valid emails always pass validation
fc.assert(
  fc.property(fc.emailAddress(), (email) => {
    return validateEmail(email) === true;
  })
);
```

4. **JWT Token Property**:
```javascript
// Property: Generated token can always be verified with correct secret
fc.assert(
  fc.property(
    fc.record({
      userId: fc.string(),
      email: fc.emailAddress(),
      role: fc.constantFrom('user', 'moderator', 'admin')
    }),
    (payload) => {
      const token = generateJWT(payload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId === payload.userId && 
             decoded.email === payload.email &&
             decoded.role === payload.role;
    }
  )
);
```

**Property Tests for Product Filtering**:

1. **Price Range Filter Property**:
```javascript
// Property: All filtered products are within price range
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 10000000 }),
    fc.integer({ min: 0, max: 10000000 }),
    async (min, max) => {
      const minPrice = Math.min(min, max);
      const maxPrice = Math.max(min, max);
      
      const result = await productService.getProducts({
        minPrice,
        maxPrice
      }, { page: 1, limit: 100 });
      
      return result.products.every(p => 
        p.price >= minPrice && p.price <= maxPrice
      );
    }
  )
);
```

2. **Pagination Property**:
```javascript
// Property: Page results never exceed limit
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 10 }),
    fc.integer({ min: 1, max: 100 }),
    async (page, limit) => {
      const result = await productService.getProducts({}, { page, limit });
      return result.products.length <= limit;
    }
  )
);
```

3. **Search Relevance Property**:
```javascript
// Property: All search results contain the keyword
fc.assert(
  fc.property(
    fc.string({ minLength: 3 }),
    async (keyword) => {
      const result = await productService.searchProducts(keyword);
      return result.products.every(p => 
        p.title.toLowerCase().includes(keyword.toLowerCase()) ||
        p.description.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  )
);
```


### Integration Testing Approach

**Backend Integration Tests**:

1. **Authentication Flow Integration**:
   - Test complete registration flow: POST /api/auth/register → verify user in DB → verify token works
   - Test complete login flow: POST /api/auth/login → verify token → GET /api/auth/profile with token
   - Test protected route access: GET /api/auth/profile without token → expect 401
   - Test protected route access: GET /api/auth/profile with valid token → expect user data

2. **Product Listing Integration**:
   - Test GET /api/products → verify response structure và pagination
   - Test GET /api/products?search=keyword → verify filtered results
   - Test GET /api/products?category=id → verify category filter
   - Test GET /api/products?minPrice=X&maxPrice=Y → verify price range filter

3. **Database Integration**:
   - Test MongoDB connection và reconnection
   - Test data persistence across requests
   - Test transaction rollback on errors
   - Test index usage for search queries

**Frontend Integration Tests**:

1. **User Journey Tests**:
   - Test guest browsing: Home page → view products → search → filter
   - Test registration journey: Click register → fill form → submit → redirect to home
   - Test login journey: Click login → fill form → submit → redirect to home
   - Test authenticated user: Login → view profile → logout

2. **API Integration Tests**:
   - Test API service calls với mock server
   - Test error handling khi API returns errors
   - Test loading states during API calls
   - Test token refresh flow

3. **State Management Integration**:
   - Test AuthContext updates across components
   - Test localStorage sync với AuthContext
   - Test state persistence on page reload

**End-to-End Tests** (Optional cho MVP):
- Test complete user flows từ browser
- Sử dụng Cypress hoặc Playwright
- Test critical paths: register → login → browse products → logout


## Performance Considerations

### Database Performance

1. **Indexing Strategy**:
   - Create index on `users.email` (unique) cho fast lookup
   - Create text index on `products.title` và `products.description` cho search
   - Create compound index on `products.status`, `products.createdAt` cho listing queries
   - Create index on `products.category` cho category filter
   - Create index on `products.price` cho price range filter

2. **Query Optimization**:
   - Sử dụng `.lean()` cho read-only queries để giảm memory overhead
   - Limit populate fields chỉ lấy những fields cần thiết
   - Implement pagination để tránh load toàn bộ products
   - Cache frequently accessed data (categories list)

3. **Connection Pooling**:
   - Configure MongoDB connection pool size phù hợp
   - Reuse connections thay vì tạo mới mỗi request
   - Handle connection errors và auto-reconnect

### API Performance

1. **Response Time Targets**:
   - Authentication endpoints: < 500ms
   - Product listing: < 1000ms
   - Search queries: < 1500ms

2. **Caching Strategy**:
   - Cache categories list (rarely changes)
   - Consider Redis cho session storage nếu scale
   - Client-side caching với proper cache headers

3. **Rate Limiting**:
   - Implement rate limiting cho authentication endpoints (prevent brute force)
   - Limit: 5 login attempts per minute per IP
   - Limit: 10 registration attempts per hour per IP

### Frontend Performance

1. **Bundle Size Optimization**:
   - Code splitting cho routes
   - Lazy load components không cần thiết ngay
   - Optimize images (compress, use appropriate formats)

2. **Rendering Performance**:
   - Implement virtual scrolling nếu product list quá dài
   - Debounce search input (300ms delay)
   - Memoize expensive computations với useMemo
   - Use React.memo cho ProductCard component

3. **Network Optimization**:
   - Implement request cancellation khi user navigate away
   - Batch multiple requests nếu có thể
   - Use HTTP/2 multiplexing


## Security Considerations

### Authentication Security

1. **Password Security**:
   - Hash passwords với bcrypt (salt rounds = 10)
   - Enforce minimum password length (6 characters cho MVP, recommend 8+ cho production)
   - Never log passwords
   - Never return passwords trong API responses

2. **JWT Security**:
   - Use strong secret key (minimum 256 bits)
   - Set reasonable expiration time (7 days cho MVP)
   - Store JWT_SECRET trong environment variables, never commit to git
   - Validate token signature on every protected request
   - Check user still exists và not suspended khi verify token

3. **Session Management**:
   - Store token trong localStorage (acceptable cho MVP)
   - Consider httpOnly cookies cho production (more secure)
   - Implement logout functionality để clear token
   - Auto-logout khi token expires

### API Security

1. **Input Validation**:
   - Validate all user inputs on backend
   - Sanitize inputs để prevent injection attacks
   - Use express-validator hoặc joi cho validation
   - Validate email format, password strength, etc.

2. **CORS Configuration**:
   - Configure CORS để chỉ allow frontend domain
   - Don't use wildcard (*) trong production
   - Set proper CORS headers

3. **Rate Limiting**:
   - Implement rate limiting để prevent brute force attacks
   - Use express-rate-limit middleware
   - Different limits cho different endpoints

4. **Error Handling**:
   - Don't expose sensitive information trong error messages
   - Use generic messages cho authentication errors
   - Log detailed errors server-side only
   - Never expose stack traces to clients


### Data Security

1. **Database Security**:
   - Use MongoDB Atlas với authentication
   - Connection string: `mongodb+srv://reflow:A123456a@trungnc.lqfrzux.mongodb.net/ReFlow?retryWrites=true&w=majority&appName=TrungNC`
   - Store connection string trong .env file
   - Database name: `ReFlow`
   - Regular backups via MongoDB Atlas
   - Encrypt sensitive data at rest (consider cho production)

2. **Environment Variables**:
   - Store all secrets trong .env file
   - Never commit .env to git (add to .gitignore)
   - Use different .env files cho development và production
   - Required env vars: 
     - `JWT_SECRET`: Secret key cho JWT signing (minimum 256 bits)
     - `MONGODB_URI`: MongoDB connection string
     - `PORT`: Server port (default 5000)
     - `UPLOAD_DIR`: Directory cho uploaded images (default: uploads/)

3. **File Upload Security**:
   - Validate file types (chỉ cho phép images: jpg, jpeg, png, gif)
   - Limit file size (max 5MB per image)
   - Sanitize filenames để prevent path traversal
   - Store uploaded files ngoài public directory
   - Serve images qua dedicated route với proper headers

4. **Data Privacy**:
   - Don't return password hashes trong API responses
   - Limit user data exposure (only return necessary fields)
   - Implement proper authorization checks
   - Follow GDPR principles nếu có EU users

### Frontend Security

1. **XSS Prevention**:
   - React automatically escapes content (good default)
   - Be careful với dangerouslySetInnerHTML
   - Sanitize user-generated content before rendering
   - Use Content Security Policy headers

2. **CSRF Prevention**:
   - Use SameSite cookie attribute nếu dùng cookies
   - Implement CSRF tokens cho state-changing operations
   - Validate origin headers

3. **Dependency Security**:
   - Regularly update dependencies
   - Run `npm audit` để check vulnerabilities
   - Use Dependabot hoặc Snyk cho automated checks
   - Review security advisories

## Dependencies

### Backend Dependencies

**Core Dependencies**:
- `express` (^4.18.0): Web framework
- `mongoose` (^7.0.0): MongoDB ODM
- `bcryptjs` (^2.4.3): Password hashing
- `jsonwebtoken` (^9.0.0): JWT authentication
- `dotenv` (^16.0.0): Environment variables
- `cors` (^2.8.5): CORS middleware
- `multer` (^1.4.5): File upload middleware cho images

**Development Dependencies**:
- `nodemon` (^2.0.0): Auto-restart server
- `jest` (^29.0.0): Testing framework
- `supertest` (^6.3.0): API testing
- `eslint` (^8.0.0): Code linting

**Optional Dependencies** (cho production):
- `express-rate-limit`: Rate limiting
- `helmet`: Security headers
- `morgan`: HTTP request logging
- `express-validator`: Input validation


### Frontend Dependencies

**Core Dependencies**:
- `react` (^18.2.0): UI library
- `react-dom` (^18.2.0): React DOM rendering
- `react-router-dom` (^6.10.0): Routing
- `axios` (^1.4.0): HTTP client

**Development Dependencies**:
- `vite` (^4.3.0): Build tool và dev server
- `@vitejs/plugin-react` (^4.0.0): React plugin cho Vite
- `eslint` (^8.0.0): Code linting
- `@testing-library/react` (^14.0.0): Component testing
- `@testing-library/jest-dom` (^5.16.0): Jest matchers
- `vitest` (^0.31.0): Testing framework

**Optional Dependencies**:
- `react-query`: Data fetching và caching
- `zustand` hoặc `redux`: State management (nếu cần phức tạp hơn Context)
- `react-hook-form`: Form handling
- `yup`: Schema validation

### External Services

**Required**:
- MongoDB Atlas: `mongodb+srv://reflow:A123456a@trungnc.lqfrzux.mongodb.net/ReFlow?retryWrites=true&w=majority&appName=TrungNC`
- Node.js runtime (v16+ recommended)
- Local file system cho image storage

**Optional** (cho production):
- CDN cho static assets
- Redis cho caching và session storage
- Cloud storage (AWS S3, Cloudinary) cho product images (future upgrade)
- Email service (SendGrid, AWS SES) cho email verification (future feature)

### Development Tools

- Git cho version control
- Postman hoặc Insomnia cho API testing
- MongoDB Compass cho database management
- VS Code với extensions: ESLint, Prettier, Thunder Client

## API Endpoints Summary

### Authentication Endpoints

```
POST   /api/auth/register     - Đăng ký tài khoản mới
POST   /api/auth/login        - Đăng nhập
GET    /api/auth/profile      - Xem profile (protected)
POST   /api/auth/logout       - Đăng xuất (protected)
```

### Product Endpoints

```
GET    /api/products                    - Lấy danh sách products (public)
GET    /api/products/:id                - Xem chi tiết product (public)
GET    /api/products/search?q=keyword   - Search products (public)
```

### Category Endpoints

```
GET    /api/categories        - Lấy danh sách categories (public)
```

### File Upload Endpoints

```
POST   /api/upload/image      - Upload single image (protected)
GET    /uploads/:path         - Serve uploaded images (public)
```

## File Storage Structure

```
backend/
├── uploads/
│   ├── products/
│   │   ├── {productId}/
│   │   │   ├── image1.jpg
│   │   │   ├── image2.jpg
│   │   │   └── ...
│   └── users/
│       └── {userId}/
│           └── avatar.jpg
```

**File Upload Configuration**:
- Storage: Local file system
- Max file size: 5MB per image
- Allowed formats: jpg, jpeg, png, gif
- Naming convention: `{timestamp}-{randomString}.{ext}`
- Images served via Express static middleware

