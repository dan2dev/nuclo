// Native navigation for the Apple host: the router's tabs, stacks and screens.
//
// Shared SwiftUI navigation across iOS and macOS:
//   - TabView with .tabViewStyle(.sidebarAdaptable): native bottom tab bar on iPhone
//     (with Liquid Glass, bounce and re-tap behavior) and an adaptable sidebar on iPad and macOS.
//   - NavigationStack(path:): native UINavigationController push/pop transitions, large titles
//     on root screens, inline titles on pushed screens, interactive edge-swipe back on iOS,
//     and native toolbar back button + window title integration on macOS.
//
// JS owns the stack (StackController.model, from insert/remove ops); sync() updates the
// NavigationStack path once per batch. When the user goes back natively, the host updates
// its model first, then reports "pop" with the depth left.
import Combine
import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// Semantic tab icons → SF Symbols.
func symbol(_ icon: String) -> String {
    ["chart": "chart.bar.fill", "photo": "photo.on.rectangle", "person": "person.crop.circle",
     "home": "house.fill", "search": "magnifyingglass", "bell": "bell.fill"][icon] ?? icon
}

@MainActor
private func makeHosting<Content: SwiftUI.View>(_ rootView: Content) -> ViewController {
    #if os(macOS)
    let controller = NSHostingController(rootView: rootView)
    controller.sizingOptions = []
    return controller
    #else
    return UIHostingController(rootView: rootView)
    #endif
}

@MainActor
final class StackController: ObservableObject, Identifiable {
    let id: Int
    unowned let host: Host
    var model: [ScreenController] = []
    var dirty = false
    @Published var root: ScreenController?
    @Published var path: [ScreenController] = []
    @Published var tabTitle = ""
    @Published var tabIcon = ""
    lazy var controller: ViewController = makeHosting(StackRootView(stack: self))

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
    }

    func insert(_ screen: ScreenController, before: ScreenController?) {
        model.removeAll { $0 === screen }
        if let before, let index = model.firstIndex(where: { $0 === before }) {
            model.insert(screen, at: index)
        } else {
            model.append(screen)
        }
        dirty = true
    }

    func remove(_ screen: ScreenController) {
        guard model.contains(where: { $0 === screen }) else { return }
        model.removeAll { $0 === screen }
        dirty = true
    }

    var top: ScreenController? { model.last }
    var depth: Int { model.count }

    func setTab(_ key: String, _ value: String) {
        if key == "title" { tabTitle = value }
        if key == "icon" { tabIcon = value }
        host.rootTabs?.objectWillChange.send()
    }

    /// Synchronizes SwiftUI's NavigationStack with the JS stack model: a new top pushes, a removed top pops.
    func sync() {
        dirty = false
        let nextRoot = model.first
        let nextPath = Array(model.dropFirst())
        let initial = root == nil
        if root !== nextRoot { root = nextRoot }
        guard !path.elementsEqual(nextPath, by: ===) else { return }
        #if os(macOS)
        if !initial, host.window?.isVisible == true, !NSWorkspace.shared.accessibilityDisplayShouldReduceMotion {
            withAnimation(.easeInOut(duration: 0.25)) { path = nextPath }
        } else {
            path = nextPath
        }
        #else
        path = nextPath
        #endif
    }

    /// Called when SwiftUI's NavigationStack pops via back button, interactive edge swipe, or tab re-tap.
    func didUpdatePath(_ next: [ScreenController]) {
        path = next
        let shown = (root.map { [$0] } ?? []) + next
        guard shown.count < model.count, zip(shown, model).allSatisfy({ $0 === $1 }) else { return }
        model = shown
        host.emit(id: id, "pop", shown.count)
        host.updateChrome()
    }

    /// Programmatic native back (macOS ⌘[ or two-finger trackpad swipe).
    func goBack() {
        guard model.count > 1 else { return }
        model.removeLast()
        sync()
        host.emit(id: id, "pop", model.count)
        host.updateChrome()
    }

    /// Pops all pushed screens back to the tab's root screen.
    func popToRoot() {
        guard model.count > 1 else { return }
        model = [model[0]]
        sync()
        host.emit(id: id, "pop", 1)
        host.updateChrome()
    }
}

