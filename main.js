// State management
const state = {
    courses: [], // Kursları tutan dizi
    students: [], // Öğrencileri tutan dizi
    filters: { // Filtreleme seçenekleri
        courseId: '', // Seçilen kurs ID'si
        type: 'all' // Filtreleme türü (tümü, geçti, kaldı)
    },
    editing: null // Düzenlenen öğrencinin ID'sini tutacak
};

// Constants
const GRADE_POINTS = { // Harf notlarının puan karşılıkları
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
};

// Notlandırma ölçekleri
const GRADING_SCALES = {
    '10': [ // 10 üzerinden notlandırma
        { min: 90, grade: 'A' },
        { min: 80, grade: 'B' },
        { min: 70, grade: 'C' },
        { min: 60, grade: 'D' }
    ],
    '7': [ // 7 üzerinden notlandırma
        { min: 93, grade: 'A' },
        { min: 85, grade: 'B' },
        { min: 77, grade: 'C' },
        { min: 69, grade: 'D' }
    ]
};

// Yardımcı fonksiyonlar
const calculateTotalScore = (midterm, final) => (midterm * 0.4) + (final * 0.6); // Ortalamayı hesaplar

const calculateGrade = (midterm, final, course) => {
    const totalScore = calculateTotalScore(midterm, final); // Toplam puanı hesapla
    const scale = GRADING_SCALES[course.gradingSystem]; // Kursun notlandırma ölçeğini al
    
    // Notu belirlemek için ölçek üzerinden geç
    for (const { min, grade } of scale) {
        if (totalScore >= min) return grade; // Geçerli notu döndür
    }
    return 'F'; // Hiçbir koşul sağlanmazsa 'F' döndür
};

const calculateGPA = grades => {
    if (!grades.length) return '0.00'; // Eğer not yoksa 0.00 döndür
    const total = grades.reduce((sum, grade) => sum + GRADE_POINTS[grade], 0); // Toplam puanı hesapla
    return (total / grades.length).toFixed(2); // GPA'yı hesapla ve iki ondalık basamağa yuvarla
};

// DOM yardımcı fonksiyonları
const getElement = id => document.getElementById(id); // Belirtilen ID'ye sahip DOM elemanını al
const getCurrentGradingSystem = () => getElement('gradingSystem').checked ? "7" : "10"; // Geçerli notlandırma sistemini al

const createElementWithHTML = (tag, className, html) => {
    const element = document.createElement(tag); // Yeni bir DOM elemanı oluştur
    if (className) element.className = className; // Sınıf adı ekle
    if (html) element.innerHTML = html; // HTML içeriği ekle
    return element; // Oluşturulan elemanı döndür
};

// UI güncelleme fonksiyonları
const showSection = sectionId => {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden'); // Tüm bölümleri gizle
    });
    getElement(sectionId).classList.remove('hidden'); // Belirtilen bölümü göster
};

const updateCourseSelect = () => {
    const select = getElement('courseSelect'); // Kurs seçim elemanını al
    select.innerHTML = '<option value="">Select Course</option>' + // Varsayılan seçenek
        state.courses.map(course => 
            `<option value="${course.id}">${course.name}</option>` // Kursları ekle
        ).join('');
};

// Kurs filtreleme güncelleme fonksiyonu
const updateCourseFilter = () => {
    const courseFilter = getElement('courseFilter'); // Kurs filtreleme elemanını al
    if (courseFilter) {
        const selectedValue = courseFilter.value || state.filters.courseId; // Seçili değeri al
        courseFilter.innerHTML = '<option value="">All Courses</option>' + // Varsayılan seçenek
            state.courses.map(course => 
                `<option value="${course.id}">${course.name}</option>` // Kursları ekle
            ).join('');
        courseFilter.value = selectedValue; // Seçili değeri ayarla
    }
};

