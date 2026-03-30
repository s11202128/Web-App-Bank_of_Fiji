# Auth API Documentation

## POST /api/auth/register
Registers a customer account.

### Request Body
- `fullName` (string): Customer full name
- `mobile` (string): Phone number
- `email` (string): Email address
- `password` (string): Password
- `confirmPassword` (string, optional): Confirmation of password

### Response
- `201 Created`
- Body fields: `userId`, `customerId`, `fullName`, `email`, `emailVerified`, `message`

## POST /api/auth/login
Authenticates customer/admin and returns JWT token.

### Request Body
- `email` (string)
- `password` (string)

### Response
- `200 OK`
- Body fields: `token`, `fullName`, `userId`, `customerId`, `email`, `mobile`, `nationalId`, `isAdmin`

## POST /api/auth/forgot-password
Starts password reset with OTP delivery.

### Request Body
- `email` (string)

### Response
- `200 OK`
- Body fields: `resetId`, `message`

## POST /api/auth/reset-password
Completes password reset with OTP.

### Request Body
- `email` (string)
- `resetId` (string)
- `otp` (string)
- `newPassword` (string)

### Response
- `200 OK`
- Body field: `status`

## POST /api/auth/admin-verify
Verifies admin credentials.

### Request Body
- `email` (string)
- `password` (string)

### Response
- `200 OK`
- Body fields: `email`, `fullName`, `isAdmin`
