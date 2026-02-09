// ============================================
// STUDENT MANAGEMENT - UPDATED WITH CLASS SUPPORT
// ============================================

let currentSelectedGradeTab = 'all';
let selectedStudentForEdit = null;

function loadStudentsScreen() {
    populateStudentGradeDropdown();
    populateStudentClassDropdown(); // ⭐ NEW
    createGradeTabs();
    filterStudentsByTab();
}

function populateStudentGradeDropdown() {
    const gradeSelect = document.getElementById('studentGradeInput');
    if (gradeSelect) {
        gradeSelect.innerHTML = '<option value="">Select Grade</option>' + 
            appData.grades.map(g => `<option value="${g}">Grade ${g}</option>`).join('');
    }
}

// ⭐ NEW: Populate class dropdown
function populateStudentClassDropdown() {
    const classesEnabled = appData.classesEnabled || false;
    
    if (!classesEnabled) {
        // Hide class field if not enabled
        const classRow = document.getElementById('studentClassRow');
        if (classRow) classRow.style.display = 'none';
        return;
    }
    
    // Show class field
    const classRow = document.getElementById('studentClassRow');
    if (classRow) classRow.style.display = 'block';
    
    const classSelect = document.getElementById('studentClassInput');
    if (classSelect) {
        const classes = appData.classes || ['A', 'B', 'C', 'D', 'E'];
        classSelect.innerHTML = '<option value="">Select Class</option>' + 
            classes.map(c => `<option value="${c}">Class ${c}</option>`).join('');
    }
}

function createGradeTabs() {
    const tabsContainer = document.getElementById('gradeTabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = appData.grades.map(g => `
            <button class="grade-tab" data-grade="${g}" onclick="switchGradeTab('${g}')">
                Grade ${g}
            </button>
        `).join('');
    }
}

function switchGradeTab(grade) {
    currentSelectedGradeTab = grade;
            
    // Update active tab styling
    document.querySelectorAll('.grade-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.grade-tab[data-grade="${grade}"]`).classList.add('active');
    
    filterStudentsByTab();
}

function filterStudentsByTab() {
    const searchTerm = document.getElementById('studentSearchBox').value.toLowerCase();
            
    let filtered = appData.students;
            
    // Filter by grade tab
    if (currentSelectedGradeTab !== 'all') {
        filtered = filtered.filter(s => s.grade === currentSelectedGradeTab);
    }
            
    // Filter by search
    if (searchTerm) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(searchTerm) ||
            s.id.includes(searchTerm) ||
            (s.studentPhone && s.studentPhone.includes(searchTerm)) ||
            (s.parentPhone && s.parentPhone.includes(searchTerm))
        );
    }
            
    displayStudentList(filtered);
}

function displayStudentList(students) {    
    const listContainer = document.getElementById('studentListByGrade');
    const classesEnabled = appData.classesEnabled || false; // ⭐ NEW
        
    if (students.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 40px;">No students found</p>';        
        return;    
    }
        
    listContainer.innerHTML = students.map(s => {
        // ⭐ NEW: Build class display
        const classDisplay = classesEnabled && s.class ? 
            `Class ${s.class}` : 
            (s.class ? `Class ${s.class}` : 'N/A');
        
        return `                    
            <div class="student-card ${selectedStudentForEdit?.id === s.id ? 'selected' : ''}"                             
                onclick='selectStudentForEdit(${JSON.stringify(s).replace(/'/g, "&apos;")})'>                            
                <div style="display: flex; justify-content: space-between; align-items: center;">                                    
                    <div style="flex: 1;">                                
                        <div class="student-card-name">${s.name}</div>                                            
                        <div class="student-card-details">                                            
                            ID: ${s.id}<br>                                                    
                            Grade ${s.grade} - ${classDisplay} | ${s.gender || 'N/A'}<br>                                                    
                            Parent: ${s.parentPhone || 'N/A'}   
                        </div>                                
                    </div>                    
                    <button onclick='event.stopPropagation(); showQRCode(${JSON.stringify(s).replace(/'/g, "&apos;")})'                         
                            style="background: #2563EB; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">                    
                        📱 QR                                    
                    </button>            
                </div>
            </div>        
        `;
    }).join(''); 
}

