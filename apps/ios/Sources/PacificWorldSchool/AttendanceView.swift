import SwiftUI

struct AttendanceView: View {
    @Environment(DemoStore.self) private var store
    @State private var date = "2026-11-04"

    var dates: [String] { store.attendanceDates }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ScreenHeader(title: "Attendance", subtitle: "Present or absent, day by day")

                if dates.isEmpty {
                    EmptyState(icon: "calendar", title: "No dates yet", subtitle: "Attendance will appear once teachers mark a day.")
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(dates, id: \.self) { value in
                                Button {
                                    date = value
                                } label: {
                                    Text(relativeDay(value))
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(date == value ? Theme.cream : Theme.olive)
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 14)
                                        .background(date == value ? Theme.olive : Theme.olive.opacity(0.12), in: Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    switch store.current?.role {
                    case .student:
                        StudentAttendance(date: date)
                    case .teacher, .admin:
                        TeacherAttendance(date: date)
                    default:
                        EmptyView()
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("My Attendance")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct StudentAttendance: View {
    @Environment(DemoStore.self) private var store
    let date: String

    var body: some View {
        if let current = store.current {
            studentBody(current: current)
        } else {
            EmptyView()
        }
    }

    @ViewBuilder
    private func studentBody(current: Person) -> some View {
        let status = store.status(of: current.id, date: date)
        Group {
            Card {
                HStack {
                    Image(systemName: status == "present" ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.largeTitle)
                        .foregroundStyle(status == "present" ? Theme.olive : .red)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(relativeDay(date))
                            .font(.headline)
                            .foregroundStyle(Theme.ink)
                        Text(status == "present" ? "Marked present" : "Marked absent")
                            .font(.subheadline)
                            .foregroundStyle(Theme.muted)
                    }
                    Spacer()
                }
            }
            ScreenHeader(title: "Recent record", subtitle: "The last few school days")
            let rows = store.attendance.filter { $0.studentID == current.id }.sorted { $0.date > $1.date }
            ForEach(rows) { record in
                HStack {
                    Text(relativeDay(record.date))
                        .font(.subheadline)
                        .foregroundStyle(Theme.ink)
                    Spacer()
                    Badge(text: record.status.capitalized, tint: record.status == "present" ? Theme.olive : .red)
                }
                .padding(10)
                .background(Theme.cream, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}

private struct TeacherAttendance: View {
    @Environment(DemoStore.self) private var store
    let date: String

    var students: [Person] { store.students(in: "IX - E") }

    var presentCount: Int {
        students.filter { store.status(of: $0.id, date: date) == "present" }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("\(presentCount)/\(students.count) present")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.olive)
                Spacer()
                Text("Section E")
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            }
            ForEach(students) { student in
                let status = store.status(of: student.id, date: date)
                HStack {
                    AvatarView(name: student.fullName, size: 34)
                    Text(student.fullName)
                        .font(.subheadline)
                        .foregroundStyle(Theme.ink)
                    Spacer()
                    Picker("Status", selection: Binding(
                        get: { status },
                        set: { store.setStatus($0, studentID: student.id, date: date) }
                    )) {
                        Text("Present").tag("present")
                        Text("Absent").tag("absent")
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 170)
                }
                .padding(10)
                .background(Theme.cream, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}
