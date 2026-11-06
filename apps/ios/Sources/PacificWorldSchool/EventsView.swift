import SwiftUI

struct EventsView: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresenting = false
    @State private var selectedKind: String? = nil

    private let kinds = ["All", "holiday", "meeting", "event"]

    var filtered: [SchoolEvent] {
        let sorted = store.events.sorted { $0.startDate < $1.startDate }
        guard let selectedKind, selectedKind != "All" else { return sorted }
        return sorted.filter { $0.kind == selectedKind }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(kinds, id: \.self) { kind in
                        Button {
                            selectedKind = kind == "All" ? nil : kind
                        } label: {
                            Text(kind == "All" ? "All" : titleCase(kind))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle((selectedKind ?? "All") == kind ? Theme.cream : Theme.olive)
                                .padding(.vertical, 8)
                                .padding(.horizontal, 16)
                                .background((selectedKind ?? "All") == kind ? Theme.olive : Theme.olive.opacity(0.12), in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
            .background(Theme.sand)

            List {
                if filtered.isEmpty {
                    EmptyState(icon: "calendar.badge.exclamationmark", title: "Nothing scheduled", subtitle: "Events matching this filter will show here.")
                        .listRowBackground(Color.clear)
                }
                ForEach(filtered) { event in
                    EventRow(event: event)
                        .listRowBackground(Theme.cream)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.sand)
        }
        .navigationTitle("Events & Calendar")
        .toolbar {
            if store.current?.role == .admin || store.current?.role == .teacher {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresenting = true
                    } label: {
                        Label("Add event", systemImage: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $isPresenting) {
            AddEventSheet(isPresented: $isPresenting)
        }
    }
}

private struct EventRow: View {
    let event: SchoolEvent

    private var icon: String {
        switch event.kind {
        case "holiday": return "sun.max.fill"
        case "meeting": return "person.2.wave.2.fill"
        default: return "trophy.fill"
        }
    }
    private var tint: Color {
        switch event.kind {
        case "holiday": return Theme.terracotta
        case "meeting": return Theme.olive
        default: return Theme.olive
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(tint)
                .frame(width: 40, height: 40)
                .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                Text(event.detail).font(.caption).foregroundStyle(Theme.muted)
                Text("\(relativeDay(event.startDate))" + (event.endDate != event.startDate ? " → \(relativeDay(event.endDate))" : "") + " · \(event.audience)")
                    .font(.caption2)
                    .foregroundStyle(Theme.muted)
            }
        }
        .padding(.vertical, 6)
    }
}

private struct AddEventSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var title = ""
    @State private var detail = ""
    @State private var kind = "event"
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var audience = "Whole school"
    @State private var error: String?

    private var isTeacher: Bool { store.current?.role == .teacher }

    var body: some View {
        NavigationStack {
            Form {
                Section("Event") {
                    TextField("Title", text: $title)
                    TextEditor(text: $detail).frame(minHeight: 60)
                    Picker("Type", selection: $kind) {
                        Text("Event").tag("event")
                        Text("Holiday").tag("holiday")
                        Text("Meeting").tag("meeting")
                    }
                }
                Section("When") {
                    DatePicker("From", selection: $startDate, displayedComponents: .date)
                    DatePicker("To", selection: $endDate, displayedComponents: .date)
                }
                Section {
                    if isTeacher {
                        Text("Teachers can publish only class-scoped events. This will target \(store.current?.sectionKey ?? "your section").")
                            .font(.caption)
                            .foregroundStyle(Theme.muted)
                    } else {
                        Picker("Audience", selection: $audience) {
                            Text("Whole school").tag("Whole school")
                            Text("Grades IX-XII").tag("Grades IX-XII")
                            Text("Section E").tag("Section E")
                        }
                    }
                }
                if let error { Text(error).font(.footnote).foregroundStyle(.red) }
            }
            .navigationTitle("New event")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Publish") {
                        do {
                            try store.addEvent(title: title, detail: detail, kind: kind, start: isoDate(startDate), end: isoDate(endDate), audience: audience)
                            isPresented = false
                        } catch let e as StoreError {
                            error = e.errorDescription
                        } catch {
                            self.error = "Couldn't publish."
                        }
                    }
                }
            }
        }
    }
}