// Kurs istatistiklerini gösterme fonksiyonu
const displayCourseStatistics = (courseId) => {
    const course = state.courses.find(c => c.id === courseId); // Belirtilen kursu bul
    const courseStudents = state.students.filter(s => s.courseId === courseId); // Kursa kayıtlı öğrencileri bul
    
    const existingStats = document.querySelector(`#stats-${courseId}`); // Mevcut istatistikleri kontrol et
    if (existingStats) {
        existingStats.remove(); // Varsa mevcut istatistikleri kaldır
        return;
    }
    
    // İstatistikleri hesapla
    const stats = {
        total: courseStudents.length, // Toplam öğrenci sayısı
        passed: courseStudents.filter(s => s.grade !== 'F').length, // Geçen öğrenci sayısı
        failed: courseStudents.filter(s => s.grade === 'F').length, // Kalan öğrenci sayısı
        average: courseStudents.length ? 
            courseStudents.reduce((sum, s) => sum + calculateTotalScore(s.midterm, s.final), 0) / courseStudents.length : 0 // Sınıf ortalaması
    };

    // İstatistikleri DOM'a ekle
    const details = createElementWithHTML('div', 'stats', `
        <h3>
            <input type="text" value="${course.name}" id="editCourseName-${courseId}" />
            <button onclick="updateCourseName('${courseId}')">Update</button>
        </h3>
        <p>Total Students: ${stats.total}</p>
        <p>Passed Students: ${stats.passed}</p>
        <p>Failed Students: ${stats.failed}</p>
        <p>Class Average: ${stats.average.toFixed(2)}</p>
    `);
    details.id = `stats-${courseId}`; // ID ayarla

    const courseCard = document.querySelector(`[onclick="showCourseDetails('${courseId}')"]`).closest('.student-card'); // Kurs kartını bul
    courseCard.after(details); // İstatistikleri kartın altına ekle
};

// Yeni fonksiyon: Kurs adını güncelle
const updateCourseName = (courseId) => {
    const newName = getElement(`editCourseName-${courseId}`).value; // Yeni kurs adını al
    const course = state.courses.find(c => c.id === courseId); // Kursu bul
    if (course) {
        course.name = newName; // Kurs adını güncelle
        
        // Öğrencilerin ders adını güncelle
        state.students.forEach(student => {
            if (student.courseId === courseId) {
                student.courseName = newName; // Öğrencinin ders adını güncelle
            }
        });

        displayCourses(); // Kursları güncelle
        displayStudents(); // Öğrencileri güncelle
    }
};

// Kursları gösterme fonksiyonu
const displayCourses = () => {
    const coursesList = getElement('coursesList'); // Kurs listesini al
    coursesList.innerHTML = '<h3>Courses</h3>' + // Başlık ekle
        state.courses.map(course => `
            <div class="student-card">
                <h3>${course.name}</h3>
                <p>Total Students: ${state.students.filter(s => s.courseId === course.id).length}</p>
                <button onclick="showCourseDetails('${course.id}')">View Details</button>
                <button onclick="deleteCourse('${course.id}')">Delete Course</button>
            </div>
        `).join('');

    updateCourseFilter(); // Kurs filtrelemesini güncelle
};

// Filtrelenmiş öğrencileri alma fonksiyonu
const getFilteredStudents = () => {
    let filtered = state.students; // Tüm öğrencileri al
    
    // Eğer kurs filtresi varsa, filtrele
    if (state.filters.courseId) {
        filtered = filtered.filter(student => student.courseId === state.filters.courseId);
    }
    
    // Eğer tür filtresi 'tümü' değilse, geçme durumuna göre filtrele
    if (state.filters.type !== 'all') {
        const currentSystem = getCurrentGradingSystem(); // Geçerli notlandırma sistemini al
        filtered = filtered.filter(student => {
            const isPassing = calculateGrade(student.midterm, student.final, 
                { gradingSystem: currentSystem }) !== 'F'; // Geçme durumunu kontrol et
            return state.filters.type === 'passed' ? isPassing : !isPassing; // Geçen veya kalan öğrencileri döndür
        });
    }
    
    return filtered; // Filtrelenmiş öğrencileri döndür
};

