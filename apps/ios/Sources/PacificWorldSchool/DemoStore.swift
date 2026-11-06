import Foundation
import Observation

enum StoreError: LocalizedError, Equatable {
    case unknownUser
    case invalidPassword
    case notAllowed
    case invalidDate
    case missingFields

    var errorDescription: String? {
        switch self {
        case .unknownUser: return "No account matches that login ID."
        case .invalidPassword: return "That password doesn't match. Students sign in with the school-issued password."
        case .notAllowed: return "You don't have permission to do that."
        case .invalidDate: return "Please enter a valid date (YYYY-MM-DD)."
        case .missingFields: return "A few required fields are empty."
        }
    }
}

@Observable
final class DemoStore {
    var people = Seed.people
    var subjects = Seed.subjects
    var assignments = Seed.assignments
    var submissions = Seed.submissions
    var leaveRequests = Seed.leaveRequests
    var goals = Seed.goals
    var declarations = Seed.declarations
    var polls = Seed.polls
    var events = Seed.events
    var materials = Seed.materials
    var books = Seed.books
    var invoices = Seed.invoices
    var reportCards = Seed.reportCards
    var attendance = Seed.attendance
    var threads = Seed.threads
    var messages = Seed.messages
    var notices = Seed.notices
    var audit = Seed.audit
    var gallery = Seed.gallery
    var current: Person?

    let classes = Seed.classes

    // MARK: - Auth (demo)

    func signInAsDemo(_ role: Role) {
        switch role {
        case .admin: current = people.first { $0.id == "p-admin" }
        case .teacher: current = people.first { $0.id == "p-teacher-1" }
        case .student: current = people.first { $0.id == "p-student-1" }
        }
    }

    func signIn(login: String, password: String) throws {
        guard let person = people.first(where: { $0.loginID.caseInsensitiveCompare(login) == .orderedSame && $0.isActive }) else {
            throw StoreError.unknownUser
        }
        switch person.role {
        case .student:
            guard let dob = person.dob else { throw StoreError.invalidPassword }
            guard let expected = passwordFromDOB(dob), expected == password else { throw StoreError.invalidPassword }
            current = person
        case .teacher:
            guard let assigned = people.first(where: { $0.id == person.id && !$0.sectionKey.isEmpty }) else {
                throw StoreError.invalidPassword
            }
            if password.lowercased() == "teacher" || password.isEmpty { current = assigned } else { throw StoreError.invalidPassword }
        case .admin:
            if password.lowercased() == "admin" || password.isEmpty { current = person } else { throw StoreError.invalidPassword }
        }
    }

    func signOut() {
        current = nil
    }

    // MARK: - People

    func person(_ id: String) -> Person? {
        people.first { $0.id == id }
    }

    func students(in section: String) -> [Person] {
        people.filter { $0.role == .student && $0.isActive && $0.sectionKey == section }
            .sorted { $0.fullName < $1.fullName }
    }

    func mySections() -> [String] {
        guard let current else { return [] }
        if current.role == .admin { return sections.sorted() }
        let assigned = assignments.map(\.sectionLabel)
        let lines = people.filter { $0.role == .teacher && $0.id == current.id }.compactMap { $0.sectionKey.isEmpty ? nil : $0.sectionKey }
        return Array(Set(assigned + lines)).sorted()
    }

    var sections: [String] {
        classes.flatMap { cls in cls.sections.map { "\(cls.name) - \($0)" } }
    }

    func addAudit(_ action: String, target: String) {
        audit.insert(AuditEntry(id: UUID().uuidString, actorID: current?.id ?? "system", action: action, target: target, at: Date()), at: 0)
    }

    func addStudent(name: String, admissionNo: String, dob: String, classLabel: String, sectionLabel: String) throws -> String {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty,
              !admissionNo.trimmingCharacters(in: .whitespaces).isEmpty,
              let password = passwordFromDOB(dob) else {
            throw StoreError.invalidDate
        }
        let person = Person(
            id: UUID().uuidString,
            loginID: admissionNo,
            fullName: name,
            role: .student,
            email: "",
            phone: "",
            dob: dob,
            admissionNo: admissionNo,
            classLabel: classLabel,
            sectionLabel: sectionLabel
        )
        people.append(person)
        addAudit("Created student account", target: "\(name) · \(admissionNo)")
        return password
    }

