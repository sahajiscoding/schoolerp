import SwiftUI

struct ReportCardsView: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresenting = false

    var cards: [ReportCard] { store.reportCardsForCurrent() }
    var isStaff: Bool { store.current?.role == .teacher || store.current?.role == .admin }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ScreenHeader(title: "Report Cards", subtitle: "Marks, grades and remarks")
                if cards.isEmpty {
                    EmptyState(icon: "doc.plaintext", title: "No cards yet", subtitle: isStaff ? "Compose one and it will appear here." : "Your half-yearly card will appear here.")
                } else {
                    ForEach(cards) { card in
                        ReportCardView(card: card)
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("My Report Card")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isStaff {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresenting = true
                    } label: {
                        Label("Compose", systemImage: "square.and.pencil")
                    }
                }
            }
        }
        .sheet(isPresented: $isPresenting) {
            ComposeReportCardSheet(isPresented: $isPresenting)
        }
    }
}

private struct ReportCardView: View {
    @Environment(DemoStore.self) private var store
    let card: ReportCard

    private var student: Person? { store.person(card.studentID) }
    private var total: Int { card.subjects.reduce(0) { $0 + $1.marks } }
    private var average: Double { card.subjects.isEmpty ? 0 : Double(total) / Double(card.subjects.count) }

    var summary: String {
        var lines = ["Pacific World School — \(card.term)"]
        if let student { lines.append("Student: \(student.fullName) · \(student.classLabel ?? "")-\(student.sectionLabel ?? "")") }
        for s in card.subjects {
            lines.append("\(s.subject): \(s.marks)/100 — \(s.grade)")
        }
        lines.append("Average: \(String(format: "%.1f", average))")
        lines.append("Remarks: \(card.remarks)")
        return lines.joined(separator: "\n")
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(student?.fullName ?? "Student")
                            .font(.headline)
                            .foregroundStyle(Theme.ink)
                        Text("\(card.term) · \(card.generatedAt.formatted(date: .abbreviated, time: .omitted))")
                            .font(.caption)
                            .foregroundStyle(Theme.muted)
                    }
                    Spacer()
                    ShareLink(item: summary) {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundStyle(Theme.olive)
                    }
                }

                VStack(spacing: 8) {
                    ForEach(card.subjects) { subject in
                        HStack {
                            Text(subject.subject).font(.subheadline).foregroundStyle(Theme.ink)
                            Spacer()
                            Text("\(subject.marks)")
                                .font(.subheadline.monospacedDigit().weight(.semibold))
                                .foregroundStyle(Theme.ink)
                            Text(subject.grade)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(gradeColor(subject.grade))
                                .frame(width: 34, alignment: .trailing)
                        }
                    }
                }

                Divider()
                HStack {
                    Text("Average \(String(format: "%.1f", average))")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Theme.olive)
                    Spacer()
                }
                Text("“\(card.remarks)”")
                    .font(.footnote)
                    .italic()
                    .foregroundStyle(Theme.muted)
            }
        }
    }

    private func gradeColor(_ grade: String) -> Color {
        switch grade.prefix(1) {
        case "A": return Theme.olive
        case "B": return Theme.terracotta
        default: return Theme.muted
        }
    }
}

private struct ComposeReportCardSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var studentID = "p-student-1"
    @State private var term = "Half Yearly"
    @State private var marks: [String: Int] = [:]
    @State private var remarks = ""
    @State private var error: String?

    var students: [Person] { store.students(in: "IX - E") }

    var body: some View {
        NavigationStack {
            Form {
                Section("Student & term") {
                    Picker("Student", selection: $studentID) {
                        ForEach(students) { Text($0.fullName).tag($0.id) }
                    }
                    Picker("Term", selection: $term) {
                        Text("Half Yearly").tag("Half Yearly")
                        Text("Annual").tag("Annual")
                        Text("Final").tag("Final")
                    }
                }
                Section("Marks") {
                    ForEach(store.subjects) { subject in
                        Stepper("\(subject.name): \(Int(marks[subject.name] ?? 0))", value: Binding(
                            get: { marks[subject.name] ?? 0 },
                            set: { marks[subject.name] = $0 }
                        ), in: 0...100, step: 5)
                    }
                }
                Section("Remarks") {
                    TextEditor(text: $remarks).frame(minHeight: 70)
                }
                if let error { Text(error).font(.footnote).foregroundStyle(.red) }
            }
            .navigationTitle("Compose report card")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Generate") {
                        if remarks.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            error = "Please add a remark."
                            return
                        }
                        store.generateReportCard(studentID: studentID, term: term, marks: marks, remarks: remarks)
                        isPresented = false
                    }
                }
            }
        }
    }
}
