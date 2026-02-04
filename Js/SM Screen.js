        // ============================================
        // STUDENT MANAGEMENT - UPDATED VERSION
        // ============================================

        let currentSelectedGradeTab = 'all';
        let selectedStudentForEdit = null;

        function loadStudentsScreen() {
            populateStudentGradeDropdown();
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
        
            if (students.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 40px;">No students found</p>';        
                return;    
            }
        
            listContainer.innerHTML = students.map(s => `                    
                <div class="student-card ${selectedStudentForEdit?.id === s.id ? 'selected' : ''}"                             
                    onclick='selectStudentForEdit(${JSON.stringify(s).replace(/'/g, "&apos;")})'>                            
                    <div style="display: flex; justify-content: space-between; align-items: center;">                                    
                        <div style="flex: 1;">                                
                            <div class="student-card-name">${s.name}</div>                                            
                            <div class="student-card-details">                                            
                                ID: ${s.id}<br>                                                    
                                Grade ${s.grade} - Class ${s.class || 'N/A'} | ${s.gender || 'N/A'}<br>                                                    
                                Parent: ${s.parentPhone || 'N/A'}   
                            </div>                                
                        </div>                    
                        <button onclick='event.stopPropagation(); showQRCode(${JSON.stringify(s).replace(/'/g, "&apos;")})'                         
                                style="background: #2563EB; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">                    
                            📱 QR                                    
                        </button>            
                    </div>
                </div>        
            `).join(''); 
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
    
               // ⭐ SHOW/HIDE BUTTONS - THIS IS THE FIX
               const addStudentBtn = document.getElementById('addStudentBtn');
               const updateStudentBtn = document.getElementById('updateStudentBtn');
               const deleteStudentBtn = document.getElementById('deleteStudentBtn');
               const clearStudentBtn = document.getElementById('clearStudentBtn');
    
               console.log('🔘 Button elements:', {
                   addBtn: addStudentBtn ? 'found' : 'NOT FOUND',
                   updateBtn: updateStudentBtn ? 'found' : 'NOT FOUND',
                   deleteBtn: deleteStudentBtn ? 'found' : 'NOT FOUND',
                   clearBtn: clearStudentBtn ? 'found' : 'NOT FOUND' 
               });
       
               // Hide Add button    
               if (addStudentBtn) {                            
                       addStudentBtn.style.display = 'none';      
                       console.log('✅ Add button hidden');    
               }
       
               // Show Update button   
               if (updateStudentBtn) {    
                       updateStudentBtn.style.display = 'block';    
                       console.log('✅ Update button shown');    
               }
        
               // Show Delete button    
               if (deleteStudentBtn) {        
                       deleteStudentBtn.style.display = 'block';      
                       console.log('✅ Delete button shown');    
               }
        
               // Keep Clear button visible    
               if (clearStudentBtn) {        
                       clearStudentBtn.style.display = 'block';        
                       console.log('✅ Clear button shown');    
               }
       
               // Update selected styling in list    
               filterStudentsByTab();    
    
               console.log('✅ Student selected for editing:', student.name);
       }

        function addNewStudent() {
           
            if (!canAddStudent()) {        
                return;    
            }

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
                alert('Please enter student name');
                return;
            }
            if (!birthday) {
                alert('Please select birthday');
                return;
            }
            if (!gender) {
                alert('Please select gender');
                return;
            }
            if (!studentClass) {
                alert('Please select class');
                return;
            }
            if (!grade) {
                alert('Please select grade');
                return;
            }
            if (!parentPhone) {
                alert('Please enter parent\'s phone number');
                return;
            }
            
            // Generate student ID
            const studentId = generateStudentId(grade);
            
            // Create student object
            const newStudent = {
                id: studentId,
                name: name,
                birthday: birthday,
                gender: gender,
                class: studentClass,
                grade: grade,
                studentPhone: studentPhone,
                parentPhone: parentPhone,
                qrCode: studentId
            };
            
            // Add to appData 
            appData.students.push(newStudent);
    
            // ⭐ Save to Firebase - User-specific path
            saveData();  // This saves to /users/{currentUserId}/data
    
            
            // Refresh display
            filterStudentsByTab();
            clearStudentForm();
            
            alert('✅ Student added successfully!\n\nStudent ID: ' + studentId);
        }

        function updateExistingStudent() {
            if (!selectedStudentForEdit) return;
            
            // Get form values
            const name = document.getElementById('studentNameInput').value.trim();
            const birthday = document.getElementById('studentBirthdayInput').value;
            const gender = document.getElementById('studentGenderInput').value;
            const studentClass = document.getElementById('studentClassInput').value;
            const grade = document.getElementById('studentGradeInput').value;
            const studentPhone = document.getElementById('studentPhoneInput').value.trim();
            const parentPhone = document.getElementById('parentPhoneInput').value.trim();
            
            // Validation
            if (!name || !birthday || !gender || !studentClass || !grade || !parentPhone) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Update student
            appData.students = appData.students.map(s => {
                if (s.id === selectedStudentForEdit.id) {
                    return {
                        ...s,
                        name: name,
                        birthday: birthday,
                        gender: gender,
                        class: studentClass,
                        grade: grade,
                        studentPhone: studentPhone,
                        parentPhone: parentPhone
                    };
                }
                return s;
            });
            
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
    
            // ⭐ RESET BUTTONS - THIS IS THE FIX
            const addStudentBtn = document.getElementById('addStudentBtn');
            const updateStudentBtn = document.getElementById('updateStudentBtn');
            const deleteStudentBtn = document.getElementById('deleteStudentBtn');
            const clearStudentBtn = document.getElementById('clearStudentBtn');
    
            console.log('🔘 Resetting button visibility...');
    
            // Show Add button
            if (addStudentBtn) {
                addStudentBtn.style.display = 'block';
                console.log('✅ Add button shown');
            }
    
            // Hide Update button
            if (updateStudentBtn) {
                updateStudentBtn.style.display = 'none';
                console.log('✅ Update button hidden');
            }
    
            // Hide Delete button
            if (deleteStudentBtn) {
                deleteStudentBtn.style.display = 'none';
                console.log('✅ Delete button hidden');
            }
    
            // Keep Clear button visible
            if (clearStudentBtn) {
                clearStudentBtn.style.display = 'block';
                console.log('✅ Clear button shown');
            }
    
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

// ============================================
// DIAGNOSTIC SCRIPT - RUN IN BROWSER CONSOLE
// This will help identify the button visibility issue
// ============================================

// Run this in your browser console to check button setup
function diagnoseStudentButtons() {
    console.log('🔍 DIAGNOSING STUDENT BUTTONS...');
    console.log('================================');
    
    const addBtn = document.getElementById('addStudentBtn');
    const updateBtn = document.getElementById('updateStudentBtn');
    const deleteBtn = document.getElementById('deleteStudentBtn');
    const clearBtn = document.getElementById('clearStudentBtn');
    
    console.log('\n📋 BUTTON ELEMENTS:');
    console.log('Add button:', addBtn);
    console.log('Update button:', updateBtn);
    console.log('Delete button:', deleteBtn);
    console.log('Clear button:', clearBtn);
    
    if (!addBtn) console.error('❌ Add button NOT FOUND - Check HTML id="addStudentBtn"');
    if (!updateBtn) console.error('❌ Update button NOT FOUND - Check HTML id="updateStudentBtn"');
    if (!deleteBtn) console.error('❌ Delete button NOT FOUND - Check HTML id="deleteStudentBtn"');
    if (!clearBtn) console.error('❌ Clear button NOT FOUND - Check HTML id="clearStudentBtn"');
    
    console.log('\n🎨 CURRENT STYLES:');
    if (addBtn) {
        console.log('Add button display:', window.getComputedStyle(addBtn).display);
        console.log('Add button visibility:', window.getComputedStyle(addBtn).visibility);
    }
    if (updateBtn) {
        console.log('Update button display:', window.getComputedStyle(updateBtn).display);
        console.log('Update button visibility:', window.getComputedStyle(updateBtn).visibility);
    }
    if (deleteBtn) {
        console.log('Delete button display:', window.getComputedStyle(deleteBtn).display);
        console.log('Delete button visibility:', window.getComputedStyle(deleteBtn).visibility);
    }
    
    console.log('\n📝 EXPECTED BEHAVIOR:');
    console.log('- Add mode: Add=visible, Update=hidden, Delete=hidden');
    console.log('- Edit mode: Add=hidden, Update=visible, Delete=visible');
    
    console.log('\n🔧 TESTING BUTTON TOGGLE:');
    
    // Test hiding Add button
    if (addBtn) {
        console.log('Testing: Hide Add button...');
        addBtn.style.display = 'none';
        console.log('Result:', window.getComputedStyle(addBtn).display);
    }
    
    // Test showing Update button
    if (updateBtn) {
        console.log('Testing: Show Update button...');
        updateBtn.style.display = 'block';
        console.log('Result:', window.getComputedStyle(updateBtn).display);
    }
    
    // Test showing Delete button
    if (deleteBtn) {
        console.log('Testing: Show Delete button...');
        deleteBtn.style.display = 'block';
        console.log('Result:', window.getComputedStyle(deleteBtn).display);
    }
    
    console.log('\n✅ DIAGNOSTIC COMPLETE');
    console.log('================================');
    
    // Reset buttons after test
    setTimeout(() => {
        if (addBtn) addBtn.style.display = 'block';
        if (updateBtn) updateBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        console.log('🔄 Buttons reset to default state');
    }, 2000);
}

// Run the diagnostic
diagnoseStudentButtons();
