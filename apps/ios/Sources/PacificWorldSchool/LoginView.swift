import SwiftUI

struct LoginView: View {
    @Environment(DemoStore.self) private var store
    @State private var login = ""
    @State private var password = ""
    @State private var error: String?

    var body: some View {
        ZStack {
            Theme.sand.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 24) {
                    Spacer(minLength: 40)

                    ZStack {
                        Circle().fill(Theme.olive).frame(width: 108, height: 108)
                        VStack(spacing: 2) {
                            Text("PWS")
                                .font(.system(size: 30, weight: .heavy, design: .rounded))
                                .foregroundStyle(Theme.cream)
                            Image(systemName: "graduationcap")
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(Theme.terracotta)
                        }
                    }

                    VStack(spacing: 6) {
                        Text("Pacific World School")
                            .font(.title.weight(.bold))
                            .foregroundStyle(Theme.ink)
                        Text("Sign in with your school-issued account")
                            .font(.subheadline)
                            .foregroundStyle(Theme.muted)
                    }

                    Card {
                        VStack(spacing: 14) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Login ID").font(.caption.weight(.semibold)).foregroundStyle(Theme.muted)
                                TextField("Admission No / Staff ID", text: $login)
                                    .autocapitalization(.allCharacters)
                                    .textInputAutocapitalization(.characters)
                                    .disableAutocorrection(true)
                                    .padding(12)
                                    .background(Theme.sand, in: RoundedRectangle(cornerRadius: 12))
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Password").font(.caption.weight(.semibold)).foregroundStyle(Theme.muted)
                                SecureField("Password", text: $password)
                                    .padding(12)
                                    .background(Theme.sand, in: RoundedRectangle(cornerRadius: 12))
                            }

                            if let error {
                                Text(error)
                                    .font(.footnote)
                                    .foregroundStyle(.red)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            Button {
                                signIn()
                            } label: {
                                Text("Sign in")
                                    .font(.headline)
                                    .foregroundStyle(Theme.cream)
                                    .frame(maxWidth: .infinity)
                                    .padding(14)
                                    .background(Theme.olive, in: RoundedRectangle(cornerRadius: 14))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    VStack(spacing: 10) {
                        HStack {
                            Rectangle().fill(Theme.muted.opacity(0.4)).frame(height: 1)
                            Text("or try a demo").font(.caption).foregroundStyle(Theme.muted)
                            Rectangle().fill(Theme.muted.opacity(0.4)).frame(height: 1)
                        }
                        HStack(spacing: 8) {
                            DemoRoleButton(title: "Admin", systemImage: "shield.lefthalf.filled") { store.signInAsDemo(.admin) }
                            DemoRoleButton(title: "Teacher", systemImage: "person.fill") { store.signInAsDemo(.teacher) }
                            DemoRoleButton(title: "Student", systemImage: "graduationcap.fill") { store.signInAsDemo(.student) }
                        }
                    }

                    Text("Demo build · mirrors the web console · no network calls")
                        .font(.caption2)
                        .foregroundStyle(Theme.muted.opacity(0.8))

                    Spacer(minLength: 24)
                }
                .padding(20)
                .frame(maxWidth: 460)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationBarHidden(true)
    }

    private func signIn() {
        do {
            try store.signIn(login: login.trimmingCharacters(in: .whitespaces), password: password)
            error = nil
        } catch let e as StoreError {
            error = e.errorDescription
        } catch {
            self.error = "Something went wrong. Please try again."
        }
    }
}

private struct DemoRoleButton: View {
    var title: String
    var systemImage: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: systemImage)
                    .font(.title3)
                    .foregroundStyle(Theme.terracotta)
                Text(title).font(.caption.weight(.semibold)).foregroundStyle(Theme.ink)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Theme.cream, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line))
        }
        .buttonStyle(.plain)
    }
}
