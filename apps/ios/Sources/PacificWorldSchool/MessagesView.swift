import SwiftUI

struct MessagesView: View {
    @Environment(DemoStore.self) private var store
    @State private var isComposing = false

    var threads: [ChatThread] { store.threadsForCurrent() }

    var body: some View {
        List {
            if store.current?.role == .admin {
                Section {
                    Label("You have read access to every thread. Every open is audited.", systemImage: "eye.fill")
                        .font(.footnote)
                        .foregroundStyle(Theme.terracotta)
                        .listRowBackground(Theme.cream)
                }
            }
            ForEach(threads) { thread in
                NavigationLink(destination: ThreadView(thread: thread)) {
                    ThreadRow(thread: thread)
                }
                .listRowBackground(Theme.cream)
            }
            if threads.isEmpty {
                EmptyState(icon: "bubble.left.and.bubble.right", title: "No conversations yet", subtitle: store.current?.role == .teacher ? "Compose a message to your class to start a private thread." : "Your class teacher will start a thread here.")
                    .listRowBackground(Color.clear)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.sand)
        .navigationTitle("Messages")
        .toolbar {
            if store.current?.role == .teacher {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isComposing = true
                    } label: {
                        Label("Compose", systemImage: "square.and.pencil")
                    }
                }
            }
        }
        .sheet(isPresented: $isComposing) {
            ComposeView(isPresented: $isComposing)
        }
    }
}

private struct ThreadRow: View {
    @Environment(DemoStore.self) private var store
    let thread: ChatThread

    private var counterpart: Person? {
        store.current?.role == .student ? store.person(thread.teacherID) : store.person(thread.studentID)
    }

    private var lastMessage: String {
        store.messages(in: thread).last?.body ?? ""
    }

    var body: some View {
        HStack(spacing: 12) {
            AvatarView(name: counterpart?.fullName ?? "?", size: 40)
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(counterpart?.fullName ?? "Unknown")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                    Spacer()
                    Text(thread.lastMessageAt.formatted(date: .abbreviated, time: .shortened))
                        .font(.caption2)
                        .foregroundStyle(Theme.muted)
                }
                Text(thread.subject)
                    .font(.caption)
                    .foregroundStyle(Theme.terracotta)
                Text(lastMessage)
                    .font(.footnote)
                    .foregroundStyle(Theme.muted)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 6)
    }
}

struct ThreadView: View {
    @Environment(DemoStore.self) private var store
    let thread: ChatThread
    @State private var text = ""
    @State private var error: String?

    private var counterpart: Person? {
        store.current?.role == .student ? store.person(thread.teacherID) : store.person(thread.studentID)
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(store.messages(in: thread)) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }
                    }
                    .padding(16)
                }
                .onChange(of: store.messages.count) { _, _ in
                    if let last = store.messages(in: thread).last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
                .task {
                    if let last = store.messages(in: thread).last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }

            HStack(alignment: .bottom, spacing: 10) {
                TextField("Write a message…", text: $text, axis: .vertical)
                    .lineLimit(1...5)
                    .padding(12)
                    .background(Theme.cream, in: RoundedRectangle(cornerRadius: 18))
                Button {
                    send()
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundStyle(Theme.cream)
                        .padding(12)
                        .background(Theme.olive, in: Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(12)
            .background(Theme.sand)
            .overlay(Rectangle().fill(Theme.line).frame(height: 1), alignment: .top)

            if let error {
                Text(error).font(.caption).foregroundStyle(.red).padding(.bottom, 8)
            }
        }
        .background(Theme.sand)
        .navigationTitle(counterpart?.fullName ?? "Conversation")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func send() {
        let body = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return }
        do {
            try store.sendMessage(in: thread, body: body)
            text = ""
            error = nil
        } catch let e as StoreError {
            error = e.errorDescription
        } catch {
            self.error = "Couldn't send. Try again."
        }
    }
}

private struct MessageBubble: View {
    @Environment(DemoStore.self) private var store
    let message: ChatMessage

    var outgoing: Bool { store.current?.id == message.senderID }

    var body: some View {
        HStack {
            if outgoing { Spacer(minLength: 48) }
            VStack(alignment: .leading, spacing: 4) {
                Text(message.body)
                    .font(.body)
                    .foregroundStyle(outgoing ? Theme.cream : Theme.ink)
                Text(message.createdAt.formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundStyle(outgoing ? .white.opacity(0.8) : Theme.muted)
            }
            .padding(10)
            .background(outgoing ? Theme.olive : Theme.cream, in: RoundedRectangle(cornerRadius: 16))
            .frame(maxWidth: 320, alignment: outgoing ? .trailing : .leading)
            if !outgoing { Spacer(minLength: 48) }
        }
    }
}

private struct ComposeView: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var subject = ""
    @State private var messageBody = ""
    @State private var selected = Set<String>()
    @State private var error: String?

    var students: [Person] {
        store.students(in: "IX - E")
    }

    var body: some View {
        NavigationStack {
            List {
                Section("To") {
                    ForEach(students) { student in
                        Button {
                            if selected.contains(student.id) { selected.remove(student.id) } else { selected.insert(student.id) }
                        } label: {
                            HStack {
                                AvatarView(name: student.fullName, size: 28)
                                Text(student.fullName).foregroundStyle(Theme.ink)
                                Spacer()
                                if selected.contains(student.id) {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.olive)
                                } else {
                                    Image(systemName: "circle").foregroundStyle(Theme.muted)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(Theme.cream)
                    }
                }
                Section("Message") {
                    TextField("Subject", text: $subject)
                        .textInputAutocapitalization(.sentences)
                    TextEditor(text: $messageBody).frame(minHeight: 120)
                }
                if let error {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }
                Section {
                    Text("Recipients you select are the students you teach. Unauthorized targets are rejected, not silently filtered.")
                        .font(.caption2)
                        .foregroundStyle(Theme.muted)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.sand)
            .navigationTitle("New message")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Send") {
                        do {
                            try store.sendMessage(toStudentIDs: Array(selected), subject: subject.isEmpty ? "Message" : subject, body: messageBody)
                            isPresented = false
                        } catch let e as StoreError {
                            error = e.errorDescription
                        } catch {
                            self.error = "Couldn't send. Try again."
                        }
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}
