import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EconoRank — Global Economic & Market Cap Rankings",
    short_name: "EconoRank",
    description:
      "Explore IMF WEO GDP, GDP per capita, PPP rankings, live global company market caps, and country comparisons in 78 languages.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F4EF",
    theme_color: "#0B6E5C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
