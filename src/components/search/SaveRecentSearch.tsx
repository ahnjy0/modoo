"use client";

import { useEffect } from "react";
import { addRecentSearch } from "@/lib/recentSearches";

export default function SaveRecentSearch({ query }: { query: string }) {
  useEffect(() => {
    if (query) addRecentSearch(query);
  }, [query]);

  return null;
}
