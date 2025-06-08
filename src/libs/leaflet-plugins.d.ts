import 'leaflet';

declare module 'leaflet' {
  interface CompassOptions {
    autoActive?: boolean;
    showDigit?: boolean;
    position?: ControlPosition;
    angleOffset?: number;
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