@MainActor
final class TabsController: ObservableObject {
    let id: Int
    unowned let host: Host
    @Published var stacks: [StackController] = []
    @Published var selected = 0
    lazy var controller: ViewController = makeHosting(TabsRootView(tabs: self))
    var active: StackController? { stacks.indices.contains(selected) ? stacks[selected] : nil }

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
    }

    func add(_ stack: StackController) {
        stacks.append(stack)
    }

    func select(_ index: Int) {
        guard index >= 0, index != selected else { return }
        selected = index
        host.updateChrome()
    }

    func choose(_ index: Int) {
        guard stacks.indices.contains(index) else { return }
        if index == selected {
            if let active {
                if active.depth > 1 { active.popToRoot() }
                else { active.top?.toTop() }
            }
            return
        }
        selected = index
        host.emit(id: id, "select", index)
        host.updateChrome()
    }
}

private struct ScreenView: SwiftUI.View {
    @ObservedObject var screen: ScreenController
    let isRoot: Bool

    var body: some SwiftUI.View {
        ScreenSurface(screen: screen)
            .id(screen.id)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            #if os(iOS)
            .ignoresSafeArea()
            .navigationBarTitleDisplayMode(isRoot ? .large : .inline)
            #endif
            .navigationTitle(screen.screenTitle)
    }
}

private struct StackRootView: SwiftUI.View {
    @ObservedObject var stack: StackController

    private var pathBinding: Binding<[ScreenController]> {
        Binding(
            get: { stack.path },
            set: { stack.didUpdatePath($0) }
        )
    }

    var body: some SwiftUI.View {
        NavigationStack(path: pathBinding) {
            Group {
                if let root = stack.root {
                    ScreenView(screen: root, isRoot: true)
                }
            }
            .navigationDestination(for: ScreenController.self) { screen in
                ScreenView(screen: screen, isRoot: false)
            }
        }
    }
}

private struct TabsRootView: SwiftUI.View {
    @ObservedObject var tabs: TabsController

    private var selectionBinding: Binding<Int> {
        Binding(
            get: { tabs.selected },
            set: { tabs.choose($0) }
        )
    }

    var body: some SwiftUI.View {
        TabView(selection: selectionBinding) {
            ForEach(Array(tabs.stacks.enumerated()), id: \.element.id) { index, stack in
                Tab(stack.tabTitle, systemImage: symbol(stack.tabIcon), value: index) {
                    StackRootView(stack: stack)
                }
            }
        }
        .tabViewStyle(.sidebarAdaptable)
    }
}

extension Host {
    var activeStack: StackController? { rootTabs?.active ?? rootStack }

    /// The router's tabs or stack becomes the window's root.
    func setRoot(_ controller: ViewController) {
        for stack in stacks.values where stack.dirty { stack.sync() }
        #if os(macOS)
        guard let window else { return }
        var frame = window.frame
        if rootTabs != nil {
            let visible = window.screen?.visibleFrame ?? frame
            let width = min(max(frame.width, 860), visible.width)
            frame.origin.x = max(visible.minX, min(frame.midX - width / 2, visible.maxX - width))
            frame.size.width = width
        }
        window.styleMask.insert(.fullSizeContentView)
        window.contentViewController = controller
        window.setFrame(frame, display: true)
        #else
        window?.rootViewController = controller
        #endif
    }

    func updateChrome() {
        #if os(macOS)
        window?.title = activeStack?.top?.title ?? "nuclo-native"
        #endif
    }

    @objc func goBack(_ sender: Any?) {
        activeStack?.goBack()
    }
}

#if os(iOS)

private struct ScreenSurface: UIViewControllerRepresentable {
    let screen: ScreenController

    func makeUIViewController(context: Context) -> ScreenController {
        if screen.parent != nil {
            screen.view.removeFromSuperview()
            screen.removeFromParent()
        }
        return screen
    }

    func updateUIViewController(_ uiViewController: ScreenController, context: Context) {}
}

/// Taps on the navigation bar's title area scroll the active screen to top without intercepting bar buttons.
private final class BarTapDelegate: NSObject, UIGestureRecognizerDelegate {
    static let shared = BarTapDelegate()

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        var view: UIView? = touch.view
        while let current = view, current !== gestureRecognizer.view {
            if current is UIControl { return false }
            view = current.superview
        }
        return true
    }
}

/// One screen: a scroll view holding the screen's content, which JS lays out at the screen's width.
final class ScreenController: UIViewController, UIScrollViewDelegate, ObservableObject {
    let id: Int
    let content = Box()
    @Published var screenTitle = ""
    private let scroll = UIScrollView()
    private var viewportSize = CGSize.zero
    unowned let host: Host

