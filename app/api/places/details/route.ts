import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json(
        { error: "Place ID is required" },
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

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.append("place_id", placeId);
    url.searchParams.append("key", apiKey);
    url.searchParams.append(
      "fields",
      "place_id,name,geometry,types,formatted_address,address_components"
    );

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.result) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    return NextResponse.json(data.result);
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json(
      { error: "Failed to get place details" },
      { status: 500 }
    );
  }
}
