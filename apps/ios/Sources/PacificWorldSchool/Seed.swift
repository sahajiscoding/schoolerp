import Foundation

enum Seed {
    static let academicYear = "2026-27"

    static let classes: [(name: String, sections: [String])] = [
        ("V", ["A"]), ("VI", ["A", "B"]), ("VII", ["A", "B"]),
        ("VIII", ["A", "B", "C"]), ("IX", ["A", "B", "C", "D", "E"]),
        ("X", ["A", "B", "C"]), ("XI", ["Science", "Commerce", "Humanities"]),
        ("XII", ["Science", "Commerce", "Humanities"])
    ]

    static let subjects: [Subject] = [
        Subject(id: "sub-ai", name: "Artificial Intelligence", code: "AI", color: "4B5D2A"),
        Subject(id: "sub-math", name: "Mathematics", code: "MATH", color: "D2691E"),
        Subject(id: "sub-eng", name: "English", code: "ENG", color: "7C3AED"),
        Subject(id: "sub-sci", name: "Science", code: "SCI", color: "0F766E"),
        Subject(id: "sub-sst", name: "Social Science", code: "SST", color: "B45309"),
        Subject(id: "sub-hin", name: "Hindi", code: "HIN", color: "BE123C")
    ]

    static let people: [Person] = [
        Person(id: "p-admin", loginID: "ADMIN001", fullName: "School Administrator", role: .admin, email: "admin@pws.local", phone: "+91 98100 00001"),
        Person(id: "p-teacher-1", loginID: "TCH001", fullName: "Teacher", role: .teacher, email: "tch001@pws.local", phone: "+91 98100 11223", classLabel: "IX", sectionLabel: "E", classTeacherOf: "IX - E"),
        Person(id: "p-teacher-2", loginID: "TCH002", fullName: "Teacher", role: .teacher, email: "tch002@pws.local", phone: "+91 98100 44556", classLabel: "IX", sectionLabel: "E"),
        Person(id: "p-student-1", loginID: "0185/18", fullName: "Student", role: .student, email: "018518@pws.local", phone: "+91 99909 23008", dob: "2010-05-14", admissionNo: "0185/18", classLabel: "IX", sectionLabel: "E", siblingID: "p-student-6"),
        Person(id: "p-student-2", loginID: "0186/18", fullName: "Student", role: .student, email: "018618@pws.local", dob: "2010-08-22", admissionNo: "0186/18", classLabel: "IX", sectionLabel: "E"),
        Person(id: "p-student-3", loginID: "0187/18", fullName: "Student", role: .student, email: "018718@pws.local", dob: "2010-02-09", admissionNo: "0187/18", classLabel: "IX", sectionLabel: "E"),
        Person(id: "p-student-4", loginID: "0188/18", fullName: "Student", role: .student, email: "018818@pws.local", dob: "2010-11-30", admissionNo: "0188/18", classLabel: "IX", sectionLabel: "E"),
        Person(id: "p-student-5", loginID: "0189/18", fullName: "Student", role: .student, email: "018918@pws.local", dob: "2010-06-18", admissionNo: "0189/18", classLabel: "IX", sectionLabel: "E"),
        Person(id: "p-student-6", loginID: "0201/18", fullName: "Student", role: .student, email: "020118@pws.local", dob: "2015-03-11", admissionNo: "0201/18", classLabel: "V", sectionLabel: "A", siblingID: "p-student-1"),
        Person(id: "p-student-7", loginID: "0190/18", fullName: "Student", role: .student, email: "019018@pws.local", dob: "2010-09-05", admissionNo: "0190/18", classLabel: "IX", sectionLabel: "D")
    ]

