// Native navigation for the Apple host: the router's tabs, stacks and screens.
//
// iOS:   UITabBarController › UINavigationController › screens. Large titles, the
//        interactive edge-swipe back and re-tap-to-root are UIKit's own.
// macOS: a sidebar split view › stacks that slide screens in and out. Back is the
//        toolbar chevron, ⌘[ or a two-finger swipe; the window title is the screen's.
//
// JS owns the stack (StackController.model, from insert/remove ops); sync()
// animates the native side to it once per batch. When the user goes back
// natively, the host pops first, then reports "pop" with the depth left.
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// Semantic tab icons → SF Symbols.
func symbol(_ icon: String) -> String {
    ["chart": "chart.bar.fill", "photo": "photo.on.rectangle", "person": "person.crop.circle"][icon] ?? icon
}

extension StackController {
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
}

extension Host {
    var activeStack: StackController? { rootTabs?.active ?? rootStack }

    /// The router's tabs or stack becomes the window's root.
    func setRoot(_ controller: ViewController) {
        #if os(macOS)
        guard let window else { return }
        var frame = window.frame
        if rootTabs != nil, frame.width < 860 {
            frame.origin.x -= (860 - frame.width) / 2
            frame.size.width = 860
        }
        window.styleMask.insert(.fullSizeContentView)
        window.contentViewController = controller
        window.setFrame(frame, display: true)
        chrome = Chrome(host: self, window: window, sidebar: rootTabs != nil)
        #else
        window?.rootViewController = controller
        #endif
    }

    func updateChrome() {
        #if os(macOS)
        guard let chrome, let window else { return }
        window.title = activeStack?.top?.title ?? "nuclo-native"
        chrome.back.isEnabled = (activeStack?.depth ?? 0) > 1
        #endif
    }

    @objc func goBack(_ sender: Any?) {
        #if os(macOS)
        activeStack?.goBack()
        #endif
    }
}

#if os(iOS)

/// One screen: a scroll view holding the screen's flex content.
final class ScreenController: UIViewController {
    let content = FlexView()
    private let scroll = UIScrollView()
    unowned let host: Host

    init(host: Host) {
        self.host = host
        super.init(nibName: nil, bundle: nil)
        scroll.alwaysBounceVertical = true
        scroll.addSubview(content)
        applyBackground()
    }

    required init?(coder: NSCoder) { fatalError() }

    override func loadView() { view = scroll }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        relayout()
    }

    func applyBackground() {
        scroll.backgroundColor = host.pageColor ?? .systemGroupedBackground
    }

    func relayout() {
        let height = FlexView.measure(content).height
        content.frame = CGRect(x: 0, y: 0, width: scroll.bounds.width, height: height)
        scroll.contentSize = content.frame.size
        content.invalidate()
    }
}

final class StackController: NSObject, UINavigationControllerDelegate {
    let id: Int
    unowned let host: Host
    let nav = UINavigationController()
    var model: [ScreenController] = []
    var dirty = false
    var controller: UIViewController { nav }

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
        super.init()
        nav.delegate = self
        nav.navigationBar.prefersLargeTitles = true
    }

    /// UIKit picks the transition: a new top pushes, a removed top pops.
    func sync() {
        dirty = false
        for (index, screen) in model.enumerated() {
            screen.navigationItem.largeTitleDisplayMode = index == 0 ? .always : .never
        }
        guard !nav.viewControllers.elementsEqual(model, by: ===) else { return }
        nav.setViewControllers(model, animated: nav.view.window != nil)
    }

    func setTab(_ key: String, _ value: String) {
        if key == "title" { nav.tabBarItem.title = value }
        if key == "icon" { nav.tabBarItem.image = UIImage(systemName: symbol(value)) }
    }

    // The back button, the edge swipe or re-tapping the tab popped natively.
    func navigationController(_ nav: UINavigationController, didShow controller: UIViewController, animated: Bool) {
        let shown = nav.viewControllers.compactMap { $0 as? ScreenController }
        guard shown.count < model.count, zip(shown, model).allSatisfy({ $0 === $1 }) else { return }
        model = shown
        host.emit(id: id, "pop", shown.count)
    }
}

final class TabsController: NSObject, UITabBarControllerDelegate {
    let id: Int
    unowned let host: Host
    let bar = UITabBarController()
    var stacks: [StackController] = []
    private var selected = 0
    var controller: UIViewController { bar }
    var active: StackController? { stacks.indices.contains(selected) ? stacks[selected] : nil }

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
        super.init()
        bar.delegate = self
    }

    func add(_ stack: StackController) {
        stacks.append(stack)
        bar.setViewControllers(stacks.map(\.nav), animated: false)
        bar.selectedIndex = selected
    }

    func select(_ index: Int) {
        guard stacks.indices.contains(index) else { return }
        selected = index
        bar.selectedIndex = index
    }

    func tabBarController(_ bar: UITabBarController, didSelect controller: UIViewController) {
        guard let index = stacks.firstIndex(where: { $0.nav === controller }), index != selected else { return }
        selected = index
        host.emit(id: id, "select", index)
    }
}

