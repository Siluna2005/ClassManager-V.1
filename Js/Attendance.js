// ============================================
// ATTENDANCE MANAGEMENT - UPDATED WITH CLASS SUPPORT
// ============================================

let currentAttendanceData = {};
let currentAttendanceStudents = [];

function loadAttendanceStudents() {
    const gradeSelect = document.getElementById('attendanceClassSelect');
    const dateSelect = document.getElementById('attendanceDateSelect');
    
    if (!gradeSelect || !dateSelect) {
        alert('Error: Controls not found');
        return;    
    }
    
    const classesEnabled = appData.classesEnabled || false; // ⭐ NEW
    
    const grade = gradeSelect.value;    
    const date = dateSelect.value;
    
    console.log('Loading attendance - Grade:', grade, 'Date:', date);
    
    if (!grade) {        
        alert('⚠️ Please select a class first');        
        return;    
    }
    
    if (!date) {        
        alert('⚠️ Please select a date first');        
        return;    
    }
    
    // ⭐ NEW: Get class selection if enabled
    let selectedClass = '';
    if (classesEnabled) {
        const classSelect = document.getElementById('attendanceClass');
        if (classSelect) {
            selectedClass = classSelect.value;
            
            if (!selectedClass) {
                alert('⚠️ Please select a class');
                classSelect.focus();
                return;
            }
        }
    }
    
    // ⭐ NEW: Filter students by grade AND class (if enabled)
    if (classesEnabled && selectedClass) {
        currentAttendanceStudents = appData.students.filter(s => 
            s.grade === grade && s.class === selectedClass
        );
        console.log(`Found students: ${currentAttendanceStudents.length} (Grade ${grade}, Class ${selectedClass})`);
    } else {
        // Original behavior - filter by grade only
        currentAttendanceStudents = appData.students.filter(s => s.grade === grade);
        console.log('Found students:', currentAttendanceStudents.length);
    }
    
    if (currentAttendanceStudents.length === 0) {
        const filterText = classesEnabled && selectedClass ? 
            `Grade ${grade} - Class ${selectedClass}` : 
            `Grade ${grade}`;
        alert(`ℹ️ No students in ${filterText}\n\nPlease add students first.`);
        document.getElementById('attendanceStudentCard').style.display = 'none';        
        return;  
    }
    
    // Show attendance card   
    document.getElementById('attendanceStudentCard').style.display = 'block';    
    
    // Load existing attendance data for this date    
    if (!appData.attendance) {        
        appData.attendance = {};    
    }
    
    if (appData.attendance[date]) {        
        currentAttendanceData = { ...appData.attendance[date] };        
        console.log('Loaded existing attendance:', currentAttendanceData);    
    } else {        
        currentAttendanceData = {};        
        console.log('No existing attendance for this date');    
    }
    
    // Display students                
    displayAttendanceStudents();
}

function displayAttendanceStudents() {    
    const container = document.getElementById('attendanceStudentsList');    
    const classesEnabled = appData.classesEnabled || false; // ⭐ NEW
    
    if (!container) {        
        console.error('Student list container not found');        
        return;    
    }
    
    let html = '';    
    
    currentAttendanceStudents.forEach(s => {        
        const isPresent = currentAttendanceData[s.id] === 'present';
        
        // ⭐ NEW: Show class info if enabled
        const studentInfo = classesEnabled && s.class ? 
            `ID: ${s.id} | Grade ${s.grade} - Class ${s.class}` :
            `ID: ${s.id} | Grade ${s.grade}`;
        
        html += `            
            <div style="background: ${isPresent ? '#D1FAE5' : '#F3F4F6'}; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 2px solid ${isPresent ? '#10B981' : '#D1D5DB'}; transition: all 0.3s;">                
                <div style="display: flex; justify-content: space-between; align-items: center;">                    
                    <div>                        
                        <div style="font-weight: 700; font-size: 18px; margin-bottom: 5px; color: #1F2937;">${s.name}</div>                        
                        <div style="color: #6B7280; font-size: 14px;">${studentInfo}</div>
                    </div>
                    <button onclick="toggleAttendance('${s.id}')"                             
                    style="background: ${isPresent ? '#10B981' : '#EF4444'}; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 700; min-width: 140px; transition: all 0.3s;">
                    ${isPresent ? '✓ Present' : '✗ Absent'}                
                    </button>
                </div>
            </div>   
        `;    
    });
    
    container.innerHTML = html;
    
    updateAttendanceCounts();
    
    console.log('Students displayed successfully');
}
   
function toggleAttendance(studentId) {            
    console.log('Toggle attendance for:', studentId);
    
    // Toggle status            
    if (currentAttendanceData[studentId] === 'present') {                    
        currentAttendanceData[studentId] = 'absent';           
    } else {                    
        currentAttendanceData[studentId] = 'present';            
    }
    
    console.log('New status:', currentAttendanceData[studentId]);
    
    // Refresh display            
    displayAttendanceStudents();    
}
    
