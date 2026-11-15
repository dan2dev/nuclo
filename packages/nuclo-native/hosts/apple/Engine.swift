// The JS side of the Apple host: Hermes (hosts/hermes) on its own thread.
//
// JS runs a turn at a time (the bundle, then each event), so the main thread scrolls, animates and takes touches
// while JS works. The main thread posts turns and never waits for one; the ops of a turn come back to it as one
// post (Host.apply), so no frame shows views before their frames. JS can run off the main thread because texts,
// buttons and images are sized by content (__nuclo_text_size, __nuclo_image_size), never by view.
import CoreText
import Foundation
import ImageIO

/// What a turn sends the main thread: its batches of ops, parsed.
struct Turn: @unchecked Sendable {
    let batches: [[[Any]]]
    /// The last thing the main thread sent that these ops answer (Host.sent).
    let answers: Int
}

/// The JS thread, with the main thread's stack size: layout recurses as deep as the view tree.
final class Engine: Thread, @unchecked Sendable {
    // Shared, under `queue`: the turns waiting, and each root's latest scroll position while its turn waits.
    private let queue = NSCondition()
    private var turns: [(Engine) -> Void] = []
    private var scrolls: [Int: String] = [:]

    // The JS thread's own.
    private var runtime: OpaquePointer?
    private var batches: [[[Any]]] = []
    private var answers = 0
    /// The last answer given to JS: the bridge reads it before it asks again.
    private var reply: UnsafeMutablePointer<CChar>?
    /// Device pixels per point, as the last resize said: text is measured on that grid (lineHeight).
    private var scale: CGFloat = 2
    private var assets = ""
    private var window = ""
    private var nativeViews = ""
    private var textScale = "1"
    private var imageSizes: [String: String] = [:]

    override init() {
        super.init()
        name = "nuclo-js"
        stackSize = 8 << 20
        start()
    }

    override func main() {
        while true {
            queue.lock()
            while turns.isEmpty { queue.wait() }
            let turn = turns.removeFirst()
            queue.unlock()
            autoreleasepool {
                turn(self)
                deliver()
            }
        }
    }

    /// From any thread: queues one JS turn. `answering` is the main thread's count of what it has sent (Host.sent).
    func post(answering: Int? = nil, _ run: @escaping @Sendable (Engine) -> Void) {
        queue.lock()
        turns.append { js in
            if let answering { js.answers = answering }
            run(js)
        }
        queue.signal()
        queue.unlock()
    }

    /// A root's scroll position: while JS is busy only the latest waits for it.
    func scrolled(_ id: Int, _ value: String, answering: Int) {
        queue.lock()
        let waiting = scrolls.updateValue(value, forKey: id) != nil
        queue.unlock()
        if waiting { return }
        post(answering: answering) { js in
            js.queue.lock()
            let latest = js.scrolls.removeValue(forKey: id)
            js.queue.unlock()
            if let latest { js.event(id, "scroll", latest, text: true) }
        }
    }

    /// Starts Hermes and runs the bundle: its bytecode (app.hbc beside it, scripts/hermes.ts) when there, else its source.
    /// `window`: the content's size when it is known before any layout, "w h scale" as a resize carries it (or ""):
    /// JS lays the first screen out with it in the turn that renders it.
    func run(bundle path: String, window: String, nativeViews: String, textScale: String) {
        post { js in
            js.window = window
            js.nativeViews = nativeViews
            js.textScale = textScale
            js.assets = (path as NSString).deletingLastPathComponent
            var calls = js.calls()
            js.runtime = nuclo_create(&calls)
            let bytecode = (path as NSString).deletingPathExtension + ".hbc"
            guard let code = FileManager.default.contents(atPath: bytecode) ?? FileManager.default.contents(atPath: path) else {
                return print("JS error: no bundle at", path)
            }
            code.withUnsafeBytes { _ = nuclo_evaluate(js.runtime, $0.bindMemory(to: UInt8.self).baseAddress, code.count, "app.js") }
        }
    }

    /// What JS calls on the host (hosts/hermes/nuclo_hermes.h), on this thread. C functions capture nothing: they
    /// reach the engine through the global.
    private func calls() -> NucloHost {
        var calls = NucloHost()
        calls.ops = { _, json, length in
            let data = Data(bytesNoCopy: UnsafeMutableRawPointer(mutating: json!), count: length, deallocator: .none)
            engine.batches.append(try! JSONSerialization.jsonObject(with: data) as! [[Any]])
        }
        calls.device = { _, name in engine.answer(engine.device(String(cString: name!))) }
        calls.text_size = { _, text, size, bold, system, maxWidth in
            let font = textFont(size: CGFloat(size), bold: bold, system: system)
            let measured = Typeset(String(cString: text!), font, color: .black, maxWidth: CGFloat(maxWidth)).size(font, scale: engine.scale)
            return engine.answer("\(measured.width) \(measured.height)")
        }
        calls.image_size = { _, src in engine.answer(engine.imageSize(String(cString: src!))) }
        // setTimeout for JS: fires once, as a turn of its own.
        calls.timer = { _, id, ms in
            DispatchQueue.global().asyncAfter(deadline: .now() + ms / 1000) { engine.post { $0.event(Int(id), "timer") } }
        }
        calls.fetch = { _, id, method, url, headers, body in
            engine.fetch(Int(id), String(cString: method!), String(cString: url!), String(cString: headers!), body.map { String(cString: $0) })
        }
        // console.log to stdout, errors to stderr, a line at a time: a pipe would hold stdout back until it fills.
        calls.log = { _, message, error in
            fputs((error ? "JS error: " : "JS: ") + String(cString: message!) + "\n", error ? stderr : stdout)
            fflush(stdout)
        }
        return calls
    }

