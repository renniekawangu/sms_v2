# Photo to PDF Converter - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         HomeworkSubmission.jsx Component                │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Drag-Drop Upload Area / File Input               │  │   │
│  │  │  ↓                                                 │  │   │
│  │  │  File Validation (isImageFile/isPdfFile)          │  │   │
│  │  │  ↓                                                 │  │   │
│  │  │  photoPdfConverter.js                             │  │   │
│  │  │  ├─ convertImageToPdf()                           │  │   │
│  │  │  ├─ convertMultipleImagesToPdf()                  │  │   │
│  │  │  └─ formatFileSize()                              │  │   │
│  │  │  ↓                                                 │  │   │
│  │  │  Preview & Download PDF                           │  │   │
│  │  │  ↓                                                 │  │   │
│  │  │  FormData Creation (with PDF blob)                │  │   │
│  │  │  ↓                                                 │  │   │
│  │  │  homeworkApi.submitWithFiles()                    │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                  (FormData + PDF Blob)
                  (Authentication Headers)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/homework/:id/submit                                   │
│  │                                                               │
│  ├─ Multer Middleware                                            │
│  │  ├─ Parse FormData                                            │
│  │  ├─ Extract files from body                                   │
│  │  └─ Store in memory buffer                                    │
│  │                                                               │
│  ├─ Authentication Check (requireAuth)                           │
│  │  └─ Verify Bearer token                                       │
│  │                                                               │
│  ├─ Authorization Check (requireRole STUDENT)                    │
│  │  └─ Ensure user is a student                                  │
│  │                                                               │
│  ├─ File Processing (fileUpload.js)                              │
│  │  ├─ processUploadedFiles()                                    │
│  │  ├─ validateFileType() → MIME check                           │
│  │  ├─ validateFileSize() → 50MB check                           │
│  │  ├─ generateUniqueFilename()                                  │
│  │  │  └─ Format: {name}_{timestamp}_{hash}.{ext}               │
│  │  ├─ ensureUploadDirs()                                        │
│  │  │  └─ Create: uploads/homework/submissions/                  │
│  │  └─ saveUploadedFile()                                        │
│  │     └─ Write to disk + return file info                       │
│  │                                                               │
│  ├─ Database Operations (MongoDB)                                │
│  │  ├─ Find homework by ID                                       │
│  │  ├─ Find/create student submission                            │
│  │  ├─ Add attachments metadata:                                 │
│  │  │  ├─ name: original filename                                │
│  │  │  ├─ filename: unique filename                              │
│  │  │  ├─ url: /uploads/homework/submissions/...                 │
│  │  │  ├─ size: file size in bytes                               │
│  │  │  └─ uploadedAt: timestamp                                  │
│  │  ├─ Update submission status to "submitted"                   │
│  │  └─ Save homework document                                    │
│  │                                                               │
│  └─ Response (200 OK)                                            │
│     ├─ message: "Homework submitted successfully"                │
│     ├─ homework: { ... updated homework ... }                    │
│     └─ submission: { ... with attachments ... }                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                         JSON
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FILE SYSTEM (Server)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  uploads/                                                         │
│  └─ homework/                                                     │
│     ├─ submissions/                                               │
│     │  ├─ homework_1674123456_abc123.pdf                          │
│     │  ├─ assignment_1674123457_def456.pdf                        │
│     │  └─ math_1674123458_ghi789.pdf                              │
│     └─ ...                                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

                         And/Or

┌─────────────────────────────────────────────────────────────────┐
│                     MONGODB DATABASE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Homework Collection                                              │
│  ├─ _id: ObjectId                                                │
│  ├─ title: "Math Assignment"                                     │
│  ├─ classroomId: ObjectId                                        │
│  ├─ submissions: [                                               │
│  │  {                                                            │
│  │    student: ObjectId,                                         │
│  │    status: "submitted",                                       │
│  │    submissionDate: Date,                                      │
│  │    attachments: [                                             │
│  │      {                                                        │
│  │        name: "homework.pdf",                                  │
│  │        filename: "homework_1674123456_abc123.pdf",            │
│  │        url: "/uploads/homework/submissions/...",              │
│  │        size: 2500000,                                         │
│  │        uploadedAt: Date                                       │
│  │      }                                                        │
│  │    ]                                                          │
│  │  }                                                            │
│  │]                                                              │
│  └─ ...                                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Student Submission Flow