function selectStudentForEdit(student) {                               
    console.log('📝 Selecting student for edit:', student.name);    
           
    selectedStudentForEdit = student;
       
    // Fill form with student data
    const nameInput = document.getElementById('studentNameInput');
    const birthdayInput = document.getElementById('studentBirthdayInput');
    const genderInput = document.getElementById('studentGenderInput');
    const classInput = document.getElementById('studentClassInput');
    const gradeInput = document.getElementById('studentGradeInput');
    const studentPhoneInput = document.getElementById('studentPhoneInput');
    const parentPhoneInput = document.getElementById('parentPhoneInput');
    
    if (nameInput) nameInput.value = student.name || '';
    if (birthdayInput) birthdayInput.value = student.birthday || '';
    if (genderInput) genderInput.value = student.gender || '';
    if (classInput) classInput.value = student.class || '';
    if (gradeInput) gradeInput.value = student.grade || '';
    if (studentPhoneInput) studentPhoneInput.value = student.studentPhone || '';
    if (parentPhoneInput) parentPhoneInput.value = student.parentPhone || '';
    
    // Update form title
    const formTitle = document.getElementById('studentFormTitle');
    if (formTitle) {           
        formTitle.textContent = 'Edit Student';
    }
    
    // Show student ID and QR section
    const studentIdDisplay = document.getElementById('studentIdDisplay');
    const studentIdDisplaySection = document.getElementById('studentIdDisplaySection');
    const qrCodeText = document.getElementById('qrCodeText');
    
    if (studentIdDisplay) {
        studentIdDisplay.value = student.id;
    }
    
    if (qrCodeText) {
        qrCodeText.textContent = `Student ID: ${student.id}`;
    }
    
    if (studentIdDisplaySection) {
        studentIdDisplaySection.style.display = 'block';
    }
    
    // Show/hide buttons
    const addStudentBtn = document.getElementById('addStudentBtn');
    const updateStudentBtn = document.getElementById('updateStudentBtn');
    const deleteStudentBtn = document.getElementById('deleteStudentBtn');
    const clearStudentBtn = document.getElementById('clearStudentBtn');
       
    if (addStudentBtn) addStudentBtn.style.display = 'none';
    if (updateStudentBtn) updateStudentBtn.style.display = 'block';
    if (deleteStudentBtn) deleteStudentBtn.style.display = 'block';
    if (clearStudentBtn) clearStudentBtn.style.display = 'block';
       
    // Update selected styling in list    
    filterStudentsByTab();    
    
    console.log('✅ Student selected for editing:', student.name);
}

function addNewStudent() {
           
    if (!canAddStudent()) {        
        return;    
    }

    const classesEnabled = appData.classesEnabled || false; // ⭐ NEW

    // Get form values
    const name = document.getElementById('studentNameInput').value.trim();
    const birthday = document.getElementById('studentBirthdayInput').value;
    const gender = document.getElementById('studentGenderInput').value;
    const studentClass = document.getElementById('studentClassInput').value;
    const grade = document.getElementById('studentGradeInput').value;
    const studentPhone = document.getElementById('studentPhoneInput').value.trim();
    const parentPhone = document.getElementById('parentPhoneInput').value.trim();

    // Validation
    if (!name) {
        alert('⚠️ Please enter student name');
        return;
    }

    if (!grade) {
        alert('⚠️ Please select grade');
        return;
    }

    // ⭐ NEW: Validate class if enabled
    if (classesEnabled && !studentClass) {
        alert('⚠️ Please select a class');
        document.getElementById('studentClassInput').focus();
        return;
    }

    // Generate ID
    const newId = generateStudentId(grade);

    // Create student object
    const newStudent = {
        id: newId,
        name: name,
        birthday: birthday,
        gender: gender,
        class: studentClass, // ⭐ ALWAYS include class field
        grade: grade,
        studentPhone: studentPhone,
        parentPhone: parentPhone,
        createdAt: new Date().toISOString()
    };

    // Add to array
    appData.students.push(newStudent);
    saveData();

    // Refresh display
    filterStudentsByTab();
    clearStudentForm();

    alert(`✅ Student added successfully!\n\nName: ${name}\nID: ${newId}\nGrade: ${grade}${classesEnabled ? `\nClass: ${studentClass}` : ''}`);
}

