// The iOS side of examples/camera, compiled with the generated App.swift: CameraProps is the class the compiler
// made from the app's interface. The app's Info.plist needs NSCameraUsageDescription (scripts/ios-run.sh writes it).

import AVFoundation
import UIKit

/// The camera on screen, which takePhoto() asks. The last one created wins.
@MainActor private weak var liveCamera: CameraView?

@MainActor final class Camera: NativeComponent {
    typealias Props = CameraProps

    func create() -> UIView { CameraView() }

    func update(_ view: UIView, _ props: CameraProps) { (view as? CameraView)?.show(facing: props.facing) }

    func destroy(_ view: UIView) { (view as? CameraView)?.stop() }
}

@MainActor final class CameraView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }

    private let session = AVCaptureSession()
    private let output = AVCapturePhotoOutput()
    /// startRunning() and reconfiguring block, so they run off the main thread, one at a time.
    private let queue = DispatchQueue(label: "dev.nuclo.camera")
    private var facing = ""
    private var shots: [Shot] = []
    /// What is drawn where there is no camera (the simulator): a test card with a clock, so photos differ.
    private var card: UILabel?
    private var clock: Timer?

    init() {
        super.init(frame: .zero)
        backgroundColor = .black
        let preview = layer as! AVCaptureVideoPreviewLayer
        preview.session = session
        preview.videoGravity = .resizeAspectFill
        session.sessionPreset = .photo
        if session.canAddOutput(output) { session.addOutput(output) }
        liveCamera = self
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    func show(facing: String) {
        guard facing != self.facing else { return }
        self.facing = facing
        let position: AVCaptureDevice.Position = facing == "front" ? .front : .back
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position),
              let input = try? AVCaptureDeviceInput(device: device)
        else { return drawCard() }
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
            // No camera: a picture of the test card.
            return UIGraphicsImageRenderer(bounds: bounds).jpegData(withCompressionQuality: 0.85) { _ in
                drawHierarchy(in: bounds, afterScreenUpdates: false)
            }
        }
        guard let connection = output.connection(with: .video) else { throw NError("The camera is not ready") }
        connection.videoOrientation = .portrait
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
            let label = UILabel()
            label.numberOfLines = 0
            label.textAlignment = .center
            label.textColor = .white
            label.font = .monospacedDigitSystemFont(ofSize: 20, weight: .semibold)
            label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            label.frame = bounds
            addSubview(label)
            card = label
            clock = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
                MainActor.assumeIsolated { self?.tick() }
            }
        }
        // On the label: nuclo owns the view's own background.
        card?.backgroundColor = facing == "front" ? UIColor(red: 0.49, green: 0.23, blue: 0.93, alpha: 1) : UIColor(red: 0.05, green: 0.65, blue: 0.91, alpha: 1)
        tick()
    }

    private func tick() {
        let time = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        card?.text = "No camera here\n\(facing) camera\n\(time)"
    }
}

/// One capture's delegate. The output keeps a weak reference, so the view holds it until it is done.
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