    // MARK: - Leave approvals

    func myLeaveRequests() -> [LeaveRequest] {
        guard let current else { return [] }
        return leaveRequests.filter { $0.studentID == current.id }.sorted { $0.createdAt > $1.createdAt }
    }

    func pendingApprovals() -> [LeaveRequest] {
        guard let current else { return [] }
        if current.role == .admin { return leaveRequests.filter { $0.status == .pending }.sorted { $0.createdAt > $1.createdAt } }
        guard current.role == .teacher else { return [] }
        // Class teacher approves for their class section (IX - E)
        let rosterIDs = Set(students(in: current.classTeacherOf ?? current.sectionKey).map(\.id))
        return leaveRequests.filter { $0.status == .pending && rosterIDs.contains($0.studentID) }.sorted { $0.createdAt > $1.createdAt }
    }

    func decideLeave(_ id: String, _ status: LeaveStatus) {
        guard let index = leaveRequests.firstIndex(where: { $0.id == id }) else { return }
        let current = self.current
        let request = leaveRequests[index]
        if current?.role == .teacher, let s = person(request.studentID), let teacherClass = current?.classTeacherOf, s.sectionKey != teacherClass {
            return // class teacher can only decide for their own section
        }
        leaveRequests[index].status = status
        addAudit(status == .approved ? "Approved leave" : "Rejected leave", target: "\(person(request.studentID)?.fullName ?? request.studentID)")
    }

    func requestLeave(type: String, reason: String, start: String, end: String) throws {
        guard let current, current.role == .student else { throw StoreError.notAllowed }
        guard !reason.trimmingCharacters(in: .whitespaces).isEmpty else { throw StoreError.missingFields }
        guard isISODate(start), isISODate(end), start <= end else { throw StoreError.invalidDate }
        leaveRequests.insert(LeaveRequest(id: UUID().uuidString, studentID: current.id, type: type, reason: reason, startDate: start, endDate: end, status: .pending, createdAt: Date()), at: 0)
        addAudit("Requested leave", target: "\(current.fullName) · \(start) → \(end)")
    }

    private func isISODate(_ value: String) -> Bool {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.date(from: value) != nil
    }

    // MARK: - Assignments

    func assignmentsForCurrent() -> [Assignment] {
        guard let current else { return [] }
        switch current.role {
        case .admin:
            return assignments
        case .teacher:
            let sec = current.sectionKey
            return assignments.filter { $0.teacherID == current.id || $0.sectionLabel == sec }
        case .student:
            return assignments.filter { $0.sectionLabel == current.sectionKey }
        }
    }

    func submissionsFor(_ assignment: Assignment) -> [Submission] {
        submissions.filter { $0.assignmentID == assignment.id }
    }

    func submissionFor(_ assignment: Assignment, student: Person) -> Submission? {
        submissions.first { $0.assignmentID == assignment.id && $0.studentID == student.id }
    }

    func roster(for assignment: Assignment) -> [Person] {
        students(in: assignment.sectionLabel)
    }

    func submit(_ assignment: Assignment, body: String, fileName: String?) throws {
        guard let current, current.role == .student else { throw StoreError.notAllowed }
        guard current.sectionKey == assignment.sectionLabel else { throw StoreError.notAllowed }
        guard !(body.trimmingCharacters(in: .whitespaces).isEmpty && (fileName ?? "").isEmpty) else { throw StoreError.missingFields }
        if let existing = submissions.firstIndex(where: { $0.assignmentID == assignment.id && $0.studentID == current.id }) {
            submissions[existing].body = body
            submissions[existing].fileName = fileName
            submissions[existing].submittedAt = Date()
            submissions[existing].status = "submitted"
        } else {
            submissions.append(Submission(id: UUID().uuidString, assignmentID: assignment.id, studentID: current.id, body: body, fileName: fileName, submittedAt: Date(), status: "submitted"))
        }
        addAudit("Submitted assignment", target: assignment.title)
    }