    /// __nuclo_event(id, type, value): `value` a JS string if `text`, else JSON (a number or boolean). The JS thread's.
    func event(_ id: Int, _ type: String, _ value: String? = nil, text: Bool = false) {
        guard let runtime else { return }
        if type == "resize", let pixels = value?.split(separator: " ").last.flatMap({ Double($0) }) { scale = CGFloat(pixels) }
        nuclo_event(runtime, Int32(id), type, value, text)
    }

    /// __nuclo_device_changed(name, json). The JS thread's.
    func deviceChanged(_ name: String, _ json: String) {
        if let runtime { nuclo_device_changed(runtime, name, json) }
    }

    /// The turn's batches go to the main thread as one.
    private func deliver() {
        guard !batches.isEmpty else { return }
        let turn = Turn(batches: batches, answers: answers)
        batches = []
        DispatchQueue.main.async { MainActor.assumeIsolated { host.apply(turn) } }
    }

    private func answer(_ text: String) -> UnsafePointer<CChar>? {
        free(reply)
        reply = strdup(text)
        return UnsafePointer(reply)
    }

    /// Device data and the debug frames are the main thread's, which never waits for JS: JS waits for its answer.
    private func device(_ name: String) -> String {
        // Asked as the runtime starts, while the main thread is busy starting the app: answered here.
        if name == "window" { return window }
        if name == "nativeViews" { return nativeViews }
        if name == "textScale" { return textScale }
        guard name == "frames" || name == "battery" else { return "" }
        // The views show what this turn sent so far before their frames are read.
        if name == "frames" { deliver() }
        return DispatchQueue.main.sync { MainActor.assumeIsolated { host.device(name) } }
    }

    /// __nuclo_fetch: the request runs in URLSession; its answer is a turn (fetch.ts): {status, statusText, url,
    /// headers, body}, or {error}.
    private func fetch(_ id: Int, _ method: String, _ address: String, _ headers: String, _ body: String?) {
        guard let url = URL(string: address) else { return answer(id, ["error": "Invalid URL: \(address)"]) }
        var request = URLRequest(url: url)
        request.httpMethod = method
        let fields = (try? JSONSerialization.jsonObject(with: Data(headers.utf8))) as? [String: String] ?? [:]
        for (name, value) in fields { request.setValue(value, forHTTPHeaderField: name) }
        request.httpBody = body.map { Data($0.utf8) }
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let http = response as? HTTPURLResponse else {
                return engine.answer(id, ["error": error?.localizedDescription ?? "The request got no answer"])
            }
            var got: [String: String] = [:]
            for (name, value) in http.allHeaderFields { got["\(name)".lowercased()] = "\(value)" }
            engine.answer(id, [
                "status": http.statusCode,
                "statusText": HTTPURLResponse.localizedString(forStatusCode: http.statusCode),
                "url": http.url?.absoluteString ?? address,
                "headers": got,
                "body": String(decoding: data ?? Data(), as: UTF8.self),
            ])
        }.resume()
    }

    /// A request's answer, from any thread: JS gets it as a turn of its own.
    private func answer(_ id: Int, _ fields: [String: Any]) {
        let json = String(decoding: try! JSONSerialization.data(withJSONObject: fields), as: UTF8.self)
        post { $0.event(id, "fetch", json, text: true) }
    }

    /// An image's natural size, "w h": a bundled one's read from its header; a remote one's (http…) known once the
    /// host has fetched it (loaded), "0 0" until then.
    private func imageSize(_ src: String) -> String {
        if let known = imageSizes[src] { return known }
        if isRemote(src) { return "0 0" }
        let url = URL(fileURLWithPath: (assets as NSString).appendingPathComponent(src))
        let size = pixelSize(CGImageSourceCreateWithURL(url as CFURL, nil))
        imageSizes[src] = size
        return size
    }

    /// A remote image arrived, `size` its natural size: JS lays the images showing it out again (dom.ts, `load`).
    /// The JS thread's.
    func loaded(_ src: String, _ size: String) {
        imageSizes[src] = size
        event(0, "load", src, text: true)
    }
}

func isRemote(_ src: String) -> Bool { src.hasPrefix("http://") || src.hasPrefix("https://") }

/// An image's size in pixels, "w h", from its header; "0 0" when it is none.
func pixelSize(_ source: CGImageSource?) -> String {
    guard let source,
          let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
          let width = properties[kCGImagePropertyPixelWidth] as? Double,
          let height = properties[kCGImagePropertyPixelHeight] as? Double
    else { return "0 0" }
    return "\(width) \(height)"
}

let engine = Engine()
