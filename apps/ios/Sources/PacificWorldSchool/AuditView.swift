import SwiftUI

struct AuditView: View {
    @Environment(DemoStore.self) private var store

    var body: some View {
        List {
            Section {
                if store.audit.isEmpty {
                    EmptyState(icon: "list.clipboard", title: "Nothing logged yet", subtitle: "Sensitive actions will appear here.")
                        .listRowBackground(Color.clear)
                } else {
                    ForEach(store.audit) { entry in
                        AuditRow(entry: entry)
                            .listRowBackground(Theme.cream)
                    }
                }
            } header: {
                Text("Read-only audit trail")
            } footer: {
                Text("Admin actions are logged and cannot be edited here.")
                    .font(.caption)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle("Audit Log")
    }
}

private struct AuditRow: View {
    @Environment(DemoStore.self) private var store
    let entry: AuditEntry

    private var actor: String {
        store.person(entry.actorID)?.fullName ?? entry.actorID
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.action).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
            Text(entry.target).font(.caption).foregroundStyle(Theme.muted)
            Text("\(actor) · \(entry.at.formatted(date: .abbreviated, time: .shortened))")
                .font(.caption2)
                .foregroundStyle(Theme.muted)
        }
        .padding(.vertical, 4)
    }
}
