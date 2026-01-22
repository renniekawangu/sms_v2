# Photo to PDF Converter - Deployment Checklist

## Pre-Deployment Testing

### Frontend Unit Tests
- [ ] **Single Image Conversion**
  - [ ] JPEG image → PDF (portrait orientation)
  - [ ] JPEG image → PDF (landscape orientation)
  - [ ] PNG image → PDF with transparency
  - [ ] GIF image → PDF
  - [ ] WebP image → PDF

- [ ] **Multiple Image Conversion**
  - [ ] 2 images → combined PDF
  - [ ] 5 images → combined PDF (multi-page)
  - [ ] Mix of orientations → combined PDF
  - [ ] Large images → proper sizing in PDF

- [ ] **File Validation**
  - [ ] Correct MIME types accepted
  - [ ] Incorrect MIME types rejected
  - [ ] File size < 50MB accepted
  - [ ] File size > 50MB rejected
  - [ ] 0 files selected → form disabled

- [ ] **PDF Preview**
  - [ ] PDF displays correctly
  - [ ] Download button works
  - [ ] File size shown correctly
  - [ ] File name displayed

- [ ] **Error Handling**
  - [ ] Corrupt image → error message
  - [ ] Network error → retry prompt
  - [ ] Form submission error → error shown
  - [ ] Success → toast notification

### Frontend Integration Tests
- [ ] **Component Integration**
  - [ ] HomeworkSubmission imports correctly
  - [ ] Uses photoPdfConverter correctly
  - [ ] Calls homeworkApi.submitWithFiles()
  - [ ] Handles auth token correctly

- [ ] **API Integration**
  - [ ] FormData created correctly
  - [ ] PDF blob attached correctly
  - [ ] Auth headers included
  - [ ] Response parsed correctly

- [ ] **User Workflow**
  - [ ] Select files → auto convert
  - [ ] Download preview works
  - [ ] Submit button functional
  - [ ] Submission succeeds
  - [ ] Form clears after submit
  - [ ] Success message shown

- [ ] **Mobile Responsive**
  - [ ] Mobile (320px): upload area visible
  - [ ] Mobile (320px): buttons functional
  - [ ] Tablet (768px): proper spacing
  - [ ] Desktop (1024px): full layout
  - [ ] Drop zone responsive
  - [ ] Preview responsive

### Backend Unit Tests
- [ ] **File Upload Utilities**
  - [ ] ensureUploadDirs() creates directories
  - [ ] generateUniqueFilename() creates unique names
  - [ ] validateFileSize() rejects large files
  - [ ] validateFileType() validates MIME types
  - [ ] saveUploadedFile() saves to disk
  - [ ] saveUploadedFile() returns correct metadata

- [ ] **Filename Generation**
  - [ ] Original name preserved
  - [ ] Timestamp included
  - [ ] Hash included
  - [ ] Extension preserved
  - [ ] No directory traversal possible
  - [ ] No duplicate filenames

- [ ] **Directory Management**
  - [ ] uploads/ created if missing
  - [ ] homework/ created if missing
  - [ ] submissions/ created if missing
  - [ ] Correct permissions set
  - [ ] Path is secure (no ../)

### Backend Integration Tests
- [ ] **Multer Integration**
  - [ ] File extracted from FormData
  - [ ] File size limit enforced (50MB)
  - [ ] MIME type filtered correctly
  - [ ] Memory storage working

- [ ] **Authentication Middleware**
  - [ ] Invalid token → 401
  - [ ] Missing token → 401 (if required)
  - [ ] Valid token → continues

- [ ] **Authorization Middleware**
  - [ ] Non-student → 403
  - [ ] Student → allowed

- [ ] **API Endpoint (POST /api/homework/:id/submit)**
  - [ ] Accepts file upload
  - [ ] Processes single file
  - [ ] Processes multiple files
  - [ ] Rejects invalid file types
  - [ ] Rejects oversized files
  - [ ] Returns 200 with data
  - [ ] Returns appropriate error codes

### Database Tests
- [ ] **Homework Model**
  - [ ] Submission document created
  - [ ] Attachment metadata stored
  - [ ] All fields saved correctly
  - [ ] References populated

- [ ] **Attachment Metadata**
  - [ ] name field correct
  - [ ] filename field correct
  - [ ] url field correct
  - [ ] size field correct
  - [ ] uploadedAt timestamp correct

- [ ] **Submission Status**
  - [ ] Status set to "submitted"
  - [ ] Timestamp recorded
  - [ ] Student ID linked

### File System Tests
- [ ] **File Storage**
  - [ ] File written to correct location
  - [ ] File readable
  - [ ] File permissions correct
  - [ ] File size correct

- [ ] **File Retrieval**
  - [ ] URL accessible
  - [ ] File served correctly
  - [ ] Content-Type correct
  - [ ] Download works