    func markReviewed(_ submission: Submission) {
        guard let index = submissions.firstIndex(where: { $0.id == submission.id }) else { return }
        submissions[index].status = "reviewed"
        addAudit("Reviewed submission", target: person(submission.studentID)?.fullName ?? submission.studentID)
    }

    func publishAssignment(title: String, instructions: String, subject: String, sectionLabel: String, dueDate: String?, kind: String, attachments: [String]) throws {
        guard let current, current.role == .teacher else { throw StoreError.notAllowed }
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else { throw StoreError.missingFields }
        guard mySections().contains(sectionLabel) else { throw StoreError.notAllowed }
        let assignment = Assignment(id: UUID().uuidString, title: title, instructions: instructions, teacherID: current.id, subject: subject, sectionLabel: sectionLabel, dueDate: dueDate, kind: kind, attachments: attachments, createdAt: Date())
        assignments.insert(assignment, at: 0)
        addAudit("Published \(kind.lowercased())", target: title)
    }

    // MARK: - Goals / course progress

    func goalsForCurrent() -> [Goal] {
        guard let current else { return [] }
        if current.role == .student { return goals.filter { $0.studentID == current.id }.sorted { $0.updatedAt > $1.updatedAt } }
        if current.role == .teacher {
            let roster = Set(students(in: current.sectionKey).map(\.id))
            return goals.filter { roster.contains($0.studentID) }.sorted { $0.updatedAt > $1.updatedAt }
        }
        return goals.sorted { $0.updatedAt > $1.updatedAt }
    }

    func addGoal(studentID: String, subject: String, title: String, percent: Int, remarks: String) throws {
        guard let current, current.role == .teacher || current.role == .admin else { throw StoreError.notAllowed }
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else { throw StoreError.missingFields }
        let clamped = max(0, min(100, percent))
        goals.insert(Goal(id: UUID().uuidString, studentID: studentID, subject: subject, title: title, percent: clamped, grade: gradeFor(clamped), remarks: remarks, teacherID: current.id, updatedAt: Date()), at: 0)
        addAudit("Updated course progress", target: "\(person(studentID)?.fullName ?? studentID) · \(subject)")
    }

    // MARK: - Polls

    func vote(_ poll: Poll, optionID: String) {
        guard let current, current.role == .student else { return }
        guard let index = polls.firstIndex(where: { $0.id == poll.id }) else { return }
        polls[index].votes[current.id] = optionID
        addAudit("Voted in poll", target: poll.question)
    }

    func addPoll(question: String, options: [String], audience: String, closesAt: String) throws {
        guard let current, current.role == .teacher || current.role == .admin else { throw StoreError.notAllowed }
        guard !question.trimmingCharacters(in: .whitespaces).isEmpty else { throw StoreError.missingFields }
        let cleaned = options.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        guard cleaned.count >= 2 else { throw StoreError.missingFields }
        polls.insert(Poll(id: UUID().uuidString, question: question, audience: audience, createdBy: current.id, closesAt: closesAt, options: cleaned.enumerated().map { PollOption(id: "opt-\($0.element)-\($0.offset)", label: $0.element) }, votes: [:]), at: 0)
        addAudit("Created poll", target: question)
    }

    // MARK: - Declarations

    func signDeclaration(_ declaration: Declaration) {
        guard let current, current.role == .student else { return }
        guard let index = declarations.firstIndex(where: { $0.id == declaration.id }) else { return }
        if !declarations[index].signedBy.contains(current.id) { declarations[index].signedBy.append(current.id) }
        addAudit("Signed declaration", target: declaration.name)
    }

    // MARK: - Events

