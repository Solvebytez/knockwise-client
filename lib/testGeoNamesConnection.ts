/**
 * Test GeoNames API Connection
 *
 * Use this to test and debug GeoNames API issues
 */

import { GEONAMES_CONFIG } from "./geoNamesConfig";

export async function testGeoNamesConnection() {
  const username = GEONAMES_CONFIG.USERNAME;
  const baseUrl = GEONAMES_CONFIG.BASE_URL;

  console.log("🔍 Testing GeoNames API Connection...");
  console.log(`Username: ${username}`);
  console.log(`Base URL: ${baseUrl}`);

  // Test 1: Simple search
  try {
    const testUrl = `${baseUrl}/searchJSON?name_startsWith=Toronto&country=CA&featureClass=P&maxRows=1&username=${username}`;
    console.log(`\n📡 Testing URL: ${testUrl}`);

    const response = await fetch(testUrl);
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(
      `Response Headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error Response:`, errorText);

      if (response.status === 401) {
        console.error(`\n🚨 AUTHENTICATION ERROR (401):`);
        console.error(`- Username "${username}" is invalid or not activated`);
        console.error(
          `- Please check your GeoNames account at: http://www.geonames.org/login`
        );
        console.error(`- Make sure your account is activated (check email)`);
        console.error(
          `- Try using a different username or create a new account`
        );
      }

      return false;
    }

    const data = await response.json();
    console.log(`✅ Success! Found ${data.geonames?.length || 0} results`);
    console.log(`Sample data:`, data.geonames?.[0]);

    return true;
  } catch (error) {
    console.error(`❌ Network Error:`, error);
    return false;
  }
}

// Test different usernames
export async function testMultipleUsernames() {
  const testUsernames = ["sahin05", "demo", "test"];

  for (const username of testUsernames) {
    console.log(`\n🧪 Testing username: ${username}`);

    try {
      const testUrl = `https://secure.geonames.org/searchJSON?name_startsWith=Toronto&country=CA&featureClass=P&maxRows=1&username=${username}`;
      const response = await fetch(testUrl);

      if (response.ok) {
        console.log(`✅ Username "${username}" works!`);
        return username;
      } else {
        console.log(`❌ Username "${username}" failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Username "${username}" error:`, error);
    }
  }

  return null;
}
