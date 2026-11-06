import SwiftUI
import UniformTypeIdentifiers

struct AssignmentsView: View {
    @Environment(DemoStore.self) private var store
    @State private var isCreating = false

    var work: [Assignment] { store.assignmentsForCurrent() }

    var body: some View {
        List(work) { assignment in
            NavigationLink(destination: AssignmentDetailView(assignment: assignment)) {
                AssignmentRow(assignment: assignment)
            }
            .listRowBackground(Theme.cream)
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle("Assignments")
        .toolbar {
            if store.current?.role == .teacher {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isCreating = true
                    } label: {
                        Label("New", systemImage: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $isCreating) {
            NewAssignmentSheet(isPresented: $isCreating)
        }
    }
}

private struct AssignmentRow: View {
    @Environment(DemoStore.self) private var store
    let assignment: Assignment

    var detail: String {
        let teacher = store.person(assignment.teacherID)?.fullName ?? "Teacher"
        var pieces = ["\(assignment.subject) · \(teacher)"]
        if let due = assignment.dueDate, !due.isEmpty { pieces.append("due \(relativeDay(due))") }
        return pieces.joined(separator: " · ")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Badge(text: assignment.kind == "ASSIGNMENT" ? "Assignment" : "Homework", tint: assignment.kind == "ASSIGNMENT" ? Theme.terracotta : Theme.olive)
                Spacer()
                if let current = store.current, current.role == .student,
                   store.submissionFor(assignment, student: current) != nil {
                    Badge(text: "Submitted", tint: Theme.olive)
                }
            }
            Text(assignment.title).font(.headline).foregroundStyle(Theme.ink)
            Text(detail).font(.caption).foregroundStyle(Theme.muted)
            if !assignment.attachments.isEmpty {
                Label("\(assignment.attachments.count) attachment\(assignment.attachments.count == 1 ? "" : "s")", systemImage: "paperclip")
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Detail

struct AssignmentDetailView: View {
    @Environment(DemoStore.self) private var store
    let assignment: Assignment

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Card {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Badge(text: assignment.kind == "ASSIGNMENT" ? "Assignment" : "Homework", tint: assignment.kind == "ASSIGNMENT" ? Theme.terracotta : Theme.olive)
                            Badge(text: assignment.subject, tint: Theme.subjectColor(assignment.subject))
                            Spacer()
                        }
                        Text(assignment.title)
                            .font(.title2.weight(.bold))
                            .foregroundStyle(Theme.ink)
                        Text("\(store.person(assignment.teacherID)?.fullName ?? "Teacher") · \(assignment.sectionLabel)")
                            .font(.caption)
                            .foregroundStyle(Theme.muted)
                        if let due = assignment.dueDate, !due.isEmpty {
                            Label("Due \(relativeDay(due))", systemImage: "calendar")
                                .font(.subheadline)
                                .foregroundStyle(Theme.terracotta)
                        }
                        Text(assignment.instructions)
                            .font(.body)
                            .foregroundStyle(Theme.ink)
                            .padding(.top, 4)
                        ForEach(assignment.attachments, id: \.self) { attachment in
                            Label(attachment, systemImage: "doc.richtext")
                                .font(.footnote)
                                .foregroundStyle(Theme.olive)
                                .padding(8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Theme.sand, in: RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }

                if let current = store.current {
                    switch current.role {
                    case .student:
                        SubmitPanel(assignment: assignment)
                    case .teacher, .admin:
                        RosterPanel(assignment: assignment)
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("Work")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct SubmitPanel: View {
    @Environment(DemoStore.self) private var store
    let assignment: Assignment
    @State private var submissionText = ""
    @State private var fileName: String? = nil
    @State private var showingImporter = false
    @State private var error: String?
    @State private var saved = false

    var existing: Submission? {
        guard let current = store.current else { return nil }
        return store.submissionFor(assignment, student: current)
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                Text("Your submission").font(.headline).foregroundStyle(Theme.ink)
                TextEditor(text: $submissionText)
                    .frame(minHeight: 110)
                    .padding(8)
                    .background(Theme.sand, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.line))
                HStack {
                    Text(fileName ?? existing?.fileName ?? "No file attached")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                    Spacer()
                    Button {
                        showingImporter = true
                    } label: {
                        Label("Attach", systemImage: "paperclip")
                            .font(.caption.weight(.semibold))
                    }
                }
                if let error {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }
                Button {
                    do {
                        try store.submit(assignment, body: submissionText, fileName: fileName ?? existing?.fileName)
                        saved = true
                        error = nil
                    } catch let e as StoreError {
                        error = e.errorDescription
                    } catch {
                        self.error = "Couldn't submit. Try again."
                    }
                } label: {
                    Text(saved ? "Submitted ✓" : (existing == nil ? "Submit assignment" : "Update submission"))
                        .font(.headline)
                        .foregroundStyle(Theme.cream)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(existing == nil && !saved ? Theme.olive : Theme.muted, in: RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                if let existing {
                    Text("Submitted \(existing.submittedAt.formatted(date: .abbreviated, time: .shortened)) · \(existing.status == "reviewed" ? "Reviewed by teacher" : "Awaiting review")")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
            }
        }
        .fileImporter(
            isPresented: $showingImporter,
            allowedContentTypes: [.pdf, .jpeg, .png, .plainText, .item],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                fileName = urls.first?.lastPathComponent
            case .failure:
                error = "Couldn't open that file."
            }
        }
    }
}

private struct RosterPanel: View {
    @Environment(DemoStore.self) private var store
    let assignment: Assignment

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ScreenHeader(title: "Roster", subtitle: "Who submitted and who hasn't")
            ForEach(store.roster(for: assignment)) { student in
                let submission = store.submissionFor(assignment, student: student)
                Card {
                    HStack(alignment: .top, spacing: 12) {
                        AvatarView(name: student.fullName, size: 36)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(student.fullName).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                            if let submission {
                                Text(submission.fileName ?? submission.body)
                                    .font(.caption)
                                    .foregroundStyle(Theme.ink)
                                    .lineLimit(2)
                            } else {
                                Text("Not submitted yet").font(.caption).foregroundStyle(Theme.muted)
                            }
                        }
                        Spacer()
                        if let submission {
                            if submission.status == "reviewed" {
                                Badge(text: "Reviewed", tint: Theme.olive)
                            } else if store.current?.role == .teacher {
                                Button("Mark reviewed") { store.markReviewed(submission) }
                                    .font(.caption2.weight(.semibold))
                                    .foregroundStyle(Theme.olive)
                            } else {
                                Badge(text: "Needs review", tint: Theme.terracotta)
                            }
                        } else {
                            Badge(text: "Pending", tint: Theme.terracotta)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Composer

private struct NewAssignmentSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var title = ""
    @State private var subject = "Artificial Intelligence"
    @State private var sectionLabel = "IX - E"
    @State private var kind = "ASSIGNMENT"
    @State private var dueEnabled = true
    @State private var dueDate = Date().addingTimeInterval(7 * 86_400)
    @State private var instructions = ""
    @State private var attachmentName = ""
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Title", text: $title)
                    Picker("Subject", selection: $subject) {
                        ForEach(store.subjects.map(\.name), id: \.self) { Text($0).tag($0) }
                    }
                    Picker("Section", selection: $sectionLabel) {
                        ForEach(store.mySections(), id: \.self) { Text($0).tag($0) }
                    }
                    Picker("Type", selection: $kind) {
                        Text("Assignment").tag("ASSIGNMENT")
                        Text("Homework").tag("HOMEWORK")
                    }
                    Toggle("Has a due date", isOn: $dueEnabled)
                    if dueEnabled {
                        DatePicker("Due", selection: $dueDate, in: Date()..., displayedComponents: .date)
                    }
                }
                Section("Instructions") {
                    TextEditor(text: $instructions).frame(minHeight: 90)
                }
                Section("Attachment (optional)") {
                    TextField("File name, e.g. worksheet.pdf", text: $attachmentName)
                }
                if let error {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }
            }
            .navigationTitle("New assignment")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Publish") {
                        do {
                            let attachment = attachmentName.trimmingCharacters(in: .whitespaces)
                            try store.publishAssignment(
                                title: title,
                                instructions: instructions,
                                subject: subject,
                                sectionLabel: sectionLabel,
                                dueDate: dueEnabled ? isoDate(dueDate) : nil,
                                kind: kind,
                                attachments: attachment.isEmpty ? [] : [attachment]
                            )
                            isPresented = false
                        } catch let e as StoreError {
                            error = e.errorDescription
                        } catch {
                            self.error = "Couldn't publish. Try again."
                        }
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}
