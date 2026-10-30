// Public occasion contract. Wedding alone uses the extended wedding gift window.
export const occasionChoices = [
  ["Baby shower", "Baby showers"],
  ["Wedding", "Weddings"],
  ["Engagement party", "Engagement parties"],
  ["Baptism", "Baptisms"],
  ["Sweet 16", "Sweet 16s"],
  ["Quinceañera", "Quinceañeras"],
  ["Graduation", "Graduations"],
  ["Birthday", "Birthdays"],
  ["Bar Mitzvah", "Bar Mitzvahs"],
  ["Gender reveal party", "Gender reveal parties"],
  ["First Communion / Confirmation", "First Communions / Confirmations"],
  ["Prom / Pre-prom party", "Proms"],
  ["Bridal shower", "Bridal showers"],
  ["Bachelor / Bachelorette party", "Bachelor and bachelorette parties"],
  ["Housewarming", "Housewarming parties"],
  ["Retirement", "Retirement parties"],
  ["Wake / Celebration of Life", "Wakes / Celebrations of Life"],
] as const;
export const eventTypes: string[] = [
  ...new Set([
    ...occasionChoices.map(([value]) => value),
    "Anniversary",
    "Other dated event",
    "One-off occasion",
    "Sip and see",
    "Debutante ball / Cotillion",
    "College Decision Day",
    "Rehearsal dinner",
    "Career promotion / Professional graduation",
    "Bat Mitzvah",
  ]),
];