```
START
  │
  ├─→ [1] Student opens homework page
  │      └─→ HomeworkSubmission component rendered
  │
  ├─→ [2] Student selects file(s)
  │      └─→ Browser file picker opened
  │
  ├─→ [3] File selected
  │      └─→ onChange handler triggered
  │         ├─ Validate file type → IMAGE ✓
  │         ├─ Validate file size → < 50MB ✓
  │         └─ Store in selectedFiles state
  │
  ├─→ [4] Auto-detect image → Trigger conversion
  │      └─→ convertImageToPdf() OR
  │         convertMultipleImagesToPdf()
  │
  ├─→ [5] Image Processing (Client-Side)
  │      ├─ Read file as DataURL (FileReader)
  │      ├─ Create Image object
  │      ├─ Load image dimensions
  │      ├─ Create jsPDF instance
  │      ├─ Add image to PDF
  │      ├─ Generate PDF blob
  │      └─ Store in convertedPdf state
  │
  ├─→ [6] Display Preview
  │      ├─ Show converted PDF filename
  │      ├─ Show file size
  │      └─ Option to download preview
  │
  ├─→ [7] User clicks "Submit"
  │      └─ handleSubmit() called
  │         ├─ Create FormData
  │         ├─ Append PDF file
  │         └─ Call homeworkApi.submitWithFiles()
  │
  ├─→ [8] Upload to Server
  │      ├─ POST /api/homework/:id/submit
  │      ├─ Multipart/form-data
  │      ├─ Bearer token in headers
  │      └─ PDF blob sent
  │
  ├─→ [9] Server Receives & Validates
  │      ├─ Multer extracts file from body
  │      ├─ Auth check → Token valid ✓
  │      ├─ Role check → Student ✓
  │      ├─ File MIME type check → PDF ✓
  │      ├─ File size check → < 50MB ✓
  │      └─ Continue to processing
  │
  ├─→ [10] File Processing
  │       ├─ Generate unique filename
  │       │  └─ Format: {name}_{timestamp}_{hash}.pdf
  │       ├─ Create upload directory if needed
  │       ├─ Write file to disk
  │       │  └─ uploads/homework/submissions/...
  │       └─ Return file info object
  │
  ├─→ [11] Database Update
  │       ├─ Find homework by ID
  │       ├─ Find/create student submission
  │       ├─ Add attachment metadata
  │       ├─ Set submission status = "submitted"
  │       ├─ Save homework document
  │       └─ Populate references (student, teacher)
  │
  ├─→ [12] Response Sent
  │       └─ 200 OK with:
  │          ├─ message: "Success"
  │          ├─ homework: {...}
  │          └─ submission: {...with attachments...}
  │
  ├─→ [13] Frontend Handles Response
  │       ├─ Show success toast
  │       ├─ Clear form
  │       ├─ Call onSubmitSuccess()
  │       └─ Reset UI state
  │
  └─→ END: File stored, DB updated, UI refreshed
```

## File Upload Security Flow

```
┌─────────────────────────────────────────┐
│         SECURITY CHECKPOINT             │
├─────────────────────────────────────────┤
│                                         │
│ [1] FILE SELECTION                      │
│     ├─ isImageFile() validation         │
│     ├─ isPdfFile() validation           │
│     └─ Reject unknown types ❌          │
│                                         │
│ [2] FILE SIZE CHECK (Client)            │
│     ├─ file.size > 50MB? ❌ Reject      │
│     └─ file.size ≤ 50MB? ✓ Allow        │
│                                         │
│ [3] IMAGE TO PDF CONVERSION             │
│     ├─ FileReader reads file            │
│     ├─ Image object created             │
│     ├─ Dimensions extracted             │
│     ├─ jsPDF generates PDF              │
│     └─ Blob created                     │
│                                         │
│ [4] FILE UPLOAD (Server)                │
│     ├─ Multer extracts from body        │
│     ├─ Format check ✓                   │
│     └─ Size limit check ✓               │
│                                         │
│ [5] AUTHENTICATION                      │
│     ├─ Bearer token extracted           │
│     ├─ JWT verified ✓                   │
│     ├─ User ID extracted                │
│     └─ User not found? ❌ 401            │
│                                         │
│ [6] AUTHORIZATION                       │
│     ├─ User role checked                │
│     ├─ Role == 'student'? ✓             │
│     ├─ Role != 'student'? ❌ 403        │
│     └─ Student can submit homework ✓    │
│                                         │
│ [7] FILE VALIDATION (Backend)           │
│     ├─ MIME type in whitelist? ✓        │
│     ├─ File size ≤ 50MB? ✓              │
│     ├─ File extension valid? ✓          │
│     └─ Any check fails? ❌ 400          │
│                                         │
│ [8] FILENAME GENERATION                 │
│     ├─ Original filename kept           │
│     ├─ Timestamp added                  │
│     ├─ Crypto hash added                │
│     ├─ New format: {original}_{ts}_{h}  │
│     └─ Prevents overwrites ✓            │
│                                         │
│ [9] DIRECTORY CREATION                  │
│     ├─ Check uploads/ exists            │
│     ├─ Create if missing                │
│     ├─ Check homework/ exists           │
│     ├─ Create if missing                │
│     ├─ Check submissions/ exists        │
│     ├─ Create if missing                │
│     └─ All directories ready ✓          │
│                                         │
│ [10] FILE WRITE                         │
│      ├─ Write file to disk              │
│      ├─ File system write successful? ✓ │
│      ├─ Write failed? ❌ 500            │
│      └─ File persisted ✓                │
│                                         │
│ [11] DATABASE SAVE                      │
│      ├─ Attachment metadata created     │
│      ├─ Submission record updated       │
│      ├─ Document saved ✓                │
│      └─ DB save failed? ❌ 500          │
│                                         │
│ [12] RESPONSE                           │
│      ├─ All checks passed ✓             │
│      ├─ 200 OK with data                │
│      ├─ File URL included               │
│      └─ Client notified ✓               │
│                                         │
└─────────────────────────────────────────┘
```

