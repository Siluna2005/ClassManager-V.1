// ============================================
// UPDATED saveData() FUNCTION
// Replace your existing saveData() function with this
// ============================================

function saveData() {
    // Check if user is authenticated
    if (!currentUserId) {
        console.error('❌ No user authenticated');
        return Promise.reject('No user authenticated');
    }

    try {
        const dataToSave = {
            ...appData,
            lastSaved: new Date().toISOString()
        };
        
        console.log('💾 Saving data to Firebase (cloud only)...');
        updateSyncStatus('syncing');
        
        // ✅ SAVE TO FIREBASE ONLY (Single Source of Truth)
        return database.ref('users/' + currentUserId + '/data').set(dataToSave)
            .then(() => {
                console.log('✅ Data saved to Firebase successfully');
                
                // Optional: Keep temporary session cache for offline viewing
                // This cache expires after 24 hours and is read-only
                const cacheData = {
                    data: dataToSave,
                    cachedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
                };
                sessionStorage.setItem('tempCache_' + currentUserId, JSON.stringify(cacheData));
                
                updateLastSavedTime();
                updateSyncStatus('synced');
                
                return true;
            })
            .catch((error) => {
                console.error('❌ Firebase save error:', error);
                updateSyncStatus('error');
                
                // Show user-friendly error message
                alert('⚠️ Failed to save data to cloud\n\nError: ' + error.message + '\n\nPlease check your internet connection and try again.');
                
                return false;
            });
        
    } catch (error) {
        console.error('❌ Error saving data:', error);
        updateSyncStatus('error');
        return Promise.reject(error);
    }

    .then(() => {
        console.log('✅ Data saved');
    
        // ⭐ ADD THIS
        if (currentUserId) {
            updateUserLastActivity(currentUserId);
        }
    });
}

// ============================================
// UPDATED loadData() FUNCTION
// Replace your existing loadData() function with this
// ============================================

function loadData() {
    // Check if user is authenticated
    if (!currentUserId) {
        console.error('❌ No user authenticated');
        return;
    }

    console.log('📥 Loading data from Firebase (cloud only)...');
    updateSyncStatus('syncing');
   
    // ✅ LOAD FROM FIREBASE ONLY (Single Source of Truth)
    database.ref('users/' + currentUserId + '/data').once('value')
        .then((snapshot) => {
            const firebaseData = snapshot.val();
        
            if (firebaseData) {
                // ✅ Data exists in Firebase - Load it
                console.log('✅ Data loaded from Firebase successfully');
                
                appData = {
                    ...appData,
                    ...firebaseData,
                    students: firebaseData.students || [],
                    timetable: firebaseData.timetable || [],
                    payments: firebaseData.payments || [],
                    attendance: firebaseData.attendance || {},
                    grades: firebaseData.grades || ['06', '07', '08', '09', '10', '11', '12'],
                    subscription: firebaseData.subscription || appData.subscription
                };
                
                // Update session cache for offline viewing
                const cacheData = {
                    data: firebaseData,
                    cachedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
                };
                sessionStorage.setItem('tempCache_' + currentUserId, JSON.stringify(cacheData));
                
            } else {
                // ℹ️ No Firebase data - New user
                console.log('ℹ️ No Firebase data found - First time user');
                console.log('📤 Saving default data to Firebase...');
                
                // Save default data to Firebase
                saveData();
            }
        
            // Update the UI
            populateGradeDropdowns();
            updateDashboard();
            updateSyncStatus('synced');
            teacherIdDisplay();
        })
        .catch((error) => {
            // ❌ Firebase error - Try offline cache
            console.error('❌ Firebase load error:', error);
            updateSyncStatus('error');
            
            // Try to load from session cache (offline mode)
            const cache = sessionStorage.getItem('tempCache_' + currentUserId);
            
            if (cache) {
                try {
                    const cached = JSON.parse(cache);
                    const cacheExpiry = new Date(cached.expiresAt);
                    
                    if (new Date() < cacheExpiry) {
                        console.log('📦 Loading from temporary cache (offline mode)');
                        
                        appData = {
                            ...appData,
                            ...cached.data,
                            students: cached.data.students || [],
                            timetable: cached.data.timetable || [],
                            payments: cached.data.payments || [],
                            attendance: cached.data.attendance || {},
                            grades: cached.data.grades || ['06', '07', '08', '09', '10', '11', '12']
                        };
                        
                        populateGradeDropdowns();
                        updateDashboard();
                        
                        // Show offline warning
                        alert('⚠️ OFFLINE MODE\n\nShowing cached data from your last session.\n\n❌ Changes cannot be saved until you reconnect to the internet.\n\nPlease check your connection and refresh the page.');
                        
                    } else {
                        // Cache expired
                        console.log('❌ Cache expired');
                        alert('❌ Cannot Load Data\n\nNo internet connection and cached data has expired (older than 24 hours).\n\nPlease connect to the internet and try again.');
                    }
                    
                } catch (cacheError) {
                    console.error('❌ Cache parse error:', cacheError);
                    alert('❌ Cannot Load Data\n\nNo internet connection and cache is corrupted.\n\nPlease connect to the internet and try again.');
                }
            } else {
                // No cache available
                console.log('❌ No cache available');
                alert('❌ Cannot Load Data\n\nNo internet connection and no cached data available.\n\nPlease connect to the internet and try again.');
            }
        });
}