    func addEvent(title: String, detail: String, kind: String, start: String, end: String, audience: String) throws {
        guard let current, current.role == .admin || current.role == .teacher else { throw StoreError.notAllowed }
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty else { throw StoreError.missingFields }
        let effectiveAudience: String
        if current.role == .teacher {
            effectiveAudience = current.sectionKey
        } else {
            effectiveAudience = audience
        }
        events.insert(SchoolEvent(id: UUID().uuidString, title: title, detail: detail, kind: kind, startDate: start, endDate: end, audience: effectiveAudience, createdBy: current.id), at: 0)
        addAudit("Published event", target: title)
    }

    // MARK: - Study room

    func addMaterial(title: String, subject: String, fileName: String, size: String, detail: String = "") throws {
        guard let current, current.role == .teacher || current.role == .admin else { throw StoreError.notAllowed }
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty, !fileName.isEmpty else { throw StoreError.missingFields }
        materials.insert(StudyMaterial(id: UUID().uuidString, title: title, detail: detail, subject: subject, sectionLabel: "IX - E", fileName: fileName, fileSize: size, uploadedBy: current.id, createdAt: Date()), at: 0)
        addAudit("Shared study material", target: title)
    }

    // MARK: - Library

    func addBook(title: String, author: String, accession: String, category: String, copies: Int) throws {
        guard let current, current.role == .admin || current.role == .teacher else { throw StoreError.notAllowed }
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty, copies > 0 else { throw StoreError.missingFields }
        books.insert(Book(id: UUID().uuidString, title: title, author: author, accessionNo: accession, category: category, totalCopies: copies, available: copies), at: 0)
        addAudit("Added book", target: title)
    }

    func issueBook(_ book: Book, to studentID: String) throws {
        guard let index = books.firstIndex(where: { $0.id == book.id }) else { return }
        guard books[index].available > 0 else { throw StoreError.notAllowed }
        books[index].available -= 1
        books[index].issuedTo = studentID
        addAudit("Issued book", target: "\(book.title) → \(person(studentID)?.fullName ?? studentID)")
    }

    func returnBook(_ book: Book) {
        guard let index = books.firstIndex(where: { $0.id == book.id }) else { return }
        books[index].available = min(books[index].totalCopies, books[index].available + 1)
        books[index].issuedTo = nil
        addAudit("Returned book", target: book.title)
    }

    func reserveBook(_ book: Book) {
        addAudit("Requested book reservation", target: book.title)
    }

    // MARK: - Messages (teacher ↔ student only)

    func threadsForCurrent() -> [ChatThread] {
        guard let current else { return [] }
        switch current.role {
        case .teacher: return threads.filter { $0.teacherID == current.id }.sorted { $0.lastMessageAt > $1.lastMessageAt }
        case .student: return threads.filter { $0.studentID == current.id }.sorted { $0.lastMessageAt > $1.lastMessageAt }
        case .admin: return threads.sorted { $0.lastMessageAt > $1.lastMessageAt }
        }
    }

    func messages(in thread: ChatThread) -> [ChatMessage] {
        messages.filter { $0.threadID == thread.id }.sorted { $0.createdAt < $1.createdAt }
    }

    func sendMessage(toStudentIDs targets: [String], subject: String, body: String) throws {
        guard let current, current.role == .teacher else { throw StoreError.notAllowed }
        guard !targets.isEmpty, !body.trimmingCharacters(in: .whitespaces).isEmpty else { throw StoreError.missingFields }
        let allowed = Set(students(in: current.sectionKey).map(\.id))
        for studentID in targets {
            guard allowed.contains(studentID) else { throw StoreError.notAllowed } // rejected, not filtered
        }
        for studentID in targets {
            let campaign = UUID()
            let thread = ChatThread(id: UUID().uuidString, teacherID: current.id, studentID: studentID, subject: subject, lastMessageAt: Date())
            threads.append(thread)
            messages.append(ChatMessage(id: UUID().uuidString, threadID: thread.id, senderID: current.id, body: body, createdAt: Date()))
            _ = campaign
        }
        addAudit("Sent message to \(targets.count) student\(targets.count == 1 ? "" : "s")", target: subject)
    }