    static let assignments: [Assignment] = [
        Assignment(id: "hw-1", title: "AI practical file work", instructions: "Dear Students,\n\nKindly find the attached documents to complete the AI practical file.\n\nThanks", teacherID: "p-teacher-1", subject: "Artificial Intelligence", sectionLabel: "IX - E", dueDate: "2026-10-05", kind: "HOMEWORK", attachments: ["System Map Practical 2.pdf"], createdAt: Date().addingTimeInterval(-35 * 86_400)),
        Assignment(id: "hw-2", title: "Quadratic equations worksheet", instructions: "Complete exercises 4.1 to 4.4 in the worksheet. Show all steps.", teacherID: "p-teacher-2", subject: "Mathematics", sectionLabel: "IX - E", dueDate: "2026-11-08", kind: "HOMEWORK", attachments: ["Quadratic-equations.pdf"], createdAt: Date().addingTimeInterval(-4 * 86_400)),
        Assignment(id: "hw-3", title: "Character sketch of Anne Frank", instructions: "Write a 250-word character sketch. Use evidence from the text.", teacherID: "p-teacher-2", subject: "English", sectionLabel: "IX - E", dueDate: "2026-11-12", kind: "ASSIGNMENT", attachments: [], createdAt: Date().addingTimeInterval(-3 * 86_400)),
        Assignment(id: "hw-4", title: "Science lab report — Ohm’s law", instructions: "Submit the observation table, graph, and conclusion from the lab session.", teacherID: "p-teacher-1", subject: "Science", sectionLabel: "IX - E", dueDate: "2026-11-15", kind: "ASSIGNMENT", attachments: ["Lab-format.pdf"], createdAt: Date().addingTimeInterval(-2 * 86_400))
    ]

    static let submissions: [Submission] = [
        Submission(id: "sub-1", assignmentID: "hw-2", studentID: "p-student-1", body: "Completed all four exercises and attached the scanned pages.", fileName: "quadratic-worksheet-student.pdf", submittedAt: Date().addingTimeInterval(-2 * 86_400), status: "submitted")
    ]

    static let leaveRequests: [LeaveRequest] = [
        LeaveRequest(id: "leave-1", studentID: "p-student-2", type: "Sick Leave", reason: "Fever and throat infection. Doctor advised two days of rest.", startDate: "2026-11-12", endDate: "2026-11-13", status: .pending, createdAt: Date().addingTimeInterval(-2 * 86_400)),
        LeaveRequest(id: "leave-2", studentID: "p-student-3", type: "Casual Leave", reason: "Family function outside the city.", startDate: "2026-11-18", endDate: "2026-11-18", status: .pending, createdAt: Date().addingTimeInterval(-86_400))
    ]

    static let goals: [Goal] = [
        Goal(id: "cp-1", studentID: "p-student-1", subject: "Artificial Intelligence", title: "Python and data handling", percent: 78, grade: "A2", remarks: "Consistent work. Needs to improve documentation.", teacherID: "p-teacher-1", updatedAt: Date().addingTimeInterval(-3 * 86_400)),
        Goal(id: "cp-2", studentID: "p-student-1", subject: "Mathematics", title: "Polynomials and quadratic equations", percent: 85, grade: "A1", remarks: "Strong problem-solving. Keep practising word problems.", teacherID: "p-teacher-2", updatedAt: Date().addingTimeInterval(-4 * 86_400)),
        Goal(id: "cp-3", studentID: "p-student-1", subject: "English", title: "Reading and writing skills", percent: 72, grade: "B1", remarks: "Good comprehension. Work on essay structure.", teacherID: "p-teacher-2", updatedAt: Date().addingTimeInterval(-8 * 86_400)),
        Goal(id: "cp-4", studentID: "p-student-1", subject: "Science", title: "Motion, force and electricity", percent: 68, grade: "B1", remarks: "Practical work is improving. Revise numericals.", teacherID: "p-teacher-1", updatedAt: Date().addingTimeInterval(-10 * 86_400))
    ]

    static let declarations: [Declaration] = [
        Declaration(id: "dec-1", name: "Transport Norms Declaration", detail: "Transport Norms Declaration", kind: "Transport", signedBy: []),
        Declaration(id: "dec-2", name: "UNATTENDED FORM OF UNDERTAKING", detail: "UNATTENDED DEPARTURE CONSENT FORM", kind: "Transport", signedBy: []),
        Declaration(id: "dec-3", name: "SELF-PICKUP FORM OF UNDERTAKING", detail: "Self-Pickup Authorization Form", kind: "Transport", signedBy: ["p-student-1"]),
        Declaration(id: "dec-4", name: "Declaration Form", detail: "Declaration Form", kind: "Registration", signedBy: []),
        Declaration(id: "dec-5", name: "HEALTH CARD", detail: "HEALTH CARD", kind: "Registration", signedBy: ["p-student-1"])
    ]

    static let polls: [Poll] = [
        Poll(id: "poll-1", question: "Which topic should we revise first for the half-yearly?", audience: "Section E", createdBy: "p-teacher-2", closesAt: "2026-11-09",
             options: [PollOption(id: "opt-1", label: "Quadratic equations"), PollOption(id: "opt-2", label: "Polynomials"), PollOption(id: "opt-3", label: "Coordinate geometry")],
             votes: ["p-student-2": "opt-1", "p-student-3": "opt-1", "p-student-4": "opt-2"])
    ]

