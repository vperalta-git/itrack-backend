# Utilities Folder

This folder contains utility scripts for I-Track backend maintenance and data management.

## Available Utilities

### User Management

- **`add-admin-user.js`** - Creates admin users in the database
- **`migrate-users.js`** - Migrates user data between database versions
- **`normalize-users.js`** - Normalizes and cleans user data

### Data Management

- **`add-gps-data.js`** - Adds GPS coordinates to vehicle records
- **`update-allocations-real-destinations.js`** - Updates driver allocations with real destination data

### Communication

- **`sendSms.js`** - SMS utility functions for notifications

## Usage

Run any utility from the backend root directory:

```bash
cd itrack-backend
node utils/add-admin-user.js
```

## Database Connection

All utilities use the MongoDB connection string from the main server configuration. Make sure the database is accessible before running any utility.

## Safety

⚠️ **Warning**: These utilities modify database data. Always backup your database before running any utility scripts.
