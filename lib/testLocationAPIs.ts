/**
 * Test utility for Location APIs
 *
 * Use this to test GeoNames and Overpass API connections
 */

import { locationService } from "./locationService";
import { geoNamesService } from "./geoNamesService";
import { overpassService } from "./overpassService";

export interface TestResult {
  service: string;
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export class LocationAPITester {
  private results: TestResult[] = [];

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.results = [];

    console.log("🧪 Starting Location API Tests...\n");

    // Test GeoNames API
    await this.testGeoNamesConnection();
    await this.testGeoNamesMunicipalitySearch();
    await this.testGeoNamesProvinceSearch();

    // Test Overpass API
    await this.testOverpassConnection();
    await this.testOverpassCommunities();
    await this.testOverpassMunicipalities();

    // Test Combined Service
    await this.testLocationServiceProvinces();
    await this.testLocationServiceCascading();

    this.printResults();
    return this.results;
  }

  /**
   * Test GeoNames API connection
   */
  private async testGeoNamesConnection(): Promise<void> {
    const start = Date.now();
    try {
      const success = await geoNamesService.testConnection();
      this.addResult(
        "GeoNames",
        "Connection Test",
        success,
        undefined,
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "GeoNames",
        "Connection Test",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Test GeoNames municipality search
   */
  private async testGeoNamesMunicipalitySearch(): Promise<void> {
    const start = Date.now();
    try {
      const results = await geoNamesService.searchMunicipalities("Toronto");
      const success = results.length > 0;
      this.addResult(
        "GeoNames",
        "Municipality Search",
        success,
        results.slice(0, 3),
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "GeoNames",
        "Municipality Search",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Test GeoNames province search
   */
  private async testGeoNamesProvinceSearch(): Promise<void> {
    const start = Date.now();
    try {
      const results = await geoNamesService.getMunicipalitiesByProvince(
        "Ontario"
      );
      const success = results.length > 0;
      this.addResult(
        "GeoNames",
        "Province Search",
        success,
        results.slice(0, 3),
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "GeoNames",
        "Province Search",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Test Overpass API connection
   */
  private async testOverpassConnection(): Promise<void> {
    const start = Date.now();
    try {
      const success = await overpassService.testConnection();
      this.addResult(
        "Overpass",
        "Connection Test",
        success,
        undefined,
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "Overpass",
        "Connection Test",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Test Overpass communities search
   */
  private async testOverpassCommunities(): Promise<void> {
    const start = Date.now();
    try {
      const results = await overpassService.getCommunitiesInMunicipality(
        "Toronto"
      );
      const success = results.length > 0;
      this.addResult(
        "Overpass",
        "Communities Search",
        success,
        results.slice(0, 3),
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "Overpass",
        "Communities Search",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Test Overpass municipalities search
   */
  private async testOverpassMunicipalities(): Promise<void> {
    const start = Date.now();
    try {
      const results = await overpassService.getMunicipalitiesInProvince(
        "Ontario"
      );
      const success = results.length > 0;
      this.addResult(
        "Overpass",
        "Municipalities Search",
        success,
        results.slice(0, 3),
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "Overpass",
        "Municipalities Search",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Test Location Service provinces
   */
  private async testLocationServiceProvinces(): Promise<void> {
    const start = Date.now();
    try {
      const results = locationService.getProvinces();
      const success = results.length > 0;
      this.addResult(
        "LocationService",
        "Provinces",
        success,
        results.slice(0, 5),
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "LocationService",
        "Provinces",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Test Location Service cascading search
   */
  private async testLocationServiceCascading(): Promise<void> {
    const start = Date.now();
    try {
      const results = await locationService.getCascadingResults(
        "Ontario",
        "Toronto"
      );
      const success =
        results.municipalities.length > 0 || results.communities.length > 0;
      this.addResult(
        "LocationService",
        "Cascading Search",
        success,
        {
          municipalities: results.municipalities.length,
          communities: results.communities.length,
        },
        undefined,
        Date.now() - start
      );
    } catch (error) {
      this.addResult(
        "LocationService",
        "Cascading Search",
        false,
        undefined,
        error as string,
        Date.now() - start
      );
    }
  }

  /**
   * Add test result
   */
  private addResult(
    service: string,
    test: string,
    success: boolean,
    data?: any,
    error?: string,
    duration: number = 0
  ): void {
    this.results.push({
      service,
      test,
      success,
      data,
      error,
      duration,
    });
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log("\n📊 Test Results Summary:");
    console.log("=".repeat(50));

    const grouped = this.results.reduce((acc, result) => {
      if (!acc[result.service]) {
        acc[result.service] = [];
      }
      acc[result.service].push(result);
      return acc;
    }, {} as Record<string, TestResult[]>);

    Object.entries(grouped).forEach(([service, tests]) => {
      console.log(`\n🔧 ${service}:`);
      tests.forEach((test) => {
        const status = test.success ? "✅" : "❌";
        const duration = `${test.duration}ms`;
        console.log(`  ${status} ${test.test} (${duration})`);

        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }

        if (test.data && test.success) {
          console.log(`    Data: ${JSON.stringify(test.data, null, 2)}`);
        }
      });
    });

    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log("\n📈 Overall Results:");
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} ✅`);
    console.log(`  Failed: ${failedTests} ❌`);
    console.log(
      `  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    );
  }
}

// Export test function
export async function testLocationAPIs(): Promise<TestResult[]> {
  const tester = new LocationAPITester();
  return await tester.runAllTests();
}
