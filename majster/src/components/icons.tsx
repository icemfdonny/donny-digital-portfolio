/* eslint-disable react/only-export-components -- every export is an icon component made by the factory below */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
export type IconComponent = (props: IconProps) => React.JSX.Element;

/** Line icons on a 24px grid, stroked with currentColor (Lucide geometry). */
function make(paths: string[], fill = false): IconComponent {
  return function Icon({ size = 20, className = "", strokeWidth = 1.9, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill ? "currentColor" : "none"}
        stroke={fill ? "none" : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`shrink-0 ${className}`}
        {...rest}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const ArrowRight = make(["M5 12h14", "m13 6 6 6-6 6"]);
export const ArrowLeft = make(["M19 12H5", "m11 18-6-6 6-6"]);
export const ArrowUpRight = make(["M7 17 17 7", "M7 7h10v10"]);
export const ChevronDown = make(["m6 9 6 6 6-6"]);
export const ChevronLeft = make(["m15 18-6-6 6-6"]);
export const ChevronRight = make(["m9 18 6-6-6-6"]);
export const Calendar = make(["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"]);
export const Clock = make(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 6v6l4 2"]);
export const Users = make(["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]);
export const User = make(["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"]);
export const MapPin = make(["M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z", "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"]);
export const Phone = make([
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z",
]);
export const Mail = make(["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", "m22 6-10 7L2 6"]);
export const Message = make(["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"]);
export const Facebook = make(["M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"]);
export const Instagram = make(["M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z", "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z", "M17.5 6.5h.01"]);
export const Check = make(["M20 6 9 17l-5-5"]);
export const CheckCircle = make(["M22 11.08V12a10 10 0 1 1-5.93-9.14", "m9 11 3 3L22 4"]);
export const X = make(["M18 6 6 18", "m6 6 12 12"]);
export const Plus = make(["M12 5v14", "M5 12h14"]);
export const Minus = make(["M5 12h14"]);
export const Trash = make(["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]);
export const Search = make(["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "m21 21-4.3-4.3"]);
export const Star = make(["m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"], true);
export const Info = make(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 16v-4", "M12 8h.01"]);
export const Alert = make(["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z", "M12 9v4", "M12 17h.01"]);
export const Truck = make([
  "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
  "M15 18H9",
  "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14",
  "M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  "M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
]);
export const Menu = make(["M4 7h16", "M4 12h16", "M4 17h16"]);
export const Download = make(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"]);
export const Upload = make(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"]);
export const Printer = make(["M6 9V2h12v7", "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2", "M6 14h12v8H6z"]);
export const External = make(["M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"]);
export const Lock = make(["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z", "M7 11V7a5 5 0 0 1 10 0v4"]);
export const Copy = make(["M8 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2Z", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"]);
export const Refresh = make(["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", "M8 16H3v5"]);
export const Logout = make(["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]);
export const Sparkles = make([
  "M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0Z",
]);
export const Shield = make(["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z", "m9 12 2 2 4-4"]);
export const Image = make(["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z", "m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"]);
export const Camera = make(["M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z", "M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"]);
export const Send = make(["M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.94l7.93 3.18a2 2 0 0 1 1.11 1.11Z", "m21.85 2.15-10.94 10.94"]);
export const Chart = make(["M3 3v16a2 2 0 0 0 2 2h16", "M18 17V9", "M13 17V5", "M8 17v-3"]);
export const Tag = make(["M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42Z", "M7.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"]);
export const Pencil = make(["M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5Z", "m15 5 4 4"]);
export const Bell = make(["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"]);
export const Eye = make(["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"]);
export const Moon = make(["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"]);
export const Sun = make(["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"]);
export const Hourglass = make(["M5 22h14", "M5 2h14", "M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22", "M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"]);
export const Zap = make(["M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"]);
export const Wrench = make(["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"]);
export const Hammer = make([
  "m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9",
  "m18 15 4-4",
  "m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
]);
export const Ruler = make(["M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z", "m14.5 12.5 2-2", "m11.5 9.5 2-2", "m8.5 6.5 2-2", "m17.5 15.5 2-2"]);
export const Roller = make([
  "M4 2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z",
  "M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
  "M9 16h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z",
]);
export const Tiles = make([
  "M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z",
  "M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z",
  "M15 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z",
  "M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z",
]);
export const Bricks = make(["M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z", "M12 9v6", "M16 15v6", "M16 3v6", "M3 15h18", "M3 9h18", "M8 15v6", "M8 3v6"]);
export const Home = make(["M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"]);
export const Building = make(["M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z", "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2", "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2", "M10 6h4", "M10 10h4", "M10 14h4", "M10 18h4"]);
export const Calculator = make(["M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z", "M8 6h8", "M16 14v4", "M16 10h.01", "M12 10h.01", "M8 10h.01", "M12 14h.01", "M8 14h.01", "M12 18h.01", "M8 18h.01"]);
export const Award = make(["m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526", "M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"]);
export const Plug = make(["M12 22v-5", "M9 8V2", "M15 8V2", "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"]);
export const Car = make([
  "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
  "M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  "M9 17h6",
  "M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
]);
export const Bulb = make(["M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5", "M9 18h6", "M10 22h4"]);
export const Shower = make(["m4 4 2.5 2.5", "M13.5 6.5a4.95 4.95 0 0 0-7 7", "M15 5 5 15", "M14 17v.01", "M10 16v.01", "M13 13v.01", "M16 10v.01", "M11 20v.01", "M17 14v.01", "M20 11v.01"]);
export const Bath = make(["M10 4 8 6", "M17 19v2", "M2 12h20", "M7 19v2", "M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"]);
export const Flame = make(["M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"]);
export const Droplet = make(["M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"]);
export const Thermometer = make(["M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"]);
export const Waves = make([
  "M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
  "M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
  "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
]);
export const Layers = make([
  "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",
  "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",
  "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",
]);
export const Navigation = make(["M3 11 22 2 13 21 11 13 3 11z"]);
export const Siren = make([
  "M7 18v-6a5 5 0 1 1 10 0v6",
  "M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z",
  "M21 12h1",
  "M18.5 4.5 18 5",
  "M2 12h1",
  "M12 2v1",
  "m4.929 4.929.707.707",
  "M12 12v6",
]);
export const Kanban = make(["M5 3v14", "M12 3v8", "M19 3v18"]);
export const FileText = make(["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4", "M10 9H8", "M16 13H8", "M16 17H8"]);
export const Sliders = make(["M21 4h-7", "M10 4H3", "M21 12h-9", "M8 12H3", "M21 20h-5", "M12 20H3", "M14 2v4", "M8 10v4", "M16 18v4"]);
export const Gauge = make(["m12 14 4-4", "M3.34 19a10 10 0 1 1 17.32 0"]);
export const Grip = make(["M9 5h.01", "M9 12h.01", "M9 19h.01", "M15 5h.01", "M15 12h.01", "M15 19h.01"]);
export const ListChecks = make(["m3 17 2 2 4-4", "m3 7 2 2 4-4", "M13 6h8", "M13 12h8", "M13 18h8"]);
export const Door = make(["M13 4h3a2 2 0 0 1 2 2v14", "M2 20h3", "M13 20h9", "M10 12v.01", "M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"]);
export const Stairs = make(["M3 21h5v-5h5v-5h5V6h3", "M3 21V17"]);
export const Wardrobe = make(["M5 2h14a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z", "M12 2v19", "M9 10v2", "M15 10v2", "M6 21v1", "M18 21v1"]);
export const Kitchen = make(["M2 12h20", "M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8", "m4 8 16-4", "m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"]);
export const Fence = make([
  "M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z",
  "M6 8h4",
  "M6 18h4",
  "m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z",
  "M14 8h4",
  "M14 18h4",
  "m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z",
]);
export const Window = make(["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M12 3v18", "M3 12h18"]);
export const Euro = make(["M4 10h12", "M4 14h9", "M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"]);
export const Settings = make([
  "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
]);
export const Link = make(["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"]);

/** Icons referenced by name from the trade data files. */
export const ICONS = {
  zap: Zap,
  wrench: Wrench,
  hammer: Hammer,
  ruler: Ruler,
  roller: Roller,
  tiles: Tiles,
  bricks: Bricks,
  home: Home,
  building: Building,
  plug: Plug,
  car: Car,
  bulb: Bulb,
  shower: Shower,
  bath: Bath,
  flame: Flame,
  droplet: Droplet,
  thermometer: Thermometer,
  waves: Waves,
  layers: Layers,
  shield: Shield,
  gauge: Gauge,
  door: Door,
  stairs: Stairs,
  wardrobe: Wardrobe,
  kitchen: Kitchen,
  fence: Fence,
  window: Window,
  sun: Sun,
  alert: Alert,
  search: Search,
  clock: Clock,
  award: Award,
  calendar: Calendar,
  truck: Truck,
  sparkles: Sparkles,
  users: Users,
  euro: Euro,
  camera: Camera,
  listChecks: ListChecks,
} satisfies Record<string, IconComponent>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Component = ICONS[name];
  return <Component {...props} />;
}
