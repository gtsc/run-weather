import type { Location } from '../types';

let location = $state<Location | null>(null);

export function getLocation(): Location | null {
  return location;
}

export function setLocation(loc: Location): void {
  location = loc;
}
