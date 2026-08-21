import type { stamps, stampImages, stampTags } from "../../db/schema";

type StampRow = typeof stamps.$inferSelect;
type StampImageRow = typeof stampImages.$inferSelect;
type StampTagRow = typeof stampTags.$inferSelect;

export function toStampDTO(
  stamp: StampRow,
  images: StampImageRow[],
  tags: StampTagRow[],
) {
  return {
    id: stamp.id,
    title: stamp.title,
    description: stamp.description,
    country: stamp.country,
    era: stamp.era,
    issueYear: stamp.issueYear,
    issueYearEnd: stamp.issueYearEnd,
    sgNumber: stamp.sgNumber,
    condition: stamp.condition,
    grade: stamp.grade,
    pricePence: stamp.pricePence,
    quantity: stamp.quantity,
    status: stamp.status,
    images: images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        // Served back through our own /api/images/:key route rather than
        // assuming the R2 bucket is public.
        url: `/api/images/${img.r2Key}`,
        altText: img.altText,
        sortOrder: img.sortOrder,
      })),
    tags: tags.map((t) => t.tag),
  };
}
