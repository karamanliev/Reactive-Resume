import type { LoaderFunction } from "react-router";

export type RootLoaderData = {
  resume: {
    id: string;
    title: string;
    data: {
      metadata: {
        page: {
          format: string;
        };
      };
    };
  } | null;
};

export const rootLoader: LoaderFunction<RootLoaderData> = async () => {
  try {
    const response = await fetch("/api/resume/root-data");

    if (!response.ok) {
      return { resume: null };
    }

    const data = await response.json();
    return data;
  } catch {
    // If there's an error fetching root data, return null to render default home page
    return { resume: null };
  }
};
