// ============================================
// CLASS MANAGEMENT FUNCTIONS
// ============================================

// ============================================
// ENABLE/DISABLE CLASSES FEATURE
// ============================================

function toggleClassesFeature() {
    const isEnabled = appData.classesEnabled || false;
    
    if (!isEnabled) {
        // Enabling classes feature
        if (confirm('Enable Classes Feature?\n\nThis will allow you to organize students into classes (A, B, C, etc.).\n\nIf you have existing students, you will need to assign them to classes.')) {
            appData.classesEnabled = true;
            
            // Initialize default classes if not exists
            if (!appData.classes || appData.classes.length === 0) {
                appData.classes = ['A', 'B', 'C', 'D', 'E'];
            }
            
            saveData();
            loadClassSettings();
            
            // Check if need to show assignment popup
            setTimeout(() => {
                checkClassAssignmentNeeded();
            }, 500);
            
            alert('✅ Classes feature enabled!\n\nYou can now manage classes in the section below.');
        }
    } else {
        // Disabling classes feature
        const hasStudentsWithClasses = appData.students.some(s => s.class);
        const hasTimetableWithClasses = appData.timetable.some(t => t.class);
        
        if (hasStudentsWithClasses || hasTimetableWithClasses) {
            alert('⚠️ Cannot Disable Classes Feature\n\nYou have students or timetable entries with class assignments.\n\nClass data will be kept but hidden from the interface.');
            appData.classesEnabled = false;
            saveData();
            loadClassSettings();
        } else {
            if (confirm('Disable Classes Feature?\n\nThis will hide all class-related fields from the interface.')) {
                appData.classesEnabled = false;
                saveData();
                loadClassSettings();
                alert('✅ Classes feature disabled');
            }
        }
    }
}

// ============================================
// LOAD CLASS SETTINGS
// ============================================

