// The Android side of examples/camera, compiled with the generated App.kt: CameraProps is the class the compiler made
// from the app's interface. Camera2 on a TextureView, so the host needs no library; the manifest has CAMERA.
package dev.nuclo.app

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.media.ImageReader
import android.net.Uri
import android.os.Handler
import android.os.HandlerThread
import android.util.Size
import android.view.Surface
import android.view.TextureView
import android.view.View
import dev.nuclo.runtime.NativeComponent
import dev.nuclo.runtime.Runtime
import dev.nuclo.runtime.requestPermission
import java.io.File
import java.lang.ref.WeakReference
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlin.math.max

/** The camera on screen, which takePhoto() asks. The last one created wins. */
private var liveCamera = WeakReference<CameraView>(null)

class Camera : NativeComponent<CameraProps> {
    override fun create(context: Context): View = CameraView(context)

    override fun update(view: View, props: CameraProps) = (view as CameraView).show(props.facing)

    override fun destroy(view: View) = (view as CameraView).close()
}

class CameraView(context: Context) : TextureView(context), TextureView.SurfaceTextureListener {
    private val manager = context.getSystemService(CameraManager::class.java)
    /** Camera2 calls back on this thread; what reaches the app is posted to the main one. */
    private val thread = HandlerThread("camera").apply { start() }
    private val handler = Handler(thread.looper)
    private val executor = Executor { handler.post(it) }
    private var facing = ""
    private var device: CameraDevice? = null
    private var session: CameraCaptureSession? = null
    private var reader: ImageReader? = null
    private var sensorOrientation = 90
    private var preview = Size(1280, 960)

    init {
        surfaceTextureListener = this
        liveCamera = WeakReference(this)
    }

    fun show(facing: String) {
        if (facing == this.facing) return
        this.facing = facing
        open()
    }

    fun close() {
        closeDevice()
        thread.quitSafely()
    }

    private fun closeDevice() {
        session?.close()
        device?.close()
        reader?.close()
        session = null
        device = null
        reader = null
    }

    /** Opens the camera facing `facing` once there is a surface to show it on (onSurfaceTextureAvailable calls again). */
    private fun open() {
        closeDevice()
        val texture = surfaceTexture ?: return
        val lens = if (facing == "front") CameraCharacteristics.LENS_FACING_FRONT else CameraCharacteristics.LENS_FACING_BACK
        val ids = manager.cameraIdList
        val id = ids.firstOrNull { manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) == lens } ?: ids.firstOrNull() ?: return
        val info = manager.getCameraCharacteristics(id)
        sensorOrientation = info.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 90
        val sizes = info.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
        // 4:3, the sensor's own shape, for the preview and the photo.
        val fourThree = { s: Size -> s.width * 3 == s.height * 4 }
        val jpeg = sizes.getOutputSizes(ImageFormat.JPEG).filter(fourThree).maxByOrNull { it.width * it.height } ?: sizes.getOutputSizes(ImageFormat.JPEG).first()
        preview = sizes.getOutputSizes(SurfaceTexture::class.java).filter { fourThree(it) && it.width <= 1920 }.maxByOrNull { it.width } ?: Size(640, 480)
        texture.setDefaultBufferSize(preview.width, preview.height)
        fit()
        val jpegReader = ImageReader.newInstance(jpeg.width, jpeg.height, ImageFormat.JPEG, 2)
        reader = jpegReader
        try {
            manager.openCamera(id, executor, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    device = camera
                    val surface = Surface(texture)
                    val repeating = camera.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW).apply { addTarget(surface) }.build()
                    camera.createCaptureSession(
                        SessionConfiguration(
                            SessionConfiguration.SESSION_REGULAR,
                            listOf(OutputConfiguration(surface), OutputConfiguration(jpegReader.surface)),
                            executor,
                            object : CameraCaptureSession.StateCallback() {
                                override fun onConfigured(s: CameraCaptureSession) {
                                    session = s
                                    s.setRepeatingRequest(repeating, null, handler)
                                }

                                override fun onConfigureFailed(s: CameraCaptureSession) = s.close()
                            },
                        ),
                    )
                }