// Kurs filtreleme ayarlama fonksiyonu
const setupCourseFilter = () => {
    // Mevcut course filter'ı kontrol et
    let courseFilter = getElement('courseFilter');
    
    // Eğer yoksa oluştur
    if (!courseFilter) {
        courseFilter = createElementWithHTML('select', 'course-filter', 
            '<option value="">All Courses</option>' + // Varsayılan seçenek
            state.courses.map(course => 
                `<option value="${course.id}">${course.name}</option>` // Kursları ekle
            ).join('')
        );
        courseFilter.id = 'courseFilter'; // ID ayarla
        
        // Course filter change event
        courseFilter.addEventListener('change', (e) => {
            state.filters.courseId = e.target.value; // Seçilen kursu filtrele
            displayStudents(); // Öğrencileri göster
        });
        
        // Filter bölümüne ekle
        const filtersSection = document.querySelector('.filters');
        filtersSection.insertBefore(courseFilter, filtersSection.firstChild); // Filtre bölümüne ekle
    }
};

// Öğrencileri gösterme fonksiyonu
const displayStudents = () => {
    const studentsList = getElement('studentsList'); // Öğrenci listesini al
    const currentSystem = getCurrentGradingSystem(); // Geçerli notlandırma sistemini al
    
    // Course filter'ı güncelle/oluştur
    setupCourseFilter();
    
    const filteredStudents = getFilteredStudents(); // Filtrelenmiş öğrencileri al
    
    // Öğrenci tablosunu oluştur
    studentsList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Midterm</th>
                    <th>Final</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredStudents.map(student => {
                    const course = state.courses.find(c => c.id === student.courseId); // Öğrencinin kursunu bul
                    const totalScore = calculateTotalScore(student.midterm, student.final); // Toplam puanı hesapla
                    const grade = calculateGrade(student.midterm, student.final, 
                        { gradingSystem: currentSystem }); // Notu hesapla
                    
                    return `
                        <tr>
                            <td>${student.id}</td>
                            <td>${student.name} ${student.surname}</td>
                            <td>${course.name}</td>
                            <td>${student.midterm}</td>
                            <td>${student.final}</td>
                            <td>${totalScore.toFixed(2)}</td>
                            <td class="grade-cell" data-student-id="${student.id}">
                                <span class="grade-${grade}">${grade}</span>
                            </td>
                            <td>
                                <button onclick="deleteStudent('${student.id}')">Delete</button>
                                <button onclick="editStudent('${student.id}')">Edit</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    updateFilterButtons(); // Filtre butonlarını güncelle
};

// Filtre butonlarını güncelleme fonksiyonu
const updateFilterButtons = () => {
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.toggle('active', 
            btn.getAttribute('onclick')?.includes(`'${state.filters.type}'`)); // Aktif butonu belirle
    });
};

// Olay işleyicileri
const handleAddCourse = event => {
    event.preventDefault(); // Varsayılan davranışı engelle

    const courseName = getElement('courseName').value.trim(); // Kurs adını al
    
    // Aynı isimli kurs var mı kontrol et
    if (state.courses.some(c => c.name.toLowerCase() === courseName.toLowerCase())) {
        alert(`Course "${courseName}" already exists!`);
        return;
    }

    // Form validasyonu
    if (!courseName) {
        alert('Please enter a course name.');
        return;
    }

    const course = {
        id: Date.now().toString(), // Kurs ID'si
        name: getElement('courseName').value, // Kurs adı
        gradingSystem: getElement('gradingSystem').value // Notlandırma sistemi
    };
    
    state.courses.push(course); // Kursu duruma ekle
    updateCourseSelect(); // Kurs seçim listesini güncelle
    displayCourses(); // Kursları göster
    event.target.reset(); // Formu sıfırla
};

const handleAddStudent = event => {
    event.preventDefault();
    
    const studentId = getElement('studentId').value;

    // Eğer düzenleme modu değilse ve aynı ID'li öğrenci varsa hata ver
    if (!state.editing && state.students.some(s => s.id === studentId)) {
        alert(`Student with ID ${studentId} already exists!`);
        return;
    }
    
    const formData = {
        courseId: getElement('courseSelect').value,
        midterm: Number(getElement('midtermScore').value),
        final: Number(getElement('finalScore').value)
    };
    
    const course = state.courses.find(c => c.id === formData.courseId);
    
    const student = {
        id: studentId,
        name: getElement('studentName').value,
        surname: getElement('studentSurname').value,
        ...formData,
        grade: calculateGrade(formData.midterm, formData.final, course)
    };

    // Form validasyonu
    if (!student.name || !student.surname || !student.courseId || 
        student.midterm < 0 || student.midterm > 100 || 
        student.final < 0 || student.final > 100) {
        alert('Please fill all fields correctly. Scores must be between 0 and 100.');
        return;
    }

    if (state.editing) {
        // Düzenleme modundaysa, öğrenciyi güncelle
        const studentIndex = state.students.findIndex(s => s.id === state.editing);
        if (studentIndex !== -1) {
            state.students[studentIndex] = student;
        }
        state.editing = null;
    } else {
        // Yeni öğrenci ekleme modu
        state.students.push(student);
    }
    
    displayStudents();
    event.target.reset();

    // Reset butonunu "Add Student" olarak değiştir
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Add Student';
    }
};

const handleSearch = event => {
    const searchTerm = event.target.value.toLowerCase(); // Arama terimini al
    const searchResults = getElement('searchResults'); // Arama sonuçlarını al
    
    if (!searchTerm) {
        searchResults.innerHTML = ''; // Arama terimi yoksa sonuçları temizle
        return;
    }
    
    // Arama sonuçlarını filtrele
    const matchingStudents = state.students.filter(student => 
        (student.name.toLowerCase().includes(searchTerm) ||
        student.surname.toLowerCase().includes(searchTerm) ||
        student.id.includes(searchTerm)) &&
        (!state.filters.courseId || student.courseId === state.filters.courseId) // Kurs filtresine göre kontrol et
    );
    
    // Arama sonuçlarını DOM'a ekle
    searchResults.innerHTML = matchingStudents.map(student => {
        const course = state.courses.find(c => c.id === student.courseId); // Öğrencinin kursunu bul
        const totalScore = calculateTotalScore(student.midterm, student.final); // Toplam puanı hesapla
        const grade = calculateGrade(student.midterm, student.final, 
            { gradingSystem: getCurrentGradingSystem() }); // Notu hesapla
        
        return `
            <div class="student-card">
                <h3>${student.name} ${student.surname}</h3>
                <p>Student ID: ${student.id}</p>
                <p>Course: ${course.name}</p>
                <p>Total Score: ${totalScore.toFixed(2)}</p>
                <p>Grade: ${grade}</p>
            </div>
        `;
    }).join('');
};

// CRUD işlemleri
const deleteStudent = studentId => {
    state.students = state.students.filter(s => s.id !== studentId); // Öğrenciyi sil
    displayStudents(); // Öğrencileri göster
};

const deleteCourse = courseId => {
    state.courses = state.courses.filter(c => c.id !== courseId); // Kursu sil
    state.students = state.students.filter(s => s.courseId !== courseId); // Kursa bağlı öğrencileri sil
    updateCourseSelect(); // Kurs seçim listesini güncelle
    displayCourses(); // Kursları göster

    // Eğer silinen kurs filtredeyse, filtreyi sıfırla
    if (state.filters.courseId === courseId) {
        state.filters.courseId = '';
        const courseFilter = getElement('courseFilter');
        if (courseFilter) {
            courseFilter.value = ''; // Filtre değerini sıfırla
        }
        displayStudents(); // Öğrencileri göster
    }

    displayStudents()
};

const editStudent = studentId => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;
    
    // Düzenleme modunu ayarla
    state.editing = studentId;
    
    // Form alanlarını doldur
    ['courseId', 'id', 'name', 'surname', 'midterm', 'final'].forEach(field => {
        const elementId = field === 'courseId' ? 'courseSelect' : 
            field === 'midterm' ? 'midtermScore' :
            field === 'final' ? 'finalScore' :
            `student${field.charAt(0).toUpperCase() + field.slice(1)}`;
        getElement(elementId).value = student[field];
    });
    
    // Submit butonunu "Update Student" olarak değiştir
    const form = getElement('studentId').closest('form');
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Update Student';
    }
    
    // Formu görünür yap ve scroll
    showSection('addStudentSection');
    form.scrollIntoView({ behavior: 'smooth' });
};

// Başlangıç verilerini oluşturma fonksiyonu
const createInitialData = () => {
    const defaultCourses = [
        { name: "Mathematics 101", gradingSystem: "10" },
        { name: "Physics 101", gradingSystem: "7" },
        { name: "Computer Science 101", gradingSystem: "10" },
        { name: "Chemistry 101", gradingSystem: "7" },
        { name: "Biology 101", gradingSystem: "10" }
    ];

    const firstNames = ["Ali", "Ayşe", "Mehmet", "Zeynep", "Can", "Elif", "Ahmet", "Deniz", "Ece", "Burak"];
    const lastNames = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Öztürk", "Arslan", "Doğan", "Yıldız", "Aydın"];

    // Varsayılan kursları duruma ekle
    defaultCourses.forEach(course => {
        state.courses.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // Benzersiz ID oluştur
            ...course // Kurs bilgilerini ekle
        });
    });

    // 20 rastgele öğrenci oluştur
    Array.from({ length: 20 }).forEach((_, i) => {
        const randomCourse = state.courses[Math.floor(Math.random() * state.courses.length)]; // Rastgele bir kurs seç
        const midterm = Math.floor(Math.random() * 101); // Rastgele vize notu
        const final = Math.floor(Math.random() * 101); // Rastgele final notu

        state.students.push({
            id: "2023" + (i + 1).toString().padStart(3, '0'), // Öğrenci ID'si
            name: firstNames[Math.floor(Math.random() * firstNames.length)], // Rastgele isim
            surname: lastNames[Math.floor(Math.random() * lastNames.length)], // Rastgele soyisim
            courseId: randomCourse.id, // Seçilen kurs ID'si
            midterm,
            final,
            grade: calculateGrade(midterm, final, randomCourse) // Notu hesapla
        });
    });

    // UI'yı başlat
    updateCourseSelect(); // Kurs seçim listesini güncelle
    displayCourses(); // Kursları göster
    displayStudents(); // Öğrencileri göster
    
    // Filtre veri özelliklerini ayarla
    ['all', 'passed', 'failed'].forEach((filter, index) => {
        const button = document.querySelector(`.filters button:nth-child(${index + 1})`);
        if (button) button.dataset.filter = filter; // Filtre butonlarına veri özelliklerini ekle
    });
};

// Olay dinleyicileri
document.addEventListener('DOMContentLoaded', createInitialData); // Sayfa yüklendiğinde başlangıç verilerini oluştur

getElement('gradingSystem').addEventListener('change', () => {
    displayStudents(); // Notlandırma sistemi değiştiğinde öğrencileri göster
});

// Filtre işleme fonksiyonu
const filterStudents = type => {
    state.filters.type = type; // Filtre türünü ayarla
    displayStudents(); // Öğrencileri göster
};

// Kurs detaylarını gösterme fonksiyonu
const showCourseDetails = courseId => {
    displayCourseStatistics(courseId); // Kurs istatistiklerini göster
};