#else

/// A vertical scroller that leaves horizontal swipes to the stack (swipe back).
final class ScreenScroll: NSScrollView {
    override func scrollWheel(with event: NSEvent) {
        if event.phase == .began, abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY) {
            nextResponder?.scrollWheel(with: event)
        } else {
            super.scrollWheel(with: event)
        }
    }
}

/// One screen: a scroll view holding the screen's flex content.
final class ScreenController: NSViewController {
    let content = FlexView()
    private let scroll = ScreenScroll()
    unowned let host: Host

    init(host: Host) {
        self.host = host
        super.init(nibName: nil, bundle: nil)
        scroll.hasVerticalScroller = true
        scroll.autohidesScrollers = true
        scroll.documentView = content
        applyBackground()
    }

    required init?(coder: NSCoder) { fatalError() }

    override func loadView() { view = scroll }

    override func viewDidLayout() {
        super.viewDidLayout()
        relayout()
    }

    func applyBackground() {
        scroll.drawsBackground = true
        scroll.backgroundColor = host.pageColor ?? .windowBackgroundColor
    }

    func relayout() {
        let height = FlexView.measure(content).height
        let visible = scroll.contentSize
        content.frame = NSRect(x: 0, y: 0, width: visible.width, height: max(height, visible.height))
        content.invalidate()
    }
}

/// Catches the two-finger swipe that goes back, like Safari's.
final class SwipeView: NSView {
    weak var stack: StackController?

    override func wantsScrollEventsForSwipeTracking(on axis: NSEvent.GestureAxis) -> Bool { axis == .horizontal }

    override func scrollWheel(with event: NSEvent) {
        guard let stack, stack.depth > 1, event.phase == .began, NSEvent.isSwipeTrackingFromScrollEventsEnabled,
              abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY)
        else { return super.scrollWheel(with: event) }
        stack.trackSwipe(event)
    }
}

final class StackController: NSViewController {
    let id: Int
    unowned let host: Host
    var model: [ScreenController] = []
    var dirty = false
    var tabTitle = ""
    var tabIcon = ""
    private var shown: ScreenController?
    var controller: NSViewController { self }

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func loadView() {
        let swipe = SwipeView()
        swipe.stack = self
        swipe.wantsLayer = true
        view = swipe
    }

    func setTab(_ key: String, _ value: String) {
        if key == "title" { tabTitle = value }
        if key == "icon" { tabIcon = value }
    }

    /// Slides the new top in: forward when it was pushed, backward when the old top was popped.
    func sync() {
        dirty = false
        guard let next = model.last, next !== shown else { return }
        let previous = shown
        shown = next
        if next.parent !== self { addChild(next) }
        next.view.frame = view.bounds
        next.view.autoresizingMask = [.width, .height]
        if let previous, previous.view.superview === view, view.window != nil {
            let push = model.contains { $0 === previous }
            transition(from: previous, to: next, options: push ? .slideForward : .slideBackward) { [weak self] in
                MainActor.assumeIsolated { self?.prune() }
            }
        } else {
            previous?.view.removeFromSuperview()
            view.addSubview(next.view)
            prune()
        }
        host.updateChrome()
    }

    /// Lets go of screens that left the stack.
    private func prune() {
        for child in children where !model.contains(where: { $0 === child }) {
            child.view.removeFromSuperview()
            child.removeFromParent()
        }
    }

    /// Back from the toolbar, ⌘[ or a completed swipe.
    func goBack(animated: Bool = true) {
        guard model.count > 1 else { return }
        model.removeLast()
        if animated { sync() } else { swapToTop() }
        host.emit(id: id, "pop", model.count)
    }

    private func swapToTop() {
        shown?.view.removeFromSuperview()
        shown = model.last
        if let shown {
            shown.view.frame = view.bounds
            shown.view.autoresizingMask = [.width, .height]
            view.addSubview(shown.view)
        }
        prune()
        host.updateChrome()
    }

    /// The top screen follows the fingers; the one below slides in from the left.
    func trackSwipe(_ event: NSEvent) {
        guard let top = shown, model.count > 1 else { return }
        let below = model[model.count - 2]
        if below.parent !== self { addChild(below) }
        below.view.frame = view.bounds
        view.addSubview(below.view, positioned: .below, relativeTo: top.view)
        let width = view.bounds.width
        var committed = false
        event.trackSwipeEvent(options: [.lockDirection, .clampGestureAmount], dampenAmountThresholdMin: 0, max: 1) {
            amount, phase, complete, _ in
            MainActor.assumeIsolated {
                top.view.frame.origin.x = amount * width
                below.view.frame.origin.x = (amount - 1) * width * 0.3
                if phase == .ended { committed = amount > 0 }
                if phase == .cancelled { committed = false }
                guard complete else { return }
                top.view.frame.origin.x = 0
                below.view.frame.origin.x = 0
                if committed {
                    self.goBack(animated: false)
                } else {
                    below.view.removeFromSuperview()
                }
            }
        }
    }
}

