import { MASTER_PARCELS, type MasterParcel } from "@/lib/master-records";

export type GisConflict = {
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  detail: string;
};

export type MapShape = {
  parcelId: string;
  points: string;
  labelX: number;
  labelY: number;
};

export type GisParcel = MasterParcel & {
  points: string;
  labelX: number;
  labelY: number;
  conflicts: GisConflict[];
  hasConflict: boolean;
};

/** Schematic cadastral sheet (viewBox 0 0 900 640). Not real coordinates. */
export const MAP_SHAPES: MapShape[] = [
  {
    parcelId: "mlr-142-parent-dup",
    points: "48,36 668,48 652,168 62,178",
    labelX: 355,
    labelY: 98,
  },
  {
    parcelId: "mlr-142-3-remain",
    points: "58,198 412,184 428,368 72,382",
    labelX: 230,
    labelY: 278,
  },
  {
    parcelId: "mlr-142-3-sold",
    points: "422,184 662,196 674,348 434,366",
    labelX: 548,
    labelY: 268,
  },
  {
    parcelId: "mlr-88-selvam",
    points: "64,402 670,392 682,518 78,532",
    labelX: 370,
    labelY: 458,
  },
  {
    parcelId: "mlr-nallur-12",
    points: "58,552 278,546 286,628 64,632",
    labelX: 168,
    labelY: 590,
  },
  {
    parcelId: "mlr-puthur-prov",
    points: "300,548 518,542 528,626 308,630",
    labelX: 412,
    labelY: 588,
  },
  {
    parcelId: "mlr-agaram-super",
    points: "542,544 778,538 792,622 552,628",
    labelX: 665,
    labelY: 584,
  },
];

export const GIS_CONFLICTS: Record<string, GisConflict[]> = {
  "mlr-142-3-remain": [
    {
      type: "GIS mismatch",
      severity: "High",
      detail:
        "Cadastral sheet still draws the pre-sale 5.00 acre outline over the 4.00 acre remainder.",
    },
    {
      type: "Missing transaction",
      severity: "Critical",
      detail: "LRMS has not posted the 1.00 acre sale; government extent remains 5.00 acres.",
    },
  ],
  "mlr-142-parent-dup": [
    {
      type: "Duplicate record",
      severity: "Critical",
      detail: "Parent patta 142/1 still books 5.00 acres after 142/3 and 142/3-B were carved.",
    },
    {
      type: "GIS mismatch",
      severity: "High",
      detail: "Overlapping polygon on the mock FMB sheet covers both child holdings.",
    },
  ],
  "mlr-88-selvam": [
    {
      type: "Ownership mismatch",
      severity: "Critical",
      detail: "GIS / LRMS names P. Selvam; historical remainder chain is R. Venkatesan.",
    },
    {
      type: "GIS mismatch",
      severity: "Medium",
      detail: "Boundary coincides with 142/3 remainder on the field measurement book.",
    },
  ],
};

export function listGisParcels(): GisParcel[] {
  return MAP_SHAPES.map((shape) => {
    const master = MASTER_PARCELS.find((item) => item.id === shape.parcelId);
    if (!master) {
      throw new Error(`Missing master parcel ${shape.parcelId}`);
    }
    const conflicts = GIS_CONFLICTS[shape.parcelId] ?? [];
    return {
      ...master,
      points: shape.points,
      labelX: shape.labelX,
      labelY: shape.labelY,
      conflicts,
      hasConflict: conflicts.length > 0,
    };
  });
}
