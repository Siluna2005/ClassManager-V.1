        // ============================================
        // QR CODE GENERATION & DISPLAY
        // ============================================

        let currentQRStudent = null;

        function showQRCode(student) {    
            currentQRStudent = student;
        
            // Set student details    
            document.getElementById('qrStudentName').textContent = student.name;    
            document.getElementById('qrStudentDetails').textContent = `Grade ${student.grade} - Class ${student.class || 'N/A'}`;    
            document.getElementById('qrStudentId').textContent = `ID: ${student.id}`;
        
            // Clear previous QR code    
            const container = document.getElementById('qrcode-container');    
            container.innerHTML = '';
        
            // Generate new QR code    
            new QRCode(container, {        
                text: student.id,        
                width: 200,        
                height: 200,        
                colorDark: "#000000",        
                colorLight: "#ffffff",        
                correctLevel: QRCode.CorrectLevel.H    
            });
        
            // Show modal   
            document.getElementById('qrCodeDisplayModal').classList.add('active');
        }

        function closeQRCodeDisplay() {    
            document.getElementById('qrCodeDisplayModal').classList.remove('active');    
            currentQRStudent = null;
        }

        function downloadQRCode() {    
            if (!currentQRStudent) return;
        
            // Get the QR code canvas    
            const canvas = document.querySelector('#qrcode-container canvas');
        
            if (!canvas) {        
                alert('QR Code not found');        
                return;    
            }
        
            // Convert to image and download    
            const link = document.createElement('a');    
            link.download = `QR_${currentQRStudent.id}_${currentQRStudent.name}.png`;    
            link.href = canvas.toDataURL();    
            link.click();
        
            alert(`✅ QR Code downloaded!\n\nFile: QR_${currentQRStudent.id}_${currentQRStudent.name}.png`);
        }

        function downloadStudentCard() {    
            if (!currentQRStudent) return;    
    
            const student = currentQRStudent;
    
            // Create canvas - credit card size ratio    
            const canvas = document.createElement('canvas');   
            canvas.width = 800;    
            canvas.height = 500;    
            const ctx = canvas.getContext('2d');
        
            // Gradient background    
            const gradient = ctx.createLinearGradient(0, 0, 800, 500);    
            gradient.addColorStop(0, '#2563EB');    
            gradient.addColorStop(1, '#1E40AF');    
            ctx.fillStyle = gradient;    
            ctx.fillRect(0, 0, 800, 500);
        
            // White card area    
            ctx.fillStyle = '#FFFFFF';    
            ctx.roundRect(20, 60, 760, 380, 15);    
            ctx.fill();
    
    
            // Header bar    
            ctx.fillStyle = '#2563EB';    
            ctx.roundRect(20, 60, 760, 70, [15, 15, 0, 0]);    
            ctx.fill();
    
    
            // School name    
            ctx.fillStyle = '#FFFFFF';    
            ctx.font = 'bold 36px Arial';    
            ctx.textAlign = 'center';    
            ctx.fillText('STUDENT ID CARD', 400, 110);
    
    
            // Photo placeholder
    
            ctx.fillStyle = '#E5E7EB';    
            ctx.roundRect(50, 160, 180, 220, 10);    
            ctx.fill();
       
            ctx.fillStyle = '#9CA3AF';    
            ctx.font = 'bold 20px Arial';    
            ctx.textAlign = 'center';    
            ctx.fillText('PHOTO', 140, 275);
        
            // Student info section    
            ctx.fillStyle = '#1F2937';    
            ctx.font = 'bold 32px Arial';    
            ctx.textAlign = 'left';    
            ctx.fillText(student.name, 260, 195);
        
            // Details    
            ctx.fillStyle = '#4B5563';    
            ctx.font = '22px Arial';
    
    
            const details = [        
                `ID: ${student.id}`,                   
                `Grade: ${student.grade}`,                    
                `Class: ${student.class || 'N/A'}`,                    
                student.studentPhone ? `Phone: ${student.studentPhone}` : null            
            ].filter(Boolean);
                
            details.forEach((detail, index) => {
                ctx.fillText(detail, 260, 240 + (index * 35));            
            });
            
            // QR Code section        
            const qrCanvas = document.querySelector('#qrcode-container canvas');
            
            if (qrCanvas) {                    
                // QR background                    
                ctx.fillStyle = '#F9FAFB';                    
                ctx.roundRect(580, 160, 180, 180, 10);                   
                ctx.fill();
                            
                // QR Code                    
                ctx.drawImage(qrCanvas, 595, 175, 150, 150);
                            
                // QR label        
                ctx.fillStyle = '#6B7280';        
                ctx.font = '14px Arial';        
                ctx.textAlign = 'center';        
                ctx.fillText('Scan to verify', 670, 355);    
            }
        
            // Footer    
            ctx.fillStyle = '#9CA3AF';    
            ctx.font = 'italic 16px Arial';    
            ctx.textAlign = 'center';    
            ctx.fillText('Keep this card safe and bring it to class', 400, 420);
    
            // Outer border    
            ctx.strokeStyle = '#2563EB';    
            ctx.lineWidth = 3;    
            ctx.roundRect(20, 60, 760, 380, 15);   
            ctx.stroke();
    
    
            // Download    
            const link = document.createElement('a');    
            link.download = `Student_ID_${student.id}_${student.name.replace(/\s+/g, '_')}.png`;    
            link.href = canvas.toDataURL('image/png');    
            link.click();
        
            alert(`✅ ID Card Downloaded!\n\n${student.name}\nID: ${student.id}`);
        }

        // Helper function for rounded rectangles (add this too)
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {    
            if (typeof radius === 'number') {        
                radius = [radius, radius, radius, radius];    
            }
    
            this.beginPath();    
            this.moveTo(x + radius[0], y);    
            this.lineTo(x + width - radius[1], y);    
            this.quadraticCurveTo(x + width, y, x + width, y + radius[1]);    
            this.lineTo(x + width, y + height - radius[2]);    
            this.quadraticCurveTo(x + width, y + height, x + width - radius[2], y + height);    
            this.lineTo(x + radius[3], y + height);    
            this.quadraticCurveTo(x, y + height, x, y + height - radius[3]);    
            this.lineTo(x, y + radius[0]);    
            this.quadraticCurveTo(x, y, x + radius[0], y);    
            this.closePath();    
            return this;
        };

        // ============================================
        // QR CODE SCANNER - FIXED VERSION
        // ============================================

        let html5QrcodeScanner = null;
        let qrScanMode = null; // 'attendance' or 'payment'
        let isScannerRunning = false;
        let availableCameras = [];
        let currentCameraIndex = 0;
        
        function openQRScanner(mode) {                    
            qrScanMode = mode;        
            document.getElementById('qrScannerModal').classList.add('active');
                
            // Initialize scanner                    
            html5QrcodeScanner = new Html5Qrcode("qr-reader");
                
            Html5Qrcode.getCameras().then(cameras => {                                
                if (cameras && cameras.length) {                        
                    // Find back camera (environment facing)            
                    let selectedCamera = cameras[0]; // Default to first camera
                                            
                    // Try to find the back/rear camera            
                    const backCamera = cameras.find(camera =>                                     
                        camera.label.toLowerCase().includes('back') ||                                    
                        camera.label.toLowerCase().includes('rear') ||                                    
                        camera.label.toLowerCase().includes('environment')                            
                    );
                                        
                    // Use back camera if found, otherwise use first available                            
                    if (backCamera) {                                    
                        selectedCamera = backCamera;                                    
                        console.log('Using back camera:', backCamera.label);                            
                    } else {                                   
                        console.log('Back camera not found, using:', selectedCamera.label);                            
                    }
                                        
                    const cameraId = selectedCamera.id;
                                                                
                    html5QrcodeScanner.start(                                                
                        cameraId,                                                    
                        {                                                                
                            fps: 10,                                                                
                            qrbox: { width: 250, height: 250 },                                            
                            aspectRatio: 1.0,                                            
                            // Request back camera specifically                                            
                            facingMode: { ideal: "environment" }                                    
                        },                                                                        
                        onScanSuccess,                                                    
                        onScanFailure                                                        
                    ).then(() => {                                                    
                        isScannerRunning = true;                                                    
                        console.log('Scanner started successfully');                                        
                    }).catch(err => {                                                
                        console.error('Error starting scanner:', err);                                                    
                        isScannerRunning = false;                                        
                    
                        if (err.name === 'NotAllowedError') {                                                                
                            alert('❌ Camera Permission Denied\n\nPlease allow camera access in your browser settings and try again.');                                                    
                        } else {                                                                
                            alert('❌ Cannot access camera\n\nError: ' + err.message);                                                    
                        }
                                                            
                        document.getElementById('qrScannerModal').classList.remove('active');                                        
                    });                            
                           
                } else {                                        
                    alert('❌ No cameras found on this device');                                        
                    document.getElementById('qrScannerModal').classList.remove('active');                            
                }    
            
            }).catch(err => {                            
                console.error('Error getting cameras:', err);                                       
                if (err.name === 'NotAllowedError') {                                        
                    alert('❌ Camera Permission Denied\n\nPlease:\n1. Allow camera access when prompted\n2. Check browser settings\n3. Try again');                            
                } else {                                        
                    alert('❌ Error accessing camera\n\n' + err.message);                            
                }
                            
                document.getElementById('qrScannerModal').classList.remove('active');                
            });    
        }

        function switchCamera() {    
            if (!html5QrcodeScanner || !isScannerRunning) return;    
    
            // Stop current scanner    
            html5QrcodeScanner.stop().then(() => {
        
                // Switch to next camera        
                currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;        
                const nextCamera = availableCameras[currentCameraIndex];
                
                console.log('Switching to camera:', nextCamera.label);
                
                // Start with new camera        
                html5QrcodeScanner.start(            
                    nextCamera.id,             
                    {                
                        fps: 10,                
                        qrbox: { width: 250, height: 250 },                
                        aspectRatio: 1.0            
                    },            
                    onScanSuccess,            
                    onScanFailure        
                ).then(() => {            
                    console.log('Switched to:', nextCamera.label);        
                }).catch(err => {            
                    console.error('Error switching camera:', err);            
                    alert('❌ Could not switch camera');        
                });    
            });
        }

        function onScanSuccess(decodedText, decodedResult) {
            console.log('QR Code scanned:', decodedText);
        
            // Show scanned result    
            document.getElementById('qr-scanned-id').textContent = decodedText;
            document.getElementById('qr-result').style.display = 'block';
        
            // Process based on mode    
            if (qrScanMode === 'attendance') {        
                processQRForAttendance(decodedText);    
            } else if (qrScanMode === 'payment') {    
                processQRForPayment(decodedText);    
            }
        
            // Close scanner after 2 seconds    
            setTimeout(() => {        
                closeQRScanner();    
            }, 2000);
        }

        function onScanFailure(error) {
            // Scanner is trying to detect QR - this is normal, don't show errors
        }

        function closeQRScanner() {
            if (html5QrcodeScanner && isScannerRunning) {        
                html5QrcodeScanner.stop().then(() => {        
                    isScannerRunning = false;            
                    html5QrcodeScanner = null;            
                    document.getElementById('qrScannerModal').classList.remove('active');            
                    document.getElementById('qr-result').style.display = 'none';        
                    console.log('Scanner stopped successfully');        
                }).catch(err => {        
                    console.error('Error stopping scanner:', err);        
                    isScannerRunning = false;            
                    html5QrcodeScanner = null;            
                    document.getElementById('qrScannerModal').classList.remove('active');            
                    document.getElementById('qr-result').style.display = 'none';    
                });    
            } else {        
                isScannerRunning = false;        
                html5QrcodeScanner = null;        
                document.getElementById('qrScannerModal').classList.remove('active');        
                document.getElementById('qr-result').style.display = 'none';    
            }
        }

        function processQRForAttendance(studentId) {    
            const student = appData.students.find(s => s.id === studentId.trim());
        
            if (!student) {        
                alert('❌ Student not found!\n\nScanned ID: ' + studentId);        
                return;    
            }
        
            const gradeSelect = document.getElementById('attendanceClassSelect');    
            const selectedClass = gradeSelect ? gradeSelect.value : '';
        
            if (!selectedClass) {        
                alert('⚠️ Please select a class first before scanning');        
                return;    
            }
        
            if (student.grade !== selectedClass) {        
                alert(`❌ Wrong Class!\n\nStudent: ${student.name}\nStudent's Grade: ${student.grade}\nSelected Grade: ${selectedClass}`);        
                return;    
            }
        
            // Mark as present    
            currentAttendanceData[studentId.trim()] = 'present';
        
            if (currentAttendanceStudents.length === 0) {        
                loadAttendanceStudents();    
            } else {            
                displayAttendanceStudents();    
            }
        
            alert('✅ Success!\n\n' + student.name + '\nMarked as Present');
        }

        function processQRForPayment(studentId) {
            const student = appData.students.find(s => s.id === studentId.trim());
        
            if (!student) {        
                alert('❌ Student not found!\n\nScanned ID: ' + studentId);        
                return;    
            }
        
            // Fill in the payment form    
            const studentIdInput = document.getElementById('paymentStudentId');    
            const classInput = document.getElementById('paymentClass');
        
            if (studentIdInput) studentIdInput.value = studentId;    
            if (classInput) classInput.value = 'Grade ' + student.grade;
        
            alert('✅ Student Loaded!\n\n' + student.name + '\nGrade ' + student.grade + '\n\nPlease fill in payment details below.');

        }

        function manualQRInput(mode) {    
            const studentId = prompt('Enter Student ID:\n\n(Camera not working? Enter ID manually)');
        
            if (!studentId) return;
        
            if (mode === 'attendance') {        
                processQRForAttendance(studentId);    
            } else if (mode === 'payment') {        
                processQRForPayment(studentId);    
            }
        }
