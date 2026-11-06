import SwiftUI

struct ApprovalsView: View {
    @Environment(DemoStore.self) private var store

    var body: some View {
        if store.current?.role == .student {
            StudentLeaveView()
        } else {
            ReviewerApprovalsView()
        }
    }
}

// MARK: - Student: apply for leave

private struct StudentLeaveView: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresented = false

    var my: [LeaveRequest] { store.myLeaveRequests() }

    var body: some View {
        List {
            Section("Apply for leave") {
                Button {
                    isPresented = true
                } label: {
                    Label("Request leave for approval", systemImage: "plus.circle.fill")
                        .font(.headline)
                        .foregroundStyle(Theme.cream)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Theme.olive, in: RoundedRectangle(cornerRadius: 14))
                }
                .buttonStyle(.plain)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
            }

            Section("My applications") {
                if my.isEmpty {
                    EmptyState(icon: "doc.text", title: "No applications yet", subtitle: "Apply for leave and your class teacher will review it here.")
                        .listRowBackground(Color.clear)
                } else {
                    ForEach(my) { request in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(request.type).font(.subheadline.weight(.semibold))
                                Spacer()
                                Badge(text: request.status.rawValue.capitalized, tint: color(for: request.status))
                            }
                            Text("\(relativeDay(request.startDate)) → \(relativeDay(request.endDate))")
                                .font(.caption)
                                .foregroundStyle(Theme.muted)
                            Text(request.reason)
                                .font(.footnote)
                                .foregroundStyle(Theme.ink)
                        }
                        .padding(.vertical, 4)
                        .listRowBackground(Theme.cream)
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle("My leave")
        .sheet(isPresented: $isPresented) {
            RequestLeaveSheet(isPresented: $isPresented)
        }
    }

    func color(for status: LeaveStatus) -> Color {
        switch status {
        case .pending: return Theme.terracotta
        case .approved: return Theme.olive
        case .rejected: return .red
        }
    }
}

private struct RequestLeaveSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var type = "Sick Leave"
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var reason = ""
    @State private var error: String?

    let types = ["Sick Leave", "Casual Leave", "Family Leave", "Other"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Type") {
                    Picker("Leave type", selection: $type) {
                        ForEach(types, id: \.self) { Text($0).tag($0) }
                    }
                }
                Section("Dates") {
                    DatePicker("From", selection: $startDate, displayedComponents: .date)
                    DatePicker("To", selection: $endDate, displayedComponents: .date)
                }
                Section("Reason") {
                    TextEditor(text: $reason)
                        .frame(minHeight: 90)
                }
                if let error {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }
            }
            .navigationTitle("Request leave")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Submit") {
                        do {
                            try store.requestLeave(type: type, reason: reason, start: isoDate(startDate), end: isoDate(endDate))
                            isPresented = false
                        } catch let e as StoreError {
                            error = e.errorDescription
                        } catch {
                            self.error = "Couldn't submit. Please try again."
                        }
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Teacher / admin: review approvals

private struct ReviewerApprovalsView: View {
    @Environment(DemoStore.self) private var store

    var pending: [LeaveRequest] { store.pendingApprovals() }

    var body: some View {
        List {
            Section {
                if pending.isEmpty {
                    EmptyState(icon: "checkmark.circle", title: "All clear", subtitle: "No leave applications waiting on you.")
                        .listRowBackground(Color.clear)
                } else {
                    ForEach(pending) { request in
                        PendingRow(request: request)
                            .listRowBackground(Theme.cream)
                    }
                }
            } header: {
                Text("Pending review")
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle(store.current?.role == .admin ? "Leave queue" : "Leave approvals")
    }
}

private struct PendingRow: View {
    @Environment(DemoStore.self) private var store
    let request: LeaveRequest
    private var student: Person? { store.person(request.studentID) }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                AvatarView(name: student?.fullName ?? "?", size: 36)
                VStack(alignment: .leading, spacing: 2) {
                    Text(student?.fullName ?? "Unknown student")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                    Text("\(relativeDay(request.startDate)) → \(relativeDay(request.endDate)) · \(request.type)")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
            }
            Text(request.reason)
                .font(.footnote)
                .foregroundStyle(Theme.ink)
            HStack(spacing: 10) {
                Button("Approve") {
                    store.decideLeave(request.id, .approved)
                }
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Theme.cream)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
                .background(Theme.olive, in: Capsule())
                .buttonStyle(.plain)

                Button("Reject") {
                    store.decideLeave(request.id, .rejected)
                }
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Theme.terracotta)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
                .background(Theme.terracotta.opacity(0.12), in: Capsule())
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, 6)
    }
}


