# Login Credentials

এই file-এ সব default user accounts-এর login information দেওয়া আছে।

## 🔐 Default User Accounts

### 1. Admin Account
- **Phone Number**: `01700000001`
- **Password**: `admin123`
- **Email**: `admin@hospital.com`
- **Role**: Admin
- **Access**: Full system access, user management, clinic setup

### 2. Doctor Account
- **Phone Number**: `01700000002`
- **Password**: `doctor123`
- **Email**: `doctor@hospital.com`
- **Role**: Doctor
- **Access**: Profile management, appointment scheduling, patient management

### 3. User/Patient Account
- **Phone Number**: `01700000003`
- **Password**: `user123`
- **Email**: `user@hospital.com`
- **Role**: User
- **Access**: Appointment booking, profile management

## 📝 Login Instructions

1. **API Endpoint**: `POST /auth/login`
2. **Request Body**:
   ```json
   {
     "phone": "01700000001",
     "password": "admin123"
   }
   ```

3. **Response**: JWT token এবং user information return করবে

## ⚠️ Security Note

- Production environment-এ এই default passwords change করুন
- Strong passwords ব্যবহার করুন
- Regular security audits করুন

## 🔄 Password Change

Login করার পর password change করতে পারেন:
- **Endpoint**: `PATCH /users/change-password`
- **Body**:
  ```json
  {
    "currentPassword": "admin123",
    "newPassword": "your-new-password"
  }
  ```

## 📱 Phone Number

**মনে রাখবেন**: Phone number হল primary key, তাই এটি change করা যাবে না। Login করার জন্য phone number ব্যবহার করতে হবে, email নয়।

