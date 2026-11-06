import SwiftUI

struct CommunicationsView: View {
    @Environment(DemoStore.self) private var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                ScreenHeader(title: "Communications", subtitle: "Notices, declarations and polls")
                NoticesSection()
                DeclarationsSection()
                PollsSection()
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("Communications")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Notices

private struct NoticesSection: View {
    @Environment(DemoStore.self) private var store
    @State private var isPresenting = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                ScreenHeader(title: "Notices")
                if store.current?.role == .admin {
                    Button {
                        isPresenting = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Theme.olive)
                    }
                    .buttonStyle(.plain)
                }
            }
            if store.notices.isEmpty {
                EmptyState(icon: "megaphone", title: "No notices", subtitle: "Whole-school notices will appear here.")
            }
            ForEach(store.notices) { notice in
                NoticeRow(notice: notice)
            }
        }
        .sheet(isPresented: $isPresenting) {
            ComposeNoticeSheet(isPresented: $isPresenting)
        }
    }
}

private struct NoticeRow: View {
    @Environment(DemoStore.self) private var store
    let notice: Notice

    private var unread: Bool {
        guard let current = store.current else { return false }
        return !notice.readBy.contains(current.id)
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Badge(text: notice.audience)
                    Spacer()
                    if unread { Badge(text: "New", tint: Theme.terracotta) }
                }
                Text(notice.title).font(.headline).foregroundStyle(Theme.ink)
                Text(notice.body).font(.subheadline).foregroundStyle(Theme.ink)
                HStack {
                    Text("Published \(notice.publishedAt.formatted(date: .abbreviated, time: .shortened))")
                        .font(.caption2)
                        .foregroundStyle(Theme.muted)
                    Spacer()
                    if store.current?.role != .admin {
                        Button("Mark read") { store.markNoticeRead(notice) }
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Theme.olive)
                    } else {
                        Text("\(notice.readBy.count) read")
                            .font(.caption2)
                            .foregroundStyle(Theme.muted)
                    }
                }
            }
        }
    }
}

private struct ComposeNoticeSheet: View {
    @Environment(DemoStore.self) private var store
    @Binding var isPresented: Bool
    @State private var title = ""
    @State private var noticeBody = ""
    @State private var audience = "Whole school"
    @State private var error: String?

    let audiences = ["Whole school", "Administration only", "Grades IX-XII", "Section E"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Notice") {
                    TextField("Title", text: $title)
                    TextEditor(text: $noticeBody).frame(minHeight: 80)
                    Picker("Audience", selection: $audience) {
                        ForEach(audiences, id: \.self) { Text($0).tag($0) }
                    }
                }
                if let error { Text(error).font(.footnote).foregroundStyle(.red) }
            }
            .navigationTitle("New notice")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { isPresented = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Publish") {
                        do { try store.addNotice(title: title, body: noticeBody, audience: audience); isPresented = false }
                        catch let e as StoreError { error = e.errorDescription }
                        catch { self.error = "Couldn't publish." }
                    }
                }
            }
        }
    }
}

// MARK: - Declarations

private struct DeclarationsSection: View {
    @Environment(DemoStore.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ScreenHeader(title: "Declaration forms", subtitle: "Sign the forms assigned to you")
            ForEach(store.declarations) { declaration in
                Card {
                    HStack(spacing: 12) {
                        Image(systemName: declaration.signedBy.isEmpty ? "doc" : "doc.badge.checkmark")
                            .font(.title2)
                            .foregroundStyle(declaration.signedBy.isEmpty ? Theme.terracotta : Theme.olive)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(declaration.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                            Text(declaration.detail).font(.caption).foregroundStyle(Theme.muted)
                        }
                        Spacer()
                        if store.current?.role == .student {
                            if declaration.signedBy.contains(store.current!.id) {
                                Badge(text: "Signed", tint: Theme.olive)
                            } else {
                                Button("Sign") { store.signDeclaration(declaration) }
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(Theme.cream)
                                    .padding(.vertical, 6)
                                    .padding(.horizontal, 14)
                                    .background(Theme.olive, in: Capsule())
                            }
                        } else {
                            Badge(text: declaration.signedBy.isEmpty ? "Pending" : "Signed", tint: declaration.signedBy.isEmpty ? Theme.terracotta : Theme.olive)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Polls

private struct PollsSection: View {
    @Environment(DemoStore.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ScreenHeader(title: "Polls", subtitle: "Your school votes")
            ForEach(store.polls) { poll in
                PollRow(poll: poll)
            }
        }
    }
}

private struct PollRow: View {
    @Environment(DemoStore.self) private var store
    let poll: Poll

    private var myVote: String? {
        store.current.flatMap { poll.votes[$0.id] }
    }

    private var counts: [String: Int] {
        var c: [String: Int] = [:]
        for option in poll.votes.values { c[option, default: 0] += 1 }
        return c
    }

    private var total: Int { max(1, poll.votes.count) }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                Text(poll.question).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                Text("\(poll.audience) · closes \(relativeDay(poll.closesAt)) · \(poll.votes.count) votes")
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
                VStack(spacing: 8) {
                    ForEach(poll.options) { option in
                        let count = counts[option.id] ?? 0
                        Button {
                            store.vote(poll, optionID: option.id)
                        } label: {
                            HStack {
                                Text(option.label).font(.footnote).foregroundStyle(Theme.ink)
                                Spacer()
                                if myVote != nil {
                                    Text("\(Int((Double(count) / Double(total)) * 100))%").font(.caption2.weight(.bold)).foregroundStyle(Theme.olive)
                                }
                                if myVote == option.id {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.olive)
                                }
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(Theme.sand, in: RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}
