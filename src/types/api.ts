export interface ApiList {
  id: string;
  name: string;
  protected: boolean;
  backgroundColor: string | null;
  startingRating: number | null;
  collectionId: string;
}

export interface ApiCollection {
  id: string;
  name: string;
  defaultListId: string | null;
  userId: number;
  lists: ApiList[];
}

export interface ApiItem {
  id: number;
  name: string;
  description: string;
  rating: number | null;
  collectionId: string;
  listId: string;
}