## Conversion Timeline

```
Timeline for Single Image → PDF Conversion

Time    Event                           Component
────────────────────────────────────────────────────────────────
0ms     User selects image file         Browser File Input
        
5ms     handleFileSelect() called       HomeworkSubmission
        File validation runs            photoPdfConverter
        
10ms    Image passes validation ✓
        Auto-convert triggered          
        
50ms    FileReader reads file           FileReader API
        
100ms   Image object created            Image constructor
        Image.onload triggered          
        
200ms   Dimensions extracted            Image properties
        jsPDF instance created          jsPDF
        
250ms   Image added to PDF              pdf.addImage()
        
300ms   PDF blob generated              pdf.output('blob')
        
350ms   Blob stored in state            React setState
        UI updated with preview         
        
400ms   User sees "Ready to Submit"     Component render
        Download button available       
        
        ≈400ms total for single image
```

## Component Dependencies

```
HomeworkSubmission.jsx
├── Imports
│   ├── React (useState, useRef)
│   ├── Lucide Icons (Upload, Image, FileText, X, Check, AlertCircle)
│   ├── useToast hook
│   ├── useAuth hook
│   ├── homeworkApi service
│   ├── photoPdfConverter utilities
│   └── TailwindCSS classes
│
└── State Management
    ├── selectedFiles (File[])
    ├── convertedPdf (blob + metadata)
    ├── isConverting (boolean)
    ├── submitting (boolean)
    └── showPreview (boolean)

photoPdfConverter.js
├── jsPDF library
├── FileReader API
├── Blob API
├── Canvas API (for image processing)
└── Exports utility functions

fileUpload.js (Backend)
├── File System (fs module)
├── Path utilities
├── Crypto (for hash generation)
└── Exports utility functions

homework-api.js (Backend)
├── multer middleware
├── fileUpload utilities
├── MongoDB operations
└── Express routing
```

## Error Handling Flow

```
Error Scenario                      → Handling
───────────────────────────────────────────────────────────────

User uploads unsupported format      → Validation fails
  ↓
showError("File must be image/PDF")
  ↓
File rejected, removed from list
───────────────────────────────────────────────────────────────

User uploads 60MB file               → Size validation fails
  ↓
showError("File too large (max 50MB)")
  ↓
File rejected, removed from list
───────────────────────────────────────────────────────────────

Conversion fails (corrupt image)      → Try-catch in converter
  ↓
showError("Conversion failed: ...")
  ↓
convertedPdf remains null
  ↓
User can retry or remove file
───────────────────────────────────────────────────────────────

Network error on upload              → Fetch error
  ↓
showError("Submission failed: ...")
  ↓
submitting state reset
  ↓
User can retry submission
───────────────────────────────────────────────────────────────

Server validation fails (backend)     → HTTP error response
  ↓
API returns 400/500 with error
  ↓
homeworkApi.submitWithFiles throws
  ↓
Caught in try-catch
  ↓
showError("Submission failed: ...")
─────────────────────────────────────────────────────────────

Authentication failed (no token)      → 401 Unauthorized
  ↓
API check fails in middleware
  ↓
showError("Authentication failed")
  ↓
User redirected to login
───────────────────────────────────────────────────────────────

Authorization failed (not student)    → 403 Forbidden
  ↓
Role check fails in middleware
  ↓
showError("Not authorized")
  ↓
User cannot submit homework
```

---

**Architecture Documentation**
**Version**: 1.0.0
**Last Updated**: January 22, 2026
