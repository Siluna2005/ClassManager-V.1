// ============================================
// SETTINGS.JS - UPDATED WITH MATCHING DESIGN
// Grades section now matches Classes section design
// ============================================

// SETTINGS
function loadSettings() {    
    // Load subject name    
    document.getElementById('subjectNameInput').value = appData.subjectName;    
    document.getElementById('subjectDisplay').textContent = 'Subject: ' + appData.subjectName;

    // ⭐ UPDATED: Load grades list with new badge-style design
    const list = document.getElementById('gradesList');    
    list.innerHTML = appData.grades.map(g => `
        <div class="grade-badge">
            <span>Grade ${g}</span>
            <button class="btn-icon-small" onclick="deleteGrade('${g}')" title="Remove grade">
                ×
            </button>
        </div>
    `).join('');

    // Update last saved time    
    updateLastSavedTime();

    // Update last backup time    
    const lastBackup = localStorage.getItem('lastBackupTime');    
    const backupTimeEl = document.getElementById('lastBackupTime');    
    if (backupTimeEl) {        
        backupTimeEl.textContent = lastBackup || 'Never';    
    }

    // Update data statistics    
    updateDataStatistics();

    // ⭐ NEW: Load class settings
    if (typeof loadClassSettings === 'function') {
        loadClassSettings();
    }
    
    // ⭐ NEW: Check if class assignment popup needed
    if (typeof checkClassAssignmentNeeded === 'function') {
        checkClassAssignmentNeeded();
    }
    
    // Only call if functions exist    
    if (typeof updateLastSyncTimeDisplay === 'function') {        
        updateLastSyncTimeDisplay();                
    }

    if (typeof updateSyncStats === 'function') {
        updateSyncStats();
    }
}

function addGrade() {
    const newGrade = document.getElementById('newGrade').value.trim();
    
    if (!newGrade) {
        alert('⚠️ Please enter a grade number');
        return;
    }
    
    if (appData.grades.includes(newGrade)) {
        alert('⚠️ Grade already exists');
        return;
    }
    
    appData.grades.push(newGrade);
    appData.grades.sort();
    saveData();
    populateGradeDropdowns();
    loadSettings();
    document.getElementById('newGrade').value = '';
    alert('✅ Grade added successfully!');
}

function deleteGrade(grade) {
    const hasStudents = appData.students.some(s => s.grade === grade);
    const hasTimetable = appData.timetable.some(t => t.grade === grade);
    
    if (hasStudents) {
        const count = appData.students.filter(s => s.grade === grade).length;
        alert(`❌ Cannot Remove Grade ${grade}\n\n${count} student(s) are assigned to this grade.\n\nPlease reassign these students to another grade first.`);
        return;
    }
    
    if (hasTimetable) {
        const count = appData.timetable.filter(t => t.grade === grade).length;
        alert(`❌ Cannot Remove Grade ${grade}\n\n${count} timetable entry(ies) are assigned to this grade.\n\nPlease remove or update these timetable entries first.`);
        return;
    }
    
    if (!confirm(`Remove Grade ${grade}?\n\nThis action cannot be undone.`)) return;
    
    appData.grades = appData.grades.filter(g => g !== grade);
    saveData();
    populateGradeDropdowns();
    loadSettings();
    alert(`✅ Grade ${grade} removed successfully!`);
}

function saveSubject() {
    const subject = document.getElementById('subjectNameInput').value.trim();
    
    if (!subject) {
        alert('Enter subject name');
        return;
    }
    
    appData.subjectName = subject;
    saveData();
    document.getElementById('subjectDisplay').textContent = 'Subject: ' + subject;
    alert('Subject saved!');
}

function backupData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    const now = new Date().toLocaleString();
    localStorage.setItem('lastBackup', now);
    document.getElementById('lastBackup').textContent = now;
    alert('Backup downloaded!');
}

// ============================================
// UPDATE DATA STATISTICS
// ============================================

