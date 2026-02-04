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