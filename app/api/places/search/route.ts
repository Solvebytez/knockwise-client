import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { communityName, municipalityName } = await request.json();

    if (!communityName) {
      return NextResponse.json(
        { error: "Community name is required" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not found" },
        { status: 500 }
      );
    }

    // Construct search query
    const query = municipalityName
      ? `${communityName}, ${municipalityName}, Ontario, Canada`
      : `${communityName}, Ontario, Canada`;

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );
    url.searchParams.append("query", query);
    url.searchParams.append("key", apiKey);
    url.searchParams.append(
      "fields",
      "place_id,name,geometry,types,formatted_address"
    );

    console.log(`Searching Google Places for: ${query}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`Google Places search response:`, {
      status: data.status,
      resultsCount: data.results?.length || 0,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