    static let events: [SchoolEvent] = [
        SchoolEvent(id: "ev-1", title: "DEEPAWALI", detail: "DEEPAWALI", kind: "holiday", startDate: "2026-11-07", endDate: "2026-11-07", audience: "Whole school", createdBy: "p-admin"),
        SchoolEvent(id: "ev-2", title: "DEEPAWALI", detail: "DEEPAWALI", kind: "holiday", startDate: "2026-11-09", endDate: "2026-11-11", audience: "Whole school", createdBy: "p-admin"),
        SchoolEvent(id: "ev-3", title: "Parent Teacher Meeting", detail: "Term 1 parent-teacher meeting for Grades IX to XII.", kind: "meeting", startDate: "2026-11-14", endDate: "2026-11-14", audience: "Grades IX-XII", createdBy: "p-admin"),
        SchoolEvent(id: "ev-4", title: "Annual Sports Day", detail: "Inter-house athletics and team events.", kind: "event", startDate: "2026-11-21", endDate: "2026-11-21", audience: "Whole school", createdBy: "p-admin"),
        SchoolEvent(id: "ev-5", title: "GURU NANAK JAYANTI", detail: "GURU NANAK JAYANTI", kind: "holiday", startDate: "2026-11-24", endDate: "2026-11-24", audience: "Whole school", createdBy: "p-admin"),
        SchoolEvent(id: "ev-6", title: "GURU TEG BAHADUR MARTYRDOM DAY", detail: "GURU TEG BAHADUR MARTYRDOM DAY", kind: "holiday", startDate: "2026-11-25", endDate: "2026-11-25", audience: "Whole school", createdBy: "p-admin")
    ]

    static let materials: [StudyMaterial] = [
        StudyMaterial(id: "mat-1", title: "AI Practical 2 — System Map", detail: "Work through the system map example from class, then build the flowchart for your own project idea. Print and bring it to the next lab.", subject: "Artificial Intelligence", sectionLabel: "IX - E", fileName: "System-Map-Practical-2.pdf", fileSize: "302.28 KB", uploadedBy: "p-teacher-1", createdAt: Date().addingTimeInterval(-5 * 86_400)),
        StudyMaterial(id: "mat-2", title: "Quadratic Equations — Formula Sheet", detail: "One-page summary of the discriminant, the quadratic formula and the three forms of a quadratic expression.", subject: "Mathematics", sectionLabel: "IX - E", fileName: "Quadratic-Formula-Sheet.pdf", fileSize: "184.10 KB", uploadedBy: "p-teacher-2", createdAt: Date().addingTimeInterval(-7 * 86_400)),
        StudyMaterial(id: "mat-3", title: "Anne Frank — Chapter Notes", detail: "Character list and the diary timeline for the half-yearly revision.", subject: "English", sectionLabel: "IX - E", fileName: "Anne-Frank-Notes.pdf", fileSize: "96.44 KB", uploadedBy: "p-teacher-2", createdAt: Date().addingTimeInterval(-8 * 86_400))
    ]

    static let books: [Book] = [
        Book(id: "book-1", title: "The Alchemist", author: "Paulo Coelho", accessionNo: "LIB-001", category: "Fiction", totalCopies: 5, available: 4),
        Book(id: "book-2", title: "Wings of Fire", author: "A. P. J. Abdul Kalam", accessionNo: "LIB-002", category: "Biography", totalCopies: 3, available: 2),
        Book(id: "book-3", title: "The Discovery of India", author: "Jawaharlal Nehru", accessionNo: "LIB-003", category: "History", totalCopies: 4, available: 4)
    ]

    static let invoices: [Invoice] = [
        Invoice(id: "inv-1", studentID: "p-student-1", label: "Term 2 tuition fee", amount: 32000, dueDate: "2026-11-20", status: "pending"),
        Invoice(id: "inv-2", studentID: "p-student-1", label: "Term 1 transport", amount: 7500, dueDate: "2026-10-10", status: "paid"),
        Invoice(id: "inv-3", studentID: "p-student-6", label: "Term 2 tuition fee", amount: 32000, dueDate: "2026-11-20", status: "pending", siblingDiscountApplied: true),
        Invoice(id: "inv-4", studentID: "p-student-2", label: "Term 2 tuition fee", amount: 32000, dueDate: "2026-11-20", status: "paid")
    ]