    func sendMessage(in thread: ChatThread, body: String) throws {
        guard let current else { throw StoreError.notAllowed }
        guard current.role != .admin else { throw StoreError.notAllowed } // admin reads only
        guard current.id == thread.teacherID || current.id == thread.studentID else { throw StoreError.notAllowed }
        guard !body.trimmingCharacters(in: .whitespaces).isEmpty else { throw StoreError.missingFields }
        messages.append(ChatMessage(id: UUID().uuidString, threadID: thread.id, senderID: current.id, body: body, createdAt: Date()))
        if let index = threads.firstIndex(where: { $0.id == thread.id }) {
            threads[index].lastMessageAt = Date()
        }
    }

    // MARK: - Notices

    func addNotice(title: String, body: String, audience: String) throws {
        guard let current, current.role == .admin else { throw StoreError.notAllowed }
        guard !title.trimmingCharacters(in: .whitespaces).isEmpty, !body.isEmpty else { throw StoreError.missingFields }
        notices.insert(Notice(id: UUID().uuidString, title: title, body: body, publishedBy: current.id, publishedAt: Date(), audience: audience, readBy: []), at: 0)
        addAudit("Published notice", target: title)
    }

    func markNoticeRead(_ notice: Notice) {
        guard let current, let index = notices.firstIndex(where: { $0.id == notice.id }) else { return }
        if !notices[index].readBy.contains(current.id) { notices[index].readBy.append(current.id) }
    }

    // MARK: - Attendance

    func attendanceFor(date: String, section: String) -> [AttendanceRecord] {
        let roster = Set(students(in: section).map(\.id))
        return attendance.filter { $0.date == date && roster.contains($0.studentID) }
    }

    func status(of studentID: String, date: String) -> String {
        attendance.first { $0.studentID == studentID && $0.date == date }?.status ?? "present"
    }

    func setStatus(_ status: String, studentID: String, date: String) {
        if let index = attendance.firstIndex(where: { $0.studentID == studentID && $0.date == date }) {
            attendance[index].status = status
        } else {
            attendance.append(AttendanceRecord(id: UUID().uuidString, studentID: studentID, date: date, status: status))
        }
        addAudit("Marked attendance", target: "\(person(studentID)?.fullName ?? studentID) · \(date) · \(status)")
    }

    var attendanceDates: [String] {
        Array(Set(attendance.map(\.date))).sorted().reversed()
    }

    // MARK: - Fees

    var feesCollected: Double {
        invoices.filter { $0.status == "paid" }.reduce(0) { $0 + $1.amount }
    }

    var feesPending: Double {
        invoices.filter { $0.status == "pending" }.reduce(0) { $0 + $1.amount }
    }

    func invoicesForCurrent() -> [Invoice] {
        guard let current else { return [] }
        if current.role == .student { return invoices.filter { $0.studentID == current.id }.sorted { $0.dueDate > $1.dueDate } }
        return invoices.sorted { $0.dueDate > $1.dueDate }
    }

    // MARK: - Report cards

    func reportCardsForCurrent() -> [ReportCard] {
        guard let current else { return [] }
        if current.role == .student { return reportCards.filter { $0.studentID == current.id } }
        return reportCards.sorted { $0.generatedAt > $1.generatedAt }
    }

    func generateReportCard(studentID: String, term: String, marks: [String: Int], remarks: String) {
        guard let current, current.role == .teacher || current.role == .admin else { return }
        let subjectMarks = subjects.map { SubjectMark(subject: $0.name, marks: marks[$0.name] ?? 0, grade: gradeFor(marks[$0.name] ?? 0)) }
        reportCards.insert(ReportCard(id: UUID().uuidString, studentID: studentID, term: term, subjects: subjectMarks, remarks: remarks, generatedAt: Date()), at: 0)
        addAudit("Generated report card", target: "\(person(studentID)?.fullName ?? studentID) · \(term)")
    }

    // MARK: - Sibling / discount

    var siblingDiscountDescription: String {
        "50% sibling discount is applied to the second child only. Discounts are managed by the school office."
    }

    // MARK: - Account deletion request

    func requestAccountDeletion() {
        guard let current else { return }
        addAudit("Account deletion requested", target: current.fullName)
    }
}
