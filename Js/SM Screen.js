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
            selectedStudentForEdit = student;
            
            // Fill form with student data
            document.getElementById('studentFormTitle').textContent = 'Edit Student';
            document.getElementById('studentNameInput').value = student.name;
            document.getElementById('studentBirthdayInput').value = student.birthday || '';
            document.getElementById('studentGenderInput').value = student.gender || '';
            document.getElementById('studentClassInput').value = student.class || '';
            document.getElementById('studentGradeInput').value = student.grade;
            document.getElementById('studentPhoneInput').value = student.studentPhone || '';
            document.getElementById('parentPhoneInput').value = student.parentPhone || '';
            
            // Show student ID and QR
            document.getElementById('studentIdDisplay').value = student.id;
            document.getElementById('qrCodeDisplay').textContent = student.id;
            document.getElementById('studentIdDisplaySection').style.display = 'block';
            
            // Show/hide buttons
            document.getElementById('addStudentBtn').style.display = 'none';
            document.getElementById('updateStudentBtn').style.display = 'block';
            document.getElementById('deleteStudentBtn').style.display = 'block';
            
            // Update selected styling
            filterStudentsByTab();
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
            selectedStudentForEdit = null;
            
            document.getElementById('studentFormTitle').textContent = 'Add New Student';
            document.getElementById('studentNameInput').value = '';
            document.getElementById('studentBirthdayInput').value = '';
            document.getElementById('studentGenderInput').value = '';
            document.getElementById('studentClassInput').value = '';
            document.getElementById('studentGradeInput').value = '';
            document.getElementById('studentPhoneInput').value = '';
            document.getElementById('parentPhoneInput').value = '';
            
            document.getElementById('studentIdDisplaySection').style.display = 'none';
            
            document.getElementById('addStudentBtn').style.display = 'block';
            document.getElementById('updateStudentBtn').style.display = 'none';
            document.getElementById('deleteStudentBtn').style.display = 'none';
            
            filterStudentsByTab();
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