function loadClassSettings() {
    const container = document.getElementById('classSettingsContainer');
    if (!container) return;
    
    const isEnabled = appData.classesEnabled || false;
    const classes = appData.classes || [];
    
    container.innerHTML = `
        <div class="settings-section">
            <h3>Class Management</h3>
            
            <div class="setting-item">
                <label class="toggle-label">
                    <input type="checkbox" id="classesEnabledToggle" ${isEnabled ? 'checked' : ''} onchange="toggleClassesFeature()">
                    <span>Enable Classes Feature</span>
                </label>
                <p class="setting-description">Organize students into classes (A, B, C, etc.)</p>
            </div>
            
            ${isEnabled ? `
                <div class="classes-editor">
                    <h4>Manage Classes</h4>
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
                        Add or remove classes. You cannot remove a class if students or timetable entries are assigned to it.
                    </p>
                    
                    <div class="classes-list" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                        ${classes.map(className => `
                            <div class="class-badge" style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 600;">Class ${className}</span>
                                <button class="btn-icon-small" onclick="removeClass('${className}')" title="Remove class">
                                    ×
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="add-class-form" style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="newClassInput" placeholder="Enter class name (e.g., F)" 
                               style="flex: 1; max-width: 200px; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;"
                               maxlength="2">
                        <button class="btn btn-primary" onclick="addNewClass()">
                            ➕ Add Class
                        </button>
                    </div>
                </div>
            ` : `
                <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">
                    Enable the classes feature to organize your students into classes.
                </p>
            `}
        </div>
    `;
}

// ============================================
// ADD NEW CLASS
// ============================================

function addNewClass() {
    const input = document.getElementById('newClassInput');
    if (!input) return;
    
    const className = input.value.trim().toUpperCase();
    
    // Validation
    if (!className) {
        alert('⚠️ Please enter a class name');
        return;
    }
    
    if (className.length > 2) {
        alert('⚠️ Class name should be 1-2 characters');
        return;
    }
    
    if (!appData.classes) {
        appData.classes = [];
    }
    
    if (appData.classes.includes(className)) {
        alert(`⚠️ Class ${className} already exists`);
        return;
    }
    
    // Add class
    appData.classes.push(className);
    appData.classes.sort(); // Keep alphabetically sorted
    
    saveData();
    loadClassSettings();
    
    // Clear input
    input.value = '';
    
    console.log('✅ Class added:', className);
}

// ============================================
// REMOVE CLASS
// ============================================

function removeClass(className) {
    console.log('🗑️ Attempting to remove class:', className);
    
    // Check if any students have this class
    const studentsInClass = appData.students.filter(s => s.class === className);
    
    if (studentsInClass.length > 0) {
        alert(`❌ Cannot Remove Class ${className}\n\n${studentsInClass.length} student(s) are assigned to this class.\n\nPlease reassign these students to another class first.`);
        return;
    }
    
    // Check if any timetable entries have this class
    const timetableEntries = appData.timetable.filter(t => t.class === className);
    
    if (timetableEntries.length > 0) {
        alert(`❌ Cannot Remove Class ${className}\n\n${timetableEntries.length} timetable entry(ies) are assigned to this class.\n\nPlease remove or update these timetable entries first.`);
        return;
    }
    
    // Safe to remove
    if (confirm(`Remove Class ${className}?\n\nThis action cannot be undone.`)) {
        appData.classes = appData.classes.filter(c => c !== className);
        saveData();
        loadClassSettings();
        
        console.log('✅ Class removed:', className);
        alert(`✅ Class ${className} removed successfully`);
    }
}

// ============================================
// CHECK IF CLASS ASSIGNMENT NEEDED
// ============================================

function checkClassAssignmentNeeded() {
    if (!appData.classesEnabled) return;
    
    // Check if any students don't have a class
    const studentsWithoutClass = appData.students.filter(s => !s.class || s.class === '');
    
    if (studentsWithoutClass.length > 0) {
        console.log(`⚠️ ${studentsWithoutClass.length} students need class assignment`);
        
        // Check if popup was already shown
        const popupShown = localStorage.getItem('classAssignmentPopupShown_' + currentUserId);
        
        if (!popupShown) {
            setTimeout(() => {
                showClassAssignmentPopup(studentsWithoutClass);
            }, 1000);
        }
    }
}

// ============================================
// SHOW CLASS ASSIGNMENT POPUP
// ============================================

function showClassAssignmentPopup(students) {
    const classes = appData.classes || ['A', 'B', 'C', 'D', 'E'];
    
    const modal = document.createElement('div');
    modal.id = 'classAssignmentModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 12px; padding: 24px; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div class="modal-header" style="margin-bottom: 20px;">
                <h2 style="margin: 0; color: #111827;">📋 Assign Classes to Students</h2>
                <p style="color: #6b7280; margin: 8px 0 0 0;">
                    You have ${students.length} student(s) without class assignments. Please assign them to classes.
                </p>
            </div>
            
            <div class="modal-body">
                <!-- Quick Assign Section -->
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 12px 0; color: #374151;">⚡ Quick Assign</h4>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: #6b7280;">Assign all students to:</span>
                        <select id="bulkClassSelect" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            ${classes.map(c => `<option value="${c}">Class ${c}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="bulkAssignClass()">
                            Apply to All
                        </button>
                    </div>
                </div>
                
                <!-- Individual Assignment Section -->
                <div>
                    <h4 style="margin: 0 0 12px 0; color: #374151;">👥 Individual Assignment</h4>
                    <div id="studentAssignmentList" style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                        ${students.map(student => `
                            <div class="student-assignment-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #f3f4f6;">
                                <div>
                                    <strong>${student.name}</strong>
                                    <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">Grade ${student.grade}</span>
                                </div>
                                <select class="student-class-select" data-student-id="${student.id}" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                    <option value="">Select Class</option>
                                    ${classes.map(c => `<option value="${c}">Class ${c}</option>`).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="modal-footer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px;">
                <button class="btn btn-secondary" onclick="skipClassAssignment()">
                    Skip for Now
                </button>
                <button class="btn btn-success" onclick="saveClassAssignments()">
                    💾 Save Assignments
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============================================
// BULK ASSIGN CLASS
// ============================================

function bulkAssignClass() {
    const bulkSelect = document.getElementById('bulkClassSelect');
    if (!bulkSelect) return;
    
    const selectedClass = bulkSelect.value;
    
    if (!selectedClass) {
        alert('⚠️ Please select a class');
        return;
    }
    
    // Set all student dropdowns to this class
    const studentSelects = document.querySelectorAll('.student-class-select');
    studentSelects.forEach(select => {
        select.value = selectedClass;
    });
    
    console.log(`✅ Bulk assigned all students to Class ${selectedClass}`);
}

// ============================================
// SAVE CLASS ASSIGNMENTS
// ============================================

function saveClassAssignments() {
    const studentSelects = document.querySelectorAll('.student-class-select');
    let assignedCount = 0;
    let unassignedCount = 0;
    
    studentSelects.forEach(select => {
        const studentId = select.getAttribute('data-student-id');
        const className = select.value;
        
        if (className) {
            const student = appData.students.find(s => s.id === studentId);
            if (student) {
                student.class = className;
                assignedCount++;
            }
        } else {
            unassignedCount++;
        }
    });
    
    if (unassignedCount > 0) {
        if (!confirm(`⚠️ Warning: ${unassignedCount} student(s) still don't have a class assigned.\n\nDo you want to save anyway?`)) {
            return;
        }
    }
    
    // Save to Firebase
    saveData();
    
    // Mark popup as shown
    localStorage.setItem('classAssignmentPopupShown_' + currentUserId, 'true');
    
    // Close modal
    closeClassAssignmentModal();
    
    alert(`✅ Class assignments saved!\n\n${assignedCount} student(s) assigned to classes.`);
    
    // Refresh student display if on students screen
    if (typeof loadStudentsScreen === 'function') {
        loadStudentsScreen();
    }
}

// ============================================
// SKIP CLASS ASSIGNMENT
// ============================================

function skipClassAssignment() {
    if (confirm('Skip class assignment?\n\nYou can assign classes later by editing each student individually.')) {
        // Mark popup as shown
        localStorage.setItem('classAssignmentPopupShown_' + currentUserId, 'true');
        
        closeClassAssignmentModal();
    }
}

// ============================================
// CLOSE CLASS ASSIGNMENT MODAL
// ============================================

function closeClassAssignmentModal() {
    const modal = document.getElementById('classAssignmentModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

window.toggleClassesFeature = toggleClassesFeature;
window.loadClassSettings = loadClassSettings;
window.addNewClass = addNewClass;
window.removeClass = removeClass;
window.checkClassAssignmentNeeded = checkClassAssignmentNeeded;
window.showClassAssignmentPopup = showClassAssignmentPopup;
window.bulkAssignClass = bulkAssignClass;
window.saveClassAssignments = saveClassAssignments;
window.skipClassAssignment = skipClassAssignment;
window.closeClassAssignmentModal = closeClassAssignmentModal;

console.log('✅ Class management functions loaded');
