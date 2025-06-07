// types/leaflet-plugins.d.ts
import 'leaflet';

// Mendefinisikan tipe untuk leaflet-compass
declare module 'leaflet' {
  interface CompassOptions {
    autoActive?: boolean;
    showDigit?: boolean;
    position?: ControlPosition;
    angleOffset?: number;
    // Tambahkan properti lain jika Anda menggunakannya
  }

  namespace Control {
    class Compass extends Control {
      constructor(options?: CompassOptions);
    }
  }

  namespace control {
    function compass(options?: CompassOptions): Control.Compass;
  }
}