    override var title: String? {
        didSet { screenTitle = title ?? "" }
    }

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
        super.init(nibName: nil, bundle: nil)
        scroll.alwaysBounceVertical = true
        // A screen scrolls like a feed: no scroll indicator over the content.
        scroll.showsVerticalScrollIndicator = false
        scroll.delegate = self
        scroll.addSubview(content)
        applyBackground()
    }

    /// Back to the top, as a tap on the navigation bar or on the screen's own tab asks. From far down only the last
    /// two screens are scrolled through: the rows in between never reach the host.
    @objc func toTop() {
        let top = -scroll.adjustedContentInset.top
        let near = top + 2 * scroll.bounds.height
        if scroll.contentOffset.y > near { scroll.contentOffset.y = near }
        scroll.setContentOffset(CGPoint(x: 0, y: top), animated: true)
    }

    func scrollViewShouldScrollToTop(_ scrollView: UIScrollView) -> Bool {
        toTop()
        return false
    }

    /// JS loads more as the end comes near (dom.ts, "end").
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        host.emit(id: id, "scroll", "\(scrollView.contentOffset.y) \(scrollView.bounds.height)")
    }

    required init?(coder: NSCoder) { fatalError() }

    override func loadView() { view = scroll }

    override func didMove(toParent parent: UIViewController?) {
        super.didMove(toParent: parent)
        setContentScrollView(scroll)
        parent?.setContentScrollView(scroll)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        setContentScrollView(scroll)
        parent?.setContentScrollView(scroll)
        if let bar = navigationController?.navigationBar,
           !(bar.gestureRecognizers ?? []).contains(where: { $0.name == "nuclo.toTop" }) {
            let tap = UITapGestureRecognizer(target: self, action: #selector(barTapped))
            tap.name = "nuclo.toTop"
            tap.cancelsTouchesInView = false
            tap.delegate = BarTapDelegate.shared
            bar.addGestureRecognizer(tap)
        }
    }

    @objc private func barTapped() {
        host.activeStack?.top?.toTop()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        let size = scroll.bounds.size
        guard size.width > 0, size.height > 0, size != viewportSize else { return }
        viewportSize = size
        host.emit(id: id, "resize", "\(size.width) \(size.height) \(deviceScale())")
    }

    func applyBackground() {
        scroll.backgroundColor = host.pageColor ?? .systemGroupedBackground
    }

    /// The content's laid-out size (its frame from JS).
    func setContent(_ size: CGSize) {
        content.frame = CGRect(origin: .zero, size: size)
        scroll.contentSize = size
    }
}

#else

private struct ScreenSurface: NSViewControllerRepresentable {
    let screen: ScreenController

    func makeNSViewController(context: Context) -> ScreenController {
        if screen.parent != nil {
            screen.view.removeFromSuperview()
            screen.removeFromParent()
        }
        return screen
    }

    func updateNSViewController(_ nsViewController: ScreenController, context: Context) {}

    func sizeThatFits(_ proposal: ProposedViewSize, nsViewController: ScreenController, context: Context) -> CGSize? {
        guard let width = proposal.width, let height = proposal.height,
              width.isFinite, height.isFinite else { return nil }
        return CGSize(width: width, height: height)
    }
}

/// A vertical scroller that forwards two-finger horizontal back swipes to the active NavigationStack.
final class ScreenScroll: NSScrollView {
    weak var host: Host?

    override func wantsScrollEventsForSwipeTracking(on axis: NSEvent.GestureAxis) -> Bool {
        axis == .horizontal && NSEvent.isSwipeTrackingFromScrollEventsEnabled
    }

    override func scrollWheel(with event: NSEvent) {
        guard event.phase == .began, NSEvent.isSwipeTrackingFromScrollEventsEnabled,
              abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY),
              let stack = host?.activeStack, stack.depth > 1
        else { return super.scrollWheel(with: event) }
        event.trackSwipeEvent(options: [.lockDirection, .clampGestureAmount], dampenAmountThresholdMin: 0, max: 1) {
            amount, _, complete, _ in
            MainActor.assumeIsolated {
                if complete, amount > 0 { stack.goBack() }
            }
        }
    }
}

/// Keeps a short screen's content at the top.
final class FlippedClip: NSClipView {
    override var isFlipped: Bool { true }
}

