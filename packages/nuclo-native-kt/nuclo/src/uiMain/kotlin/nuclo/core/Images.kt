package nuclo.core

import nuclo.host.HttpRequest

/** `src`: downloads the URL with backend.http (GET) and hands the bytes to backend.setImage; a failed download clears the image.
 *  The newest request wins: an answer for an older url is ignored. */
internal fun loadImage(n: LiveNode, url: String) {
    val seq = ++n.imageSeq
    if (url.isEmpty()) { n.backend.setImage(n.view, ByteArray(0)); return }
    Tasks.request(HttpRequest("GET", url, emptyMap(), null)) { r ->
        if (!n.destroyed && n.imageSeq == seq) {
            n.backend.setImage(n.view, if (r.error == null && r.status in 200..299) r.body else ByteArray(0))
            Runtime.invalidateLayout()
            Runtime.settle()
        }
    }
}
