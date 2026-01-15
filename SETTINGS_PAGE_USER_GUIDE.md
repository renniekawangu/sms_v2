# Settings Page - User Guide

## Purpose
The Settings page (`/settings`) allows school administrators to configure all school-wide settings, including:
- School information
- Academic years and terms
- Fee structures
- School holidays

## How to Access
1. Login as an **Admin** user
2. Navigate to `/settings` or click Settings in the main navigation

## Features

### Tab 1: School Info
Configure basic school information that appears throughout the system.

**Fields**:
- **School Name**: Primary name of the school
- **School Logo**: URL to school logo image
- **Description**: Brief description of the school
- **Phone**: School contact phone number
- **Email**: School contact email address
- **Address**: Full school address
- **Currency**: Currency symbol (e.g., K, $, €)
- **Timezone**: School timezone (e.g., Africa/Lusaka)
- **Language**: Primary language (e.g., en, es, fr)
- **Academic Year Format**: How years are displayed (e.g., "2024" or "2024-2025")

**How to Use**:
1. Edit any fields as needed
2. Click "Save Settings" button
3. Wait for success confirmation toast

### Tab 2: Academic Years
Manage the school's academic years and set which one is currently active.

**How to Create Academic Year**:
1. Click "Add New Year" button
2. Fill in:
   - **Academic Year**: Format like "2024" or "2024-2025"
   - **Start Date**: Calendar start date
   - **End Date**: Calendar end date
   - **Set as Current Year**: Checkbox to make this the active year
3. Click "Create Academic Year"
4. Wait for success confirmation

**How to Set Current Year**:
1. Find the academic year in the list
2. If not marked as "Current", click "Set as Current" button
3. Only one year can be current at a time

**Display**:
- Current year shows a green "Current" badge
- Start and end dates are displayed
- Number of terms (if configured) is shown

### Tab 3: Fee Structures
Define fee structures for each class level and academic year.

**How to Create Fee Structure**:
1. Click "Add New Structure" button
2. Fill in:
   - **Academic Year**: Select from dropdown (populated from Academic Years tab)
   - **Class Level**: Enter class/grade level (e.g., "Grade 1", "Form 3")
3. Click "Create Fee Structure"
4. After creation, you can edit individual fees

**Display**:
- Shows all fee structures organized by class level and year
- Displays total fees and payment terms
- Shows if partial payments are accepted
- Lists individual fees with amounts, due dates, and whether optional

### Tab 4: Holidays
Configure school holidays and breaks that affect attendance.

**How to Create Holiday**:
1. Click "Add Holiday" button
2. Fill in:
   - **Holiday Name**: Name of the holiday/break (e.g., "Christmas Break")
   - **Start Date**: First day of holiday
   - **End Date**: Last day of holiday
   - **Holiday Type**: Select type (School/Public/Exam)
   - **Description**: Optional notes about the holiday
3. Click "Create Holiday"

**Display**:
- Lists all holidays with dates
- Shows holiday type
- Indicates if it affects attendance records
- Displays description if provided

## Important Notes

1. **Permissions**: Only Admin users can modify school settings
2. **Data Validation**: All required fields must be filled before submission
3. **Error Handling**: If an error occurs, an error toast will display the issue
4. **Current Academic Year**: This setting affects where student attendance and grades are recorded
5. **Fee Structures**: Must have an academic year created first before adding fee structures

## Common Tasks

### Start a New Academic Year
1. Go to Academic Years tab
2. Create new year with current dates
3. Check "Set as Current Year"
4. Go to Fee Structures tab and create structure for the new year

### Record a School Holiday
1. Go to Holidays tab
2. Click "Add Holiday"
3. Enter holiday name, dates, and type
4. Click "Create Holiday"

### Update School Contact Info
1. Go to School Info tab
2. Edit Phone, Email, and/or Address fields
3. Click "Save Settings"

### Change Default Currency
1. Go to School Info tab
2. Edit Currency Symbol field
3. Click "Save Settings"
4. Note: This affects fee displays and reports

## Troubleshooting

**"Please fill in all required fields"**: 
- Ensure all fields marked with * are completed

**API Error Messages**:
- Check internet connection
- Ensure you're logged in as an admin
- Check browser console for specific error details

**Changes not saving**:
- Verify you see the success toast notification
- Refresh page to confirm persistence
- Check server logs if issue persists
