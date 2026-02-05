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
            updateLastSyncTimeDisplay();                    
            updateSyncStats();
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

// ============================================
// 1. SYNC NOW - Main Function
// ============================================

async function syncNowManual() {
    console.log('🔄 Manual sync triggered by user');
    
    const syncBtn = document.getElementById('syncNowBtn');
    const syncBtnText = document.getElementById('syncNowBtnText');
    const syncStatus = document.getElementById('syncStatusMessage');
    const syncStatusText = document.getElementById('syncStatusText');
    const lastSyncTime = document.getElementById('lastSyncTime');
    const syncIndicator = document.getElementById('syncIndicator');
    
    // Disable button
    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.style.opacity = '0.6';
    }
    
    if (syncBtnText) syncBtnText.textContent = '⏳ Syncing...';
    if (syncIndicator) {
        syncIndicator.style.background = '#f59e0b';
        syncIndicator.style.animation = 'pulse-sync 0.5s infinite';
    }
    
    try {
        // Step 1: Upload local data to Firebase
        console.log('📤 Step 1: Uploading local data to Firebase...');
        
        if (syncStatus && syncStatusText) {
            syncStatus.style.display = 'block';
            syncStatus.style.background = 'rgba(59,130,246,0.2)';
            syncStatus.style.border = '1px solid rgba(59,130,246,0.3)';
            syncStatusText.style.color = '#DBEAFE';
            syncStatusText.textContent = '📤 Uploading your data to cloud...';
        }
        
        // Save current data (saveData is in Save.js)
        if (typeof saveData === 'function') {
            await saveData();
            console.log('✅ Local data uploaded');
        } else {
            throw new Error('saveData function not found');
        }
        
        // Wait for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 2: Download latest data from Firebase
        console.log('📥 Step 2: Downloading latest data from Firebase...');
        
        if (syncStatusText) {
            syncStatusText.textContent = '📥 Downloading latest data from cloud...';
        }
        
        // Reload data from Firebase (loadData is in Save.js)
        if (typeof loadData === 'function') {
            loadData();
            console.log('✅ Latest data downloaded');
        } else {
            throw new Error('loadData function not found');
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: Update UI
        console.log('🔄 Step 3: Updating UI...');
        
        if (syncStatusText) {
            syncStatusText.textContent = '🔄 Refreshing display...';
        }
        
        // Update sync stats
        updateSyncStats();
        
        // Refresh current screen
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen) {
            const screenId = currentScreen.id;
            console.log('Refreshing screen:', screenId);
            
            if (screenId === 'students' && typeof loadStudentsScreen === 'function') {
                loadStudentsScreen();
            } else if (screenId === 'timetable' && typeof loadTimetable === 'function') {
                loadTimetable();
            } else if (screenId === 'payments' && typeof loadPaymentHistory === 'function') {
                loadPaymentHistory();
            } else if (screenId === 'settings' && typeof loadSettings === 'function') {
                loadSettings();
            } else if (screenId === 'dashboard' && typeof updateDashboard === 'function') {
                updateDashboard();
            } else if (screenId === 'subscription' && typeof updateSubscriptionDisplay === 'function') {
                updateSubscriptionDisplay();
            }
        }
        
        // Step 4: Update last sync time
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        if (lastSyncTime) {
            lastSyncTime.textContent = `${dateString} at ${timeString}`;
        }
        
        localStorage.setItem('lastManualSync', now.toISOString());
        
        // Step 5: Show success
        console.log('✅ Sync completed successfully!');
        
        if (syncStatus && syncStatusText) {
            syncStatus.style.background = 'rgba(16,185,129,0.2)';
            syncStatus.style.border = '1px solid rgba(16,185,129,0.3)';
            syncStatusText.style.color = '#D1FAE5';
            syncStatusText.textContent = '✅ Sync completed successfully!';
        }
        
        if (syncIndicator) {
            syncIndicator.style.background = '#10b981';
            syncIndicator.style.animation = 'pulse-sync 2s infinite';
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            if (syncStatus) syncStatus.style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        
        // Show error
        if (syncStatus && syncStatusText) {
            syncStatus.style.display = 'block';
            syncStatus.style.background = 'rgba(239,68,68,0.2)';
            syncStatus.style.border = '1px solid rgba(239,68,68,0.3)';
            syncStatusText.style.color = '#FEE2E2';
            syncStatusText.textContent = '❌ Sync failed: ' + error.message;
        }
        
        if (syncIndicator) {
            syncIndicator.style.background = '#ef4444';
            syncIndicator.style.animation = 'none';
        }
        
        // Hide error after 5 seconds
        setTimeout(() => {
            if (syncStatus) syncStatus.style.display = 'none';
            if (syncIndicator) {
                syncIndicator.style.background = '#10b981';
                syncIndicator.style.animation = 'pulse-sync 2s infinite';
            }
        }, 5000);
        
    } finally {
        // Re-enable button
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.style.opacity = '1';
        }
        if (syncBtnText) syncBtnText.textContent = '🔄 Sync Now';
    }
}

// ============================================
// 2. UPDATE SYNC STATISTICS
// ============================================

function updateSyncStats() {
    const studentsCount = document.getElementById('syncStudentsCount');
    const classesCount = document.getElementById('syncClassesCount');
    const paymentsCount = document.getElementById('syncPaymentsCount');
    
    // Access appData from global scope
    if (typeof appData !== 'undefined') {
        if (studentsCount && appData.students) {
            studentsCount.textContent = appData.students.length;
        }
        
        if (classesCount && appData.timetable) {
            classesCount.textContent = appData.timetable.length;
        }
        
        if (paymentsCount && appData.payments) {
            paymentsCount.textContent = appData.payments.length;
        }
    } else {
        console.warn('⚠️ appData not available for sync stats');
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

