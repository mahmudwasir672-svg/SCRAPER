
export interface PlaceResult {
  title: string;
  uri: string;
  summary?: string;
  reviewSnippets?: string[];
}

export interface SearchState {
  query: string;
  results: PlaceResult[];
  analysis: string;
  isLoading: boolean;
  error: string | null;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
}
