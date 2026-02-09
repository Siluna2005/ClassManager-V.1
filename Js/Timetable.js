// ============================================
// TIMETABLE - UPDATED WITH CLASS SUPPORT
// ============================================

function loadTimetable() {
    const tbody = document.getElementById('timetableTableBody');
    const classesEnabled = appData.classesEnabled || false; // ⭐ NEW
    
    if (appData.timetable.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #6B7280;">No classes</td></tr>';
        return;
    }
    
    tbody.innerHTML = appData.timetable.map(t => {
        // ⭐ NEW: Build grade/class display
        let gradeClassDisplay = `<span class="badge badge-blue">Grade ${t.grade}</span>`;
        if (classesEnabled && t.class) {
            gradeClassDisplay += ` <span class="class-badge-small" style="margin-left: 8px;">Class ${t.class}</span>`;
        }
        
        return `
            <tr>
                <td>${t.day}</td>
                <td>${t.time}</td>
                <td>${gradeClassDisplay}</td>
                <td>${t.notes || '-'}</td>
                <td>
                    <button class="icon-btn icon-btn-blue" onclick='editTimetable(${JSON.stringify(t)})'>✏️</button>
                    <button class="icon-btn icon-btn-red" onclick="deleteTimetable('${t.id}')">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function showAddTimetable() {
    appData.editingTimetable = null;
    document.getElementById('timetableModalTitle').textContent = 'Add Class';
    document.getElementById('timetableDay').value = 'Monday';
    document.getElementById('timetableTime').value = '';
    document.getElementById('timetableGrade').value = appData.grades[0];
    document.getElementById('timetableNotes').value = '';
    
    // ⭐ NEW: Clear class field
    const classInput = document.getElementById('timetableClass');
    if (classInput) classInput.value = '';
    
    document.getElementById('timetableModal').classList.add('active');
}

function editTimetable(entry) {
    appData.editingTimetable = entry;
    document.getElementById('timetableModalTitle').textContent = 'Edit Class';
    document.getElementById('timetableDay').value = entry.day;
    document.getElementById('timetableTime').value = entry.time;
    document.getElementById('timetableGrade').value = entry.grade;
    document.getElementById('timetableNotes').value = entry.notes || '';
    
    // ⭐ NEW: Set class field
    const classInput = document.getElementById('timetableClass');
    if (classInput) classInput.value = entry.class || '';
    
    document.getElementById('timetableModal').classList.add('active');
}

function closeTimetableModal() {
    document.getElementById('timetableModal').classList.remove('active');
}

function saveTimetableEntry() {
    const classesEnabled = appData.classesEnabled || false; // ⭐ NEW
    
    const day = document.getElementById('timetableDay').value;
    const time = document.getElementById('timetableTime').value;
    const grade = document.getElementById('timetableGrade').value;
    const notes = document.getElementById('timetableNotes').value;
    
    // ⭐ NEW: Get class field
    let timetableClass = '';
    if (classesEnabled) {
        const classInput = document.getElementById('timetableClass');
        timetableClass = classInput ? classInput.value : '';
        
        if (!timetableClass) {
            alert('⚠️ Please select a class');
            if (classInput) classInput.focus();
            return;
        }
    }
    
    if (!time) {
        alert('⚠️ Please enter time');
        return;
    }
    
    if (appData.editingTimetable) {
        // Update existing entry
        appData.timetable = appData.timetable.map(t => {
            if (t.id === appData.editingTimetable.id) {
                const updated = { ...t, day, time, grade, notes };
                // ⭐ NEW: Add class field
                if (classesEnabled) {
                    updated.class = timetableClass;
                }
                return updated;
            }
            return t;
        });
    } else {
        // Create new entry
        const newEntry = { 
            id: Date.now().toString(), 
            day, 
            time, 
            grade, 
            notes 
        };
        
        // ⭐ NEW: Add class field
        if (classesEnabled) {
            newEntry.class = timetableClass;
        }
        
        appData.timetable.push(newEntry);
    }
    
    saveData();
    closeTimetableModal();
    loadTimetable();
    updateDashboard();
    
    // ⭐ NEW: Show class in success message
    let successMsg = '✅ Saved!\n\n';
    successMsg += `Grade ${grade}`;
    if (classesEnabled && timetableClass) {
        successMsg += ` - Class ${timetableClass}`;
    }
    successMsg += `\n${day} at ${time}`;
    
    alert(successMsg);
}

function deleteTimetable(id) {
    if (!confirm('Delete this class schedule?')) return;
    appData.timetable = appData.timetable.filter(t => t.id !== id);
    saveData();
    loadTimetable();
    updateDashboard();
}

// ⭐ NEW: Populate class dropdown
function populateTimetableClassDropdown() {
    const classSelect = document.getElementById('timetableClass');
    if (!classSelect) return;
    
    const classes = appData.classes || ['A', 'B', 'C', 'D', 'E'];
    
    classSelect.innerHTML = `
        <option value="">Select Class</option>
        ${classes.map(c => `<option value="${c}">Class ${c}</option>`).join('')}
    `;
}

// ⭐ NEW: Initialize timetable screen
function initTimetableScreen() {
    console.log('📅 Initializing timetable screen...');
    
    const classesEnabled = appData.classesEnabled || false;
    
    // Show/hide class dropdown
    const classRow = document.getElementById('timetableClassRow');
    if (classRow) {
        classRow.style.display = classesEnabled ? 'block' : 'none';
    }
    
    if (classesEnabled) {
        populateTimetableClassDropdown();
    }
    
    console.log('✅ Timetable screen initialized (classes:', classesEnabled ? 'enabled' : 'disabled', ')');
}

console.log('✅ Timetable.js loaded (with class support)');
