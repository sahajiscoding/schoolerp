import SwiftUI

struct CourseProgressView: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresenting = false

    var goals: [Goal] { store.goalsForCurrent() }
    var isStaff: Bool { store.current?.role == .teacher || store.current?.role == .admin }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ScreenHeader(title: "Course Progress", subtitle: store.current?.role == .student ? "How you're tracking this year" : "Student progress you've tracked")
                if goals.isEmpty {
                    EmptyState(icon: "chart.line.uptrend.xyaxis", title: "No progress yet", subtitle: isStaff ? "Add a goal per student to start tracking." : "Your teachers will add goals as you study.")
                } else {
                    ForEach(goals) { GoalRow(goal: $0) }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("Course Progress")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isStaff {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresenting = true
                    } label: {
                        Label("Add goal", systemImage: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $isPresenting) {
            AddGoalSheet(isPresented: $isPresenting)
        }
    }
}

private struct GoalRow: View {
    let goal: Goal

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    Badge(text: goal.subject, tint: Theme.subjectColor(goal.subject))
                    Spacer()
                    Text(goal.grade).font(.headline.weight(.bold)).foregroundStyle(Theme.olive)
                }
                Text(goal.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                ProgressView(value: Double(goal.percent), total: 100)
                    .tint(Theme.subjectColor(goal.subject))
                HStack {
                    Text("\(goal.percent)% complete")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Theme.muted)
                    Spacer()
                }
                if !goal.remarks.isEmpty {
                    Text("“\(goal.remarks)”")
                        .font(.footnote)
                        .italic()
                        .foregroundStyle(Theme.muted)
                }
            }
        }
    }
}

private struct AddGoalSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var studentID = "p-student-1"
    @State private var subject = "Artificial Intelligence"
    @State private var title = ""
    @State private var percent = 50
    @State private var remarks = ""
    @State private var error: String?

    var students: [Person] { store.students(in: "IX - E") }

    var body: some View {
        NavigationStack {
            Form {
                Section("Student") {
                    Picker("Student", selection: $studentID) {
                        ForEach(students) { Text($0.fullName).tag($0.id) }
                    }
                }
                Section("Goal") {
                    Picker("Subject", selection: $subject) {
                        ForEach(store.subjects.map(\.name), id: \.self) { Text($0).tag($0) }
                    }
                    TextField("What is the student learning?", text: $title)
                    Stepper("Completion: \(percent)%", value: $percent, in: 0...100, step: 5)
                }
                Section("Remarks") {
                    TextEditor(text: $remarks).frame(minHeight: 70)
                }
                if let error {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }
            }
            .navigationTitle("New goal")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        do {
                            try store.addGoal(studentID: studentID, subject: subject, title: title, percent: percent, remarks: remarks)
                            isPresented = false
                        } catch let e as StoreError {
                            error = e.errorDescription
                        } catch {
                            self.error = "Couldn't save."
                        }
                    }
                }
            }
        }
    }
}