/// The sidebar: one row per tab, its SF Symbol and title.
final class TabsController: NSSplitViewController, NSTableViewDataSource, NSTableViewDelegate {
    let id: Int
    unowned let host: Host
    var stacks: [StackController] = []
    private let table = NSTableView()
    private let detail = NSViewController()
    private var selected = -1
    var controller: NSViewController { self }
    var active: StackController? { stacks.indices.contains(selected) ? stacks[selected] : nil }

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func viewDidLoad() {
        super.viewDidLoad()
        table.style = .sourceList
        table.headerView = nil
        table.addTableColumn(NSTableColumn(identifier: .init("tab")))
        table.dataSource = self
        table.delegate = self
        let scroll = NSScrollView()
        scroll.documentView = table
        scroll.drawsBackground = false
        let sidebar = NSViewController()
        sidebar.view = scroll
        let item = NSSplitViewItem(sidebarWithViewController: sidebar)
        item.minimumThickness = 180
        item.maximumThickness = 280
        detail.view = NSView()
        addSplitViewItem(item)
        addSplitViewItem(NSSplitViewItem(viewController: detail))
        if selected < 0, !stacks.isEmpty { select(0) }
    }

    func add(_ stack: StackController) {
        stacks.append(stack)
        table.reloadData()
        if selected < 0, isViewLoaded { select(0) }
    }

    func select(_ index: Int) {
        guard stacks.indices.contains(index), index != selected else { return }
        if let active {
            active.view.removeFromSuperview()
            active.removeFromParent()
        }
        selected = index
        let stack = stacks[index]
        detail.addChild(stack)
        stack.view.frame = detail.view.bounds
        stack.view.autoresizingMask = [.width, .height]
        detail.view.addSubview(stack.view)
        stack.sync()
        if table.selectedRow != index { table.selectRowIndexes([index], byExtendingSelection: false) }
        host.updateChrome()
    }

    func numberOfRows(in tableView: NSTableView) -> Int { stacks.count }

    func tableView(_ tableView: NSTableView, viewFor column: NSTableColumn?, row: Int) -> NSView? {
        let stack = stacks[row]
        let cell = NSTableCellView()
        let image = NSImageView(image: NSImage(systemSymbolName: symbol(stack.tabIcon), accessibilityDescription: nil) ?? NSImage())
        let label = NSTextField(labelWithString: stack.tabTitle)
        cell.imageView = image
        cell.textField = label
        let row = NSStackView(views: [image, label])
        row.spacing = 6
        row.translatesAutoresizingMaskIntoConstraints = false
        cell.addSubview(row)
        NSLayoutConstraint.activate([
            row.leadingAnchor.constraint(equalTo: cell.leadingAnchor, constant: 4),
            row.centerYAnchor.constraint(equalTo: cell.centerYAnchor),
        ])
        return cell
    }

    // The user picked a tab.
    func tableViewSelectionDidChange(_ notification: Notification) {
        let row = table.selectedRow
        guard row >= 0, row != selected else { return }
        select(row)
        host.emit(id: id, "select", row)
    }
}

/// The unified toolbar: sidebar toggle and the navigational back chevron.
@MainActor
final class Chrome: NSObject, NSToolbarDelegate {
    let back = NSToolbarItem(itemIdentifier: .init("back"))
    private let sidebar: Bool

    init(host: Host, window: NSWindow, sidebar: Bool) {
        self.sidebar = sidebar
        super.init()
        back.image = NSImage(systemSymbolName: "chevron.backward", accessibilityDescription: "Back")
        back.label = "Back"
        back.isNavigational = true
        back.isBordered = true
        back.autovalidates = false
        back.target = host
        back.action = #selector(Host.goBack(_:))
        let toolbar = NSToolbar(identifier: "nuclo")
        toolbar.delegate = self
        toolbar.displayMode = .iconOnly
        window.toolbar = toolbar
        window.toolbarStyle = .unified
    }

    private var items: [NSToolbarItem.Identifier] {
        sidebar ? [.toggleSidebar, .sidebarTrackingSeparator, back.itemIdentifier] : [back.itemIdentifier]
    }

    func toolbarDefaultItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] { items }
    func toolbarAllowedItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] { items }

    func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier id: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
        id == back.itemIdentifier ? back : nil
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
    submenu("Go", [item("Back", #selector(Host.goBack(_:)), "[", target: host)])
    return menu
}

#endif
