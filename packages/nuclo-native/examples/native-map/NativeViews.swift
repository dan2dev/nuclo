import MapKit

private struct Place: Codable, Equatable {
    let name: String
    let latitude: Double
    let longitude: Double
}

@MainActor
private final class PlaceMap: NSObject, MKMapViewDelegate {
    let map = MKMapView(frame: .zero)
    let emit: (any Encodable) -> Void
    private var place: Place?

    init(emit: @escaping (any Encodable) -> Void) {
        self.emit = emit
        super.init()
        map.delegate = self
    }

    func update(_ data: Data) {
        guard let next = try? JSONDecoder().decode(Place.self, from: data), next != place else { return }
        let coordinate = CLLocationCoordinate2D(latitude: next.latitude, longitude: next.longitude)
        guard CLLocationCoordinate2DIsValid(coordinate) else { return }
        place = next
        let pin = MKPointAnnotation()
        pin.title = next.name
        pin.coordinate = coordinate
        map.removeAnnotations(map.annotations)
        map.addAnnotation(pin)
        map.setRegion(MKCoordinateRegion(center: coordinate, latitudinalMeters: 2400, longitudinalMeters: 2400), animated: false)
    }

    func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
        if view.annotation is MKPointAnnotation, let place { emit(place) }
    }
}

@MainActor
func registerNativeViews(on host: Host) {
    host.registerNativeView("example.place-map") { emit in
        let component = PlaceMap(emit: emit)
        return NativeComponent(view: component.map, update: component.update, dispose: { component.map.delegate = nil })
    }
}
