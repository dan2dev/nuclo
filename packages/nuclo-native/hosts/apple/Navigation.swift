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
    ["chart": "chart.bar.fill", "photo": "photo.on.rectangle", "person": "person.crop.circle",
     "home": "house.fill", "search": "magnifyingglass", "bell": "bell.fill"][icon] ?? icon
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
        if rootTabs != nil {
            let visible = window.screen?.visibleFrame ?? frame
            let width = min(max(frame.width, 860), visible.width)
            frame.origin.x = max(visible.minX, min(frame.midX - width / 2, visible.maxX - width))
            frame.size.width = width
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
        chrome.back.isEnabled = canGoBack
        #endif
    }

    @objc func goBack(_ sender: Any?) {
        #if os(macOS)
        activeStack?.goBack()
        #endif
    }
}

#if os(iOS)

/// One screen: a scroll view holding the screen's content, which JS lays out at the screen's width.
final class ScreenController: UIViewController, UIScrollViewDelegate {
    let id: Int
    let content = Box()
    private let scroll = UIScrollView()
    private var viewportSize = CGSize.zero
    unowned let host: Host

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
    func toTop() {
        let top = -scroll.adjustedContentInset.top
        let near = top + 2 * scroll.bounds.height
        if scroll.contentOffset.y > near { scroll.contentOffset.y = near }
        scroll.setContentOffset(CGPoint(x: 0, y: top), animated: true)
    }

    /// JS loads more as the end comes near (dom.ts, "end").
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        host.emit(id: id, "scroll", "\(scrollView.contentOffset.y) \(scrollView.bounds.height)")
    }

    required init?(coder: NSCoder) { fatalError() }

    override func loadView() { view = scroll }

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
        // A tap on the bar goes back to the top; its buttons still get their touches.
        let tap = UITapGestureRecognizer(target: self, action: #selector(toTop))
        tap.cancelsTouchesInView = false
        nav.navigationBar.addGestureRecognizer(tap)
    }

    @objc func toTop() {
        (nav.topViewController as? ScreenController)?.toTop()
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

    /// The current tab, tapped again at its root, goes back to the top (UIKit pops a deeper one to its root).
    func tabBarController(_ bar: UITabBarController, shouldSelect controller: UIViewController) -> Bool {
        if let active, active.nav === controller, active.nav.viewControllers.count == 1 { active.toTop() }
        return true
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
    override func wantsScrollEventsForSwipeTracking(on axis: NSEvent.GestureAxis) -> Bool {
        axis == .horizontal && NSEvent.isSwipeTrackingFromScrollEventsEnabled
    }

    override func scrollWheel(with event: NSEvent) {
        if event.phase == .began, abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY) {
            nextResponder?.scrollWheel(with: event)
        } else {
            super.scrollWheel(with: event)
        }
    }
}

/// Keeps a short screen's content at the top.
final class FlippedClip: NSClipView {
    override var isFlipped: Bool { true }
}

/// One screen: a scroll view holding the screen's content, which JS lays out at the screen's width.
final class ScreenController: NSViewController {
    let id: Int
    let content = Box()
    private let scroll = ScreenScroll()
    private var viewportSize = CGSize.zero
    unowned let host: Host

    init(id: Int, host: Host) {
        self.id = id
        self.host = host
        super.init(nibName: nil, bundle: nil)
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
    private var transitioning = false
    private var trackingSwipe = false
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
        swipe.clipsToBounds = true
        view = swipe
    }

    func setTab(_ key: String, _ value: String) {
        if key == "title" { tabTitle = value }
        if key == "icon" { tabIcon = value }
    }

