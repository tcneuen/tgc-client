// Items are now managed server-side via React Query (src/hooks/useItems.ts).
// This file exports only the ListItem type alias for backward compatibility
// during the migration period.
import type { ApiItem } from "../types/api";

/** @deprecated Use ApiItem from ../types/api instead */
export type ListItem = ApiItem;
