# Frontend API Reference — CMS

## Table of Contents

- [Changelog](#changelog)
- [API Version](#api-version)
- [1. Introduction](#1-introduction)
  - [Base URLs](#base-urls)
- [2. General Notes](#2-general-notes)
- [3. Authentication](#3-authentication)
- [4. Standard Response Format](#4-standard-response-format)
  - [4.1 Success Response Example](#41-success-response-example)
  - [4.2 Validation Error Example](#42-validation-error-example)
  - [4.3 Authentication Error Example](#43-authentication-error-example)
  - [4.4 Permission Error Example](#44-permission-error-example)
  - [4.5 Server Error Example](#45-server-error-example)
- [5. HTTP Status Codes](#5-http-status-codes)
- [6. Required Headers](#6-required-headers)
- [7. Date & Time Standards](#7-date--time-standards)
- [8. Enumerations](#8-enumerations)
  - [8.1 Customer Types](#81-customer-types)
  - [8.2 Status Codes](#82-status-codes)
  - [8.3 Authentication Providers](#83-authentication-providers)
  - [8.4 Role Codes](#84-role-codes)
- [9. Data Retrieval Standards](#9-data-retrieval-standards)
- [10. Endpoints](#10-endpoints)
  - [10.1 General Routes](#101-general-routes)
  - [10.2 Auth Module](#102-auth-module)
  - [10.3 Common Module](#103-common-module)
  - [10.4 Identity Module](#104-identity-module)
  - [10.5 Service Module](#105-service-module)
  - [10.6 Menu Module](#106-menu-module)
  - [10.7 Day Slot Module](#107-day-slot-module)
  - [10.8 Day Menu Module](#108-day-menu-module)
  - [10.9 Pricing Module](#109-pricing-module)
- [11. Documentation Review & Recommendations](#11-documentation-review--recommendations)

## Changelog
* **Version 1.0**: Initial Release

## API Version
**Version:** v1  
*(Note: URL versioning is not currently implemented in the path, but this document reflects version 1 of the API.)*

## 1. Introduction
**Purpose**: This document provides a comprehensive reference for integrating with the Canteen Management System (CMS) backend APIs.  
**Intended Audience**: Frontend Developers.

### Base URLs
* **Development**: `http://localhost:8080` 
* **Production**: `https://<server-domain>/api` (Placeholder)

## 2. General Notes
* **Authentication**: Required for all endpoints unless explicitly marked otherwise.
* **Response Format**: All responses use the standard response envelope.
* **Deletion**: Physical deletion is generally avoided; soft delete/deactivation via `STATUS` update is preferred.

## 3. Authentication
The API uses **JWT (JSON Web Token)** for authentication.
* **Format**: Bearer Token
* **Header**: `Authorization`
* **Public Endpoints**: `/auth/login`
* **Protected Endpoints**: All others require a valid JWT.

**Example Request Header**:
```http
Authorization: Bearer <JWT_TOKEN>
```

## 4. Standard Response Format
All APIs return a standardized JSON structure.

### 4.1 Success Response Example
```json
{
  "SUCCESS": true,
  "MESSAGE": "Operation completed successfully.",
  "DATA": {
    "id": 1,
    "name": "Example"
  }
}
```

### 4.2 Validation Error Example
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation failed",
  "ERRORS": [
    { "field": "LOGINID", "message": "LOGINID must be at least 3 characters" }
  ]
}
```

### 4.3 Authentication Error Example
```json
{
  "SUCCESS": false,
  "MESSAGE": "Unauthorized: Missing or invalid token",
  "ERRORS": null
}
```

### 4.4 Permission Error Example
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden: Insufficient role permissions",
  "ERRORS": null
}
```

### 4.5 Server Error Example
```json
{
  "SUCCESS": false,
  "MESSAGE": "Internal Server Error",
  "ERRORS": null
}
```

## 5. HTTP Status Codes
* **200 OK**: Request succeeded.
* **201 Created**: Resource successfully created.
* **204 No Content**: Action succeeded, no data returned.
* **400 Bad Request**: Validation error or malformed request.
* **401 Unauthorized**: Missing or invalid JWT token.
* **403 Forbidden**: Valid token, but insufficient privileges (roles).
* **404 Not Found**: Resource or endpoint does not exist.
* **409 Conflict**: Resource already exists or conflict occurred.
* **422 Unprocessable Entity**: Validation error (if used specifically).
* **500 Internal Server Error**: Unhandled server exception.

## 6. Required Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

## 7. Date & Time Standards
* **Date**: `YYYY-MM-DD` (e.g., "2024-12-01")
* **Time**: `HH:MM` or `HH:MM:SS` in 24-hour format (e.g., "14:30" or "14:30:00")
* **DateTime**: ISO-8601 (e.g., "2024-12-01T14:30:00.000Z")

## 8. Enumerations

### 8.1 Customer Types
* `PERMANENT`
* `CONTRACT`
* `VISITOR`
* `OTHERCENTRE`

### 8.2 Status Codes
* `A` (Active)
* `D` (Deactivated)
* `P` (Pending)
* `EXP` (Expired)
* `BLK` (Blocked)

### 8.3 Authentication Providers
* `LOCAL`
* `SSO`

### 8.4 Role Codes
* `ADMIN`
* `CTNMNG` (Canteen Manager)
* `CTNSTF` (Canteen Staff)
* `CANTEEN_MANAGER` (Found in Pricing module)
* `CANTEEN_ASSISTANT` (Found in Pricing module)

## 9. Data Retrieval Standards
* **Pagination**: Pagination is not currently supported.
* **Sorting**: Sorting is not currently supported.
* **Search**: Search is not currently supported.
* **Filtering**: Filtering is not currently supported (except where specific query parameters are documented).

---

## 10. Endpoints

### 10.1 General Routes

#### 10.1.1 Get Current User Profile
* **Endpoint**: `/me`
* **HTTP Method**: `GET`
* **Description**: Retrieves the authenticated user's profile from the JWT payload.
* **Authentication Required**: Yes
* **Required Roles**: Any valid user
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Authenticated user details",
  "DATA": {
    "USERID": 1,
    "LOGINID": "admin",
    "ROLES": ["ADMIN"]
  }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Unauthorized",
  "ERRORS": null
}
```

#### 10.1.2 Admin Test Route
* **Endpoint**: `/admin/test`
* **HTTP Method**: `GET`
* **Description**: Verifies if the user has system admin access.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Admin access granted",
  "DATA": { "USERID": 1, "LOGINID": "admin", "ROLES": ["ADMIN"] }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

---

### 10.2 Auth Module

#### 10.2.1 Login
* **Endpoint**: `/auth/login`
* **HTTP Method**: `POST`
* **Description**: Authenticates user and returns JWT token and profile.

#### 10.2.2 SSO Login
* **Endpoint**: `/auth/sso`
* **HTTP Method**: `POST`
* **Description**: Authenticates user using an AES-128-ECB encrypted Base64Url token (containing username and 5-minute expiry) and returns a standard CMS JWT token.
* **Authentication Required**: No
* **Required Roles**: None
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: None
* **Request Body**:
```json
{
  "token": "mK5bn8QiqvY3TTmBlwVdgw9AbtI8S4ByPX4W01E2CEw"
}
```
* **Success Response Example**: (Same as Login)
* **Error Response Example**: (Missing or expired token)
```json
{
  "SUCCESS": false,
  "MESSAGE": "SSO token expired",
  "ERRORS": null
}
```
* **Authentication Required**: No
* **Required Roles**: None
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `LOGINID` | string | Yes | 3-50 chars |
| `PASSWORD`| string | Yes | 1-72 chars |

**Request Example**:
```json
{
  "LOGINID": "johndoe",
  "PASSWORD": "securePassword123"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Login successful",
  "DATA": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": { "USERID": 1, "FULLNAME": "John Doe", "ROLES": ["CTNMNG"] }
  }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Invalid credentials",
  "ERRORS": null
}
```

---

### 10.3 Common Module

#### 10.3.1 Get System Statuses
* **Endpoint**: `/common/status`
* **HTTP Method**: `GET`
* **Description**: List all system statuses.
* **Authentication Required**: Yes
* **Required Roles**: Any valid user
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Statuses retrieved",
  "DATA": [{ "STATUSCODE": "A", "STATUSNAME": "Active" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Failed to fetch statuses",
  "ERRORS": null
}
```

#### 10.3.2 Get Customer Types
* **Endpoint**: `/common/customer-types`
* **HTTP Method**: `GET`
* **Description**: List all customer types.
* **Authentication Required**: Yes
* **Required Roles**: Any valid user
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Customer types retrieved",
  "DATA": [{ "CTYPECODE": "PERMANENT", "CTYPENAME": "Permanent Employee" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Failed to fetch customer types",
  "ERRORS": null
}
```

#### 10.3.3 Get Screens
* **Endpoint**: `/common/screens`
* **HTTP Method**: `GET`
* **Description**: List all screens configured in the system.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Screens retrieved",
  "DATA": [{ "SCREENID": 1, "SCREENNAME": "Dashboard" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.3.4 Get Auto-numbers
* **Endpoint**: `/common/autonos`
* **HTTP Method**: `GET`
* **Description**: List all auto-numbers config.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Auto-numbers retrieved",
  "DATA": []
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

---

### 10.4 Identity Module

#### 10.4.1 Get Users
* **Endpoint**: `/identity/users`
* **HTTP Method**: `GET`
* **Description**: List all users.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Users retrieved",
  "DATA": [{ "USERID": 1, "LOGINID": "admin" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.4.2 Create User
* **Endpoint**: `/identity/users`
* **HTTP Method**: `POST`
* **Description**: Create a new system user.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `LOGINID` | string | Yes | 3-50 chars, regex `^[A-Za-z0-9@._-]+$` |
| `FULLNAME`| string | Yes | 2-120 chars |
| `EMAIL` | string | Optional | Valid email, max 120 chars, nullable |
| `MOBILENO`| string | Optional | 10-digit Indian mobile, nullable |
| `PASSWORD`| string | Yes | 8-72 chars |
| `AUTHPROV`| enum | Optional | `LOCAL` or `SSO`, defaults to `LOCAL` |
| `AUTHID` | string | Optional | Max 120 chars, nullable |

**Request Example**:
```json
{
  "LOGINID": "newuser",
  "FULLNAME": "New User",
  "EMAIL": "newuser@example.com",
  "MOBILENO": "9876543210",
  "PASSWORD": "securepassword",
  "AUTHPROV": "LOCAL"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "User created successfully",
  "DATA": { "USERID": 2 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error",
  "ERRORS": [{ "field": "EMAIL", "message": "Invalid email format" }]
}
```

#### 10.4.3 Assign User Role
* **Endpoint**: `/identity/user-roles`
* **HTTP Method**: `POST`
* **Description**: Assign a specific role to a user.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `USERID` | integer | Yes | Positive |
| `ROLEID` | integer | Yes | Positive |
| `VALIDFROM`| string | Optional | ISO-8601 DateTime, nullable |
| `VALIDUNTIL`| string | Optional | ISO-8601 DateTime, nullable |

**Request Example**:
```json
{
  "USERID": 2,
  "ROLEID": 3,
  "VALIDFROM": "2024-01-01T00:00:00.000Z"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Role assigned successfully",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "User not found",
  "ERRORS": null
}
```

#### 10.4.4 Get Roles
* **Endpoint**: `/identity/roles`
* **HTTP Method**: `GET`
* **Description**: List all system roles.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Roles retrieved",
  "DATA": [{ "ROLEID": 1, "ROLENAME": "Administrator" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.4.5 Get Customers
* **Endpoint**: `/identity/customers`
* **HTTP Method**: `GET`
* **Description**: List all customers (consumers).
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Customers retrieved",
  "DATA": [{ "CUSTOMERID": 1, "DISPNAME": "John Customer" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.4.6 Create Customer
* **Endpoint**: `/identity/customers`
* **HTTP Method**: `POST`
* **Description**: Create a new customer record.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `USERID` | integer | Optional | Positive, nullable |
| `CTYPECODE` | enum | Yes | `"PERMANENT"`, `"CONTRACT"`, `"VISITOR"`, `"OTHERCENTRE"` |
| `DISPNAME`| string | Yes | 2-120 chars |
| `STATUS` | enum | Optional | `"A"`, `"D"`, `"P"`, `"EXP"`, `"BLK"` (default: `"A"`) |
| `VALIDFROM`| string | Optional | ISO-8601 DateTime, nullable |
| `VALIDUNTIL`| string | Optional | ISO-8601 DateTime, nullable |

**Request Example**:
```json
{
  "USERID": 2,
  "CTYPECODE": "PERMANENT",
  "DISPNAME": "John Customer",
  "STATUS": "A"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Customer created successfully",
  "DATA": { "CUSTOMERID": 1 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation failed",
  "ERRORS": null
}
```

---

### 10.5 Service Module

#### 10.5.1 Get All Services
* **Endpoint**: `/services`
* **HTTP Method**: `GET`
* **Description**: List all services associated with canteens (e.g., Breakfast, Lunch).
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`, `CTNSTF`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Services retrieved",
  "DATA": [{ "SERVICEID": 1, "SERVNAME": "Lunch", "DEFSTART": "12:00", "DEFEND": "14:00" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.5.2 Get Service by ID
* **Endpoint**: `/services/:id`
* **HTTP Method**: `GET`
* **Description**: Retrieve a specific service's details.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`, `CTNSTF`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Service retrieved",
  "DATA": { "SERVICEID": 1, "SERVNAME": "Lunch", "DEFSTART": "12:00", "DEFEND": "14:00" }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Service not found",
  "ERRORS": null
}
```

#### 10.5.3 Create Service
* **Endpoint**: `/services`
* **HTTP Method**: `POST`
* **Description**: Create a new meal service.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `CANTEENID`| integer| Yes | Positive |
| `SERVCODE`| string | Yes | 1-20 chars |
| `SERVNAME`| string | Yes | 1-80 chars |
| `DEFSTART`| string | Yes | Time format `HH:MM(:SS)` |
| `DEFEND`  | string | Yes | Time format `HH:MM(:SS)` |

**Request Example**:
```json
{
  "CANTEENID": 1,
  "SERVCODE": "LUNCH",
  "SERVNAME": "Main Lunch Service",
  "DEFSTART": "12:00",
  "DEFEND": "14:00"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Service created successfully",
  "DATA": { "SERVICEID": 2 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error",
  "ERRORS": [{ "field": "DEFSTART", "message": "Invalid time format" }]
}
```

#### 10.5.4 Update Service
* **Endpoint**: `/services/:id`
* **HTTP Method**: `PUT`
* **Description**: Update an existing meal service.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `SERVNAME`| string | Yes | 1-80 chars |
| `DEFSTART`| string | Yes | Time format `HH:MM(:SS)` |
| `DEFEND`  | string | Yes | Time format `HH:MM(:SS)` |
| `STATUS`  | string | Yes | 1-20 chars |
| `CHGREASON`| string | Optional| Max 255 chars, nullable |

**Request Example**:
```json
{
  "SERVNAME": "Extended Lunch",
  "DEFSTART": "11:30",
  "DEFEND": "14:30",
  "STATUS": "A",
  "CHGREASON": "Schedule adjustment"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Service updated successfully",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Service not found",
  "ERRORS": null
}
```

---

### 10.6 Menu Module

#### 10.6.1 Get All Menu Items
* **Endpoint**: `/menu-items`
* **HTTP Method**: `GET`
* **Description**: List all cataloged menu items.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`, `CTNSTF`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Menu items retrieved",
  "DATA": [{ "MENUITEMID": 1, "ITEMNAME": "Veg Thali" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.6.2 Get Menu Item by ID
* **Endpoint**: `/menu-items/:id`
* **HTTP Method**: `GET`
* **Description**: Retrieve specific menu item details.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`, `CTNSTF`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Menu item retrieved",
  "DATA": { "MENUITEMID": 1, "ITEMNAME": "Veg Thali", "ISSPECIAL": 0 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Item not found",
  "ERRORS": null
}
```

#### 10.6.3 Create Menu Item
* **Endpoint**: `/menu-items`
* **HTTP Method**: `POST`
* **Description**: Add a new item to the menu catalog.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `MENUCODE`| string | Yes | 1-20 chars |
| `SHORTNAME`| string | Yes | 1-30 chars |
| `ITEMNAME`| string | Yes | 1-100 chars |
| `ITEMDESCR`| string | Optional| Max 255 chars, nullable |
| `ISSPECIAL`| integer| Optional| Flag indicating special item |

**Request Example**:
```json
{
  "MENUCODE": "VTHALI",
  "SHORTNAME": "V. Thali",
  "ITEMNAME": "Vegetable Thali",
  "ITEMDESCR": "Standard vegetable meal",
  "ISSPECIAL": 0
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Menu item created successfully",
  "DATA": { "MENUITEMID": 2 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error",
  "ERRORS": null
}
```

#### 10.6.4 Update Menu Item
* **Endpoint**: `/menu-items/:id`
* **HTTP Method**: `PUT`
* **Description**: Update an existing menu item.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `SHORTNAME`| string | Yes | 1-30 chars |
| `ITEMNAME`| string | Yes | 1-100 chars |
| `ITEMDESCR`| string | Optional| Max 255 chars, nullable |
| `ISSPECIAL`| integer| Optional| Flag indicating special item |
| `STATUS`  | string | Yes | 1-20 chars |
| `CHGREASON`| string | Optional| Max 255 chars, nullable |

**Request Example**:
```json
{
  "SHORTNAME": "Spl Thali",
  "ITEMNAME": "Special Veg Thali",
  "ITEMDESCR": "Includes sweet",
  "ISSPECIAL": 1,
  "STATUS": "A",
  "CHGREASON": "Upgraded meal"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Menu item updated successfully",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Item not found",
  "ERRORS": null
}
```

---

### 10.7 Day Slot Module

#### 10.7.1 Get All Day Slots
* **Endpoint**: `/day-slots`
* **HTTP Method**: `GET`
* **Description**: List all operational day slots for services.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`, `CTNSTF`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day slots retrieved",
  "DATA": [{ "DAYSLOTID": 1, "SERVDATE": "2024-12-01", "STARTTIME": "12:00" }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.7.2 Get Day Slot by ID
* **Endpoint**: `/day-slots/:id`
* **HTTP Method**: `GET`
* **Description**: Retrieve specific day slot details.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`, `CTNSTF`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day slot retrieved",
  "DATA": { "DAYSLOTID": 1, "SERVDATE": "2024-12-01", "STARTTIME": "12:00", "ENDTIME": "14:00" }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Slot not found",
  "ERRORS": null
}
```

#### 10.7.3 Create Day Slot
* **Endpoint**: `/day-slots`
* **HTTP Method**: `POST`
* **Description**: Instantiate a service slot for a specific date.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `SERVICEID`| integer| Yes | Positive |
| `SERVDATE`| string | Yes | Date format `YYYY-MM-DD` |
| `STARTTIME`| string | Yes | Time format `HH:MM(:SS)` |
| `ENDTIME` | string | Yes | Time format `HH:MM(:SS)` |

**Request Example**:
```json
{
  "SERVICEID": 1,
  "SERVDATE": "2024-12-05",
  "STARTTIME": "12:00",
  "ENDTIME": "14:00"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day slot created",
  "DATA": { "DAYSLOTID": 2 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error",
  "ERRORS": null
}
```

#### 10.7.4 Update Day Slot
* **Endpoint**: `/day-slots/:id`
* **HTTP Method**: `PUT`
* **Description**: Update day slot timings or status.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `STARTTIME`| string | Yes | Time format `HH:MM(:SS)` |
| `ENDTIME` | string | Yes | Time format `HH:MM(:SS)` |
| `STATUS`  | string | Yes | 1-20 chars |
| `CHGREASON`| string | Optional| Max 255 chars, nullable |

**Request Example**:
```json
{
  "STARTTIME": "12:15",
  "ENDTIME": "14:15",
  "STATUS": "A",
  "CHGREASON": "Delayed start"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day slot updated",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Slot not found",
  "ERRORS": null
}
```

---

### 10.8 Day Menu Module

#### 10.8.1 Get All Day Menus
* **Endpoint**: `/day-menus`
* **HTTP Method**: `GET`
* **Description**: List all planned menu items for day slots.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day menus retrieved",
  "DATA": [{ "DAYMENUID": 1, "MENUITEMID": 5 }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.8.2 Get Day Menu by ID
* **Endpoint**: `/day-menus/:id`
* **HTTP Method**: `GET`
* **Description**: Retrieve specific day menu details.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day menu retrieved",
  "DATA": { "DAYMENUID": 1, "AVAILQTY": 100 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Menu not found",
  "ERRORS": null
}
```

#### 10.8.3 Create Day Menu
* **Endpoint**: `/day-menus`
* **HTTP Method**: `POST`
* **Description**: Schedule a menu item for a specific day slot.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`, `CTNSTF`
* **Path Parameters**: None
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `DAYSLOTID`| integer| Yes | Positive |
| `MENUITEMID`| integer| Yes | Positive |
| `ISSPECIAL`| integer| Optional| 0 or 1 |
| `ISPREBOOK`| integer| Optional| 0 or 1 |
| `ISKIOSK` | integer| Optional| 0 or 1 |
| `AVAILQTY`| integer| Yes | Any integer |
| `MAXQTY`  | integer| Yes | Any integer |
| `BOOKUNTIL`| string | Yes | ISO-8601 DateTime |
| `CANCELUNTIL`| string | Yes | ISO-8601 DateTime |
| `REMARKS` | string | Optional| Max 255 chars, nullable |

**Request Example**:
```json
{
  "DAYSLOTID": 1,
  "MENUITEMID": 5,
  "ISSPECIAL": 0,
  "ISPREBOOK": 1,
  "ISKIOSK": 1,
  "AVAILQTY": 100,
  "MAXQTY": 120,
  "BOOKUNTIL": "2024-12-05T10:00:00.000Z",
  "CANCELUNTIL": "2024-12-05T11:00:00.000Z",
  "REMARKS": "Standard setup"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day menu created",
  "DATA": { "DAYMENUID": 2 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error",
  "ERRORS": null
}
```

#### 10.8.4 Approve Day Menu
* **Endpoint**: `/day-menus/:id/approve`
* **HTTP Method**: `PATCH`
* **Description**: Approve a planned day menu.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `REMARKS`| string | Optional| Max 255 chars, nullable |

**Request Example**:
```json
{
  "REMARKS": "Approved for tomorrow"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day menu approved",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Menu not found",
  "ERRORS": null
}
```

#### 10.8.5 Reject Day Menu
* **Endpoint**: `/day-menus/:id/reject`
* **HTTP Method**: `PATCH`
* **Description**: Reject a planned day menu.
* **Authentication Required**: Yes
* **Required Roles**: `ADMIN`, `CTNMNG`
* **Path Parameters**:
  * `id` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `REMARKS`| string | Optional| Max 255 chars, nullable |

**Request Example**:
```json
{
  "REMARKS": "Quantity insufficient"
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Day menu rejected",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Menu not found",
  "ERRORS": null
}
```

#### 10.8.6 View Published Menu
* **Endpoint**: `/menus`
* **HTTP Method**: `GET`
* **Description**: View the approved/published menu for consumers.
* **Authentication Required**: Yes
* **Required Roles**: Any valid user
* **Path Parameters**: None
* **Query Parameters**:
  * `canteenId` (integer, positive, required)
  * `serviceDate` (string, required, `YYYY-MM-DD`)
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Published menu retrieved",
  "DATA": [{ "DAYMENUID": 1, "ITEMNAME": "Veg Thali", "PRICE": 50 }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error: Missing query parameters",
  "ERRORS": null
}
```

---

### 10.9 Pricing Module

#### 10.9.1 Create Item Price
* **Endpoint**: `/menu-items/:menuItemId/prices`
* **HTTP Method**: `POST`
* **Description**: Create new pricing for a menu item based on customer types.
* **Authentication Required**: Yes
* **Required Roles**: `CANTEEN_MANAGER`, `CANTEEN_ASSISTANT`
* **Path Parameters**:
  * `menuItemId` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `EFFFROM`| string | Yes | Date format `YYYY-MM-DD` |
| `PRICES` | array  | Yes | Min length 1. Contains pricing objects: |
| `PRICES[].CTYPECODE`| enum | Yes | `"PERMANENT"`, `"CONTRACT"`, `"OTHERCENTRE"`, `"VISITOR"` (Unique in array) |
| `PRICES[].PRICE`    | number| Yes | Non-negative |

**Request Example**:
```json
{
  "EFFFROM": "2024-12-01",
  "PRICES": [
    { "CTYPECODE": "PERMANENT", "PRICE": 50.0 },
    { "CTYPECODE": "VISITOR", "PRICE": 80.0 }
  ]
}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Pricing created successfully",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error",
  "ERRORS": [{ "field": "PRICES", "message": "Customer types must be unique" }]
}
```

#### 10.9.2 Get Item Price History
* **Endpoint**: `/menu-items/:menuItemId/prices`
* **HTTP Method**: `GET`
* **Description**: Get the full historical pricing for a menu item.
* **Authentication Required**: Yes
* **Required Roles**: `CANTEEN_MANAGER`, `CANTEEN_ASSISTANT`
* **Path Parameters**:
  * `menuItemId` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Price history retrieved",
  "DATA": [{ "EFFFROM": "2024-01-01", "PRICE": 40.0 }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Forbidden",
  "ERRORS": null
}
```

#### 10.9.3 Get Effective Prices for an Item
* **Endpoint**: `/menu-items/:menuItemId/prices/effective`
* **HTTP Method**: `GET`
* **Description**: Get currently applicable prices for a menu item across all customer types for a specific date.
* **Authentication Required**: Yes
* **Required Roles**: Any valid user
* **Path Parameters**:
  * `menuItemId` (integer, positive)
* **Query Parameters**:
  * `serviceDate` (string, required, `YYYY-MM-DD`)
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Effective prices retrieved",
  "DATA": [{ "CTYPECODE": "PERMANENT", "PRICE": 50.0 }]
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation error: Missing serviceDate",
  "ERRORS": null
}
```

#### 10.9.4 Get Effective Price for Specific Customer
* **Endpoint**: `/menu-items/:menuItemId/prices/effective/:customerTypeCode`
* **HTTP Method**: `GET`
* **Description**: Get the active price of an item for one specific customer type on a given date.
* **Authentication Required**: Yes
* **Required Roles**: Any valid user
* **Path Parameters**:
  * `menuItemId` (integer, positive)
  * `customerTypeCode` (enum: `"PERMANENT"`, `"CONTRACT"`, `"OTHERCENTRE"`, `"VISITOR"`)
* **Query Parameters**:
  * `serviceDate` (string, required, `YYYY-MM-DD`)
* **Request Headers**: `Authorization`
* **Request Body**: None
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Effective price retrieved",
  "DATA": { "PRICE": 50.0 }
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Price not configured",
  "ERRORS": null
}
```

#### 10.9.5 Deactivate an Item Price
* **Endpoint**: `/item-prices/:itemPriceId/deactivate`
* **HTTP Method**: `PATCH`
* **Description**: Deactivate a specific pricing record.
* **Authentication Required**: Yes
* **Required Roles**: `CANTEEN_MANAGER`, `CANTEEN_ASSISTANT`
* **Path Parameters**:
  * `itemPriceId` (integer, positive)
* **Query Parameters**: None
* **Request Headers**: `Authorization`, `Content-Type: application/json`
* **Request Body**: None

**Request Example**:
```json
{}
```
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Item price deactivated",
  "DATA": null
}
```
* **Error Response Example**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "Price record not found",
  "ERRORS": null
}
```

---

### 10.10 Booking Module

#### 10.10.1 Get Bookings
* **Endpoint**: `/bookings`
* **HTTP Method**: `GET`
* **Description**: Retrieve a list of bookings with optional filtering.
* **Authentication Required**: Yes
* **Required Roles**: Valid authenticated user
* **Query Parameters**:
  * `PCUSTOMERID` (integer, optional)
  * `PSERVICEID` (integer, optional)
  * `PSTARTDATE` (string YYYY-MM-DD, optional)
  * `PENDDATE` (string YYYY-MM-DD, optional)
  * `PSTATUS` (string, optional)
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Bookings retrieved successfully",
  "DATA": [
    {
      "BOOKID": 1,
      "BOOKNO": "PB-LUNCH-001",
      "CUSTOMERID": 12,
      "SERVICEID": 2,
      "SERVICEDATE": "2026-07-28",
      "STATUS": "CR"
    }
  ]
}
```

#### 10.10.2 Get Booking by ID
* **Endpoint**: `/bookings/:id`
* **HTTP Method**: `GET`
* **Description**: Retrieve a specific booking and its items.
* **Path Parameters**:
  * `id` (integer, positive)
* **Success Response Example**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "Booking fetched successfully",
  "DATA": {
    "HEADER": { "BOOKID": 1, "BOOKNO": "PB-LUNCH-001" },
    "ITEMS": [ { "BOOKITEMID": 1, "QTY": 2 } ]
  }
}
```

#### 10.10.3 Create Booking
* **Endpoint**: `/bookings`
* **HTTP Method**: `POST`
* **Description**: Create a new Pre-booking (PB) or Kiosk booking (KS).
* **Request Body Example**:
```json
{
  "PBOOKTYPECODE": "PB",
  "PCUSTOMERID": 12,
  "PSERVICEID": 2,
  "PSERVICEDATE": "2026-07-28",
  "PITEMSJSON": [ { "DAYMENUID": 105, "QTY": 2 } ]
}
```

#### 10.10.4 Update Booking Item
* **Endpoint**: `/bookings/:id/items/:itemId`
* **HTTP Method**: `PUT`
* **Description**: Update an individual booking item (qty or status).
* **Request Body Example**:
```json
{
  "PQTY": 3,
  "PSTATUS": "CR"
}
```

#### 10.10.5 Cancel Booking
* **Endpoint**: `/bookings/:id/cancel`
* **HTTP Method**: `PATCH`
* **Description**: Cancel a booking completely.
* **Request Body Example**:
```json
{
  "PCANCELREASON": "Not required anymore"
}
```

#### 10.10.6 Serve Booking
* **Endpoint**: `/bookings/:id/serve`
* **HTTP Method**: `PATCH`
* **Description**: Mark a booking as served (Canteen staff action).
* **Required Roles**: `CTNMNG`, `CTNSTF`

#### 10.10.7 No-Show Booking
* **Endpoint**: `/bookings/:id/no-show`
* **HTTP Method**: `PATCH`
* **Description**: Mark a booking as a no-show (Canteen staff action).
* **Required Roles**: `CTNMNG`, `CTNSTF`

#### 10.10.8 Toggle Kiosk
* **Endpoint**: `/bookings/kiosk-toggle/:dayMenuId`
* **HTTP Method**: `PATCH`
* **Description**: Live toggle kiosk availability for a day menu.
* **Request Body Example**:
```json
{
  "PISKIOSK": 1
}
```

## 11. Documentation Review & Recommendations

This section highlights inconsistencies identified during the documentation process. **No backend implementation has been changed**, but these findings should be considered for future API revisions to ensure a more consistent developer experience:

1. **Role Naming Inconsistency**: 
   * **Finding**: The `Identity`, `Service`, `Menu`, `Day Slot`, and `Day Menu` modules utilize roles like `ADMIN`, `CTNMNG`, and `CTNSTF`. However, the `Pricing` module utilizes entirely different role name formats like `CANTEEN_MANAGER` and `CANTEEN_ASSISTANT`.
   * **Recommendation**: Standardize role names across the entire system. Adopt a single naming convention (e.g., `CANTEEN_MANAGER` over `CTNMNG`).
2. **Endpoint Resource Naming Consistency**: 
   * **Finding**: The public menu endpoint is mounted at `/menus`, whereas the administration of items is at `/menu-items`. Additionally, the `Pricing` module uses `/item-prices/:itemPriceId/deactivate` for deactivation but nests price creation under `/menu-items/:menuItemId/prices`.
   * **Recommendation**: Consolidate pricing endpoints securely under `/menu-items/:id/prices` entirely or adopt a flat global structure like `/prices` across the board for better REST consistency. Consider aligning `/menus` with the `/day-menus` terminology if it represents the published daily menu.
3. **Data Retrieval Capabilities**:
   * **Finding**: Currently, standard capabilities like pagination, sorting, keyword search, and filtering are completely missing from list endpoints (e.g., `GET /menu-items`, `GET /users`).
   * **Recommendation**: Implement standardized URL query parameter-based pagination (e.g., `?page=1&pageSize=20`), sorting (e.g., `?sort=createdAt:desc`), and search capabilities for administrative list screens to prevent large payload bottlenecks on the frontend as data grows.
