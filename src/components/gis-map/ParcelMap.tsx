"use client";

import type { GisParcel } from "@/lib/gis-map";

type Props = {
  parcels: GisParcel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ParcelMap({ parcels, selectedId, onSelect }: Props) {
  return (
    <svg
      viewBox="0 0 900 660"
      className="h-auto w-full bg-[#070b13]"
      role="img"
      aria-label="Mock cadastral parcel map, Sirkazhi block"
    >
      <defs>
        <pattern
          id="gis-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#1c2738"
            strokeWidth="1"
          />
        </pattern>
        <pattern
          id="gis-hatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="#f87171" strokeWidth="1.4" />
        </pattern>
      </defs>

      <rect width="900" height="660" fill="url(#gis-grid)" />

      <path
        d="M 20 188 C 200 172, 480 204, 880 176"
        fill="none"
        stroke="#1c2738"
        strokeWidth="10"
      />
      <path
        d="M 20 188 C 200 172, 480 204, 880 176"
        fill="none"
        stroke="#c4a35a"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <text
        x="780"
        y="168"
        fill="#8b97ab"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        Village road
      </text>

      <path
        d="M 820 20 C 790 180, 810 360, 760 640"
        fill="none"
        stroke="#1d4ed8"
        strokeOpacity="0.35"
        strokeWidth="6"
      />
      <text
        x="768"
        y="40"
        fill="#8b97ab"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        Channel
      </text>

      {parcels.map((parcel) => {
        const selected = parcel.id === selectedId;
        const fill = parcel.hasConflict
          ? selected
            ? "rgba(248,113,113,0.28)"
            : "rgba(248,113,113,0.14)"
          : selected
            ? "rgba(196,163,90,0.28)"
            : "rgba(196,163,90,0.1)";
        const stroke = selected
          ? "#c4a35a"
          : parcel.hasConflict
            ? "#f87171"
            : "#c4a35a";

        return (
          <g key={parcel.id}>
            <polygon
              points={parcel.points}
              fill={fill}
              stroke={stroke}
              strokeWidth={selected ? 2.6 : 1.4}
              strokeDasharray={parcel.hasConflict ? "5 3" : undefined}
              className="cursor-pointer"
              onClick={() => onSelect(parcel.id)}
            />
            {parcel.hasConflict ? (
              <polygon
                points={parcel.points}
                fill="url(#gis-hatch)"
                fillOpacity={0.35}
                className="pointer-events-none"
              />
            ) : null}
            <text
              x={parcel.labelX}
              y={parcel.labelY}
              textAnchor="middle"
              fill="#e6edf7"
              fontSize="12"
              fontFamily="system-ui, sans-serif"
              className="pointer-events-none"
            >
              {parcel.surveyNumber}
            </text>
            {parcel.hasConflict ? (
              <text
                x={parcel.labelX}
                y={parcel.labelY + 16}
                textAnchor="middle"
                fill="#fca5a5"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
                className="pointer-events-none"
              >
                CONFLICT
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
