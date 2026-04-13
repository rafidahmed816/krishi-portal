# AWS Cognito Setup Guide — AgroLink (Learner Lab)

This guide walks you through setting up **AWS Cognito** on **AWS Academy Learner Lab** for the AgroLink authentication system (Farmer, Buyer, Admin).

---

## Table of Contents

1. [Start the Learner Lab](#1-start-the-learner-lab)
2. [Create a Cognito User Pool](#2-create-a-cognito-user-pool)
3. [Configure Custom Attributes](#3-configure-custom-attributes)
4. [Create an App Client](#4-create-an-app-client)
5. [Create User Groups](#5-create-user-groups)
6. [Get Your Credentials](#6-get-your-credentials)
7. [Configure the `.env` File](#7-configure-the-env-file)
8. [EC2 Deployment (Optional)](#8-ec2-deployment-optional)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Start the Learner Lab

1. Go to **AWS Academy** → **Learner Lab**.
2. Click **Start Lab** and wait for the status to turn green ✅.
3. Click **AWS** (the console link) to open the AWS Management Console.

> ⚠️ **Important**: Learner Lab sessions last ~4 hours. Your resources persist between sessions, but **credentials rotate** each time you restart. You'll need to update your `.env` with fresh credentials after each restart.

---

## 2. Create a Cognito User Pool

1. In the AWS Console, search for **Cognito** and open it.
2. Click **Create user pool**.

### Step 1: Sign-in Experience
- **Authentication providers**: Cognito user pool
- **Cognito user pool sign-in options**: ✅ **Email**
- Click **Next**

### Step 2: Security Requirements
- **Password policy**: Cognito defaults (minimum 8 characters, uppercase, lowercase, number, special character)
- **MFA**: No MFA (for simplicity in development)
- Click **Next**

### Step 3: Sign-up Experience
- **Self-registration**: ✅ Enable
- **Attribute verification**: ✅ Email
- **Required attributes**: `email`, `name`
- Click **Next**

### Step 4: Message Delivery
- **Email provider**: Send email with **Cognito** (easiest for Learner Lab)
- Click **Next**

### Step 5: App Integration
- **User pool name**: `agrolink-user-pool`
- **App type**: **Public client**
- **App client name**: `agrolink-web-client`
- **Authentication flows**: ✅ `ALLOW_USER_PASSWORD_AUTH` (critical!)
- **Client secret**: **Don't generate a client secret**
- Click **Next** → **Create user pool**

---

## 3. Configure Custom Attributes

After creating the user pool:

1. Go to your user pool → **Sign-up experience** tab.
2. Scroll to **Custom attributes** → Click **Add custom attribute**.
3. Add these attributes:

| Name          | Type   | Min Length | Max Length | Mutable |
|:------------- |:------ | ----------:| ----------:|:------- |
| `user_type`   | String | 1          | 20         | ✅ Yes  |
| `farm_name`   | String | 0          | 100        | ✅ Yes  |
| `business_name`| String | 0          | 100        | ✅ Yes  |

4. Click **Save changes**.

---

## 4. Create an App Client

If you didn't create one during pool creation:

1. Go to **App integration** tab → **App clients and analytics**.
2. Click **Create app client**.
3. Settings:
   - **App type**: Public client
   - **Client name**: `agrolink-web-client`
   - **Authentication flows**: ✅ `ALLOW_USER_PASSWORD_AUTH`
   - **Client secret**: Don't generate
4. Click **Create app client**.

📝 **Copy the Client ID** — you'll need it for the `.env` file.

---

## 5. Create User Groups

1. Go to your user pool → **Groups** tab.
2. Click **Create group** three times to create:

| Group Name | Description               |
|:---------- |:------------------------- |
| `farmers`  | Farmer accounts           |
| `buyers`   | Buyer accounts            |
| `admins`   | Administrator accounts    |

---

## 6. Get Your Credentials

### User Pool ID & Client ID

1. Go to your user pool → **User pool overview**.
2. Copy the **User pool ID** (format: `us-east-1_XXXXXXXXX`).
3. Go to **App integration** → **App clients** → copy the **Client ID**.

### AWS Access Keys (Learner Lab)

1. In the Learner Lab page, click **AWS Details**.
2. Click **Show** next to **AWS CLI**.
3. You'll see:
   ```
   [default]
   aws_access_key_id=ASIA...
   aws_secret_access_key=...
   aws_session_token=...
   ```
4. Copy all three values.

> ⚠️ These credentials change every time you restart
> the lab. Update your `.env` file each session.

---

## 7. Configure the `.env` File

Create a `.env` file in the project root (`/home/muntasir/project/agrolink/.env`):

```env
# ── AWS Credentials (from Learner Lab "AWS Details") ──
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=ASIA...your_key...
AWS_SECRET_ACCESS_KEY=...your_secret...
AWS_SESSION_TOKEN=...your_token...

# ── Cognito ──
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Frontend (prefix with NEXT_PUBLIC_) ──
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1

# ── Database (future) ──
DATABASE_URL=postgresql://postgres:password@localhost:5432/agrolink
```

---

## 8. EC2 Deployment (Optional)

If you want to deploy the backend on an EC2 instance in Learner Lab:

### Launch an EC2 Instance

1. Go to **EC2** → **Launch instance**.
2. Settings:
   - **Name**: `agrolink-api`
   - **AMI**: Amazon Linux 2023 or Ubuntu 22.04
   - **Instance type**: `t2.micro` (free tier)
   - **Key pair**: Create new → download `.pem` file
   - **Security group**: Allow **SSH (22)**, **HTTP (80)**, **Custom TCP (8000)**

### Set Up the Server

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@<public-ip>

# Install Python
sudo yum install python3 python3-pip git -y    # Amazon Linux
# OR
sudo apt update && sudo apt install python3 python3-pip python3-venv git -y   # Ubuntu

# Clone your repo
git clone https://github.com/rafidahmed816/krishi-portal.git
cd krishi-portal/backend

# Set up virtualenv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
nano ../.env    # paste your credentials

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Update Frontend `.env`

```env
NEXT_PUBLIC_API_URL=http://<ec2-public-ip>:8000
```

---

## 9. Troubleshooting

| Problem                              | Solution                                                              |
|:-------------------------------------|:----------------------------------------------------------------------|
| `NotAuthorizedException`             | Wrong password, or credentials expired. Re-copy from Learner Lab.     |
| `InvalidParameterException`          | Check custom attributes match exactly (`custom:user_type`).           |
| `UserNotFoundException`              | Email not registered. Check for typos.                                |
| `UserNotConfirmedException`          | User hasn't confirmed email. Redirect to `/verify`.                   |
| `ResourceNotFoundException`          | Wrong User Pool ID or Client ID in `.env`.                            |
| CORS errors in browser               | Make sure backend CORS allows `http://localhost:3000`.                 |
| `ExpiredTokenException`              | Learner Lab session expired. Restart lab and update credentials.      |
| `ALLOW_USER_PASSWORD_AUTH` not found | Go to App Client → edit → enable `ALLOW_USER_PASSWORD_AUTH`.          |

---

## Quick Reference

| Resource           | Where to Find                                  |
|:-------------------|:-----------------------------------------------|
| Cognito Console    | `AWS Console → Cognito → User Pools`          |
| User Pool ID       | User pool overview page                        |
| App Client ID      | App integration → App clients                  |
| AWS Credentials    | Learner Lab → AWS Details → Show → AWS CLI     |
| EC2 Public IP      | EC2 → Instances → select instance → Public IP  |