function updateAttendanceCounts() {            
    const total = currentAttendanceStudents.length;            
    const present = currentAttendanceStudents.filter(s => currentAttendanceData[s.id] === 'present').length;            
    const absent = total - present;
    
    const totalEl = document.getElementById('attendanceTotalCount');       
    const presentEl = document.getElementById('attendancePresentCount');            
    const absentEl = document.getElementById('attendanceAbsentCount');
    
    if (totalEl) totalEl.textContent = total;            
    if (presentEl) presentEl.textContent = present;            
    if (absentEl) absentEl.textContent = absent;       
    
    console.log('Counts updated - Total:', total, 'Present:', present, 'Absent:', absent);
}
    
function saveAttendanceData() {            
    const dateSelect = document.getElementById('attendanceDateSelect');    
    const gradeSelect = document.getElementById('attendanceClassSelect');
    
    if (!dateSelect || !gradeSelect) {                    
        alert('Error: Controls not found');                    
        return;            
    }
    
    const date = dateSelect.value;            
    const grade = gradeSelect.value;        
    
    if (!date || !grade) {                    
        alert('⚠️ Please select class and date first');                    
        return;            
    }
    
    // Save to appData            
    if (!appData.attendance) {                   
        appData.attendance = {};            
    }
    
    appData.attendance[date] = { ...currentAttendanceData };        
    
    saveData();        
    
    // Calculate stats           
    const present = currentAttendanceStudents.filter(s => currentAttendanceData[s.id] === 'present').length;            
    const absent = currentAttendanceStudents.length - present;
    
    // ⭐ NEW: Show class info if enabled
    const classesEnabled = appData.classesEnabled || false;
    let saveMessage = `✅ Attendance Saved Successfully!\n\nDate: ${date}\nGrade: ${grade}`;
    
    if (classesEnabled) {
        const classSelect = document.getElementById('attendanceClass');
        const selectedClass = classSelect ? classSelect.value : '';
        if (selectedClass) {
            saveMessage += `\nClass: ${selectedClass}`;
        }
    }
    
    saveMessage += `\n\nPresent: ${present}\nAbsent: ${absent}`;
    
    alert(saveMessage);
    
    console.log('Attendance saved:', appData.attendance[date]);    
}
    
function scanQRForAttendance() {        
    const gradeSelect = document.getElementById('attendanceClassSelect');
    
    if (!gradeSelect || !gradeSelect.value) {              
        alert('⚠️ Please select a class first');                    
        return;          
    }
    
    const studentId = prompt('📷 QR Scanner\n\nIn real app, camera would open.\nFor now, enter Student ID:');
    
    if (!studentId) return;
    
    const student = appData.students.find(s => s.id === studentId.trim());    
    
    if (!student) {                    
        alert('❌ Student not found!\n\nID: ' + studentId);                    
        return;            
    }        
    
    if (student.grade !== gradeSelect.value) {                    
        alert(`❌ Wrong Class!\n\nStudent: ${student.name}\nGrade: ${student.grade}\nSelected: ${gradeSelect.value}`);                   
        return;            
    }
    
    // ⭐ NEW: Check class if enabled
    const classesEnabled = appData.classesEnabled || false;
    if (classesEnabled) {
        const classSelect = document.getElementById('attendanceClass');
        const selectedClass = classSelect ? classSelect.value : '';
        
        if (selectedClass && student.class !== selectedClass) {
            alert(`❌ Wrong Class!\n\nStudent: ${student.name}\nClass: ${student.class}\nSelected: ${selectedClass}`);
            return;
        }
    }
    
    // Mark as present            
    currentAttendanceData[studentId.trim()] = 'present';
    
    // Check if students are loaded            
    if (currentAttendanceStudents.length === 0) {                    
        loadAttendanceStudents();            
    } else {                    
        displayAttendanceStudents();            
    }
    
    alert('✅ ' + student.name + ' marked as Present');    
}

// ⭐ NEW: Populate class dropdown
function populateAttendanceClassDropdown() {
    const classSelect = document.getElementById('attendanceClass');
    if (!classSelect) return;
    
    const classes = appData.classes || ['A', 'B', 'C', 'D', 'E'];
    
    classSelect.innerHTML = `
        <option value="">Select Class</option>
        ${classes.map(c => `<option value="${c}">Class ${c}</option>`).join('')}
    `;
}

// ⭐ NEW: Initialize attendance screen
function initAttendanceScreen() {
    console.log('📋 Initializing attendance screen...');
    
    const classesEnabled = appData.classesEnabled || false;
    
    // Show/hide class dropdown
    const classRow = document.getElementById('attendanceClassRow');
    if (classRow) {
        classRow.style.display = classesEnabled ? 'block' : 'none';
    }
    
    if (classesEnabled) {
        populateAttendanceClassDropdown();
    }
    
    console.log('✅ Attendance screen initialized (classes:', classesEnabled ? 'enabled' : 'disabled', ')');
}

console.log('✅ Attendance.js loaded (with class support)');
