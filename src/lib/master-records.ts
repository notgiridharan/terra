export const MASTER_STATUSES = [
  "Current",
  "Under dispute",
  "Provisional",
  "Superseded",
] as const;

export type MasterStatus = (typeof MASTER_STATUSES)[number];

export type PreviousOwner = {
  name: string;
  from: string;
  to: string;
  note: string;
};

export type MasterTransaction = {
  date: string;
  type: string;
  from: string;
  to: string;
  area: string;
  instrument: string;
};

export type MasterMutation = {
  number: string;
  date: string;
  effect: string;
  order: string;
};

export type LinkedDocument = {
  title: string;
  kind: string;
  href?: string;
};

export type MasterParcel = {
  id: string;
  owner: string;
  surveyNumber: string;
  area: string;
  village: string;
  status: MasterStatus;
  lastUpdated: string;
  previousOwners: PreviousOwner[];
  transactions: MasterTransaction[];
  mutations: MasterMutation[];
  linkedDocuments: LinkedDocument[];
};

export const MASTER_PARCELS: MasterParcel[] = [
  {
    id: "mlr-142-3-remain",
    owner: "R. Venkatesan",
    surveyNumber: "142/3",
    area: "4.00 acres",
    village: "Sirkazhi",
    status: "Current",
    lastUpdated: "12 Aug 2026",
    previousOwners: [
      {
        name: "Late Ramasamy",
        from: "1962",
        to: "1984",
        note: "Settlement holder prior to A-Register entry.",
      },
      {
        name: "R. Venkatesan",
        from: "1984",
        to: "2009",
        note: "Held undivided 5.00 acres before the 1 acre sale.",
      },
    ],
    transactions: [
      {
        date: "1984",
        type: "Settlement",
        from: "Late Ramasamy",
        to: "R. Venkatesan",
        area: "5.00 acres",
        instrument: "A-Register 1984",
      },
      {
        date: "18 Mar 2009",
        type: "Sale",
        from: "R. Venkatesan",
        to: "K. Meenakshi",
        area: "1.00 acre",
        instrument: "Sale deed DOC/2009/2144",
      },
    ],
    mutations: [
      {
        number: "MUT/2009/118",
        date: "02 Apr 2009",
        effect: "Reduced parent holding from 5.00 to 4.00 acres",
        order: "Tahsildar, Sirkazhi",
      },
    ],
    linkedDocuments: [
      {
        title: "A-Register_Sirkazhi_1984.pdf",
        kind: "A-Register",
        href: "/structured-record",
      },
      {
        title: "Mutation_Khata_88.pdf",
        kind: "Mutation",
        href: "/reconciliation?doc=seed-mutation",
      },
      {
        title: "RoR_Block12_Sirkazhi.pdf",
        kind: "RoR",
        href: "/verification",
      },
    ],
  },
  {
    id: "mlr-142-3-sold",
    owner: "K. Meenakshi",
    surveyNumber: "142/3-B",
    area: "1.00 acre",
    village: "Sirkazhi",
    status: "Current",
    lastUpdated: "12 Aug 2026",
    previousOwners: [
      {
        name: "R. Venkatesan",
        from: "1984",
        to: "2009",
        note: "Seller of the 1 acre portion from the original 5 acre holding.",
      },
    ],
    transactions: [
      {
        date: "18 Mar 2009",
        type: "Sale",
        from: "R. Venkatesan",
        to: "K. Meenakshi",
        area: "1.00 acre",
        instrument: "Sale deed DOC/2009/2144",
      },
    ],
    mutations: [
      {
        number: "MUT/2009/118",
        date: "02 Apr 2009",
        effect: "Carved 1.00 acre in favour of K. Meenakshi",
        order: "Tahsildar, Sirkazhi",
      },
    ],
    linkedDocuments: [
      {
        title: "SaleDeed_Registration_2009.pdf",
        kind: "Sale Deed",
        href: "/reconciliation?doc=seed-deed",
      },
      {
        title: "Mutation_Khata_88.pdf",
        kind: "Mutation",
        href: "/reconciliation?doc=seed-mutation",
      },
    ],
  },
  {
    id: "mlr-142-parent-dup",
    owner: "R. Venkatesan",
    surveyNumber: "142/1",
    area: "5.00 acres",
    village: "Sirkazhi",
    status: "Under dispute",
    lastUpdated: "24 Aug 2026",
    previousOwners: [
      {
        name: "Late Ramasamy",
        from: "1962",
        to: "1984",
        note: "Settlement predecessor.",
      },
    ],
    transactions: [
      {
        date: "18 Mar 2009",
        type: "Sale (disputed posting)",
        from: "R. Venkatesan",
        to: "K. Meenakshi",
        area: "1.00 acre",
        instrument: "Sale deed on historical file; parent patta not cancelled",
      },
    ],
    mutations: [
      {
        number: "MUT/2009/118 (partial)",
        date: "02 Apr 2009",
        effect: "Child patta issued; parent 5.00 acre patta still live",
        order: "Duplicate booking — 6.00 acres on register",
      },
    ],
    linkedDocuments: [
      {
        title: "Patta_Survey_142.jpg",
        kind: "Patta",
        href: "/conflicts",
      },
      {
        title: "SaleDeed_Registration_2009.pdf",
        kind: "Sale Deed",
        href: "/reconciliation?doc=seed-deed",
      },
    ],
  },
  {
    id: "mlr-88-selvam",
    owner: "P. Selvam",
    surveyNumber: "88/2",
    area: "4.00 acres",
    village: "Sirkazhi",
    status: "Under dispute",
    lastUpdated: "20 Aug 2026",
    previousOwners: [
      {
        name: "R. Venkatesan",
        from: "1984",
        to: "2009",
        note: "Historical remainder owner after 1 acre sale.",
      },
    ],
    transactions: [
      {
        date: "2009",
        type: "Unexplained pattadar change",
        from: "R. Venkatesan",
        to: "P. Selvam",
        area: "4.00 acres",
        instrument: "No supporting deed on mock file",
      },
    ],
    mutations: [
      {
        number: "Not posted",
        date: "—",
        effect: "LRMS names P. Selvam; historical chain does not",
        order: "Ownership mismatch",
      },
    ],
    linkedDocuments: [
      {
        title: "FMB_Village_Map_Ward3.tif",
        kind: "FMB / GIS",
        href: "/conflicts",
      },
    ],
  },
  {
    id: "mlr-nallur-12",
    owner: "M. Lakshmi",
    surveyNumber: "12/1",
    area: "2.40 acres",
    village: "Nallur",
    status: "Current",
    lastUpdated: "03 Jun 2026",
    previousOwners: [
      {
        name: "S. Rajendran",
        from: "1991",
        to: "2014",
        note: "Gift settlement to daughter.",
      },
    ],
    transactions: [
      {
        date: "11 Jan 2014",
        type: "Gift",
        from: "S. Rajendran",
        to: "M. Lakshmi",
        area: "2.40 acres",
        instrument: "Gift deed DOC/2014/088",
      },
    ],
    mutations: [
      {
        number: "MUT/2014/044",
        date: "28 Jan 2014",
        effect: "Name change to M. Lakshmi",
        order: "Tahsildar, Sirkazhi",
      },
    ],
    linkedDocuments: [
      { title: "Chitta_Extract_2011.png", kind: "Chitta", href: "/structured-record" },
    ],
  },
  {
    id: "mlr-puthur-prov",
    owner: "S. Rajendran",
    surveyNumber: "201/4",
    area: "0.80 acre",
    village: "Puthur",
    status: "Provisional",
    lastUpdated: "22 Aug 2026",
    previousOwners: [
      {
        name: "Unknown (illegible settlement line)",
        from: "—",
        to: "2026",
        note: "Awaiting officer verification of old settlement register.",
      },
    ],
    transactions: [],
    mutations: [],
    linkedDocuments: [
      {
        title: "Old settlement register (queued)",
        kind: "Settlement",
        href: "/documents",
      },
    ],
  },
  {
    id: "mlr-agaram-super",
    owner: "K. Meenakshi",
    surveyNumber: "55/2",
    area: "1.10 acres",
    village: "Agaram",
    status: "Superseded",
    lastUpdated: "09 Jan 2021",
    previousOwners: [
      {
        name: "K. Meenakshi",
        from: "2003",
        to: "2021",
        note: "Holding merged into a later subdivision.",
      },
    ],
    transactions: [
      {
        date: "09 Jan 2021",
        type: "Subdivision merge",
        from: "K. Meenakshi",
        to: "K. Meenakshi",
        area: "1.10 acres",
        instrument: "Subdivision order SUB/2021/09",
      },
    ],
    mutations: [
      {
        number: "MUT/2021/009",
        date: "09 Jan 2021",
        effect: "Parcel superseded by 55/2A",
        order: "Survey / settlement wing",
      },
    ],
    linkedDocuments: [
      { title: "Subdivision order SUB/2021/09", kind: "Subdivision" },
    ],
  },
];

export function searchMasterParcels(
  query: string,
  status: MasterStatus | "all",
): MasterParcel[] {
  const q = query.trim().toLowerCase();
  return MASTER_PARCELS.filter((parcel) => {
    if (status !== "all" && parcel.status !== status) return false;
    if (!q) return true;
    return (
      parcel.owner.toLowerCase().includes(q) ||
      parcel.surveyNumber.toLowerCase().includes(q) ||
      parcel.village.toLowerCase().includes(q) ||
      parcel.area.toLowerCase().includes(q) ||
      parcel.status.toLowerCase().includes(q)
    );
  });
}