    /// Slides the new top in: forward when it was pushed, backward when the old top was popped.
    func sync() {
        guard !transitioning, !trackingSwipe else { return }
        dirty = false
        guard let next = model.last else {
            swapToTop()
            return
        }
        guard next !== shown else {
            prune()
            return
        }
        let previous = shown
        shown = next
        if next.parent !== self { addChild(next) }
        next.view.frame = view.bounds
        next.view.autoresizingMask = [.width, .height]
        if let previous, previous.view.superview === view, view.window != nil,
           !NSWorkspace.shared.accessibilityDisplayShouldReduceMotion {
            transitioning = true
            let push = model.contains { $0 === previous }
            let width = view.bounds.width
            next.view.frame.origin.x = push ? width : -width
            view.addSubview(next.view)
            NSAnimationContext.runAnimationGroup { context in
                context.duration = 0.28
                context.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
                previous.view.animator().setFrameOrigin(NSPoint(x: push ? -width : width, y: 0))
                next.view.animator().setFrameOrigin(.zero)
            } completionHandler: { [weak self, weak previous, weak next] in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    previous?.view.removeFromSuperview()
                    previous?.view.frame.origin = .zero
                    next?.view.frame = self.view.bounds
                    self.transitioning = false
                    self.prune()
                    if self.dirty { self.sync() }
                }
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
        for child in children where child !== shown && !model.contains(where: { $0 === child }) {
            child.view.removeFromSuperview()
            child.removeFromParent()
        }
    }

    /// Back from the toolbar, ⌘[ or a completed swipe.
    func goBack(animated: Bool = true) {
        guard model.count > 1, !trackingSwipe else { return }
        model.removeLast()
        dirty = true
        if animated { sync() } else { swapToTop() }
        host.emit(id: id, "pop", model.count)
    }

    private func swapToTop() {
        dirty = false
        shown?.view.removeFromSuperview()
        shown = model.last
        if let shown {
            if shown.parent !== self { addChild(shown) }
            shown.view.frame = view.bounds
            shown.view.autoresizingMask = [.width, .height]
            view.addSubview(shown.view)
        }
        prune()
        host.updateChrome()
    }

    /// The top screen follows the fingers; the one below slides in from the left.
    func trackSwipe(_ event: NSEvent) {
        guard !transitioning, !trackingSwipe, !dirty, let top = shown, model.count > 1
        else { return }
        trackingSwipe = true
        let below = model[model.count - 2]
        if below.parent !== self { addChild(below) }
        below.view.frame = view.bounds
        let reduceMotion = NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
        if !reduceMotion { view.addSubview(below.view, positioned: .below, relativeTo: top.view) }
        event.trackSwipeEvent(options: [.lockDirection, .clampGestureAmount], dampenAmountThresholdMin: 0, max: 1) {
            amount, _, complete, _ in
            MainActor.assumeIsolated {
                if !reduceMotion {
                    let width = self.view.bounds.width
                    top.view.frame.origin.x = amount * width
                    below.view.frame.origin.x = (amount - 1) * width * 0.3
                }
                guard complete else { return }
                top.view.frame.origin.x = 0
                below.view.frame.origin.x = 0
                self.trackingSwipe = false
                below.view.removeFromSuperview()
                if amount == 1, !self.dirty, self.view.window != nil {
                    self.goBack(animated: false)
                } else if self.dirty {
                    self.sync()
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
    private let sidebar = NSViewController()
    private let bottom = NSSegmentedControl()
    private var compact: Bool?
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
        table.target = self
        table.action = #selector(clicked)
        sidebarScroll.documentView = table
        sidebarScroll.drawsBackground = false
        sidebar.view = sidebarScroll
        bottom.target = self
        bottom.action = #selector(bottomSelected)
        bottom.segmentStyle = .separated
        bottom.trackingMode = .selectOne
        bottom.translatesAutoresizingMaskIntoConstraints = false
        let item = NSSplitViewItem(sidebarWithViewController: sidebar)
        item.canCollapse = false
        item.minimumThickness = 180
        item.maximumThickness = 280
        detail.view = NSView()
        addSplitViewItem(item)
        let content = NSSplitViewItem(viewController: detail)
        content.minimumThickness = 360
        addSplitViewItem(content)
        if selected < 0, !stacks.isEmpty { select(0) }
    }

    override func viewDidLayout() {
        super.viewDidLayout()
        let size = view.bounds.size
        guard size.width > 0, size.height > 0 else { return }
        let narrow = size.width < size.height || size.width < 600
        guard compact != narrow else { return }
        compact = narrow
        let sidebarItem = splitViewItems.first { $0.viewController === sidebar }!
        let detailItem = splitViewItems.first { $0.viewController === detail }!
        removeSplitViewItem(sidebarItem)
        removeSplitViewItem(detailItem)
        splitView.isVertical = !narrow
        if narrow {
            sidebarItem.minimumThickness = 60
            sidebarItem.maximumThickness = 60
            detailItem.minimumThickness = 0
            let bar = NSView()
            bar.addSubview(bottom)
            NSLayoutConstraint.activate([
                bottom.centerXAnchor.constraint(equalTo: bar.centerXAnchor),
                bottom.centerYAnchor.constraint(equalTo: bar.centerYAnchor),
                bottom.leadingAnchor.constraint(equalTo: bar.leadingAnchor, constant: 8),
                bottom.trailingAnchor.constraint(equalTo: bar.trailingAnchor, constant: -8),
            ])
            sidebar.view = bar
            addSplitViewItem(detailItem)
            addSplitViewItem(sidebarItem)
        } else {
            sidebarItem.minimumThickness = 180
            sidebarItem.maximumThickness = 280
            detailItem.minimumThickness = 360
            sidebar.view = sidebarScroll
            addSplitViewItem(sidebarItem)
            addSplitViewItem(detailItem)
        }
    }

    private let sidebarScroll = NSScrollView()

    @objc private func bottomSelected() {
        let index = bottom.selectedSegment
        if index == selected, let active, active.depth == 1 {
            active.top?.toTop()
        } else {
            choose(index)
        }
    }

    func add(_ stack: StackController) {
        stacks.append(stack)
        table.reloadData()
        bottom.segmentCount = stacks.count
        for (index, item) in stacks.enumerated() {
            bottom.setLabel(item.tabTitle, forSegment: index)
            bottom.setImage(NSImage(systemSymbolName: symbol(item.tabIcon), accessibilityDescription: item.tabTitle), forSegment: index)
        }
        bottom.selectedSegment = selected
        if selected < 0, isViewLoaded { select(0) }
    }

    func select(_ index: Int) {
        guard stacks.indices.contains(index), index != selected else { return }
        if let active {
            active.view.removeFromSuperview()
            active.removeFromParent()
        }
        selected = index
        bottom.selectedSegment = index
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

    /// The current tab, clicked again at its root, goes back to the top. A click that picked another tab changed
    /// the selection first (on mouse down): that one only switches.
    @objc private func clicked() {
        defer { switched = false }
        guard !switched, table.clickedRow == selected, let active, active.model.count == 1 else { return }
        active.model[0].toTop()
    }

    private var switched = false

    // The user picked a tab.
    func tableViewSelectionDidChange(_ notification: Notification) {
        let row = table.selectedRow
        guard row >= 0, row != selected else { return }
        switched = NSApp.currentEvent?.type == .leftMouseDown
        choose(row)
    }

    fileprivate func choose(_ index: Int) {
        guard stacks.indices.contains(index), index != selected else { return }
        select(index)
        host.emit(id: id, "select", index)
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
        [back.itemIdentifier]
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
