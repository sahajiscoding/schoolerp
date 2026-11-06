import SwiftUI

struct GalleryView: View {
    @Environment(DemoStore.self) private var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ScreenHeader(title: "Gallery", subtitle: "School in pictures")
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(store.gallery) { album in
                        Card {
                            VStack(alignment: .leading, spacing: 10) {
                                Image(systemName: "photo.on.rectangle.angled")
                                    .font(.system(size: 40))
                                    .foregroundStyle(Theme.terracotta)
                                Text(album.title)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(Theme.ink)
                                    .multilineTextAlignment(.leading)
                                Text("\(album.count) photos")
                                    .font(.caption)
                                    .foregroundStyle(Theme.muted)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("Gallery")
        .navigationBarTitleDisplayMode(.inline)
    }
}