    static let notices: [Notice] = [
        Notice(id: "notice-1", title: "Parent Teacher Meeting — 14 Nov", body: "Term 1 PTM for Grades IX–XII. Please be seated by 10:00 AM with the student's progress file.", publishedBy: "p-admin", publishedAt: Date().addingTimeInterval(-86_400), audience: "Grades IX–XII", readBy: [])
    ]

    static let threads: [ChatThread] = [
        ChatThread(id: "thread-1", teacherID: "p-teacher-1", studentID: "p-student-1", subject: "AI practical file", lastMessageAt: Date().addingTimeInterval(-7200))
    ]

    static let messages: [ChatMessage] = [
        ChatMessage(id: "msg-1", threadID: "thread-1", senderID: "p-teacher-1", body: "Student — the system map practical was good work. Bring the flowchart to lab 4.", createdAt: Date().addingTimeInterval(-7200)),
        ChatMessage(id: "msg-2", threadID: "thread-1", senderID: "p-student-1", body: "Thank you, ma'am. I'll bring it on Friday.", createdAt: Date().addingTimeInterval(-3600))
    ]

    static let audit: [AuditEntry] = [
        AuditEntry(id: "aud-1", actorID: "p-admin", action: "Imported roster from CSV", target: "38 students", at: Date().addingTimeInterval(-3 * 86_400)),
        AuditEntry(id: "aud-2", actorID: "p-admin", action: "Linked sibling (50% discount)", target: "Student 0201/18 → Student 0185/18", at: Date().addingTimeInterval(-4 * 86_400)),
        AuditEntry(id: "aud-3", actorID: "p-teacher-1", action: "Approved leave", target: "Student 0186/18 · 12–13 Nov", at: Date().addingTimeInterval(-3 * 86_400)),
        AuditEntry(id: "aud-4", actorID: "p-teacher-2", action: "Published assignment", target: "Quadratic equations worksheet", at: Date().addingTimeInterval(-6 * 86_400)),
        AuditEntry(id: "aud-5", actorID: "p-admin", action: "Generated report card", target: "Student 0185/18 · HALF YEARLY", at: Date().addingTimeInterval(-2 * 86_400))
    ]

    static let gallery: [GalleryAlbum] = [
        GalleryAlbum(id: "gal-1", title: "Annual Sports Day 2025", count: 48),
        GalleryAlbum(id: "gal-2", title: "Annual Day 2025", count: 63),
        GalleryAlbum(id: "gal-3", title: "Science Exhibition 2026", count: 37)
    ]

    static let reportCards: [ReportCard] = [
        ReportCard(id: "rc-1", studentID: "p-student-1", term: "Half Yearly", subjects: [
            SubjectMark(subject: "Artificial Intelligence", marks: 84, grade: "A2"),
            SubjectMark(subject: "Mathematics", marks: 92, grade: "A1"),
            SubjectMark(subject: "English", marks: 76, grade: "B1"),
            SubjectMark(subject: "Science", marks: 71, grade: "B1"),
            SubjectMark(subject: "Social Science", marks: 88, grade: "A2"),
            SubjectMark(subject: "Hindi", marks: 80, grade: "A2")
        ], remarks: "Commendable effort overall. Keep up the consistency.", generatedAt: Date().addingTimeInterval(-2 * 86_400))
    ]

    static let attendance: [AttendanceRecord] = [
        AttendanceRecord(id: "att-1", studentID: "p-student-1", date: "2026-11-03", status: "present"),
        AttendanceRecord(id: "att-2", studentID: "p-student-2", date: "2026-11-03", status: "present"),
        AttendanceRecord(id: "att-3", studentID: "p-student-3", date: "2026-11-03", status: "absent"),
        AttendanceRecord(id: "att-4", studentID: "p-student-4", date: "2026-11-03", status: "present"),
        AttendanceRecord(id: "att-5", studentID: "p-student-5", date: "2026-11-03", status: "present"),
        AttendanceRecord(id: "att-6", studentID: "p-student-1", date: "2026-11-04", status: "present"),
        AttendanceRecord(id: "att-7", studentID: "p-student-2", date: "2026-11-04", status: "present"),
        AttendanceRecord(id: "att-8", studentID: "p-student-3", date: "2026-11-04", status: "present"),
        AttendanceRecord(id: "att-9", studentID: "p-student-4", date: "2026-11-04", status: "present"),
        AttendanceRecord(id: "att-10", studentID: "p-student-5", date: "2026-11-04", status: "absent")
    ]
}