function updateDataStatistics() {
    // Update statistics display
    const studentsCount = appData.students?.length || 0;
    const paymentsCount = appData.payments?.length || 0;
    const classesCount = appData.timetable?.length || 0;
    
    // Calculate attendance records
    let attendanceCount = 0;
    if (appData.attendance) {
        Object.keys(appData.attendance).forEach(classId => {
            if (appData.attendance[classId]) {
                attendanceCount += Object.keys(appData.attendance[classId]).length;
            }
        });
    }
    
    // Update UI elements
    const statsStudents = document.getElementById('statsStudents');
    const statsPayments = document.getElementById('statsPayments');
    const statsTimetable = document.getElementById('statsTimetable');
    const statsAttendance = document.getElementById('statsAttendance');
    
    if (statsStudents) statsStudents.textContent = studentsCount;
    if (statsPayments) statsPayments.textContent = paymentsCount;
    if (statsTimetable) statsTimetable.textContent = classesCount;
    if (statsAttendance) statsAttendance.textContent = attendanceCount;
    
    console.log('📊 Data statistics updated:', {
        students: studentsCount,
        payments: paymentsCount,
        classes: classesCount,
        attendance: attendanceCount
    });
}

// ============================================
// DOWNLOAD BACKUP
// ============================================

function downloadBackup() {
    console.log('💾 Downloading backup...');
    
    try {
        // Create backup data
        const backupData = {
            ...appData,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // Convert to JSON string
        const dataStr = JSON.stringify(backupData, null, 2);
        
        // Create blob
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with date
        const date = new Date().toISOString().split('T')[0];
        link.download = `class-manager-backup-${date}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        // Update last backup time
        const now = new Date().toLocaleString();
        localStorage.setItem('lastBackupTime', now);
        
        // Update display
        const backupTimeEl = document.getElementById('lastBackupTime');
        if (backupTimeEl) {
            backupTimeEl.textContent = now;
        }
        
        console.log('✅ Backup downloaded successfully');
        alert('✅ Backup downloaded successfully!');
        
    } catch (error) {
        console.error('❌ Error downloading backup:', error);
        alert('❌ Failed to download backup: ' + error.message);
    }
}

// ============================================
// UPLOAD BACKUP
// ============================================

function uploadBackup() {
    console.log('📂 Opening file picker for backup restore...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log('📄 File selected:', file.name);
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                console.log('📖 Reading file...');
                const backupData = JSON.parse(event.target.result);
                
                console.log('✅ Backup file parsed successfully');
                console.log('Backup contains:', Object.keys(backupData));
                
                // Validate backup data
                if (!backupData.students || !Array.isArray(backupData.students)) {
                    throw new Error('Invalid backup file - missing students array');
                }
                
                // Confirm restoration
                const confirm1 = confirm(
                    '⚠️ RESTORE BACKUP?\n\n' +
                    'This will REPLACE all current data with:\n\n' +
                    `Students: ${backupData.students.length}\n` +
                    `Payments: ${backupData.payments?.length || 0}\n` +
                    `Classes: ${backupData.timetable?.length || 0}\n` +
                    `Attendance records: ${Object.keys(backupData.attendance || {}).length}\n\n` +
                    'Current data will be LOST!\n\n' +
                    'Continue?'
                );
                
                if (!confirm1) {
                    console.log('User cancelled restore');
                    return;
                }
                
                const confirm2 = confirm(
                    '⚠️ FINAL CONFIRMATION\n\n' +
                    'Are you ABSOLUTELY SURE?\n\n' +
                    'This cannot be undone!'
                );
                
                if (!confirm2) {
                    console.log('User cancelled restore (final confirmation)');
                    return;
                }
                
                console.log('🔄 Restoring backup data...');
                
                // Restore data
                appData.students = backupData.students || [];
                appData.payments = backupData.payments || [];
                appData.timetable = backupData.timetable || [];
                appData.attendance = backupData.attendance || {};
                appData.grades = backupData.grades || appData.grades;
                appData.subjectName = backupData.subjectName || appData.subjectName;
                
                // Save to Firebase
                saveData();
                
                // Update UI
                if (typeof updateDashboard === 'function') {
                    updateDashboard();
                }
                
                loadSettings();
                
                console.log('✅ Backup restored successfully');
                
                alert(
                    '✅ BACKUP RESTORED!\n\n' +
                    'Your data has been restored from the backup.\n\n' +
                    'The page will now reload.'
                );
                
                // Reload page to ensure all UI is updated
                setTimeout(() => {
                    location.reload();
                }, 1000);
                
            } catch (error) {
                console.error('❌ Error restoring backup:', error);
                alert('❌ Failed to restore backup!\n\nError: ' + error.message + '\n\nPlease check the file and try again.');
            }
        };
        
        reader.onerror = (error) => {
            console.error('❌ Error reading file:', error);
            alert('❌ Failed to read backup file!');
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// EXPORT TO EXCEL
// ============================================

function exportAllToExcel() {
    console.log('📊 Exporting all data to Excel...');
    
    try {
        // Check if SheetJS is loaded
        if (typeof XLSX === 'undefined') {
            alert('⚠️ Excel export library not loaded.\n\nPlease refresh the page and try again.');
            return;
        }
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // 1. Students Sheet
        const studentsData = [
            ['ID', 'Name', 'Grade', 'Class', 'Gender', 'Birthday', 'Student Phone', 'Parent Phone'],
            ...appData.students.map(s => [
                s.id,
                s.name,
                s.grade,
                s.class || 'N/A',
                s.gender || 'N/A',
                s.birthday || 'N/A',
                s.studentPhone || 'N/A',
                s.parentPhone || 'N/A'
            ])
        ];
        
        const wsStudents = XLSX.utils.aoa_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');
        
        // 2. Payments Sheet
        const paymentsData = [
            ['Date', 'Student ID', 'Student Name', 'Class', 'Month', 'Amount', 'Status'],
            ...appData.payments.map(p => [
                p.date,
                p.studentId,
                p.studentName,
                p.class,
                p.month,
                p.amount,
                p.status
            ])
        ];
        
        const wsPayments = XLSX.utils.aoa_to_sheet(paymentsData);
        XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');
        
        // 3. Timetable Sheet
        const timetableData = [
            ['Day', 'Time', 'Grade', 'Class', 'Notes'],
            ...appData.timetable.map(t => [
                t.day,
                t.time,
                t.grade,
                t.class || 'N/A',
                t.notes || ''
            ])
        ];
        
        const wsTimetable = XLSX.utils.aoa_to_sheet(timetableData);
        XLSX.utils.book_append_sheet(wb, wsTimetable, 'Timetable');
        
        // 4. Attendance Sheet
        const attendanceData = [['Date', 'Student ID', 'Status']];
        
        Object.keys(appData.attendance).forEach(date => {
            Object.keys(appData.attendance[date]).forEach(studentId => {
                attendanceData.push([
                    date,
                    studentId,
                    appData.attendance[date][studentId]
                ]);
            });
        });
        
        const wsAttendance = XLSX.utils.aoa_to_sheet(attendanceData);
        XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance');
        
        // Download file
        const fileName = `ClassManager_Complete_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        alert('✅ All data exported to Excel!\n\nFile: ' + fileName + '\n\nSheets:\n- Students\n- Payments\n- Timetable\n- Attendance');
    } catch (error) {
        console.error('❌ Export error:', error);
        alert('⚠️ Error exporting data to Excel.');
    }
}

// ============================================
// CLEAR ALL DATA
// ============================================

function clearAllData() {
    if (!confirm('⚠️ DELETE ALL DATA?\n\nThis will permanently delete:\n- All students\n- All payments\n- All attendance records\n- All timetable entries\n\nThis CANNOT be undone!')) {
        return;
    }
    
    if (!confirm('⚠️ Are you ABSOLUTELY SURE?\n\nThis is your last chance to cancel!')) {
        return;
    }
    
    // Clear localStorage
    localStorage.clear();
    
    alert('✅ All data cleared!\n\nThe app will now reload.');
    
    // Reload page
    location.reload();
}

// ============================================
// SYNC NOW - Manual Sync
// ============================================

async function syncNowManual() {
    console.log('🔄 Manual sync triggered by user');
    
    const syncButton = document.getElementById('syncNowButton');
    
    try {
        // Disable button during sync
        if (syncButton) {
            syncButton.disabled = true;
            syncButton.textContent = '⏳ Syncing...';
        }
        
        console.log('📤 Step 1: Uploading local data to Firebase...');
        
        // Safe call to saveData
        if (typeof window.saveData === 'function') {
            await window.saveData();
            console.log('✅ Upload complete');
        } else if (typeof saveData === 'function') {
            await saveData();
            console.log('✅ Upload complete');
        } else {
            throw new Error('saveData function not found');
        }
        
        console.log('📥 Step 2: Downloading latest data from Firebase...');
        
        // Safe call to loadData
        if (typeof window.loadData === 'function') {
            await window.loadData();
            console.log('✅ Download complete');
        } else if (typeof loadData === 'function') {
            await loadData();
            console.log('✅ Download complete');
        } else {
            throw new Error('loadData function not found');
        }
        
        console.log('🔄 Step 3: Updating UI...');
        updateDataStatistics();
        
        // Update last sync time
        const now = new Date().toISOString();
        localStorage.setItem('lastManualSync', now);
        updateLastSyncTimeDisplay();
        
        console.log('✅ Sync complete');
        
        if (syncButton) {
            syncButton.textContent = '✅ Synced!';
            setTimeout(() => {
                syncButton.textContent = '🔄 Sync Now';
                syncButton.disabled = false;
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        
        if (syncButton) {
            syncButton.textContent = '❌ Failed';
            setTimeout(() => {
                syncButton.textContent = '🔄 Sync Now';
                syncButton.disabled = false;
            }, 2000);
        }
        
        alert('❌ Sync failed: ' + error.message);
    }
}

// ============================================
// UPDATE SYNC STATISTICS
// ============================================

function updateSyncStats() {
    // Try to access appData from window scope
    const data = window.appData || (typeof appData !== 'undefined' ? appData : null);
    
    if (data) {
        const studentsCount = document.getElementById('syncStudentsCount');
        const classesCount = document.getElementById('syncClassesCount');
        const paymentsCount = document.getElementById('syncPaymentsCount');
        
        if (studentsCount && data.students) {
            studentsCount.textContent = data.students.length;
        }
        
        if (classesCount && data.timetable) {
            classesCount.textContent = data.timetable.length;
        }
        
        if (paymentsCount && data.payments) {
            paymentsCount.textContent = data.payments.length;
        }
    } else {
        // Silently fail - not critical
        console.debug('appData not yet available');
    }
}

// ============================================
// UPDATE LAST SYNC TIME DISPLAY
// ============================================

function updateLastSyncTimeDisplay() {
    const lastSyncTime = document.getElementById('lastSyncTime');
    if (!lastSyncTime) return;
    
    const lastSync = localStorage.getItem('lastManualSync');
    
    if (lastSync) {
        const syncDate = new Date(lastSync);
        const now = new Date();
        const diffMs = now - syncDate;
        const diffMins = Math.floor(diffMs / 60000);
        
        let timeText;
        
        if (diffMins < 1) {
            timeText = 'Just now';
        } else if (diffMins < 60) {
            timeText = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffMins < 1440) {
            const hours = Math.floor(diffMins / 60);
            timeText = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffMins / 1440);
            if (days === 1) {
                timeText = 'Yesterday';
            } else if (days < 7) {
                timeText = `${days} days ago`;
            } else {
                const timeString = syncDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const dateString = syncDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
                timeText = `${dateString} at ${timeString}`;
            }
        }
        
        lastSyncTime.textContent = timeText;
    } else {
        lastSyncTime.textContent = 'Never';
    }
}

// ============================================
// AUTO-UPDATE LAST SYNC TIME
// ============================================

setInterval(() => {
    if (document.getElementById('lastSyncTime')) {
        updateLastSyncTimeDisplay();
    }
}, 60000); // Every 60 seconds

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

window.updateDataStatistics = updateDataStatistics;
window.downloadBackup = downloadBackup;
window.uploadBackup = uploadBackup;
window.syncNowManual = syncNowManual;
window.updateSyncStats = updateSyncStats;
window.updateLastSyncTimeDisplay = updateLastSyncTimeDisplay;

// ============================================
// INITIALIZE
// ============================================

console.log('✅ Settings.js loaded (with matching grade/class design)');

// Update sync time immediately if elements exist
setTimeout(() => {
    if (document.getElementById('lastSyncTime')) {
        updateLastSyncTimeDisplay();
    }
    if (document.getElementById('syncStudentsCount')) {
        updateSyncStats();
    }
}, 100);