// ============================================
// UPDATED enableRealtimeSync() FUNCTION
// Replace your existing enableRealtimeSync() function with this
// ============================================

function enableRealtimeSync() {
    // Check if user is authenticated
    if (!currentUserId) {
        console.warn('⚠️ Cannot enable sync: No user authenticated');
        return;
    }

    console.log('🔄 Real-time sync enabled (Firebase only)');

    // ✅ LISTEN FOR FIREBASE CHANGES ONLY
    database.ref('users/' + currentUserId + '/data').on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (data && data.lastSaved) {
            // Only update if the remote data is newer than what we have
            if (!lastSyncedTimestamp || data.lastSaved > lastSyncedTimestamp) {
                lastSyncedTimestamp = data.lastSaved;
                
                console.log('🔄 Data updated from cloud');
                
                // Update local appData
                appData = {
                    ...appData,
                    ...data,
                    students: data.students || [],
                    timetable: data.timetable || [],
                    payments: data.payments || [],
                    attendance: data.attendance || {},
                    grades: data.grades || ['06', '07', '08', '09', '10', '11', '12'],
                    subscription: data.subscription || appData.subscription
                };
                
                // Update session cache
                const cacheData = {
                    data: data,
                    cachedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
                };
                sessionStorage.setItem('tempCache_' + currentUserId, JSON.stringify(cacheData));
                
                // Refresh current screen
                const activeScreen = document.querySelector('.screen.active');
                if (activeScreen) {
                    const screenId = activeScreen.id;
                    
                    console.log('🔄 Refreshing screen:', screenId);
                    
                    if (screenId === 'students') {
                        loadStudentsScreen();
                    } else if (screenId === 'timetable') {
                        loadTimetable();
                    } else if (screenId === 'payments') {
                        loadPaymentHistory();
                    } else if (screenId === 'dashboard') {
                        updateDashboard();
                    } else if (screenId === 'settings') {
                        loadSettings();
                    } else if (screenId === 'subscription') {
                        updateSubscriptionDisplay();
                    }
                }
                
                // Show subtle notification
                console.log('✅ Data synced from cloud');
            }
        }
    }, (error) => {
        console.error('❌ Real-time sync error:', error);
        updateSyncStatus('error');
    });
}

// ============================================
// DATA MIGRATION FUNCTION
// Add this NEW function to your code
// Call it ONCE during app initialization
// ============================================

