        // SETTINGS
        function loadSettings() {    
            // Load subject name    
            document.getElementById('subjectNameInput').value = appData.subjectName;    
            document.getElementById('subjectDisplay').textContent = 'Subject: ' + appData.subjectName;
        
            // Load grades list    
            const list = document.getElementById('gradesList');    
            list.innerHTML = appData.grades.map(g => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #fff;">Grade ${g}</span>
                    <button class="icon-btn icon-btn-red" onclick="deleteGrade('${g}')">🗑️ Remove</button>
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
                alert('Enter grade number');
                return;
            }
            
            if (appData.grades.includes(newGrade)) {
                alert('Grade already exists');
                return;
            }
            
            appData.grades.push(newGrade);
            appData.grades.sort();
            saveData();
            populateGradeDropdowns();
            loadSettings();
            document.getElementById('newGrade').value = '';
            alert('Grade added!');
        }

        function deleteGrade(grade) {
            const hasStudents = appData.students.some(s => s.grade === grade);
            
            if (hasStudents) {
                alert('Cannot delete grade with students');
                return;
            }
            
            if (!confirm(`Delete Grade ${grade}?`)) return;
            
            appData.grades = appData.grades.filter(g => g !== grade);
            saveData();
            populateGradeDropdowns();
            loadSettings();
            alert('Grade deleted!');
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
// 3. DOWNLOAD BACKUP (Add to Settings.js)
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
// 4. UPLOAD BACKUP (Add to Settings.js)
// ============================================

function uploadBackup() {
    console.log('📂 Opening file picker for backup restore...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            console.log('⚠️ No file selected');
            return;
        }
        
        console.log('📄 Reading file:', file.name);
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                console.log('📥 Data parsed successfully');
                
                const confirm = window.confirm(
                    '⚠️ Restore Backup?\n\n' +
                    'This will replace ALL your current data.\n\n' +
                    'Students: ' + (importedData.students?.length || 0) + '\n' +
                    'Classes: ' + (importedData.timetable?.length || 0) + '\n' +
                    'Payments: ' + (importedData.payments?.length || 0) + '\n\n' +
                    'Continue?'
                );
                
                if (!confirm) {
                    console.log('⚠️ Restore cancelled by user');
                    return;
                }
                
                // Update appData
                appData = {
                    ...appData,
                    students: importedData.students || [],
                    timetable: importedData.timetable || [],
                    payments: importedData.payments || [],
                    attendance: importedData.attendance || {},
                    grades: importedData.grades || appData.grades
                };
                
                // ⭐ FIX: Call saveData properly
                const savePromise = typeof window.saveData === 'function' 
                    ? window.saveData() 
                    : (typeof saveData === 'function' ? saveData() : Promise.reject('saveData not found'));
                
                savePromise
                    .then(() => {
                        console.log('✅ Backup restored successfully');
                        alert('✅ Backup restored!\n\nPage will reload.');
                        location.reload();
                    })
                    .catch((error) => {
                        console.error('❌ Error saving restored data:', error);
                        alert('❌ Failed to save: ' + error.message);
                    });
                
            } catch (error) {
                console.error('❌ Error parsing backup file:', error);
                alert('❌ Invalid backup file!');
            }
        };
        
        reader.onerror = (error) => {
            console.error('❌ Error reading file:', error);
            alert('❌ Failed to read file!');
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Export all data to Excel        
function exportAllDataToExcel() {                
    try {                            
        const wb = XLSX.utils.book_new();
                                
        // Sheet 1: Students                        
        const studentsData = [                               
            ['Student ID', 'Name', 'Birthday', 'Gender', 'Class', 'Grade', 'Student Phone', 'Parent Phone']                        
        ];                        
        appData.students.forEach(s => {                                
            studentsData.push([                                        
                s.id,                                                            
                s.name,                                                            
                s.birthday || '',                                                            
                s.gender || '',                                                            
                s.class || '',                                                            
                'Grade ' + s.grade,                                                            
                s.studentPhone || '',                                                                
                s.parentPhone || ''                                                
            ]);                                        
        });                                    
        const wsStudents = XLSX.utils.aoa_to_sheet(studentsData);                                    
        XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');
                                            
        // Sheet 2: Payments                                    
        const paymentsData = [                   
            ['Date', 'Student ID', 'Student Name', 'Grade', 'Month', 'Amount', 'Status']                                   
        ];                        
        (appData.payments || []).forEach(p => {                                
            paymentsData.push([                                        
                p.date,                                        
                p.studentId,                                        
                p.studentName,                                       
                p.class,                                       
                p.month,                                       
                p.amount,                                       
                p.status                               
            ]);                        
        });                        
        const wsPayments = XLSX.utils.aoa_to_sheet(paymentsData);                        
        XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');                
                
        // Sheet 3: Timetable                        
        const timetableData = [                                
            ['Day', 'Time', 'Grade', 'Notes']                                    
        ];                        
        appData.timetable.forEach(t => {                                
            timetableData.push([                        
                t.day,                        
                t.time,                        
                'Grade ' + t.grade,                        
                t.notes || ''                                
            ]);                        
        });                        
        const wsTimetable = XLSX.utils.aoa_to_sheet(timetableData);                        
        XLSX.utils.book_append_sheet(wb, wsTimetable, 'Timetable');
                        
        // Sheet 4: Attendance Summary                        
        const attendanceData = [                    
            ['Date', 'Grade', 'Total Students', 'Present', 'Absent', 'Rate']                        
        ];
                                
        Object.keys(appData.attendance || {}).forEach(date => {                                
            const dayData = appData.attendance[date];                                
            const total = Object.keys(dayData).length;                                
            const present = Object.values(dayData).filter(s => s === 'present').length;                                
            const absent = total - present;                                
            const rate = total > 0 ? Math.round((present / total) * 100) + '%' : '0%';
                                            
            // Get grade from first student                                
            const firstStudentId = Object.keys(dayData)[0];                                
            const student = appData.students.find(s => s.id === firstStudentId);                                
            const grade = student ? 'Grade ' + student.grade : 'N/A';
                                           
            attendanceData.push([                                        
                date,                                        
                grade,                                       
                total,                                        
                present,                                       
                absent,                                       
                rate                                               
            ]);                                   
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
            
// Clear all data            
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
// 1. SYNC NOW - Main Function
// ============================================

async function syncNowManual() {
    try {
        // Safe call
        if (typeof window.saveData === 'function') {
            await window.saveData();
        }
        if (typeof window.loadData === 'function') {
            await window.loadData();
        }
        console.log('✅ Sync complete');
    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
}

// ============================================
// 2. UPDATE SYNC STATISTICS
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
// 3. UPDATE LAST SYNC TIME DISPLAY
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
// 4. AUTO-UPDATE LAST SYNC TIME
// ============================================

setInterval(() => {
    if (document.getElementById('lastSyncTime')) {
        updateLastSyncTimeDisplay();
    }
}, 60000); // Every 60 seconds

// ============================================
// INITIALIZE
// ============================================

console.log('✅ Sync functions loaded in Settings.js');

// Update sync time immediately if elements exist
setTimeout(() => {
    if (document.getElementById('lastSyncTime')) {
        updateLastSyncTimeDisplay();
    }
    if (document.getElementById('syncStudentsCount')) {
        updateSyncStats();
    }
}, 100);



// ============================================
// Make functions globally available
// ============================================

window.migrateLocalStorageToFirebase = migrateLocalStorageToFirebase;
window.updateDataStatistics = updateDataStatistics;
window.downloadBackup = downloadBackup;
window.uploadBackup = uploadBackup;

console.log('✅ Missing functions added');







