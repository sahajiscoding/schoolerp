import SwiftUI

struct StudyRoomView: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresenting = false
    @State private var subjectFilter: String? = nil

    var isStaff: Bool { store.current?.role == .teacher || store.current?.role == .admin }

    var materials: [StudyMaterial] {
        var items = store.materials.sorted { $0.createdAt > $1.createdAt }
        if let subjectFilter { items = items.filter { $0.subject == subjectFilter } }
        return items
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ScreenHeader(title: "Study Room", subtitle: "PDFs and notes your teachers shared")

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(title: "All", isOn: subjectFilter == nil) { subjectFilter = nil }
                        ForEach(store.subjects) { subject in
                            FilterChip(title: subject.name, isOn: subjectFilter == subject.name) {
                                subjectFilter = subjectFilter == subject.name ? nil : subject.name
                            }
                        }
                    }
                }

                if materials.isEmpty {
                    EmptyState(icon: "books.vertical", title: "Nothing shared yet", subtitle: "Teachers will share PDFs for your section here.")
                } else {
                    ForEach(materials) { material in
                        MaterialRow(material: material)
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("Study Room")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isStaff {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresenting = true
                    } label: {
                        Label("Share PDF", systemImage: "square.and.arrow.up")
                    }
                }
            }
        }
        .sheet(isPresented: $isPresenting) {
            AddMaterialSheet(isPresented: $isPresenting)
        }
    }
}

private struct FilterChip: View {
    let title: String
    let isOn: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(isOn ? Theme.cream : Theme.olive)
                .padding(.vertical, 8)
                .padding(.horizontal, 14)
                .background(isOn ? Theme.olive : Theme.olive.opacity(0.12), in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct MaterialRow: View {
    @Environment(DemoStore.self) private var store
    let material: StudyMaterial

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top) {
                    Image(systemName: "doc.richtext.fill")
                        .font(.title)
                        .foregroundStyle(Theme.terracotta)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(material.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                        Text(material.detail).font(.caption).foregroundStyle(Theme.muted)
                    }
                    Spacer()
                }
                HStack {
                    Badge(text: material.subject, tint: Theme.subjectColor(material.subject))
                    Text(material.fileName)
                        .font(.caption2)
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                    Spacer()
                    Text(material.fileSize)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Theme.olive)
                }
                Text("Shared by \(store.person(material.uploadedBy)?.fullName ?? "Teacher") · \(material.createdAt.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption2)
                    .foregroundStyle(Theme.muted)
            }
        }
    }
}

private struct AddMaterialSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var title = ""
    @State private var subject = "Artificial Intelligence"
    @State private var fileName = ""
    @State private var fileSize = ""
    @State private var detail = ""
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Material") {
                    TextField("Title", text: $title)
                    Picker("Subject", selection: $subject) {
                        ForEach(store.subjects.map(\.name), id: \.self) { Text($0).tag($0) }
                    }
                    TextEditor(text: $detail).frame(minHeight: 56)
                }
                Section("File") {
                    TextField("File name (e.g. notes.pdf)", text: $fileName)
                        .textInputAutocapitalization(.never)
                        .disableAutocorrection(true)
                    TextField("Size", text: $fileSize)
                }
                if let error { Text(error).font(.footnote).foregroundStyle(.red) }
                Section {
                    Text("On this device the file is referenced by name; the binary lives in the school’s private storage.")
                        .font(.caption2)
                        .foregroundStyle(Theme.muted)
                }
            }
            .navigationTitle("Share a PDF")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Share") {
                        do {
                            try store.addMaterial(title: title, subject: subject, fileName: fileName, size: fileSize.isEmpty ? "—" : fileSize, detail: detail)
                            isPresented = false
                        } catch let e as StoreError {
                            error = e.errorDescription
                        } catch {
                            self.error = "Couldn't share."
                        }
                    }
                }
            }
        }
    }
}