- [ ] **File Security**
  - [ ] Non-authenticated users cannot access
  - [ ] Unauthorized students cannot access other submissions
  - [ ] Teachers can access submissions
  - [ ] Admin can access all files

---

## Deployment Steps

### 1. Pre-Deployment Setup
```bash
# [ ] Verify all code is committed
git status

# [ ] Run linter
npm run lint

# [ ] Run tests (if any)
npm run test

# [ ] Build frontend
npm run build
```

### 2. Deploy to Staging
```bash
# [ ] Deploy backend changes
# [ ] Deploy frontend build
# [ ] Run database migrations (if any)
# [ ] Verify uploads/ directory writable
# [ ] Check disk space sufficient
```

### 3. Staging Verification
- [ ] All frontend unit tests pass
- [ ] All backend unit tests pass
- [ ] All integration tests pass
- [ ] Mobile responsive verified
- [ ] File uploads working
- [ ] Database storage working
- [ ] API responses correct

### 4. Deploy to Production
```bash
# [ ] Backup database
# [ ] Tag release version
git tag -a v1.0.0 -m "Add photo-to-PDF converter"
git push origin v1.0.0

# [ ] Deploy code
# [ ] Verify deployment
# [ ] Monitor logs
```

### 5. Post-Deployment Monitoring
- [ ] Monitor error logs (first 24 hours)
- [ ] Monitor upload success rate
- [ ] Monitor file storage growth
- [ ] Check server disk space
- [ ] Monitor user feedback
- [ ] Performance metrics normal

---

## Rollback Plan

If deployment fails or issues arise:

```bash
# [ ] Identify issue (check logs)
# [ ] Create hotfix branch
git checkout -b hotfix/issue-name

# [ ] Fix issue
# [ ] Test fix locally
# [ ] Merge to main
git merge hotfix/issue-name

# [ ] Revert if needed
git revert <commit-hash>

# [ ] Redeploy
```

### Known Issues & Resolutions
| Issue | Solution | Status |
|-------|----------|--------|
| PDF conversion fails on large images | Reduce image dimensions before conversion | ✓ Implemented |
| File upload timeout on slow networks | Increase timeout in frontend | ✓ Configurable |
| Disk space full | Implement file cleanup script | ⚠ Optional |
| CORS issues on static files | Configure proper headers | ✓ Implemented |

---

## Production Configuration

### Environment Variables
```bash
# Backend .env
UPLOAD_DIR=/home/app/uploads
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/gif,image/webp
```

### Nginx Configuration (if using)
```nginx
# Serve uploaded files
location /uploads {
    alias /home/app/uploads;
    try_files $uri =404;
}

# Limit upload size
client_max_body_size 50M;
```

### MongoDB Indexes
```javascript
// Create index for faster queries
db.homeworks.createIndex({ "submissions.student": 1 });
db.homeworks.createIndex({ "submissions.status": 1 });
```

### File Storage Optimization
```bash
# Create directory with correct permissions
mkdir -p /home/app/uploads/homework/submissions
chmod 755 /home/app/uploads
chmod 755 /home/app/uploads/homework
chmod 755 /home/app/uploads/homework/submissions

# Monitor disk usage
du -sh /home/app/uploads/
```

---

## Maintenance Tasks

### Weekly
- [ ] Check disk space usage
- [ ] Review error logs
- [ ] Monitor user feedback

### Monthly
- [ ] Backup upload files
- [ ] Clean up orphaned files
- [ ] Review file size statistics
- [ ] Test disaster recovery

### Quarterly
- [ ] Update dependencies
- [ ] Review security
- [ ] Performance optimization
- [ ] User acceptance testing

### Annually
- [ ] Full audit
- [ ] Archive old files
- [ ] Plan capacity
- [ ] Update documentation

---

## Performance Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Image → PDF conversion time | < 500ms | — |
| File upload speed | > 5 Mbps | — |
| API response time | < 1s | — |
| Successful submission rate | > 99% | — |
| Server disk utilization | < 80% | — |
| CPU usage during upload | < 50% | — |
| Memory usage peak | < 500MB | — |

---

## Support & Documentation

### User Documentation
- [ ] Deployment guide created ✓
- [ ] Quick start guide created ✓
- [ ] Troubleshooting guide created ✓
- [ ] Architecture documentation created ✓

### Developer Documentation
- [ ] Code comments complete
- [ ] API documentation complete
- [ ] Component documentation complete
- [ ] Utility function documentation complete

### Support Plan
- [ ] Error message help text complete
- [ ] FAQ prepared
- [ ] Support contact information provided
- [ ] Escalation path defined

---

**Last Updated**: January 22, 2026
**Version**: 1.0.0
**Status**: Ready for Deployment ✓
