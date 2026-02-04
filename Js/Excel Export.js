        // ============================================    
        // EXCEL EXPORT    
        // ============================================
    
        function exportToExcel() {            
            const type = document.getElementById('reportType').value;            
            const month = document.getElementById('reportMonth').value;            
            const grade = document.getElementById('reportGrade').value;
                
            if (!month) {                    
                alert('⚠️ Please select a month first');                    
                return;            
            }
                
            if (type === 'attendance') {                    
                exportAttendanceToExcel(month, grade);            
            } else if (type === 'payment') {                    
                exportPaymentToExcel(month, grade);            
            }    
        }
    
        function exportAttendanceToExcel(month, grade) {            
            const students = grade === 'all' ? appData.students : appData.students.filter(s => s.grade === grade);
                
            // Prepare data            
            const data = [];
                
            // Add headers            
            data.push(['Student ID', 'Name', 'Grade', 'Present Days', 'Absent Days', 'Attendance Rate']);
        
        
            // Add student rows            
            students.forEach(s => {                    
                let presentDays = 0;                    
                let totalDays = 0;
                            
                Object.keys(appData.attendance || {}).forEach(date => {                            
                    if (date.startsWith(month)) {                                    
                        totalDays++;                                    
                        if (appData.attendance[date][s.id] === 'present') {                    
                        presentDays++;                
                        }                            
                    }        
                });
                            
                const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                    
                data.push([                        
                    s.id,                                        
                    s.name,                           
                    'Grade ' + s.grade,                            
                    presentDays,                            
                    totalDays - presentDays,                            
                    rate + '%'                    
                ]);            
            });
                
            // Create workbook            
            const wb = XLSX.utils.book_new();            
            const ws = XLSX.utils.aoa_to_sheet(data);
                
            // Set column widths            
            ws['!cols'] = [
                { wch: 15 }, // Student ID                    
                { wch: 25 }, // Name                    
                { wch: 10 }, // Grade                    
                { wch: 12 }, // Present                    
                { wch: 12 }, // Absent                    
                { wch: 15 }  // Rate           
            ];
               
            XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
                
            // Save file            
            const filename = `Attendance_Report_${month}_${grade === 'all' ? 'All_Grades' : 'Grade_' + grade}.xlsx`;            
            XLSX.writeFile(wb, filename);
                
            alert('✅ Excel file downloaded!\n\nFile: ' + filename);    
        }
    
        function exportPaymentToExcel(month, grade) {            
            const students = grade === 'all' ? appData.students : appData.students.filter(s => s.grade === grade);
                
            // Prepare data            
            const data = [];
                
            // Add headers            
            data.push(['Student ID', 'Name', 'Grade', 'Amount Paid', 'Status']);
                
            let totalCollected = 0;
                
            // Add student rows            
            students.forEach(s => {                    
                const monthPayments = (appData.payments || []).filter(p =>                             
                    p.studentId === s.id && p.month === month                
                );
                    
                const amount = monthPayments.reduce((sum, p) => sum + p.amount, 0);            
                const status = monthPayments.length > 0 ? 'Paid' : 'Unpaid';
                    
                if (amount > 0) totalCollected += amount;
                    
                data.push([
                    s.id,                            
                    s.name,                            
                    'Grade ' + s.grade,                           
                    'Rs. ' + amount.toFixed(2),                            
                    status                    
                ]);            
            });    
        
            // Add total row            
            data.push([]);           
            data.push(['', '', '', 'Total Collected:', 'Rs. ' + totalCollected.toFixed(2)]);
                
            // Create workbook            
            const wb = XLSX.utils.book_new();            
            const ws = XLSX.utils.aoa_to_sheet(data);
                
            // Set column widths    
            ws['!cols'] = [
                { wch: 15 }, // Student ID                    
                { wch: 25 }, // Name                    
                { wch: 10 }, // Grade                    
                { wch: 15 }, // Amount                    
                { wch: 10 }  // Status            
            ];
                
            XLSX.utils.book_append_sheet(wb, ws, 'Payment Report');
                
            // Save file            
            const filename = `Payment_Report_${month}_${grade === 'all' ? 'All_Grades' : 'Grade_' + grade}.xlsx`;            
            XLSX.writeFile(wb, filename);
                
            alert('✅ Excel file downloaded!\n\nFile: ' + filename);    
        }
    
        // Export Student List    
        function exportStudentListToExcel() {            
            const data = [];
                
            // Add headers            
            data.push(['Student ID', 'Name', 'Birthday', 'Gender', 'Class', 'Grade', 'Student Phone', 'Parent Phone']);
                
            // Add student rows            
            appData.students.forEach(s => {                    
                data.push([
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
                
            // Create workbook            
            const wb = XLSX.utils.book_new();            
            const ws = XLSX.utils.aoa_to_sheet(data);
                
            // Set column widths            
            ws['!cols'] = [
                { wch: 15 },                    
                { wch: 25 },                    
                { wch: 12 },                    
                { wch: 10 },                    
                { wch: 8 },                    
                { wch: 10 },                    
                { wch: 15 },                    
                { wch: 15 }            
            ];
                
            XLSX.utils.book_append_sheet(wb, ws, 'Student List');        
        
            // Save file            
            XLSX.writeFile(wb, 'Student_List.xlsx');       
        
            alert('✅ Student list exported to Excel!');    
        }

        // ============================================
        // EXPORT STUDENTS FUNCTIONS (WITHOUT QR CARDS)
        // ============================================

        // Export all students to Excel
        function exportStudentsToExcel() {    
            try {        
                const students = appData.students;
        
        
                if (students.length === 0) {            
                    alert('⚠️ No students to export!\n\nPlease add students first.');            
                    return;        
                }
                
                // Prepare data        
                const data = [];
                
                // Add headers        
                data.push([             
                    'Student ID',            
                    'Name',            
                    'Birthday',            
                    'Age',            
                    'Gender',            
                    'Class',            
                    'Grade',            
                    'Student Phone',
                    'Parent Phone'       
                ]);
                
                // Add student rows        
                students.forEach(s => {            
                    // Calculate age from birthday            
                    let age = '';            
                    if (s.birthday) {                
                        const birthDate = new Date(s.birthday);                
                        const today = new Date();                
                        age = today.getFullYear() - birthDate.getFullYear();                
                        const monthDiff = today.getMonth() - birthDate.getMonth();                
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {                    
                            age--;                
                        }            
                    }
                        
                    data.push([
                        s.id,                
                        s.name,                
                        s.birthday || '',                
                        age,                
                        s.gender || '',                
                        s.class || '',                
                        s.grade,                                
                        s.studentPhone || '',                                
                        s.parentPhone || ''            
                    ]);        
                });
                
                // Create workbook        
                const wb = XLSX.utils.book_new();        
                const ws = XLSX.utils.aoa_to_sheet(data);
               
                // Set column widths        
                ws['!cols'] = [
                    { wch: 15 }, // Student ID            
                    { wch: 25 }, // Name            
                    { wch: 12 }, // Birthday            
                    { wch: 6 },  // Age            
                    { wch: 10 }, // Gender           
                    { wch: 8 },  // Class            
                    { wch: 8 },  // Grade            
                    { wch: 15 }, // Student Phone            
                    { wch: 15 }  // Parent Phone        
                ];        
        
                XLSX.utils.book_append_sheet(wb, ws, 'Students');        
        
                // Save file        
                const fileName = `Students_List_${new Date().toISOString().split('T')[0]}.xlsx`;        
                XLSX.writeFile(wb, fileName);       
        
                alert(`✅ Students exported successfully!\n\nFile: ${fileName}\nTotal Students: ${students.length}`);    
            } catch (error) {        
                console.error('❌ Export error:', error);        
                alert('⚠️ Error exporting students to Excel.');    
            }
        }

        // Export students grouped by grade (each grade in separate sheet)
        function exportStudentsByGrade() {    
            try {        
                if (appData.students.length === 0) {            
                    alert('⚠️ No students to export!');            
                    return;        
                }
                                
                const wb = XLSX.utils.book_new();        
                let totalExported = 0;
                
                // Create a sheet for each grade       
                appData.grades.forEach(grade => {            
                    const gradeStudents = appData.students.filter(s => s.grade === grade);            
            
                    if (gradeStudents.length > 0) {                
                        const data = [];
                                
                        // Headers                
                        data.push([
                            'Student ID',
                            'Name',
                            'Birthday',
                            'Gender',
                            'Class',
                            'Student Phone',
                            'Parent Phone'                
                        ]);
                                
                        // Students                
                        gradeStudents.forEach(s => {                    
                            data.push([
                                s.id,
                                s.name,
                                s.birthday || '',
                                s.gender || '',
                                s.class || '',
                                s.studentPhone || '',
                                s.parentPhone || ''
                            ]);
                        });
                                
                        const ws = XLSX.utils.aoa_to_sheet(data);                
                        ws['!cols'] = [
                            { wch: 15 },
                            { wch: 25 },
                            { wch: 12 },
                            { wch: 10 },
                            { wch: 8 },
                            { wch: 15 },
                            { wch: 15 }               
                        ];
                                 
                        XLSX.utils.book_append_sheet(wb, ws, `Grade ${grade}`);                
                        totalExported += gradeStudents.length;            
                    }        
                });
                
                // Save file        
                const fileName = `Students_By_Grade_${new Date().toISOString().split('T')[0]}.xlsx`;        
                XLSX.writeFile(wb, fileName);
                
                alert(`✅ Students exported by grade!\n\nFile: ${fileName}\nTotal Students: ${totalExported}\nGrades: ${appData.grades.length}`);    
            } catch (error) {        
                console.error('❌ Export error:', error);        
                alert('⚠️ Error exporting students.');    
            }
        }

        // Export only students from current selected tab
        function exportCurrentGradeStudents() {    
            try {        
                const grade = currentSelectedGradeTab;
                
                let students;        
                if (grade === 'all') {            
                    students = appData.students;        
                } else {            
                    students = appData.students.filter(s => s.grade === grade);        
                }
                
                if (students.length === 0) {            
                    alert('⚠️ No students in this grade!');            
                    return;        
                }
                
                // Prepare data        
                const data = [];
                
                // Headers       
                data.push([
                    'Student ID',
                    'Name',
                    'Birthday',
                    'Gender',
                    'Class',
                    'Student Phone',
                    'Parent Phone'
                ]);
        
                // Students
                students.forEach(s => {
                    data.push([
                        s.id,
                        s.name,
                        s.birthday || '',
                        s.gender || '',
                        s.class || '',
                        s.studentPhone || '',
                        s.parentPhone || ''
                    ]);
                });
        
                // Create workbook
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(data);
        
                // Set column widths
                ws['!cols'] = [
                    { wch: 15 },
                    { wch: 25 },
                    { wch: 12 },
                    { wch: 10 },
                    { wch: 8 },
                    { wch: 15 },
                    { wch: 15 }
                ];
        
                XLSX.utils.book_append_sheet(wb, ws, grade === 'all' ? 'All Students' : `Grade ${grade}`);
        
                // Save file
                const fileName = `Students_${grade === 'all' ? 'All' : 'Grade_' + grade}_${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(wb, fileName);
        
                alert(`✅ Exported successfully!\n\nFile: ${fileName}\nStudents: ${students.length}`);
            } catch (error) {
                console.error('❌ Export error:', error);
                alert('⚠️ Error exporting students.');
            }
        }
