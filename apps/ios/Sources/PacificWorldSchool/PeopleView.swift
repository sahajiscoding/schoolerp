import SwiftUI

struct PeopleView: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresenting = false
    @State private var query = ""

    var filtered: [Person] {
        let all = store.people.sorted { $0.fullName < $1.fullName }
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { return all }
        let q = query.lowercased()
        return all.filter { $0.fullName.lowercased().contains(q) || $0.loginID.lowercased().contains(q) || $0.role.rawValue == q }
    }

    var body: some View {
        List {
            Section {
                TextField("Search name, login ID, or role", text: $query)
                    .textInputAutocapitalization(.never)
                    .disableAutocorrection(true)
                    .padding(10)
                    .background(Theme.cream, in: RoundedRectangle(cornerRadius: 12))
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
            }

            let admins = filtered.filter { $0.role == .admin }
            let teachers = filtered.filter { $0.role == .teacher }
            let students = filtered.filter { $0.role == .student }

            if !admins.isEmpty {
                Section("Administration") {
                    ForEach(admins) { PersonRow(person: $0).listRowBackground(Theme.cream) }
                }
            }
            if !teachers.isEmpty {
                Section("Teachers") {
                    ForEach(teachers) { PersonRow(person: $0).listRowBackground(Theme.cream) }
                }
            }
            if !students.isEmpty {
                Section("Students") {
                    ForEach(students) { PersonRow(person: $0).listRowBackground(Theme.cream) }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle("People")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isPresenting = true
                } label: {
                    Label("Add student", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $isPresenting) {
            AddStudentSheet(isPresented: $isPresenting)
        }
    }
}

private struct PersonRow: View {
    let person: Person

    var body: some View {
        HStack(spacing: 12) {
            AvatarView(name: person.fullName, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(person.fullName).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                Text("\(person.loginID) · \(person.role.rawValue.capitalized)" +
                     (person.sectionKey.isEmpty ? "" : " · \(person.sectionKey)") +
                     (person.email.isEmpty ? "" : " · \(person.email)"))
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
                    .lineLimit(2)
            }
            Spacer()
            if !person.isActive { Badge(text: "Inactive", tint: .red) }
        }
        .padding(.vertical, 4)
    }
}

private struct AddStudentSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var name = ""
    @State private var admissionNo = ""
    @State private var dob = ""
    @State private var classLabel = "IX"
    @State private var sectionLabel = "E"
    @State private var error: String?
    @State private var derivedPassword: String?

    var derived: String? { passwordFromDOB(dob) }

    var body: some View {
        NavigationStack {
            Form {
                Section("Student") {
                    TextField("Full name", text: $name)
                        .textInputAutocapitalization(.words)
                    TextField("Admission no (e.g. 0191/18)", text: $admissionNo)
                        .textInputAutocapitalization(.never)
                        .disableAutocorrection(true)
                    TextField("Date of birth (YYYY-MM-DD)", text: $dob)
                        .keyboardType(.numbersAndPunctuation)
                        .textInputAutocapitalization(.none)
                        .disableAutocorrection(true)
                    Picker("Class", selection: $classLabel) {
                        ForEach(store.classes.map(\.name), id: \.self) { Text($0).tag($0) }
                    }
                    Picker("Section", selection: $sectionLabel) {
                        ForEach(store.classes.first(where: { $0.name == classLabel })?.sections ?? [], id: \.self) { Text($0).tag($0) }
                    }
                }

                if let derived {
                    Section("School-issued password (derived from DOB)") {
                        Text(derived)
                            .font(.headline.monospaced())
                            .foregroundStyle(Theme.olive)
                    }
                }

                Section {
                    Text("Student signs in with the admission number. The password is Student@DDMMYYYY — computed from the date of birth, never stored.")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }

                if let derivedPassword {
                    Section("Created") {
                        Text("Initial password: \(derivedPassword)")
                            .font(.subheadline.monospaced())
                        Text("Hand this to the student’s parent in writing. Do not share over chat.")
                            .font(.caption)
                            .foregroundStyle(Theme.muted)
                    }
                }

                if let error { Text(error).font(.footnote).foregroundStyle(.red) }
            }
            .navigationTitle("Add student")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        do {
                            derivedPassword = try store.addStudent(name: name, admissionNo: admissionNo, dob: dob, classLabel: classLabel, sectionLabel: sectionLabel)
                            error = nil
                        } catch let e as StoreError {
                            error = e.errorDescription
                            derivedPassword = nil
                        } catch {
                            self.error = "Couldn't create the account."
                            derivedPassword = nil
                        }
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}
