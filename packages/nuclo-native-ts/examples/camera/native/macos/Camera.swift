// The macOS side of examples/camera, compiled with the generated App.swift (CameraProps is the compiler's class for
// the app's interface). UIView is the runtime's AppKit shim. The app's Info.plist needs NSCameraUsageDescription
// (scripts/macos-run.sh writes it). A Mac's camera faces the person, so "back" picks another camera when there is
// one (an external one, an iPhone's) and the same one otherwise.

@preconcurrency import AVFoundation
import AppKit

/// The camera on screen, which takePhoto() asks. The last one created wins.
@MainActor private weak var liveCamera: CameraView?

@MainActor final class Camera: NativeComponent {
    typealias Props = CameraProps

    func create() -> UIView { CameraView() }

    func update(_ view: UIView, _ props: CameraProps) { (view as? CameraView)?.show(facing: props.facing) }

    func destroy(_ view: UIView) { (view as? CameraView)?.stop() }
}

@MainActor final class CameraView: UIView {
    private let session = AVCaptureSession()
    private let output = AVCapturePhotoOutput()
    private let preview = AVCaptureVideoPreviewLayer()
    private let queue = DispatchQueue(label: "dev.nuclo.camera")
    private var facing = ""
    private var shots: [Shot] = []
    /// Drawn where there is no camera: a test card with a clock, so photos differ.
    private var card: NSTextField?
    private var clock: Timer?

    override init(frame: CGRect) {
        super.init(frame: frame)
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor
        preview.session = session
        preview.videoGravity = .resizeAspectFill
        layer?.addSublayer(preview)
        session.sessionPreset = .photo
        if session.canAddOutput(output) { session.addOutput(output) }
        liveCamera = self
    }

    convenience init() { self.init(frame: .zero) }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        preview.frame = bounds
        CATransaction.commit()
        card?.frame = bounds
    }

    func show(facing: String) {
        guard facing != self.facing else { return }
        self.facing = facing
        var types: [AVCaptureDevice.DeviceType] = [.builtInWideAngleCamera]
        if #available(macOS 14.0, *) { types += [.external, .continuityCamera] } else { types.append(.externalUnknown) }
        let cameras = AVCaptureDevice.DiscoverySession(deviceTypes: types, mediaType: .video, position: .unspecified).devices
        let wanted: AVCaptureDevice.Position = facing == "front" ? .front : .back
        // The built-in camera faces the person; another camera stands in for the back one.
        let device = cameras.first { $0.position == wanted }
            ?? (facing == "front" ? cameras.first { $0.deviceType == .builtInWideAngleCamera } : cameras.first { $0.deviceType != .builtInWideAngleCamera })
            ?? cameras.first
        guard let device, let input = try? AVCaptureDeviceInput(device: device) else { return drawCard() }
        let session = session
        queue.async {
            session.beginConfiguration()
            for old in session.inputs { session.removeInput(old) }
            if session.canAddInput(input) { session.addInput(input) }
            session.commitConfiguration()
            if !session.isRunning { session.startRunning() }
        }
    }

    func stop() {
        clock?.invalidate()
        let session = session
        queue.async { session.stopRunning() }
    }

    /// A JPEG of what the preview shows.
    func capture() async throws -> Data {
        if session.inputs.isEmpty {
            guard let rep = bitmapImageRepForCachingDisplay(in: bounds) else { throw NError("Nothing to take a photo of") }
            cacheDisplay(in: bounds, to: rep)
            guard let jpeg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.85]) else { throw NError("The photo has no data") }
            return jpeg
        }
        guard let connection = output.connection(with: .video) else { throw NError("The camera is not ready") }
        // As the preview shows it: a camera facing the person is mirrored.
        if connection.isVideoMirroringSupported {
            connection.automaticallyAdjustsVideoMirroring = false
            connection.isVideoMirrored = facing == "front"
        }
        return try await withCheckedThrowingContinuation { continuation in
            let shot = Shot()
            shot.done = { [weak self, weak shot] result in
                DispatchQueue.main.async { self?.shots.removeAll { $0 === shot } }
                continuation.resume(with: result)
            }
            shots.append(shot)
            output.capturePhoto(with: AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg]), delegate: shot)
        }
    }

    private func drawCard() {
        if card == nil {
            let label = NSTextField(labelWithString: "")
            label.alignment = .center
            label.maximumNumberOfLines = 0
            label.textColor = .white
            label.font = .monospacedDigitSystemFont(ofSize: 20, weight: .semibold)
            label.drawsBackground = true
            label.frame = bounds
            addSubview(label)
            card = label
            clock = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
                MainActor.assumeIsolated { self?.tick() }
            }
        }
        card?.backgroundColor = facing == "front" ? NSColor(srgbRed: 0.49, green: 0.23, blue: 0.93, alpha: 1) : NSColor(srgbRed: 0.05, green: 0.65, blue: 0.91, alpha: 1)
        tick()
    }

    private func tick() {
        let time = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        // Blank lines above centre the text: a label draws from its top.
        card?.stringValue = "\n\n\n\n\nNo camera here\n\(facing) camera\n\(time)"
    }
}

/// One capture's delegate, held by the view until it is done.
private final class Shot: NSObject, AVCapturePhotoCaptureDelegate {
    var done: ((Result<Data, Error>) -> Void)?

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error {
            done?(.failure(error))
        } else if let data = photo.fileDataRepresentation() {
            done?(.success(data))
        } else {
            done?(.failure(NError("The photo has no data")))
        }
        done = nil
    }
}

@MainActor func requestCamera() async throws -> Bool {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized: return true
    case .notDetermined: return await AVCaptureDevice.requestAccess(for: .video)
    default: return false
    }
}

@MainActor func takePhoto() async throws -> String {
    guard let camera = liveCamera, camera.window != nil else { throw NError("No camera is shown") }
    let data = try await camera.capture()
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("photo-\(UUID().uuidString).jpg")
    try data.write(to: url)
    return url.absoluteString
}