/// One screen: a scroll view holding the screen's content, which JS lays out at the screen's width.
final class ScreenController: NSViewController, ObservableObject {
    let id: Int
    let content = Box()
    @Published var screenTitle = ""
    private let scroll = ScreenScroll()
    private var viewportSize = CGSize.zero
    unowned let host: Host

    override var title: String? {
        didSet { screenTitle = title ?? "" }
    }

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
        super.init(nibName: nil, bundle: nil)
        scroll.host = host
        scroll.contentView = FlippedClip()
        // A screen scrolls like a feed: no scroller beside the content.
        scroll.hasVerticalScroller = false
        scroll.documentView = content
        // JS loads more as the end comes near (dom.ts, "end").
        scroll.contentView.postsBoundsChangedNotifications = true
        NotificationCenter.default.addObserver(self, selector: #selector(scrolled), name: NSView.boundsDidChangeNotification, object: scroll.contentView)
        applyBackground()
    }

    /// Back to the top, as a click on the screen's own tab asks. From far down only the last two screens are
    /// scrolled through: the rows in between never reach the host.
    func toTop() {
        let clip = scroll.contentView
        let near = 2 * clip.bounds.height
        if clip.bounds.minY > near { clip.setBoundsOrigin(NSPoint(x: 0, y: near)) }
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.25
            clip.animator().setBoundsOrigin(.zero)
        }
    }

    @objc private func scrolled() {
        let visible = scroll.contentView.bounds
        host.emit(id: id, "scroll", "\(visible.minY) \(visible.height)")
    }

    required init?(coder: NSCoder) { fatalError() }

    override func loadView() { view = scroll }

    override func viewDidLayout() {
        super.viewDidLayout()
        let size = scroll.contentSize
        guard size.width > 0, size.height > 0, size != viewportSize else { return }
        viewportSize = size
        host.emit(id: id, "resize", "\(size.width) \(size.height) \(deviceScale())")
    }

    func applyBackground() {
        scroll.drawsBackground = true
        scroll.backgroundColor = host.pageColor ?? .windowBackgroundColor
    }

    /// The content's laid-out size (its frame from JS).
    func setContent(_ size: CGSize) {
        content.frame = NSRect(origin: .zero, size: size)
    }
}

extension Host: NSMenuItemValidation {
    fileprivate var canGoBack: Bool { (activeStack?.depth ?? 0) > 1 }

    func validateMenuItem(_ menuItem: NSMenuItem) -> Bool {
        if menuItem.action == #selector(goBack(_:)) { return canGoBack }
        if menuItem.action == #selector(selectTab(_:)) {
            return rootTabs?.stacks.indices.contains(menuItem.tag) == true
        }
        return true
    }

    @objc fileprivate func selectTab(_ sender: NSMenuItem) {
        rootTabs?.choose(sender.tag)
    }
}

/// App, Edit and Go menus: Quit, copy and paste in fields, Back (⌘[).
@MainActor
func mainMenu(_ host: Host) -> NSMenu {
    let menu = NSMenu()
    func submenu(_ title: String, _ items: [NSMenuItem]) {
        let item = NSMenuItem()
        item.submenu = NSMenu(title: title)
        items.forEach(item.submenu!.addItem)
        menu.addItem(item)
    }
    func item(_ title: String, _ action: Selector, _ key: String, target: AnyObject? = nil) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: key)
        item.target = target
        return item
    }
    submenu("App", [item("Quit", #selector(NSApplication.terminate(_:)), "q")])
    submenu("Edit", [
        item("Undo", Selector(("undo:")), "z"),
        item("Redo", Selector(("redo:")), "Z"),
        .separator(),
        item("Cut", #selector(NSText.cut(_:)), "x"),
        item("Copy", #selector(NSText.copy(_:)), "c"),
        item("Paste", #selector(NSText.paste(_:)), "v"),
        item("Select All", #selector(NSText.selectAll(_:)), "a"),
    ])
    let tabs = (0..<4).map { index in
        let shortcut = String(index + 1)
        let tab = item("Tab \(shortcut)", #selector(Host.selectTab(_:)), shortcut, target: host)
        tab.tag = index
        return tab
    }
    submenu("Go", [item("Back", #selector(Host.goBack(_:)), "[", target: host), .separator()] + tabs)
    return menu
}

#endif