function updateExistingStudent() {
    if (!selectedStudentForEdit) return;

    const classesEnabled = appData.classesEnabled || false; // ⭐ NEW

    // Get form values
    const name = document.getElementById('studentNameInput').value.trim();
    const birthday = document.getElementById('studentBirthdayInput').value;
    const gender = document.getElementById('studentGenderInput').value;
    const studentClass = document.getElementById('studentClassInput').value;
    const grade = document.getElementById('studentGradeInput').value;
    const studentPhone = document.getElementById('studentPhoneInput').value.trim();
    const parentPhone = document.getElementById('parentPhoneInput').value.trim();

    // Validation
    if (!name) {
        alert('⚠️ Please enter student name');
        return;
    }

    if (!grade) {
        alert('⚠️ Please select grade');
        return;
    }

    // ⭐ NEW: Validate class if enabled
    if (classesEnabled && !studentClass) {
        alert('⚠️ Please select a class');
        document.getElementById('studentClassInput').focus();
        return;
    }

    // Find and update student
    const studentIndex = appData.students.findIndex(s => s.id === selectedStudentForEdit.id);
            
    if (studentIndex !== -1) {
        appData.students[studentIndex] = {
            ...appData.students[studentIndex],
            name: name,
            birthday: birthday,
            gender: gender,
            class: studentClass, // ⭐ ALWAYS update class field
            grade: grade,
            studentPhone: studentPhone,
            parentPhone: parentPhone
        };
    }

    saveData();
    filterStudentsByTab();
    clearStudentForm();
            
    alert('✅ Student updated successfully!');
}

function deleteExistingStudent() {
    if (!selectedStudentForEdit) return;
            
    if (!confirm(`Are you sure you want to delete this student?\n\nName: ${selectedStudentForEdit.name}\nID: ${selectedStudentForEdit.id}`)) {
        return;
    }
            
    appData.students = appData.students.filter(s => s.id !== selectedStudentForEdit.id);
    saveData();
            
    filterStudentsByTab();
    clearStudentForm();
            
    alert('✅ Student deleted successfully!');
}

function clearStudentForm() {  
    console.log('🧹 Clearing student form');    
                   
    selectedStudentForEdit = null;
                        
    // Clear form title    
    const formTitle = document.getElementById('studentFormTitle');    
    if (formTitle) {        
        formTitle.textContent = 'Add New Student';           
    }
        
    // Clear all input fields    
    const nameInput = document.getElementById('studentNameInput');                    
    const birthdayInput = document.getElementById('studentBirthdayInput');    
    const genderInput = document.getElementById('studentGenderInput');    
    const classInput = document.getElementById('studentClassInput');    
    const gradeInput = document.getElementById('studentGradeInput');    
    const studentPhoneInput = document.getElementById('studentPhoneInput');    
    const parentPhoneInput = document.getElementById('parentPhoneInput');
    
    if (nameInput) nameInput.value = '';
    if (birthdayInput) birthdayInput.value = '';
    if (genderInput) genderInput.value = '';
    if (classInput) classInput.value = '';
    if (gradeInput) gradeInput.value = '';
    if (studentPhoneInput) studentPhoneInput.value = '';
    if (parentPhoneInput) parentPhoneInput.value = '';
                    
    // Hide student ID section
    const studentIdDisplaySection = document.getElementById('studentIdDisplaySection');
    if (studentIdDisplaySection) {
        studentIdDisplaySection.style.display = 'none';
    }
    
    // Reset buttons
    const addStudentBtn = document.getElementById('addStudentBtn');
    const updateStudentBtn = document.getElementById('updateStudentBtn');
    const deleteStudentBtn = document.getElementById('deleteStudentBtn');
    const clearStudentBtn = document.getElementById('clearStudentBtn');
    
    if (addStudentBtn) addStudentBtn.style.display = 'block';
    if (updateStudentBtn) updateStudentBtn.style.display = 'none';
    if (deleteStudentBtn) deleteStudentBtn.style.display = 'none';
    if (clearStudentBtn) clearStudentBtn.style.display = 'block';
    
    // Remove selection styling from list
    filterStudentsByTab();
    
    console.log('✅ Form cleared and reset to Add mode');
}

function printStudentQR() {
    if (!selectedStudentForEdit) return;
    alert('🖨️ Print QR Code\n\nStudent: ' + selectedStudentForEdit.name + '\nID: ' + selectedStudentForEdit.id + '\n\nIn a real app, this would open a print dialog with the QR code.');
}

function generateStudentId(grade) {
    const year = new Date().getFullYear();
    const gradeStudents = appData.students.filter(s => s.grade === grade);
    const nextNumber = String(gradeStudents.length + 1).padStart(3, '0');
    return `${year}${grade}${nextNumber}`;
}
        
function showQRCodeForCurrentStudent() {    
    if (!selectedStudentForEdit) {        
        alert('No student selected');        
        return;    
    }
        
    showQRCode(selectedStudentForEdit);
}

console.log('✅ Students.js loaded (with class support)');