async function migrateLocalStorageToFirebase() {
    if (!currentUserId) {
        console.log('⚠️ Cannot migrate: No user authenticated');
        return;
    }
    
    console.log('🔄 Checking for local data migration...');
    
    // Check if old localStorage data exists
    const oldLocalDataKey = 'classManagerData_' + currentUserId;
    const oldLocalData = localStorage.getItem(oldLocalDataKey);
    
    if (oldLocalData) {
        try {
            console.log('📦 Found old localStorage data');
            const parsedData = JSON.parse(oldLocalData);
            
            // Check if Firebase already has data
            const snapshot = await database.ref('users/' + currentUserId + '/data').once('value');
            
            if (!snapshot.exists()) {
                // Firebase is empty - migrate localStorage data
                console.log('📤 Migrating localStorage data to Firebase...');
                
                await database.ref('users/' + currentUserId + '/data').set({
                    ...parsedData,
                    lastSaved: new Date().toISOString(),
                    migratedAt: new Date().toISOString()
                });
                
                console.log('✅ Migration complete - removing old localStorage data');
                localStorage.removeItem(oldLocalDataKey);
                
                // Show success message
                alert('✅ Data Migration Complete!\n\nYour data has been successfully migrated to the cloud.\n\n✓ Your data is now safely stored in Firebase\n✓ Your data will sync across all your devices\n✓ Old local storage has been removed');
                
            } else {
                // Firebase already has data
                const firebaseData = snapshot.val();
                const firebaseDate = new Date(firebaseData.lastSaved || 0);
                const localDate = new Date(parsedData.lastSaved || 0);
                
                if (localDate > firebaseDate) {
                    // Local data is newer - ask user
                    const migrate = confirm('🔄 Data Conflict Detected\n\nYou have data in both:\n- Cloud (Firebase)\n- Local device storage\n\nYour LOCAL data is newer.\n\nDo you want to UPLOAD your local data to the cloud?\n\n✓ Click OK to upload local data\n✗ Click Cancel to keep cloud data');
                    
                    if (migrate) {
                        console.log('📤 User chose to upload local data');
                        
                        await database.ref('users/' + currentUserId + '/data').set({
                            ...parsedData,
                            lastSaved: new Date().toISOString(),
                            migratedAt: new Date().toISOString()
                        });
                        
                        console.log('✅ Local data uploaded - removing old localStorage');
                        localStorage.removeItem(oldLocalDataKey);
                        
                        alert('✅ Local data uploaded successfully!\n\nYour newer local data is now in the cloud.');
                        
                        // Reload to show updated data
                        location.reload();
                    } else {
                        console.log('ℹ️ User chose to keep cloud data - removing old localStorage');
                        localStorage.removeItem(oldLocalDataKey);
                        
                        alert('ℹ️ Cloud data preserved\n\nOld local storage has been removed.\n\nUsing cloud data.');
                    }
                } else {
                    // Cloud data is newer or same - just remove local copy
                    console.log('ℹ️ Firebase data is current - removing redundant localStorage');
                    localStorage.removeItem(oldLocalDataKey);
                    
                    console.log('✅ Migration complete - old localStorage removed');
                }
            }
            
        } catch (error) {
            console.error('❌ Migration error:', error);
            
            // Ask user what to do
            const retry = confirm('❌ Migration Error\n\nFailed to migrate your local data to the cloud.\n\nError: ' + error.message + '\n\nDo you want to keep trying?\n\n✓ Click OK to keep local data for manual backup\n✗ Click Cancel to discard local data');
            
            if (!retry) {
                console.log('⚠️ User chose to discard local data');
                localStorage.removeItem(oldLocalDataKey);
            } else {
                console.log('ℹ️ User chose to keep local data - will retry on next login');
                alert('ℹ️ Local data preserved\n\nWe\'ll try to migrate it again on your next login.\n\nIn the meantime, you can manually backup using Settings → Download Backup.');
            }
        }
    } else {
        console.log('✅ No old localStorage data found - migration not needed');
    }
}

    // Download backup file (JSON)
        function downloadBackup() {    
            try {        
                const dataToBackup = {            
                    ...appData,            
                    backupDate: new Date().toISOString(),            
                    appVersion: '1.0'        
                };
                
                const dataStr = JSON.stringify(dataToBackup, null, 2);        
                const dataBlob = new Blob([dataStr], { type: 'application/json' });        
                const url = URL.createObjectURL(dataBlob);        
                const link = document.createElement('a');        
                const fileName = `ClassManager_Backup_${new Date().toISOString().split('T')[0]}.json`;
                
                link.href = url;        
                link.download = fileName;        
                link.click();
                
                // Update last backup time        
                const now = new Date().toLocaleString();        
                localStorage.setItem('lastBackupTime', now);        
                const backupTimeEl = document.getElementById('lastBackupTime');        
                if (backupTimeEl) backupTimeEl.textContent = now;
                
                alert('✅ Backup downloaded successfully!\n\nFile: ' + fileName);    
            } catch (error) {        
                console.error('❌ Backup error:', error);        
                alert('⚠️ Error creating backup file.');    
            }
        }

        // Upload and restore backup file
        function uploadBackup() {    
            const input = document.createElement('input');    
            input.type = 'file';    
            input.accept = '.json';
        
            input.onchange = (e) => {        
                const file = e.target.files[0];        
                if (!file) return;
                
                const reader = new FileReader();
                
                reader.onload = (event) => {            
                    try {                
                        const restored = JSON.parse(event.target.result);
                                
                        // Validate data structure                
                        if (!restored.students || !Array.isArray(restored.students)) {                    
                            throw new Error('Invalid backup file format');                
                        }
                                
                        // Confirm before restoring                
                        if (!confirm('⚠️ Restore data from backup?\n\nThis will replace all current data!\n\nStudents: ' + (restored.students?.length || 0) + '\nPayments: ' + (restored.payments?.length || 0))) {                    
                            return;                
                        }
                                
                        // Restore data                
                        appData = {                    
                            students: restored.students || [],                    
                            grades: restored.grades || ['06', '07', '08', '09', '10', '11', '12'],                    
                            timetable: restored.timetable || [],                    
                            attendance: restored.attendance || {},                    
                            payments: restored.payments || [],                    
                            subjectName: restored.subjectName || 'Mathematics',                    
                            selectedStudent: null,                    
                            editingTimetable: null,                    
                            selectedPaymentStudent: null                
                        };
                                
                        saveData();                
                        populateGradeDropdowns();                
                        updateDashboard();
                                
                        // Refresh current screen                
                        const activeScreen = document.querySelector('.screen.active');                
                        if (activeScreen) {                    
                            const screenId = activeScreen.id;                    
                            if (screenId === 'students') loadStudentsScreen();                    
                            if (screenId === 'timetable') loadTimetable();                    
                            if (screenId === 'payments') loadPaymentHistory();                    
                            if (screenId === 'settings') loadSettings();                
                        }
                                
                        alert('✅ Data restored successfully!\n\nStudents: ' + appData.students.length + '\nPayments: ' + appData.payments.length);                                
                    } catch (err) {                
                        console.error('❌ Restore error:', err);                
                        alert('⚠️ Invalid backup file!\n\nPlease select a valid Class Manager backup file.');            
                    }        
                };
                
                reader.onerror = () => {            
                    alert('⚠️ Error reading backup file.');        
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
    
        // Update data statistics in settings    
        function updateDataStatistics() {            
            const statsStudents = document.getElementById('statsStudents');            
            const statsPayments = document.getElementById('statsPayments');            
            const statsTimetable = document.getElementById('statsTimetable');            
            const statsAttendance = document.getElementById('statsAttendance');        
        
            if (statsStudents) statsStudents.textContent = appData.students.length;            
            if (statsPayments) statsPayments.textContent = (appData.payments || []).length;            
            if (statsTimetable) statsTimetable.textContent = appData.timetable.length;            
            if (statsAttendance) statsAttendance.textContent = Object.keys(appData.attendance || {}).length;   

        }

// ============================================
// SYNC BUTTON DIAGNOSTIC
// Run this in browser console to diagnose the issue
// ============================================

function diagnoseSyncButton() {
    console.log('🔍 DIAGNOSING SYNC BUTTON...');
    console.log('================================');
    
    // Check if button exists
    const syncBtn = document.getElementById('syncNowBtn');
    console.log('1. Sync button element:', syncBtn ? '✅ FOUND' : '❌ NOT FOUND');
    
    if (syncBtn) {
        console.log('   - onclick:', syncBtn.getAttribute('onclick'));
        console.log('   - disabled:', syncBtn.disabled);
        console.log('   - display:', window.getComputedStyle(syncBtn).display);
    }
    
    // Check if function exists
    console.log('2. syncNowManual function:', typeof syncNowManual !== 'undefined' ? '✅ EXISTS' : '❌ NOT FOUND');
    
    if (typeof syncNowManual === 'undefined') {
        console.error('❌ ERROR: syncNowManual() function is not defined!');
        console.log('   Solution: Add the sync functions to your code');
    }
    
    // Check supporting functions
    console.log('3. updateSyncStats function:', typeof updateSyncStats !== 'undefined' ? '✅ EXISTS' : '❌ NOT FOUND');
    console.log('4. updateLastSyncTimeDisplay function:', typeof updateLastSyncTimeDisplay !== 'undefined' ? '✅ EXISTS' : '❌ NOT FOUND');
    
    // Check UI elements
    const syncStatus = document.getElementById('syncStatusMessage');
    const syncText = document.getElementById('syncStatusText');
    const lastSyncTime = document.getElementById('lastSyncTime');
    const syncIndicator = document.getElementById('syncIndicator');
    
    console.log('5. UI Elements:');
    console.log('   - syncStatusMessage:', syncStatus ? '✅' : '❌');
    console.log('   - syncStatusText:', syncText ? '✅' : '❌');
    console.log('   - lastSyncTime:', lastSyncTime ? '✅' : '❌');
    console.log('   - syncIndicator:', syncIndicator ? '✅' : '❌');
    
    // Check Firebase
    console.log('6. Firebase:');
    console.log('   - database:', typeof database !== 'undefined' ? '✅' : '❌');
    console.log('   - currentUserId:', typeof currentUserId !== 'undefined' && currentUserId ? '✅ ' + currentUserId : '❌');
    
    // Check saveData and loadData
    console.log('7. Core Functions:');
    console.log('   - saveData:', typeof saveData !== 'undefined' ? '✅' : '❌');
    console.log('   - loadData:', typeof loadData !== 'undefined' ? '✅' : '❌');
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (typeof syncNowManual === 'undefined') {
        console.log('❌ CRITICAL: syncNowManual() function missing!');
        console.log('   → Add SYNC_FUNCTIONS_COMPLETE.js to your code');
    }
    
    if (typeof updateSyncStats === 'undefined') {
        console.log('❌ updateSyncStats() function missing!');
        console.log('   → Add from SYNC_FUNCTIONS_COMPLETE.js');
    }
    
    if (typeof updateLastSyncTimeDisplay === 'undefined') {
        console.log('❌ updateLastSyncTimeDisplay() function missing!');
        console.log('   → Add from SYNC_FUNCTIONS_COMPLETE.js');
    }
    
    if (!syncBtn) {
        console.log('❌ Sync button HTML missing!');
        console.log('   → Add sync button HTML to Settings screen');
    }
    
    console.log('\n================================');
    console.log('✅ DIAGNOSTIC COMPLETE');
    
    // Try to manually trigger sync
    if (typeof syncNowManual !== 'undefined') {
        console.log('\n🧪 TESTING: Attempting manual sync...');
        try {
            syncNowManual();
            console.log('✅ Sync function executed');
        } catch (error) {
            console.error('❌ Sync function error:', error);
        }
    }
}

// Run diagnostic
diagnoseSyncButton();