                override fun onDisconnected(camera: CameraDevice) = camera.close()

                override fun onError(camera: CameraDevice, error: Int) = camera.close()
            })
        } catch (_: SecurityException) {
            // No permission: the app asks with requestCamera() before it shows a Camera.
        }
    }

    /** Fills the view with the preview, cropping what overflows (CSS's object-fit: cover). */
    private fun fit() {
        val w = width.toFloat()
        val h = height.toFloat()
        if (w == 0f || h == 0f) return
        // The buffer arrives rotated upright for a portrait screen: its width is the preview's height.
        val cw = preview.height.toFloat()
        val ch = preview.width.toFloat()
        val scale = max(w / cw, h / ch)
        setTransform(Matrix().apply { setScale(cw * scale / w, ch * scale / h, w / 2, h / 2) })
    }

    /** A JPEG, upright and (for the front camera) mirrored as the preview showed it. */
    suspend fun capture(): ByteArray = suspendCoroutine { cont ->
        val s = session
        val r = reader
        if (s == null || r == null) return@suspendCoroutine cont.resumeWithException(Exception("The camera is not ready"))
        r.setOnImageAvailableListener({ ready ->
            ready.setOnImageAvailableListener(null, null)
            val bytes = ready.acquireLatestImage()?.use { image ->
                val buffer = image.planes[0].buffer
                ByteArray(buffer.remaining()).also { buffer.get(it) }
            }
            val photo = bytes?.let { upright(it) }
            Runtime.main.post { if (photo != null) cont.resume(photo) else cont.resumeWithException(Exception("The photo has no data")) }
        }, handler)
        val still = s.device.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE).apply { addTarget(r.surface) }.build()
        s.capture(still, null, handler)
    }

    /** Turns the sensor's picture the way the screen is held (EXIF orientation is not read by every viewer, nor by img()). */
    private fun upright(jpeg: ByteArray): ByteArray {
        val bitmap = BitmapFactory.decodeByteArray(jpeg, 0, jpeg.size) ?: return jpeg
        val screen = (display?.rotation ?: Surface.ROTATION_0) * 90
        val front = facing == "front"
        val degrees = if (front) (sensorOrientation + screen) % 360 else (sensorOrientation - screen + 360) % 360
        val matrix = Matrix().apply {
            postRotate(degrees.toFloat())
            if (front) postScale(-1f, 1f)
        }
        val turned = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
        return java.io.ByteArrayOutputStream().use { out ->
            turned.compress(Bitmap.CompressFormat.JPEG, 90, out)
            out.toByteArray()
        }
    }

    override fun onSurfaceTextureAvailable(texture: SurfaceTexture, width: Int, height: Int) = open()

    override fun onSurfaceTextureSizeChanged(texture: SurfaceTexture, width: Int, height: Int) = fit()

    override fun onSurfaceTextureDestroyed(texture: SurfaceTexture): Boolean {
        closeDevice()
        return true
    }

    override fun onSurfaceTextureUpdated(texture: SurfaceTexture) {}

    // The system takes the camera from an app in the background: give it back there, open it again on return.
    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (visibility == VISIBLE && device == null && facing != "") open() else if (visibility != VISIBLE) closeDevice()
    }
}

suspend fun requestCamera(): Boolean = requestPermission(Manifest.permission.CAMERA)

suspend fun takePhoto(): String {
    val camera = liveCamera.get()?.takeIf { it.isAttachedToWindow } ?: throw Exception("No camera is shown")
    val jpeg = camera.capture()
    val file = File(Runtime.activity.cacheDir, "photo-${System.nanoTime()}.jpg")
    file.writeBytes(jpeg)
    return Uri.fromFile(file).toString()
}
