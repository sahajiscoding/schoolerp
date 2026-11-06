import SwiftUI

struct ProfileView: View {
    @Environment(DemoStore.self) private var store
    @State private var confirmDeletion = false
    @State private var deletionRequested = false

    var current: Person { store.current! }

    var body: some View {
        List {
            Section {
                HStack(spacing: 16) {
                    AvatarView(name: current.fullName, size: 72)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(current.fullName)
                            .font(.title3.weight(.bold))
                            .foregroundStyle(Theme.ink)
                        Text(current.role.rawValue.capitalized)
                            .font(.subheadline)
                            .foregroundStyle(Theme.muted)
                        if !current.sectionKey.isEmpty {
                            Text(current.sectionKey)
                                .font(.caption)
                                .foregroundStyle(Theme.muted)
                        }
                    }
                }
                .padding(.vertical, 8)
                .listRowBackground(Color.clear)
            }

            Section("Account") {
                LabeledContent("Login ID", value: current.loginID)
                if !current.email.isEmpty { LabeledContent("Email", value: current.email) }
                if !current.phone.isEmpty { LabeledContent("Phone", value: current.phone) }
                if let dob = current.dob { LabeledContent("Date of birth", value: relativeDay(dob)) }
                if let admissionNo = current.admissionNo { LabeledContent("Admission no", value: admissionNo) }
                if let classTeacher = current.classTeacherOf { LabeledContent("Class teacher of", value: classTeacher) }
            }

            Section {
                Text("Password is managed by the school office. Forget it? Ask the office to reissue your password; it is never stored in this app.")
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            } header: {
                Text("Password")
            }

            Section {
                if deletionRequested {
                    Label("Request sent to the school office.", systemImage: "checkmark.seal.fill")
                        .font(.subheadline)
                        .foregroundStyle(Theme.olive)
                } else {
                    Button {
                        confirmDeletion = true
                    } label: {
                        Label("Request account deletion", systemImage: "trash")
                            .foregroundStyle(.red)
                    }
                }
            } header: {
                Text("Data & privacy")
            } footer: {
                Text("The school reviews every deletion request before an account is removed.")
            }

            Section {
                Button {
                    store.signOut()
                } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                        .foregroundStyle(Theme.terracotta)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle("Profile")
        .confirmationDialog("Request deletion of your account?", isPresented: $confirmDeletion, titleVisibility: .visible) {
            Button("Request deletion", role: .destructive) {
                store.requestAccountDeletion()
                deletionRequested = true
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your request goes to the school office. This does not delete anything immediately.")
        }
    }
}
