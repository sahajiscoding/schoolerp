import SwiftUI

struct LibraryView: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresenting = false
    @State private var issueTarget: String? = nil
    @State private var query = ""

    private var isStaff: Bool { store.current?.role == .admin || store.current?.role == .teacher }

    var filtered: [Book] {
        let all = store.books.sorted { $0.title < $1.title }
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { return all }
        let needle = query.lowercased()
        return all.filter { $0.title.lowercased().contains(needle) || $0.author.lowercased().contains(needle) || $0.accessionNo.lowercased().contains(needle) }
    }

    var body: some View {
        List {
            Section {
                TextField("Search by title, author, or accession number", text: $query)
                    .textInputAutocapitalization(.never)
                    .disableAutocorrection(true)
                    .padding(10)
                    .background(Theme.cream, in: RoundedRectangle(cornerRadius: 12))
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
            }

            if filtered.isEmpty {
                EmptyState(icon: "books.vertical", title: "No matches", subtitle: "Try a different search.")
                    .listRowBackground(Color.clear)
            }

            ForEach(filtered) { book in
                BookRow(book: book, isStaff: isStaff, issueTarget: $issueTarget)
                    .listRowBackground(Theme.cream)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle("My Library")
        .toolbar {
            if isStaff {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresenting = true
                    } label: {
                        Label("Add book", systemImage: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $isPresenting) {
            AddBookSheet(isPresented: $isPresenting)
        }
        .confirmationDialog("Issue to", isPresented: Binding(get: { issueTarget != nil }, set: { if !$0 { issueTarget = nil } }), titleVisibility: .visible) {
            ForEach(store.students(in: "IX - E")) { student in
                Button(student.fullName) {
                    if let id = issueTarget, let book = store.books.first(where: { $0.id == id }) {
                        try? store.issueBook(book, to: student.id)
                    }
                    issueTarget = nil
                }
            }
            Button("Cancel", role: .cancel) { issueTarget = nil }
        }
    }
}

private struct BookRow: View {
    @Environment(DemoStore.self) private var store
    let book: Book
    let isStaff: Bool
    @Binding var issueTarget: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(book.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                    Text(book.author).font(.caption).foregroundStyle(Theme.muted)
                    Text("\(book.accessionNo) · \(book.category)").font(.caption2).foregroundStyle(Theme.muted)
                }
                Spacer()
                Badge(text: "\(book.available)/\(book.totalCopies) left", tint: book.available > 0 ? Theme.olive : .red)
            }

            if let issuedTo = book.issuedTo {
                Text("Issued to \(store.person(issuedTo)?.fullName ?? issuedTo)")
                    .font(.caption2)
                    .foregroundStyle(Theme.terracotta)
            }

            HStack(spacing: 10) {
                if isStaff {
                    if book.issuedTo != nil {
                        Button("Return") { store.returnBook(book) }
                            .font(.caption.weight(.semibold))
                            .buttonStyle(.bordered)
                    } else {
                        Button("Issue") { issueTarget = book.id }
                            .font(.caption.weight(.semibold))
                            .buttonStyle(.bordered)
                    }
                } else {
                    Button("Reserve") { store.reserveBook(book) }
                        .font(.caption.weight(.semibold))
                        .buttonStyle(.bordered)
                        .disabled(book.available == 0)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

private struct AddBookSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var title = ""
    @State private var author = ""
    @State private var accession = ""
    @State private var category = "Fiction"
    @State private var copies = 1
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Book") {
                    TextField("Title", text: $title)
                    TextField("Author", text: $author)
                    TextField("Accession number (e.g. LIB-004)", text: $accession)
                        .textInputAutocapitalization(.never)
                        .disableAutocorrection(true)
                    Picker("Category", selection: $category) {
                        ForEach(["Fiction", "Biography", "History", "Science", "Reference"], id: \.self) { Text($0).tag($0) }
                    }
                    Stepper("Copies: \(copies)", value: $copies, in: 1...100)
                }
                if let error { Text(error).font(.footnote).foregroundStyle(.red) }
            }
            .navigationTitle("Add book")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        do {
                            try store.addBook(title: title, author: author, accession: accession, category: category, copies: copies)
                            isPresented = false
                        } catch let e as StoreError {
                            error = e.errorDescription
                        } catch {
                            self.error = "Couldn't add."
                        }
                    }
                }
            }
        }
    }
}
