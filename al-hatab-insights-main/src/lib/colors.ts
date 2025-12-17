// Chart color palette - standardized colors for consistent visualization
export const chartColors = {
  steelBlue: "#1F77B4",
  orange: "#FF7F0E",
  mediumGreen: "#2CA02C",
  crimsonRed: "#D62728",
  amethystPurple: "#9467BD",
  saddleBrown: "#8C564B",
  orchidPink: "#E377C2",
  gray: "#7F7F7F",
  cyanBlue: "#17BECF",
} as const;

// Array format for easy iteration
export const chartColorArray = Object.values(chartColors);

