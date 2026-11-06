import Foundation

enum Role: String, CaseIterable, Codable {
    case admin
    case teacher
    case student
}

struct Person: Identifiable, Hashable, Codable {
    var id: String
    var loginID: String
    var fullName: String
    var role: Role
    var isActive: Bool = true
    var email: String = ""
    var phone: String = ""
    var dob: String? = nil
    var admissionNo: String? = nil
    var classLabel: String? = nil
    var sectionLabel: String? = nil
    var classTeacherOf: String? = nil
    var siblingID: String? = nil

    var sectionKey: String {
        "\(classLabel ?? "") - \(sectionLabel ?? "")"
    }
}

struct Assignment: Identifiable, Hashable, Codable {
    var id: String
    var title: String
    var instructions: String
    var teacherID: String
    var subject: String
    var sectionLabel: String
    var dueDate: String?
    var kind: String // HOMEWORK or ASSIGNMENT
    var attachments: [String]
    var createdAt: Date
}

struct Submission: Identifiable, Hashable, Codable {
    var id: String
    var assignmentID: String
    var studentID: String
    var body: String
    var fileName: String?
    var submittedAt: Date
    var status: String // submitted, reviewed
}

enum LeaveStatus: String, Codable, CaseIterable {
    case pending
    case approved
    case rejected
}

struct LeaveRequest: Identifiable, Hashable, Codable {
    var id: String
    var studentID: String
    var type: String
    var reason: String
    var startDate: String
    var endDate: String
    var status: LeaveStatus
    var createdAt: Date
}

struct Goal: Identifiable, Hashable, Codable {
    var id: String
    var studentID: String
    var subject: String
    var title: String
    var percent: Int
    var grade: String
    var remarks: String
    var teacherID: String
    var updatedAt: Date
}

struct Declaration: Identifiable, Hashable, Codable {
    var id: String
    var name: String
    var detail: String
    var kind: String
    var signedBy: [String]
}

struct Poll: Identifiable, Hashable, Codable {
    var id: String
    var question: String
    var audience: String
    var createdBy: String
    var closesAt: String
    var options: [PollOption]
    var votes: [String: String]
}

struct PollOption: Identifiable, Hashable, Codable {
    var id: String
    var label: String
}

struct SchoolEvent: Identifiable, Hashable, Codable {
    var id: String
    var title: String
    var detail: String
    var kind: String // holiday, meeting, event
    var startDate: String
    var endDate: String
    var audience: String
    var createdBy: String
}

struct StudyMaterial: Identifiable, Hashable, Codable {
    var id: String
    var title: String
    var detail: String
    var subject: String
    var sectionLabel: String
    var fileName: String
    var fileSize: String
    var uploadedBy: String
    var createdAt: Date
}

struct Book: Identifiable, Hashable, Codable {
    var id: String
    var title: String
    var author: String
    var accessionNo: String
    var category: String
    var totalCopies: Int
    var available: Int
    var issuedTo: String? = nil
}

struct ReportCard: Identifiable, Hashable, Codable {
    var id: String
    var studentID: String
    var term: String
    var subjects: [SubjectMark]
    var remarks: String
    var generatedAt: Date
}

struct SubjectMark: Identifiable, Hashable, Codable {
    var id: String { subject }
    var subject: String
    var marks: Int
    var grade: String
}

struct Invoice: Identifiable, Hashable, Codable {
    var id: String
    var studentID: String
    var label: String
    var amount: Double
    var dueDate: String
    var status: String // paid, pending
    var siblingDiscountApplied: Bool = false
}

struct ChatThread: Identifiable, Hashable, Codable {
    var id: String
    var teacherID: String
    var studentID: String
    var subject: String
    var lastMessageAt: Date
}

struct ChatMessage: Identifiable, Hashable, Codable {
    var id: String
    var threadID: String
    var senderID: String
    var body: String
    var createdAt: Date
}

struct Notice: Identifiable, Hashable, Codable {
    var id: String
    var title: String
    var body: String
    var publishedBy: String
    var publishedAt: Date
    var audience: String
    var readBy: [String]
}

struct AuditEntry: Identifiable, Hashable, Codable {
    var id: String
    var actorID: String
    var action: String
    var target: String
    var at: Date
}

struct GalleryAlbum: Identifiable, Hashable, Codable {
    var id: String
    var title: String
    var count: Int
}

struct Subject: Identifiable, Hashable, Codable {
    var id: String
    var name: String
    var code: String
    var color: String
}

struct AttendanceRecord: Identifiable, Hashable, Codable {
    var id: String
    var studentID: String
    var date: String
    var status: String // present, absent
}

func isoDate(_ date: Date) -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
}

func passwordFromDOB(_ dob: String) -> String? {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    guard let date = f.date(from: dob) else { return nil }
    let out = DateFormatter()
    out.dateFormat = "ddMMyyyy"
    return "Student@" + out.string(from: date)
}

func gradeFor(_ marks: Int) -> String {
    switch marks {
    case 91...100: return "A1"
    case 81...90: return "A2"
    case 71...80: return "B1"
    case 61...70: return "B2"
    case 51...60: return "C1"
    case 41...50: return "C2"
    case 33...40: return "D"
    default: return "E"
    }
}

func titleCase(_ value: String) -> String {
    value.prefix(1).uppercased() + value.dropFirst()
}
